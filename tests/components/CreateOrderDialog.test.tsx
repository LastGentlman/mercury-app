import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateOrderDialog } from '../../src/components/CreateOrderDialog.tsx'

// Mock dependencies
const mockCreateOrder = vi.fn()
const mockProducts = [
  {
    id: 1,
    name: 'Tacos al Pastor',
    price: 45,
    stock: 20,
    isActive: true,
    businessId: 'test-business-id'
  },
  {
    id: 2,
    name: 'Coca Cola',
    price: 25,
    stock: 50,
    isActive: true,
    businessId: 'test-business-id'
  },
  {
    id: 3,
    name: 'Pizza Margherita',
    price: 150,
    stock: 0, // Out of stock
    isActive: true,
    businessId: 'test-business-id'
  }
]

vi.mock('../../src/hooks/useProducts.ts', () => ({
  useProducts: () => ({
    data: mockProducts,
    isLoading: false,
    error: null,
    createProductWithCategory: {
      mutate: mockCreateOrder,
      isLoading: false,
      error: null
    }
  })
}))

vi.mock('../../src/hooks/useOrders.ts', () => ({
  useOrders: () => ({
    createMutation: {
      mutate: mockCreateOrder,
      isLoading: false,
      error: null
    }
  })
}))

const mockToast = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: mockToast,
    error: mockToast
  }
}))

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('CreateOrderDialog', () => {
  const user = userEvent.default.setup()
  const mockOnOpenChange = vi.fn()
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    businessId: 'test-business-id'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when open', () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} open onOpenChange={() => {}} />
        </TestWrapper>
      )

      expect(screen.getByText(/crear nuevo pedido/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nombre del cliente/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/fecha de entrega/i)).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} open={false} />
        </TestWrapper>
      )

      expect(screen.queryByText(/crear nuevo pedido/i)).not.toBeInTheDocument()
    })

    it('should show loading state when creating order', () => {
      vi.mocked(require('../../src/hooks/useOrders.ts').useOrders).mockReturnValueOnce({
        createMutation: {
          mutate: mockCreateOrder,
          isLoading: true,
          error: null
        }
      })

      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/nombre del cliente es requerido/i)).toBeInTheDocument()
        expect(screen.getByText(/fecha de entrega es requerida/i)).toBeInTheDocument()
      })

      expect(mockCreateOrder).not.toHaveBeenCalled()
    })

    it('should validate phone number format', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const phoneInput = screen.getByLabelText(/teléfono/i)
      await user.type(phoneInput, '123') // Invalid phone

      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/formato de teléfono inválido/i)).toBeInTheDocument()
      })
    })

    it('should validate delivery date is not in the past', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const dateInput = screen.getByLabelText(/fecha de entrega/i)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      await user.type(dateInput, yesterday.toISOString().split('T')[0]!)

      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/la fecha debe ser futura/i)).toBeInTheDocument()
      })
    })

    it('should validate that at least one item is added', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const clientInput = screen.getByLabelText(/nombre del cliente/i)
      await user.type(clientInput, 'Test Client')

      const dateInput = screen.getByLabelText(/fecha de entrega/i)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0]!)

      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/debe agregar al menos un producto/i)).toBeInTheDocument()
      })
    })
  })

  describe('Product Management', () => {
    it('should add products to order', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const addItemButton = screen.getByRole('button', { name: /agregar producto/i })
      await user.click(addItemButton)

      const productSelect = screen.getByLabelText(/producto/i)
      await user.selectOptions(productSelect, '1') // Tacos al Pastor

      const quantityInput = screen.getByLabelText(/cantidad/i)
      await user.type(quantityInput, '2')

      // Verify subtotal calculation
      await waitFor(() => {
        expect(screen.getByText('$90.00')).toBeInTheDocument() // 2 * 45
      })
    })

    it('should remove products from order', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      // Add a product first
      const addItemButton = screen.getByRole('button', { name: /agregar producto/i })
      await user.click(addItemButton)

      const productSelect = screen.getByLabelText(/producto/i)
      await user.selectOptions(productSelect, '1')

      // Remove the product
      const removeButton = screen.getByRole('button', { name: /eliminar/i })
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Tacos al Pastor')).not.toBeInTheDocument()
      })
    })

    it('should calculate total correctly with multiple items', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      // Add first item
      const addItemButton = screen.getByRole('button', { name: /agregar producto/i })
      await user.click(addItemButton)

      const productSelects = screen.getAllByLabelText(/producto/i)
      const quantityInputs = screen.getAllByLabelText(/cantidad/i)

      await user.selectOptions(productSelects[0]!, '1') // Tacos - $45
      await user.type(quantityInputs[0]!, '2')

      // Add second item
      await user.click(addItemButton)

      await user.selectOptions(productSelects[1]!, '2') // Coca Cola - $25
      await user.type(quantityInputs[1]!, '3')

      // Verify total: (45 * 2) + (25 * 3) = 90 + 75 = 165
      await waitFor(() => {
        expect(screen.getByText('Total: $165.00')).toBeInTheDocument()
      })
    })

    it('should prevent adding out-of-stock products', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const addItemButton = screen.getByRole('button', { name: /agregar producto/i })
      await user.click(addItemButton)

      const productSelect = screen.getByLabelText(/producto/i)
      
      // Pizza Margherita should be disabled (stock: 0)
      const pizzaOption = productSelect.querySelector('option[value="3"]')
      expect(pizzaOption).toBeDisabled()
    })

    it('should validate quantity against available stock', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const addItemButton = screen.getByRole('button', { name: /agregar producto/i })
      await user.click(addItemButton)

      const productSelect = screen.getByLabelText(/producto/i)
      await user.selectOptions(productSelect, '1') // Tacos (stock: 20)

      const quantityInput = screen.getByLabelText(/cantidad/i)
      await user.type(quantityInput, '25') // More than available stock

      await waitFor(() => {
        expect(screen.getByText(/cantidad no disponible en stock/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should create order successfully with valid data', async () => {
      mockCreateOrder.mockResolvedValueOnce({ id: 'new-order-id' })

      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      // Fill required fields
      const clientInput = screen.getByLabelText(/nombre del cliente/i)
      await user.type(clientInput, 'María González')

      const phoneInput = screen.getByLabelText(/teléfono/i)
      await user.type(phoneInput, '+52 555 123 4567')

      const dateInput = screen.getByLabelText(/fecha de entrega/i)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0]!)

      const timeInput = screen.getByLabelText(/hora de entrega/i)
      await user.type(timeInput, '14:30')

      const notesInput = screen.getByLabelText(/notas/i)
      await user.type(notesInput, 'Sin cebolla')

      // Add products
      const addItemButton = screen.getByRole('button', { name: /agregar producto/i })
      await user.click(addItemButton)

      const productSelect = screen.getByLabelText(/producto/i)
      await user.selectOptions(productSelect, '1')

      const quantityInput = screen.getByLabelText(/cantidad/i)
      await user.type(quantityInput, '2')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateOrder).toHaveBeenCalledWith({
          client_name: 'María González',
          client_phone: '+52 555 123 4567',
          delivery_date: tomorrow.toISOString().split('T')[0],
          delivery_time: '14:30',
          notes: 'Sin cebolla',
          items: [
            {
              product_name: 'Tacos al Pastor',
              quantity: 2,
              unit_price: 45,
              subtotal: 90
            }
          ]
        })
      })

      expect(mockOnOpenChange).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith('Pedido creado exitosamente')
    })

    it('should handle creation errors', async () => {
      const errorMessage = 'Error al crear pedido'
      mockCreateOrder.mockRejectedValueOnce(new Error(errorMessage))

      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      // Fill minimal valid form
      const clientInput = screen.getByLabelText(/nombre del cliente/i)
      await user.type(clientInput, 'Test Client')

      const dateInput = screen.getByLabelText(/fecha de entrega/i)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0]!)

      // Add product
      const addItemButton = screen.getByRole('button', { name: /agregar producto/i })
      await user.click(addItemButton)

      const productSelect = screen.getByLabelText(/producto/i)
      await user.selectOptions(productSelect, '1')

      const quantityInput = screen.getByLabelText(/cantidad/i)
      await user.type(quantityInput, '1')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(errorMessage)
      })

      // Dialog should remain open
      expect(mockOnOpenChange).not.toHaveBeenCalled()
    })
  })

  describe('User Experience', () => {
    it('should close dialog when cancel button is clicked', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalled()
    })

    it('should close dialog when clicking outside (ESC key)', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      await user.keyboard('{Escape}')

      expect(mockOnOpenChange).toHaveBeenCalled()
    })

    it('should reset form when dialog is reopened', async () => {
      const { rerender } = render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      // Fill some data
      const clientInput = screen.getByLabelText(/nombre del cliente/i)
      await user.type(clientInput, 'Test Client')

      // Close dialog
      rerender(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} open={false} />
        </TestWrapper>
      )

      // Reopen dialog
      rerender(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} open />
        </TestWrapper>
      )

      // Form should be reset
      const newClientInput = screen.getByLabelText(/nombre del cliente/i)
      expect(newClientInput).toHaveValue('')
    })

    it('should auto-focus client name input when opened', () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const clientInput = screen.getByLabelText(/nombre del cliente/i)
      expect(clientInput).toHaveFocus()
    })

    it('should disable submit button while loading', () => {
      vi.mocked(require('../../src/hooks/useOrders.ts').useOrders).mockReturnValueOnce({
        createMutation: {
          mutate: mockCreateOrder,
          isLoading: true,
          error: null
        }
      })

      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
      expect(screen.getByLabelText(/nombre del cliente/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/fecha de entrega/i)).toHaveAttribute('aria-required', 'true')
    })

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const clientInput = screen.getByLabelText(/nombre del cliente/i)
      const phoneInput = screen.getByLabelText(/teléfono/i)
      const dateInput = screen.getByLabelText(/fecha de entrega/i)

      // Tab navigation should work
      expect(clientInput).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(phoneInput).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(dateInput).toHaveFocus()
    })

    it('should announce validation errors to screen readers', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog {...defaultProps} />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /crear pedido/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText(/nombre del cliente es requerido/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })
  })
}) 
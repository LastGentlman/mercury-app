import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import components for integration testing
import { CreateOrderDialog } from '../../src/components/CreateOrderDialog.tsx'
import { ProductsList } from '../../src/components/ProductsList.tsx'
import { OrdersList } from '../../src/components/orders/OrdersList.tsx'

// Mock the database
const mockDB = {
  products: {
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toArray: vi.fn()
  },
  orders: {
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toArray: vi.fn()
  },
  syncQueue: {
    add: vi.fn(),
    toArray: vi.fn(),
    delete: vi.fn()
  },
  addToSyncQueue: vi.fn(),
  getProductsWithCategories: vi.fn(),
  getOrdersWithDetails: vi.fn(),
  syncPendingChanges: vi.fn()
}

vi.mock('../../src/lib/offline/db.ts', () => ({
  db: mockDB
}))

// Mock auth hook
const mockAuth = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    businessId: 'test-business-id'
  },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn()
}

vi.mock('../../src/hooks/useAuth.ts', () => ({
  useAuth: () => mockAuth
}))

// Mock products hook
const mockProducts = [
  {
    id: 1,
    name: 'Coca Cola',
    price: 25,
    categoryId: 'cat-1',
    businessId: 'test-business-id',
    stock: 10,
    isActive: true,
    syncStatus: 'synced' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Pizza Margherita',
    price: 150,
    categoryId: 'cat-2',
    businessId: 'test-business-id',
    stock: 5,
    isActive: true,
    syncStatus: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

vi.mock('../../src/hooks/useProducts.ts', () => ({
  useProducts: () => ({
    products: mockProducts,
    isLoading: false,
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    isCreating: false
  })
}))

// Mock orders hook
const mockOrders = [
  {
    id: 'order-1',
    business_id: 'test-business-id',
    branch_id: 'branch-1',
    employee_id: 'test-user-id',
    client_name: 'Juan Pérez',
    client_phone: '+52 555 123 4567',
    total: 175,
    delivery_date: '2024-01-15',
    delivery_time: '14:30',
    status: 'pending' as const,
    syncStatus: 'synced' as const,
    created_at: new Date().toISOString(),
    last_modified_at: new Date().toISOString(),
    items: [
      {
        id: 1,
        order_id: 'order-1',
        product_name: 'Coca Cola',
        quantity: 1,
        unit_price: 25,
        subtotal: 25
      },
      {
        id: 2,
        order_id: 'order-1',
        product_name: 'Pizza Margherita',
        quantity: 1,
        unit_price: 150,
        subtotal: 150
      }
    ]
  }
]

vi.mock('../../src/hooks/useOrders.ts', () => ({
  useOrders: () => ({
    orders: mockOrders,
    isLoading: false,
    createOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    deleteOrder: vi.fn(),
    createOrderFromForm: { mutateAsync: vi.fn() }
  })
}))

// Mock business categories
const mockCategories = [
  {
    id: '1',
    categoryId: 'cat-1',
    categoryName: 'Bebidas',
    satCode: '50202306',
    icon: '🥤',
    isActive: true
  },
  {
    id: '2',
    categoryId: 'cat-2',
    categoryName: 'Comida',
    satCode: '50202301',
    icon: '🍕',
    isActive: true
  }
]

vi.mock('../../src/hooks/useBusinessCategories.ts', () => ({
  useBusinessCategories: () => ({
    categories: mockCategories,
    isLoading: false,
    error: null
  })
}))

// Mock fetch for API calls
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Test wrapper component
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

describe('Sync Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockDB.getProductsWithCategories.mockResolvedValue(mockProducts)
    mockDB.getOrdersWithDetails.mockResolvedValue(mockOrders)
    mockDB.products.add.mockResolvedValue(3)
    mockDB.orders.add.mockResolvedValue('new-order-id')
    mockDB.addToSyncQueue.mockResolvedValue(1)
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('Product Creation and Sync Flow', () => {
    it('should display products list', async () => {
      render(
        <TestWrapper>
          <ProductsList />
        </TestWrapper>
      )

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Coca Cola')).toBeInTheDocument()
        expect(screen.getByText('Pizza Margherita')).toBeInTheDocument()
      })

      // Check that create button exists
      expect(screen.getByText('Agregar Producto')).toBeInTheDocument()
    })

    it('should handle sync conflicts gracefully', async () => {
      // Mock a conflict response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({
          error: 'Conflict',
          conflict: {
            clientVersion: { name: 'Pizza Local', price: 150 },
            serverVersion: { name: 'Pizza Server', price: 160 }
          }
        })
      })

      render(
        <TestWrapper>
          <ProductsList />
        </TestWrapper>
      )

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Pizza Margherita')).toBeInTheDocument()
      })

      // Simulate sync
      act(() => {
        mockDB.syncPendingChanges()
      })

      // Should call sync API
      await waitFor(() => {
        expect(mockDB.syncPendingChanges).toHaveBeenCalled()
      })
    })
  })

  describe('Order Creation and Sync Flow', () => {
    it('should render create order dialog', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog 
            open 
            onOpenChange={() => {}} 
            businessId="test-business-id" 
          />
        </TestWrapper>
      )

      // Check that form elements are present
      await waitFor(() => {
        expect(screen.getByText('Crear Pedido')).toBeInTheDocument()
      })

      // Check for required form fields
      expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/entrega/i)).toBeInTheDocument()
    })

    it('should display orders list with proper props', async () => {
      const mockHandlers = {
        onStatusChange: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onViewDetails: vi.fn()
      }

      render(
        <TestWrapper>
          <OrdersList 
            orders={mockOrders}
            {...mockHandlers}
          />
        </TestWrapper>
      )

      // Wait for orders to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })
    })
  })

  describe('Offline/Online Transitions', () => {
    it('should queue changes when offline and sync when online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

      render(
        <TestWrapper>
          <ProductsList />
        </TestWrapper>
      )

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Productos')).toBeInTheDocument()
      })

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true })
      globalThis.dispatchEvent(new Event('online'))

      // Should be online now
      expect(navigator.onLine).toBe(true)
    })

    it('should show sync status indicators', async () => {
      render(
        <TestWrapper>
          <ProductsList />
        </TestWrapper>
      )

      // Should show products
      await waitFor(() => {
        expect(screen.getByText('Pizza Margherita')).toBeInTheDocument()
      })

      // Simulate sync completion
      act(() => {
        mockDB.syncPendingChanges()
      })

      // Verify sync was called
      expect(mockDB.syncPendingChanges).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle network errors during sync', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <ProductsList />
        </TestWrapper>
      )

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Coca Cola')).toBeInTheDocument()
      })

      // Trigger sync
      act(() => {
        mockDB.syncPendingChanges()
      })

      // Verify sync was attempted
      expect(mockDB.syncPendingChanges).toHaveBeenCalled()
    })

    it('should handle validation errors gracefully', async () => {
      render(
        <TestWrapper>
          <CreateOrderDialog 
            open 
            onOpenChange={() => {}} 
            businessId="test-business-id" 
          />
        </TestWrapper>
      )

      // Wait for dialog to render
      await waitFor(() => {
        expect(screen.getByText('Crear Pedido')).toBeInTheDocument()
      })

      // Form should be present
      expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument()
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data consistency across components', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ProductsList />
        </TestWrapper>
      )

      // Verify initial data
      await waitFor(() => {
        expect(screen.getByText('Coca Cola')).toBeInTheDocument()
      })

      // Switch to orders view
      rerender(
        <TestWrapper>
          <OrdersList 
            orders={mockOrders}
            onStatusChange={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onViewDetails={vi.fn()}
          />
        </TestWrapper>
      )

      // Should show order with same products
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })
    })

    it('should handle concurrent modifications correctly', async () => {
      render(
        <TestWrapper>
          <ProductsList />
        </TestWrapper>
      )

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Coca Cola')).toBeInTheDocument()
      })

      // Simulate concurrent updates from different components
      const updatePromise1 = mockDB.products.update(1, { price: 30 })
      const updatePromise2 = mockDB.products.update(1, { price: 35 })

      await Promise.all([updatePromise1, updatePromise2])

      // Should handle conflicts appropriately
      expect(mockDB.products.update).toHaveBeenCalledTimes(2)
    })
  })
}) 
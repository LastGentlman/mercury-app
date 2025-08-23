/**
 * Profile Page Component Tests
 * 
 * Tests the profile page functionality including:
 * - Component rendering
 * - Form interactions
 * - Avatar upload
 * - Settings management
 * - Navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Route as ProfileRoute } from '../../src/routes/profile.tsx'

// Mock the auth hook
vi.mock('../../src/hooks/useAuth.ts', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'owner',
      avatar_url: null
    },
    logout: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false
    }
  })
}))

// Mock the profile hook
vi.mock('../../src/hooks/useProfile.ts', () => ({
  useProfile: () => ({
    profile: {
      id: 'test-user-id',
      fullName: 'Test User',
      phone: '+34 666 777 888',
      avatar_url: null,
      role: 'owner',
      settings: {
        notifications: true,
        darkMode: false,
        language: 'es',
        privacyMode: false
      }
    },
    stats: {
      ordersToday: 47,
      satisfaction: 98,
      totalOrders: 1247,
      averageOrderValue: 89.50
    },
    updateProfile: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false
    },
    uploadAvatar: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false
    },
    isUpdating: false
  })
}))

// Mock the ProtectedRoute component
vi.mock('../../src/components/ProtectedRoute.tsx', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('ProfilePage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  const renderProfilePage = () => {
    const router = createRouter({
      routeTree: ProfileRoute,
      context: { queryClient }
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )
  }

  it('renders profile page with user information', () => {
    renderProfilePage()

    expect(screen.getByText('Perfil')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
  })

  it('displays profile statistics', () => {
    renderProfilePage()

    expect(screen.getByText('47')).toBeInTheDocument()
    expect(screen.getByText('98%')).toBeInTheDocument()
    expect(screen.getByText('Pedidos hoy')).toBeInTheDocument()
    expect(screen.getByText('Satisfacción')).toBeInTheDocument()
  })

  it('shows form fields with user data', () => {
    renderProfilePage()

    const nameInput = screen.getByDisplayValue('Test User')
    const phoneInput = screen.getByDisplayValue('+34 666 777 888')
    const emailInput = screen.getByDisplayValue('test@example.com')

    expect(nameInput).toBeInTheDocument()
    expect(phoneInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toBeDisabled()
  })

  it('handles form input changes', () => {
    renderProfilePage()

    const nameInput = screen.getByDisplayValue('Test User')
    const phoneInput = screen.getByDisplayValue('+34 666 777 888')

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })
    fireEvent.change(phoneInput, { target: { value: '+34 999 888 777' } })

    expect(nameInput).toHaveValue('Updated Name')
    expect(phoneInput).toHaveValue('+34 999 888 777')
  })

  it('shows save button with dirty state indicator', () => {
    renderProfilePage()

    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    const saveButton = screen.getByText('Guardar cambios *')
    expect(saveButton).toBeInTheDocument()
  })

  it('opens settings dialog when settings button is clicked', () => {
    renderProfilePage()

    const settingsButton = screen.getByRole('button', { name: /configuración/i })
    fireEvent.click(settingsButton)

    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText('Personaliza tu experiencia en PedidoList')).toBeInTheDocument()
  })

  it('opens logout confirmation dialog when logout button is clicked', () => {
    renderProfilePage()

    const logoutButton = screen.getByText('Cerrar sesión')
    fireEvent.click(logoutButton)

    expect(screen.getByText('¿Estás seguro de que quieres cerrar sesión?')).toBeInTheDocument()
  })

  it('handles avatar upload button click', () => {
    renderProfilePage()

    const avatarButton = screen.getByRole('button', { name: /camera/i })
    expect(avatarButton).toBeInTheDocument()
  })

  it('shows help and support section', () => {
    renderProfilePage()

    expect(screen.getByText('Ayuda y soporte')).toBeInTheDocument()
    expect(screen.getByText('Contactar con soporte técnico')).toBeInTheDocument()
  })

  it('displays user role badge correctly', () => {
    renderProfilePage()

    const roleBadge = screen.getByText('Administrador')
    expect(roleBadge).toBeInTheDocument()
    expect(roleBadge).toHaveClass('bg-blue-600')
  })
}) 
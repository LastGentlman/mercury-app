import { useState } from 'react'
import { 
  DollarSign,
  Package,
  Plus,
  ShoppingCart, 
  TrendingUp,
  Users
} from 'lucide-react'
import type { Order } from '@/types'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatsCard } from '@/components/ui/stats-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { EnhancedOrderCard } from '@/components/EnhancedOrderCard'

export default function EnhancedDesignSystemPage() {
  const [loading, setLoading] = useState(false)
  const [showEmptyState, setShowEmptyState] = useState(false)

  // Mock order data
  const mockOrder: Order = {
    id: '1',
    business_id: 'business-1',
    branch_id: 'branch-1',
    employee_id: 'employee-1',
    client_name: 'María González', // ✅ CAMBIO: client_name en lugar de clientName
    client_phone: '+34612345678', // ✅ CAMBIO: client_phone en lugar de clientPhone
    delivery_date: '2024-01-15',
    status: 'pending',
    total: 45.50,
    items: [
      { 
        id: 1,
        order_id: '1',
        product_name: 'Pizza Margherita', // ✅ CAMBIO: product_name
        quantity: 2, 
        unit_price: 12.00, 
        subtotal: 24.00  // ✅ CAMBIO: subtotal en lugar de total
      },
      { 
        id: 2,
        order_id: '1',
        product_name: 'Coca Cola', 
        quantity: 1, 
        unit_price: 2.50, 
        subtotal: 2.50 
      },
      { 
        id: 3,
        order_id: '1',
        product_name: 'Ensalada César', 
        quantity: 1, 
        unit_price: 19.00, 
        subtotal: 19.00 
      },
    ],
    notes: 'Por favor, llamar antes de llegar',
    syncStatus: 'synced',
    created_at: new Date().toISOString(),
    last_modified_at: new Date().toISOString(),
  }

  const handleStatusChange = (orderId: string, status: Order['status']) => {
    console.log('Status change:', orderId, status)
  }

  const handleLoadingToggle = () => {
    setLoading(!loading)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎨 Enhanced Design System
          </h1>
          <p className="text-gray-600">
            Componentes UI mejorados para PedidoList con mejor polish visual
          </p>
        </div>

        {/* Stats Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">📊 Stats Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Pedidos Totales"
              value="1,234"
              change={{ value: 12, type: 'increase' }}
              icon={<ShoppingCart className="w-8 h-8" />}
              variant="default"
            />
            <StatsCard
              title="Clientes Activos"
              value="89"
              change={{ value: 5, type: 'increase' }}
              icon={<Users className="w-8 h-8" />}
              variant="success"
            />
            <StatsCard
              title="Ingresos Mensuales"
              value="$12,450"
              change={{ value: 8, type: 'decrease' }}
              icon={<DollarSign className="w-8 h-8" />}
              variant="warning"
            />
            <StatsCard
              title="Tasa de Entrega"
              value="98.5%"
              change={{ value: 2, type: 'increase' }}
              icon={<TrendingUp className="w-8 h-8" />}
              variant="error"
            />
          </div>
        </section>

        {/* Enhanced Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">🔘 Enhanced Buttons</h2>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Variants */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Variants</h3>
                <div className="space-y-3">
                  <EnhancedButton variant="primary">Primary Button</EnhancedButton>
                  <EnhancedButton variant="secondary">Secondary Button</EnhancedButton>
                  <EnhancedButton variant="success">Success Button</EnhancedButton>
                  <EnhancedButton variant="danger">Danger Button</EnhancedButton>
                  <EnhancedButton variant="ghost">Ghost Button</EnhancedButton>
                  <EnhancedButton variant="outline">Outline Button</EnhancedButton>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sizes</h3>
                <div className="space-y-3">
                  <EnhancedButton size="sm">Small Button</EnhancedButton>
                  <EnhancedButton size="md">Medium Button</EnhancedButton>
                  <EnhancedButton size="lg">Large Button</EnhancedButton>
                  <EnhancedButton size="xl">Extra Large Button</EnhancedButton>
                </div>
              </div>

              {/* With Icons */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">With Icons</h3>
                <div className="space-y-3">
                  <EnhancedButton icon={<Plus className="w-4 h-4" />}>
                    Crear Pedido
                  </EnhancedButton>
                  <EnhancedButton 
                    variant="outline" 
                    icon={<Package className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    Ver Detalles
                  </EnhancedButton>
                </div>
              </div>

              {/* Loading States */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Loading States</h3>
                <div className="space-y-3">
                  <EnhancedButton 
                    loading={loading}
                    onClick={handleLoadingToggle}
                  >
                    {loading ? 'Procesando...' : 'Toggle Loading'}
                  </EnhancedButton>
                  <EnhancedButton 
                    variant="success" 
                    loading={true}
                    disabled
                  >
                    Guardando...
                  </EnhancedButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Badges Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">🏷️ Status Badges</h2>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* All Statuses */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">All Statuses</h3>
                <div className="space-y-3">
                  <StatusBadge status="pending" />
                  <StatusBadge status="preparing" />
                  <StatusBadge status="ready" />
                  <StatusBadge status="delivered" />
                  <StatusBadge status="cancelled" />
                </div>
              </div>

              {/* Different Sizes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sizes</h3>
                <div className="space-y-3">
                  <StatusBadge status="pending" size="sm" />
                  <StatusBadge status="preparing" size="md" />
                  <StatusBadge status="ready" size="lg" />
                </div>
              </div>

              {/* Without Icons */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Without Icons</h3>
                <div className="space-y-3">
                  <StatusBadge status="pending" showIcon={false} />
                  <StatusBadge status="preparing" showIcon={false} />
                  <StatusBadge status="ready" showIcon={false} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Order Card Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">📋 Enhanced Order Card</h2>
          <div className="max-w-2xl">
            <EnhancedOrderCard
              order={mockOrder}
              onStatusChange={handleStatusChange}
              onEdit={(id) => console.log('Edit order:', id)}
              onDelete={(id) => console.log('Delete order:', id)}
            />
          </div>
        </section>

        {/* Loading States Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">⏳ Loading States</h2>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Skeleton Variants</h3>
                <div className="space-y-4">
                  <Skeleton variant="text" className="w-full" />
                  <Skeleton variant="circular" className="w-12 h-12" />
                  <Skeleton variant="rectangular" className="w-full h-20" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Text Lines</h3>
                <div className="space-y-4">
                  <Skeleton variant="text" lines={3} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Card Loading</h3>
                <div className="space-y-3">
                  <Skeleton variant="rectangular" className="w-full h-32" />
                  <Skeleton variant="text" lines={2} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Empty States Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">📭 Empty States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <EmptyState
                title="No hay pedidos"
                description="Aún no has creado ningún pedido. Comienza creando tu primer pedido para verlo aquí."
                icon={<ShoppingCart className="w-16 h-16" />}
                action={
                  <EnhancedButton 
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => console.log('Create order')}
                  >
                    Crear Primer Pedido
                  </EnhancedButton>
                }
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <EmptyState
                title="Sin resultados"
                description="No se encontraron pedidos que coincidan con tu búsqueda."
                icon={<Package className="w-16 h-16" />}
                action={
                  <EnhancedButton 
                    variant="outline"
                    onClick={() => setShowEmptyState(!showEmptyState)}
                  >
                    Limpiar Filtros
                  </EnhancedButton>
                }
              />
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">💡 Usage Examples</h2>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="prose max-w-none">
              <h3>Quick Start</h3>
              <p>Import and use the enhanced components:</p>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { EnhancedButton, StatusBadge, StatsCard } from '@/components/ui'

// Enhanced Button with loading state
<EnhancedButton 
  variant="primary" 
  loading={isLoading}
  icon={<Plus className="w-4 h-4" />}
>
  Crear Pedido
</EnhancedButton>

// Status Badge for order status
<StatusBadge status="pending" size="md" />

// Stats Card for dashboard
<StatsCard
  title="Pedidos Totales"
  value="1,234"
  change={{ value: 12, type: 'increase' }}
  icon={<ShoppingCart className="w-8 h-8" />}
/>`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
} 
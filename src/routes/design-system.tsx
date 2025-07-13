import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { 
  AlertCircle,
  Bell,
  Calendar, 
  CheckCircle, 
  Clock, 
  Code,
  Copy,
  DollarSign,
  Edit,
  ExternalLink,
  Filter,
  MessageCircle, 
  MoreHorizontal,
  Package,
  Phone, 
  Search,
  Trash2,
  TrendingUp,
  User
} from 'lucide-react'
import { Alert, Badge, Button, Card, Input, Spinner } from '../components/ui/design-system-components'

// Status Badge Component for order states
const StatusBadge = ({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) => {
  const statusConfig = {
    pending: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: AlertCircle,
      label: 'Pendiente' 
    },
    preparing: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: Clock,
      label: 'Preparando' 
    },
    ready: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle,
      label: 'Listo' 
    },
    delivered: { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: Package,
      label: 'Entregado' 
    }
  }
  
  const config = statusConfig[status as keyof typeof statusConfig]
  const Icon = config.icon
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  )
}

// Component showcase item
const ComponentShowcase = ({ 
  title, 
  description, 
  children, 
  code 
}: { 
  title: string
  description: string
  children: React.ReactNode
  code: string
}) => {
  const [showCode, setShowCode] = useState(false)
  
  const copyCode = () => {
    navigator.clipboard.writeText(code)
  }
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copiar código"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCode(!showCode)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Ver código"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-white">
        <div className="flex flex-wrap gap-4 items-center">
          {children}
        </div>
      </div>
      
      {showCode && (
        <div className="border-t border-gray-200 bg-gray-900 text-gray-100 p-4">
          <pre className="text-sm overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/design-system')({
  component: DesignSystemPage,
})

function DesignSystemPage() {
  const colorPalette = [
    { name: 'Primary', colors: ['#f0f9ff', '#3b82f6', '#1d4ed8'] },
    { name: 'Success', colors: ['#f0fdf4', '#10b981', '#059669'] },
    { name: 'Warning', colors: ['#fffbeb', '#f59e0b', '#d97706'] },
    { name: 'Error', colors: ['#fef2f2', '#ef4444', '#dc2626'] },
    { name: 'Gray', colors: ['#f9fafb', '#6b7280', '#1f2937'] }
  ]
  
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PedidoList Design System</h1>
        <p className="text-gray-600">Componentes, colores y patrones de diseño</p>
      </div>
      
      {/* Color Palette */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Paleta de Colores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {colorPalette.map((palette) => (
            <div key={palette.name} className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">{palette.name}</h3>
              <div className="space-y-2">
                {palette.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-mono text-gray-600">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Buttons */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Botones</h2>
        <div className="space-y-6">
          <ComponentShowcase
            title="Variantes de Botones"
            description="Diferentes estilos para diferentes acciones"
            code={`<Button variant="primary">Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="danger">Peligro</Button>
<Button variant="success">Éxito</Button>
<Button variant="outline">Outline</Button>`}
          >
            <Button variant="primary">Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="danger">Peligro</Button>
            <Button variant="success">Éxito</Button>
            <Button variant="outline">Outline</Button>
          </ComponentShowcase>
          
          <ComponentShowcase
            title="Tamaños de Botones"
            description="Diferentes tamaños para diferentes contextos"
            code={`<Button size="sm">Pequeño</Button>
<Button size="md">Mediano</Button>
<Button size="lg">Grande</Button>`}
          >
            <Button size="sm">Pequeño</Button>
            <Button size="md">Mediano</Button>
            <Button size="lg">Grande</Button>
          </ComponentShowcase>
        </div>
      </section>

      {/* Inputs */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Campos de Entrada</h2>
        <div className="space-y-6">
          <ComponentShowcase
            title="Estados de Input"
            description="Diferentes estados para validación"
            code={`<Input label="Email" placeholder="tu@email.com" />
<Input label="Contraseña" type="password" error="Campo requerido" />
<Input label="Nombre" success={true} helperText="Válido" />`}
          >
            <Input label="Email" placeholder="tu@email.com" />
            <Input label="Contraseña" type="password" error="Campo requerido" />
            <Input label="Nombre" success={true} helperText="Válido" />
          </ComponentShowcase>
        </div>
      </section>

      {/* Cards */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tarjetas</h2>
        <div className="space-y-6">
          <ComponentShowcase
            title="Variantes de Tarjetas"
            description="Diferentes niveles de elevación"
            code={`<Card variant="base">Contenido base</Card>
<Card variant="elevated">Contenido elevado</Card>
<Card variant="flat">Contenido plano</Card>`}
          >
            <Card variant="base" className="p-4 w-48">Contenido base</Card>
            <Card variant="elevated" className="p-4 w-48">Contenido elevado</Card>
            <Card variant="flat" className="p-4 w-48">Contenido plano</Card>
          </ComponentShowcase>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Badges</h2>
        <div className="space-y-6">
          <ComponentShowcase
            title="Badges del Sistema"
            description="Indicadores semánticos"
            code={`<Badge variant="primary">Nuevo</Badge>
<Badge variant="success">Completado</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="neutral">Neutral</Badge>`}
          >
            <Badge variant="primary">Nuevo</Badge>
            <Badge variant="success">Completado</Badge>
            <Badge variant="warning">Pendiente</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </ComponentShowcase>
        </div>
      </section>
      
      {/* Status Badges */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Estados de Pedidos</h2>
        <ComponentShowcase
          title="Badges de Estado"
          description="Indicadores visuales para el estado de los pedidos"
          code={`<StatusBadge status="pending" />
<StatusBadge status="preparing" />
<StatusBadge status="ready" />
<StatusBadge status="delivered" />`}
        >
          <StatusBadge status="pending" />
          <StatusBadge status="preparing" />
          <StatusBadge status="ready" />
          <StatusBadge status="delivered" />
        </ComponentShowcase>
      </section>

      {/* Alerts */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Alertas</h2>
        <div className="space-y-6">
          <ComponentShowcase
            title="Tipos de Alertas"
            description="Mensajes informativos y de estado"
            code={`<Alert variant="success" title="Éxito">Operación completada</Alert>
<Alert variant="warning" title="Advertencia">Revisa los datos</Alert>
<Alert variant="error" title="Error">Algo salió mal</Alert>
<Alert variant="info" title="Información">Información importante</Alert>`}
          >
            <div className="space-y-4 w-full">
              <Alert variant="success" title="Éxito">Operación completada correctamente.</Alert>
              <Alert variant="warning" title="Advertencia">Revisa los datos ingresados.</Alert>
              <Alert variant="error" title="Error">Algo salió mal, intenta de nuevo.</Alert>
              <Alert variant="info" title="Información">Información importante para el usuario.</Alert>
            </div>
          </ComponentShowcase>
        </div>
      </section>

      {/* Loading States */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Estados de Carga</h2>
        <ComponentShowcase
          title="Spinners"
          description="Indicadores de carga"
          code={`<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />`}
        >
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </ComponentShowcase>
      </section>
      
      {/* Icons */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Iconografía</h2>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-gray-600 mb-4">Usando Lucide React para consistencia</p>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
            {[
              Calendar, Clock, User, Phone, MessageCircle, CheckCircle,
              AlertCircle, Package, DollarSign, TrendingUp, Bell, Search,
              Filter, MoreHorizontal, Edit, Trash2, ExternalLink, Copy
            ].map((Icon, index) => (
              <div key={index} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50">
                <Icon className="h-6 w-6 text-gray-700" />
                <span className="text-xs text-gray-500">{Icon.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Typography */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tipografía</h2>
        <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Heading 1</h1>
            <code className="text-sm text-gray-500">text-4xl font-bold</code>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Heading 2</h2>
            <code className="text-sm text-gray-500">text-3xl font-bold</code>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Heading 3</h3>
            <code className="text-sm text-gray-500">text-2xl font-bold</code>
          </div>
          <div>
            <p className="text-base text-gray-900">Texto base para contenido general</p>
            <code className="text-sm text-gray-500">text-base</code>
          </div>
          <div>
            <p className="text-sm text-gray-600">Texto pequeño para detalles</p>
            <code className="text-sm text-gray-500">text-sm text-gray-600</code>
          </div>
        </div>
      </section>
      
      {/* Usage Guidelines */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Guías de Uso</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Hacer</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Usar colores consistentes para estados</li>
              <li>• Mantener espaciado uniforme</li>
              <li>• Usar iconos de la misma familia (Lucide)</li>
              <li>• Seguir jerarquía tipográfica</li>
              <li>• Añadir transiciones suaves</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">❌ No hacer</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Mezclar familias de iconos</li>
              <li>• Usar colores arbitrarios</li>
              <li>• Crear variantes no documentadas</li>
              <li>• Ignorar estados de hover/focus</li>
              <li>• Usar espaciado inconsistente</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
} 
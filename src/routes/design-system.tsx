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
  User,
  Palette
} from 'lucide-react'
import { Alert, Badge, Button, Card, Input, Skeleton } from '../components/ui/index.ts'
import { ThemeToggle } from '../components/ThemeToggle.tsx'

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
              type="button"
              onClick={copyCode}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copiar código"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
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
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">PedidoList Design System</h1>
        <p className="text-gray-600 dark:text-gray-300">Componentes, colores y patrones de diseño</p>
      </div>
      
      {/* Color Palette */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Paleta de Colores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {colorPalette.map((palette) => (
            <div key={palette.name} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{palette.name}</h3>
              <div className="space-y-2">
                {palette.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300">{color}</span>
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
            code={`<Button variant="default">Primario</Button>
                   <Button variant="outline">Secundario</Button>
                   <Button variant="destructive">Peligro</Button>
                   <Button variant="default">Éxito</Button>
                   <Button variant="ghost">Outline</Button>`
                 }
          >
            <Button variant="default">Primario</Button>
            <Button variant="outline">Secundario</Button>
            <Button variant="destructive">Peligro</Button>
            <Button variant="default">Éxito</Button>
            <Button variant="ghost">Outline</Button>
          </ComponentShowcase>
          
          <ComponentShowcase
            title="Tamaños de Botones"
            description="Diferentes tamaños para diferentes contextos"
            code={`<Button size="sm">Pequeño</Button>
                   <Button size="default">Mediano</Button>
                   <Button size="lg">Grande</Button>`
                 }
          >
            <Button size="sm">Pequeño</Button>
            <Button size="default">Mediano</Button>
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
            code={`<Input placeholder="tu@email.com" />
                   <Input type="password" placeholder="Contraseña" />
                   <Input placeholder="Nombre" />`
                 }
          >
            <Input placeholder="tu@email.com" />
            <Input type="password" placeholder="Contraseña" />
            <Input placeholder="Nombre" />
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
            code={`<Card className="p-4 w-48">Contenido base</Card>
                   <Card className="p-4 w-48">Contenido elevado</Card>
                   <Card className="p-4 w-48">Contenido plano</Card>`}
          >
            <Card className="p-4 w-48">Contenido base</Card>
            <Card className="p-4 w-48">Contenido elevado</Card>
            <Card className="p-4 w-48">Contenido plano</Card>
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
            code={`<Badge variant="default">Nuevo</Badge>
                   <Badge variant="default">Completado</Badge>
                   <Badge variant="default">Pendiente</Badge>
                   <Badge variant="default">Error</Badge>
                   <Badge variant="default">Neutral</Badge>`
                  }
          >
            <Badge variant="default">Nuevo</Badge>
            <Badge variant="default">Completado</Badge>
            <Badge variant="default">Pendiente</Badge>
            <Badge variant="default">Error</Badge>
            <Badge variant="default">Neutral</Badge>
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
                 <StatusBadge status="delivered" />`
               }
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
            code={`<Alert variant="default" title="Éxito">Operación completada</Alert>
                   <Alert variant="default" title="Advertencia">Revisa los datos</Alert>
                   <Alert variant="default" title="Error">Algo salió mal</Alert>
                   <Alert variant="default" title="Información">Información importante</Alert>`
                 }
          >
            <div className="space-y-4 w-full">
              <Alert variant="default" title="Éxito">Operación completada correctamente.</Alert>
              <Alert variant="default" title="Advertencia">Revisa los datos ingresados.</Alert>
              <Alert variant="default" title="Error">Algo salió mal, intenta de nuevo.</Alert>
              <Alert variant="default" title="Información">Información importante para el usuario.</Alert>
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
          code={`<Skeleton className="w-16 h-16" />
                 <Skeleton className="w-24 h-24" />
                 <Skeleton className="w-32 h-32" />`
               }
        >
          <Skeleton className="w-16 h-16" />
          <Skeleton className="w-24 h-24" />
          <Skeleton className="w-32 h-32" />
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
      
      {/* Dark Theme Showcase */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Dark Theme (VS Code Inspired)
        </h2>
        <div className="bg-white dark:bg-vscode-sidebar rounded-lg p-6 border border-gray-200 dark:border-vscode-border transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Theme Toggle
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Switch between Light, Dark, and System themes
              </p>
            </div>
            <ThemeToggle />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dark Theme Colors */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Dark Theme Color Palette</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-vscode-editor border border-gray-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Editor Background</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-vscode-sidebar border border-gray-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sidebar Background</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-vscode-panel border border-gray-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Panel Background</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-vscode-hover border border-gray-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Hover Background</span>
                </div>
              </div>
            </div>
            
            {/* Syntax Highlighting */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Syntax Highlighting</h4>
              <div className="bg-vscode-editor p-4 rounded border border-vscode-border">
                <div className="text-sm font-mono space-y-1">
                  <div><span className="syntax-keyword">const</span> <span className="syntax-variable">user</span> = <span className="syntax-string">&quot;PedidoList&quot;</span>;</div>
                  <div><span className="syntax-comment">// VS Code inspired colors</span></div>
                  <div><span className="syntax-function">function</span> <span className="syntax-variable">getTheme</span>() &#123;</div>
                  <div>  <span className="syntax-keyword">return</span> <span className="syntax-number">42</span>;</div>
                  <div>&#125;</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dark Theme Components */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Dark Theme Components</h4>
            <div className="flex flex-wrap gap-3">
              <Button>Default Button</Button>
              <Input 
                placeholder="Input Field" 
                className="w-48"
              />
              <div className="bg-card border border-border px-3 py-2 rounded text-sm">
                Card Component
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Usage Guidelines */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Guías de Uso</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-vscode-sidebar rounded-lg p-6 border border-gray-200 dark:border-vscode-border transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">✅ Hacer</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Usar colores consistentes para estados</li>
              <li>• Mantener espaciado uniforme</li>
              <li>• Usar iconos de la misma familia (Lucide)</li>
              <li>• Seguir jerarquía tipográfica</li>
              <li>• Añadir transiciones suaves</li>
              <li>• Usar el tema oscuro para mejor experiencia</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-vscode-sidebar rounded-lg p-6 border border-gray-200 dark:border-vscode-border transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">❌ No hacer</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Mezclar familias de iconos</li>
              <li>• Usar colores arbitrarios</li>
              <li>• Crear variantes no documentadas</li>
              <li>• Ignorar estados de hover/focus</li>
              <li>• Usar espaciado inconsistente</li>
              <li>• Ignorar el soporte para modo oscuro</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
} 
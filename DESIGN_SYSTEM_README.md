# 🎨 PedidoList Design System

Un sistema de diseño completo y consistente para la aplicación PedidoList.

## 📋 Índice

- [Colores](#-colores)
- [Tipografía](#-tipografía)
- [Espaciado](#-espaciado)
- [Bordes y Sombras](#-bordes-y-sombras)
- [Componentes](#-componentes)
- [Utilidades](#-🛠️ utilidades)
- [Uso](#-uso)
- [Mejores Prácticas](#-mejores-prácticas)
- [Personalización](#-personalización)
- [Recursos Adicionales](#-recursos-adicionales)

## 🎨 Colores

### Paleta Principal

```typescript
// Azul - Color principal de la marca
primary: {
  50: '#f0f9ff',   // Muy claro
  500: '#3b82f6',  // Principal
  600: '#2563eb',  // Hover
  700: '#1d4ed8',  // Activo
}
```

### Colores Semánticos

```typescript
// Éxito - Verde
success: {
  500: '#10b981',
  600: '#059669',
}

// Advertencia - Ámbar
warning: {
  500: '#f59e0b',
  600: '#d97706',
}

// Error - Rojo
error: {
  500: '#ef4444',
  600: '#dc2626',
}
```

### Colores Neutros

```typescript
// Grises para texto y fondos
neutral: {
  50: '#f8fafc',   // Fondo muy claro
  100: '#f1f5f9',  // Fondo claro
  200: '#e2e8f0',  // Bordes
  300: '#cbd5e1',  // Bordes medios
  400: '#94a3b8',  // Texto terciario
  500: '#64748b',  // Texto secundario
  600: '#475569',  // Texto principal
  700: '#334155',  // Texto fuerte
}
```

## 📝 Tipografía

### Familias de Fuentes

```typescript
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'monospace'],
}
```

### Tamaños de Fuente

```typescript
fontSize: {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
}
```

### Pesos de Fuente

```typescript
fontWeight: {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
}
```

## 📏 Espaciado

```typescript
spacing: {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  xxl: '3rem',    // 48px
  xxxl: '4rem',   // 64px
}
```

## 🔲 Bordes y Sombras

### Radio de Bordes

```typescript
borderRadius: {
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
}
```

### Sombras

```typescript
shadows: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
}
```

## 🧩 Componentes

### Botón

```tsx
import { Button } from '../components/ui/design-system-components'

// Variantes disponibles
<Button variant="primary">Botón Principal</Button>
<Button variant="secondary">Botón Secundario</Button>
<Button variant="danger">Botón Peligro</Button>
<Button variant="success">Botón Éxito</Button>
<Button variant="outline">Botón Outline</Button>

// Tamaños
<Button size="sm">Pequeño</Button>
<Button size="md">Mediano</Button>
<Button size="lg">Grande</Button>
```

### Input

```tsx
import { Input } from '../components/ui/design-system-components'

// Uso básico
<Input label="Email" placeholder="tu@email.com" />

// Con estados
<Input 
  label="Contraseña" 
  type="password"
  error="La contraseña es requerida"
/>

<Input 
  label="Email" 
  success={true}
  helperText="Email válido"
/>
```

### Card

```tsx
import { Card } from '../components/ui/design-system-components'

// Variantes
<Card variant="base">Contenido</Card>
<Card variant="elevated">Contenido Elevado</Card>
<Card variant="flat">Contenido Plano</Card>
```

### Badge

```tsx
import { Badge } from '../components/ui/design-system-components'

// Variantes
<Badge variant="primary">Nuevo</Badge>
<Badge variant="success">Completado</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="neutral">Neutral</Badge>
```

### Alert

```tsx
import { Alert } from '../components/ui/design-system-components'

// Variantes
<Alert variant="success" title="Éxito">
  Operación completada correctamente.
</Alert>

<Alert variant="warning" title="Advertencia">
  Revisa los datos ingresados.
</Alert>

<Alert variant="error" title="Error">
  Algo salió mal.
</Alert>

<Alert variant="info" title="Información">
  Información importante.
</Alert>
```

## 🛠️ Utilidades

### Función `cn()` - Combinar Clases

```tsx
import { cn } from '../lib/ui-utils'

// Combina múltiples clases de manera segura
const className = cn(
  'base-class',
  condition && 'conditional-class',
  'another-class'
)
```

### Utilidades de Estado

```tsx
import { state } from '../lib/ui-utils'

// Clases de estado
state.hover('bg-blue-100')    // hover:bg-blue-100
state.focus('ring-2')         // focus:ring-2
state.active('scale-95')      // active:scale-95
state.disabled('opacity-50')  // disabled:opacity-50
```

### Utilidades Responsivas

```tsx
import { responsive } from '../lib/ui-utils'

// Clases responsivas
responsive.sm('text-sm')      // sm:text-sm
responsive.md('text-base')    // md:text-base
responsive.lg('text-lg')      // lg:text-lg
responsive.xl('text-xl')      // xl:text-xl
```

## 📖 Uso

### 1. Importar el Sistema de Diseño

```tsx
import { designSystem } from '../lib/design-system'
import { cn } from '../lib/ui-utils'
```

### 2. Usar Colores

```tsx
// En componentes
<div className={`bg-[${designSystem.colors.primary[500]}]`}>
  Contenido
</div>

// Con utilidades
<div className="bg-[#3b82f6] text-white">
  Contenido
</div>
```

### 3. Usar Espaciado

```tsx
// Con el sistema
<div className={`p-${designSystem.spacing.md}`}>
  Contenido
</div>

// Con Tailwind
<div className="p-4">
  Contenido
</div>
```

### 4. Usar Componentes

```tsx
import { Button, Input, Card } from '../components/ui/design-system-components'

function MyComponent() {
  return (
    <Card variant="elevated">
      <Input label="Nombre" placeholder="Tu nombre" />
      <Button variant="primary" size="lg">
        Enviar
      </Button>
    </Card>
  )
}
```

## 🎯 Mejores Prácticas

### ✅ Hacer

- Usar los colores del sistema de diseño
- Mantener consistencia en espaciado
- Usar los componentes predefinidos
- Seguir la jerarquía tipográfica
- Usar las utilidades de estado

### ❌ No Hacer

- Definir colores personalizados sin justificación
- Usar espaciado arbitrario
- Crear componentes duplicados
- Ignorar la accesibilidad
- Usar clases CSS inline

## 🔧 Personalización

### Extender el Sistema

```typescript
// En design-system.ts
export const customColors = {
  brand: {
    500: '#your-brand-color',
  }
}

// Agregar al designSystem
colors: {
  ...designSystem.colors,
  ...customColors,
}
```

### Crear Nuevos Componentes

```tsx
// Siguiendo el patrón del sistema
export const CustomComponent: React.FC<CustomProps> = ({
  variant = 'default',
  className,
  children,
}) => {
  const baseClasses = 'base-styles'
  const variantClasses = {
    default: 'default-variant',
    custom: 'custom-variant',
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  )
}
```

## 📚 Recursos Adicionales

- [Design System Page](/design-system) - Página interactiva con todos los componentes
- [Color Accessibility Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Nota**: Este sistema de diseño está diseñado para evolucionar con la aplicación. Mantén la consistencia y documenta cualquier cambio significativo.

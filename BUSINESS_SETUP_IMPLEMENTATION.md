# Implementación de Configuración de Negocio

## Resumen

Se ha implementado una pantalla de configuración requerida que se muestra cuando el usuario no tiene un negocio configurado. Esta implementación incluye:

1. **Pantalla de configuración requerida** (`BusinessSetupRequired.tsx`)
2. **Modal de configuración de negocio** (`BusinessSetupModal.tsx`)
3. **Integración con el dashboard** (`dashboard.tsx`)

## Componentes Implementados

### 1. BusinessSetupRequired.tsx

Este componente muestra la pantalla principal cuando el usuario no tiene un negocio configurado. Incluye:

- **Header**: Título "Mercury" centrado
- **Icono de tienda**: Círculo azul claro con icono de tienda
- **Título**: "Configuración Requerida"
- **Descripción**: Explicación de por qué se necesita configurar un negocio
- **Botón principal**: "Configurar Negocio" con icono de plus
- **Navegación inferior**: Barra de navegación con iconos de Dashboard, Pedidos, Clientes y Perfil

### 2. BusinessSetupModal.tsx

Modal que se abre al hacer clic en "Configurar Negocio". Incluye tres pasos:

#### Paso 1: Elección
- Opción para crear nuevo negocio
- Opción para unirse a negocio existente

#### Paso 2: Crear Negocio
- Campo para nombre del negocio
- Botones de navegación (Atrás/Crear)

#### Paso 3: Unirse a Negocio
- Campo para código de negocio
- Botones de navegación (Atrás/Unirse)

### 3. Integración en Dashboard

El dashboard ahora:
- Detecta si el usuario tiene un `businessId`
- Muestra la pantalla de configuración si no lo tiene
- Abre el modal al hacer clic en "Configurar Negocio"
- Maneja la creación/unión de negocios

## Características

### Diseño Responsivo
- Diseño optimizado para móviles
- Navegación inferior similar a la app real
- Modal centrado con scroll si es necesario

### UX/UI
- Iconos de Lucide React para consistencia
- Colores azules para la marca
- Animaciones y transiciones suaves
- Estados de carga durante operaciones

### Funcionalidad
- Validación de campos
- Estados de carga
- Manejo de errores básico
- Simulación de operaciones asíncronas

## Uso

### Para probar la funcionalidad:

1. **Sin negocio configurado**: El usuario verá la pantalla de configuración requerida
2. **Hacer clic en "Configurar Negocio"**: Se abre el modal
3. **Elegir opción**: Crear nuevo o unirse a existente
4. **Completar formulario**: Llenar nombre o código
5. **Confirmar**: El modal se cierra y se simula la configuración

### Para desarrollo:

```typescript
// En el dashboard
const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false)

// Mostrar pantalla de configuración
if (!user?.businessId) {
  return <BusinessSetupRequired onConfigureBusiness={() => setIsBusinessModalOpen(true)} />
}

// Modal de configuración
<BusinessSetupModal
  isOpen={isBusinessModalOpen}
  onClose={() => setIsBusinessModalOpen(false)}
  onBusinessCreated={(businessId) => {
    // Actualizar contexto de autenticación
    console.log('Business created:', businessId)
  }}
/>
```

## Próximos Pasos

1. **Integración con backend**: Conectar con APIs reales para crear/unión de negocios
2. **Persistencia**: Guardar el `businessId` en el contexto de autenticación
3. **Validaciones**: Agregar validaciones más robustas
4. **Mensajes de error**: Mejorar el manejo de errores
5. **Tests**: Agregar tests unitarios y de integración

## Archivos Modificados

- `src/components/BusinessSetupRequired.tsx` (nuevo)
- `src/components/BusinessSetupModal.tsx` (nuevo)
- `src/routes/dashboard.tsx` (modificado)

## Dependencias

- `lucide-react`: Para iconos
- `@tanstack/react-router`: Para navegación
- `tailwindcss`: Para estilos
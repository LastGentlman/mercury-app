# SweetAlert2 Integration Guide

## Overview

Hemos integrado SweetAlert2 en nuestro proyecto para reemplazar las alertas básicas de toast con alertas más atractivas y funcionales.

## Instalación

```bash
npm install sweetalert2
```

## Configuración

El archivo `src/utils/sweetalert.ts` contiene todas las funciones helper y configuraciones personalizadas para SweetAlert2.

## Funciones Disponibles

### Alertas Básicas

#### `showSuccess(title, message?, options?)`
Muestra una alerta de éxito con auto-cierre después de 3 segundos.

```typescript
import { showSuccess } from '../utils/sweetalert.ts'

// Uso básico
showSuccess('¡Éxito!', 'Operación completada correctamente')

// Con opciones personalizadas
showSuccess('¡Éxito!', 'Operación completada', {
  timer: 5000,
  showConfirmButton: true
})
```

#### `showError(title, message?, options?)`
Muestra una alerta de error que requiere confirmación del usuario.

```typescript
import { showError } from '../utils/sweetalert.ts'

showError('Error', 'Algo salió mal. Por favor intenta de nuevo.')
```

#### `showWarning(title, message?, options?)`
Muestra una alerta de advertencia.

```typescript
import { showWarning } from '../utils/sweetalert.ts'

showWarning('Advertencia', 'Esta acción puede tener consecuencias.')
```

#### `showInfo(title, message?, options?)`
Muestra una alerta informativa.

```typescript
import { showInfo } from '../utils/sweetalert.ts'

showInfo('Información', 'Tu perfil ha sido actualizado.')
```

### Alertas de Confirmación

#### `showConfirm(title, message?, options?)`
Muestra una alerta de confirmación con botones Sí/Cancelar.

```typescript
import { showConfirm } from '../utils/sweetalert.ts'

const result = await showConfirm(
  '¿Estás seguro?',
  'Esta acción no se puede deshacer.'
)

if (result.isConfirmed) {
  // Usuario hizo clic en "Sí, continuar"
  console.log('Usuario confirmó la acción')
} else {
  // Usuario hizo clic en "Cancelar"
  console.log('Usuario canceló la acción')
}
```

#### `showDeleteConfirm(title, message?, options?)`
Muestra una alerta de confirmación para acciones destructivas (botón rojo).

```typescript
import { showDeleteConfirm } from '../utils/sweetalert.ts'

const result = await showDeleteConfirm(
  'Eliminar producto',
  '¿Estás seguro de que quieres eliminar este producto?'
)

if (result.isConfirmed) {
  await deleteProduct(productId)
}
```

### Alertas de Input

#### `showInput(title, placeholder?, options?)`
Muestra una alerta con campo de texto.

```typescript
import { showInput } from '../utils/sweetalert.ts'

const result = await showInput(
  'Ingresa tu nombre',
  'Nombre completo'
)

if (result.isConfirmed) {
  const name = result.value
  console.log('Nombre ingresado:', name)
}
```

#### `showEmailInput(title, placeholder?, options?)`
Muestra una alerta con campo de email con validación.

```typescript
import { showEmailInput } from '../utils/sweetalert.ts'

const result = await showEmailInput(
  'Ingresa tu email',
  'tu@email.com'
)

if (result.isConfirmed) {
  const email = result.value
  console.log('Email ingresado:', email)
}
```

#### `showPasswordInput(title, placeholder?, options?)`
Muestra una alerta con campo de contraseña.

```typescript
import { showPasswordInput } from '../utils/sweetalert.ts'

const result = await showPasswordInput(
  'Ingresa tu contraseña actual'
)

if (result.isConfirmed) {
  const password = result.value
  // Validar contraseña
}
```

#### `showSelect(title, options, placeholder?, options?)`
Muestra una alerta con selector de opciones.

```typescript
import { showSelect } from '../utils/sweetalert.ts'

const categories = ['Electrónicos', 'Ropa', 'Hogar', 'Deportes']

const result = await showSelect(
  'Selecciona una categoría',
  categories,
  'Elige una opción'
)

if (result.isConfirmed) {
  const selectedCategory = result.value
  console.log('Categoría seleccionada:', selectedCategory)
}
```

### Alertas de Carga

#### `showLoading(title?, message?)`
Muestra una alerta de carga que no se puede cerrar.

```typescript
import { showLoading, closeAlert } from '../utils/sweetalert.ts'

// Mostrar loading
showLoading('Procesando...', 'Por favor espera')

// Realizar operación
await someAsyncOperation()

// Cerrar loading
closeAlert()
```

## Ejemplos de Uso en Componentes

### Ejemplo 1: Confirmación de Eliminación

```typescript
import { showDeleteConfirm, showSuccess, showError } from '../utils/sweetalert.ts'

const handleDelete = async (id: string) => {
  const result = await showDeleteConfirm(
    'Eliminar cliente',
    '¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.'
  )

  if (result.isConfirmed) {
    try {
      await deleteClient(id)
      showSuccess('Cliente eliminado', 'El cliente ha sido eliminado correctamente.')
    } catch (error) {
      showError('Error', 'No se pudo eliminar el cliente. Por favor intenta de nuevo.')
    }
  }
}
```

### Ejemplo 2: Formulario con Validación

```typescript
import { showInput, showError, showSuccess } from '../utils/sweetalert.ts'

const handleEditName = async () => {
  const result = await showInput(
    'Editar nombre',
    'Ingresa el nuevo nombre'
  )

  if (result.isConfirmed) {
    const newName = result.value.trim()
    
    if (newName.length < 2) {
      showError('Nombre inválido', 'El nombre debe tener al menos 2 caracteres.')
      return
    }

    try {
      await updateName(newName)
      showSuccess('Nombre actualizado', 'El nombre ha sido actualizado correctamente.')
    } catch (error) {
      showError('Error', 'No se pudo actualizar el nombre.')
    }
  }
}
```

### Ejemplo 3: Selección de Opciones

```typescript
import { showSelect, showSuccess } from '../utils/sweetalert.ts'

const handleCategoryChange = async () => {
  const categories = ['Restaurante', 'Tienda', 'Servicio', 'Otro']
  
  const result = await showSelect(
    'Cambiar categoría',
    categories,
    'Selecciona una nueva categoría'
  )

  if (result.isConfirmed) {
    await updateCategory(result.value)
    showSuccess('Categoría actualizada', `Tu negocio ahora está en la categoría: ${result.value}`)
  }
}
```

## Personalización

### Configuración Global

Puedes modificar la configuración global en `src/utils/sweetalert.ts`:

```typescript
const defaultConfig = {
  confirmButtonColor: '#3b82f6', // Color del botón principal
  cancelButtonColor: '#6b7280',  // Color del botón cancelar
  background: '#ffffff',         // Color de fondo
  backdrop: 'rgba(0, 0, 0, 0.4)', // Color del backdrop
  customClass: {
    popup: 'rounded-lg shadow-xl',
    confirmButton: 'px-6 py-2 rounded-lg font-medium',
    cancelButton: 'px-6 py-2 rounded-lg font-medium',
    title: 'text-xl font-semibold',
    htmlContainer: 'text-gray-700'
  }
}
```

### Opciones Personalizadas

Cada función acepta un parámetro `options` para personalización adicional:

```typescript
showSuccess('Éxito', 'Mensaje', {
  timer: 5000,                    // Duración en ms
  timerProgressBar: true,         // Mostrar barra de progreso
  showConfirmButton: true,        // Mostrar botón de confirmación
  confirmButtonText: 'OK',        // Texto del botón
  customClass: {                  // Clases CSS personalizadas
    popup: 'my-custom-popup',
    confirmButton: 'my-custom-button'
  }
})
```

## Migración desde Toast

### Antes (con toast)
```typescript
import { toast } from 'sonner'

toast.success('Operación exitosa')
toast.error('Error en la operación')
```

### Después (con SweetAlert2)
```typescript
import { showSuccess, showError } from '../utils/sweetalert.ts'

showSuccess('¡Éxito!', 'Operación exitosa')
showError('Error', 'Error en la operación')
```

## Ventajas de SweetAlert2

1. **Mejor UX**: Alertas más atractivas y profesionales
2. **Más funcionalidad**: Confirmaciones, inputs, selectores
3. **Personalizable**: Fácil de personalizar con CSS y opciones
4. **Responsive**: Se adapta a diferentes tamaños de pantalla
5. **Accesible**: Mejor soporte para lectores de pantalla
6. **Animaciones**: Transiciones suaves y profesionales

## Consideraciones

- Las alertas de SweetAlert2 son modales y bloquean la interacción
- Para mensajes simples y no críticos, considera usar toast
- Las alertas de confirmación son ideales para acciones destructivas
- Los inputs son útiles para recopilar información rápida del usuario 
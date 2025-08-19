# 🎉 Guía de Uso de Sonner en PedidoList App

## ¿Qué es Sonner?

Sonner es una librería de notificaciones (toasts) moderna y elegante para React. Proporciona notificaciones no intrusivas que aparecen en la esquina de la pantalla.

## Configuración

### 1. Toaster Global

El Toaster ya está configurado en `main.tsx`:

```tsx
import { Toaster } from 'sonner'

<Toaster 
  position="top-right"
  richColors
  closeButton
  duration={4000}
/>
```

### 2. Hook Personalizado

Usamos un hook personalizado en `hooks/useNotifications.ts` para consistencia:

```tsx
import { useNotifications } from '../hooks/useNotifications'

const notifications = useNotifications()
```

## Uso Básico

### Notificaciones Simples

```tsx
// Éxito
notifications.success('¡Operación completada!')

// Error
notifications.error('Error en la operación')

// Advertencia
notifications.warning('Atención: datos incompletos')

// Información
notifications.info('Nueva actualización disponible')
```

### Notificaciones con Promesas

```tsx
const handleAsyncOperation = () => {
  notifications.promise(asyncOperation(), {
    loading: 'Procesando datos...',
    success: (data) => `✅ ${data.message}`,
    error: (error) => `❌ ${error.message}`
  })
}
```

## Casos de Uso en la App

### 1. Autenticación

- ✅ Login exitoso
- ❌ Credenciales incorrectas
- ⚠️ Email no confirmado
- ℹ️ Email de confirmación reenviado

### 2. Dashboard

- ℹ️ Funcionalidades en desarrollo
- ✅ Acciones completadas
- ❌ Errores de operación

### 3. Loading Demo

- ✅ Operaciones asíncronas completadas
- ❌ Errores en operaciones
- 🔄 Procesamiento con promesas

## Ventajas de Sonner

1. **No intrusivo**: Las notificaciones no bloquean la interfaz
2. **Consistente**: Mismo estilo en toda la aplicación
3. **Accesible**: Cumple con estándares de accesibilidad
4. **Personalizable**: Colores, posiciones, duración
5. **Promesas**: Integración nativa con operaciones async

## Mejores Prácticas

### ✅ Hacer

- Usar mensajes claros y concisos
- Incluir emojis para mejor UX
- Usar `promise()` para operaciones async
- Mantener consistencia en el tono

### ❌ Evitar

- Mensajes muy largos
- Notificaciones excesivas
- Usar para información crítica (usar modales)
- Mezclar con otros sistemas de notificación

## Ejemplos de Implementación

### En Componentes de Formulario

```tsx
const handleSubmit = async (data) => {
  try {
    await submitForm(data)
    notifications.success('Formulario enviado correctamente')
  } catch (error) {
    notifications.error('Error al enviar formulario')
  }
}
```

### En Operaciones CRUD

```tsx
const handleDelete = () => {
  notifications.promise(deleteItem(id), {
    loading: 'Eliminando elemento...',
    success: 'Elemento eliminado correctamente',
    error: 'Error al eliminar elemento'
  })
}
```

### En Validaciones

```tsx
const validateForm = () => {
  if (!email) {
    notifications.error('El email es requerido')
    return false
  }
  if (password.length < 6) {
    notifications.warning('La contraseña debe tener al menos 6 caracteres')
    return false
  }
  return true
}
```

## Configuración Avanzada

### Personalizar el Toaster

```tsx
<Toaster 
  position="bottom-center"
  richColors={false}
  closeButton={false}
  duration={6000}
  expand={true}
  maxToasts={3}
/>
```

### Opciones por Notificación

```tsx
notifications.success('Mensaje', {
  duration: 10000,
  action: {
    label: 'Deshacer',
    onClick: () => undoAction()
  }
})
```

## Migración desde otros sistemas

Si tienes componentes que usan otros sistemas de notificación:

1. **SuccessMessage**: Mantener para mensajes persistentes importantes
2. **Alertas nativas**: Reemplazar con Sonner
3. **Console.log**: Complementar con notificaciones visuales

## Debugging

Para desarrollo, puedes ver las notificaciones en la consola:

```tsx
if (import.meta.env.DEV) {
  notifications.success('Debug: Operación completada')
}
```

---

¡Sonner está listo para usar en toda tu aplicación! 🚀

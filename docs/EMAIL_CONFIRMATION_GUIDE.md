# Email Confirmation Guide

## ⏰ Caducidad de Emails de Confirmación

### Tiempo de Caducidad
- **Duración**: Los enlaces de confirmación de email caducan después de **24 horas**
- **Configuración**: Este tiempo está configurado por defecto en Supabase
- **Recomendación**: Los usuarios deben verificar su email lo antes posible

### Información para Usuarios
```
Los enlaces de confirmación caducan en 24 horas
• Revisa tu bandeja de entrada y carpeta de spam
• Si no recibiste el email, puedes reenviarlo
• Si el email está mal, puedes cambiarlo
```

## 🔄 Nuevas Funcionalidades de SweetAlert2

### 1. Alerta de Email No Confirmado
```typescript
import { showEmailNotConfirmed } from '../utils/sweetalert.ts'

await showEmailNotConfirmed(
  'usuario@ejemplo.com',
  async () => {
    // Función para reenviar email
    await resendConfirmationEmail.mutateAsync(email)
    showEmailResent(email)
  },
  async () => {
    // Función para cambiar email
    await showChangeEmail(email, changeEmailFunction)
  }
)
```

**Características:**
- ✅ Muestra información sobre caducidad (24 horas)
- ✅ Botón para reenviar email
- ✅ Botón para cambiar email
- ✅ Información sobre revisar spam
- ✅ Diseño responsivo y accesible

### 2. Alerta de Email Reenviado
```typescript
import { showEmailResent } from '../utils/sweetalert.ts'

showEmailResent('usuario@ejemplo.com')
```

**Características:**
- ✅ Confirma que el email fue reenviado
- ✅ Muestra el email de destino
- ✅ Recuerda la caducidad de 24 horas
- ✅ Instrucciones claras

### 3. Alerta de Cambio de Email
```typescript
import { showChangeEmail } from '../utils/sweetalert.ts'

await showChangeEmail(
  'usuario@ejemplo.com',
  async (newEmail) => {
    await changeEmail.mutateAsync({ 
      currentEmail: 'usuario@ejemplo.com', 
      newEmail 
    })
    showEmailResent(newEmail)
  }
)
```

**Características:**
- ✅ Campo de input para nuevo email
- ✅ Validación de formato de email
- ✅ Verificación de que el email sea diferente
- ✅ Envío automático de confirmación al nuevo email

## 🛠️ Implementación en el Backend

### Endpoint para Cambiar Email
```typescript
// POST /api/auth/change-email
{
  "currentEmail": "usuario@ejemplo.com",
  "newEmail": "nuevo@ejemplo.com"
}
```

**Validaciones:**
- ✅ Usuario existe con el email actual
- ✅ Usuario no está confirmado
- ✅ Nuevo email no está en uso
- ✅ Formato de email válido

### Endpoint para Reenviar Email
```typescript
// POST /api/auth/resend-confirmation
{
  "email": "usuario@ejemplo.com"
}
```

**Funcionalidades:**
- ✅ Reenvía email de confirmación
- ✅ Rate limiting para prevenir spam
- ✅ Manejo de errores específicos

## 📱 Uso en Componentes

### Ejemplo en Login
```typescript
// En auth.tsx
if (errorMessage.includes('Email no confirmado')) {
  await showEmailNotConfirmed(
    formData.email,
    async () => {
      await resendConfirmationEmail.mutateAsync(formData.email)
      showEmailResent(formData.email)
    },
    async () => {
      await showChangeEmail(
        formData.email,
        async (newEmail) => {
          await changeEmail.mutateAsync({ 
            currentEmail: formData.email, 
            newEmail 
          })
          showEmailResent(newEmail)
        }
      )
    }
  )
}
```

### Ejemplo en Registro
```typescript
// Después del registro exitoso
if (result.emailConfirmationRequired) {
  setSuccessMessage(
    `¡Cuenta creada exitosamente! 🎉\n\n` +
    `Hemos enviado un email de confirmación a ${formData.email}.\n\n` +
    `• Los enlaces caducan en 24 horas\n` +
    `• Revisa tu bandeja de entrada y spam\n` +
    `• Puedes reenviar el email si no lo recibes`
  )
}
```

## 🎨 Personalización de Alertas

### Configuración de Estilos
```typescript
const emailAlertConfig = {
  confirmButtonColor: '#3b82f6', // Blue
  denyButtonColor: '#6b7280',    // Gray
  cancelButtonColor: '#6b7280',  // Gray
  customClass: {
    popup: 'rounded-lg shadow-xl',
    confirmButton: 'px-6 py-2 rounded-lg font-medium',
    denyButton: 'px-6 py-2 rounded-lg font-medium',
    cancelButton: 'px-6 py-2 rounded-lg font-medium',
    title: 'text-xl font-semibold',
    htmlContainer: 'text-gray-700'
  }
}
```

### Contenido HTML Personalizado
```typescript
html: `
  <div class="text-left">
    <p class="mb-4">El email <strong>${email}</strong> no ha sido verificado.</p>
    <p class="text-sm text-gray-600 mb-4">
      • Los enlaces de confirmación caducan en <strong>24 horas</strong><br>
      • Revisa tu bandeja de entrada y carpeta de spam<br>
      • Si no recibiste el email, puedes reenviarlo
    </p>
  </div>
`
```

## 🔒 Consideraciones de Seguridad

### Rate Limiting
- ✅ Límite de reenvíos por email
- ✅ Límite de cambios de email por usuario
- ✅ Prevención de spam y abuso

### Validaciones
- ✅ Solo usuarios no confirmados pueden cambiar email
- ✅ Verificación de que el nuevo email no esté en uso
- ✅ Validación de formato de email
- ✅ Logs de seguridad para auditoría

### Logs de Seguridad
```typescript
logger.logSecurityEvent({
  level: 'info',
  message: 'Email confirmation resent',
  data: { email, userId },
  userId,
  ipAddress: c.req.header('x-forwarded-for') || 'unknown'
})
```

## 📊 Métricas y Monitoreo

### Métricas a Seguir
- **Tasa de confirmación**: % de emails confirmados vs enviados
- **Tiempo promedio**: Tiempo desde envío hasta confirmación
- **Reenvíos**: Número de reenvíos por usuario
- **Cambios de email**: Frecuencia de cambios de email

### Alertas
- ✅ Email no confirmado después de 24 horas
- ✅ Múltiples reenvíos del mismo usuario
- ✅ Cambios frecuentes de email
- ✅ Errores en el envío de emails

## 🚀 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Notificaciones push para recordar confirmación
- [ ] Integración con WhatsApp para confirmación
- [ ] Templates de email personalizables
- [ ] Estadísticas de confirmación en dashboard
- [ ] Auto-confirmación en desarrollo

### Optimizaciones
- [ ] Cache de emails reenviados
- [ ] Cola de envío de emails
- [ ] Retry automático en caso de fallo
- [ ] Métricas en tiempo real

---

**Estado**: ✅ Implementado  
**Fecha**: 24 de Agosto, 2025  
**Versión**: 1.0.0 
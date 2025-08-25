import Swal from 'sweetalert2'

// Configuración global de SweetAlert2
const defaultConfig = {
  confirmButtonColor: '#3b82f6', // Blue
  cancelButtonColor: '#6b7280', // Gray
  background: '#ffffff',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  customClass: {
    popup: 'rounded-lg shadow-xl',
    confirmButton: 'px-6 py-2 rounded-lg font-medium',
    cancelButton: 'px-6 py-2 rounded-lg font-medium',
    title: 'text-xl font-semibold',
    htmlContainer: 'text-gray-700'
  }
}

// Configurar SweetAlert2 globalmente
Swal.mixin(defaultConfig)

/**
 * Muestra una alerta de éxito
 */
export const showSuccess = (
  title: string, 
  message?: string, 
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    ...options
  })
}

/**
 * Muestra una alerta de error
 */
export const showError = (
  title: string, 
  message?: string, 
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Entendido',
    ...options
  })
}

/**
 * Muestra una alerta de advertencia
 */
export const showWarning = (
  title: string, 
  message?: string, 
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'Entendido',
    ...options
  })
}

/**
 * Muestra una alerta de información
 */
export const showInfo = (
  title: string, 
  message?: string, 
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'Entendido',
    ...options
  })
}

/**
 * Muestra una alerta de confirmación
 */
export const showConfirm = (
  title: string, 
  message?: string, 
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    ...options
  })
}

/**
 * Muestra una alerta de confirmación para acciones destructivas
 */
export const showDeleteConfirm = (
  title: string, 
  message?: string, 
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message || 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626', // Red
    reverseButtons: true,
    ...options
  })
}

/**
 * Muestra una alerta de email no confirmado con opciones de reenvío y cambio
 */
export const showEmailNotConfirmed = (
  email: string,
  onResendEmail: () => Promise<void>,
  onChangeEmail: () => void
) => {
  return Swal.fire({
    icon: 'warning',
    title: 'Email no verificado',
    html: `
      <div class="text-left">
        <p class="mb-4">El email <strong>${email}</strong> no ha sido verificado.</p>
        <p class="text-sm text-gray-600 mb-4">
          • Los enlaces de confirmación caducan en <strong>24 horas</strong><br>
          • Revisa tu bandeja de entrada y carpeta de spam<br>
          • Si no recibiste el email, puedes reenviarlo
        </p>
      </div>
    `,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Reenviar email',
    denyButtonText: 'Cambiar email',
    cancelButtonText: 'Cerrar',
    confirmButtonColor: '#3b82f6',
    denyButtonColor: '#6b7280',
    reverseButtons: true,
    preConfirm: async () => {
      try {
        await onResendEmail()
        return true
      } catch (error) {
        Swal.showValidationMessage(`Error al reenviar: ${error}`)
        return false
      }
    },
    preDeny: () => {
      onChangeEmail()
      return false
    }
  })
}

/**
 * Muestra una alerta de email reenviado exitosamente
 */
export const showEmailResent = (email: string) => {
  return Swal.fire({
    icon: 'success',
    title: 'Email reenviado',
    html: `
      <div class="text-left">
        <p>Se ha reenviado el email de confirmación a:</p>
        <p class="font-semibold text-blue-600">${email}</p>
        <p class="text-sm text-gray-600 mt-2">
          • Revisa tu bandeja de entrada<br>
          • El enlace caduca en <strong>24 horas</strong>
        </p>
      </div>
    `,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#3b82f6'
  })
}

/**
 * Muestra una alerta de cambio de email
 */
export const showChangeEmail = (
  currentEmail: string,
  onEmailChange: (newEmail: string) => Promise<void>
) => {
  return Swal.fire({
    icon: 'question',
    title: 'Cambiar email',
    html: `
      <div class="text-left mb-4">
        <p>Email actual: <strong>${currentEmail}</strong></p>
        <p class="text-sm text-gray-600 mt-2">
          Ingresa el nuevo email donde quieres recibir la confirmación
        </p>
      </div>
    `,
    input: 'email',
    inputPlaceholder: 'nuevo@email.com',
    inputValue: currentEmail,
    showCancelButton: true,
    confirmButtonText: 'Cambiar email',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3b82f6',
    inputValidator: (value) => {
      if (!value) {
        return 'Por favor ingresa un email'
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Por favor ingresa un email válido'
      }
      if (value === currentEmail) {
        return 'El nuevo email debe ser diferente al actual'
      }
      return undefined
    },
    preConfirm: async (newEmail) => {
      try {
        await onEmailChange(newEmail)
        return newEmail
      } catch (error) {
        Swal.showValidationMessage(`Error al cambiar email: ${error}`)
        return false
      }
    }
  })
}

/**
 * Muestra una alerta de carga
 */
export const showLoading = (
  title: string = 'Cargando...',
  message?: string
) => {
  return Swal.fire({
    title,
    text: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading()
    }
  })
}

/**
 * Cierra la alerta actual
 */
export const closeAlert = () => {
  Swal.close()
}

/**
 * Muestra una alerta de input
 */
export const showInput = (
  title: string,
  inputPlaceholder?: string,
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    title,
    input: 'text',
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Por favor ingresa un valor'
      }
      return undefined
    },
    ...options
  })
}

/**
 * Muestra una alerta de email
 */
export const showEmailInput = (
  title: string,
  inputPlaceholder?: string,
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    title,
    input: 'email',
    inputPlaceholder: inputPlaceholder || 'tu@email.com',
    showCancelButton: true,
    confirmButtonText: 'Enviar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Por favor ingresa un email'
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Por favor ingresa un email válido'
      }
      return undefined
    },
    ...options
  })
}

/**
 * Muestra una alerta de contraseña
 */
export const showPasswordInput = (
  title: string,
  inputPlaceholder?: string,
  options?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    title,
    input: 'password',
    inputPlaceholder: inputPlaceholder || 'Ingresa tu contraseña',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Por favor ingresa tu contraseña'
      }
      return undefined
    },
    ...options
  })
}

/**
 * Muestra una alerta de selección
 */
export const showSelect = (
  title: string,
  options: string[],
  placeholder?: string,
  optionsConfig?: Partial<typeof Swal.fire>
) => {
  return Swal.fire({
    title,
    input: 'select',
    inputOptions: options.reduce((acc, option) => {
      acc[option] = option
      return acc
    }, {} as Record<string, string>),
    inputPlaceholder: placeholder || 'Selecciona una opción',
    showCancelButton: true,
    confirmButtonText: 'Seleccionar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Por favor selecciona una opción'
      }
      return undefined
    },
    ...optionsConfig
  })
}

// Exportar Swal para uso directo si es necesario
export { Swal } 
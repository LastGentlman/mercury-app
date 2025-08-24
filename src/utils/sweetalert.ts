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
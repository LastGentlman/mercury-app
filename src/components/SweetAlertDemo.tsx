
import { Button } from './ui/button.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx'
import { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showConfirm, 
  showDeleteConfirm,
  showInput,
  showEmailInput,
  showPasswordInput,
  showSelect,
  showLoading,
  closeAlert,
  showEmailNotConfirmed,
  showEmailResent,
  showChangeEmail
} from '../utils/sweetalert.ts'

export function SweetAlertDemo() {
  const handleBasicAlerts = () => {
    showSuccess('¡Éxito!', 'Esta es una alerta de éxito')
  }

  const handleErrorAlert = () => {
    showError('Error', 'Esta es una alerta de error')
  }

  const handleWarningAlert = () => {
    showWarning('Advertencia', 'Esta es una alerta de advertencia')
  }

  const handleInfoAlert = () => {
    showInfo('Información', 'Esta es una alerta informativa')
  }

  const handleConfirmAlert = async () => {
    const result = await showConfirm(
      '¿Estás seguro?',
      'Esta es una alerta de confirmación. ¿Quieres continuar?'
    )
    
    if (result.isConfirmed) {
      showSuccess('Confirmado', 'Has confirmado la acción')
    } else {
      showInfo('Cancelado', 'Has cancelado la acción')
    }
  }

  const handleDeleteConfirm = async () => {
    const result = await showDeleteConfirm(
      'Eliminar elemento',
      '¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.'
    )
    
    if (result.isConfirmed) {
      showSuccess('Eliminado', 'El elemento ha sido eliminado')
    }
  }

  const handleInputAlert = async () => {
    const result = await showInput(
      'Ingresa tu nombre',
      'Nombre completo'
    )
    
    if (result.isConfirmed) {
      showSuccess('Nombre guardado', `Hola, ${result.value}!`)
    }
  }

  const handleEmailInput = async () => {
    const result = await showEmailInput(
      'Ingresa tu email',
      'tu@email.com'
    )
    
    if (result.isConfirmed) {
      showSuccess('Email guardado', `Email: ${result.value}`)
    }
  }

  const handlePasswordInput = async () => {
    const result = await showPasswordInput(
      'Ingresa tu contraseña'
    )
    
    if (result.isConfirmed) {
      showSuccess('Contraseña validada', 'Contraseña correcta')
    }
  }

  const handleSelectAlert = async () => {
    const options = ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4']
    
    const result = await showSelect(
      'Selecciona una opción',
      options,
      'Elige una opción'
    )
    
    if (result.isConfirmed) {
      showSuccess('Opción seleccionada', `Has elegido: ${result.value}`)
    }
  }

  const handleLoadingAlert = async () => {
    // Mostrar loading
    showLoading('Procesando...', 'Por favor espera')
    
    // Simular operación asíncrona
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Cerrar loading
    closeAlert()
    
    // Mostrar resultado
    showSuccess('Completado', 'La operación se ha completado exitosamente')
  }

  const handleEmailNotConfirmed = async () => {
    await showEmailNotConfirmed(
      'usuario@ejemplo.com',
      async () => {
        // Simular reenvío de email
        await new Promise(resolve => setTimeout(resolve, 1000))
        showEmailResent('usuario@ejemplo.com')
      },
      async () => {
        await showChangeEmail(
          'usuario@ejemplo.com',
          async (newEmail) => {
            // Simular cambio de email
            await new Promise(resolve => setTimeout(resolve, 1000))
            showEmailResent(newEmail)
          }
        )
      }
    )
  }

  const handleEmailResent = () => {
    showEmailResent('nuevo@ejemplo.com')
  }

  const handleChangeEmail = async () => {
    await showChangeEmail(
      'usuario@ejemplo.com',
      async (newEmail) => {
        // Simular cambio de email
        await new Promise(resolve => setTimeout(resolve, 1000))
        showEmailResent(newEmail)
      }
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SweetAlert2 Demo
        </h1>
        <p className="text-gray-600">
          Demostración de diferentes tipos de alertas con SweetAlert2
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Alertas Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas Básicas</CardTitle>
            <CardDescription>
              Alertas simples para diferentes tipos de mensajes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleBasicAlerts} className="w-full">
              Alerta de Éxito
            </Button>
            <Button onClick={handleErrorAlert} variant="destructive" className="w-full">
              Alerta de Error
            </Button>
            <Button onClick={handleWarningAlert} variant="outline" className="w-full">
              Alerta de Advertencia
            </Button>
            <Button onClick={handleInfoAlert} variant="secondary" className="w-full">
              Alerta Informativa
            </Button>
          </CardContent>
        </Card>

        {/* Alertas de Confirmación */}
        <Card>
          <CardHeader>
            <CardTitle>Confirmaciones</CardTitle>
            <CardDescription>
              Alertas que requieren confirmación del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleConfirmAlert} variant="outline" className="w-full">
              Confirmación Simple
            </Button>
            <Button onClick={handleDeleteConfirm} variant="destructive" className="w-full">
              Confirmación de Eliminación
            </Button>
          </CardContent>
        </Card>

        {/* Alertas de Input */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>
              Alertas con campos de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleInputAlert} variant="outline" className="w-full">
              Input de Texto
            </Button>
            <Button onClick={handleEmailInput} variant="outline" className="w-full">
              Input de Email
            </Button>
            <Button onClick={handlePasswordInput} variant="outline" className="w-full">
              Input de Contraseña
            </Button>
            <Button onClick={handleSelectAlert} variant="outline" className="w-full">
              Selector de Opciones
            </Button>
          </CardContent>
        </Card>

        {/* Alertas de Carga */}
        <Card>
          <CardHeader>
            <CardTitle>Carga</CardTitle>
            <CardDescription>
              Alertas de carga para operaciones asíncronas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLoadingAlert} className="w-full">
              Mostrar Loading
            </Button>
          </CardContent>
        </Card>

        {/* Alertas de Email */}
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Alertas específicas para manejo de emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleEmailNotConfirmed} variant="outline" className="w-full">
              Email No Confirmado
            </Button>
            <Button onClick={handleEmailResent} variant="outline" className="w-full">
              Email Reenviado
            </Button>
            <Button onClick={handleChangeEmail} variant="outline" className="w-full">
              Cambiar Email
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Características de SweetAlert2</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Ventajas:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Alertas más atractivas y profesionales</li>
                <li>• Mejor experiencia de usuario</li>
                <li>• Fácil personalización</li>
                <li>• Soporte para diferentes tipos de input</li>
                <li>• Animaciones suaves</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Casos de uso:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Confirmaciones de acciones destructivas</li>
                <li>• Recopilación rápida de información</li>
                <li>• Notificaciones de éxito/error</li>
                <li>• Selección de opciones</li>
                <li>• Indicadores de carga</li>
                <li>• Validación de formularios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
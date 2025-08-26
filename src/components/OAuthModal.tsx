import { useEffect, useState, useRef } from 'react'
import { X } from 'lucide-react'
import { AuthService } from '../services/auth-service.ts'
import type { OAuthProvider } from '../hooks/useOAuthModal.ts'

interface OAuthModalProps {
  isOpen: boolean
  provider: OAuthProvider | null
  step: 'confirm' | 'redirecting' | 'error'
  error: string | undefined
  onClose: () => void
  onError: (error: string) => void
  onSetStep: (step: 'confirm' | 'redirecting' | 'error', error?: string) => void
}

const PROVIDER_CONFIG = {
  google: {
    name: 'Google',
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    icon: '🔍', // Puedes reemplazar con un icono real
    description: 'Accede con tu cuenta de Google de forma rápida y segura'
  },
  facebook: {
    name: 'Facebook', 
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    icon: '📘', // Puedes reemplazar con un icono real
    description: 'Conecta usando tu perfil de Facebook'
  }
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  provider,
  step,
  error,
  onClose,
  onError,
  onSetStep
}) => {
  const [isOpening, setIsOpening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const handleProceed = async () => {
    if (!provider) return
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    setIsProcessing(true)
      
    try {
      onSetStep('redirecting')
        
      // Guardar contexto para cuando regrese
      const context = {
        returnTo: globalThis.location.pathname,
        timestamp: Date.now(),
        provider: provider,
        source: 'modal'
      }
        
      sessionStorage.setItem('oauth_modal_context', JSON.stringify(context))
      console.log('💾 Contexto guardado:', context)
        
      // Pequeño delay para mostrar el loading state
      await new Promise(resolve => setTimeout(resolve, 800))
        
      // Redirect usando el AuthService actualizado
      await AuthService.socialLogin({ 
        provider, 
        redirectTo: `${globalThis.location.origin}/auth/callback?source=modal`
      })
        
    } catch (error: unknown) {
      console.error('❌ Error en OAuth modal:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al conectar con el proveedor'
      onError(errorMessage)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && step === 'confirm') {
      onClose()
    }
  }

  // Cerrar con ESC solo en paso de confirmación
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step === 'confirm') {
        onClose()
      }
    }
    
    // Handle Enter key for confirmation
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && step === 'confirm' && isOpen) {
        handleProceed()
      }
    }
      
    if (isOpen) {
      setIsOpening(true)
      document.addEventListener('keydown', handleEsc)
      document.addEventListener('keydown', handleEnter)
      document.body.style.overflow = 'hidden' // Prevenir scroll
      
      // Remove opening state after animation and focus modal
      const timer = setTimeout(() => {
        setIsOpening(false)
        modalRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer)
    }
      
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.removeEventListener('keydown', handleEnter)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, step, onClose])

  if (!isOpen || !provider) return null

  const config = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG]

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-modal-title"
      aria-describedby="oauth-modal-description"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
          isOpening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
          
        {/* Header */}
        <div className={`${config.color} px-6 py-4 text-white relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <h3 id="oauth-modal-title" className="text-lg font-semibold">
                Conectar con {config.name}
              </h3>
            </div>
            {step === 'confirm' && (
              <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
            
          {/* Confirmation Step */}
          {step === 'confirm' && (
            <>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 ${config.color.replace('bg-', 'bg-').replace('500', '100').replace('600', '100')} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl">{config.icon}</span>
                </div>
                <p id="oauth-modal-description" className="text-gray-600 text-sm leading-relaxed">
                  {config.description}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Conexión segura y encriptada</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>No compartimos tu información personal</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Puedes revocar el acceso cuando quieras</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-3 ${config.color} ${config.hoverColor} text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    'Continuar'
                  )}
                </button>
              </div>
            </>
          )}

          {/* Redirecting Step */}
          {step === 'redirecting' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className={`w-16 h-16 border-4 border-gray-200 rounded-full`}></div>
                <div className={`w-16 h-16 border-4 border-t-${config.color.split('-')[1]}-500 rounded-full animate-spin absolute top-0`}></div>
              </div>
              <h4 className="text-lg font-medium mb-2">Redirigiendo a {config.name}...</h4>
              <p className="text-gray-600 text-sm mb-4">
                Te llevamos a {config.name} para completar la autenticación de forma segura
              </p>
                
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-left">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>💡 Consejo:</strong> Si no eres redirigido automáticamente en unos segundos:
                    </p>
                    <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                      <li>Verifica tu conexión a internet</li>
                      <li>Intenta actualizar la página</li>
                      <li>Si el problema persiste, contacta soporte</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-lg font-medium mb-2 text-red-600">Error de Conexión</h4>
              <p className="text-gray-600 text-sm mb-6">
                {error || 'Hubo un problema al conectar con el proveedor'}
              </p>
                
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => onSetStep('confirm')}
                  className={`flex-1 px-4 py-3 ${config.color} ${config.hoverColor} text-white rounded-lg transition-colors`}
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
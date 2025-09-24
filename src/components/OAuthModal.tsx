import { useEffect, useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { OAuthProvider } from '../hooks/useOAuthModal.ts'

interface OAuthModalProps {
  isOpen: boolean
  provider: OAuthProvider | null
  error: string | undefined
  onClose: () => void
  onError: (error: string) => void
  onRetry?: (provider: OAuthProvider) => Promise<void>
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
  error,
  onClose,
  onError,
  onRetry
}) => {
  const [isOpening, setIsOpening] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // 🎯 OPTIMIZACIÓN: Solo mostrar modal para errores
  useEffect(() => {
    if (isOpen) {
      setIsOpening(true)
      document.body.style.overflow = 'hidden' // Prevenir scroll
      
      // 🎯 OPTIMIZACIÓN: Transición más rápida para reducir parpadeo
      const timer = setTimeout(() => {
        setIsOpening(false)
        modalRef.current?.focus()
      }, 200) // Reducido de 300 a 200ms
      return () => clearTimeout(timer)
    }
      
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // 🎯 OPTIMIZACIÓN: Solo mostrar modal si hay error
  if (!isOpen || !provider || !error) return null

  const config = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG]

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-modal-title"
      aria-describedby="oauth-modal-description"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-200 ${
          isOpening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
          
        {/* Header */}
        <div className={`${config.color} px-6 py-4 text-white relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <h3 id="oauth-modal-title" className="text-lg font-semibold">
                Error de Conexión con {config.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Solo Error Step */}
        <div className="p-6">
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
                onClick={() => {
                  onClose()
                  // Intentar de nuevo después de cerrar el modal
                  if (onRetry && provider) {
                    setTimeout(() => {
                      onRetry(provider).catch((retryError) => {
                        console.error('Retry failed:', retryError)
                        const errorMessage = retryError instanceof Error ? retryError.message : 'Error al conectar con el proveedor'
                        onError(errorMessage)
                      })
                    }, 100)
                  }
                }}
                className={`flex-1 px-4 py-3 ${config.color} ${config.hoverColor} text-white rounded-lg transition-colors`}
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
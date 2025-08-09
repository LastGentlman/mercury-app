import { useState } from 'react'
import { X, Store, Users, Plus } from 'lucide-react'
import { Button } from './ui/button'

interface BusinessSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onBusinessCreated: (businessId: string) => void
}

export function BusinessSetupModal({ isOpen, onClose, onBusinessCreated }: BusinessSetupModalProps) {
  const [step, setStep] = useState<'choose' | 'create' | 'join'>('choose')
  const [businessName, setBusinessName] = useState('')
  const [businessCode, setBusinessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateBusiness = async () => {
    if (!businessName.trim()) return
    
    setIsLoading(true)
    try {
      // Simular creación de negocio
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockBusinessId = `business-${Date.now()}`
      onBusinessCreated(mockBusinessId)
      onClose()
    } catch (error) {
      console.error('Error creating business:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinBusiness = async () => {
    if (!businessCode.trim()) return
    
    setIsLoading(true)
    try {
      // Simular unirse a negocio
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockBusinessId = `business-${businessCode}`
      onBusinessCreated(mockBusinessId)
      onClose()
    } catch (error) {
      console.error('Error joining business:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Configurar Negocio
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                ¿Cómo quieres configurar tu negocio?
              </p>
              
              <Button
                onClick={() => setStep('create')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center justify-center space-x-3"
                size="lg"
              >
                <Store className="w-5 h-5" />
                <span>Crear Nuevo Negocio</span>
              </Button>
              
              <Button
                onClick={() => setStep('join')}
                variant="outline"
                className="w-full py-3 flex items-center justify-center space-x-3"
                size="lg"
              >
                <Users className="w-5 h-5" />
                <span>Unirse a Negocio Existente</span>
              </Button>
            </div>
          )}

          {step === 'create' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Crear Nuevo Negocio
                </h3>
                <p className="text-gray-600">
                  Crea tu propio negocio para comenzar a recibir pedidos
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej: Mi Restaurante"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setStep('choose')}
                  variant="outline"
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleCreateBusiness}
                  disabled={!businessName.trim() || isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Creando...' : 'Crear Negocio'}
                </Button>
              </div>
            </div>
          )}

          {step === 'join' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unirse a Negocio
                </h3>
                <p className="text-gray-600">
                  Únete a un negocio existente usando el código de invitación
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Negocio
                </label>
                <input
                  type="text"
                  value={businessCode}
                  onChange={(e) => setBusinessCode(e.target.value)}
                  placeholder="Ej: ABC123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setStep('choose')}
                  variant="outline"
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleJoinBusiness}
                  disabled={!businessCode.trim() || isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Uniéndose...' : 'Unirse'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
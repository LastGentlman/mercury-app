import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Gift, 
  CreditCard, 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  Shield,
  AlertCircle
} from 'lucide-react'
import { Button } from '../components/ui/index.ts'
import { Input } from '../components/ui/index.ts'
import { Label } from '../components/ui/index.ts'
import { useNotifications } from '../hooks/useNotifications.ts'
import { useTrialStatus } from '../hooks/useTrialStatus.ts'

function ExtendTrialPage() {
  const { trialStatus, extendTrial } = useTrialStatus()
  const notifications = useNotifications()
  
  const [isLoading, setIsLoading] = useState(false)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    name: ''
  })

  // Redirigir si no está en trial o no puede extender
  useEffect(() => {
    if (!trialStatus.isLoading && (!trialStatus.isTrialing || !trialStatus.canExtend)) {
      window.location.href = '/dashboard'
    }
  }, [trialStatus])

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }))
  }

  const handleExtendTrial = async () => {
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvc || !paymentData.name) {
      notifications.error('Por favor completa todos los campos')
      return
    }

    setIsLoading(true)
    try {
      const [month, year] = paymentData.expiryDate.split('/')
      if (!month || !year) {
        notifications.error('Por favor ingresa una fecha de vencimiento válida')
        return
      }
      
      const paymentMethod = {
        number: paymentData.cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(month),
        exp_year: parseInt(`20${year}`),
        cvc: paymentData.cvc
      }

      await extendTrial(paymentMethod)
      notifications.success('¡Trial extendido exitosamente! Ahora tienes 14 días completos.')
      
      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)

    } catch (error) {
      console.error('Error extending trial:', error)
      notifications.error(error instanceof Error ? error.message : 'Error al extender el trial')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    window.history.back()
  }

  if (trialStatus.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del trial...</p>
        </div>
      </div>
    )
  }

  if (!trialStatus.isTrialing || !trialStatus.canExtend) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No disponible</h1>
          <p className="text-gray-600 mb-6">No puedes extender tu trial en este momento.</p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Ir al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Extender Trial</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Trial Status Card */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">¡Extiende tu trial gratis!</h2>
              <p className="text-orange-100 mb-4">
                Agrega un método de pago y obtén <strong>7 días adicionales</strong> gratis. 
                Total: <strong>14 días de prueba</strong> sin compromiso.
              </p>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {trialStatus.daysRemaining === 1 ? 'Último día' : `${trialStatus.daysRemaining} días restantes`}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Sin cargo hasta el final</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Información de Pago
          </h3>
          
          <div className="space-y-6">
            {/* Card Number */}
            <div>
              <Label htmlFor="cardNumber">Número de Tarjeta</Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
                  handleInputChange('cardNumber', value)
                }}
                maxLength={19}
              />
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/')
                    handleInputChange('expiryDate', value)
                  }}
                  maxLength={5}
                />
              </div>
              
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  type="text"
                  placeholder="123"
                  value={paymentData.cvc}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    handleInputChange('cvc', value)
                  }}
                  maxLength={4}
                />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <Label htmlFor="name">Nombre del Titular</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={paymentData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-medium mb-1">Pago Seguro</p>
              <p>Tus datos están protegidos con encriptación de nivel bancario. No almacenamos información de tu tarjeta.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleExtendTrial}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Extendiendo Trial...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Extender Trial (+7 días gratis)
              </>
            )}
          </Button>
          
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="sm:w-auto"
          >
            Cancelar
          </Button>
        </div>

        {/* Terms */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Al extender tu trial, aceptas nuestros términos de servicio. 
            No se realizará ningún cargo hasta que termine tu período de prueba.
          </p>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/extend-trial')({
  component: ExtendTrialPage,
})

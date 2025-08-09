import React, { useState } from 'react'
import { Store, MapPin, Clock, Check, ArrowRight, Building2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

interface BusinessFormData {
  name: string
  type: string
  description: string
  address: string
  phone: string
  email: string
  openingHours: string
  closingHours: string
}

const businessTypes = [
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'retail', label: 'Tienda' },
  { value: 'cafe', label: 'Cafetería' },
  { value: 'bakery', label: 'Panadería' },
  { value: 'grocery', label: 'Supermercado' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'other', label: 'Otro' }
]

export function BusinessSetup() {
  const { user } = useAuth()
  const notifications = useNotifications()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    type: '',
    description: '',
    address: '',
    phone: '',
    email: user?.email || '',
    openingHours: '09:00',
    closingHours: '18:00'
  })

  const steps = [
    {
      title: 'Información Básica',
      description: 'Datos principales de tu negocio',
      icon: Store
    },
    {
      title: 'Ubicación y Contacto',
      description: 'Dónde encontrarte y cómo contactarte',
      icon: MapPin
    },
    {
      title: 'Horarios',
      description: 'Cuándo estás disponible',
      icon: Clock
    }
  ]

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // En una implementación real, aquí enviarías los datos al backend
      console.log('Datos del negocio:', formData)
      
      notifications.success('¡Negocio configurado exitosamente!')
      
      // Redireccionar al dashboard principal
      window.location.reload()
    } catch (error) {
      notifications.error('Error al configurar el negocio')
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.type && formData.description
      case 1:
        return formData.address && formData.phone && formData.email
      case 2:
        return formData.openingHours && formData.closingHours
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del Negocio *</Label>
              <Input
                id="businessName"
                placeholder="Ej: Mi Restaurante"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessType">Tipo de Negocio *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de negocio" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe tu negocio en pocas palabras..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>
          </div>
        )
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                placeholder="Calle, número, ciudad..."
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email de Contacto *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contacto@negocio.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="text-base"
              />
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingHours">Hora de Apertura *</Label>
                <Input
                  id="openingHours"
                  type="time"
                  value={formData.openingHours}
                  onChange={(e) => handleInputChange('openingHours', e.target.value)}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingHours">Hora de Cierre *</Label>
                <Input
                  id="closingHours"
                  type="time"
                  value={formData.closingHours}
                  onChange={(e) => handleInputChange('closingHours', e.target.value)}
                  className="text-base"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Vista Previa de tu Negocio</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>{formData.name}</strong></p>
                <p>{businessTypes.find(t => t.value === formData.type)?.label}</p>
                <p>{formData.description}</p>
                <p>{formData.address}</p>
                <p>{formData.phone} • {formData.email}</p>
                <p>Horario: {formData.openingHours} - {formData.closingHours}</p>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configura tu Negocio</h1>
          <p className="text-gray-600">
            Solo tomará unos minutos configurar tu negocio para comenzar a recibir pedidos
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                index <= currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 transition-all ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <Card className="p-8 bg-white shadow-xl">
          {/* Step Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              {React.createElement(steps[currentStep]?.icon || Store, { className: "w-6 h-6 text-blue-600" })}
              <h2 className="text-xl font-semibold text-gray-900">
                {steps[currentStep]?.title || 'Configuración'}
              </h2>
            </div>
            <p className="text-gray-600">{steps[currentStep]?.description || 'Configurando tu negocio'}</p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6"
            >
              Anterior
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid() || isLoading}
                className="px-8"
              >
                {isLoading ? 'Configurando...' : 'Finalizar Configuración'}
                {!isLoading && <Check className="w-4 h-4 ml-2" />}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="px-6"
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Necesitas ayuda? Puedes cambiar esta información más tarde en la configuración
        </p>
      </div>
    </div>
  )
}
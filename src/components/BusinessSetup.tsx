import React, { useState } from 'react';
import { Store, Plus, ArrowRight, Building2, Users, MapPin, LayoutDashboard, ClipboardList, User, Clock, Check, Mail, Sun } from 'lucide-react';
import { Button } from './ui/index.ts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/index.ts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/index.ts';
import { Input } from './ui/index.ts';
import { Label } from './ui/index.ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/index.ts';
import { Alert } from './ui/index.ts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/index.ts';
import { Textarea } from './ui/index.ts';
import { PhoneInput } from './ui/index.ts';
import { useNotifications } from '../hooks/useNotifications.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { useAuthToken } from '../hooks/useStorageSync.ts';
import { useCSRFRequest } from '../hooks/useCSRF.ts';
import { BusinessService } from '../services/business-service.ts';
import { getLocalPhoneNumber } from '../lib/validation/phone.ts';
import { useNavigate } from '@tanstack/react-router';

interface BusinessSetupProps {
  onBusinessSetup?: (businessId: string) => void;
}

interface BusinessFormData {
  name: string;
  type: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  closingHours: string;
  currency: string;
}

const businessTypes = [
  { value: 'restaurant', label: '🍕 Restaurante' },
  { value: 'retail', label: '🛍️ Tienda / Retail' },
  { value: 'services', label: '🔧 Servicios' },
  { value: 'cafe', label: '☕ Cafetería' },
  { value: 'bakery', label: '🥖 Panadería' },
  { value: 'pharmacy', label: '💊 Farmacia' },
  { value: 'other', label: '📦 Otro' }
];

const currencies = [
  { value: 'MXN', label: 'Peso Mexicano (MXN)', symbol: '$' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'CAD', label: 'Dólar Canadiense (CAD)', symbol: 'C$' },
  { value: 'GBP', label: 'Libra Esterlina (GBP)', symbol: '£' },
  { value: 'JPY', label: 'Yen Japonés (JPY)', symbol: '¥' },
  { value: 'AUD', label: 'Dólar Australiano (AUD)', symbol: 'A$' },
  { value: 'CHF', label: 'Franco Suizo (CHF)', symbol: 'CHF' },
  { value: 'CNY', label: 'Yuan Chino (CNY)', symbol: '¥' },
  { value: 'BRL', label: 'Real Brasileño (BRL)', symbol: 'R$' }
];

export function BusinessSetup({ onBusinessSetup }: BusinessSetupProps) {
  const { user } = useAuth();
  const { value: authToken } = useAuthToken();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const notifications = useNotifications();
  const { csrfRequest } = useCSRFRequest();

  // Form states for new business
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    type: '',
    description: '',
    address: '',
    phone: '',
    email: user?.email || '',
    openingHours: '09:00',
    closingHours: '18:00',
    currency: 'MXN' // Default currency
  });

  // Form state for joining existing business
  const [businessCode, setBusinessCode] = useState('');

  // No necesitamos estado para paywall, redirigiremos a la ruta

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
  ];

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (phone: string): string => {
    // Extraer número local (sin prefijos) y formatear con guiones para legibilidad
    const local = getLocalPhoneNumber(phone).replace(/\D/g, '');
    if (local.length === 10) {
      return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    }
    if (local.length === 11) {
      return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
    if (local.length === 7) {
      return `${local.slice(0, 3)}-${local.slice(3)}`;
    }
    return phone;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const navigate = useNavigate();

  const handleCreateBusiness = async () => {
    if (!formData.name || !formData.type || !formData.currency) {
      notifications.error('Por favor completa todos los campos requeridos');
      return;
    }

    // En lugar de crear el negocio directamente, redirigir al dashboard
    setIsOpen(false);
    // Por ahora redirigimos al dashboard, pero aquí iría la paywall
    navigate({ to: '/dashboard' });
  };

  const handleJoinBusiness = async () => {
    if (!businessCode) {
      notifications.error('Por favor ingresa el código del negocio');
      return;
    }

    // Validate code format (XXX-XXX-XXX)
    const codeRegex = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/;
    if (!codeRegex.test(businessCode)) {
      notifications.error('El código debe tener el formato XXX-XXX-XXX');
      return;
    }

    // Validate code length
    if (businessCode.length !== 11) {
      notifications.error('El código debe tener exactamente 11 caracteres (incluyendo guiones)');
      return;
    }

    setIsLoading(true);
    try {
      // Unirse al negocio usando el servicio real
      const business = await BusinessService.joinBusiness(businessCode, authToken || undefined, csrfRequest);
      
      // Actualizar el perfil del usuario con el businessId
      await BusinessService.updateUserBusiness(business.id, authToken || undefined);

      notifications.success('¡Te has unido al negocio exitosamente!');
      setIsOpen(false);
      onBusinessSetup?.(business.id);
    } catch (error) {
      console.error('Error joining business:', error);
      notifications.error(error instanceof Error ? error.message : 'Código de negocio inválido o expirado');
    } finally {
      setIsLoading(false);
    }
  };



  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        // Si el tipo es "other", la descripción es obligatoria
        if (formData.type === 'other') {
          return formData.name && formData.type && formData.description.trim();
        }
        return formData.name && formData.type;
      case 1:
        return formData.address && formData.phone && formData.email;
      case 2:
        // Si es 24/7, solo se requiere la moneda. Si no, se requieren las horas
        if (formData.openingHours === '24/7') {
          return formData.currency;
        }
        return formData.openingHours && formData.closingHours && formData.currency;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="business-name">
                Nombre del Negocio <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                  id="business-name"
                  placeholder="Mi Restaurante"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10"
              />
              </div>
            </div>
            
            <div>
              <Label htmlFor="business-type">
                Tipo de Negocio <span className="text-red-500">*</span>
              </Label>
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

            <div>
              <Label htmlFor="description">
                Descripción {formData.type === 'other' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="description"
                placeholder={formData.type === 'other' 
                  ? "Describe tu negocio en detalle (requerido para tipo 'Otro')" 
                  : "Describe tu negocio en pocas palabras... (opcional)"
                }
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[80px]"
                required={formData.type === 'other'}
              />
              {formData.type === 'other' && !formData.description.trim() && (
                <p className="text-sm text-red-500 mt-1">
                  La descripción es obligatoria cuando seleccionas "Otro" como tipo de negocio
                </p>
              )}
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="business-address">Dirección <span className="text-red-500">*</span></Label>
              <div className="mt-1 relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                  id="business-address"
                  placeholder="Calle Principal #123"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                  className="pl-10"
              />
              </div>
            </div>

            <div>
              <PhoneInput
                label="Teléfono"
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                placeholder="123 456 7890"
                required
                validateOnChange={true}
              />
            </div>

            <div>
              <Label htmlFor="business-email">Email de Contacto <span className="text-red-500">*</span></Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                  id="business-email"
                placeholder="contacto@negocio.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                  type="email"
                  className="pl-10"
              />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Sun className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Abierto 24/7</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Status Indicator */}
                    <span className={`text-sm font-medium ${
                      formData.openingHours === '24/7' 
                        ? 'text-blue-600' 
                        : 'text-gray-500'
                    }`}>
                      {formData.openingHours === '24/7' ? 'Activado' : 'Desactivado'}
                    </span>
                    
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.openingHours === '24/7') {
                          handleInputChange('openingHours', '09:00');
                          handleInputChange('closingHours', '18:00');
                        } else {
                          handleInputChange('openingHours', '24/7');
                          handleInputChange('closingHours', '24/7');
                        }
                      }}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        formData.openingHours === '24/7' 
                          ? 'bg-blue-600 shadow-lg' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      role="switch"
                      aria-checked={formData.openingHours === '24/7'}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-200 ease-in-out ${
                          formData.openingHours === '24/7' 
                            ? 'translate-x-8' 
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                {formData.openingHours === '24/7' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Activa esta opción si tu negocio está abierto las 24 horas del día, los 7 días de la semana
                  </p>
                )}
              </div>

              {formData.openingHours !== '24/7' && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">O especifica horarios personalizados</span>
                    </div>
                  </div>
                  
                                    <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="opening-hours">Hora de Apertura <span className="text-red-500">*</span></Label>
                      <Input
                        id="opening-hours"
                        type="time"
                        value={formData.openingHours}
                        onChange={(e) => handleInputChange('openingHours', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="closing-hours">Hora de Cierre <span className="text-red-500">*</span></Label>
                      <Input
                        id="closing-hours"
                        type="time"
                        value={formData.closingHours}
                        onChange={(e) => handleInputChange('closingHours', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="business-currency">
                Moneda para Transacciones <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.symbol}</span>
                        <span>{currency.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Vista Previa de tu Negocio</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>{formData.name || 'Nombre del Negocio'}</strong></p>
                <p>{businessTypes.find(t => t.value === formData.type)?.label || 'Tipo de Negocio'}</p>
                <p>
                  {formData.description ? (
                    formData.description
                  ) : (
                    <span className="text-gray-400 italic">— Sin descripción</span>
                  )}
                </p>
                <p>{formData.address || 'Dirección'}</p>
                <p>{formData.phone ? formatPhoneNumber(formData.phone) : 'Teléfono'} • {formData.email || 'Email'}</p>
                <p>Horario: {formData.openingHours === '24/7' ? 'Abierto 24/7' : `${formData.openingHours} - ${formData.closingHours}`}</p>
                <p>Moneda: {currencies.find(c => c.value === formData.currency)?.label || 'MXN - Peso Mexicano'}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-20 md:pb-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-100 rounded-full mb-6">
              <Store className="w-16 h-16 text-blue-600" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PedidoList</h1>
            <p className="text-gray-600">Sistema de Gestión de Pedidos</p>
          </div>

          {/* Main Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Configuración Requerida</CardTitle>
              <CardDescription className="text-base mt-2">
                Aún no tienes un negocio configurado. Para comenzar a recibir pedidos y 
                administrar clientes, primero crea o vincula tu negocio.
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-6">
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <CardDescription className="text-blue-800">
                    <strong>¿Nuevo en PedidoList?</strong> Crea tu negocio en segundos o únete 
                    a uno existente con un código de invitación.
                  </CardDescription>
                </Alert>
              </div>
            </CardContent>

            <CardFooter>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-12 text-base" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Configurar Negocio
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[500px] bg-white">
                  <DialogHeader>
                    <DialogTitle>Configurar tu Negocio</DialogTitle>
                    <DialogDescription>
                      Elige cómo quieres comenzar con PedidoList
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="create" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="create">Crear Nuevo</TabsTrigger>
                      <TabsTrigger value="join">Unirse a Existente</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="space-y-4">
        {/* Progress Steps */}
                      <div className="flex items-center justify-center mb-6">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                index <= currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? (
                                <Check className="w-4 h-4" />
                ) : (
                                <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                              <div className={`w-12 h-0.5 mx-2 transition-all ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

          {/* Step Header */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          {React.createElement(steps[currentStep]?.icon || Store, { className: "w-5 h-5 text-blue-600" })}
                          <h3 className="font-semibold text-gray-900">
                {steps[currentStep]?.title || 'Configuración'}
                          </h3>
            </div>
                        <p className="text-sm text-gray-600">{steps[currentStep]?.description || 'Configurando tu negocio'}</p>
          </div>

          {/* Step Content */}
                      <div className="space-y-4">
            {renderStepContent()}
          </div>

          {/* Navigation */}
                      <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
                          size="sm"
            >
              Anterior
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                            onClick={handleCreateBusiness}
                disabled={!isStepValid() || isLoading}
                            size="sm"
              >
                            {isLoading ? 'Creando...' : 'Crear Negocio'}
                            {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                            size="sm"
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
                    </TabsContent>

                    <TabsContent value="join" className="space-y-4">
                      <div className="pt-4">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                            <Users className="w-8 h-8 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Unirse con Código
                          </h3>
                          <p className="text-sm text-gray-600">
                            Ingresa el código de invitación que recibiste del administrador del negocio
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="business-code">Código de Invitación</Label>
                          <div className="mt-1">
                            <Input
                              id="business-code"
                              placeholder="ABC-123-XYZ"
                              value={businessCode}
                              onChange={(e) => {
                                // Limpiar y formatear código: solo A-Z, 0-9, agregar guiones automáticamente
                                let cleanCode = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                
                                // Limitar a 9 caracteres (sin contar guiones)
                                cleanCode = cleanCode.slice(0, 9);
                                
                                // Agregar guiones automáticamente
                                if (cleanCode.length > 3 && cleanCode.length <= 6) {
                                  cleanCode = cleanCode.slice(0, 3) + '-' + cleanCode.slice(3);
                                } else if (cleanCode.length > 6) {
                                  cleanCode = cleanCode.slice(0, 3) + '-' + cleanCode.slice(3, 6) + '-' + cleanCode.slice(6);
                                }
                                
                                setBusinessCode(cleanCode);
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && businessCode.length === 11) {
                                  handleJoinBusiness();
                                }
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedText = e.clipboardData.getData('text');
                                let cleanCode = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                cleanCode = cleanCode.slice(0, 9);
                                if (cleanCode.length > 3 && cleanCode.length <= 6) {
                                  cleanCode = cleanCode.slice(0, 3) + '-' + cleanCode.slice(3);
                                } else if (cleanCode.length > 6) {
                                  cleanCode = cleanCode.slice(0, 3) + '-' + cleanCode.slice(3, 6) + '-' + cleanCode.slice(6);
                                }
                                setBusinessCode(cleanCode);
                              }}
                              className="text-center font-mono text-xl tracking-wider"
                              maxLength={11}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            Formato: XXX-XXX-XXX (expira en 24 horas)
                          </p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-green-900 mb-1">
                                Código Válido
                              </h4>
                              <p className="text-xs text-green-700">
                                {businessCode.length === 11 
                                  ? 'El código tiene el formato correcto y está listo para usar.'
                                  : 'Ingresa un código de 9 caracteres para continuar.'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="pt-4">
                        <Button
                          onClick={handleJoinBusiness}
                          disabled={isLoading || businessCode.length !== 11}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Uniéndose al negocio...
                            </div>
                          ) : (
                            <>
                              Unirse al Negocio
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </DialogFooter>

                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                          ¿No tienes un código? Solicítalo al administrador del negocio
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardFooter>
        </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ¿Necesitas ayuda? {' '}
              <a href="#" className="text-blue-600 hover:underline">
                Contacta soporte
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <nav className="grid grid-cols-5 h-16">
          {/* Dashboard */}
          <button 
            type="button" 
            className="flex flex-col items-center justify-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 mb-1" />
            <span>Dashboard</span>
          </button>

          {/* Orders */}
          <button 
            type="button" 
            className="flex flex-col items-center justify-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ClipboardList className="w-5 h-5 mb-1" />
            <span>Pedidos</span>
          </button>

          {/* Central Add Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors opacity-50 cursor-not-allowed"
              disabled
              aria-label="Agregar nuevo elemento"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Clients */}
          <button 
            type="button" 
            className="flex flex-col items-center justify-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Users className="w-5 h-5 mb-1" />
            <span>Clientes</span>
          </button>

          {/* Profile */}
          <button 
            type="button" 
            className="flex flex-col items-center justify-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <User className="w-5 h-5 mb-1" />
            <span>Perfil</span>
          </button>
        </nav>
      </div>

    </div>
  );
}
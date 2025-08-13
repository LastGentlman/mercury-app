import React, { useState } from 'react';
import { Store, Plus, Link, ArrowRight, Building2, Users, MapPin, LayoutDashboard, ClipboardList, User, Clock, Check, Phone, Mail } from 'lucide-react';
import { Button } from './ui/button.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { Alert, AlertDescription } from './ui/alert.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.tsx';
import { Textarea } from './ui/textarea.tsx';
import { useNotifications } from '../hooks/useNotifications.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { LogoutButton } from './LogoutButton.tsx';

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
}

const businessTypes = [
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'retail', label: 'Tienda' },
  { value: 'cafe', label: 'Cafetería' },
  { value: 'bakery', label: 'Panadería' },
  { value: 'grocery', label: 'Supermercado' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'other', label: 'Otro' }
];

export function BusinessSetup({ onBusinessSetup }: BusinessSetupProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const notifications = useNotifications();

  // Form states for new business
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    type: '',
    description: '',
    address: '',
    phone: '',
    email: user?.email || '',
    openingHours: '09:00',
    closingHours: '18:00'
  });

  // Form state for joining existing business
  const [businessCode, setBusinessCode] = useState('');

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

  const handleCreateBusiness = async () => {
    if (!formData.name || !formData.type) {
      notifications.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, this would create the business and return the ID
      const mockBusinessId = `business-${Date.now()}`;

      notifications.success('¡Negocio creado exitosamente!');
      setIsOpen(false);
      onBusinessSetup?.(mockBusinessId);
    } catch (_error) {
      notifications.error('Error al crear el negocio');
    } finally {
      setIsLoading(false);
    }
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

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, this would validate the code and join the business
      const mockBusinessId = `business-${businessCode}`;

      notifications.success('¡Te has unido al negocio exitosamente!');
      setIsOpen(false);
      onBusinessSetup?.(mockBusinessId);
    } catch (_error) {
      notifications.error('Código de negocio inválido');
    } finally {
      setIsLoading(false);
    }
  };



  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.type && formData.description;
      case 1:
        return formData.address && formData.phone && formData.email;
      case 2:
        return formData.openingHours && formData.closingHours;
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
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe tu negocio en pocas palabras..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[80px]"
              />
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
              <Label htmlFor="business-phone">Teléfono <span className="text-red-500">*</span></Label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="business-phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  type="tel"
                  className="pl-10"
                />
              </div>
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Vista Previa de tu Negocio</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>{formData.name || 'Nombre del Negocio'}</strong></p>
                <p>{businessTypes.find(t => t.value === formData.type)?.label || 'Tipo de Negocio'}</p>
                <p>{formData.description || 'Descripción del negocio'}</p>
                <p>{formData.address || 'Dirección'}</p>
                <p>{formData.phone || 'Teléfono'} • {formData.email || 'Email'}</p>
                <p>Horario: {formData.openingHours} - {formData.closingHours}</p>
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
      {/* Header with Logout */}
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Mercury</h1>
          </div>
          
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-20 md:pb-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-100 rounded-full mb-6">
              <Store className="w-16 h-16 text-blue-600" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mercury</h1>
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
                  <AlertDescription className="text-blue-800">
                    <strong>¿Nuevo en Mercury?</strong> Crea tu negocio en segundos o únete 
                    a uno existente con un código de invitación.
                  </AlertDescription>
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
                      Elige cómo quieres comenzar con Mercury
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
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                            <Users className="w-8 h-8 text-gray-600" />
                          </div>
                          <p className="text-sm text-gray-600">
                            Ingresa el código de invitación proporcionado por el administrador del negocio
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="business-code">Código del Negocio</Label>
                          <div className="mt-1 relative">
                            <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="business-code"
                              placeholder="ABC-123-XYZ"
                              value={businessCode}
                              onChange={(e) => setBusinessCode(e.target.value.toUpperCase())}
                              className="pl-10 text-center font-mono text-lg"
                              maxLength={11}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            El código debe tener el formato XXX-XXX-XXX
                          </p>
                        </div>
                      </div>

                      <DialogFooter className="pt-4">
                        <Button
                          onClick={handleJoinBusiness}
                          disabled={isLoading || !businessCode}
                          className="w-full"
                        >
                          {isLoading ? (
                            <>Uniéndose al negocio...</>
                          ) : (
                            <>
                              Unirse al Negocio
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </DialogFooter>
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
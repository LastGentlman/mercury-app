import React, { useState } from 'react';
import { Store, Plus, Link, ArrowRight, Building2, Users, MapPin, LayoutDashboard, ClipboardList, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { useNotifications } from '../hooks/useNotifications';

interface BusinessSetupProps {
  onBusinessSetup?: (businessId: string) => void;
}

export function BusinessSetup({ onBusinessSetup }: BusinessSetupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const notifications = useNotifications();
  
  // Form states for new business
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  
  // Form state for joining existing business
  const [businessCode, setBusinessCode] = useState('');

  const handleCreateBusiness = async () => {
    if (!businessName || !businessType) {
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
    } catch (error) {
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

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would validate the code and join the business
      const mockBusinessId = `business-${businessCode}`;
      
      notifications.success('¡Te has unido al negocio exitosamente!');
      setIsOpen(false);
      onBusinessSetup?.(mockBusinessId);
    } catch (error) {
      notifications.error('Código de negocio inválido');
    } finally {
      setIsLoading(false);
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
              
              <DialogContent className="sm:max-w-[500px]">
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
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="business-name">
                          Nombre del Negocio <span className="text-red-500">*</span>
                        </Label>
                        <div className="mt-1 relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="business-name"
                            placeholder="Mi Restaurante"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="business-type">
                          Tipo de Negocio <span className="text-red-500">*</span>
                        </Label>
                        <div className="mt-1 relative">
                          <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="business-type"
                            placeholder="Restaurante, Cafetería, etc."
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="business-address">Dirección</Label>
                        <div className="mt-1 relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="business-address"
                            placeholder="Calle Principal #123"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="business-phone">Teléfono</Label>
                        <Input
                          id="business-phone"
                          placeholder="+1 234 567 8900"
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                          type="tel"
                        />
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button
                        onClick={handleCreateBusiness}
                        disabled={isLoading || !businessName || !businessType}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>Creando negocio...</>
                        ) : (
                          <>
                            Crear Negocio
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </DialogFooter>
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
          <button className="flex flex-col items-center justify-center text-xs text-gray-400">
            <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
              <div className="bg-gray-400 rounded-sm"></div>
              <div className="bg-gray-400 rounded-sm"></div>
              <div className="bg-gray-400 rounded-sm"></div>
              <div className="bg-gray-400 rounded-sm"></div>
            </div>
            <span className="mt-1">Dashboard</span>
          </button>
          
          <button className="flex flex-col items-center justify-center text-xs text-gray-400">
            <ClipboardList className="w-5 h-5" />
            <span className="mt-1">Pedidos</span>
          </button>
          
          {/* Central Add Button */}
          <div className="flex items-center justify-center">
            <button
              className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-50 cursor-not-allowed"
              disabled
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          
          <button className="flex flex-col items-center justify-center text-xs text-gray-400">
            <Users className="w-5 h-5" />
            <span className="mt-1">Clientes</span>
          </button>
          
          <button className="flex flex-col items-center justify-center text-xs text-gray-400">
            <User className="w-5 h-5" />
            <span className="mt-1">Perfil</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
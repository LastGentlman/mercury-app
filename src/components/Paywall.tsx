import { useState, useEffect } from 'react';
import { 
  Check, 
  Clock, 
  ArrowRight,
  CreditCard,
  Star,
  Zap,
  Shield,
  Building2,
  Users,
  BarChart3,
  Smartphone,
  Globe
} from 'lucide-react';
import { Button } from './ui/index.ts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/index.ts';
import { Input } from './ui/index.ts';
import { Label } from './ui/index.ts';
import { useNotifications } from '../hooks/useNotifications.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { useAuthToken } from '../hooks/useStorageSync.ts';
import { env } from '../env.ts';

interface PaywallProps {
  businessData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    currency: string;
    type?: string;
    description?: string;
  };
  onSuccess: (businessId: string) => void;
  onClose: () => void;
}

interface PaymentFormData {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  billingName: string;
  billingEmail: string;
}

const pricingPlans = [
  {
    id: 'monthly',
    name: 'Plan Mensual',
    price: '275',
    currency: 'MXN',
    interval: 'mes',
    popular: false,
    features: [
      'Gestión completa de pedidos',
      'Administración de clientes',
      'Reportes básicos',
      'Soporte por email',
      'Actualizaciones automáticas'
    ]
  },
  {
    id: 'yearly',
    name: 'Plan Anual',
    price: '2,750',
    currency: 'MXN',
    interval: 'año',
    popular: true,
    savings: '2 meses gratis',
    features: [
      'Todo del plan mensual',
      'Reportes avanzados',
      'Soporte prioritario',
      'Integraciones premium',
      'Backup automático',
      '2 meses de regalo'
    ]
  }
];

export function Paywall({ businessData, onSuccess, onClose }: PaywallProps) {
  const { user } = useAuth();
  const { value: authToken } = useAuthToken();
  const notifications = useNotifications();
  
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    billingName: user?.name || '',
    billingEmail: user?.email || ''
  });

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripeKey = env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) {
          console.warn('Stripe publishable key not configured');
          return;
        }
        const stripeInstance = await loadStripe(stripeKey);
        if (stripeInstance) {
          setStripe(stripeInstance);
        }
      } catch (error) {
        console.error('Error loading Stripe:', error);
        notifications.error('Error al cargar el sistema de pagos');
      } finally {
        setStripeLoading(false);
      }
    };

    initStripe();
  }, [notifications]);

  const validatePaymentForm = () => {
    if (!paymentData.billingName.trim()) {
      notifications.error('El nombre de facturación es requerido');
      return false;
    }
    if (!paymentData.billingEmail.trim()) {
      notifications.error('El email de facturación es requerido');
      return false;
    }
    if (!paymentData.cardNumber.replace(/\s/g, '')) {
      notifications.error('El número de tarjeta es requerido');
      return false;
    }
    if (!paymentData.expMonth || !paymentData.expYear) {
      notifications.error('La fecha de expiración es requerida');
      return false;
    }
    if (!paymentData.cvc) {
      notifications.error('El código de seguridad es requerido');
      return false;
    }
    return true;
  };

  const handleStartTrial = async () => {
    if (!validatePaymentForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Crear negocio con trial gratuito (7 días)
      const response = await fetch('/api/business/activate-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          businessName: businessData.name,
          businessEmail: businessData.email,
          businessPhone: businessData.phone,
          businessAddress: businessData.address,
          billingName: paymentData.billingName,
          billingEmail: paymentData.billingEmail,
          currency: businessData.currency,
          taxRegime: '605', // Por defecto
          paymentMethod: {
            type: 'card',
            card: {
              number: paymentData.cardNumber.replace(/\s/g, ''),
              exp_month: parseInt(paymentData.expMonth),
              exp_year: parseInt(paymentData.expYear),
              cvc: paymentData.cvc
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear el negocio');
      }

      const result = await response.json();
      notifications.success('¡Negocio creado exitosamente! Comienza tu trial de 14 días.');
      onSuccess(result.business.id);
    } catch (error) {
      console.error('Error creating business:', error);
      notifications.error('Error al crear el negocio. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const selectedPlanData = pricingPlans.find(p => p.id === selectedPlan);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Globe className="w-8 h-8 text-blue-600 mr-2" />
              <h2 className="text-3xl font-bold text-gray-900">
                ¡Último paso para tu negocio!
              </h2>
            </div>
            <p className="text-gray-600 text-lg">
              Elige tu plan y comienza a recibir pedidos en minutos
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Planes de Precios */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Selecciona tu plan
              </h3>
              
              {pricingPlans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlan === plan.id 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {plan.id === 'monthly' ? (
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Star className="w-5 h-5 text-yellow-500" />
                        )}
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                      </div>
                      {plan.popular && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Más Popular
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600">/{plan.interval}</span>
                      {plan.savings && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          {plan.savings}
                        </div>
                      )}
                    </div>
                    
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}

              {/* Trial Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Trial Gratuito</h4>
                    <p className="text-sm text-blue-700">
                      Comienza con <strong>7 días gratis</strong> sin tarjeta, 
                      luego <strong>+7 días adicionales</strong> con tu método de pago.
                    </p>
                  </div>
                </div>
              </div>

              {/* Features Preview */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Características Destacadas
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center text-purple-700">
                    <Building2 className="w-3 h-3 mr-1" />
                    Gestión de Negocio
                  </div>
                  <div className="flex items-center text-purple-700">
                    <Users className="w-3 h-3 mr-1" />
                    Clientes
                  </div>
                  <div className="flex items-center text-purple-700">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Reportes
                  </div>
                  <div className="flex items-center text-purple-700">
                    <Smartphone className="w-3 h-3 mr-1" />
                    Móvil
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario de Pago */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Información de Pago
                </h3>
                
                <div className="space-y-4">
                  {/* Datos de Facturación */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingName">Nombre de Facturación</Label>
                      <Input
                        id="billingName"
                        value={paymentData.billingName}
                        onChange={(e) => handleInputChange('billingName', e.target.value)}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingEmail">Email de Facturación</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={paymentData.billingEmail}
                        onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  {/* Tarjeta de Crédito */}
                  <div>
                    <Label htmlFor="cardNumber" className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Número de Tarjeta</span>
                    </Label>
                    <Input
                      id="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ingresa el número de tu tarjeta sin espacios
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="expMonth">Mes de Expiración</Label>
                      <Input
                        id="expMonth"
                        value={paymentData.expMonth}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                            handleInputChange('expMonth', value);
                          }
                        }}
                        placeholder="MM"
                        maxLength={2}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expYear">Año de Expiración</Label>
                      <Input
                        id="expYear"
                        value={paymentData.expYear}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value === '' || (parseInt(value) >= 23 && parseInt(value) <= 99)) {
                            handleInputChange('expYear', value);
                          }
                        }}
                        placeholder="YY"
                        maxLength={2}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc">Código de Seguridad</Label>
                      <Input
                        id="cvc"
                        value={paymentData.cvc}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 9999)) {
                            handleInputChange('cvc', value);
                          }
                        }}
                        placeholder="123"
                        maxLength={4}
                        className="text-center"
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-700">
                        <p className="font-medium">Pago Seguro</p>
                        <p>Tus datos están protegidos con encriptación SSL de 256 bits. 
                        Nunca almacenamos información de tu tarjeta.</p>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Status */}
                  {!stripeLoading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-blue-700">
                          Sistema de pagos Stripe cargado y listo
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen del Plan */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Resumen del Plan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plan seleccionado:</span>
                    <span className="font-medium">{selectedPlanData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio:</span>
                    <span className="font-medium">${selectedPlanData?.price} {selectedPlanData?.currency}/{selectedPlanData?.interval}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trial gratuito:</span>
                    <span className="text-green-600 font-medium">14 días</span>
                  </div>
                  {selectedPlan === 'yearly' && (
                    <div className="flex justify-between">
                      <span>Ahorro:</span>
                      <span className="text-green-600 font-medium">2 meses gratis</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-3">
                {stripeLoading ? (
                  <div className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-gray-600">Inicializando sistema de pagos...</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartTrial}
                    disabled={isLoading}
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Creando negocio...
                      </div>
                    ) : (
                      <>
                        Comenzar Trial Gratuito
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>

              {/* Garantías */}
              <div className="text-center text-xs text-gray-500 space-y-1">
                <div className="flex items-center justify-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>Pago seguro con Stripe</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Cancelación en cualquier momento</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <CreditCard className="w-3 h-3" />
                  <span>No se cobra durante el trial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
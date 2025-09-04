import { useState, useEffect } from 'react';
import { 
  CheckCircle,
  CreditCard, 
  ArrowRight, 
  Gift,
  Shield
} from 'lucide-react';
import { Input } from './ui/index.ts';
import { Label } from './ui/index.ts';
import { useNotifications } from '../hooks/useNotifications.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { useAuthToken } from '../hooks/useStorageSync.ts';
import { env } from '../env.ts';

// Use proper Stripe types from the library
import type { Stripe, StripeElements as _StripeElements, StripeElement } from '@stripe/stripe-js';

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
      'Acceso completo a todas las funciones',
      'Gestión ilimitada de pedidos',
      'Soporte prioritario por email'
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
    monthlyEquivalent: '229',
    features: [
      'Todo del plan mensual incluido',
      'Ahorro de $550 MXN al año',
      'Facturación anual simplificada'
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
  const [_stripe, setStripe] = useState<Stripe | null>(null);
  const [cardElement, setCardElement] = useState<StripeElement | null>(null);
  const [businessCreated, setBusinessCreated] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFormData>({
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
          
          // Create card element
          const elements = stripeInstance.elements();
          const cardElement = elements.create('card', {
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          });
          
          setCardElement(cardElement);
          
          // Mount the card element
          const cardElementContainer = document.getElementById('card-element');
          if (cardElementContainer) {
            cardElement.mount(cardElementContainer);
          }
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
    if (!cardElement) {
      notifications.error('El formulario de tarjeta no está listo');
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
          // Payment method will be handled by Stripe Elements
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear el negocio');
      }

      await response.json();
      setBusinessCreated(true);
      notifications.success('¡Negocio creado exitosamente! Comienza tu trial de 14 días.');
      // No llamar onSuccess inmediatamente, dejar que el usuario vea el mensaje de éxito
      // onSuccess(result.business.id);
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

  // Si el negocio ya se creó, mostrar solo el mensaje de éxito
  if (businessCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            ¡Negocio Creado!
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Tu negocio "{businessData.name}" ha sido creado exitosamente. 
            Ya puedes empezar a usarlo.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                // Llamar onSuccess cuando el usuario vaya al dashboard
                onSuccess('business-created');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Ir al Dashboard
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">¡Último paso para tu negocio!</h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-green-900 mb-1">
                ¡Negocio configurado!
              </h3>
              <p className="text-green-700 text-xs mb-2">
                Ya tienes toda la información básica. Ahora elige tu plan.
              </p>
              <div className="flex flex-col space-y-1 text-xs text-green-600">
                <div className="flex items-center space-x-1">
                  <Gift className="w-3 h-3" />
                  <span>7 días gratis sin tarjeta</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CreditCard className="w-3 h-3" />
                  <span>+7 días más con pago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
              Elige tu plan
            </h2>
            <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">
              Continúa creciendo tu negocio con nuestras herramientas profesionales
            </p>
            
            {/* Toggle Anual/Mensual */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="bg-gray-100 rounded-lg p-1 flex w-full max-w-xs">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`flex-1 px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedPlan === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`flex-1 px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedPlan === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>

            {/* Selected Plan Display */}
            <div className="max-w-md mx-auto">
              {/* Plan Mensual */}
              {selectedPlan === 'monthly' && (
                <div className="border-2 border-blue-500 bg-blue-50 rounded-xl p-4 sm:p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Plan Mensual</h3>
                    <div className="mb-2">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">$275</span>
                      <span className="text-gray-600 ml-1">/mes MXN</span>
                    </div>
                    <p className="text-xs text-gray-600">Flexibilidad total</p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {pricingPlans[0]?.features?.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Plan Anual */}
              {selectedPlan === 'yearly' && (
                <div className="border-2 border-green-500 bg-green-50 rounded-xl p-4 sm:p-6">
                  <div className="text-center mb-4">
                    <div className="inline-block bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold mb-2">
                      MEJOR VALOR
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Plan Anual</h3>
                    <div className="mb-1">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">$2,750</span>
                      <span className="text-gray-600 ml-1">/año MXN</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">Equivale a $229/mes</p>
                    <p className="text-xs text-green-600">2 meses gratis</p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {pricingPlans[1]?.features?.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Form Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
              Información de Pago
            </h3>
            
            <div className="max-w-md mx-auto space-y-6">
              {/* Datos de Facturación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingName" className="text-sm">Nombre de Facturación</Label>
                  <Input
                    id="billingName"
                    value={paymentData.billingName}
                    onChange={(e) => handleInputChange('billingName', e.target.value)}
                    placeholder="Tu nombre completo"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="billingEmail" className="text-sm">Email de Facturación</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={paymentData.billingEmail}
                    onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                    placeholder="tu@email.com"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Stripe Card Element */}
              <div>
                <Label className="flex items-center space-x-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Información de Tarjeta</span>
                </Label>
                <div 
                  id="card-element" 
                  className="border border-gray-300 rounded-md p-3 min-h-[40px] bg-white mt-1"
                >
                  {stripeLoading && (
                    <div className="flex items-center justify-center h-8">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-xs text-gray-500 ml-2">Cargando...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa los datos de tu tarjeta
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium">Pago Seguro</p>
                    <p>Tus datos están protegidos. Nunca almacenamos información de tu tarjeta.</p>
                  </div>
                </div>
              </div>

              {/* Stripe Status */}
              {!stripeLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-blue-700">
                      Sistema de pagos listo
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 sm:p-6 text-white text-center">
          <h3 className="text-lg sm:text-xl font-bold mb-2">
            ¿Listo para extender tu trial?
          </h3>
          <p className="text-blue-100 mb-4 text-sm sm:text-base">
            Agrega tu método de pago y obtén 7 días adicionales gratis
          </p>
          <button 
            onClick={handleStartTrial}
            disabled={isLoading || stripeLoading}
            className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 py-3 px-6 rounded-lg font-semibold transition-colors inline-flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4" />
            <span>Agregar Método de Pago</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-blue-200 mt-3">
            No se realizará ningún cargo hasta que termine tu período de prueba
          </p>
        </div>
      </div>
    </div>
  );
} 
import { useState } from 'react';
import { 
  Gift, 
  CreditCard, 
  X, 
  Clock, 
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/index.ts';
import { useNotifications } from '../hooks/useNotifications.ts';
import { useTrialStatus } from '../hooks/useTrialStatus.ts';

interface TrialExtensionBannerProps {
  className?: string;
}

export function TrialExtensionBanner({ className = '' }: TrialExtensionBannerProps) {
  const { trialStatus, invitation, markInvitationAsShown, dismissInvitation, extendTrial } = useTrialStatus();
  const notifications = useNotifications();
  const [isExtending, setIsExtending] = useState(false);

  // No mostrar si no debe mostrarse
  if (!invitation.show || !trialStatus.canExtend) {
    return null;
  }

  const handleExtendTrial = async () => {
    setIsExtending(true);
    try {
      // Por ahora usamos datos de prueba, en producción esto vendría de un formulario
      const testPaymentMethod = {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123'
      };

      await extendTrial(testPaymentMethod);
      markInvitationAsShown();
      notifications.success('¡Trial extendido! Ahora tienes 14 días completos de prueba.');
    } catch (error) {
      console.error('Error extending trial:', error);
      notifications.error(error instanceof Error ? error.message : 'Error al extender el trial');
    } finally {
      setIsExtending(false);
    }
  };

  const handleDismiss = () => {
    dismissInvitation();
  };

  const handleLater = () => {
    markInvitationAsShown();
  };

  return (
    <div className={`bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold">
                ¡Extiende tu trial gratis!
              </h3>
              <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span className="text-xs">
                  {trialStatus.daysRemaining === 1 ? 'Último día' : `${trialStatus.daysRemaining} días restantes`}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-orange-100 mb-3">
              Agrega un método de pago y obtén <strong>7 días adicionales</strong> gratis. 
              Total: <strong>14 días de prueba</strong> sin compromiso.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleExtendTrial}
                disabled={isExtending}
                size="sm"
                className="bg-white text-orange-600 hover:bg-orange-50 border-0 font-semibold"
              >
                {isExtending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full mr-2"></div>
                    Extendiendo...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Extender Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleLater}
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Más tarde
              </Button>
            </div>
            
            <div className="mt-3 flex items-center space-x-4 text-xs text-orange-100">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Sin cargo hasta el final del trial</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Cancela cuando quieras</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors ml-2"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Componente más compacto para usar en el header
export function TrialExtensionCompact({ className = '' }: TrialExtensionBannerProps) {
  const { trialStatus, invitation, dismissInvitation } = useTrialStatus();

  // No mostrar si no debe mostrarse
  if (!invitation.show || !trialStatus.canExtend) {
    return null;
  }

  const handleExtendTrial = () => {
    // Redirigir a la página de extensión de trial
    window.location.href = '/extend-trial';
  };

  const handleDismiss = () => {
    dismissInvitation();
  };

  return (
    <div className={`bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-md text-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Gift className="w-4 h-4" />
          <span className="font-medium">
            ¡Extiende tu trial! +7 días gratis
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExtendTrial}
            className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-medium transition-colors"
          >
            Extender
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { BusinessService } from '../services/business-service.ts';
import { useAuthToken } from './useStorageSync.ts';

export interface TrialStatus {
  isTrialing: boolean;
  daysRemaining: number;
  isDay6OrLater: boolean;
  canExtend: boolean;
  trialEndsAt: string | null;
  hasPaymentMethod: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TrialExtensionInvitation {
  show: boolean;
  hasBeenShown: boolean;
  dismissed: boolean;
}

export function useTrialStatus() {
  const { value: authToken } = useAuthToken();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isTrialing: false,
    daysRemaining: 0,
    isDay6OrLater: false,
    canExtend: false,
    trialEndsAt: null,
    hasPaymentMethod: false,
    isLoading: true,
    error: null
  });

  const [invitation, setInvitation] = useState<TrialExtensionInvitation>({
    show: false,
    hasBeenShown: false,
    dismissed: false
  });

  // Función para calcular días restantes
  const calculateDaysRemaining = useCallback((trialEndsAt: string): number => {
    const now = new Date();
    const trialEnd = new Date(trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  // Función para verificar si debe mostrar la invitación
  const shouldShowInvitation = useCallback((daysRemaining: number, hasPaymentMethod: boolean): boolean => {
    // Mostrar invitación si:
    // 1. Está en trial (días restantes > 0)
    // 2. No tiene método de pago
    // 3. Está en día 6 o menos (días restantes <= 1)
    // 4. No se ha mostrado antes o no se ha descartado
    return daysRemaining > 0 && 
           !hasPaymentMethod && 
           daysRemaining <= 1 && 
           !invitation.hasBeenShown && 
           !invitation.dismissed;
  }, [invitation.hasBeenShown, invitation.dismissed]);

  // Función para obtener el estado del trial
  const fetchTrialStatus = useCallback(async () => {
    if (!authToken) {
      setTrialStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setTrialStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      const business = await BusinessService.getCurrentBusiness(authToken);
      
      if (!business) {
        setTrialStatus({
          isTrialing: false,
          daysRemaining: 0,
          isDay6OrLater: false,
          canExtend: false,
          trialEndsAt: null,
          hasPaymentMethod: false,
          isLoading: false,
          error: null
        });
        return;
      }

      const isTrialing = business.subscription_status === 'trialing';
      const trialEndsAt = business.trial_ends_at;
      const daysRemaining = trialEndsAt ? calculateDaysRemaining(trialEndsAt) : 0;
      const isDay6OrLater = daysRemaining <= 1; // Día 6 o menos
      const canExtend = isTrialing && !(business.settings as any)?.paymentMethodAdded;
      const hasPaymentMethod = (business.settings as any)?.paymentMethodAdded || false;

      setTrialStatus({
        isTrialing,
        daysRemaining,
        isDay6OrLater,
        canExtend,
        trialEndsAt: trialEndsAt || null,
        hasPaymentMethod,
        isLoading: false,
        error: null
      });

      // Verificar si debe mostrar la invitación
      const shouldShow = shouldShowInvitation(daysRemaining, hasPaymentMethod);
      setInvitation(prev => ({
        ...prev,
        show: shouldShow
      }));

    } catch (error) {
      console.error('Error fetching trial status:', error);
      setTrialStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al obtener estado del trial'
      }));
    }
  }, [authToken, calculateDaysRemaining, shouldShowInvitation]);

  // Función para marcar la invitación como mostrada
  const markInvitationAsShown = useCallback(() => {
    setInvitation(prev => ({
      ...prev,
      hasBeenShown: true,
      show: false
    }));
    
    // Guardar en localStorage para persistir
    localStorage.setItem('trial-extension-invitation-shown', 'true');
  }, []);

  // Función para descartar la invitación
  const dismissInvitation = useCallback(() => {
    setInvitation(prev => ({
      ...prev,
      dismissed: true,
      show: false
    }));
    
    // Guardar en localStorage para persistir
    localStorage.setItem('trial-extension-invitation-dismissed', 'true');
  }, []);

  // Función para extender el trial
  const extendTrial = useCallback(async (paymentMethod: any) => {
    if (!authToken) {
      throw new Error('No hay token de autenticación');
    }

    try {
      const response = await fetch('/api/business/extend-trial-with-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          paymentMethod: {
            type: 'card',
            card: paymentMethod
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al extender el trial');
      }

      // Actualizar el estado después de extender
      await fetchTrialStatus();
      
      return await response.json();
    } catch (error) {
      console.error('Error extending trial:', error);
      throw error;
    }
  }, [authToken, fetchTrialStatus]);

  // Cargar estado inicial
  useEffect(() => {
    // Verificar si ya se mostró o descartó la invitación
    const hasBeenShown = localStorage.getItem('trial-extension-invitation-shown') === 'true';
    const dismissed = localStorage.getItem('trial-extension-invitation-dismissed') === 'true';
    
    setInvitation(prev => ({
      ...prev,
      hasBeenShown,
      dismissed
    }));

    fetchTrialStatus();
  }, [fetchTrialStatus]);

  // Actualizar cada hora para verificar cambios en el trial
  useEffect(() => {
    const interval = setInterval(fetchTrialStatus, 60 * 60 * 1000); // 1 hora
    return () => clearInterval(interval);
  }, [fetchTrialStatus]);

  return {
    trialStatus,
    invitation,
    markInvitationAsShown,
    dismissInvitation,
    extendTrial,
    refetch: fetchTrialStatus
  };
}

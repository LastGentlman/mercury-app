import { useCallback, useEffect, useRef, useState } from 'react'
import { registerPWA } from '../pwa'

export interface PWARegistrationStatus {
  isRegistered: boolean
  isRegistering: boolean
  error: string | null
  registration: ServiceWorkerRegistration | null
}

/**
 * Hook personalizado para registrar el Service Worker con debouncing y protección contra race conditions
 * Previene múltiples registros simultáneos y proporciona estado de registro
 */
export function usePWARegistration() {
  const [status, setStatus] = useState<PWARegistrationStatus>({
    isRegistered: false,
    isRegistering: false,
    error: null,
    registration: null
  })

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // ✅ Función de registro con debouncing adicional
  const registerWithDebounce = useCallback(async () => {
    // ✅ Limpiar timeout anterior si existe
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // ✅ Actualizar estado de registro
    setStatus(prev => ({
      ...prev,
      isRegistering: true,
      error: null
    }))

    try {
      // ✅ Usar la función registerPWA mejorada
      const registration = await registerPWA()
      
      if (!isMountedRef.current) return

      if (registration) {
        setStatus({
          isRegistered: true,
          isRegistering: false,
          error: null,
          registration
        })
        console.log('✅ PWA registration completed successfully')
      } else {
        setStatus({
          isRegistered: false,
          isRegistering: false,
          error: 'Service Worker registration was skipped',
          registration: null
        })
      }
    } catch (error) {
      if (!isMountedRef.current) return

      const errorMessage = error instanceof Error ? error.message : 'Unknown registration error'
      setStatus({
        isRegistered: false,
        isRegistering: false,
        error: errorMessage,
        registration: null
      })
      console.error('❌ PWA registration failed:', error)
    }
  }, [])

  // ✅ Función de registro con debouncing
  const registerPWAWithDebounce = useCallback((delay: number = 500) => {
    // ✅ Limpiar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // ✅ Crear nuevo timeout para debouncing
    debounceTimeoutRef.current = setTimeout(() => {
      registerWithDebounce()
    }, delay)
  }, [registerWithDebounce])

  // ✅ Función para forzar registro inmediato
  const forceRegister = useCallback(() => {
    // ✅ Limpiar cualquier debounce pendiente
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    
    registerWithDebounce()
  }, [registerWithDebounce])

  // ✅ Función para resetear el estado
  const resetRegistration = useCallback(() => {
    setStatus({
      isRegistered: false,
      isRegistering: false,
      error: null,
      registration: null
    })
  }, [])

  // ✅ Auto-registro cuando el componente se monta
  useEffect(() => {
    // ✅ Verificar si ya hay un Service Worker registrado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && isMountedRef.current) {
          setStatus({
            isRegistered: true,
            isRegistering: false,
            error: null,
            registration
          })
        } else {
          // ✅ Registrar automáticamente con debouncing
          registerPWAWithDebounce(1000)
        }
      }).catch((error) => {
        console.error('❌ Error checking existing registration:', error)
        // ✅ Intentar registro de todas formas
        registerPWAWithDebounce(1000)
      })
    }

    // ✅ Cleanup al desmontar
    return () => {
      isMountedRef.current = false
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
    }
  }, [registerPWAWithDebounce])

  return {
    ...status,
    registerPWA: registerPWAWithDebounce,
    forceRegister,
    resetRegistration
  }
}

/**
 * Hook simplificado para verificar si el PWA está registrado
 */
export function usePWAStatus() {
  const [isRegistered, setIsRegistered] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          setIsRegistered(!!registration)
        } else {
          setIsRegistered(false)
        }
      } catch (error) {
        console.error('❌ Error checking PWA status:', error)
        setIsRegistered(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkRegistration()
  }, [])

  return { isRegistered, isChecking }
} 
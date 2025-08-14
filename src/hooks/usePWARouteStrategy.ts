import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { isPWAInstalled } from '../pwa-fixed.ts'
import { useAuth } from './useAuth.ts'

interface PWARouteConfig {
  enablePWARedirect: boolean
  fallbackRoute: string
  debugMode: boolean
}

export function usePWARouteStrategy(config: PWARouteConfig = {
  enablePWARedirect: true,
  fallbackRoute: '/auth',
  debugMode: false
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()
  
  // Estados para prevenir loops y race conditions
  const [hasInitialized, setHasInitialized] = useState(false)
  const redirectAttemptRef = useRef(0)
  const maxRedirectAttempts = 3
  
  // Estado de PWA
  const [pwaStatus, setPWAStatus] = useState({
    isPWA: false,
    isChecked: false,
    launchSource: 'unknown' as 'pwa' | 'browser' | 'unknown'
  })

  // ✅ Detección robusta de PWA con múltiples métodos
  useEffect(() => {
    const detectPWALaunch = () => {
      try {
        const isPWA = isPWAInstalled()
        
        // Detectar fuente de lanzamiento
        let launchSource: 'pwa' | 'browser' | 'unknown' = 'unknown'
        
        if (isPWA) {
          launchSource = 'pwa'
        } else if (globalThis.matchMedia('(display-mode: browser)').matches) {
          launchSource = 'browser'
        }
        
        setPWAStatus({
          isPWA,
          isChecked: true,
          launchSource
        })
        
        if (config.debugMode) {
          console.log('🔍 PWA Detection Result:', {
            isPWA,
            launchSource,
            pathname: location.pathname,
            userAgent: navigator.userAgent.slice(0, 50)
          })
        }
        
      } catch (error) {
        console.error('❌ PWA detection failed:', error)
        setPWAStatus({
          isPWA: false,
          isChecked: true,
          launchSource: 'unknown'
        })
      }
    }

    // Delay inicial para evitar false positives
    const timer = setTimeout(detectPWALaunch, 100)
    return () => clearTimeout(timer)
  }, [location.pathname, config.debugMode])

  // ✅ Lógica de redirección con protecciones
  useEffect(() => {
    // Esperar a que todo esté listo
    if (!pwaStatus.isChecked || isLoading || hasInitialized) {
      return
    }

    // Verificar si debemos redirigir
    const shouldRedirect = 
      config.enablePWARedirect &&
      pwaStatus.isPWA &&
      !isAuthenticated &&
      location.pathname === '/' &&
      redirectAttemptRef.current < maxRedirectAttempts

    if (shouldRedirect) {
      redirectAttemptRef.current += 1
      
      if (config.debugMode) {
        console.log('🔄 PWA Redirect:', {
          attempt: redirectAttemptRef.current,
          from: location.pathname,
          to: config.fallbackRoute,
          reason: 'PWA + Unauthenticated + Home'
        })
      }
      
      // Navegación con replace para evitar historial
      navigate({ 
        to: config.fallbackRoute,
        replace: true 
      })
    }
    
    // Marcar como inicializado
    setHasInitialized(true)
    
  }, [
    pwaStatus.isChecked,
    pwaStatus.isPWA,
    isLoading,
    isAuthenticated,
    location.pathname,
    hasInitialized,
    config.enablePWARedirect,
    config.fallbackRoute,
    config.debugMode,
    navigate
  ])

  // ✅ Reset cuando cambia la autenticación
  useEffect(() => {
    if (isAuthenticated) {
      redirectAttemptRef.current = 0
    }
  }, [isAuthenticated])

  return {
    // Estado actual
    isPWA: pwaStatus.isPWA,
    isAuthenticated,
    isLoading,
    launchSource: pwaStatus.launchSource,
    
    // Estado de inicialización
    hasInitialized,
    redirectAttempts: redirectAttemptRef.current,
    
    // Métodos de control
    resetRedirectAttempts: () => {
      redirectAttemptRef.current = 0
      setHasInitialized(false)
    },
    
    // Debug info
    debugInfo: config.debugMode ? {
      pwaStatus,
      location: location.pathname,
      redirectAttempts: redirectAttemptRef.current,
      maxAttempts: maxRedirectAttempts
    } : null
  }
}

// ✅ Hook simplificado para casos básicos
export function usePWARoute() {
  return usePWARouteStrategy({
    enablePWARedirect: true,
    fallbackRoute: '/auth',
    debugMode: import.meta.env.DEV
  })
}

// ✅ Configuraciones predefinidas
export const PWARouteConfigs = {
  // Para desarrollo - con debug
  development: {
    enablePWARedirect: true,
    fallbackRoute: '/auth',
    debugMode: true
  },
  
  // Para producción - sin debug
  production: {
    enablePWARedirect: true,
    fallbackRoute: '/auth',
    debugMode: false
  },
  
  // Para testing - sin redirects
  testing: {
    enablePWARedirect: false,
    fallbackRoute: '/auth',
    debugMode: true
  },
  
  // Para subdominio (si decides usarlo)
  subdomain: {
    enablePWARedirect: false, // No necesario en app.domain.com
    fallbackRoute: '/dashboard',
    debugMode: false
  }
} as const 
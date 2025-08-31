import React from 'react'
import { offlineAuthManager } from '../services/offline-auth-manager.ts'

// Types for connection banner
export type AuthMode = 'online' | 'offline_grace' | 'offline_strict' | 'sync_pending'

interface ConnectionBannerProps {
  authMode: AuthMode
  className?: string | undefined
}

/**
 * 🎯 ConnectionBanner - Estados Visuales Claros para el Usuario
 * 
 * Muestra diferentes estados de conexión y autenticación:
 * - online: No mostrar nada
 * - offline_grace: Trabajando offline con sincronización pendiente
 * - offline_strict: Sin conexión, funcionalidad limitada
 * - sync_pending: Sincronizando datos pendientes
 * 
 * En móvil: Indicador compacto en la esquina superior derecha
 * En desktop: Banner completo en la parte superior
 */
export function ConnectionBanner({ authMode, className = '' }: ConnectionBannerProps) {
  // No mostrar nada si está online
  if (authMode === 'online') {
    return null
  }

  const getBannerConfig = () => {
    switch (authMode) {
      case 'offline_grace':
        return {
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-400',
          mobileBgColor: 'bg-orange-500',
          icon: '⚠️',
          title: 'Sin conexión',
          message: 'Trabajando offline (datos se sincronizarán)',
          showAction: true
        }

      case 'offline_strict':
        return {
          bgColor: 'bg-red-100',
          borderColor: 'border-red-400',
          mobileBgColor: 'bg-red-500',
          icon: '🚫',
          title: 'Sin conexión',
          message: 'Funcionalidad limitada',
          showAction: false
        }

      case 'sync_pending':
        return {
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-400',
          mobileBgColor: 'bg-blue-500',
          icon: '🔄',
          title: 'Sincronizando',
          message: 'Sincronizando datos pendientes...',
          showAction: false
        }

      default:
        return null
    }
  }

  const config = getBannerConfig()
  if (!config) return null

  const handleRetrySync = async () => {
    try {
      console.log('🔄 Manual sync retry initiated...')
      await offlineAuthManager.syncPendingVerifications()
      console.log('✅ Manual sync completed successfully')
    } catch (error) {
      console.error('❌ Failed to retry sync:', error)
      // Mostrar notificación de error al usuario
      if (typeof globalThis.window !== 'undefined' && (globalThis.window as unknown as { Swal?: { fire: (options: unknown) => Promise<unknown> } }).Swal) {
        (globalThis.window as unknown as { Swal: { fire: (options: unknown) => Promise<unknown> } }).Swal.fire({
          title: 'Error de Sincronización',
          text: 'No se pudo completar la sincronización. Inténtalo de nuevo más tarde.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
    }
  }

  return (
    <>
      {/* 🖥️ Desktop Banner - Banner completo */}
      <div className={`hidden md:block ${config.bgColor} border-l-4 ${config.borderColor} p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{config.icon}</span>
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-800">
              {config.title}
            </h3>
            <p className="mt-1 text-sm text-gray-700">
              {config.message}
            </p>
            
            {config.showAction && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleRetrySync}
                  className="text-sm font-medium text-orange-800 hover:text-orange-900 underline"
                >
                  Reintentar sincronización
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📱 Mobile Indicator - Indicador compacto en esquina superior derecha */}
      <div className={`md:hidden fixed top-4 right-4 z-50 ${config.mobileBgColor} text-white rounded-full p-2 shadow-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-sm">{config.icon}</span>
          
          {config.showAction && (
            <button
              type="button"
              onClick={handleRetrySync}
              className="text-white hover:text-gray-200 transition-colors"
              title="Reintentar sincronización"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          )}
        </div>
        
        {/* 🔍 Debug indicator - solo en desarrollo */}
        {import.meta.env.DEV && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title={`Estado: ${authMode}`} />
        )}
      </div>
    </>
  )
}

/**
 * 🎯 Hook para determinar el modo de autenticación actual
 */
export function useAuthMode(): AuthMode {
  const [authMode, setAuthMode] = React.useState<AuthMode>('online')
  const [isSyncing, setIsSyncing] = React.useState(false)

  React.useEffect(() => {
    const updateAuthMode = async () => {
      try {
        const status = await offlineAuthManager.getOfflineAuthStatus()
        
        if (isSyncing) {
          setAuthMode('sync_pending')
        } else if (!status.isOnline) {
          if (status.isInGracePeriod) {
            setAuthMode('offline_grace')
          } else {
            setAuthMode('offline_strict')
          }
        } else {
          setAuthMode('online')
        }
      } catch (error) {
        console.error('❌ Failed to get auth mode:', error)
        setAuthMode('online')
      }
    }

    updateAuthMode()

    // Actualizar cuando cambie la conectividad
    const handleOnline = () => {
      setIsSyncing(true)
      updateAuthMode()
      
      // Simular sincronización
      setTimeout(() => {
        setIsSyncing(false)
        updateAuthMode()
      }, 2000)
    }

    const handleOffline = () => {
      setIsSyncing(false)
      updateAuthMode()
    }

    globalThis.window.addEventListener('online', handleOnline)
    globalThis.window.addEventListener('offline', handleOffline)

    return () => {
      globalThis.window.removeEventListener('online', handleOnline)
      globalThis.window.removeEventListener('offline', handleOffline)
    }
  }, [isSyncing])

  return authMode
}

/**
 * 🎯 Componente automático que se muestra/oculta según el estado
 */
export function AutoConnectionBanner({ className }: { className?: string }) {
  const authMode = useAuthMode()
  
  return (
    <ConnectionBanner 
      authMode={authMode} 
      className={className} 
    />
  )
}

/**
 * 🧪 Componente de demo para testing - solo en desarrollo
 */
export function ConnectionBannerDemo() {
  const [currentMode, setCurrentMode] = React.useState<AuthMode>('online')
  
  if (!import.meta.env.DEV) return null
  
  const modes: AuthMode[] = ['online', 'offline_grace', 'offline_strict', 'sync_pending']
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg">
      <h3 className="text-sm font-bold mb-2">🧪 Connection Banner Demo</h3>
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => (
          <button
            type="button"
            key={mode}
            onClick={() => setCurrentMode(mode)}
            className={`px-2 py-1 text-xs rounded ${
              currentMode === mode ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs">
        Estado actual: <span className="font-bold">{currentMode}</span>
      </div>
      
      <ConnectionBanner authMode={currentMode} />
    </div>
  )
} 
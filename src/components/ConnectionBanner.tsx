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
          icon: '⚠️',
          title: 'Sin conexión',
          message: 'Trabajando offline (datos se sincronizarán)',
          showAction: true
        }

      case 'offline_strict':
        return {
          bgColor: 'bg-red-100',
          borderColor: 'border-red-400',
          icon: '🚫',
          title: 'Sin conexión',
          message: 'Funcionalidad limitada',
          showAction: false
        }

      case 'sync_pending':
        return {
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-400',
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
    <div className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 ${className}`}>
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
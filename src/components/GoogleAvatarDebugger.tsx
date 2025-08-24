/**
 * 🚨 COMPONENTE TEMPORAL DE DEBUGGING
 * 
 * Este componente ayuda a diagnosticar el problema del avatar de Google OAuth
 * Muestra toda la información disponible del usuario y el proceso de mapeo
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { AuthService } from '../services/auth-service.ts'

interface DebugInfo {
  timestamp: string
  userData: unknown
  authServiceData: unknown
  profileData: unknown
  avatarChain: unknown
  errors: string[]
}

export function GoogleAvatarDebugger() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!user) return

    const collectDebugInfo = async () => {
      const errors: string[] = []
      let authServiceData = null

      try {
        // Obtener datos directamente del AuthService
        authServiceData = await AuthService.getOAuthSession()
      } catch (error) {
        errors.push(`Error en AuthService: ${error}`)
      }

      // Construir la cadena de avatar
      const avatarChain = {
        user_avatar_url: user?.avatar_url,
        user_provider: user?.provider,
        user_metadata: user,
        auth_service_avatar: authServiceData?.avatar_url,
        auth_service_provider: authServiceData?.provider,
        fallback_should_activate: user?.provider === 'email' && !user?.avatar_url,
        final_avatar_url: user?.avatar_url || (user?.provider === 'email' ? 'FALLBACK_TO_INITIALS' : 'NO_FALLBACK')
      }

      const debugData: DebugInfo = {
        timestamp: new Date().toISOString(),
        userData: user,
        authServiceData,
        profileData: null, // Se puede expandir si es necesario
        avatarChain,
        errors
      }

      setDebugInfo(debugData)
      
      // Log detallado en consola
      console.log('🚨 GOOGLE AVATAR DEBUGGER - DATOS COMPLETOS:', debugData)
    }

    collectDebugInfo()
  }, [user])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setIsVisible(true)}
          className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          🚨 Mostrar Debugger
        </button>
      </div>
    )
  }

  if (!debugInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-yellow-100 border border-yellow-400 rounded-lg p-4 max-w-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-yellow-800">🔄 Debugger Cargando...</h3>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            ✕
          </button>
        </div>
        <p className="text-yellow-700 text-sm">Esperando datos del usuario...</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg p-4 max-w-lg shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-red-600">🚨 Google Avatar Debugger</h3>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Información básica del usuario */}
        <div className="bg-blue-50 p-3 rounded">
          <h4 className="font-semibold text-blue-800 mb-2">👤 Usuario Básico</h4>
          <div className="space-y-1 text-blue-700">
            <div><strong>ID:</strong> {(debugInfo.userData as Record<string, unknown>)?.id as string}</div>
            <div><strong>Email:</strong> {(debugInfo.userData as Record<string, unknown>)?.email as string}</div>
            <div><strong>Nombre:</strong> {(debugInfo.userData as Record<string, unknown>)?.name as string}</div>
            <div><strong>Provider:</strong> <span className="font-mono">{String((debugInfo.userData as Record<string, unknown>)?.provider || 'N/A')}</span></div>
          </div>
        </div>

        {/* Cadena de avatar */}
        <div className="bg-green-50 p-3 rounded">
          <h4 className="font-semibold text-green-800 mb-2">🖼️ Cadena de Avatar</h4>
          <div className="space-y-1 text-green-700">
            <div><strong>Avatar URL:</strong> <span className="font-mono break-all">{(debugInfo.avatarChain as Record<string, unknown>).user_avatar_url as string || 'null'}</span></div>
            <div><strong>Auth Service Avatar:</strong> <span className="font-mono break-all">{(debugInfo.avatarChain as Record<string, unknown>).auth_service_avatar as string || 'null'}</span></div>
            <div><strong>Fallback Activo:</strong> <span className="font-mono">{String(Boolean((debugInfo.avatarChain as Record<string, unknown>).fallback_should_activate)) === 'true' ? '✅ SÍ' : '❌ NO'}</span></div>
            <div><strong>Avatar Final:</strong> <span className="font-mono">{(debugInfo.avatarChain as Record<string, unknown>).final_avatar_url as string}</span></div>
          </div>
        </div>

        {/* Datos de AuthService */}
        {debugInfo.authServiceData && (
          <div className="bg-purple-50 p-3 rounded">
            <h4 className="font-semibold text-purple-800 mb-2">🔧 AuthService Data</h4>
            <div className="space-y-1 text-purple-700">
              <div><strong>Provider:</strong> <span className="font-mono">{(debugInfo.authServiceData as Record<string, unknown>).provider as string}</span></div>
              <div><strong>Avatar URL:</strong> <span className="font-mono break-all">{(debugInfo.authServiceData as Record<string, unknown>).avatar_url as string || 'null'}</span></div>
            </div>
          </div>
        )}

        {/* Errores */}
        {debugInfo.errors.length > 0 && (
          <div className="bg-red-50 p-3 rounded">
            <h4 className="font-semibold text-red-800 mb-2">❌ Errores</h4>
            <div className="space-y-1 text-red-700">
              {debugInfo.errors.map((error, index) => (
                <div key={index} className="font-mono text-xs">{error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Re-authentication Warning */}
        {localStorage.getItem('google_avatar_reauth_needed') === 'true' && (
          <div className="bg-orange-50 p-3 rounded">
            <h4 className="font-semibold text-orange-800 mb-2">⚠️ Re-autenticación Requerida</h4>
            <div className="space-y-1 text-orange-700">
              <div className="text-xs">El token actual no tiene permisos para acceder a la foto de perfil.</div>
              <div className="text-xs">Haz clic en "Forzar Re-autenticación Google" para solucionarlo.</div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-semibold text-gray-800 mb-2">🔧 Acciones</h4>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                console.log('🚨 DEBUG INFO COMPLETA:', debugInfo)
                alert('Información copiada a la consola. Presiona F12 para verla.')
              }}
              className="w-full bg-blue-600 text-white px-3 py-1 rounded text-xs"
            >
              📋 Copiar a Consola
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.clear()
                sessionStorage.clear()
                alert('Storage limpiado. Recarga la página y haz login de nuevo.')
              }}
              className="w-full bg-red-600 text-white px-3 py-1 rounded text-xs"
            >
              🗑️ Limpiar Storage
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('google_avatar_reauth_needed', 'true')
                alert('Flag de re-autenticación activado. Recarga la página para ver el botón de re-autenticación.')
              }}
              className="w-full bg-yellow-600 text-white px-3 py-1 rounded text-xs"
            >
              🚩 Activar Re-autenticación
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await AuthService.forceGoogleReauth()
                } catch (error) {
                  console.error('Error forcing re-auth:', error)
                  alert('Error al forzar re-autenticación. Intenta manualmente.')
                }
              }}
              className="w-full bg-orange-600 text-white px-3 py-1 rounded text-xs"
            >
              🔄 Forzar Re-autenticación Google
            </button>
            <button
              type="button"
              onClick={async () => {
                const googleUserId = '116297281796239835293'
                try {
                  const workingFormat = await AuthService.testGoogleAvatarFormats(googleUserId)
                  if (workingFormat) {
                    alert(`✅ Working format found: ${workingFormat}`)
                  } else {
                    alert('❌ No working format found')
                  }
                } catch (error) {
                  console.error('Error testing formats:', error)
                  alert('Error testing avatar formats')
                }
              }}
              className="w-full bg-purple-600 text-white px-3 py-1 rounded text-xs"
            >
              🧪 Test Avatar URLs
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 text-center">
          Última actualización: {new Date(debugInfo.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
} 
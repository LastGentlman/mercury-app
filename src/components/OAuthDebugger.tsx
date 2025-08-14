import { useEffect, useState } from 'react'
import { AuthService } from '../services/auth-service.ts'

interface DebugInfo {
  supabaseConfigured: boolean
  supabaseUrl: string | undefined
  currentUrl: string
  urlHash: string
  urlSearch: string
  sessionStatus: string
  authUser: unknown
  lastAuthEvent: string
}

export function OAuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supabaseConfigured: false,
    supabaseUrl: undefined,
    currentUrl: '',
    urlHash: '',
    urlSearch: '',
    sessionStatus: 'Checking...',
    authUser: null,
    lastAuthEvent: 'None'
  })

  useEffect(() => {
    const updateDebugInfo = async () => {
      try {
        // Verificar configuración
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        // Obtener información de la URL
        const currentUrl = globalThis.location.href
        const urlHash = globalThis.location.hash
        const urlSearch = globalThis.location.search
        
        // Intentar obtener sesión
        let sessionStatus = 'No session'
        let authUser = null
        
        try {
          authUser = await AuthService.getOAuthSession()
          sessionStatus = authUser ? `Active: ${authUser.email}` : 'No OAuth session'
        } catch (error: unknown) {
          sessionStatus = `Error: ${error instanceof Error ? error.message : String(error)}`
        }
        
        setDebugInfo({
          supabaseConfigured: Boolean(supabaseUrl && supabaseKey),
          supabaseUrl,
          currentUrl,
          urlHash,
          urlSearch,
          sessionStatus,
          authUser,
          lastAuthEvent: 'Updated'
        })
      } catch (error) {
        console.error('Debug info error:', error)
      }
    }

    // Actualizar info inicial
    updateDebugInfo()

    // Escuchar cambios de auth
    let subscription: unknown = null
    try {
      const authChange = AuthService.onAuthStateChange((event, session) => {
        setDebugInfo(prev => ({
          ...prev,
          lastAuthEvent: `${new Date().toLocaleTimeString()}: ${event} - ${session?.user?.email || 'No user'}`
        }))
        // Actualizar info después de cambio
        setTimeout(updateDebugInfo, 1000)
      })
      subscription = authChange?.data?.subscription
    } catch (error) {
      console.error('Auth state change error:', error)
    }

    // Actualizar cada 5 segundos
    const interval = setInterval(updateDebugInfo, 5000)

    return () => {
      clearInterval(interval)
      if (typeof subscription === 'object' && subscription !== null && 'unsubscribe' in subscription) {
        (subscription as { unsubscribe: () => void }).unsubscribe()
      }
    }
  }, [])

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm max-h-96 overflow-auto z-50">
      <h4 className="font-bold mb-2 text-yellow-400">🔧 OAuth Debug</h4>
      
      <div className="space-y-2">
        <div>
          <strong className="text-blue-300">Config:</strong>
          <div className={debugInfo.supabaseConfigured ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.supabaseConfigured ? '✅ Configurado' : '❌ Falta configuración'}
          </div>
          <div className="text-gray-300 text-xs">
            URL: {debugInfo.supabaseUrl ? '✅' : '❌'}
          </div>
        </div>

        <div>
          <strong className="text-blue-300">URL Info:</strong>
          <div className="text-gray-300 break-all">
            {debugInfo.currentUrl}
          </div>
          <div className="text-gray-300">
            Hash: {debugInfo.urlHash || 'None'}
          </div>
          <div className="text-gray-300">
            Search: {debugInfo.urlSearch || 'None'}
          </div>
        </div>

        <div>
          <strong className="text-blue-300">Session:</strong>
          <div className="text-gray-300">
            {debugInfo.sessionStatus}
          </div>
        </div>

        <div>
          <strong className="text-blue-300">Last Event:</strong>
          <div className="text-gray-300 text-xs">
            {debugInfo.lastAuthEvent}
          </div>
        </div>

        {Boolean(debugInfo.authUser) && (
          <div>
            <strong className="text-blue-300">User:</strong>
            <pre className="text-xs bg-gray-800 p-1 rounded mt-1">
              {JSON.stringify(debugInfo.authUser, null, 1)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-700">
        <button 
          type="button"
          onClick={() => globalThis.location.reload()} 
          className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
        >
          Reload
        </button>
      </div>
    </div>
  )
} 
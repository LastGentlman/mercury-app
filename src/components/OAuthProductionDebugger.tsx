import { useEffect, useState } from 'react'

interface ProductionDebugInfo {
  currentOrigin: string
  environment: string
  supabaseUrl: string | undefined
  isLocalhost: boolean
  shouldShowDebug: boolean
  recommendedSiteUrl: string
  recommendedRedirectUrls: string[]
}

export function OAuthProductionDebugger() {
  const [debugInfo, setDebugInfo] = useState<ProductionDebugInfo>({
    currentOrigin: '',
    environment: '',
    supabaseUrl: undefined,
    isLocalhost: false,
    shouldShowDebug: false,
    recommendedSiteUrl: '',
    recommendedRedirectUrls: []
  })

  useEffect(() => {
    const currentOrigin = window.location.origin
    const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')
    const environment = import.meta.env.MODE
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    // Solo mostrar si hay problemas potenciales
    const shouldShowDebug = !isLocalhost || environment === 'development'
    
    const recommendedSiteUrl = isLocalhost ? 'http://localhost:5173' : currentOrigin
    const recommendedRedirectUrls = [
      `${currentOrigin}/auth/callback`,
      'http://localhost:5173/auth/callback',
      'http://localhost:3000/auth/callback'
    ]

    setDebugInfo({
      currentOrigin,
      environment,
      supabaseUrl,
      isLocalhost,
      shouldShowDebug,
      recommendedSiteUrl,
      recommendedRedirectUrls
    })
  }, [])

  // Solo mostrar en development o si hay URL params de error
  const hasOAuthError = window.location.search.includes('error=invalid_request') || 
                       window.location.search.includes('bad_oauth_state')
  
  if (!debugInfo.shouldShowDebug && !hasOAuthError) return null

  return (
    <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm max-w-md z-50">
      <h4 className="font-bold mb-2 text-red-700">🚨 Configuración OAuth</h4>
      
      <div className="space-y-2">
        <div>
          <strong className="text-red-600">Origen actual:</strong>
          <div className="text-red-700 font-mono text-xs">
            {debugInfo.currentOrigin}
          </div>
        </div>

        <div>
          <strong className="text-red-600">Entorno:</strong>
          <div className="text-red-700">
            {debugInfo.environment} {debugInfo.isLocalhost ? '(localhost)' : '(producción)'}
          </div>
        </div>

        {hasOAuthError && (
          <div className="bg-red-100 border border-red-300 p-2 rounded">
            <strong className="text-red-700">❌ Error OAuth detectado</strong>
            <p className="text-xs text-red-600 mt-1">
              Esto indica que Supabase no reconoce tu dominio.
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-2 rounded">
          <strong className="text-blue-700">✅ Configuración requerida en Supabase:</strong>
          
          <div className="mt-2">
            <div className="text-xs text-blue-600">
              <strong>Site URL:</strong>
            </div>
            <div className="font-mono text-xs text-blue-800 bg-blue-100 p-1 rounded">
              {debugInfo.recommendedSiteUrl}
            </div>
          </div>

          <div className="mt-2">
            <div className="text-xs text-blue-600">
              <strong>Redirect URLs:</strong>
            </div>
            {debugInfo.recommendedRedirectUrls.map((url, index) => (
              <div key={index} className="font-mono text-xs text-blue-800 bg-blue-100 p-1 rounded mb-1">
                {url}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-600">
          <a 
            href={`https://app.supabase.com/project/${debugInfo.supabaseUrl?.split('.')[0]?.replace('https://', '')}/settings/auth`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            🔗 Abrir configuración de Supabase
          </a>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-red-200">
        <button 
          onClick={() => window.location.reload()} 
          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
        >
          Recargar página
        </button>
      </div>
    </div>
  )
} 
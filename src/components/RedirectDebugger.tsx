import { useEffect, useState } from 'react'
import { useRedirectManager } from '../utils/redirectManager.ts'
import { useAuth } from '../hooks/useAuth.ts'

/**
 * Debug component to monitor redirect state and help identify loops
 * Only shows in development mode
 */
export function RedirectDebugger() {
  const { isRedirectInProgress, getRedirectCount } = useRedirectManager()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [redirectHistory, setRedirectHistory] = useState<string[]>([])

  useEffect(() => {
    if (import.meta.env.DEV) {
      const currentState = {
        isRedirectInProgress: isRedirectInProgress(),
        redirectCount: getRedirectCount(),
        isAuthenticated,
        isLoading,
        hasUser: !!user,
        userBusinessId: user?.businessId,
        timestamp: new Date().toLocaleTimeString()
      }

      const stateString = JSON.stringify(currentState, null, 2)
      setRedirectHistory(prev => [...prev.slice(-4), stateString])
    }
  }, [isRedirectInProgress, getRedirectCount, isAuthenticated, isLoading, user])

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono max-w-sm z-50">
      <div className="font-bold mb-2">🔄 Redirect Debug</div>
      <div className="space-y-1">
        <div>Redirecting: {isRedirectInProgress() ? '✅' : '❌'}</div>
        <div>Count: {getRedirectCount()}</div>
        <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {isLoading ? '✅' : '❌'}</div>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Business: {user?.businessId ? '✅' : '❌'}</div>
      </div>
      {redirectHistory.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer">History</summary>
          <pre className="text-xs mt-1 overflow-auto max-h-32">
            {redirectHistory.join('\n\n')}
          </pre>
        </details>
      )}
    </div>
  )
}

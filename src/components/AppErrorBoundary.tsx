import { ErrorBoundary } from '@sentry/react'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

interface ErrorFallbackProps {
  error: unknown
  componentStack: string
  eventId: string
  resetError: () => void
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate({ to: '/' })
    resetError()
  }

  const handleRetry = () => {
    resetError()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Ups! Algo salió mal
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-6">
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y estamos trabajando para solucionarlo.
          </p>

          {/* Error Details (only in development) */}
          {import.meta.env.DEV && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                Detalles del error (solo desarrollo)
              </summary>
              <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-800 overflow-auto max-h-32">
                {error instanceof Error ? error.message : String(error)}
                {error instanceof Error && error.stack && (
                  <pre className="mt-2 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Intentar de nuevo
            </Button>

            <Button
              variant="outline"
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </Button>
          </div>

          {/* Contact Support */}
          <p className="text-xs text-gray-500 mt-6">
            Si el problema persiste, contacta a soporte técnico.
          </p>
        </div>
      </div>
    </div>
  )
}

interface AppErrorBoundaryProps {
  children: React.ReactNode
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App Error:', error)
        console.error('Error Info:', errorInfo)
        // Sentry will automatically capture the error
      }}
    >
      {children}
    </ErrorBoundary>
  )
} 
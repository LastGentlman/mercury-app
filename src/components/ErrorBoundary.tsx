import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { logger } from '../utils/logger.ts'

// 🎯 Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error | undefined
  errorInfo?: ErrorInfo | undefined
  errorId?: string | undefined
}

// 🎯 Error boundary props interface
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo, errorId: string) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  resetOnPropsChange?: boolean
  componentName?: string
}

// 🎯 Generate unique error ID
const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 🎯 Default error fallback component
const DefaultErrorFallback: React.FC<{
  error: Error
  errorInfo: ErrorInfo
  errorId: string
  onReset: () => void
}> = ({ error, errorInfo, errorId, onReset }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Algo salió mal
        </h2>
        
        <p className="text-gray-600 mb-6">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
        </p>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mb-6">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Error ID:</strong> {errorId}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Mensaje:</strong> {error.message}
          </p>
          {import.meta.env.DEV && (
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer hover:text-gray-800">
                Ver detalles técnicos
              </summary>
              <pre className="mt-2 whitespace-pre-wrap overflow-auto">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
        
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
          
          <button
            type="button"
            onClick={() => globalThis.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Recargar página
          </button>
        </div>
        
        {import.meta.env.DEV && (
          <div className="mt-4 text-xs text-gray-500">
            💡 Modo desarrollo: Los errores se muestran con más detalle
          </div>
        )}
      </div>
    </div>
  )
}

// 🎯 Main Error Boundary component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = generateErrorId()
    
    // 🎯 Log error with context
    logger.component.error(
      this.props.componentName || 'UnknownComponent',
      error,
      {
        errorId,
        componentStack: errorInfo.componentStack,
        errorMessage: error.message,
        errorName: error.name
      }
    )

    // 🎯 Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId
    })

    // 🎯 Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId)
    }
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // 🎯 Reset error state if props changed and resetOnPropsChange is true
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.setState({ hasError: false })
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false
    })
  }

  override render(): ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorInfo && this.state.errorId) {
      // 🎯 Render custom fallback or default
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.state.errorInfo, this.state.errorId)
        }
        return this.props.fallback
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

// 🎯 Hook for functional components to throw errors
export const useErrorBoundary = () => {
  const throwError = (error: Error): void => {
    throw error
  }

  return { throwError }
}

// 🎯 Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// 🎯 Specific error boundaries for different contexts
export const AuthErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    componentName="Auth"
    fallback={(_error, _errorInfo, _errorId) => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error de Autenticación
          </h2>
          
          <p className="text-gray-600 mb-6">
            Ha ocurrido un error durante la autenticación. Por favor, intenta de nuevo.
          </p>
          
          <button
            type="button"
            onClick={() => globalThis.location.href = '/auth'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Login
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
)

export const APIErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    componentName="API"
    fallback={(_error, _errorInfo, _errorId) => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error de Conexión
          </h2>
          
          <p className="text-gray-600 mb-6">
            No se pudo conectar con el servidor. Verifica tu conexión a internet.
          </p>
          
          <button
            type="button"
            onClick={() => globalThis.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
) 
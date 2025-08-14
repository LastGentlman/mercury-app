import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface LoadingSuspenseProps {
  children: ReactNode
  fallback?: ReactNode
  errorBoundary?: boolean
}

function DefaultFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-gray-700 font-medium">Cargando...</span>
      </div>
    </div>
  )
}

export function LoadingSuspense({ 
  children, 
  fallback = <DefaultFallback />,
  errorBoundary = true 
}: LoadingSuspenseProps) {
  const content = (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )

  // If error boundary is requested, wrap with AppErrorBoundary
  if (errorBoundary) {
    // We need to import this dynamically to avoid circular dependencies
    const { AppErrorBoundary } = require('./AppErrorBoundary.tsx')
    return <AppErrorBoundary>{content}</AppErrorBoundary>
  }

  return content
}

// Specialized loading components for different use cases
export function PageLoadingSuspense({ children }: { children: ReactNode }) {
  return (
    <LoadingSuspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando página...</p>
          </div>
        </div>
      }
    >
      {children}
    </LoadingSuspense>
  )
}

export function ComponentLoadingSuspense({ children }: { children: ReactNode }) {
  return (
    <LoadingSuspense
      fallback={
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      }
    >
      {children}
    </LoadingSuspense>
  )
}

export function TableLoadingSuspense({ children }: { children: ReactNode }) {
  return (
    <LoadingSuspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Cargando datos...</span>
          </div>
        </div>
      }
    >
      {children}
    </LoadingSuspense>
  )
} 
import { createContext, useContext, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface GlobalLoadingContextType {
  isGlobalLoading: boolean
  setIsGlobalLoading: (loading: boolean) => void
  startLoading: () => void
  stopLoading: () => void
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined)

interface GlobalLoadingProviderProps {
  children: ReactNode
}

export function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false)

  const startLoading = () => setIsGlobalLoading(true)
  const stopLoading = () => setIsGlobalLoading(false)

  return (
    <GlobalLoadingContext.Provider
      value={{
        isGlobalLoading,
        setIsGlobalLoading,
        startLoading,
        stopLoading,
      }}
    >
      {children}
      
      {/* Global Loading Overlay */}
      {isGlobalLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-700 font-medium">Cargando...</span>
          </div>
        </div>
      )}
    </GlobalLoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext)
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider')
  }
  return context
} 
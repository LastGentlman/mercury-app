import { useCallback, useState } from 'react'
import { useGlobalLoading } from '../components/GlobalLoadingProvider.tsx'

interface UseLoadingStateOptions {
  useGlobal?: boolean
  message?: string
}

interface UseLoadingStateReturn {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  startLoading: () => void
  stopLoading: () => void
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>
}

export function useLoadingState(options: UseLoadingStateOptions = {}): UseLoadingStateReturn {
  const { useGlobal = false } = options
  const [localLoading, setLocalLoading] = useState(false)
  const { isGlobalLoading, startLoading: startGlobalLoading, stopLoading: stopGlobalLoading } = useGlobalLoading()

  const isLoading = useGlobal ? isGlobalLoading : localLoading

  const setIsLoading = useCallback((loading: boolean) => {
    if (useGlobal) {
      if (loading) {
        startGlobalLoading()
      } else {
        stopGlobalLoading()
      }
    } else {
      setLocalLoading(loading)
    }
  }, [useGlobal, startGlobalLoading, stopGlobalLoading])

  const startLoading = useCallback(() => {
    setIsLoading(true)
  }, [setIsLoading])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [setIsLoading])

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      startLoading()
      return await asyncFn()
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
    withLoading,
  }
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const startLoading = useCallback((key: string) => {
    setLoading(key, true)
  }, [setLoading])

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false)
  }, [setLoading])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  return {
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
  }
} 
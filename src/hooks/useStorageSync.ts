import { useEffect, useState, useCallback, useRef } from 'react'

type StorageType = 'localStorage' | 'sessionStorage'
type StorageValue = string | null

interface StorageSyncOptions {
  storageType?: StorageType
  syncAcrossTabs?: boolean
  debounceMs?: number
  fallbackValue?: string
}

interface StorageSyncReturn {
  value: StorageValue
  setValue: (value: string | null) => void
  isLoading: boolean
  error: string | null
  clearValue: () => void
}

// ✅ Cache global para evitar multiple reads del mismo key
const storageCache = new Map<string, { value: StorageValue; timestamp: number }>()
const CACHE_TTL = 5000 // 5 segundos

// ✅ Función helper para acceso seguro al storage
function safeStorageAccess(type: StorageType, operation: 'get' | 'set' | 'remove', key: string, value?: string): StorageValue {
  try {
    const storage = type === 'localStorage' ? localStorage : sessionStorage
    
    switch (operation) {
      case 'get':
        return storage.getItem(key)
      case 'set':
        if (value !== undefined) {
          storage.setItem(key, value)
        }
        return value ?? null
      case 'remove':
        storage.removeItem(key)
        return null
      default:
        return null
    }
  } catch (error) {
    console.warn(`❌ Storage ${operation} failed for key "${key}":`, error)
    return null
  }
}

// ✅ Hook principal para storage sync seguro
export function useStorageSync(
  key: string, 
  options: StorageSyncOptions = {}
): StorageSyncReturn {
  const {
    storageType = 'localStorage',
    syncAcrossTabs = true,
    debounceMs = 300,
    fallbackValue = null
  } = options

  const [value, setValue] = useState<StorageValue>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Referencias para cleanup y debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const lastSetValueRef = useRef<string | null>(null)

  // ✅ Función para leer del storage con cache
  const readFromStorage = useCallback((): StorageValue => {
    try {
      // Check cache first
      const cached = storageCache.get(`${storageType}:${key}`)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.value
      }

      // Read from storage
      const storageValue = safeStorageAccess(storageType, 'get', key)
      
      // Update cache
      storageCache.set(`${storageType}:${key}`, {
        value: storageValue,
        timestamp: Date.now()
      })
      
      return storageValue ?? fallbackValue
    } catch (err) {
      console.error(`❌ Failed to read from ${storageType}:`, err)
      setError(err instanceof Error ? err.message : 'Storage read error')
      return fallbackValue
    }
  }, [key, storageType, fallbackValue])

  // ✅ Función para escribir al storage con debouncing
  const writeToStorage = useCallback((newValue: string | null) => {
    if (!isMountedRef.current) return

    // Clear previous debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Debounced write
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        if (newValue === null) {
          safeStorageAccess(storageType, 'remove', key)
        } else {
          safeStorageAccess(storageType, 'set', key, newValue)
        }

        // Update cache
        storageCache.set(`${storageType}:${key}`, {
          value: newValue,
          timestamp: Date.now()
        })

        // Update state if still mounted
        if (isMountedRef.current) {
          setValue(newValue)
          lastSetValueRef.current = newValue
          setError(null)
        }
      } catch (err) {
        console.error(`❌ Failed to write to ${storageType}:`, err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Storage write error')
        }
      }
    }, debounceMs)
  }, [key, storageType, debounceMs])

  // ✅ Handler para storage events (sync entre tabs)
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (!syncAcrossTabs || !isMountedRef.current) return
    
    if (event.key === key && event.storageArea === (storageType === 'localStorage' ? localStorage : sessionStorage)) {
      const newValue = event.newValue
      
      // Solo actualizar si el valor realmente cambió y no fue nuestro propio cambio
      if (newValue !== lastSetValueRef.current) {
        setValue(newValue)
        
        // Update cache
        storageCache.set(`${storageType}:${key}`, {
          value: newValue,
          timestamp: Date.now()
        })
      }
    }
  }, [key, storageType, syncAcrossTabs])

  // ✅ Inicialización
  useEffect(() => {
    isMountedRef.current = true
    setIsLoading(true)
    setError(null)

    // Read initial value
    const initialValue = readFromStorage()
    if (isMountedRef.current) {
      setValue(initialValue)
      setIsLoading(false)
    }

    // Setup storage event listener for tab sync
    if (syncAcrossTabs) {
      window.addEventListener('storage', handleStorageChange)
    }

    return () => {
      isMountedRef.current = false
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (syncAcrossTabs) {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [key, storageType, syncAcrossTabs, handleStorageChange, readFromStorage])

  // ✅ Public interface
  const setValueSafe = useCallback((newValue: string | null) => {
    if (!isMountedRef.current) return
    writeToStorage(newValue)
  }, [writeToStorage])

  const clearValue = useCallback(() => {
    setValueSafe(null)
  }, [setValueSafe])

  return {
    value,
    setValue: setValueSafe,
    isLoading,
    error,
    clearValue
  }
}

// ✅ Hook especializado para authToken
export function useAuthToken() {
  return useStorageSync('authToken', {
    storageType: 'localStorage',
    syncAcrossTabs: true,
    debounceMs: 100 // Menos debounce para auth token
  })
}

// ✅ Hook especializado para sessionId
export function useSessionId() {
  return useStorageSync('sessionId', {
    storageType: 'localStorage',
    syncAcrossTabs: true,
    fallbackValue: generateUUID()
  })
}

// ✅ Hook especializado para PWA state
export function usePWAInstallState() {
  return useStorageSync('pwa-installed', {
    storageType: 'localStorage',
    syncAcrossTabs: true,
    fallbackValue: 'false'
  })
}

// ✅ Utility function for UUID generation
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// ✅ Utility para limpiar toda la cache
export function clearStorageCache() {
  storageCache.clear()
}

// ✅ Utility para debug
export function getStorageCacheInfo() {
  return {
    size: storageCache.size,
    keys: Array.from(storageCache.keys()),
    entries: Array.from(storageCache.entries()).map(([key, { value, timestamp }]) => ({
      key,
      value,
      age: Date.now() - timestamp
    }))
  }
} 
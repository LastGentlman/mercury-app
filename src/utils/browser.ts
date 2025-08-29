/**
 * 🛡️ Browser Utilities - Safe Window/Location Access
 * 
 * Proporciona acceso seguro a APIs del navegador con:
 * - Verificación de entorno (SSR/CSR)
 * - Fallbacks para entornos sin window
 * - Type safety mejorado
 */

// 🎯 Verificación de entorno
export const isBrowser = typeof window !== 'undefined'
export const isSSR = !isBrowser

// 🎯 Safe location access
export const getLocation = () => {
  if (!isBrowser) {
    throw new Error('Location API not available in SSR')
  }
  return globalThis.location
}

// 🎯 Safe origin access
export const getOrigin = (): string => {
  if (isBrowser && globalThis.location) {
    return globalThis.location.origin
  }
  return import.meta.env.VITE_APP_URL || 'http://localhost:3000'
}

// 🎯 Safe href access
export const getHref = (): string => {
  if (isBrowser && globalThis.location) {
    return globalThis.location.href
  }
  return getOrigin()
}

// 🎯 Safe pathname access
export const getPathname = (): string => {
  if (isBrowser && globalThis.location) {
    return globalThis.location.pathname
  }
  return '/'
}

// 🎯 Safe search params access
export const getSearchParams = (): URLSearchParams => {
  if (isBrowser && globalThis.location) {
    return new URLSearchParams(globalThis.location.search)
  }
  return new URLSearchParams()
}

// 🎯 Safe hash access
export const getHash = (): string => {
  if (isBrowser && globalThis.location) {
    return globalThis.location.hash
  }
  return ''
}

// 🎯 Safe navigation (SPA-friendly)
export const safeNavigate = (to: string, navigate: (options: { to: string }) => void) => {
  if (isBrowser) {
    navigate({ to })
  } else {
    // Fallback para SSR
    console.warn('Navigation not available in SSR, redirecting to:', to)
  }
}

// 🎯 Safe reload
export const safeReload = () => {
  if (isBrowser && globalThis.location) {
    globalThis.location.reload()
  } else {
    console.warn('Reload not available in SSR')
  }
}

// 🎯 Safe redirect (use only when SPA navigation is not possible)
export const safeRedirect = (url: string) => {
  if (isBrowser && globalThis.location) {
    globalThis.location.href = url
  } else {
    console.warn('Redirect not available in SSR, target:', url)
  }
}

// 🎯 Build callback URL safely
export const buildCallbackUrl = (source?: string): string => {
  const origin = getOrigin()
  const params = source ? `?source=${source}` : ''
  return `${origin}/auth/callback${params}`
}

// 🎯 Check if current path matches
export const isCurrentPath = (path: string): boolean => {
  if (isBrowser && globalThis.location) {
    return globalThis.location.pathname === path
  }
  return false
}

// 🎯 Get current URL info
export const getCurrentUrlInfo = () => {
  if (!isBrowser) {
    return {
      href: getOrigin(),
      pathname: '/',
      search: '',
      hash: '',
      origin: getOrigin()
    }
  }

  return {
    href: globalThis.location.href,
    pathname: globalThis.location.pathname,
    search: globalThis.location.search,
    hash: globalThis.location.hash,
    origin: globalThis.location.origin
  }
}

// 🎯 Safe localStorage access
export const safeStorage = {
  get: (key: string): string | null => {
    try {
      if (isBrowser && globalThis.localStorage) {
        return globalThis.localStorage.getItem(key)
      }
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error)
    }
    return null
  },

  set: (key: string, value: string): boolean => {
    try {
      if (isBrowser && globalThis.localStorage) {
        globalThis.localStorage.setItem(key, value)
        return true
      }
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error)
    }
    return false
  },

  remove: (key: string): boolean => {
    try {
      if (isBrowser && globalThis.localStorage) {
        globalThis.localStorage.removeItem(key)
        return true
      }
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error)
    }
    return false
  },

  clear: (): boolean => {
    try {
      if (isBrowser && globalThis.localStorage) {
        globalThis.localStorage.clear()
        return true
      }
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
    return false
  }
}

// 🎯 Safe sessionStorage access
export const safeSessionStorage = {
  get: (key: string): string | null => {
    try {
      if (isBrowser && globalThis.sessionStorage) {
        return globalThis.sessionStorage.getItem(key)
      }
    } catch (error) {
      console.error(`Failed to get ${key} from sessionStorage:`, error)
    }
    return null
  },

  set: (key: string, value: string): boolean => {
    try {
      if (isBrowser && globalThis.sessionStorage) {
        globalThis.sessionStorage.setItem(key, value)
        return true
      }
    } catch (error) {
      console.error(`Failed to set ${key} in sessionStorage:`, error)
    }
    return false
  },

  remove: (key: string): boolean => {
    try {
      if (isBrowser && globalThis.sessionStorage) {
        globalThis.sessionStorage.removeItem(key)
        return true
      }
    } catch (error) {
      console.error(`Failed to remove ${key} from sessionStorage:`, error)
    }
    return false
  }
} 
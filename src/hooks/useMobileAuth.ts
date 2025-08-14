// hooks/useMobileAuth.ts
// Hook especializado para manejar la lógica mobile-first en auth

import { useState, useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { isMobileDevice } from '../lib/utils.ts'
import { useAuth } from './useAuth.ts'

export interface MobileAuthConfig {
  hideHeaderOnAuth?: boolean
  showLogoInAuth?: boolean
  enableMobileOptimizations?: boolean
}

export interface MobileAuthStyles {
  container: string
  form: string
  button: string
  input: string
  icon: string
  title: string
  spacing: string
  logo: string
}

export interface MobileAuthReturn {
  isMobile: boolean
  isAuthPage: boolean
  shouldHideHeader: boolean
  shouldShowLogo: boolean
  isAuthenticated: boolean
  isLoading: boolean
  styles: MobileAuthStyles
  isMobileAuth: boolean
  shouldOptimize: boolean
  currentPath: string
}

export function useMobileAuth(config: MobileAuthConfig = {}): MobileAuthReturn {
  const {
    hideHeaderOnAuth = true,
    showLogoInAuth = true,
    enableMobileOptimizations = true
  } = config

  const [isMobile, setIsMobile] = useState(false)
  const router = useRouterState()
  const { isAuthenticated, isLoading } = useAuth()
  
  const currentPath = router.location.pathname
  
  // Detect mobile device with resize listener
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice())
    }
    
    checkMobile()
    
    if (enableMobileOptimizations) {
      globalThis.addEventListener('resize', checkMobile)
      return () => globalThis.removeEventListener('resize', checkMobile)
    }
    
    return undefined
  }, [enableMobileOptimizations])

  // Determine if we're on an auth page
  const isAuthPage = currentPath === '/auth' || 
                    currentPath === '/auth/callback' ||
                    currentPath.startsWith('/auth/')

  // Should header be hidden?
  const shouldHideHeader = hideHeaderOnAuth && isMobile && isAuthPage

  // Should show logo in auth form?
  const shouldShowLogo = showLogoInAuth && isMobile && isAuthPage

  // Mobile-specific styles with CSS classes integration
  const getMobileAuthStyles = (): MobileAuthStyles => {
    if (!isMobile || !isAuthPage) {
      return {
        container: '',
        form: 'px-4 py-3',
        button: 'py-3 px-4',
        input: 'px-4 py-3',
        icon: 'w-5 h-5',
        title: 'text-2xl',
        spacing: 'mb-6',
        logo: 'hidden'
      }
    }

    return {
      container: 'auth-mobile-container auth-mobile-bg auth-safe-area auth-mobile-optimized',
      form: 'auth-mobile-form',
      button: 'auth-mobile-button auth-touch-feedback',
      input: 'auth-mobile-input auth-mobile-focus',
      icon: 'w-6 h-6 p-2 auth-touch-feedback',
      title: 'auth-responsive-title',
      spacing: 'mb-8',
      logo: 'auth-mobile-logo auth-logo-float'
    }
  }

  // Get auth page configuration
  return {
    isMobile,
    isAuthPage,
    shouldHideHeader,
    shouldShowLogo,
    isAuthenticated,
    isLoading,
    styles: getMobileAuthStyles(),
    isMobileAuth: isMobile && isAuthPage,
    shouldOptimize: enableMobileOptimizations && isMobile,
    currentPath
  }
}

// 🎯 EJEMPLO DE USO:

/**
 * // En Header.tsx
 * const { shouldHideHeader } = useMobileAuth()
 * if (shouldHideHeader) return null
 * 
 * // En auth.tsx
 * const { shouldShowLogo, styles, isMobileAuth } = useMobileAuth()
 * 
 * return (
 *   <div className={`auth-container ${styles.container}`}>
 *     {shouldShowLogo && <Logo />}
 *     <form className={styles.form}>
 *       <input className={styles.input} />
 *       <button className={styles.button}>Submit</button>
 *     </form>
 *   </div>
 * )
 */ 
// hooks/useMobileAuth.ts
// Hook especializado para manejar la lógica mobile-first en auth

import { useState, useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { isMobileDevice } from '../lib/utils'
import { useAuth } from './useAuth'

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
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [enableMobileOptimizations])

  // Determine if we're on an auth page
  const isAuthPage = currentPath === '/auth' || 
                    currentPath === '/auth/callback' ||
                    currentPath.startsWith('/auth/')

  // Should header be hidden?
  const shouldHideHeader = hideHeaderOnAuth && isMobile && isAuthPage

  // Should show logo in auth form?
  const shouldShowLogo = showLogoInAuth && isMobile && isAuthPage

  // Mobile-specific styles
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
      container: 'pt-8 min-h-screen',
      form: 'px-4 py-4 text-lg',
      button: 'py-4 px-4 text-lg',
      input: 'px-4 py-4 text-lg',
      icon: 'w-6 h-6 p-2',
      title: 'text-xl',
      spacing: 'mb-8',
      logo: 'block'
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
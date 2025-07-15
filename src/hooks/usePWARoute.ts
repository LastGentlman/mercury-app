import { useEffect } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { isPWAInstalled } from '../pwa-fixed'
import { useAuth } from './useAuth'

export function usePWARoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return

    // Only redirect if we're on the home page
    if (location.pathname !== '/') return

    // Check if app is installed as PWA
    const isInstalledPWA = isPWAInstalled()

    if (isInstalledPWA && !isAuthenticated) {
      // User opened PWA but is not authenticated -> redirect to login
      console.log('🔄 PWA detected: Redirecting to login')
      navigate({ to: '/auth' })
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate])

  return {
    isPWA: isPWAInstalled(),
    isAuthenticated,
    isLoading
  }
} 
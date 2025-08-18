// auth.tsx - Enhanced with Progressive Loading States and Performance Optimizations

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { useMobileAuth } from '../hooks/useMobileAuth.ts'
import { Button } from '../components/ui/index.ts'
import { Input } from '../components/ui/index.ts'
import { Label } from '../components/ui/index.ts'
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { SuccessMessage } from '../components/SuccessMessage.tsx'
import { SocialLoginButtons } from '../components/SocialLoginButtons.tsx'
import { useNotifications } from '../hooks/useNotifications.ts'

interface AuthFormData {
  email: string
  password: string
  name?: string
}

// Enhanced loading states for granular feedback
interface AuthLoadingState {
  isValidating: boolean     // Client-side validation
  isAuthenticating: boolean // Server authentication
  isRedirecting: boolean   // Post-auth redirect
  phase: 'idle' | 'validating' | 'authenticating' | 'redirecting'
}

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

// Client-side validation with immediate feedback
const validateCredentials = (formData: AuthFormData, isLogin: boolean) => {
  const errors: string[] = []
  
  if (!formData.email || !formData.password) {
    errors.push('Completa todos los campos')
    return { isValid: false, errors }
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    errors.push('Por favor ingresa un email válido.')
    return { isValid: false, errors }
  }
  
  // Password validation for registration
  if (!isLogin && formData.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres.')
    return { isValid: false, errors }
  }
  
  if (!isLogin && !formData.name) {
    errors.push('El nombre es requerido para el registro')
    return { isValid: false, errors }
  }
  
  return { isValid: true, errors: [] }
}

// Performance tracking for auth flow
const createAuthPerformanceTracker = () => {
  const start = Date.now()
  return {
    trackValidation: () => {
      const validationTime = Date.now() - start
      console.log(`⏱️ Client validation: ${validationTime}ms`)
      return validationTime
    },
    trackAuthentication: () => {
      const authTime = Date.now() - start
      console.log(`⏱️ Authentication: ${authTime}ms`)
      return authTime
    },
    trackTotal: () => {
      const totalTime = Date.now() - start
      console.log(`⏱️ Total auth time: ${totalTime}ms`)
      
      // Performance alerts
      if (totalTime < 1000) {
        console.log('🚀 Fast auth achieved!')
      } else if (totalTime < 2000) {
        console.log('✅ Acceptable auth time')
      } else {
        console.log('⚠️ Slow auth detected')
      }
      
      return totalTime
    }
  }
}

// Debug component for development
function AuthDebug() {
  const auth = useAuth()
  const [token, setToken] = useState<string | null>(null)
  
  useEffect(() => {
    const updateToken = () => {
      setToken(localStorage.getItem('authToken'))
    }
    updateToken()
    
    // Listen for localStorage changes
    globalThis.addEventListener('storage', updateToken)
    return () => globalThis.removeEventListener('storage', updateToken)
  }, [])
  
  if (import.meta.env.PROD) return null // Only show in development
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '16px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <div><strong>🐛 Auth Debug</strong></div>
      <div>isAuthenticated: <span style={{color: auth.isAuthenticated ? '#4ade80' : '#f87171'}}>{auth.isAuthenticated.toString()}</span></div>
      <div>isLoading: {auth.isLoading.toString()}</div>
      <div>user: {auth.user ? auth.user.email : 'null'}</div>
      <div>provider: {auth.user?.provider || 'none'}</div>
      <div>token: {token ? `${token.substring(0, 20)}...` : 'null'}</div>
      <button 
        type="button"
        onClick={() => auth.refetchUser()} 
        style={{ 
          marginTop: '8px', 
          padding: '4px 8px', 
          background: '#3b82f6', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Refetch User
      </button>
    </div>
  )
}

function AuthPage() {
  const navigate = useNavigate()
  const { login, register, isLoginLoading, isRegisterLoading, isSocialLoginLoading } = useAuth()
  const notifications = useNotifications()
  const { shouldShowLogo, styles, isMobile, isAuthenticated } = useMobileAuth()
  
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  
  // Enhanced loading state management
  const [loadingState, setLoadingState] = useState<AuthLoadingState>({
    isValidating: false,
    isAuthenticating: false,
    isRedirecting: false,
    phase: 'idle'
  })
  
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: ''
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Redirecting to dashboard, user authenticated:', isAuthenticated)
      setLoadingState(prev => ({ ...prev, isRedirecting: true, phase: 'redirecting' }))
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  // Optimized form loading state
  const isFormLoading = loadingState.isValidating || loadingState.isAuthenticating || 
                       isLoginLoading || isRegisterLoading || isSocialLoginLoading

  // Enhanced submit handler with progressive states
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const tracker = createAuthPerformanceTracker()
    
    try {
      // Phase 1: Client-side validation
      setLoadingState({
        isValidating: true,
        isAuthenticating: false,
        isRedirecting: false,
        phase: 'validating'
      })
      
      const validation = validateCredentials(formData, isLogin)
      tracker.trackValidation()
      
      if (!validation.isValid) {
        validation.errors.forEach(error => notifications.error(error))
        setLoadingState({
          isValidating: false,
          isAuthenticating: false,
          isRedirecting: false,
          phase: 'idle'
        })
        return
      }
      
      // Phase 2: Server authentication
      setLoadingState({
        isValidating: false,
        isAuthenticating: true,
        isRedirecting: false,
        phase: 'authenticating'
      })
      
      if (isLogin) {
        // Login logic
        await login.mutateAsync({
          email: formData.email,
          password: formData.password
        })
        
        tracker.trackAuthentication()
        notifications.success('¡Bienvenido a Mercury!')
        
        // Phase 3: Redirecting
        setLoadingState({
          isValidating: false,
          isAuthenticating: false,
          isRedirecting: true,
          phase: 'redirecting'
        })
        
        // Redirect handled by useEffect above
      } else {
        // Register logic
        await register.mutateAsync({
          email: formData.email,
          password: formData.password,
          name: formData.name || ''
        })
        
        tracker.trackAuthentication()
        setRegisteredEmail(formData.email)
        setShowEmailConfirmation(true)
        notifications.success('¡Registro exitoso! Revisa tu email para verificar tu cuenta.')
      }
      
      tracker.trackTotal()
      
    } catch (error: unknown) {
      console.error('Auth error:', error)
      const message = error instanceof Error ? error.message : 
        `Error durante ${isLogin ? 'el inicio de sesión' : 'el registro'}. Inténtalo de nuevo.`
      notifications.error(message)
    } finally {
      // Reset loading state
      setLoadingState({
        isValidating: false,
        isAuthenticating: false,
        isRedirecting: false,
        phase: 'idle'
      })
    }
  }, [formData, isLogin, login, register, notifications])

  // Progressive loading indicator
  const getLoadingMessage = () => {
    switch (loadingState.phase) {
      case 'validating':
        return 'Validando datos...'
      case 'authenticating':
        return isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'
      case 'redirecting':
        return 'Redirigiendo...'
      default:
        return isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
    }
  }

  // Loading icon component
  const LoadingIcon = () => {
    if (loadingState.phase === 'idle') return null
    
    return (
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
    )
  }

  // Show email confirmation screen after successful registration
  if (showEmailConfirmation) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center p-4 ${styles.container}`}>
        <div className="w-full max-w-md">
          {/* 🎯 MOBILE-FIRST: Logo en confirmación cuando no hay header */}
          {shouldShowLogo && (
            <div className="text-center mb-8">
              <div className={`font-bold text-3xl text-slate-800 mb-2 ${styles.logo}`}>
                Mercury
              </div>
              <div className="auth-mobile-divider"></div>
            </div>
          )}
          
          <SuccessMessage
            type="success"
            title="¡Registro Exitoso!"
            message={`Te hemos enviado un email de confirmación a ${registeredEmail}. Por favor revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.`}
            email={registeredEmail}
          />
          
          <div className="mt-6 text-center space-y-4">
            <Button
              onClick={() => {
                setIsLogin(true)
                setShowEmailConfirmation(false)
                setFormData({ email: '', password: '', name: '' })
              }}
              className={`w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-3 px-4 rounded-lg transition-colors ${isMobile ? 'auth-mobile-button auth-touch-feedback' : ''}`}
            >
              Ir al Login
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setIsLogin(false)
                setShowEmailConfirmation(false)
                setFormData({ email: '', password: '', name: '' })
              }}
              className={`w-full ${isMobile ? 'auth-mobile-button auth-touch-feedback' : ''}`}
            >
              Crear otra cuenta
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center p-4 ${styles.container}`}>
      <AuthDebug />
      <div className="w-full max-w-md">
        {/* 🎯 MOBILE-FIRST: Logo cuando no hay header */}
        {shouldShowLogo && (
          <div className="text-center mb-8">
            <div className="font-bold text-3xl text-slate-800 mb-2">
              Mercury
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
          </div>
        )}

        <div className={`bg-white rounded-2xl shadow-xl border border-[#e5e7eb] p-8 ${isMobile ? 'auth-slide-up auth-mobile-optimized' : ''}`}>
          {/* Header */}
          <div className={`text-center mb-8 ${isFormLoading && isMobile ? 'auth-mobile-loading' : ''}`}>
            {!isMobile && (
              <div className="w-16 h-16 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            )}
            
            <h1 className={`font-bold text-[#111827] mb-2 ${styles.title}`}>
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-[#6b7280] text-sm">
              {isLogin 
                ? 'Ingresa tus credenciales para acceder a tu cuenta'
                : 'Completa los campos para crear tu nueva cuenta'
              }
            </p>
            
            {/* Progressive loading indicator */}
            {loadingState.phase !== 'idle' && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-center text-blue-700 text-sm">
                  <LoadingIcon />
                  {getLoadingMessage()}
                </div>
                
                {/* Progress visualization */}
                <div className="mt-2 w-full bg-blue-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: loadingState.phase === 'validating' ? '33%' :
                             loadingState.phase === 'authenticating' ? '66%' :
                             loadingState.phase === 'redirecting' ? '100%' : '0%'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 🆕 MOBILE-FIRST: Botones sociales más prominentes en móvil */}
          <div className={`mb-6 ${styles.spacing}`}>
            <SocialLoginButtons 
              disabled={isFormLoading}
              className="w-full"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={`space-y-5 ${isMobile ? 'auth-mobile-form' : ''}`}>
            {/* Name field (only for registration) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-[#374151]">
                  Nombre completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  className={`w-full border border-[#d1d5db] rounded-lg text-base transition-colors focus:border-[#3b82f6] focus:ring-0 focus:ring-[#3b82f6] focus:ring-opacity-10 ${styles.input}`}
                  required={!isLogin}
                  disabled={isFormLoading}
                />
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#374151]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange('email')}
                className={`w-full border border-[#d1d5db] rounded-lg text-base transition-colors focus:border-[#3b82f6] focus:ring-0 focus:ring-[#3b82f6] focus:ring-opacity-10 ${styles.input}`}
                required
                disabled={isFormLoading}
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#374151]">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className={`w-full border border-[#d1d5db] rounded-lg text-base transition-colors focus:border-[#3b82f6] focus:ring-0 focus:ring-[#3b82f6] focus:ring-opacity-10 pr-12 ${styles.input}`}
                  required
                  disabled={isFormLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] disabled:opacity-50 ${styles.icon}`}
                  disabled={isFormLoading}
                >
                  {showPassword ? <EyeOff className={styles.icon} /> : <Eye className={styles.icon} />}
                </button>
              </div>
            </div>

            {/* 🎯 MOBILE-FIRST: Enhanced submit button */}
            <Button
              type="submit"
              disabled={isFormLoading}
              className={`w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed ${styles.button} flex items-center justify-center`}
            >
              <LoadingIcon />
              {getLoadingMessage()}
            </Button>
          </form>

          {/* Toggle between login and register */}
          <div className="text-center mt-8 pt-6 border-t border-[#e5e7eb]">
            <div className="text-sm text-[#6b7280]">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setFormData({ email: '', password: '', name: '' })
                  setLoadingState({
                    isValidating: false,
                    isAuthenticating: false,
                    isRedirecting: false,
                    phase: 'idle'
                  })
                }}
                className={`text-[#3b82f6] font-medium hover:underline disabled:opacity-50 ${isMobile ? 'auth-touch-feedback auth-mode-switch' : ''}`}
                disabled={isFormLoading}
              >
                {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </div>
          </div>
        </div>

        {/* 🎯 MOBILE-FIRST: Link de regreso solo en móvil */}
        {shouldShowLogo && !showEmailConfirmation && (
          <div className="text-center mt-6">
            <Link 
              to="/"
              className="text-sm text-[#6b7280] hover:text-[#3b82f6] transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 
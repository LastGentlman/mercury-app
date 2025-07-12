import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { SuccessMessage } from '../components/SuccessMessage'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

interface AuthFormData {
  email: string
  password: string
  name?: string
}

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: ''
  })
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string>('')
  
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()
  const notifications = useNotifications()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.email || !formData.password) {
      notifications.error('Completa todos los campos')
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      notifications.error('Por favor ingresa un email válido.')
      return
    }
    
    // Password validation for registration
    if (!isLogin && formData.password.length < 6) {
      notifications.error('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    
    if (isLogin) {
      login.mutate(
        { email: formData.email, password: formData.password },
        {
          onSuccess: () => {
            notifications.success('¡Bienvenido a PedidoList!')
          },
          onError: (error: Error) => {
            console.error('Login error:', error)
            notifications.error(error.message || 'Error durante el inicio de sesión. Inténtalo de nuevo.')
          }
        }
      )
    } else {
      if (!formData.name) {
        notifications.error('El nombre es requerido para el registro')
        return
      }
      
      register.mutate(
        { email: formData.email, password: formData.password, name: formData.name || '' },
        {
          onSuccess: () => {
            notifications.success('¡Registro exitoso! Revisa tu email para verificar tu cuenta.')
            setRegisteredEmail(formData.email)
            setShowEmailConfirmation(true)
            // Reset form
            setFormData({ email: '', password: '', name: '' })
          },
          onError: (error: Error) => {
            console.error('Registration error:', error)
            notifications.error(error.message || 'Error durante el registro. Inténtalo de nuevo.')
          }
        }
      )
    }
  }

  const handleInputChange = (field: keyof AuthFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleBackToLogin = () => {
    setShowEmailConfirmation(false)
    setIsLogin(true)
  }

  const handleGoogleLogin = () => {
    notifications.info('Iniciando con Google...')
  }

  const handleForgotPassword = () => {
    const email = prompt('Ingresa tu email:')
    if (email) {
      notifications.success(`Instrucciones enviadas a ${email}`)
    }
  }

  const isLoading = login.isPending || register.isPending

  // Show email confirmation message
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Registro Exitoso!
              </h1>
              <p className="text-gray-600 mb-6">
                Tu cuenta ha sido creada correctamente.
              </p>
            </div>

            <SuccessMessage
              type="info"
              title="Verifica tu email"
              message="Hemos enviado un enlace de confirmación a tu correo electrónico."
              details="Haz clic en el enlace del email para activar tu cuenta y poder iniciar sesión."
              email={registeredEmail}
            />

            <div className="mt-6 space-y-3">
              <Button
                onClick={handleBackToLogin}
                className="w-full"
              >
                Ir al Login
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailConfirmation(false)
                  setIsLogin(false)
                }}
                className="w-full"
              >
                Crear otra cuenta
              </Button>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>¿No recibiste el email?</p>
              <p>Revisa tu carpeta de spam o solicita un nuevo enlace.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-semibold text-[#1f2937]">PedidoList</div>
          </div>

          {/* Status */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center text-xs text-[#6b7280] mb-6">
              <div className="w-2 h-2 bg-[#10b981] rounded-full mr-2"></div>
              Sistema disponible
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-[#1f2937] text-center mb-8">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg text-base transition-colors focus:border-[#3b82f6] focus:ring-0 focus:ring-[#3b82f6] focus:ring-opacity-10"
                  required={!isLogin}
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
                className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg text-base transition-colors focus:border-[#3b82f6] focus:ring-0 focus:ring-[#3b82f6] focus:ring-opacity-10"
                required
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
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg text-base transition-colors focus:border-[#3b82f6] focus:ring-0 focus:ring-[#3b82f6] focus:ring-opacity-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 bg-[#3b82f6] text-white border-none rounded-lg text-base font-medium cursor-pointer transition-colors hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLogin ? 'Entrando...' : 'Creando cuenta...'}
                </div>
              ) : (
                isLogin ? 'Entrar' : 'Crear cuenta'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative text-center my-6">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#e5e7eb]"></div>
            <span className="bg-white px-4 text-sm text-[#6b7280]">o</span>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white text-[#374151] border border-[#d1d5db] rounded-lg text-base font-medium cursor-pointer transition-all hover:bg-[#f9fafb] hover:border-[#9ca3af] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path fill="#4285F4" d="M14.9 8.16c0-.44-.04-.86-.11-1.26H8.18v2.38h3.77c-.16.84-.64 1.56-1.36 2.04v1.69h2.2c1.29-1.19 2.03-2.94 2.03-5.01l.08.16z"/>
              <path fill="#34A853" d="M8.18 15c1.84 0 3.38-.61 4.51-1.65l-2.2-1.69c-.61.41-1.39.65-2.31.65-1.78 0-3.28-1.2-3.82-2.82H2.06v1.74A6.98 6.98 0 0 0 8.18 15z"/>
              <path fill="#FBBC05" d="M4.36 9.49c-.14-.41-.22-.85-.22-1.31 0-.46.08-.9.22-1.31V5.13H2.06a6.98 6.98 0 0 0 0 6.1l2.3-1.74z"/>
              <path fill="#EA4335" d="M8.18 3.64c1 0 1.9.34 2.61 1.02l1.96-1.96A6.98 6.98 0 0 0 8.18 1 6.98 6.98 0 0 0 2.06 5.13l2.3 1.74c.54-1.62 2.04-2.82 3.82-2.82v-.41z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Forgot Password */}
          <div className="text-center mt-6">
            <button
              onClick={handleForgotPassword}
              className="text-[#3b82f6] text-sm hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Toggle between login and register */}
          <div className="text-center mt-8 pt-6 border-t border-[#e5e7eb]">
            <div className="text-sm text-[#6b7280]">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setFormData({ email: '', password: '', name: '' })
                }}
                className="text-[#3b82f6] font-medium hover:underline"
              >
                {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
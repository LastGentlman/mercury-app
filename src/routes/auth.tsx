import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
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
      notifications.error('Por favor completa todos los campos requeridos.')
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
            notifications.success('¡Inicio de sesión exitoso!')
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

  // const handleResendConfirmation = () => {
  //   if (formData.email) {
  //     resendConfirmationEmail.mutate(formData.email, {
  //       onSuccess: (data) => {
  //         notifications.success(data.message || 'Email de confirmación reenviado. Revisa tu bandeja de entrada.')
  //       },
  //       onError: (error: Error) => {
  //         notifications.error(error.message)
  //       }
  //     })
  //   }
  // }

  const isLoading = login.isPending || register.isPending

  // Show email confirmation message
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Join us and start managing your orders'
              }
            </p>
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field (only for registration) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          {/* Toggle between login and register */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setFormData({ email: '', password: '', name: '' })
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
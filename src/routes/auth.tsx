import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { SuccessMessage } from '../components/SuccessMessage'
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

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
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string>('')
  
  const { isAuthenticated, login, register, resendConfirmationEmail } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos requeridos.')
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido.')
      return
    }
    
    // Password validation for registration
    if (!isLogin && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    
    if (isLogin) {
      login.mutate(
        { email: formData.email, password: formData.password },
        {
          onError: (error: Error) => {
            console.error('Login error:', error)
            setError(error.message || 'An error occurred during login. Please try again.')
          }
        }
      )
    } else {
      if (!formData.name) {
        setError('Name is required for registration')
        return
      }
      
      register.mutate(
        { email: formData.email, password: formData.password, name: formData.name || '' },
        {
          onSuccess: (data) => {
            setSuccess(data.message || 'Registration successful! Please check your email to verify your account.')
            setRegisteredEmail(formData.email)
            setShowEmailConfirmation(true)
            // Reset form
            setFormData({ email: '', password: '', name: '' })
          },
          onError: (error: Error) => {
            console.error('Registration error:', error)
            setError(error.message || 'An error occurred during registration. Please try again.')
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
    setSuccess('')
    setError('')
    setIsLogin(true)
  }

  const handleResendConfirmation = () => {
    if (formData.email) {
      resendConfirmationEmail.mutate(formData.email, {
        onSuccess: (data) => {
          setSuccess(data.message || 'Email de confirmación reenviado. Revisa tu bandeja de entrada.')
          setError('')
        },
        onError: (error: Error) => {
          setError(error.message)
        }
      })
    }
  }

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
                  setSuccess('')
                  setError('')
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

          {/* Success Message */}
          {success && (
            <div className="mb-6">
              <SuccessMessage
                type="success"
                title="¡Éxito!"
                message={success}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Error en la {isLogin ? 'autenticación' : 'registro'}
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('already exists') && (
                    <p className="text-xs text-red-600 mt-2">
                      ¿Ya tienes una cuenta? <button 
                        onClick={() => setIsLogin(true)} 
                        className="underline hover:no-underline"
                      >
                        Inicia sesión aquí
                      </button>
                    </p>
                  )}
                  {error.includes('no confirmado') && (
                    <div className="text-xs text-red-600 mt-2 space-y-1">
                      <p>📧 <strong>Pasos para confirmar tu email:</strong></p>
                      <ol className="list-decimal list-inside ml-2 space-y-1">
                        <li>Revisa tu bandeja de entrada</li>
                        <li>Busca un email de "PedidoList" o "Confirmación de cuenta"</li>
                        <li>Haz clic en el enlace de confirmación</li>
                        <li>Vuelve aquí e intenta iniciar sesión nuevamente</li>
                      </ol>
                      <div className="mt-2 space-y-2">
                        <button 
                          onClick={handleResendConfirmation}
                          disabled={resendConfirmationEmail.isPending}
                          className="text-blue-600 hover:text-blue-800 underline text-xs"
                        >
                          {resendConfirmationEmail.isPending ? 'Enviando...' : '¿No recibiste el email? Reenviar'}
                        </button>
                        <p>
                          ¿Problemas con el registro? <button 
                            onClick={() => setIsLogin(false)} 
                            className="underline hover:no-underline"
                          >
                            Regístrate de nuevo
                          </button>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                  setError('')
                  setSuccess('')
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
// src/routes/auth.tsx - Versión actualizada con botones sociales
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { SuccessMessage } from '../components/SuccessMessage'
import { SocialLoginButtons } from '../components/SocialLoginButtons' // 🆕 Import agregado
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
  
  const { 
    isAuthenticated, 
    login, 
    register,
    isLoginLoading,
    isRegisterLoading,
    isSocialLoginLoading // 🆕 Estado de carga para OAuth
  } = useAuth()
  const navigate = useNavigate()
  const notifications = useNotifications()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  const handleInputChange = (field: keyof AuthFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
      try {
        await login.mutateAsync({ email: formData.email, password: formData.password })
        notifications.success('¡Bienvenido a PedidoList!')
      } catch (error: any) {
        console.error('Login error:', error)
        notifications.error(error.message || 'Error durante el inicio de sesión. Inténtalo de nuevo.')
      }
    } else {
      if (!formData.name) {
        notifications.error('El nombre es requerido para el registro')
        return
      }
      
      try {
        await register.mutateAsync({ email: formData.email, password: formData.password, name: formData.name || '' })
        setRegisteredEmail(formData.email)
        setShowEmailConfirmation(true)
        notifications.success('¡Registro exitoso! Revisa tu email para verificar tu cuenta.')
      } catch (error: any) {
        console.error('Registration error:', error)
        notifications.error(error.message || 'Error durante el registro. Inténtalo de nuevo.')
      }
    }
  }

  // Show email confirmation screen after successful registration
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-3 px-4 rounded-lg transition-colors"
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
              className="w-full"
            >
              Crear otra cuenta
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isFormLoading = isLoginLoading || isRegisterLoading || isSocialLoginLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-[#e5e7eb] p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#111827] mb-2">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-[#6b7280] text-sm">
              {isLogin 
                ? 'Ingresa tus credenciales para acceder a tu cuenta'
                : 'Completa los campos para crear tu nueva cuenta'
              }
            </p>
          </div>

          {/* 🆕 BOTONES SOCIALES - Agregados aquí */}
          <div className="mb-6">
            <SocialLoginButtons 
              disabled={isFormLoading}
              className="w-full"
            />
          </div>

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
                className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg text-base transition-colors focus:border-[#3b82f6] focus:ring-0 focus:ring-[#3b82f6] focus:ring-opacity-10"
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
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg text-base transition-colors focus:border-[#3b82f6] focus:ring-0 focus:ring-[#3b82f6] focus:ring-opacity-10 pr-10"
                  required
                  disabled={isFormLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] disabled:opacity-50"
                  disabled={isFormLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isFormLoading}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFormLoading 
                ? (isLogin ? 'Iniciando sesión...' : 'Creando cuenta...') 
                : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
              }
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
                }}
                className="text-[#3b82f6] font-medium hover:underline disabled:opacity-50"
                disabled={isFormLoading}
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
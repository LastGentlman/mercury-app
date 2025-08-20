import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { Button } from '../components/ui/index.ts'
import { Input } from '../components/ui/input.tsx'
import { Label } from '../components/ui/label.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.tsx'
import { SocialLoginButtons } from '../components/SocialLoginButtons.tsx'
import { SuccessMessage } from '../components/SuccessMessage.tsx'
import { PasswordRequirements } from '../components/PasswordRequirements.tsx'
import { Loader2, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
})

function RouteComponent() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showResendEmail, setShowResendEmail] = useState(false)
  const [lastRegisteredEmail, setLastRegisteredEmail] = useState<string>('')

  const { login, register, resendConfirmationEmail, isAuthenticated, isLoading } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
    console.log('✅ Usuario ya autenticado, redirigiendo a dashboard...')
    globalThis.location.href = '/dashboard'
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      await login.mutateAsync({
        email: formData.email,
        password: formData.password
      })
      
      toast.success('¡Inicio de sesión exitoso!')
      
      // Esperar un poco para que el estado se actualice
      setTimeout(() => {
        // Verificar si el usuario está autenticado antes de redirigir
        if (login.isSuccess) {
          console.log('✅ Login exitoso, redirigiendo a dashboard...')
          globalThis.location.href = '/dashboard'
        } else {
          console.log('⚠️ Login exitoso pero estado no actualizado, redirigiendo de todas formas...')
          globalThis.location.href = '/dashboard'
        }
      }, 500)
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Manejar errores específicos de Supabase
      if (error.message?.includes('Email not confirmed') || error.message?.includes('Email not confirmed')) {
        toast.error(
          'Email no verificado. Por favor revisa tu bandeja de entrada y haz clic en el enlace de confirmación antes de iniciar sesión.',
          { duration: 6000 }
        )
      } else if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid email or password')) {
        toast.error('Email o contraseña incorrectos. Verifica tus credenciales.')
      } else if (error.message?.includes('For security purposes')) {
        toast.error('Demasiados intentos. Por favor espera un momento antes de intentar de nuevo.')
      } else {
        toast.error('Error en el inicio de sesión. Verifica tus credenciales.')
      }
    }
  }

  const handleResendEmail = async () => {
    if (!lastRegisteredEmail) return
    
    try {
      await resendConfirmationEmail.mutateAsync(lastRegisteredEmail)
      toast.success('Email de confirmación reenviado. Revisa tu bandeja de entrada.')
    } catch (error: any) {
      console.error('Resend email error:', error)
      if (error.message?.includes('For security purposes')) {
        toast.error('Demasiados intentos. Por favor espera un momento antes de intentar de nuevo.')
      } else {
        toast.error('Error al reenviar el email. Por favor intenta de nuevo.')
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    // Validación de contraseña mejorada - coincidente con el backend
    const password = formData.password;
    
    // Validaciones básicas
    const basicValidation = {
      length: password.length >= 12 && password.length <= 128,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[@$!%*?&]/.test(password),
      noRepetition: !/(.)\1{3,}/.test(password),
      noPatterns: !/^(.{1,3})\1+$/.test(password)
    };

    // Verificar contraseñas comunes
    const commonPasswords = [
      "123456789012", "password123!", "qwerty123456", 
      "admin123456!", "welcome123456", "Password123!", "password123"
    ];
    const isCommonPassword = commonPasswords.some(common => 
      password.toLowerCase() === common.toLowerCase()
    );

    // Calcular fortaleza de contraseña
    let strengthScore = 0;
    const feedback: string[] = [];

    // Longitud (0-25 puntos)
    if (password.length >= 12) strengthScore += 25;
    else feedback.push("Aumenta la longitud a al menos 12 caracteres");

    // Complejidad (0-40 puntos)
    if (/[a-z]/.test(password)) strengthScore += 10;
    else feedback.push("Incluye al menos una letra minúscula");
    
    if (/[A-Z]/.test(password)) strengthScore += 10;
    else feedback.push("Incluye al menos una letra mayúscula");
    
    if (/\d/.test(password)) strengthScore += 10;
    else feedback.push("Incluye al menos un número");
    
    if (/[@$!%*?&]/.test(password)) strengthScore += 10;
    else feedback.push("Incluye al menos un símbolo especial (@$!%*?&)");

    // Diversidad (0-20 puntos)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 10) strengthScore += 20;
    else if (uniqueChars >= 8) strengthScore += 15;
    else if (uniqueChars >= 6) strengthScore += 10;
    else feedback.push("Usa una mayor variedad de caracteres");

    // Patrones (0-15 puntos)
    if (!/(.)\1{2,}/.test(password)) strengthScore += 15;
    else feedback.push("Evita repetir caracteres consecutivamente");

    const isStrongEnough = strengthScore >= 70;

    // Verificar todas las validaciones
    const unmetRequirements = Object.entries(basicValidation)
      .filter(([_, met]) => !met)
      .map(([key, _]) => {
        const labels = {
          length: 'entre 12 y 128 caracteres',
          lowercase: 'al menos una minúscula',
          uppercase: 'al menos una mayúscula',
          number: 'al menos un número',
          symbol: 'al menos un símbolo especial (@$!%*?&)',
          noRepetition: 'sin caracteres repetidos consecutivos',
          noPatterns: 'sin patrones repetitivos'
        }
        return labels[key as keyof typeof labels]
      });

    if (isCommonPassword) {
      toast.error('No se permite el uso de contraseñas comunes')
      return
    }

    if (unmetRequirements.length > 0) {
      toast.error(`La contraseña debe tener: ${unmetRequirements.join(', ')}`)
      return
    }

    if (!isStrongEnough) {
      toast.error(`Contraseña muy débil. ${feedback.join('. ')}`)
      return
    }

    try {
      const result = await register.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.name
      })
      
      // Verificar si se requiere confirmación de email
      if (result.emailConfirmationRequired || result.message.includes('check your email')) {
        setSuccessMessage(
          `¡Cuenta creada exitosamente! 🎉\n\nHemos enviado un email de confirmación a ${formData.email}.\n\nPor favor, revisa tu bandeja de entrada y haz clic en el enlace de confirmación para activar tu cuenta.`
        )
        setLastRegisteredEmail(formData.email)
        setShowResendEmail(true)
        setFormData({ email: '', password: '', confirmPassword: '', name: '' })
      } else {
        // Si no requiere confirmación, mostrar mensaje de éxito y redirigir
        toast.success('¡Cuenta creada exitosamente!')
        setTimeout(() => {
          globalThis.location.href = '/dashboard'
        }, 1000)
      }
    } catch (error: any) {
      console.error('Register error:', error)
      
      // Manejar errores específicos de Supabase
      if (error.message?.includes('Email not confirmed')) {
        toast.error('Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.')
      } else if (error.message?.includes('already registered')) {
        toast.error('Ya existe una cuenta con este email. Intenta iniciar sesión en su lugar.')
      } else if (error.message?.includes('For security purposes') || error.message?.includes('rate limit')) {
        toast.error('Demasiados intentos. Por favor espera un momento antes de intentar de nuevo.')
      } else if (error.message?.includes('email rate limit exceeded')) {
        toast.error('Límite de emails excedido. Por favor espera unos minutos antes de intentar de nuevo.')
      } else {
        toast.error('Error en el registro. Por favor intenta de nuevo.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PedidoList</h1>
          <p className="text-gray-600">Gestiona tus pedidos de manera eficiente</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6">
            <SuccessMessage 
              type="success" 
              title="¡Registro exitoso!"
              message={successMessage}
            />
            
            {/* Botón de reenvío de email */}
            {showResendEmail && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-3">
                  ¿No recibiste el email? Puedes solicitar que te lo reenviemos.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendEmail}
                  disabled={resendConfirmationEmail.isPending}
                  className="w-full"
                >
                  {resendConfirmationEmail.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    'Reenviar email de confirmación'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Auth Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Accede a tu cuenta para continuar' 
                : 'Crea tu cuenta para empezar a gestionar pedidos'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!showEmailForm ? (
              <>
                {/* Social Login */}
                <div className="space-y-4">
                  <SocialLoginButtons disabled={login.isPending || register.isPending} />                
                </div>

                {/* Email Access Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 py-3"
                  onClick={() => {
                    setShowEmailForm(true)
                    setIsLogin(true) // Ensure login tab is selected by default
                  }}
                  disabled={login.isPending || register.isPending}
                >
                  <Mail className="h-5 w-5" />
                  <span>Continuar con Email</span>
                </Button>
              </>
            ) : (
              <>
                {/* Back Button */}
                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmailForm(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ← Volver
                  </Button>
                </div>

                {/* Auth Tabs */}
                <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value) => setIsLogin(value === 'login')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="register">Registrarse</TabsTrigger>
                  </TabsList>

              {/* Login Form */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={login.isPending}
                  >
                    {login.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Requisitos de contraseña */}
                    {formData.password && (
                      <PasswordRequirements 
                        password={formData.password} 
                        className="mt-3"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={register.isPending}
                  >
                    {register.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600">
              {isLogin ? (
                <p>
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Regístrate aquí
                  </button>
                </p>
              ) : (
                <p>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              )}
            </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 PedidoList. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}

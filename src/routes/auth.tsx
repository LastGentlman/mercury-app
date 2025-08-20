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
import { Loader2, Eye, EyeOff, Mail, Lock, User, AlertCircle as _AlertCircle } from 'lucide-react'
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

  const { login, register, isAuthenticated, isLoading } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
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
      globalThis.location.href = '/dashboard'
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Error en el inicio de sesión. Verifica tus credenciales.')
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

    if (formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      await register.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.name
      })
      
      setSuccessMessage(`¡Registro exitoso! Hemos enviado un email de confirmación a ${formData.email}`)
      setFormData({ email: '', password: '', confirmPassword: '', name: '' })
    } catch (error) {
      console.error('Register error:', error)
      toast.error('Error en el registro. Por favor intenta de nuevo.')
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
                        placeholder="••••••••"
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
                        placeholder="••••••••"
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

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
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

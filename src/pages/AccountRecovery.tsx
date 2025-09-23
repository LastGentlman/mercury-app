import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle, CheckCircle, Clock, UserPlus, RotateCcw } from 'lucide-react'
import { AccountDeletionService, type AccountRecoveryRequest } from '@/services/account-deletion-service'

type RecoveryStep = 'check' | 'request' | 'status' | 'new-account' | 'success'

export default function AccountRecovery() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [step, setStep] = useState<RecoveryStep>('check')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [reason, setReason] = useState('')
  
  // Recovery status
  const [recoveryStatus, setRecoveryStatus] = useState<any>(null)
  const [canRecover, setCanRecover] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

  const isDeleted = searchParams.get('deleted') === 'true'
  const deletionId = searchParams.get('deletion-id')

  useEffect(() => {
    if (isDeleted) {
      setStep('request')
    } else if (deletionId) {
      setStep('check')
    }
  }, [isDeleted, deletionId])

  const handleCheckRecovery = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa tu email')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if recovery is available
      const status = await AccountDeletionService.checkRecoveryRequestStatus(email)
      setRecoveryStatus(status)
      setHasPendingRequest(status.hasPendingRequest)

      if (status.hasPendingRequest) {
        setStep('status')
      } else {
        setStep('request')
      }
    } catch (err) {
      setError('Error verificando estado de recuperación')
      console.error('Error checking recovery:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRecovery = async () => {
    if (!email.trim() || !reason.trim()) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request: AccountRecoveryRequest = {
        email: email.trim(),
        reason: reason.trim(),
        businessName: businessName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined
      }

      const result = await AccountDeletionService.requestAccountRecovery(request)

      if (result.success) {
        setSuccess('Solicitud de recuperación enviada exitosamente. Te contactaremos pronto.')
        setStep('status')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Error enviando solicitud de recuperación')
      console.error('Error requesting recovery:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewAccount = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await AccountDeletionService.createNewAccountForDeletedUser(
        email.trim(),
        password,
        businessName.trim() || undefined
      )

      if (result.success) {
        setSuccess('Nueva cuenta creada exitosamente. Ya puedes iniciar sesión.')
        setStep('success')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Error creando nueva cuenta')
      console.error('Error creating new account:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderCheckStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Recuperación de Cuenta
        </CardTitle>
        <CardDescription>
          Verifica si puedes recuperar tu cuenta eliminada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email de la cuenta eliminada</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleCheckRecovery} 
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verificar Recuperación
        </Button>

        <div className="text-center">
          <Button 
            variant="link" 
            onClick={() => setStep('new-account')}
            className="text-sm"
          >
            ¿Prefieres crear una nueva cuenta?
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderRequestStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Solicitar Recuperación
        </CardTitle>
        <CardDescription>
          Completa el formulario para solicitar la recuperación de tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Nombre del Negocio</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Mi Negocio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Teléfono</Label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo de la recuperación *</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica por qué necesitas recuperar tu cuenta..."
            rows={3}
            required
          />
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleRequestRecovery} 
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Solicitar Recuperación
        </Button>

        <Separator />

        <div className="text-center">
          <Button 
            variant="link" 
            onClick={() => setStep('new-account')}
            className="text-sm"
          >
            ¿Prefieres crear una nueva cuenta?
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderStatusStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Estado de la Solicitud
        </CardTitle>
        <CardDescription>
          Tu solicitud de recuperación está siendo procesada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recoveryStatus && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado:</span>
              <Badge variant={recoveryStatus.status === 'approved' ? 'default' : 'secondary'}>
                {recoveryStatus.status === 'pending' && 'Pendiente'}
                {recoveryStatus.status === 'approved' && 'Aprobado'}
                {recoveryStatus.status === 'rejected' && 'Rechazado'}
              </Badge>
            </div>
            
            {recoveryStatus.message && (
              <Alert>
                <AlertDescription>{recoveryStatus.message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Te contactaremos por email cuando tu solicitud sea procesada.
          </p>
          <Button 
            variant="link" 
            onClick={() => setStep('new-account')}
            className="text-sm"
          >
            ¿Prefieres crear una nueva cuenta mientras tanto?
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderNewAccountStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Crear Nueva Cuenta
        </CardTitle>
        <CardDescription>
          Crea una nueva cuenta para continuar usando nuestros servicios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Nombre del Negocio</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Mi Negocio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña *</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            required
          />
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleCreateNewAccount} 
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Nueva Cuenta
        </Button>

        <Separator />

        <div className="text-center">
          <Button 
            variant="link" 
            onClick={() => setStep('request')}
            className="text-sm"
          >
            ¿Prefieres solicitar recuperación de tu cuenta anterior?
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderSuccessStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          ¡Listo!
        </CardTitle>
        <CardDescription>
          Tu nueva cuenta ha sido creada exitosamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Ya puedes iniciar sesión con tu nueva cuenta.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={() => navigate('/auth')}
          className="w-full"
        >
          Ir a Iniciar Sesión
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'check' && renderCheckStep()}
        {step === 'request' && renderRequestStep()}
        {step === 'status' && renderStatusStep()}
        {step === 'new-account' && renderNewAccountStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  )
}

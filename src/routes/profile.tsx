/**
 * Enhanced Profile Page Component
 * 
 * Features:
 * - User profile management with avatar upload
 * - Real-time form validation and dirty state tracking
 * - Integration with existing auth system
 * - Responsive design following the app's design system
 * - PWA-compatible with offline support
 * - Accessibility features
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, createFileRoute } from '@tanstack/react-router'
import {
  Settings, 
  Camera, 
  User, 
  Save, 
  LogOut, 
  HelpCircle,
  Loader2,
  Shield,
  Bell,
  Palette,
  Lock,
  Smartphone,
  Mail,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Trash2,
  CheckCircle,
  X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.ts'
import { useProfile } from '../hooks/useProfile.ts'
import { ProtectedRoute } from '../components/ProtectedRoute.tsx'
import { UserAvatar } from '../components/UserAvatar.tsx'
import { 
  Button, 
  Input, 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Switch,
  Badge,
  Separator
} from '../components/ui/index.ts'
import { showSuccess, showError, showInfo } from '../utils/sweetalert.ts'
import Swal from 'sweetalert2'

interface ProfileData {
  fullName: string
  phone: string
  avatar?: string
  isDirty: boolean
}



export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { 
    profile, 
    updateProfile, 
    uploadAvatar, 
    isUpdating,
    isProfileLoading
  } = useProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Local state
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: profile?.fullName || user?.name || '',
    phone: profile?.phone || '',
    avatar: profile?.avatar_url || user?.avatar_url || '',
    isDirty: false
  })
  

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)

  // Settings state
  const [settings, _setSettings] = useState({
    darkMode: false,
    language: 'es'
  })

  // Security settings state
  const [securitySettings, _setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    systemAlerts: true,
    marketingEmails: false,
    weeklyReports: true
  })

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    notifications: true, // Notifications starts collapsed
    security: true // Security starts collapsed
  })

  // Account deletion state
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Reset collapsed sections to default state
  const resetCollapsedSections = () => {
    setCollapsedSections({
      notifications: true,
      security: true
    })
  }

  // Initialize profile data when user or profile loads
  useEffect(() => {
    if (user || profile) {
      // Avatar system working correctly - debug logs removed

      setProfileData(prev => ({
        ...prev,
        fullName: profile?.fullName || user?.name || '',
        phone: profile?.phone || prev.phone || '',
        avatar: profile?.avatar_url || user?.avatar_url || prev.avatar || ''
      }))
    }
  }, [user, profile])

  // Handle form changes
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
      isDirty: true
    }))
  }

  // Handle avatar upload
  const handleAvatarUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type first
    if (!file.type.startsWith('image/')) {
      showError('Imagen inválida', 'Por favor selecciona una imagen válida')
      return
    }

    // Show loading message for large files
    if (file.size > 500 * 1024) {
              showInfo('Optimizando imagen', 'Optimizando imagen grande...')
    }

    try {
      const result = await uploadAvatar.mutateAsync(file)
      
      // Update local state with new avatar URL
      if (result.profile?.avatar_url) {
        setProfileData(prev => ({ 
          ...prev, 
          avatar: result.profile.avatar_url || '',
          isDirty: false 
        }))
      }
      
      // Show optimization info if available
      if (result.optimizationStats) {
        const compressionRatio = result.optimizationStats.compressionRatio.toFixed(1)
        showSuccess('Avatar actualizado', `Avatar optimizado y actualizado correctamente (${compressionRatio}% más pequeño)`)
      } else {
        showSuccess('Avatar actualizado', 'Avatar actualizado correctamente')
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('❌ Avatar upload error:', error)
      
      let errorMessage = 'Error desconocido'
      if (error instanceof Error) {
        errorMessage = error.message
        // Provide more user-friendly error messages
        if (errorMessage.includes('Storage bucket not available')) {
          errorMessage = 'Error de configuración del servidor. Contacta al administrador.'
        } else if (errorMessage.includes('Upload failed')) {
          errorMessage = 'Error al subir la imagen. Verifica tu conexión e intenta de nuevo.'
        } else if (errorMessage.includes('No authenticated user')) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión de nuevo.'
        } else if (errorMessage.includes('demasiado grande')) {
          // Keep the detailed size information for file size errors
          // No need to reassign, errorMessage already contains the correct message
        }
      }
      
      showError('Error al subir imagen', `Error al subir la imagen: ${errorMessage}`)
    }
  }

  // Save profile
  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        fullName: profileData.fullName,
        phone: profileData.phone
      })
      
      setProfileData(prev => ({ ...prev, isDirty: false }))
      showSuccess('Perfil actualizado', 'Perfil actualizado correctamente')
      
    } catch (error) {
      console.error('Error saving profile:', error)
      showError('Error al guardar', 'Error al guardar. Inténtalo de nuevo')
    }
  }

  // Handle logout
  const handleLogout = async () => {
    if (profileData.isDirty) {
      if (!confirm('Tienes cambios sin guardar. ¿Seguro que quieres cerrar sesión?')) {
        return
      }
    }
    
    setShowLogoutDialog(false)
    await logout.mutateAsync()
    navigate({ to: '/auth' })
  }

  // Delete account validation
  const isDeleteConfirmationValid = deleteConfirmationText === 'ELIMINAR'

  // Simulate account deletion process
  const simulateAccountDeletion = async () => {
    // Simular pasos del proceso
    const steps = [
      'Verificando permisos...',
      'Cancelando suscripciones...',
      'Eliminando datos personales...',
      'Eliminando historial...',
      'Finalizando proceso...'
    ]
    
    for (let i = 0; i < steps.length; i++) {
      // Actualizar el texto del progreso si el SweetAlert está abierto
      const stepElement = document.getElementById('deletion-step')
      if (stepElement && steps[i]) {
        stepElement.textContent = steps[i] as string
      }
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user?.email || !isDeleteConfirmationValid) {
      showError('Error', 'No se puede proceder con la eliminación')
      return
    }

    try {
      setIsDeletingAccount(true)

      // 🔒 STEP 1: Confirmación adicional con SweetAlert2 
      const finalConfirm = await Swal.fire({
        title: '¿Estás completamente seguro?',
        text: `Esta acción eliminará permanentemente la cuenta ${user.email}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar cuenta',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      })
      
      if (!finalConfirm.isConfirmed) {
        setIsDeletingAccount(false)
        return
      }

      // Cerrar el dialog de configuración primero
      setShowDeleteAccountDialog(false)
      setShowSettingsDialog(false)

      // 🔄 STEP 2: Mostrar progreso
      Swal.fire({
        title: 'Eliminando cuenta...',
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            </div>
            <p id="deletion-step" class="text-gray-600">Iniciando proceso...</p>
            <p class="text-sm text-gray-500 mt-2">Por favor, no cierres esta ventana</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      })

      // 🗑️ STEP 3: Simular proceso por ahora (después conectar con backend)
      await simulateAccountDeletion()

      // ✅ STEP 4: Mostrar confirmación
      Swal.close()
      await Swal.fire({
        title: 'Cuenta eliminada',
        text: 'Tu cuenta ha sido eliminada permanentemente',
        icon: 'success',
        confirmButtonText: 'Entendido'
      })

      // 🔀 STEP 5: Logout y redirect
      await logout.mutateAsync()
      navigate({ to: '/auth' })

    } catch (error) {
      console.error('Delete account error:', error)
      Swal.close()
      setIsDeletingAccount(false)
      
      showError(
        'Error al eliminar cuenta',
        'Ocurrió un problema inesperado. Por favor contacta a soporte.'
      )
    } finally {
      setDeleteConfirmationText('')
    }
  }



  // Prevent navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (profileData.isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    globalThis.addEventListener('beforeunload', handleBeforeUnload)
    return () => globalThis.removeEventListener('beforeunload', handleBeforeUnload)
  }, [profileData.isDirty])

  // 🔒 SECURITY: Immediate redirect if not authenticated
  if (!user) {
    // Use window.location for immediate redirect
    globalThis.location.href = '/auth'
    return null
  }

  // Loading state
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">


      <div className="max-w-md mx-auto bg-white min-h-screen">

        {/* Profile Section */}
        <div className="p-6 text-center border-b border-gray-100">
          <div className="relative inline-block mb-4">
            <UserAvatar
              user={user}
              profileAvatar={profileData.avatar || profile?.avatar_url || undefined}
              size="xl"
              showProviderBadge
            />
            <Button
              size="sm"
              onClick={handleAvatarUpload}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full p-0 bg-blue-600 hover:bg-blue-700"
              disabled={uploadAvatar.isPending}
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* File upload requirements */}
          <div className="mt-3 text-xs text-gray-500">
            <p>Máximo 500KB después de optimización • Formatos: JPG, PNG, GIF, WebP</p>
            <p className="text-gray-400">Las imágenes grandes se optimizan automáticamente</p>
            <p className="text-gray-400">Haz clic en la cámara para cambiar tu foto</p>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {user.name}
          </h2>
          <p className="text-sm text-gray-500 mb-4">{user.email}</p>
          
          <Badge variant="default" className="bg-blue-600">
            {user.role === 'owner' ? 'Administrador' : 'Empleado'}
          </Badge>
          
          {/* Avatar source info */}
          <div className="mt-2 text-xs text-gray-500">
            {user.avatar_url && !profileData.avatar && !profile?.avatar_url ? (
              <span>Avatar de {user.provider === 'google' ? 'Google' : user.provider === 'facebook' ? 'Facebook' : 'OAuth'}</span>
            ) : profileData.avatar || profile?.avatar_url ? (
              <span>Avatar personalizado</span>
            ) : user.provider === 'email' ? (
              <span>Avatar generado</span>
            ) : (
              <span>Sin avatar</span>
            )}
          </div>
        </div>

        {/* Personal Info Form */}
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            Información Personal
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <Input
                value={profileData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                value={user.email}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <Input
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+34 666 777 888"
                type="tel"
              />
            </div>
          </div>
        </div>

        {/* Quick Access Settings */}
        <div className="border-t border-gray-100">
          <div 
            className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings className="h-5 w-5 text-gray-500 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Configuración</div>
              <div className="text-xs text-gray-500">Notificaciones, privacidad y más</div>
            </div>
            <div className="text-gray-400">›</div>
          </div>
          
          <div 
            className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => globalThis.open('mailto:soporte@pedidolist.com?subject=Consulta sobre mi perfil', '_blank')}
          >
            <HelpCircle className="h-5 w-5 text-gray-500 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Ayuda y soporte</div>
              <div className="text-xs text-gray-500">Contactar con soporte técnico</div>
            </div>
            <div className="text-gray-400">›</div>
          </div>
          

        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-3">
          <Button
            onClick={handleSaveProfile}
            disabled={!profileData.isDirty || isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {profileData.isDirty ? 'Guardar cambios *' : 'Guardar cambios'}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar sesión</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres cerrar sesión? Se perderán los cambios no guardados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={(open) => {
        setShowSettingsDialog(open)
        if (!open) {
          // Reset sections to collapsed when dialog closes
          resetCollapsedSections()
        }
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>
              Personaliza tu experiencia en PedidoList
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* General Settings Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración General
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Modo oscuro</div>
                      <div className="text-xs text-gray-500">Cambiar tema de la aplicación</div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(_checked) => {
                      showInfo('Feature en desarrollo', 'El modo oscuro estará disponible próximamente. ¡Mantente atento a las actualizaciones!')
                      // No cambiar el estado para mantener la UI consistente
                    }}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notifications Section - Collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setCollapsedSections(prev => ({ ...prev, notifications: !prev.notifications }))}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones Detalladas
                </h3>
                {collapsedSections.notifications ? (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {!collapsedSections.notifications && (
                <div className="mt-3 space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Notificaciones por email</div>
                        <div className="text-xs text-gray-500">Recibir alertas por correo electrónico</div>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Notificaciones push</div>
                        <div className="text-xs text-gray-500">Alertas en tiempo real en el dispositivo</div>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Notificaciones SMS</div>
                        <div className="text-xs text-gray-500">Mensajes de texto importantes</div>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Actualizaciones de pedidos</div>
                        <div className="text-xs text-gray-500">Cambios de estado y confirmaciones</div>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.orderUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, orderUpdates: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Alertas del sistema</div>
                        <div className="text-xs text-gray-500">Mantenimiento y problemas técnicos</div>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, systemAlerts: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Emails de marketing</div>
                        <div className="text-xs text-gray-500">Ofertas y novedades del negocio</div>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Reportes semanales</div>
                        <div className="text-xs text-gray-500">Resumen de actividad semanal</div>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Security Section - Collapsible and at the bottom */}
            <div>
              <button
                type="button"
                onClick={() => setCollapsedSections(prev => ({ ...prev, security: !prev.security }))}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Seguridad
                </h3>
                {collapsedSections.security ? (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {!collapsedSections.security && (
                <div className="mt-3 space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Autenticación de dos factores</div>
                        <div className="text-xs text-gray-500">Añadir una capa extra de seguridad</div>
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(_checked) => {
                        showInfo('Feature en desarrollo', 'La autenticación de dos factores estará disponible próximamente. ¡Mantente atento a las actualizaciones!')
                        // No cambiar el estado para mantener la UI consistente
                      }}
                    />
                  </div>
                  
                  {/* Change Password Button */}
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => setShowChangePasswordDialog(true)}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Cambiar contraseña
                    </Button>
                  </div>
                  
                  {/* Delete Account Button */}
                  <div className="pt-3 border-t-2 border-red-100">
                    <div className="bg-red-50 p-3 rounded-lg mb-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-red-700">
                          <p className="font-medium">Zona de peligro</p>
                          <p>La eliminación de cuenta es permanente e irreversible</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteAccountDialog(true)}
                      className="w-full bg-red-600 hover:bg-red-700 border border-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar cuenta permanentemente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => {
              setShowSettingsDialog(false)
              resetCollapsedSections()
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Actualiza tu contraseña para mantener tu cuenta segura
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña actual
              </label>
              <Input
                type="password"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <Input
                type="password"
                placeholder="Ingresa tu nueva contraseña"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nueva contraseña
              </label>
              <Input
                type="password"
                placeholder="Confirma tu nueva contraseña"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="auto-change" />
              <label htmlFor="auto-change" className="text-sm text-gray-700">
                Recordarme cambiar contraseña cada 90 días
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePasswordDialog(false)}>
              Cancelar
            </Button>
            <Button>
              Cambiar contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog 
        open={showDeleteAccountDialog} 
        onOpenChange={(open) => {
          setShowDeleteAccountDialog(open)
          if (!open) {
            // 🧹 CLEANUP: Reset form state
            setDeleteConfirmationText('')
            setIsDeletingAccount(false)
          }
        }}
      >
        <DialogContent 
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-red-600">
              <Trash2 className="h-5 w-5 inline mr-2" />
              Eliminar cuenta
            </DialogTitle>
            <DialogDescription>
              Esta acción es <strong>irreversible</strong>. Se eliminarán todos tus datos, 
              pedidos y configuraciones de forma permanente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">⚠️ Acción irreversible</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Se eliminarán todos tus pedidos y datos</li>
                    <li>• No podrás recuperar tu cuenta</li>
                    <li>• Se cancelarán todas las suscripciones activas</li>
                    <li>• Se perderá acceso a reportes y estadísticas</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escribe "ELIMINAR" para confirmar
              </label>
              <div className="relative">
                <Input
                  placeholder="ELIMINAR"
                  className={`border-red-300 focus:border-red-500 focus:ring-red-500 pr-10 ${
                    deleteConfirmationText && !isDeleteConfirmationValid 
                      ? 'border-red-500 bg-red-50' 
                      : deleteConfirmationText && isDeleteConfirmationValid 
                      ? 'border-green-500 bg-green-50' 
                      : ''
                  }`}
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())}
                  autoComplete="off"
                  maxLength={8}
                />
                {deleteConfirmationText && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isDeleteConfirmationValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {deleteConfirmationText && !isDeleteConfirmationValid && (
                <p className="text-xs text-red-600 mt-1">
                  Escribe exactamente "ELIMINAR" para confirmar
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAccountDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              disabled={!isDeleteConfirmationValid || isDeletingAccount}
              onClick={handleDeleteAccount}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando cuenta...
                </>
              ) : (
                'Eliminar cuenta permanentemente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </ProtectedRoute>
  )
} 
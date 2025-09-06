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
  X,
  Eye,
  EyeOff,
  Database,
  Download,
  Clock
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.ts'
import { useProfile } from '../hooks/useProfile.ts'
import { useBackup } from '../hooks/useBackup.ts'
import { ProtectedRoute } from '../components/ProtectedRoute.tsx'
import { UserAvatar } from '../components/UserAvatar.tsx'
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter.tsx'
import { AuthService } from '../services/auth-service.ts'
import BackupService from '../services/backup-service.ts'
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
  Separator,
  PhoneInput
} from '../components/ui/index.ts'
import { showSuccess, showError, showInfo } from '../utils/sweetalert.ts'
import Swal from 'sweetalert2'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ProfileData {
  fullName: string
  phone: string
  avatar?: string
  isDirty: boolean
}

// 🔒 NEW: Helper functions for OAuth user detection
const isOAuthUser = (user: any): boolean => {
  if (!user) return false
  
  // Usuario OAuth si el provider no es 'email'
  return user.provider !== 'email'
}

const getProviderDisplayName = (provider: string): string => {
  switch (provider) {
    case 'google': return 'Google'
    case 'facebook': return 'Facebook'
    case 'github': return 'GitHub'
    case 'email':
    default: return 'Email/Password'
  }
}


export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()
  const { 
    profile, 
    updateProfile, 
    uploadAvatar, 
    deleteAccount,
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
  const [showBackupDialog, setShowBackupDialog] = useState(false)

  // Initialize backup hook after state declarations
  const {
    backups,
    backupStatus,
    isCreating,
    isRestoring,
    isCleaning,
    createBackup,
    restoreBackup,
    cleanupBackups
  } = useBackup(showBackupDialog) // Only load backup data when dialog is open

  // 🔒 NEW: Set password dialog state for OAuth users
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false)
  const [oauthPasswordData, setOauthPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

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

  // Collapsible sections state - only one can be open at a time
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Account deletion state
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  
  // 🔒 NEW: Password change loading state
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // 🔒 NEW: OAuth user detection
  const userIsOAuth = isOAuthUser(user)
  const providerName = getProviderDisplayName(user?.provider || 'email')

  // 🔒 NEW: Set password mutation for OAuth users
  const setPasswordMutation = useMutation({
    mutationFn: ({ newPassword, confirmPassword }: {
      newPassword: string
      confirmPassword: string
    }) => AuthService.setPassword({ newPassword, confirmPassword }),
    onSuccess: () => {
      showSuccess('¡Contraseña establecida!', 'Ahora puedes iniciar sesión con email y contraseña')
      setShowSetPasswordDialog(false)
      setOauthPasswordData({ newPassword: '', confirmPassword: '' })
    },
    onError: (error: Error) => {
      showError('Error', error.message)
    }
  })


  // 🔒 NEW: Change password function
  const handleChangePassword = async (passwordData: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    try {
      const result = await AuthService.changePassword(passwordData)
      showSuccess('¡Éxito!', result.message)
      setShowChangePasswordDialog(false)
      // Force logout después de cambio exitoso
      logout.mutate()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar contraseña'
      showError('Error', errorMessage)
    }
  }

  // 🔒 NEW: Password strength validation
  const validatePasswordStrength = (password: string) => {
    if (password.length < 12) return false
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) return false
    return true
  }

  // 🔒 NEW: Backup functions
  const handleCreateBackup = async (type: 'full' | 'incremental' = 'full') => {
    try {
      await createBackup.mutateAsync({ type })
      showSuccess('Backup creado', `Backup ${type === 'full' ? 'completo' : 'incremental'} creado exitosamente`)
      setShowBackupDialog(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear backup'
      showError('Error', errorMessage)
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    try {
      await restoreBackup.mutateAsync({ backupId })
      showSuccess('Backup restaurado', 'Los datos han sido restaurados exitosamente')
      setShowRestoreDialog(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al restaurar backup'
      showError('Error', errorMessage)
    }
  }

  const handleCleanupBackups = async () => {
    try {
      await cleanupBackups.mutateAsync()
      showSuccess('Limpieza completada', 'Los backups antiguos han sido eliminados')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al limpiar backups'
      showError('Error', errorMessage)
    }
  }

  // Reset expanded section to default state
  const resetExpandedSection = () => {
    setExpandedSection(null)
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

      // 🧹 STEP 3: Limpiar cache ANTES de eliminar para evitar errores de queries
      queryClient.clear()

      // 🗑️ STEP 4: Conectar con el backend para eliminar la cuenta
      await deleteAccount.mutateAsync()

      // ✅ STEP 5: Mostrar confirmación
      Swal.close()
      await Swal.fire({
        title: 'Cuenta eliminada',
        text: 'Tu cuenta ha sido eliminada permanentemente',
        icon: 'success',
        confirmButtonText: 'Entendido'
      })

      // 🔀 STEP 6: Logout y redirect
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
              <PhoneInput
                label="Teléfono"
                value={profileData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                placeholder="123 456 7890"
                validateOnChange={true}
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
            onClick={() => setShowBackupDialog(true)}
          >
            <Database className="h-5 w-5 text-gray-500 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Backup de datos</div>
              <div className="text-xs text-gray-500">Crear y restaurar copias de seguridad</div>
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
          resetExpandedSection()
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
                onClick={() => setExpandedSection(expandedSection === 'notifications' ? null : 'notifications')}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones Detalladas
                </h3>
                {expandedSection === 'notifications' ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedSection === 'notifications' && (
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
                onClick={() => setExpandedSection(expandedSection === 'security' ? null : 'security')}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Seguridad
                </h3>
                {expandedSection === 'security' ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedSection === 'security' && (
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
                  
                  {/* Security Settings - CONDICIONAL según tipo de usuario */}
                  <div className="pt-3 border-t border-gray-100">
                    {/* Información del tipo de cuenta */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Shield className="h-4 w-4" />
                      <span>Cuenta vinculada con: <strong>{providerName}</strong></span>
                    </div>

                    {/* PARA USUARIOS EMAIL/PASSWORD */}
                    {!userIsOAuth && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setShowChangePasswordDialog(true)}
                          className="w-full mb-3"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Cambiar contraseña
                        </Button>
                        
                        <div className="text-xs text-gray-500 mb-3">
                          Tu cuenta usa autenticación por email y contraseña
                        </div>
                      </>
                    )}

                    {/* PARA USUARIOS OAUTH */}
                    {userIsOAuth && (
                      <>
                        {/* Información de seguridad OAuth */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-800 mb-1">
                                🔒 Cuenta protegida por {providerName}
                              </p>
                              <p className="text-blue-700 text-xs">
                                Tu contraseña es gestionada directamente por {providerName}. 
                                Para cambiarla, hazlo desde tu cuenta de {providerName}.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Opción para agregar contraseña local */}
                        <Button
                          variant="outline"
                          onClick={() => setShowSetPasswordDialog(true)}
                          className="w-full mb-3"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Establecer contraseña local
                        </Button>
                        
                        <div className="text-xs text-gray-500 mb-3">
                          Opcional: Agrega una contraseña para poder acceder también con email
                        </div>
                      </>
                    )}
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
          
          {/* No footer needed - users can close by clicking outside or pressing ESC */}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog 
        open={showChangePasswordDialog} 
        onOpenChange={(open) => {
          setShowChangePasswordDialog(open)
          if (!open) {
            // Reset form state
            setPasswordData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            })
            setShowPasswords({
              current: false,
              new: false,
              confirm: false
            })
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Actualiza tu contraseña para mantener tu cuenta segura
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={async (e) => {
            e.preventDefault()
            
            if (passwordData.newPassword !== passwordData.confirmPassword) {
              showError('Error', 'Las contraseñas no coinciden')
              return
            }
            
            // 🔒 NEW: Validate password strength before submission
            if (!validatePasswordStrength(passwordData.newPassword)) {
              showError('Error', 'La contraseña no cumple con los requisitos de seguridad')
              return
            }
            
            setIsChangingPassword(true)
            await handleChangePassword({
              currentPassword: passwordData.currentPassword,
              newPassword: passwordData.newPassword,
              confirmPassword: passwordData.confirmPassword
            })
            setIsChangingPassword(false)
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña actual
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Ingresa tu contraseña actual"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? "text" : "password"}
                    placeholder="Ingresa tu nueva contraseña"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 12 caracteres, incluir mayúsculas, minúsculas, números y símbolos
                </p>
                {/* 🔒 NEW: Password strength meter */}
                {passwordData.newPassword && (
                  <PasswordStrengthMeter 
                    password={passwordData.newPassword}
                    showRequirements
                    className="mt-3"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirma tu nueva contraseña"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="auto-change" />
                <label htmlFor="auto-change" className="text-sm text-gray-700">
                  Recordarme cambiar contraseña cada 90 días
                </label>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowChangePasswordDialog(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
                disabled={isChangingPassword}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto order-1 sm:order-2"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  'Cambiar contraseña'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog - For OAuth users */}
      <Dialog 
        open={showSetPasswordDialog} 
        onOpenChange={(open) => {
          setShowSetPasswordDialog(open)
          if (!open) {
            setOauthPasswordData({ newPassword: '', confirmPassword: '' })
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Establecer contraseña local</DialogTitle>
            <DialogDescription>
              Agrega una contraseña para poder acceder con email además de {providerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Información importante */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Información importante</p>
                  <ul className="text-amber-700 text-xs space-y-1">
                    <li>• Podrás iniciar sesión con email Y con {providerName}</li>
                    <li>• Tu cuenta {providerName} seguirá funcionando normalmente</li>
                    <li>• Esta contraseña es opcional</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Ingresa tu nueva contraseña"
                  value={oauthPasswordData.newPassword}
                  onChange={(e) => setOauthPasswordData(prev => ({ 
                    ...prev, 
                    newPassword: e.target.value 
                  }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Medidor de fortaleza */}
              {oauthPasswordData.newPassword && (
                <PasswordStrengthMeter 
                  password={oauthPasswordData.newPassword}
                  showRequirements={true}
                  className="mt-3"
                />
              )}
            </div>
            
            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Confirma tu nueva contraseña"
                  value={oauthPasswordData.confirmPassword}
                  onChange={(e) => setOauthPasswordData(prev => ({ 
                    ...prev, 
                    confirmPassword: e.target.value 
                  }))}
                  onPaste={(e) => {
                    e.preventDefault()
                    showInfo(
                      'Pegado deshabilitado',
                      'Por seguridad, no se puede pegar en este campo. Por favor, escribe la contraseña manualmente.'
                    )
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSetPasswordDialog(false)}
              disabled={setPasswordMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (oauthPasswordData.newPassword !== oauthPasswordData.confirmPassword) {
                  showError('Error', 'Las contraseñas no coinciden')
                  return
                }
                
                setPasswordMutation.mutate({
                  newPassword: oauthPasswordData.newPassword,
                  confirmPassword: oauthPasswordData.confirmPassword
                })
              }}
              disabled={setPasswordMutation.isPending || !oauthPasswordData.newPassword || !oauthPasswordData.confirmPassword}
            >
              {setPasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Estableciendo...
                </>
              ) : (
                'Establecer contraseña'
              )}
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
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteAccountDialog(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              disabled={!isDeleteConfirmationValid || isDeletingAccount}
              onClick={handleDeleteAccount}
              className="w-full sm:w-auto order-1 sm:order-2"
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

      {/* Backup Management Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gestión de Backups
            </DialogTitle>
            <DialogDescription>
              Crea y gestiona copias de seguridad de tus datos en AWS S3
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Backup Status */}
            {backupStatus ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">Estado de Backups</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Total de backups:</span>
                    <span className="ml-2 font-medium">{backupStatus.totalBackups}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Exitosos:</span>
                    <span className="ml-2 font-medium text-green-600">{backupStatus.successfulBackups}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Fallidos:</span>
                    <span className="ml-2 font-medium text-red-600">{backupStatus.failedBackups}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Tamaño total:</span>
                    <span className="ml-2 font-medium">{BackupService.formatFileSize(backupStatus.totalSize)}</span>
                  </div>
                </div>
                {backupStatus.lastBackup && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <span className="text-blue-600 text-sm">Último backup:</span>
                    <span className="ml-2 text-sm">
                      {BackupService.formatTimestamp(backupStatus.lastBackup.timestamp)} 
                      ({BackupService.getBackupTypeDisplayName(backupStatus.lastBackup.type)})
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-600">Cargando estado de backups...</span>
                </div>
              </div>
            )}

            {/* Create Backup Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Crear Nuevo Backup</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => handleCreateBackup('full')}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Backup Completo
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCreateBackup('incremental')}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Backup Incremental
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                • <strong>Completo:</strong> Incluye todos los datos<br/>
                • <strong>Incremental:</strong> Solo datos modificados desde el último backup
              </p>
            </div>

            {/* Backup List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Backups Disponibles</h3>
              {backups === undefined ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="text-sm">Cargando backups...</span>
                  </div>
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay backups disponibles</p>
                  <p className="text-sm">Crea tu primer backup para comenzar</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {backups.map((backup) => {
                    const statusDisplay = BackupService.getBackupStatusDisplay(backup.status)
                    return (
                      <div key={backup.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {BackupService.getBackupTypeDisplayName(backup.type)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${statusDisplay.color} bg-gray-100`}>
                              {statusDisplay.text}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {BackupService.formatTimestamp(backup.timestamp)} • {BackupService.formatFileSize(backup.size)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {backup.tables.length} tablas
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={isRestoring || backup.status !== 'completed'}
                          >
                            {isRestoring ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Cleanup Section */}
            {user?.role === 'owner' && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Mantenimiento</h3>
                <Button
                  variant="outline"
                  onClick={handleCleanupBackups}
                  disabled={isCleaning}
                  className="w-full"
                >
                  {isCleaning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Limpiando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar Backups Antiguos
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Elimina backups completados de más de 30 días
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </ProtectedRoute>
  )
} 
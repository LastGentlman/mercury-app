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
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Bell,
  Palette
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.ts'
import { useProfile } from '../hooks/useProfile.ts'
import { ProtectedRoute } from '../components/ProtectedRoute.tsx'
import { UserAvatar } from '../components/UserAvatar.tsx'
import { 
  Button, 
  Input, 
  Alert,
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
    stats, 
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
  const [alert, setAlert] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  } | null>(null)
  
  // Use profile stats from hook
  const profileStats = stats || { ordersToday: 0, satisfaction: 0 }

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'es',
    privacyMode: false
  })

  // Initialize profile data when user or profile loads
  useEffect(() => {
    if (user || profile) {
      // 🔍 DEBUG - Avatar values para troubleshooting
      console.log('🔍 DEBUG - Profile Avatar Values:', {
        user_avatar_url: user?.avatar_url,
        profile_avatar_url: profile?.avatar_url,
        prev_avatar: profileData.avatar,
        user_provider: user?.provider,
        user_metadata: user
      });

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
      showAlert('Por favor selecciona una imagen válida', 'error')
      return
    }

    // Show loading message for large files
    if (file.size > 500 * 1024) {
      showAlert('Optimizando imagen grande...', 'info')
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
        showAlert(`Avatar optimizado y actualizado correctamente (${compressionRatio}% más pequeño)`, 'success')
      } else {
        showAlert('Avatar actualizado correctamente', 'success')
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
      
      showAlert(`Error al subir la imagen: ${errorMessage}`, 'error')
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
      showAlert('Perfil actualizado correctamente', 'success')
      
    } catch (error) {
      console.error('Error saving profile:', error)
      showAlert('Error al guardar. Inténtalo de nuevo', 'error')
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

  // Show alert
  const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type, show: true })
    setTimeout(() => setAlert(null), 3000)
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

  // Loading state
  if (!user || isProfileLoading) {
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
      {/* Alert */}
      {alert && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <Alert className={`${
            alert.type === 'success' ? 'border-green-200 bg-green-50' :
            alert.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center gap-2">
              {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {alert.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          </Alert>
        </div>
      )}

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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b border-gray-100">
          <div className="text-center p-3">
            <div className="text-2xl font-bold text-blue-600">{profileStats.ordersToday}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Pedidos hoy</div>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl font-bold text-blue-600">{profileStats.satisfaction}%</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Satisfacción</div>
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
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>
              Personaliza tu experiencia en PedidoList
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Notificaciones</div>
                  <div className="text-xs text-gray-500">Recibir alertas y recordatorios</div>
                </div>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
              />
            </div>
            
            <Separator />
            
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
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, darkMode: checked }))}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Modo privado</div>
                  <div className="text-xs text-gray-500">Ocultar información sensible</div>
                </div>
              </div>
              <Switch
                checked={settings.privacyMode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, privacyMode: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
} 
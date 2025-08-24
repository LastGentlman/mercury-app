/**
 * UserAvatar Component
 * 
 * Maneja la visualización de avatares para diferentes tipos de usuarios:
 * - Google OAuth: Usa avatar de Google, sin fallback a iniciales
 * - Facebook OAuth: Usa avatar de Facebook, sin fallback a iniciales  
 * - Email/Password: Usa avatar personalizado o fallback a iniciales
 */

import { useState } from 'react'
import type { AuthUser } from '../types/auth.ts'

interface UserAvatarProps {
  user: AuthUser
  profileAvatar?: string | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showProviderBadge?: boolean
}

export function UserAvatar({ 
  user, 
  profileAvatar, 
  size = 'md', 
  className = '',
  showProviderBadge = false 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)
  
  // Determinar el tamaño del avatar
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  }
  
  // Determinar la URL del avatar según el tipo de usuario
  const getAvatarUrl = (): string => {
    // Prioridad: avatar personalizado > avatar OAuth > fallback (solo email)
    if (profileAvatar) {
      return profileAvatar
    }
    
    if (user.avatar_url) {
      return user.avatar_url
    }
    
    // Fallback solo para usuarios de email/password
    if (user.provider === 'email') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=${size === 'sm' ? '32' : size === 'md' ? '48' : size === 'lg' ? '80' : '96'}&background=2563eb&color=fff`
    }
    
    // Para usuarios OAuth sin avatar, no mostrar nada
    return ''
  }
  
  const avatarUrl = getAvatarUrl()
  const hasAvatar = !!avatarUrl
  
  // Determinar el texto del badge del proveedor
  const getProviderBadgeText = (): string => {
    switch (user.provider) {
      case 'google': return 'G'
      case 'facebook': return 'F'
      default: return 'OAuth'
    }
  }
  
  // Determinar el color del badge del proveedor
  const getProviderBadgeColor = (): string => {
    switch (user.provider) {
      case 'google': return 'bg-red-100 text-red-700 border-red-200'
      case 'facebook': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-green-100 text-green-700 border-green-200'
    }
  }
  
  // Manejar error de carga de imagen
  const handleImageError = () => {
    setImageError(true)
  }
  
  // Si no hay avatar y es usuario OAuth, mostrar un placeholder
  if (!hasAvatar && user.provider !== 'email') {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <div className={`w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300`}>
          <span className={`text-gray-500 font-medium ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-xl'
          }`}>
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        {showProviderBadge && (
          <div className="absolute -top-1 -right-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getProviderBadgeColor()}`}>
              {getProviderBadgeText()}
            </span>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {hasAvatar && (
        <img
          src={avatarUrl}
          alt={`Avatar de ${user.name}`}
          className="w-full h-full rounded-full object-cover border-2 border-gray-200"
          onError={handleImageError}
        />
      )}
      
      {/* Fallback para usuarios de email cuando la imagen falla */}
      {(!hasAvatar || imageError) && user.provider === 'email' && (
        <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-200">
          <span className={`text-white font-medium ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-xl'
          }`}>
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      
      {/* Badge del proveedor OAuth */}
      {showProviderBadge && user.provider !== 'email' && user.avatar_url && !profileAvatar && (
        <div className="absolute -top-1 -right-1">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getProviderBadgeColor()}`}>
            {getProviderBadgeText()}
          </span>
        </div>
      )}
    </div>
  )
} 
// Types for offline authentication
export interface AuthResult {
  valid: boolean
  reason: 'valid' | 'invalid_structure' | 'expired' | 'blacklisted' | 'pending_verification'
  needsSync?: boolean
}

export interface PendingVerification {
  token: string
  timestamp: number
  attempts: number
}

export interface OfflineGracePeriod {
  until: number
  extended: boolean
}

// Constants
const OFFLINE_GRACE_PERIOD = 5 * 60 * 1000 // 5 minutes
const PENDING_VERIFICATION_KEY = 'offline_pending_verifications'
const OFFLINE_GRACE_KEY = 'offline_grace_until'
const INVALID_TOKENS_KEY = 'offline_invalid_tokens'

/**
 * 🎯 OfflineAuthManager - Sistema Híbrido Inteligente
 * 
 * Maneja autenticación offline con:
 * - Verificación local de estructura JWT
 * - Verificación de expiración local
 * - Verificación de blacklist cuando hay conexión
 * - Período de gracia offline de 5 minutos
 * - Sincronización diferida de verificaciones pendientes
 */
export class OfflineAuthManager {
  private static instance: OfflineAuthManager

  public static getInstance(): OfflineAuthManager {
    if (!OfflineAuthManager.instance) {
      OfflineAuthManager.instance = new OfflineAuthManager()
    }
    return OfflineAuthManager.instance
  }

  /**
   * ✅ Verificación híbrida de token
   * 1. Verificar estructura local (siempre funciona)
   * 2. Verificar expiración local
   * 3. Si hay conexión, verificar blacklist
   * 4. Si no hay conexión, marcar para verificación posterior
   */
  async verifyToken(token: string): Promise<AuthResult> {
    try {
      // 1. Verificar estructura local (siempre funciona)
      if (!this.isValidJWTStructure(token)) {
        console.log('❌ Token structure invalid')
        return { valid: false, reason: 'invalid_structure' }
      }

      // 2. Verificar expiración local
      if (this.isExpiredLocally(token)) {
        console.log('❌ Token expired locally')
        return { valid: false, reason: 'expired' }
      }

      // 3. Verificar si está marcado como inválido localmente
      if (await this.isTokenInvalidLocally(token)) {
        console.log('❌ Token marked as invalid locally')
        return { valid: false, reason: 'blacklisted' }
      }

      // 4. Si hay conexión, verificar blacklist
      if (navigator.onLine) {
        try {
          const isBlacklisted = await this.checkBlacklist(token)
          if (isBlacklisted) {
            // ✅ Marcar como inválido localmente también
            await this.markTokenInvalidLocally(token)
            console.log('❌ Token blacklisted, marked as invalid locally')
            return { valid: false, reason: 'blacklisted' }
          }
        } catch (error) {
          console.warn('⚠️ Online blacklist check failed:', error)
          // 🟡 Sin conexión, permitir pero marcar para verificar después
          await this.markForLaterVerification(token)
          console.log('⚠️ Offline: Token validation deferred')
          return { valid: true, reason: 'valid', needsSync: true }
        }
      } else {
        // 🟡 Sin conexión, permitir pero marcar para verificación después
        await this.markForLaterVerification(token)
        console.log('⚠️ Offline: Token validation deferred')
        return { valid: true, reason: 'valid', needsSync: true }
      }

      return { valid: true, reason: 'valid' }
    } catch (error) {
      console.error('❌ Token verification error:', error)
      return { valid: false, reason: 'invalid_structure' }
    }
  }

  /**
   * ✅ Verificar estructura JWT localmente
   */
  private isValidJWTStructure(token: string): boolean {
    try {
      // Verificar formato básico JWT (3 partes separadas por puntos)
      const parts = token.split('.')
      if (parts.length !== 3) {
        return false
      }

      // Verificar que cada parte sea base64 válido
      for (const part of parts) {
        try {
          atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        } catch {
          return false
        }
      }

      // Intentar decodificar el payload (sin librería externa)
      try {
        const payload = parts[1]
        if (!payload) return false
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        return !!decoded && typeof decoded === 'object'
      } catch {
        return false
      }
    } catch {
      return false
    }
  }

  /**
   * ✅ Verificar expiración localmente
   */
  private isExpiredLocally(token: string): boolean {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return true
      }

      const payload = parts[1]
      if (!payload) return true
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
      
      if (!decoded.exp) {
        return true // Sin expiración = inválido
      }

      const now = Math.floor(Date.now() / 1000)
      return decoded.exp < now
    } catch {
      return true // Error al decodificar = inválido
    }
  }

  /**
   * ✅ Verificar blacklist en servidor
   */
  private async checkBlacklist(token: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      return !result.valid
    } catch (error) {
      console.error('❌ Blacklist check failed:', error)
      throw error
    }
  }

  /**
   * ✅ Marcar token para verificación posterior
   */
  private async markForLaterVerification(token: string): Promise<void> {
    try {
      const pending = await this.getPendingVerifications()
      
      // Evitar duplicados
      if (!pending.find(p => p.token === token)) {
        pending.push({
          token,
          timestamp: Date.now(),
          attempts: 0
        })
        
        localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(pending))
        console.log('📝 Token marked for later verification')
      }
    } catch (error) {
      console.error('❌ Failed to mark token for verification:', error)
    }
  }

  /**
   * ✅ Obtener verificaciones pendientes
   */
  private getPendingVerifications(): PendingVerification[] {
    try {
      const stored = localStorage.getItem(PENDING_VERIFICATION_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * ✅ Marcar token como inválido localmente
   */
  private async markTokenInvalidLocally(token: string): Promise<void> {
    try {
      const invalidTokens = await this.getInvalidTokens()
      if (!invalidTokens.includes(token)) {
        invalidTokens.push(token)
        localStorage.setItem(INVALID_TOKENS_KEY, JSON.stringify(invalidTokens))
      }
    } catch (error) {
      console.error('❌ Failed to mark token as invalid:', error)
    }
  }

  /**
   * ✅ Verificar si token está marcado como inválido localmente
   */
  private async isTokenInvalidLocally(token: string): Promise<boolean> {
    try {
      const invalidTokens = await this.getInvalidTokens()
      return invalidTokens.includes(token)
    } catch {
      return false
    }
  }

  /**
   * ✅ Obtener tokens inválidos
   */
  private getInvalidTokens(): string[] {
    try {
      const stored = localStorage.getItem(INVALID_TOKENS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * ✅ Sincronizar verificaciones pendientes cuando vuelve la conexión
   */
  async syncPendingVerifications(): Promise<void> {
    if (!navigator.onLine) {
      console.log('📱 Still offline, skipping sync')
      return
    }

    try {
      const pendingTokens = await this.getPendingVerifications()
      console.log(`🔄 Syncing ${pendingTokens.length} pending verifications...`)

      const validTokens: PendingVerification[] = []
      const invalidTokens: string[] = []

      for (const pending of pendingTokens) {
        try {
          const isBlacklisted = await this.checkBlacklist(pending.token)
          if (isBlacklisted) {
            invalidTokens.push(pending.token)
            console.log('❌ Token blacklisted during sync:', pending.token.substring(0, 8) + '...')
          } else {
            validTokens.push(pending)
            console.log('✅ Token verified during sync:', pending.token.substring(0, 8) + '...')
          }
        } catch (error) {
          console.error('❌ Failed to verify token during sync:', error)
          // Mantener para reintento posterior
          validTokens.push(pending)
        }
      }

      // Actualizar lista de verificaciones pendientes
      localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(validTokens))

      // Marcar tokens inválidos
      for (const token of invalidTokens) {
        await this.markTokenInvalidLocally(token)
      }

      // Si hay tokens inválidos, forzar logout
      if (invalidTokens.length > 0) {
        await this.forceLogoutLocally()
        this.showLogoutNotification()
      }

      console.log(`✅ Sync completed: ${validTokens.length} valid, ${invalidTokens.length} invalid`)
    } catch (error) {
      console.error('❌ Sync failed:', error)
    }
  }

  /**
   * ✅ Forzar logout local
   */
  private forceLogoutLocally(): void {
    try {
      // Limpiar token de autenticación
      localStorage.removeItem('authToken')
      
      // Limpiar datos de usuario
      localStorage.removeItem('user')
      
      // Limpiar verificaciones pendientes
      localStorage.removeItem(PENDING_VERIFICATION_KEY)
      
      // Limpiar período de gracia
      localStorage.removeItem(OFFLINE_GRACE_KEY)
      
      console.log('🚪 Forced logout completed')
    } catch (error) {
      console.error('❌ Failed to force logout:', error)
    }
  }

  /**
   * ✅ Mostrar notificación de logout
   */
  private showLogoutNotification(): void {
    // Usar SweetAlert2 si está disponible
    if (typeof globalThis.window !== 'undefined' && (globalThis.window as unknown as { Swal?: { fire: (options: unknown) => Promise<unknown> } }).Swal) {
      (globalThis.window as unknown as { Swal: { fire: (options: unknown) => Promise<unknown> } }).Swal.fire({
        title: 'Sesión Cerrada',
        text: 'Tu sesión fue cerrada por seguridad. Por favor, inicia sesión nuevamente.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      }).then(() => {
        globalThis.window.location.href = '/auth'
      })
    } else {
      // Fallback simple
      alert('Tu sesión fue cerrada por seguridad. Por favor, inicia sesión nuevamente.')
      globalThis.window.location.href = '/auth'
    }
  }

  /**
   * ✅ Extender período de gracia offline
   */
  extendOfflineGrace(): void {
    try {
      const gracePeriod: OfflineGracePeriod = {
        until: Date.now() + OFFLINE_GRACE_PERIOD,
        extended: true
      }
      localStorage.setItem(OFFLINE_GRACE_KEY, JSON.stringify(gracePeriod))
      console.log('⏰ Offline grace period extended')
    } catch (error) {
      console.error('❌ Failed to extend grace period:', error)
    }
  }

  /**
   * ✅ Verificar si estamos en período de gracia
   */
  isInGracePeriod(): boolean {
    try {
      const stored = localStorage.getItem(OFFLINE_GRACE_KEY)
      if (!stored) return false

      const gracePeriod: OfflineGracePeriod = JSON.parse(stored)
      return Date.now() < gracePeriod.until
    } catch {
      return false
    }
  }

  /**
   * ✅ Limpiar datos offline (útil para logout)
   */
  clearOfflineData(): void {
    try {
      localStorage.removeItem(PENDING_VERIFICATION_KEY)
      localStorage.removeItem(OFFLINE_GRACE_KEY)
      localStorage.removeItem(INVALID_TOKENS_KEY)
      console.log('🧹 Offline data cleared')
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error)
    }
  }

  /**
   * ✅ Obtener estado de autenticación offline
   */
  async getOfflineAuthStatus(): Promise<{
    isOnline: boolean
    isInGracePeriod: boolean
    pendingVerifications: number
    invalidTokens: number
  }> {
    try {
      const pending = await this.getPendingVerifications()
      const invalid = await this.getInvalidTokens()
      
      return {
        isOnline: navigator.onLine,
        isInGracePeriod: this.isInGracePeriod(),
        pendingVerifications: pending.length,
        invalidTokens: invalid.length
      }
    } catch {
      return {
        isOnline: navigator.onLine,
        isInGracePeriod: false,
        pendingVerifications: 0,
        invalidTokens: 0
      }
    }
  }
}

// Export singleton instance
export const offlineAuthManager = OfflineAuthManager.getInstance() 
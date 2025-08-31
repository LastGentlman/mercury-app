import { offlineAuthManager } from './offline-auth-manager.ts'

// Types for heartbeat service
export interface HeartbeatConfig {
  interval: number // milliseconds
  endpoint: string
  timeout: number
  retryAttempts: number
  retryDelay: number
}

export interface HeartbeatStatus {
  isRunning: boolean
  lastHeartbeat: number | null
  lastError: string | null
  consecutiveFailures: number
  isOffline: boolean
}

/**
 * 🎯 OfflineAwareHeartbeat - Heartbeat que respeta modo offline
 * 
 * Extiende el servicio de heartbeat existente para:
 * - Saltar heartbeat cuando está offline
 * - Verificar tokens antes de enviar heartbeat
 * - Extender período de gracia offline
 * - Manejar tokens invalidados durante heartbeat
 */
export class OfflineAwareHeartbeat {
  private config: HeartbeatConfig
  private status: HeartbeatStatus
  private intervalId: number | null = null
  private isMounted = true

  constructor(config: Partial<HeartbeatConfig> = {}) {
    this.config = {
      interval: 30000, // 30 segundos
      endpoint: '/api/auth/heartbeat',
      timeout: 10000, // 10 segundos
      retryAttempts: 3,
      retryDelay: 5000, // 5 segundos
      ...config
    }

    this.status = {
      isRunning: false,
      lastHeartbeat: null,
      lastError: null,
      consecutiveFailures: 0,
      isOffline: !navigator.onLine
    }

    // Escuchar cambios de conectividad
    this.setupConnectivityListeners()
  }

  /**
   * ✅ Iniciar heartbeat
   */
  start(): void {
    if (this.status.isRunning) {
      console.log('⚠️ Heartbeat already running')
      return
    }

    this.status.isRunning = true
    console.log('🫀 Starting offline-aware heartbeat...')

    // Enviar heartbeat inmediatamente
    this.sendHeartbeat()

    // Configurar intervalo
    this.intervalId = setInterval(() => {
      if (this.isMounted) {
        this.sendHeartbeat()
      }
    }, this.config.interval)
  }

  /**
   * ✅ Detener heartbeat
   */
  stop(): void {
    this.status.isRunning = false
    this.isMounted = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.log('🫀 Heartbeat stopped')
  }

  /**
   * ✅ Enviar heartbeat con verificación offline
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      // Solo si hay conexión Y token es confiable
      if (!navigator.onLine) {
        console.log('📱 Offline mode: skipping heartbeat')
        this.extendOfflineGrace()
        this.updateStatus({ isOffline: true })
        return
      }

      this.updateStatus({ isOffline: false })

      // Verificar si token sigue siendo válido
      const token = await this.getCurrentToken()
      if (!token) {
        console.log('⚠️ No auth token available, skipping heartbeat')
        return
      }

      const authManager = offlineAuthManager
      const verification = await authManager.verifyToken(token)

      if (!verification.valid) {
        console.log('🚨 Token invalidated during heartbeat:', verification.reason)
        await this.handleInvalidToken(verification.reason)
        return
      }

      // Continuar con heartbeat normal
      await this.performHeartbeat(token)
      
    } catch (error) {
      console.error('❌ Heartbeat error:', error)
      this.handleHeartbeatError(error)
    }
  }

  /**
   * ✅ Realizar heartbeat al servidor
   */
  private async performHeartbeat(token: string): Promise<void> {
    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: startTime,
          userAgent: navigator.userAgent
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const latency = Date.now() - startTime

      // Heartbeat exitoso
      this.updateStatus({
        lastHeartbeat: Date.now(),
        lastError: null,
        consecutiveFailures: 0
      })

      console.log(`✅ Heartbeat successful (${latency}ms latency)`)

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * ✅ Obtener token actual de forma segura
   */
  private getCurrentToken(): string | null {
    try {
      return localStorage.getItem('authToken')
    } catch (error) {
      console.error('❌ Failed to get auth token:', error)
      return null
    }
  }

  /**
   * ✅ Extender período de gracia offline
   */
  private extendOfflineGrace(): void {
    offlineAuthManager.extendOfflineGrace()
  }

  /**
   * ✅ Manejar token inválido
   */
  private handleInvalidToken(reason: string): void {
    if (reason === 'blacklisted') {
      // Token invalidado remotamente
      this.showSecurityAlert('Tu sesión fue cerrada remotamente por seguridad')
      setTimeout(() => {
        globalThis.window.location.href = '/auth'
      }, 3000)
    } else if (reason === 'expired') {
      // Token expirado
      console.log('⏰ Token expired, redirecting to login')
      globalThis.window.location.href = '/auth'
    } else {
      // Otros casos
      console.log('⚠️ Token invalid for other reason:', reason)
    }
  }

  /**
   * ✅ Mostrar alerta de seguridad
   */
  private showSecurityAlert(message: string): void {
    // Usar SweetAlert2 si está disponible
    if (typeof globalThis.window !== 'undefined' && (globalThis.window as unknown as { Swal?: { fire: (options: unknown) => Promise<unknown> } }).Swal) {
      (globalThis.window as unknown as { Swal: { fire: (options: unknown) => Promise<unknown> } }).Swal.fire({
        title: 'Alerta de Seguridad',
        text: message,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false
      })
    } else {
      // Fallback simple
      alert(message)
    }
  }

  /**
   * ✅ Manejar errores de heartbeat
   */
  private handleHeartbeatError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    this.updateStatus({
      lastError: errorMessage,
      consecutiveFailures: this.status.consecutiveFailures + 1
    })

    console.error('❌ Heartbeat failed:', errorMessage)

    // Si hay muchos fallos consecutivos, considerar offline
    if (this.status.consecutiveFailures >= this.config.retryAttempts) {
      console.log('📱 Too many consecutive failures, treating as offline')
      this.updateStatus({ isOffline: true })
      this.extendOfflineGrace()
    }
  }

  /**
   * ✅ Actualizar estado del heartbeat
   */
  private updateStatus(updates: Partial<HeartbeatStatus>): void {
    this.status = { ...this.status, ...updates }
  }

  /**
   * ✅ Configurar listeners de conectividad
   */
  private setupConnectivityListeners(): void {
    const handleOnline = () => {
      console.log('🌐 Connection restored')
      this.updateStatus({ isOffline: false })
      
      // Sincronizar verificaciones pendientes
      offlineAuthManager.syncPendingVerifications()
      
      // Enviar heartbeat inmediatamente
      if (this.status.isRunning) {
        setTimeout(() => this.sendHeartbeat(), 1000)
      }
    }

    const handleOffline = () => {
      console.log('📱 Connection lost')
      this.updateStatus({ isOffline: true })
      this.extendOfflineGrace()
    }

    globalThis.window.addEventListener('online', handleOnline)
    globalThis.window.addEventListener('offline', handleOffline)
  }

  /**
   * ✅ Obtener estado actual del heartbeat
   */
  getStatus(): HeartbeatStatus {
    return { ...this.status }
  }

  /**
   * ✅ Verificar si el heartbeat está funcionando correctamente
   */
  isHealthy(): boolean {
    const now = Date.now()
    const lastHeartbeat = this.status.lastHeartbeat
    
    if (!lastHeartbeat) {
      return true // Aún no ha enviado el primer heartbeat
    }

    // Considerar no saludable si no ha enviado heartbeat en 2 intervalos
    const maxAllowedDelay = this.config.interval * 2
    return (now - lastHeartbeat) < maxAllowedDelay
  }

  /**
   * ✅ Forzar envío de heartbeat
   */
  async forceHeartbeat(): Promise<void> {
    console.log('🫀 Forcing heartbeat...')
    await this.sendHeartbeat()
  }

  /**
   * ✅ Limpiar recursos
   */
  destroy(): void {
    this.stop()
  }
}

// Export singleton instance
export const offlineAwareHeartbeat = new OfflineAwareHeartbeat() 
/**
 * Backup Service - Frontend
 * 
 * Handles backup operations from the frontend
 */

import { BACKEND_URL } from '../config.ts'
import { supabase } from '../utils/supabase.ts'

// Constants
const BACKUP_ENDPOINTS = {
  CREATE: '/api/backup/create',
  LIST: '/api/backup/list',
  RESTORE: '/api/backup/restore',
  STATUS: '/api/backup/status',
  CLEANUP: '/api/backup/cleanup'
} as const

const BACKUP_TYPE_LABELS = {
  full: 'Completo',
  incremental: 'Incremental',
  manual: 'Manual'
} as const

const BACKUP_STATUS_LABELS = {
  completed: { text: 'Completado', color: 'text-green-600' },
  pending: { text: 'En progreso', color: 'text-yellow-600' },
  failed: { text: 'Fallido', color: 'text-red-600' }
} as const

export interface BackupInfo {
  id: string
  timestamp: string
  type: 'full' | 'incremental' | 'manual'
  size: number
  compressed: boolean
  status: 'pending' | 'completed' | 'failed'
  tables: string[]
}

export interface BackupStatus {
  totalBackups: number
  successfulBackups: number
  failedBackups: number
  totalSize: number
  lastBackup: {
    id: string
    timestamp: string
    type: string
    size: number
  } | null
}

export interface CreateBackupRequest {
  type?: 'full' | 'incremental'
}

export interface CreateBackupResponse {
  success: boolean
  message: string
  backupId: string
  size: number
  timestamp: string
  error?: string
}

export interface RestoreBackupRequest {
  backupId: string
}

export interface RestoreBackupResponse {
  success: boolean
  message: string
  error?: string
}

export class BackupService {
  /**
   * Handle API errors with user-friendly messages
   */
  private static handleApiError(error: unknown): never {
    console.error('API Error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('No authentication token')) {
        throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.')
      }
    }
    throw error
  }

  /**
   * Make authenticated API request
   */
  private static async makeAuthenticatedRequest(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await BackupService.getAuthToken()
    
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })
  }

  /**
   * Get authentication token
   */
  private static async getAuthToken(): Promise<string> {
    // Try Supabase first if available
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          return session.access_token;
        }
      } catch (error) {
        console.warn('Supabase auth failed, trying fallback:', error);
      }
    }

    // Fallback to localStorage token
    const token = localStorage.getItem('authToken');
    if (token) {
      return token;
    }

    throw new Error('No authentication token available');
  }

  /**
   * Create a new backup
   */
  static async createBackup(request: CreateBackupRequest = {}): Promise<CreateBackupResponse> {
    try {
      const response = await BackupService.makeAuthenticatedRequest(`${BACKEND_URL}${BACKUP_ENDPOINTS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to create backup (${response.status})`)
      }

      return await response.json()
    } catch (error) {
      BackupService.handleApiError(error)
    }
  }

  /**
   * List all user backups
   */
  static async listBackups(): Promise<BackupInfo[]> {
    try {
      const response = await BackupService.makeAuthenticatedRequest(`${BACKEND_URL}${BACKUP_ENDPOINTS.LIST}`, {
        method: 'GET'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to list backups (${response.status})`)
      }

      const data = await response.json()
      return data.backups || []
    } catch (error) {
      BackupService.handleApiError(error)
    }
  }

  /**
   * Restore from a backup
   */
  static async restoreBackup(request: RestoreBackupRequest): Promise<RestoreBackupResponse> {
    try {
      const response = await BackupService.makeAuthenticatedRequest(`${BACKEND_URL}${BACKUP_ENDPOINTS.RESTORE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to restore backup (${response.status})`)
      }

      return await response.json()
    } catch (error) {
      BackupService.handleApiError(error)
    }
  }

  /**
   * Get backup status and statistics
   */
  static async getBackupStatus(): Promise<BackupStatus> {
    try {
      const response = await BackupService.makeAuthenticatedRequest(`${BACKEND_URL}${BACKUP_ENDPOINTS.STATUS}`, {
        method: 'GET'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to get backup status (${response.status})`)
      }

      const data = await response.json()
      return data.status
    } catch (error) {
      BackupService.handleApiError(error)
    }
  }

  /**
   * Clean up old backups (admin only)
   */
  static async cleanupOldBackups(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await BackupService.makeAuthenticatedRequest(`${BACKEND_URL}${BACKUP_ENDPOINTS.CLEANUP}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to clean up backups (${response.status})`)
      }

      return await response.json()
    } catch (error) {
      BackupService.handleApiError(error)
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get backup type display name
   */
  static getBackupTypeDisplayName(type: string): string {
    return BACKUP_TYPE_LABELS[type as keyof typeof BACKUP_TYPE_LABELS] || type
  }

  /**
   * Get backup status display name and color
   */
  static getBackupStatusDisplay(status: string): { text: string; color: string } {
    return BACKUP_STATUS_LABELS[status as keyof typeof BACKUP_STATUS_LABELS] || 
           { text: status, color: 'text-gray-600' }
  }
}

export default BackupService

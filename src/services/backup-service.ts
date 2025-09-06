/**
 * Backup Service - Frontend
 * 
 * Handles backup operations from the frontend
 */

import { BACKEND_URL } from '../config/api.ts'
import { csrfRequest } from '../utils/csrf.ts'

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
   * Create a new backup
   */
  static async createBackup(request: CreateBackupRequest = {}): Promise<CreateBackupResponse> {
    try {
      const response = await csrfRequest(`${BACKEND_URL}/api/backup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create backup')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating backup:', error)
      throw error
    }
  }

  /**
   * List all user backups
   */
  static async listBackups(): Promise<BackupInfo[]> {
    try {
      const response = await csrfRequest(`${BACKEND_URL}/api/backup/list`, {
        method: 'GET'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to list backups')
      }

      const data = await response.json()
      return data.backups || []
    } catch (error) {
      console.error('Error listing backups:', error)
      throw error
    }
  }

  /**
   * Restore from a backup
   */
  static async restoreBackup(request: RestoreBackupRequest): Promise<RestoreBackupResponse> {
    try {
      const response = await csrfRequest(`${BACKEND_URL}/api/backup/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore backup')
      }

      return await response.json()
    } catch (error) {
      console.error('Error restoring backup:', error)
      throw error
    }
  }

  /**
   * Get backup status and statistics
   */
  static async getBackupStatus(): Promise<BackupStatus> {
    try {
      const response = await csrfRequest(`${BACKEND_URL}/api/backup/status`, {
        method: 'GET'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get backup status')
      }

      const data = await response.json()
      return data.status
    } catch (error) {
      console.error('Error getting backup status:', error)
      throw error
    }
  }

  /**
   * Clean up old backups (admin only)
   */
  static async cleanupOldBackups(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await csrfRequest(`${BACKEND_URL}/api/backup/cleanup`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to clean up backups')
      }

      return await response.json()
    } catch (error) {
      console.error('Error cleaning up backups:', error)
      throw error
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
    switch (type) {
      case 'full':
        return 'Completo'
      case 'incremental':
        return 'Incremental'
      case 'manual':
        return 'Manual'
      default:
        return type
    }
  }

  /**
   * Get backup status display name and color
   */
  static getBackupStatusDisplay(status: string): { text: string; color: string } {
    switch (status) {
      case 'completed':
        return { text: 'Completado', color: 'text-green-600' }
      case 'pending':
        return { text: 'En progreso', color: 'text-yellow-600' }
      case 'failed':
        return { text: 'Fallido', color: 'text-red-600' }
      default:
        return { text: status, color: 'text-gray-600' }
    }
  }
}

export default BackupService

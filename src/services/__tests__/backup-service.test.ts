/**
 * BackupService Tests
 * 
 * Tests for authentication, fallbacks, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import BackupService from '../backup-service.ts'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn()
  }
}

vi.mock('../../utils/supabase.ts', () => ({
  supabase: mockSupabase
}))

describe('BackupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Authentication', () => {
    it('should use Supabase token when available', async () => {
      // Arrange
      const mockToken = 'supabase-token-123'
      const mockSession = {
        access_token: mockToken,
        user: { id: 'user-123' }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ backups: [] })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      await BackupService.listBackups()

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backup/list'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      )
    })

    it('should fallback to localStorage when Supabase fails', async () => {
      // Arrange
      const mockToken = 'localstorage-token-456'
      localStorageMock.getItem.mockReturnValue(mockToken)
      
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Supabase error'))

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ backups: [] })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      await BackupService.listBackups()

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backup/list'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      )
    })

    it('should throw error when no authentication available', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Supabase error'))
      localStorageMock.getItem.mockReturnValue(null)

      // Act & Assert
      await expect(BackupService.listBackups()).rejects.toThrow('No estás autenticado. Por favor, inicia sesión nuevamente.')
    })

    it('should handle null supabase client gracefully', async () => {
      // Arrange
      const mockToken = 'localstorage-token-789'
      localStorageMock.getItem.mockReturnValue(mockToken)
      
      // Mock supabase as null
      mockSupabase.auth = null as any

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ backups: [] })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      await BackupService.listBackups()

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backup/list'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should provide user-friendly error messages for authentication failures', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Supabase error'))
      localStorageMock.getItem.mockReturnValue(null)

      // Act & Assert
      await expect(BackupService.listBackups()).rejects.toThrow('No estás autenticado. Por favor, inicia sesión nuevamente.')
    })

    it('should handle network errors gracefully', async () => {
      // Arrange
      const mockToken = 'test-token'
      localStorageMock.getItem.mockReturnValue(mockToken)
      mockFetch.mockRejectedValue(new Error('Failed to fetch'))

      // Act & Assert
      await expect(BackupService.listBackups()).rejects.toThrow('Error de conexión. Verifica tu conexión a internet.')
    })

    it('should handle HTTP error responses', async () => {
      // Arrange
      const mockToken = 'test-token'
      localStorageMock.getItem.mockReturnValue(mockToken)
      
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act & Assert
      await expect(BackupService.listBackups()).rejects.toThrow('Unauthorized')
    })

    it('should handle malformed JSON responses', async () => {
      // Arrange
      const mockToken = 'test-token'
      localStorageMock.getItem.mockReturnValue(mockToken)
      
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act & Assert
      await expect(BackupService.listBackups()).rejects.toThrow('Failed to list backups (500)')
    })
  })

  describe('API Methods', () => {
    beforeEach(() => {
      const mockToken = 'test-token'
      localStorageMock.getItem.mockReturnValue(mockToken)
    })

    it('should create backup successfully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          message: 'Backup created',
          backupId: 'backup-123',
          size: 1024,
          timestamp: '2024-01-01T00:00:00Z'
        })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await BackupService.createBackup({ type: 'full' })

      // Assert
      expect(result.success).toBe(true)
      expect(result.backupId).toBe('backup-123')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backup/create'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'full' })
        })
      )
    })

    it('should list backups successfully', async () => {
      // Arrange
      const mockBackups = [
        {
          id: 'backup-1',
          timestamp: '2024-01-01T00:00:00Z',
          type: 'full',
          size: 1024,
          status: 'completed',
          tables: ['users', 'orders']
        }
      ]
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ backups: mockBackups })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await BackupService.listBackups()

      // Assert
      expect(result).toEqual(mockBackups)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backup/list'),
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    it('should get backup status successfully', async () => {
      // Arrange
      const mockStatus = {
        totalBackups: 5,
        successfulBackups: 4,
        failedBackups: 1,
        totalSize: 5120,
        lastBackup: {
          id: 'backup-1',
          timestamp: '2024-01-01T00:00:00Z',
          type: 'full',
          size: 1024
        }
      }
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ status: mockStatus })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await BackupService.getBackupStatus()

      // Assert
      expect(result).toEqual(mockStatus)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backup/status'),
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    it('should restore backup successfully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          message: 'Backup restored'
        })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await BackupService.restoreBackup({ backupId: 'backup-123' })

      // Assert
      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/backup/restore'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ backupId: 'backup-123' })
        })
      )
    })
  })

  describe('Utility Methods', () => {
    it('should format file sizes correctly', () => {
      expect(BackupService.formatFileSize(0)).toBe('0 Bytes')
      expect(BackupService.formatFileSize(1024)).toBe('1 KB')
      expect(BackupService.formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(BackupService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should format timestamps correctly', () => {
      const timestamp = '2024-01-15T14:30:00Z'
      const formatted = BackupService.formatTimestamp(timestamp)
      expect(formatted).toContain('15')
      expect(formatted).toContain('ene')
      expect(formatted).toContain('2024')
    })

    it('should get backup type display names', () => {
      expect(BackupService.getBackupTypeDisplayName('full')).toBe('Completo')
      expect(BackupService.getBackupTypeDisplayName('incremental')).toBe('Incremental')
      expect(BackupService.getBackupTypeDisplayName('manual')).toBe('Manual')
      expect(BackupService.getBackupTypeDisplayName('unknown')).toBe('unknown')
    })

    it('should get backup status display info', () => {
      expect(BackupService.getBackupStatusDisplay('completed')).toEqual({
        text: 'Completado',
        color: 'text-green-600'
      })
      expect(BackupService.getBackupStatusDisplay('pending')).toEqual({
        text: 'En progreso',
        color: 'text-yellow-600'
      })
      expect(BackupService.getBackupStatusDisplay('failed')).toEqual({
        text: 'Fallido',
        color: 'text-red-600'
      })
    })
  })
})

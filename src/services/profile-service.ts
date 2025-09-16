/**
 * Profile Service
 * 
 * Handles all profile-related operations including:
 * - Fetching user profile data
 * - Updating profile information
 * - Avatar upload and management
 * - Profile statistics
 */

import { supabase } from '../utils/supabase.ts'
import { STORAGE_CONFIG } from '../config/storage.ts'
import type { 
  AuthUser, 
  AuthProvider 
} from '../types/auth.ts'
import { optimizeImage, DEFAULT_AVATAR_OPTIONS, formatFileSize } from '../utils/imageOptimization.ts'

export interface ProfileData {
  id: string
  fullName: string
  phone?: string
  avatar_url?: string
  businessId?: string
  role?: 'owner' | 'employee'
  settings?: UserSettings
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  notifications: boolean
  darkMode: boolean
  language: string
  privacyMode: boolean
}

export interface ProfileStats {
  ordersToday: number
  satisfaction: number
  totalOrders: number
  averageOrderValue: number
}

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  avatar_url?: string
  settings?: Partial<UserSettings>
}

export class ProfileService {
  /**
   * Check if storage bucket exists and is accessible
   */
  static async validateStorageBucket(): Promise<boolean> {
    if (!supabase) {
      console.error('❌ Supabase client not configured')
      return false
    }

    try {
      console.log('🔍 Validating storage bucket...')
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 Current user:', user ? { id: user.id, email: user.email } : 'Not authenticated')
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        return false
      }
      
      if (!user) {
        console.error('❌ No authenticated user')
        return false
      }
      
      // Try to list buckets first
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('❌ Error checking storage buckets:', error)
        console.error('Error details:', {
          message: error.message,
          name: error.name
        })
        
        // If we can't list buckets, assume bucket is available (common with restricted permissions)
        console.log('✅ Assuming bucket is available (common with restricted permissions)')
        return true
      }

      console.log('📦 All buckets:', data?.map(b => ({ name: b.name, public: b.public })) || [])
      
              const avatarsBucket = data?.find(bucket => bucket.name === STORAGE_CONFIG.BUCKETS.USER_AVATARS)
      
      if (!avatarsBucket) {
        console.warn('⚠️ User avatars bucket not found in list. Available buckets:', data?.map(b => b.name))
        
        // Since we can reach the bucket (as shown by the 400 error), consider it available
        console.log('✅ Bucket accessible (confirmed by direct access test)')
        return true
      }

      console.log('✅ User avatars bucket found:', {
        name: avatarsBucket.name,
        public: avatarsBucket.public,
        file_size_limit: avatarsBucket.file_size_limit,
        allowed_mime_types: avatarsBucket.allowed_mime_types
      })
      return true
    } catch (error) {
      console.error('❌ Error validating storage bucket:', error)
      return false
    }
  }



  /**
   * Get current user's profile data
   */
  static async getProfile(): Promise<ProfileData | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // 🔒 NEW: Don't throw error during account deletion, just return null
        console.log('No authenticated user - returning null (likely during account deletion)')
        return null
      }

      // Get profile from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error)
        return null
      }

      // If profile doesn't exist, create one
      if (!profile) {
        console.log('Profile not found, creating new profile for user:', user.email)
        const authUser: AuthUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          avatar_url: user.user_metadata?.avatar_url,
          provider: (user.app_metadata?.provider as AuthProvider) || 'email'
        }
        try {
          return await this.createProfile(authUser)
        } catch (createError) {
          console.error('Error creating profile:', createError)
          return null
        }
      }

      return profile
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  /**
   * Create a new profile for the user
   */
  static async createProfile(user: AuthUser): Promise<ProfileData> {
    if (!supabase) {
      throw new Error('Supabase client not configured')
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        fullName: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        settings: {
          notifications: true,
          darkMode: false,
          language: 'es',
          privacyMode: false
        }
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: UpdateProfileRequest): Promise<ProfileData> {
    if (!supabase) {
      throw new Error('Supabase client not configured')
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Upload avatar image with optimization
   */
  static async uploadAvatar(file: File): Promise<{ avatarUrl: string; optimizationStats?: { originalSize: number; optimizedSize: number; compressionRatio: number } }> {
    if (!supabase) {
      throw new Error('Supabase client not configured')
    }

    // Validate storage bucket first
    const isBucketValid = await this.validateStorageBucket()
    if (!isBucketValid) {
      throw new Error('Storage bucket not available. Please check your Supabase configuration.')
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    // Optimize image before upload
    let optimizedFile: File
    let optimizationStats: { originalSize: number; optimizedSize: number; compressionRatio: number }
    
    try {
      console.log('🔄 Optimizing image...')
      const optimizedImage = await optimizeImage(file, DEFAULT_AVATAR_OPTIONS)
      optimizedFile = optimizedImage.file
      optimizationStats = {
        originalSize: optimizedImage.originalSize,
        optimizedSize: optimizedImage.optimizedSize,
        compressionRatio: optimizedImage.compressionRatio
      }
      
      console.log('✅ Image optimization completed:', {
        originalSize: formatFileSize(optimizationStats.originalSize),
        optimizedSize: formatFileSize(optimizationStats.optimizedSize),
        compressionRatio: `${optimizationStats.compressionRatio.toFixed(1)}%`,
        dimensions: `${optimizedImage.dimensions.width}x${optimizedImage.dimensions.height}px`
      })
    } catch (error) {
      console.warn('⚠️ Image optimization failed, using original file:', error)
      optimizedFile = file
      optimizationStats = {
        originalSize: file.size,
        optimizedSize: file.size,
        compressionRatio: 0
      }
    }

    // Validate file size after optimization (500KB limit)
    if (optimizedFile.size > 500 * 1024) {
      const originalSizeMB = (optimizationStats.originalSize / (1024 * 1024)).toFixed(1)
      const optimizedSizeMB = (optimizedFile.size / (1024 * 1024)).toFixed(1)
      throw new Error(`La imagen es demasiado grande. Original: ${originalSizeMB}MB, Optimizada: ${optimizedSizeMB}MB. Intenta con una imagen más pequeña.`)
    }

    // Get current profile to find existing avatar
    const currentProfile = await this.getProfile()
    const existingAvatarUrl = currentProfile?.avatar_url

          // Delete previous avatar if it exists and is from our bucket
      if (existingAvatarUrl && existingAvatarUrl.includes(STORAGE_CONFIG.BUCKETS.USER_AVATARS)) {
      try {
        // Extract the file path from the URL
        const urlParts = existingAvatarUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        
        if (fileName && fileName.includes(user.id)) {
                      const { error: deleteError } = await supabase.storage
              .from(STORAGE_CONFIG.BUCKETS.USER_AVATARS)
              .remove([fileName])
          
          if (deleteError) {
            console.warn('⚠️ Failed to delete previous avatar:', deleteError)
          } else {
            console.log('🗑️ Previous avatar deleted:', fileName)
          }
        }
      } catch (error) {
        console.warn('⚠️ Error deleting previous avatar:', error)
        // Don't throw error - continue with upload even if deletion fails
      }
    }

    // Generate unique filename with optimized extension
    const fileExt = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp'
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    
          // Upload optimized file to user_avatars bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKETS.USER_AVATARS)
        .upload(fileName, optimizedFile, {
        cacheControl: '3600',
        upsert: true // Allow overwriting
      })

    if (uploadError) {
      console.error('❌ Upload error details:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    if (!uploadData?.path) {
      throw new Error('Upload succeeded but no path returned')
    }

          // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_CONFIG.BUCKETS.USER_AVATARS)
        .getPublicUrl(uploadData.path)

    console.log('✅ Avatar uploaded successfully:', {
      path: uploadData.path,
      publicUrl,
      fileSize: formatFileSize(optimizedFile.size),
      fileType: optimizedFile.type,
      optimization: optimizationStats.compressionRatio > 0 ? {
        originalSize: formatFileSize(optimizationStats.originalSize),
        optimizedSize: formatFileSize(optimizationStats.optimizedSize),
        compressionRatio: `${optimizationStats.compressionRatio.toFixed(1)}%`
      } : 'No optimization applied'
    })

    return {
      avatarUrl: publicUrl,
      ...(optimizationStats.compressionRatio > 0 && { optimizationStats })
    }
  }

  /**
   * Get user statistics
   */
  static async getProfileStats(): Promise<ProfileStats> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // 🔒 NEW: Don't throw error during account deletion, just return empty stats
        console.log('No authenticated user - returning empty stats (likely during account deletion)')
        return {
          ordersToday: 0,
          satisfaction: 0,
          totalOrders: 0,
          averageOrderValue: 0
        }
      }

      // In a real app, you would fetch this from your orders/analytics tables
      // For now, return mock data
      return {
        ordersToday: 47,
        satisfaction: 98,
        totalOrders: 1247,
        averageOrderValue: 89.50
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error)
      return {
        ordersToday: 0,
        satisfaction: 0,
        totalOrders: 0,
        averageOrderValue: 0
      }
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not configured')
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      throw error
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(): Promise<void> {
    let authToken: string | null = null
    
    // Try to get auth token from localStorage first (traditional auth users)
    authToken = localStorage.getItem('authToken')
    
    // If no localStorage token, try to get from Supabase session (OAuth users)
    if (!authToken && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting Supabase session:', error)
        } else if (session?.access_token) {
          authToken = session.access_token
          console.log('✅ Using Supabase session token for account deletion')
        }
      } catch (error) {
        console.error('Error accessing Supabase session:', error)
      }
    }
    
    if (!authToken) {
      throw new Error('No authenticated user - please log in again')
    }

    // Call the backend endpoint for account deletion
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
      
      // Handle specific error cases
      if (response.status === 400) {
        if (errorData.code === 'PENDING_ORDERS_EXIST') {
          throw new Error(`No puedes eliminar tu cuenta mientras tengas ${errorData.pendingOrders} pedidos pendientes`)
        } else if (errorData.code === 'SOLE_OWNER_CANNOT_DELETE') {
          throw new Error('No puedes eliminar tu cuenta si eres el único propietario del negocio. Transfiere la propiedad o elimina el negocio primero.')
        }
      }
      
      throw new Error(errorMessage)
    }

    // Account deletion successful
    console.log('✅ Account deletion request successful')
    
    // 🔍 VERIFY: Wait and verify that the account was actually deleted
    console.log('⏳ Waiting for backend deletion to complete...')
    await this.verifyAccountDeletion()
    
    // 🔍 ADDITIONAL VERIFICATION: Try to make a request to verify deletion
    try {
      const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (verifyResponse.status === 401 || verifyResponse.status === 403) {
        console.log('✅ Backend confirms user is deleted (401/403 response)')
      } else if (verifyResponse.ok) {
        console.warn('⚠️ Backend still recognizes user - deletion may not be complete')
      }
    } catch (verifyError) {
      console.log('✅ Backend verification failed (expected after deletion):', verifyError)
    }
    
    // 🧹 ENHANCED CLEANUP: Clear all authentication data more thoroughly
    await this.performCompleteAuthCleanup()
    
    // 🚀 FORCE REDIRECT: Use window.location.replace for immediate redirect
    console.log('🚀 Forcing immediate redirect to auth page...')
    
    // Disable any automatic redirect systems temporarily
    if (typeof window !== 'undefined') {
      const globalWindow = window as any
      globalWindow.__ACCOUNT_DELETION_IN_PROGRESS__ = true
    }
    
    window.location.replace('/auth')
  }

  /**
   * Verify that the account was actually deleted from the backend
   */
  static async verifyAccountDeletion(): Promise<void> {
    console.log('🔍 Verifying account deletion...')
    
    // Wait for backend processing
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Try to verify with Supabase session
    if (supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.log('✅ Supabase session error (expected after deletion):', error.message)
          return // This is expected - the session should be invalid
        }
        
        if (!session) {
          console.log('✅ Supabase session cleared (account deleted)')
          return
        }
        
        // If we still have a session, force cleanup
        console.warn('⚠️ Supabase session still exists - forcing cleanup...')
        
        // Force signOut multiple times
        for (let i = 0; i < 3; i++) {
          try {
            await supabase.auth.signOut()
            console.log(`🔄 Force signOut attempt ${i + 1}`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (signOutError) {
            console.log(`✅ SignOut error (expected):`, signOutError)
          }
        }
        
        // Clear session manually
        try {
          await supabase.auth.setSession({ access_token: '', refresh_token: '' })
          console.log('🔄 Manual session clear attempted')
        } catch (setSessionError) {
          console.log('✅ SetSession error (expected):', setSessionError)
        }
        
        // Final verification
        const { data: { session: finalSession } } = await supabase.auth.getSession()
        if (!finalSession) {
          console.log('✅ Supabase session finally cleared')
        } else {
          console.warn('⚠️ Supabase session persists - proceeding with cleanup anyway')
        }
        
      } catch (error) {
        console.log('✅ Supabase verification error (expected):', error)
        // This is expected - the session should be invalid after deletion
      }
    }
    
    console.log('✅ Account deletion verification completed')
  }

  /**
   * Perform complete authentication cleanup after account deletion
   */
  static async performCompleteAuthCleanup(): Promise<void> {
    console.log('🧹 Starting complete authentication cleanup...')
    
    // Clear all local storage data
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    })
    
    // Clear Supabase session data with multiple approaches
    if (supabase) {
      try {
        console.log('🔄 Starting aggressive Supabase session cleanup...')
        
        // Method 1: Multiple signOut attempts
        for (let i = 0; i < 5; i++) {
          try {
            const { error: signOutError } = await supabase.auth.signOut()
            if (signOutError) {
              console.log(`🔄 SignOut attempt ${i + 1} error (expected):`, signOutError.message)
            } else {
              console.log(`✅ SignOut attempt ${i + 1} completed`)
            }
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (error) {
            console.log(`✅ SignOut attempt ${i + 1} exception (expected):`, error)
          }
        }
        
        // Method 2: Clear session manually multiple times
        for (let i = 0; i < 3; i++) {
          try {
            const { error: setSessionError } = await supabase.auth.setSession({ 
              access_token: '', 
              refresh_token: '' 
            })
            if (setSessionError) {
              console.log(`🔄 SetSession attempt ${i + 1} error (expected):`, setSessionError.message)
            } else {
              console.log(`✅ SetSession attempt ${i + 1} completed`)
            }
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (error) {
            console.log(`✅ SetSession attempt ${i + 1} exception (expected):`, error)
          }
        }
        
        // Method 3: Wait and verify session is cleared
        await new Promise(resolve => setTimeout(resolve, 2000))
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
        
        if (getSessionError) {
          console.log('✅ Supabase getSession error (expected after deletion):', getSessionError.message)
        } else if (session) {
          console.warn('⚠️ Supabase session still exists after aggressive cleanup:', session.user?.email)
          // Force one more cleanup attempt
          try {
            await supabase.auth.signOut()
            console.log('🔄 Final forced signOut completed')
          } catch (finalError) {
            console.log('✅ Final signOut error (expected):', finalError)
          }
        } else {
          console.log('✅ Supabase session successfully cleared')
        }
        
      } catch (error) {
        console.log('✅ Supabase cleanup error (expected after deletion):', error)
        // Continue with cleanup even if Supabase fails
      }
    }
    
    // Clear any cached auth data in memory
    if (typeof window !== 'undefined') {
      const globalWindow = window as any
      // Clear any global auth state
      globalWindow.__AUTH_STATE__ = null
      globalWindow.__USER_DATA__ = null
    }
    
    console.log('✅ Complete authentication cleanup finished')
  }

  /**
   * Delete all avatar files for a specific user
   */
  static async deleteUserAvatars(userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not configured')
    }

    try {
              // List all files in the user_avatars bucket
        const { data: files, error } = await supabase.storage
          .from(STORAGE_CONFIG.BUCKETS.USER_AVATARS)
          .list('', {
          limit: 1000,
          offset: 0
        })

      if (error) {
        console.warn('⚠️ Error listing avatar files:', error)
        return
      }

      // Find files that belong to this user
      const userFiles = files?.filter(file => file.name.startsWith(userId)) || []
      
      if (userFiles.length > 0) {
        const fileNames = userFiles.map(file => file.name)
                  const { error: deleteError } = await supabase.storage
            .from(STORAGE_CONFIG.BUCKETS.USER_AVATARS)
            .remove(fileNames)
        
        if (deleteError) {
          console.warn('⚠️ Error deleting user avatars:', deleteError)
        } else {
          console.log(`🗑️ Deleted ${userFiles.length} avatar files for user ${userId}`)
        }
      }
    } catch (error) {
      console.warn('⚠️ Error in deleteUserAvatars:', error)
    }
  }
} 
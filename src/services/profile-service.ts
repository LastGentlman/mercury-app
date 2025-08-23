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
import type { AuthUser, AuthProvider } from '../types/auth.ts'

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
   * Get current user's profile data
   */
  static async getProfile(): Promise<ProfileData | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Get profile from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      // If profile doesn't exist, create one
      if (!profile) {
        const authUser: AuthUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          avatar_url: user.user_metadata?.avatar_url,
          provider: (user.app_metadata?.provider as AuthProvider) || 'email'
        }
        return await this.createProfile(authUser)
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
        updatedAt: new Date().toISOString()
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
   * Upload avatar image
   */
  static async uploadAvatar(file: File): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client not configured')
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return publicUrl
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
        throw new Error('No authenticated user')
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
        updatedAt: new Date().toISOString()
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
    if (!supabase) {
      throw new Error('Supabase client not configured')
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    // Delete profile data
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      throw profileError
    }

    // Delete user account
    const { error: userError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (userError) {
      throw userError
    }
  }
} 
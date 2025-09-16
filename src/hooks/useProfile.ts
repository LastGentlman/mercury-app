/**
 * Profile Management Hook
 * 
 * Provides a clean API for profile operations including:
 * - Fetching profile data
 * - Updating profile information
 * - Avatar upload
 * - Settings management
 * - Profile statistics
 */

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ProfileService, type UpdateProfileRequest, type UserSettings } from '../services/profile-service.ts'

export function useProfile() {
  const queryClient = useQueryClient()

  // Delete account mutation - defined first to use in query enabled conditions
  const deleteAccount = useMutation({
    mutationFn: ProfileService.deleteAccount,
    onSuccess: async () => {
      console.log('🧹 Starting post-deletion cleanup...')
      
      // Clear all React Query cache
      queryClient.clear()
      
      // The complete cleanup (including Service Worker, cookies, etc.) is handled by ProfileService
      // The redirect is also handled by ProfileService using window.location.replace
      console.log('✅ Account deleted successfully and cleanup completed')
    },
    onError: (error) => {
      console.error('❌ Error deleting account:', error)
    }
  })

  // Fetch profile data
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['profile'],
    queryFn: ProfileService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    // 🔒 NEW: Disable query during account deletion to prevent auth errors
    enabled: !deleteAccount.isPending
  })

  // Fetch profile stats
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: ProfileService.getProfileStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    // 🔒 NEW: Disable query during account deletion to prevent auth errors
    enabled: !deleteAccount.isPending
  })

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: UpdateProfileRequest) => {
      return await ProfileService.updateProfile(updates)
    },
    onSuccess: (updatedProfile) => {
      // Update cache
      queryClient.setQueryData(['profile'], updatedProfile)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
      
      console.log('✅ Profile updated successfully')
    },
    onError: (error) => {
      console.error('❌ Error updating profile:', error)
    }
  })

  // Upload avatar mutation
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const result = await ProfileService.uploadAvatar(file)
      return {
        profile: await ProfileService.updateProfile({ avatar_url: result.avatarUrl }),
        optimizationStats: result.optimizationStats
      }
    },
    onSuccess: (result) => {
      // Update cache
      queryClient.setQueryData(['profile'], result.profile)
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
      
      console.log('✅ Avatar uploaded successfully')
    },
    onError: (error) => {
      console.error('❌ Error uploading avatar:', error)
    }
  })

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      await ProfileService.updateSettings(settings)
      return await ProfileService.getProfile()
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile)
      console.log('✅ Settings updated successfully')
    },
    onError: (error) => {
      console.error('❌ Error updating settings:', error)
    }
  })


  // Utility functions
  const refreshProfile = useCallback(async () => {
    const result = await refetchProfile()
    return result.data
  }, [refetchProfile])

  return {
    // Data
    profile: profile || null,
    stats: stats || null,
    
    // Loading states
    isLoading: isProfileLoading || isStatsLoading,
    isProfileLoading,
    isStatsLoading,
    isUpdating: updateProfile.isPending,
    isUploading: uploadAvatar.isPending,
    isUpdatingSettings: updateSettings.isPending,
    isDeleting: deleteAccount.isPending,
    
    // Errors
    profileError,
    statsError,
    
    // Mutations
    updateProfile,
    uploadAvatar,
    updateSettings,
    deleteAccount,
    
    // Utilities
    refreshProfile
  }
} 
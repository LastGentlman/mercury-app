/**
 * Supabase client configuration for frontend
 * Centralized supabase client instance
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../env.ts'

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? '✅ Configured' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Configured' : '❌ Missing',
  env: import.meta.env.MODE
})

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

if (!supabase) {
  console.warn('⚠️ Supabase no está configurado. Algunas funciones no funcionarán.')
} else {
  // Add global debug functions for testing
  {
    (globalThis as unknown as { debugSupabaseStorage: () => Promise<boolean> }).debugSupabaseStorage = async () => {
      try {
        console.log('🔍 Debugging Supabase Storage...')
        console.log('🔧 Supabase configured:', !!supabase)
        
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
        
        // Try to list buckets
        console.log('📦 Attempting to list buckets...')
        const { data: buckets, error } = await supabase.storage.listBuckets()
        
        if (error) {
          console.error('❌ Error listing buckets:', error)
          console.error('Error details:', {
            message: error.message,
            name: error.name
          })
          return false
        }
        
        console.log('📦 Available buckets:', buckets?.map(b => b.name) || [])
        
        const avatarsBucket = buckets?.find(bucket => bucket.name === 'user_avatars')
        
        if (avatarsBucket) {
          console.log('✅ User avatars bucket found:', avatarsBucket)
          
          // Test upload
          const testBlob = new Blob(['test'], { type: 'text/plain' })
          const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user_avatars')
            .upload(`test-${Date.now()}.txt`, testFile, { upsert: true })
          
          if (uploadError) {
            console.error('❌ Upload test failed:', uploadError)
            return false
          } else {
            console.log('✅ Upload test successful')
            
            // Clean up
            await supabase.storage.from('user_avatars').remove([uploadData.path])
            console.log('🧹 Test file cleaned up')
            return true
          }
        } else {
          console.log('❌ User avatars bucket not found')
          return false
        }
      } catch (error) {
        console.error('❌ Debug failed:', error)
        return false
      }
    }
    
    // Add direct bucket test function
    (globalThis as unknown as { testDirectBucketAccess: () => Promise<boolean> }).testDirectBucketAccess = async () => {
      try {
        console.log('🔍 Testing direct bucket access...')
        
        // Try to access the bucket directly without listing
        const testBlob = new Blob(['test'], { type: 'text/plain' })
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user_avatars')
          .upload(`direct-test-${Date.now()}.txt`, testFile, { upsert: true })
        
        if (uploadError) {
          console.error('❌ Direct upload failed:', uploadError)
          return false
        } else {
          console.log('✅ Direct upload successful:', uploadData)
          
          // Clean up
          await supabase.storage.from('user_avatars').remove([uploadData.path])
          console.log('🧹 Test file cleaned up')
          return true
        }
      } catch (error) {
        console.error('❌ Direct test failed:', error)
        return false
      }
    }
    
    console.log('🔧 Debug functions available: debugSupabaseStorage() and testDirectBucketAccess()')
    
    // Add image optimization test functions
    ;(globalThis as any).testImageOptimization = async () => {
      const { testImageOptimization } = await import('./imageOptimization.test.ts')
      return testImageOptimization()
    }
    
    ;(globalThis as any).testOptimizationOptions = async () => {
      const { testOptimizationOptions } = await import('./imageOptimization.test.ts')
      return testOptimizationOptions()
    }
    
    console.log('🔧 Image optimization test functions available: testImageOptimization() and testOptimizationOptions()')
  }
} 
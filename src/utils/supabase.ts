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
  // Add global debug function for development
  if (import.meta.env.DEV) {
    (globalThis as unknown as { debugSupabaseStorage: () => Promise<boolean> }).debugSupabaseStorage = async () => {
      try {
        console.log('🔍 Debugging Supabase Storage...')
        console.log('🔧 Supabase configured:', !!supabase)
        
        const { data: buckets, error } = await supabase.storage.listBuckets()
        
        if (error) {
          console.error('❌ Error listing buckets:', error)
          return false
        }
        
        console.log('📦 Available buckets:', buckets?.map(b => b.name) || [])
        
        const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars')
        
        if (avatarsBucket) {
          console.log('✅ Avatars bucket found:', avatarsBucket)
          
          // Test upload
          const testBlob = new Blob(['test'], { type: 'text/plain' })
          const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(`test-${Date.now()}.txt`, testFile, { upsert: true })
          
          if (uploadError) {
            console.error('❌ Upload test failed:', uploadError)
            return false
          } else {
            console.log('✅ Upload test successful')
            
            // Clean up
            await supabase.storage.from('avatars').remove([uploadData.path])
            console.log('🧹 Test file cleaned up')
            return true
          }
        } else {
          console.log('❌ Avatars bucket not found')
          return false
        }
      } catch (error) {
        console.error('❌ Debug failed:', error)
        return false
      }
    }
    
    console.log('🔧 Debug function available: debugSupabaseStorage()')
  }
} 
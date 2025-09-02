/**
 * Supabase Storage Setup Script
 * 
 * This script helps set up the user_avatars storage bucket in Supabase.
 * Run this script to ensure your storage is properly configured.
 * 
 * ✅ UPDATED: Now uses 'user_avatars' bucket name to match the application
 */

import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  Deno.exit(1)
}

console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? '✅ Configured' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Configured' : '❌ Missing',
  env: import.meta.env.MODE
})

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupStorage() {
  try {
    console.log('🔧 Setting up Supabase storage...')
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }
    
    console.log('📦 Existing buckets:', buckets?.map(b => b.name) || [])
    
    // ✅ UPDATED: Check for user_avatars bucket (matches application code)
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'user_avatars')
    
    if (avatarsBucket) {
      console.log('✅ User avatars bucket already exists')
      console.log('Bucket details:', avatarsBucket)
    } else {
      console.log('⚠️ User avatars bucket not found')
      console.log('You need to create the "user_avatars" bucket in your Supabase dashboard:')
      console.log('1. Go to your Supabase project dashboard')
      console.log('2. Navigate to Storage > Buckets')
      console.log('3. Click "Create a new bucket"')
      console.log('4. Name it "user_avatars" (exact name required)')
      console.log('5. Set it as public (if you want public access)')
      console.log('6. Set up RLS policies for security')
      console.log('')
      console.log('📋 RLS Policy Example:')
      console.log('CREATE POLICY "Users can upload their own avatars" ON storage.objects')
      console.log('FOR INSERT WITH CHECK (bucket_id = \'user_avatars\' AND auth.uid()::text = (storage.foldername(name))[1]);')
    }
    
    // Test upload permissions (if bucket exists)
    if (avatarsBucket) {
      console.log('🧪 Testing upload permissions...')
      
      // Create a test file
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user_avatars')
        .upload(`test-${Date.now()}.txt`, testFile, {
          upsert: true
        })
      
      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError)
        console.log('This might be due to:')
        console.log('- Missing RLS policies')
        console.log('- Incorrect bucket permissions')
        console.log('- Authentication issues')
        console.log('')
        console.log('🔧 Troubleshooting:')
        console.log('1. Check if you\'re authenticated: supabase.auth.getUser()')
        console.log('2. Verify RLS policies are set correctly')
        console.log('3. Ensure bucket permissions allow authenticated uploads')
      } else {
        console.log('✅ Upload test successful')
        
        // Clean up test file
        await supabase.storage
          .from('user_avatars')
          .remove([uploadData.path])
        
        console.log('🧹 Test file cleaned up')
      }
    }
    
    // ✅ NEW: Test authentication status
    console.log('🔐 Testing authentication status...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Authentication error:', authError)
      console.log('⚠️ You may need to sign in to test storage operations')
    } else if (user) {
      console.log('✅ Authenticated as:', user.email)
      console.log('👤 User ID:', user.id)
    } else {
      console.log('ℹ️ Not authenticated - some storage operations may fail')
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run setup
setupStorage() 
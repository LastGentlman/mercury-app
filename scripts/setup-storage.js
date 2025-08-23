/**
 * Supabase Storage Setup Script
 * 
 * This script helps set up the avatars storage bucket in Supabase.
 * Run this script to ensure your storage is properly configured.
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
    
    // Check if avatars bucket exists
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars')
    
    if (avatarsBucket) {
      console.log('✅ Avatars bucket already exists')
      console.log('Bucket details:', avatarsBucket)
    } else {
      console.log('⚠️ Avatars bucket not found')
      console.log('You need to create the "avatars" bucket in your Supabase dashboard:')
      console.log('1. Go to your Supabase project dashboard')
      console.log('2. Navigate to Storage > Buckets')
      console.log('3. Click "Create a new bucket"')
      console.log('4. Name it "avatars"')
      console.log('5. Set it as public (if you want public access)')
      console.log('6. Set up RLS policies for security')
    }
    
    // Test upload permissions (if bucket exists)
    if (avatarsBucket) {
      console.log('🧪 Testing upload permissions...')
      
      // Create a test file
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`test-${Date.now()}.txt`, testFile, {
          upsert: true
        })
      
      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError)
        console.log('This might be due to:')
        console.log('- Missing RLS policies')
        console.log('- Incorrect bucket permissions')
        console.log('- Authentication issues')
      } else {
        console.log('✅ Upload test successful')
        
        // Clean up test file
        await supabase.storage
          .from('avatars')
          .remove([uploadData.path])
        
        console.log('🧹 Test file cleaned up')
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run setup
setupStorage() 
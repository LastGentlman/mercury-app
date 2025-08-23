# Supabase Storage Setup Guide

## Problem
You're getting a 400 error when trying to upload avatars. This is likely due to missing or incorrectly configured Supabase storage.

## Solution

### 1. Create the Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **Create a new bucket**
5. Set the bucket name to: `avatars`
6. Make it **public** (so avatars can be viewed)
7. Click **Create bucket**

### 2. Set Up RLS Policies

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the following SQL commands:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Anyone can view avatars (public read access)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

### 3. Test the Setup

Run the setup script to verify everything is working:

```bash
cd mercury-app
node scripts/setup-storage.js
```

### 4. Alternative: Manual Testing

If the script doesn't work, you can test manually:

1. Go to **Storage** > **avatars** bucket
2. Try uploading a test image
3. Check if you can view the uploaded file

### 5. Common Issues

#### Issue: "Bucket not found"
- **Solution**: Create the `avatars` bucket as described above

#### Issue: "Permission denied"
- **Solution**: Run the RLS policies SQL commands

#### Issue: "Authentication failed"
- **Solution**: Check that your environment variables are correct:
  ```
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

#### Issue: "File too large"
- **Solution**: The current limit is 2MB. You can increase this in your Supabase dashboard under Storage settings.

### 6. Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 7. Verification

After setup, you should be able to:
- ✅ Upload avatar images
- ✅ View uploaded avatars
- ✅ See avatars from Google/Facebook OAuth
- ✅ Have proper fallback to generated avatars

## Troubleshooting

If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase project is active and not paused
3. Ensure you have the correct environment variables
4. Try the setup script to diagnose the issue
5. Check the Supabase logs in your dashboard

## Support

If you continue to have issues, please:
1. Check the browser console for error messages
2. Run the setup script and share the output
3. Verify your Supabase configuration 
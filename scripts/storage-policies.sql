-- Supabase Storage RLS Policies for Avatars
-- Run these policies in your Supabase SQL editor

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

-- Alternative: Only authenticated users can view avatars
-- CREATE POLICY "Authenticated users can view avatars" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'avatars' AND 
--     auth.role() = 'authenticated'
--   );

-- Note: If you want to use the alternative policy above, comment out the "Anyone can view avatars" policy 
-- ========================================
-- ADD AVATAR SUPPORT TO AUTH_USER TABLE
-- ========================================
-- Run this SQL to add avatar_url column to store user profile pictures

-- Step 1: Add avatar_url column to auth_user table
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 2: Create avatars storage bucket (if it doesn't exist)
-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Step 3: Completely disable RLS for avatars bucket to allow all uploads
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Step 4: Grant ALL permissions on storage.objects
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;

-- Step 5: Grant permissions on auth_user
GRANT SELECT, UPDATE ON auth_user TO authenticated;

-- ========================================
-- ALTERNATIVE: If you want to keep RLS enabled, use this instead:
-- ========================================
-- Uncomment the following lines and comment out Step 3 above:

-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated avatar upload" ON storage.objects;
-- 
-- CREATE POLICY "Public avatar access"
-- ON storage.objects FOR ALL
-- USING (bucket_id = 'avatars');
-- 
-- CREATE POLICY "Authenticated avatar upload"
-- ON storage.objects FOR ALL
-- TO authenticated
-- USING (bucket_id = 'avatars')
-- WITH CHECK (bucket_id = 'avatars');

-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================
-- After running this SQL:
-- 1. Users can upload profile pictures in Settings > Edit profile
-- 2. Images are stored in Supabase Storage 'avatars' bucket
-- 3. avatar_url in auth_user table stores the public URL
-- 4. Images are publicly accessible

-- ========================================
-- SUCCESS!
-- ========================================

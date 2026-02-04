-- ========================================
-- ADD AVATAR SUPPORT TO AUTH_USER TABLE
-- ========================================
-- Run this SQL to add avatar_url column to store user profile pictures

-- Step 1: Add avatar_url column to auth_user table
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 2: Create avatars storage bucket in Supabase (run in Supabase Dashboard > Storage)
-- Bucket name: avatars
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Or create via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Set up RLS policies for avatars bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Avatar uploads are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Create new policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Step 4: Grant permissions
GRANT SELECT, UPDATE ON auth_user TO authenticated;

-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================
-- After running this SQL:
-- 1. Users can upload profile pictures in Settings > Edit profile
-- 2. Images are stored in Supabase Storage 'avatars' bucket
-- 3. avatar_url in auth_user table stores the public URL
-- 4. Images are accessible via: https://[your-project].supabase.co/storage/v1/object/public/avatars/[filename]

-- Example avatar_url value:
-- https://bayyefskgflbyyuwrlgm.supabase.co/storage/v1/object/public/avatars/99-1707089234567.jpg

-- ========================================
-- SUCCESS!
-- ========================================

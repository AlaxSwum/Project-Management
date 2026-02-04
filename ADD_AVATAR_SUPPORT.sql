-- ========================================
-- ADD AVATAR SUPPORT TO AUTH_USER TABLE
-- ========================================

-- STEP 1: Run this SQL in Supabase SQL Editor
-- ========================================
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;
GRANT SELECT, UPDATE ON auth_user TO authenticated;

-- ========================================
-- STEP 2: Create Storage Bucket via Supabase Dashboard
-- ========================================
-- Go to: Supabase Dashboard > Storage > Create a new bucket
-- 
-- Settings:
-- - Name: avatars
-- - Public bucket: YES (toggle ON)
-- - File size limit: 5MB
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- - Restrict file upload size: 5242880 bytes
--
-- In the bucket settings, make sure "Public bucket" is enabled!
-- This allows files to be publicly accessible without authentication.
--
-- ========================================
-- ALTERNATIVE: Create bucket via SQL (if dashboard doesn't work)
-- ========================================
-- Only run this if you haven't created the bucket via dashboard:

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ========================================
-- STEP 3: Disable RLS on storage.objects (CRITICAL!)
-- ========================================
-- Run this in Supabase SQL Editor with POSTGRES role:
-- Note: You might need to contact Supabase support or use service role key

-- For now, use the Supabase Dashboard instead:
-- 1. Go to: Storage > avatars bucket
-- 2. Click "Policies" tab
-- 3. Click "New Policy" 
-- 4. Select "Get started quickly" > "Allow all operations"
-- 5. This will create policies that allow all operations

-- ========================================
-- SIMPLE WORKAROUND: Just make bucket public
-- ========================================
-- The easiest solution is to ensure the bucket is PUBLIC
-- This is set when you create it via dashboard or via the UPDATE above

UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- ========================================
-- SUCCESS!
-- ========================================
-- After completing the above:
-- 1. Users can upload profile pictures in Settings > Edit profile
-- 2. Images are stored in Supabase Storage 'avatars' bucket
-- 3. Images are publicly accessible
-- 4. avatar_url in auth_user table stores the public URL
-- ========================================

-- ========================================
-- ADD AVATAR SUPPORT TO AUTH_USER TABLE
-- ========================================
-- Simple solution: Store avatars as base64 in database
-- No Supabase Storage needed - avoids all RLS issues!

-- Add avatar_url column to store base64 image data
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Grant permissions for users to update their profile
GRANT SELECT, UPDATE ON auth_user TO authenticated;

-- ========================================
-- HOW IT WORKS
-- ========================================
-- 1. Users upload images in Settings > Edit profile
-- 2. Images are converted to base64 format
-- 3. Base64 string is stored directly in avatar_url column
-- 4. Images display using: <img src="data:image/jpeg;base64,..." />
-- 5. No storage bucket or file uploads needed!

-- ========================================
-- BENEFITS
-- ========================================
-- ✅ No Supabase Storage configuration needed
-- ✅ No RLS policy issues
-- ✅ Works immediately after running this SQL
-- ✅ Images stored with user data in database
-- ✅ Simple and reliable

-- ========================================
-- SUCCESS!
-- ========================================
-- After running this SQL:
-- - Go to Settings > Edit profile
-- - Click "Upload new image"
-- - Select any image (max 5MB)
-- - Avatar will be saved immediately!
-- ========================================

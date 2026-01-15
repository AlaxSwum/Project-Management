-- Migration: Add Graphic Link, Video Link, and Content Link columns to content_posts
-- Date: 2026-01-11
-- Description: Add drive link fields for graphic, video, and content assets

-- Add new columns for asset links
ALTER TABLE content_posts 
ADD COLUMN IF NOT EXISTS graphic_link TEXT,
ADD COLUMN IF NOT EXISTS video_link TEXT,
ADD COLUMN IF NOT EXISTS content_link TEXT;

-- Add comments for documentation
COMMENT ON COLUMN content_posts.graphic_link IS 'Google Drive link to graphic/design assets';
COMMENT ON COLUMN content_posts.video_link IS 'Google Drive link to video assets';
COMMENT ON COLUMN content_posts.content_link IS 'Google Drive link to content/copy assets';

-- Create index for faster lookups (optional, for reporting)
CREATE INDEX IF NOT EXISTS idx_content_posts_graphic_link ON content_posts(graphic_link) WHERE graphic_link IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_posts_video_link ON content_posts(video_link) WHERE video_link IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_posts_content_link ON content_posts(content_link) WHERE content_link IS NOT NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON content_posts TO authenticated;
GRANT SELECT ON content_posts TO anon;


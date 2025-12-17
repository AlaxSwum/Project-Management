-- Content Calendar Business System - Enhanced Version
-- Run this in Supabase SQL Editor

-- Drop old tables if they exist (to start fresh)
DROP TABLE IF EXISTS content_post_platforms CASCADE;
DROP TABLE IF EXISTS content_posts CASCADE;
DROP TABLE IF EXISTS content_businesses CASCADE;

-- Create businesses table
CREATE TABLE content_businesses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content posts table (main post info)
CREATE TABLE content_posts (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES content_businesses(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL DEFAULT 'Post',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  scheduled_date DATE NOT NULL,
  published_date TIMESTAMP WITH TIME ZONE,
  assigned_to TEXT,
  media_buying_budget DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create per-platform metrics table (each post can have multiple platforms with individual metrics)
CREATE TABLE content_post_platforms (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  media_spend DECIMAL(10,2) DEFAULT 0,
  permalink TEXT,
  platform_status VARCHAR(50) DEFAULT 'pending',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_businesses_created_by ON content_businesses(created_by);
CREATE INDEX idx_content_posts_business_id ON content_posts(business_id);
CREATE INDEX idx_content_posts_scheduled_date ON content_posts(scheduled_date);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_assigned_to ON content_posts(assigned_to);
CREATE INDEX idx_content_post_platforms_post_id ON content_post_platforms(post_id);
CREATE INDEX idx_content_post_platforms_platform ON content_post_platforms(platform);

-- Enable RLS
ALTER TABLE content_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_platforms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
DROP POLICY IF EXISTS "Users can view all businesses" ON content_businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON content_businesses;
DROP POLICY IF EXISTS "Users can update businesses" ON content_businesses;
DROP POLICY IF EXISTS "Users can delete businesses" ON content_businesses;

CREATE POLICY "Users can view all businesses" ON content_businesses FOR SELECT USING (true);
CREATE POLICY "Users can create businesses" ON content_businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update businesses" ON content_businesses FOR UPDATE USING (true);
CREATE POLICY "Users can delete businesses" ON content_businesses FOR DELETE USING (true);

-- RLS Policies for posts
DROP POLICY IF EXISTS "Users can view all posts" ON content_posts;
DROP POLICY IF EXISTS "Users can create posts" ON content_posts;
DROP POLICY IF EXISTS "Users can update posts" ON content_posts;
DROP POLICY IF EXISTS "Users can delete posts" ON content_posts;

CREATE POLICY "Users can view all posts" ON content_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON content_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update posts" ON content_posts FOR UPDATE USING (true);
CREATE POLICY "Users can delete posts" ON content_posts FOR DELETE USING (true);

-- RLS Policies for post platforms
DROP POLICY IF EXISTS "Users can view all post platforms" ON content_post_platforms;
DROP POLICY IF EXISTS "Users can create post platforms" ON content_post_platforms;
DROP POLICY IF EXISTS "Users can update post platforms" ON content_post_platforms;
DROP POLICY IF EXISTS "Users can delete post platforms" ON content_post_platforms;

CREATE POLICY "Users can view all post platforms" ON content_post_platforms FOR SELECT USING (true);
CREATE POLICY "Users can create post platforms" ON content_post_platforms FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update post platforms" ON content_post_platforms FOR UPDATE USING (true);
CREATE POLICY "Users can delete post platforms" ON content_post_platforms FOR DELETE USING (true);

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS update_content_businesses_updated_at ON content_businesses;
CREATE TRIGGER update_content_businesses_updated_at BEFORE UPDATE ON content_businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_posts_updated_at ON content_posts;
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_post_platforms_updated_at ON content_post_platforms;
CREATE TRIGGER update_content_post_platforms_updated_at BEFORE UPDATE ON content_post_platforms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify
SELECT 'Tables created successfully!' AS status;

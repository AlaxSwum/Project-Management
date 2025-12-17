-- Content Calendar Business System
-- Run this in Supabase SQL Editor

-- Drop old tables if they exist (to start fresh)
DROP TABLE IF EXISTS content_posts CASCADE;
DROP TABLE IF EXISTS content_businesses CASCADE;

-- Create businesses table
CREATE TABLE content_businesses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content posts table
CREATE TABLE content_posts (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES content_businesses(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  platform VARCHAR(50) NOT NULL DEFAULT 'Facebook',
  content_type VARCHAR(50) NOT NULL DEFAULT 'Post',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  scheduled_date DATE NOT NULL,
  published_date TIMESTAMP WITH TIME ZONE,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_businesses_created_by ON content_businesses(created_by);
CREATE INDEX idx_content_posts_business_id ON content_posts(business_id);
CREATE INDEX idx_content_posts_scheduled_date ON content_posts(scheduled_date);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_platform ON content_posts(platform);

-- Enable RLS
ALTER TABLE content_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Users can view all businesses" ON content_businesses
  FOR SELECT USING (true);

CREATE POLICY "Users can create businesses" ON content_businesses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their businesses" ON content_businesses
  FOR UPDATE USING (created_by = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their businesses" ON content_businesses
  FOR DELETE USING (created_by = auth.uid() OR auth.uid() IS NOT NULL);

-- RLS Policies for posts
CREATE POLICY "Users can view all posts" ON content_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON content_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update posts" ON content_posts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete posts" ON content_posts
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_content_businesses_updated_at ON content_businesses;
CREATE TRIGGER update_content_businesses_updated_at
  BEFORE UPDATE ON content_businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_posts_updated_at ON content_posts;
CREATE TRIGGER update_content_posts_updated_at
  BEFORE UPDATE ON content_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify tables created
SELECT 'Tables created successfully!' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('content_businesses', 'content_posts');

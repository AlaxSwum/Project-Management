-- Create content calendar table for Supabase
-- Run this in Supabase SQL Editor

-- Create content_calendar table
CREATE TABLE IF NOT EXISTS content_calendar (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL, -- Which date to post content
    content_type TEXT NOT NULL, -- Type of content (Video, Graphic, Post, etc.)
    category TEXT NOT NULL, -- Main theme/category
    social_media TEXT NOT NULL, -- Platform (Facebook, Instagram, TikTok, etc.)
    content_title TEXT NOT NULL, -- Title of the content
    assigned_to INTEGER[], -- Array of user IDs assigned to this content
    content_deadline DATE, -- When content should be ready
    graphic_deadline DATE, -- When graphics should be ready
    status TEXT DEFAULT 'planning', -- planning, in_progress, review, completed
    description TEXT, -- Additional details
    created_by_id INTEGER NOT NULL, -- References auth_user.id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    project_id INTEGER REFERENCES projects_project(id) ON DELETE SET NULL -- Optional project association
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_assigned_to ON content_calendar USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS idx_content_calendar_created_by ON content_calendar(created_by_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_social_media ON content_calendar(social_media);
CREATE INDEX IF NOT EXISTS idx_content_calendar_category ON content_calendar(category);
CREATE INDEX IF NOT EXISTS idx_content_calendar_content_deadline ON content_calendar(content_deadline);
CREATE INDEX IF NOT EXISTS idx_content_calendar_graphic_deadline ON content_calendar(graphic_deadline);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_content_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_content_calendar_updated_at ON content_calendar;
CREATE TRIGGER trigger_update_content_calendar_updated_at
    BEFORE UPDATE ON content_calendar
    FOR EACH ROW
    EXECUTE FUNCTION update_content_calendar_updated_at();

-- Create content calendar members table for access control
CREATE TABLE IF NOT EXISTS content_calendar_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- References auth_user.id
    role TEXT DEFAULT 'member', -- member, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for content calendar members
CREATE INDEX IF NOT EXISTS idx_content_calendar_members_user_id ON content_calendar_members(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_members_role ON content_calendar_members(role);

-- Create updated_at trigger for members table
DROP TRIGGER IF EXISTS trigger_update_content_calendar_members_updated_at ON content_calendar_members;
CREATE TRIGGER trigger_update_content_calendar_members_updated_at
    BEFORE UPDATE ON content_calendar_members
    FOR EACH ROW
    EXECUTE FUNCTION update_content_calendar_updated_at();

-- Insert sample data (optional)
-- You can remove this section if you don't want sample data
INSERT INTO content_calendar_members (user_id, role) VALUES
(1, 'admin'), -- Assuming user ID 1 exists
(2, 'member') -- Assuming user ID 2 exists
ON CONFLICT (user_id) DO NOTHING;

-- Sample content calendar entries (remove if not needed)
INSERT INTO content_calendar (
    date, content_type, category, social_media, content_title, 
    assigned_to, content_deadline, graphic_deadline, created_by_id
) VALUES
('2025-07-01', 'Video Content', 'Case Study', 'Facebook', 'Case Study (Why Beginner should start with Python)', ARRAY[1], '2025-06-28', '2025-06-25', 1),
('2025-07-02', 'Content', 'Class Announcement', 'Facebook', 'Class Announcement (UI/UX)', ARRAY[2], '2025-06-30', '2025-06-28', 1),
('2025-07-04', 'Video Content', 'Knowledge Sharing', 'Facebook', 'Video Content for UI/UX (What is UI/UX and benefits of using UI/UX in company)', ARRAY[1], '2025-07-01', '2025-06-29', 1)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE content_calendar IS 'Content calendar for managing social media posts and content planning';
COMMENT ON TABLE content_calendar_members IS 'Access control for content calendar - defines who can view and manage content';
COMMENT ON COLUMN content_calendar.assigned_to IS 'Array of user IDs assigned to work on this content';
COMMENT ON COLUMN content_calendar.date IS 'Target date when content should be posted on social media';
COMMENT ON COLUMN content_calendar.content_deadline IS 'Deadline for content creation';
COMMENT ON COLUMN content_calendar.graphic_deadline IS 'Deadline for graphics/design work';

-- Example usage:
-- To add a user to content calendar access:
-- INSERT INTO content_calendar_members (user_id, role) VALUES (3, 'member');
-- 
-- To create new content:
-- INSERT INTO content_calendar (date, content_type, category, social_media, content_title, assigned_to, created_by_id)
-- VALUES ('2025-07-05', 'Post', 'Engagement', 'Instagram', 'Daily Motivation Post', ARRAY[2], 1); 
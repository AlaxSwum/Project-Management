-- =====================================================
-- CONTENT CALENDAR COMPLETE DATABASE SETUP
-- =====================================================
-- Run this script in Supabase SQL Editor to set up
-- all tables for Content Calendar with folder functionality
-- =====================================================

-- 1. Content Calendar Folders Table
CREATE TABLE IF NOT EXISTS content_calendar_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    folder_type VARCHAR(50) DEFAULT 'month',
    color VARCHAR(7) DEFAULT '#ffffff',
    parent_folder_id INTEGER REFERENCES content_calendar_folders(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Content Calendar Items Table
CREATE TABLE IF NOT EXISTS content_calendar (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    social_media VARCHAR(50),
    content_title TEXT NOT NULL,
    assigned_to INTEGER[] DEFAULT '{}',
    content_deadline DATE,
    graphic_deadline DATE,
    status VARCHAR(20) DEFAULT 'planning',
    description TEXT,
    folder_id INTEGER REFERENCES content_calendar_folders(id),
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Content Calendar Members Table
CREATE TABLE IF NOT EXISTS content_calendar_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    role VARCHAR(20) DEFAULT 'member',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by INTEGER REFERENCES auth_user(id)
);

-- 4. Content Calendar Folder Members Table (Optional - for granular folder permissions)
CREATE TABLE IF NOT EXISTS content_calendar_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES content_calendar_folders(id),
    user_id INTEGER REFERENCES auth_user(id),
    role VARCHAR(20) DEFAULT 'viewer',
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_manage_members BOOLEAN DEFAULT false,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Content Calendar Indexes
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder ON content_calendar(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_assignees ON content_calendar USING GIN (assigned_to);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);

-- Folder Indexes
CREATE INDEX IF NOT EXISTS idx_content_calendar_folders_parent ON content_calendar_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folders_type ON content_calendar_folders(folder_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folders_active ON content_calendar_folders(is_active);

-- Member Indexes
CREATE INDEX IF NOT EXISTS idx_content_calendar_members_user ON content_calendar_members(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder_members_folder ON content_calendar_folder_members(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder_members_user ON content_calendar_folder_members(user_id);

-- =====================================================
-- SAMPLE DATA - DEFAULT FOLDERS FOR 2025
-- =====================================================

-- Insert sample monthly folders for 2025
INSERT INTO content_calendar_folders (name, description, folder_type, sort_order, created_by_id) VALUES
('January 2025', 'Content for January 2025', 'month', 1, 1),
('February 2025', 'Content for February 2025', 'month', 2, 1),
('March 2025', 'Content for March 2025', 'month', 3, 1),
('April 2025', 'Content for April 2025', 'month', 4, 1),
('May 2025', 'Content for May 2025', 'month', 5, 1),
('June 2025', 'Content for June 2025', 'month', 6, 1),
('July 2025', 'Content for July 2025', 'month', 7, 1),
('August 2025', 'Content for August 2025', 'month', 8, 1),
('September 2025', 'Content for September 2025', 'month', 9, 1),
('October 2025', 'Content for October 2025', 'month', 10, 1),
('November 2025', 'Content for November 2025', 'month', 11, 1),
('December 2025', 'Content for December 2025', 'month', 12, 1)
ON CONFLICT DO NOTHING;

-- Insert sample campaign folders
INSERT INTO content_calendar_folders (name, description, folder_type, sort_order, created_by_id) VALUES
('Summer Campaign 2025', 'Summer marketing campaign content', 'campaign', 13, 1),
('Product Launch Q2', 'Product launch content for Q2 2025', 'campaign', 14, 1),
('Holiday Marketing', 'Holiday season marketing content', 'campaign', 15, 1)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE CONTENT ITEMS
-- =====================================================

-- Insert sample content items
INSERT INTO content_calendar (date, content_type, category, social_media, content_title, status, description, folder_id) VALUES
('2025-01-15', 'Article', 'Educational', 'LinkedIn', 'How to Start Your Business in 2025', 'planning', 'Comprehensive guide for new entrepreneurs', 
    (SELECT id FROM content_calendar_folders WHERE name = 'January 2025' LIMIT 1)),
('2025-01-20', 'Video', 'Marketing', 'Instagram', 'Behind the Scenes: Our Team', 'in_progress', 'Team introduction video for Instagram Reels', 
    (SELECT id FROM content_calendar_folders WHERE name = 'January 2025' LIMIT 1)),
('2025-02-01', 'Infographic', 'Educational', 'Facebook', 'Business Statistics 2025', 'planning', 'Data visualization of latest business trends', 
    (SELECT id FROM content_calendar_folders WHERE name = 'February 2025' LIMIT 1))
ON CONFLICT DO NOTHING;

-- =====================================================
-- AUTOMATIC ADMIN MEMBER SETUP
-- =====================================================

-- Add admin user as content calendar member (replace 1 with your actual user ID)
INSERT INTO content_calendar_members (user_id, role) VALUES (1, 'admin') ON CONFLICT DO NOTHING;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_content_calendar_updated_at 
    BEFORE UPDATE ON content_calendar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendar_folders_updated_at 
    BEFORE UPDATE ON content_calendar_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This will show in the query results
SELECT 
    'Content Calendar Setup Complete!' as status,
    (SELECT COUNT(*) FROM content_calendar_folders) as folders_created,
    (SELECT COUNT(*) FROM content_calendar) as sample_content_items,
    (SELECT COUNT(*) FROM content_calendar_members) as members_added; 
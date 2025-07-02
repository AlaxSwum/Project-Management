-- =====================================================
-- CLASSES (PR) COMPLETE DATABASE SETUP
-- =====================================================
-- Run this script in Supabase SQL Editor to set up
-- all tables for Classes with folder functionality
-- =====================================================

-- 1. Classes Folders Table
CREATE TABLE IF NOT EXISTS classes_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    folder_type VARCHAR(50) DEFAULT 'category',
    color VARCHAR(7) DEFAULT '#ffffff',
    parent_folder_id INTEGER REFERENCES classes_folders(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Classes Items Table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    class_title VARCHAR(255) NOT NULL,
    class_type VARCHAR(100) NOT NULL, -- 'PR Workshop', 'Media Training', 'Communication Skills', etc.
    target_audience VARCHAR(100), -- 'Executives', 'Marketing Team', 'Sales Team', etc.
    class_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration VARCHAR(50), -- '2 hours', '1 day', 'Half day'
    location VARCHAR(255), -- 'Conference Room A', 'Online', 'External Venue'
    instructor_name VARCHAR(255),
    instructor_bio TEXT,
    class_description TEXT,
    learning_objectives TEXT[], -- Array of learning objectives
    prerequisites TEXT,
    max_participants INTEGER DEFAULT 20,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'planning', -- 'planning', 'open_registration', 'full', 'in_progress', 'completed', 'cancelled'
    registration_deadline DATE,
    materials_needed TEXT,
    folder_id INTEGER REFERENCES classes_folders(id),
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Classes Members Table (Access Control)
CREATE TABLE IF NOT EXISTS classes_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    role VARCHAR(20) DEFAULT 'member',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by INTEGER REFERENCES auth_user(id),
    UNIQUE(user_id)
);

-- 4. Classes Participants Table (For tracking registrations)
CREATE TABLE IF NOT EXISTS classes_participants (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attendance_status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'attended', 'no_show', 'cancelled'
    completion_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    notes TEXT,
    UNIQUE(class_id, user_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Classes Indexes
CREATE INDEX IF NOT EXISTS idx_classes_date ON classes(class_date);
CREATE INDEX IF NOT EXISTS idx_classes_folder ON classes(folder_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_type ON classes(class_type);
CREATE INDEX IF NOT EXISTS idx_classes_target_audience ON classes(target_audience);

-- Folder Indexes
CREATE INDEX IF NOT EXISTS idx_classes_folders_parent ON classes_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_classes_folders_type ON classes_folders(folder_type);
CREATE INDEX IF NOT EXISTS idx_classes_folders_active ON classes_folders(is_active);

-- Member Indexes
CREATE INDEX IF NOT EXISTS idx_classes_members_user ON classes_members(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_participants_class ON classes_participants(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_participants_user ON classes_participants(user_id);

-- =====================================================
-- NO SAMPLE DATA - CLEAN SETUP
-- =====================================================
-- Tables are ready for use without any sample data

-- =====================================================
-- AUTOMATIC ADMIN MEMBER SETUP
-- =====================================================

-- Add admin user as classes member (replace 1 with your actual user ID)
INSERT INTO classes_members (user_id, role) VALUES (1, 'admin') ON CONFLICT (user_id) DO NOTHING;

-- Add all superusers to classes access automatically
INSERT INTO classes_members (user_id, role)
SELECT id, 'admin'
FROM auth_user 
WHERE is_superuser = true
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Add all staff to classes access automatically  
INSERT INTO classes_members (user_id, role)
SELECT id, 'admin'
FROM auth_user 
WHERE is_staff = true
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_classes_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW EXECUTE FUNCTION update_classes_updated_at_column();

CREATE TRIGGER update_classes_folders_updated_at 
    BEFORE UPDATE ON classes_folders 
    FOR EACH ROW EXECUTE FUNCTION update_classes_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (Permissive for now)
-- =====================================================

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_participants ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all authenticated users for now)
CREATE POLICY "classes_select_policy" ON classes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "classes_insert_policy" ON classes
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_update_policy" ON classes
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "classes_delete_policy" ON classes
    FOR DELETE TO authenticated USING (true);

-- Folders policies
CREATE POLICY "classes_folders_select_policy" ON classes_folders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "classes_folders_insert_policy" ON classes_folders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_folders_update_policy" ON classes_folders
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "classes_folders_delete_policy" ON classes_folders
    FOR DELETE TO authenticated USING (true);

-- Members policies
CREATE POLICY "classes_members_select_policy" ON classes_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "classes_members_insert_policy" ON classes_members
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_members_update_policy" ON classes_members
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "classes_members_delete_policy" ON classes_members
    FOR DELETE TO authenticated USING (true);

-- Participants policies
CREATE POLICY "classes_participants_select_policy" ON classes_participants
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "classes_participants_insert_policy" ON classes_participants
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_participants_update_policy" ON classes_participants
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "classes_participants_delete_policy" ON classes_participants
    FOR DELETE TO authenticated USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON classes_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON classes_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON classes_participants TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This will show in the query results
SELECT 
    'Classes Setup Complete!' as status,
    (SELECT COUNT(*) FROM classes_members) as admin_members_added; image.png
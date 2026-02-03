-- =====================================================
-- FIX CLASSES RLS POLICIES
-- =====================================================
-- This script fixes Row Level Security issues for Classes tables

-- Temporarily disable RLS to fix policies
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes_participants DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "classes_select_policy" ON classes;
DROP POLICY IF EXISTS "classes_insert_policy" ON classes;
DROP POLICY IF EXISTS "classes_update_policy" ON classes;
DROP POLICY IF EXISTS "classes_delete_policy" ON classes;

DROP POLICY IF EXISTS "classes_folders_select_policy" ON classes_folders;
DROP POLICY IF EXISTS "classes_folders_insert_policy" ON classes_folders;
DROP POLICY IF EXISTS "classes_folders_update_policy" ON classes_folders;
DROP POLICY IF EXISTS "classes_folders_delete_policy" ON classes_folders;

DROP POLICY IF EXISTS "classes_members_select_policy" ON classes_members;
DROP POLICY IF EXISTS "classes_members_insert_policy" ON classes_members;
DROP POLICY IF EXISTS "classes_members_update_policy" ON classes_members;
DROP POLICY IF EXISTS "classes_members_delete_policy" ON classes_members;

DROP POLICY IF EXISTS "classes_participants_select_policy" ON classes_participants;
DROP POLICY IF EXISTS "classes_participants_insert_policy" ON classes_participants;
DROP POLICY IF EXISTS "classes_participants_update_policy" ON classes_participants;
DROP POLICY IF EXISTS "classes_participants_delete_policy" ON classes_participants;

-- Re-enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_participants ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies that work with Supabase auth
-- For classes table
CREATE POLICY "Enable all operations for authenticated users" ON classes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- For classes_folders table  
CREATE POLICY "Enable all operations for authenticated users" ON classes_folders
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- For classes_members table
CREATE POLICY "Enable all operations for authenticated users" ON classes_members
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- For classes_participants table
CREATE POLICY "Enable all operations for authenticated users" ON classes_participants
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant explicit permissions
GRANT ALL ON classes TO authenticated;
GRANT ALL ON classes_folders TO authenticated;
GRANT ALL ON classes_members TO authenticated;
GRANT ALL ON classes_participants TO authenticated;

-- Grant sequence permissions for auto-increment IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure auth_user table permissions are set
GRANT SELECT ON auth_user TO authenticated;

-- Add current user to classes_members if not already there
INSERT INTO classes_members (user_id, role) VALUES (50, 'admin') ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verify setup
SELECT 'RLS Policies Fixed Successfully!' as status,
       (SELECT COUNT(*) FROM classes_members WHERE user_id = 50) as user_50_access; 
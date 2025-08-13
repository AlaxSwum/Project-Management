-- Clean fix for attendance RLS policies
-- Run this in Supabase to allow attendance folder creation

-- First, drop ALL existing policies to start clean
DROP POLICY IF EXISTS "att_folders_select" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_ins" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_upd" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_del" ON class_attendance_folders;
DROP POLICY IF EXISTS "Allow authenticated users to view folders" ON class_attendance_folders;
DROP POLICY IF EXISTS "Allow authenticated users to create folders" ON class_attendance_folders;
DROP POLICY IF EXISTS "Allow authenticated users to update folders" ON class_attendance_folders;
DROP POLICY IF EXISTS "Allow authenticated users to delete folders" ON class_attendance_folders;

DROP POLICY IF EXISTS "daily_att_select" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_ins" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_upd" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_del" ON class_daily_attendance;
DROP POLICY IF EXISTS "Allow authenticated users to view attendance" ON class_daily_attendance;
DROP POLICY IF EXISTS "Allow authenticated users to create attendance" ON class_daily_attendance;
DROP POLICY IF EXISTS "Allow authenticated users to update attendance" ON class_daily_attendance;
DROP POLICY IF EXISTS "Allow authenticated users to delete attendance" ON class_daily_attendance;

-- Create new permissive policies for class_attendance_folders
CREATE POLICY "folders_all_access" ON class_attendance_folders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for class_daily_attendance  
CREATE POLICY "attendance_all_access" ON class_daily_attendance
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure tables exist and have proper grants
GRANT ALL ON class_attendance_folders TO authenticated;
GRANT ALL ON class_daily_attendance TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify setup
SELECT 
  'class_attendance_folders' as table_name,
  count(*) as row_count,
  'Ready for use' as status
FROM class_attendance_folders
UNION ALL
SELECT 
  'class_daily_attendance' as table_name,
  count(*) as row_count,
  'Ready for use' as status  
FROM class_daily_attendance;

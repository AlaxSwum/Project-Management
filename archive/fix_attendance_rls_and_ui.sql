-- Fix RLS policies for attendance tables to be more permissive
-- Run this in Supabase to allow instructors to create attendance

-- Drop and recreate simpler policies for class_attendance_folders
DROP POLICY IF EXISTS "att_folders_select" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_ins" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_upd" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_del" ON class_attendance_folders;

-- Simple permissive policies for authenticated users
CREATE POLICY "Allow authenticated users to view folders" ON class_attendance_folders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create folders" ON class_attendance_folders
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update folders" ON class_attendance_folders
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete folders" ON class_attendance_folders
  FOR DELETE TO authenticated
  USING (true);

-- Drop and recreate simpler policies for class_daily_attendance
DROP POLICY IF EXISTS "daily_att_select" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_ins" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_upd" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_del" ON class_daily_attendance;

-- Simple permissive policies for authenticated users
CREATE POLICY "Allow authenticated users to view attendance" ON class_daily_attendance
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create attendance" ON class_daily_attendance
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update attendance" ON class_daily_attendance
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete attendance" ON class_daily_attendance
  FOR DELETE TO authenticated
  USING (true);

-- Grant all permissions explicitly
GRANT ALL ON class_attendance_folders TO authenticated;
GRANT ALL ON class_daily_attendance TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify tables exist
SELECT 'class_attendance_folders created' as status, count(*) as rows FROM class_attendance_folders;
SELECT 'class_daily_attendance created' as status, count(*) as rows FROM class_daily_attendance;

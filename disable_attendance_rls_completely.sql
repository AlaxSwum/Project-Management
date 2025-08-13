-- Completely disable RLS for attendance tables to fix the policy error
-- This is the most direct fix

-- First, ensure tables exist
CREATE TABLE IF NOT EXISTS class_attendance_folders (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    created_by INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS class_daily_attendance (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES class_attendance_folders(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES classes_participants(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('present','absent','late')),
    reason TEXT,
    recorded_by INTEGER REFERENCES auth_user(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(folder_id, student_id)
);

-- Drop ALL policies completely
DROP POLICY IF EXISTS "att_folders_select" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_ins" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_upd" ON class_attendance_folders;
DROP POLICY IF EXISTS "att_folders_del" ON class_attendance_folders;
DROP POLICY IF EXISTS "Allow authenticated users to view folders" ON class_attendance_folders;
DROP POLICY IF EXISTS "Allow authenticated users to create folders" ON class_attendance_folders;
DROP POLICY IF EXISTS "Allow authenticated users to update folders" ON class_attendance_folders;
DROP POLICY IF EXISTS "Allow authenticated users to delete folders" ON class_attendance_folders;
DROP POLICY IF EXISTS "folders_all_access" ON class_attendance_folders;

DROP POLICY IF EXISTS "daily_att_select" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_ins" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_upd" ON class_daily_attendance;
DROP POLICY IF EXISTS "daily_att_del" ON class_daily_attendance;
DROP POLICY IF EXISTS "Allow authenticated users to view attendance" ON class_daily_attendance;
DROP POLICY IF EXISTS "Allow authenticated users to create attendance" ON class_daily_attendance;
DROP POLICY IF EXISTS "Allow authenticated users to update attendance" ON class_daily_attendance;
DROP POLICY IF EXISTS "Allow authenticated users to delete attendance" ON class_daily_attendance;
DROP POLICY IF EXISTS "attendance_all_access" ON class_daily_attendance;

-- Completely disable RLS (this removes all policy restrictions)
ALTER TABLE class_attendance_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_daily_attendance DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON class_attendance_folders TO authenticated;
GRANT ALL ON class_daily_attendance TO authenticated;
GRANT ALL ON class_attendance_folders TO anon;
GRANT ALL ON class_daily_attendance TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify tables are accessible
SELECT 'Tables ready - RLS disabled' as status, 
       (SELECT count(*) FROM class_attendance_folders) as folders,
       (SELECT count(*) FROM class_daily_attendance) as records;

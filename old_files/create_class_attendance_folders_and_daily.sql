-- Attendance folders (per day) and daily records

-- 1) Folders table: one row per class per date
CREATE TABLE IF NOT EXISTS class_attendance_folders (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    created_by INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, attendance_date)
);

-- 2) Daily attendance records for each student within a folder/day
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_att_folders_class ON class_attendance_folders(class_id);
CREATE INDEX IF NOT EXISTS idx_att_folders_date ON class_attendance_folders(attendance_date);
CREATE INDEX IF NOT EXISTS idx_daily_att_folder ON class_daily_attendance(folder_id);
CREATE INDEX IF NOT EXISTS idx_daily_att_status ON class_daily_attendance(status);

-- Enable RLS
ALTER TABLE class_attendance_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_daily_attendance ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is an instructor of the class
CREATE OR REPLACE FUNCTION is_instructor_for_class(p_class_id integer)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classes_instructors ci
    WHERE ci.class_id = p_class_id
      AND ci.instructor_id = (
        SELECT au.id FROM auth_user au
        WHERE au.email = auth.jwt()->>'email'
      )
      AND ci.is_active = TRUE
  );
$$;

-- Helper: check if current user is admin/staff
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth_user au
    WHERE au.email = auth.jwt()->>'email'
      AND (au.role IN ('admin','hr','superuser') OR au.is_superuser = TRUE OR au.is_staff = TRUE)
  );
$$;

-- Policies for folders
DROP POLICY IF EXISTS "att_folders_select" ON class_attendance_folders;
CREATE POLICY "att_folders_select" ON class_attendance_folders
  FOR SELECT TO authenticated
  USING (is_instructor_for_class(class_id) OR is_admin_user());

DROP POLICY IF EXISTS "att_folders_ins" ON class_attendance_folders;
CREATE POLICY "att_folders_ins" ON class_attendance_folders
  FOR INSERT TO authenticated
  WITH CHECK (is_instructor_for_class(class_id) OR is_admin_user());

DROP POLICY IF EXISTS "att_folders_upd" ON class_attendance_folders;
CREATE POLICY "att_folders_upd" ON class_attendance_folders
  FOR UPDATE TO authenticated
  USING (is_instructor_for_class(class_id) OR is_admin_user())
  WITH CHECK (is_instructor_for_class(class_id) OR is_admin_user());

DROP POLICY IF EXISTS "att_folders_del" ON class_attendance_folders;
CREATE POLICY "att_folders_del" ON class_attendance_folders
  FOR DELETE TO authenticated
  USING (is_instructor_for_class(class_id) OR is_admin_user());

-- Policies for daily records (resolve class_id via folder)
DROP POLICY IF EXISTS "daily_att_select" ON class_daily_attendance;
CREATE POLICY "daily_att_select" ON class_daily_attendance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_attendance_folders f
      WHERE f.id = class_daily_attendance.folder_id
        AND (is_instructor_for_class(f.class_id) OR is_admin_user())
    )
  );

DROP POLICY IF EXISTS "daily_att_ins" ON class_daily_attendance;
CREATE POLICY "daily_att_ins" ON class_daily_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_attendance_folders f
      WHERE f.id = class_daily_attendance.folder_id
        AND (is_instructor_for_class(f.class_id) OR is_admin_user())
    )
  );

DROP POLICY IF EXISTS "daily_att_upd" ON class_daily_attendance;
CREATE POLICY "daily_att_upd" ON class_daily_attendance
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_attendance_folders f
      WHERE f.id = class_daily_attendance.folder_id
        AND (is_instructor_for_class(f.class_id) OR is_admin_user())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_attendance_folders f
      WHERE f.id = class_daily_attendance.folder_id
        AND (is_instructor_for_class(f.class_id) OR is_admin_user())
    )
  );

DROP POLICY IF EXISTS "daily_att_del" ON class_daily_attendance;
CREATE POLICY "daily_att_del" ON class_daily_attendance
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_attendance_folders f
      WHERE f.id = class_daily_attendance.folder_id
        AND (is_instructor_for_class(f.class_id) OR is_admin_user())
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON class_attendance_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON class_daily_attendance TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


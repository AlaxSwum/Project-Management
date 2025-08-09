-- Create class_attendance table for daily attendance tracking
CREATE TABLE IF NOT EXISTS class_attendance (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES classes_participants(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent')),
    absence_type VARCHAR(50) CHECK (absence_type IN ('excused', 'unexcused', 'sick', 'family')),
    reason TEXT,
    notes TEXT,
    recorded_by INTEGER REFERENCES auth_user(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per student per class per date
    UNIQUE(class_id, student_id, date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_attendance_class_id ON class_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_student_id ON class_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_date ON class_attendance(date);
CREATE INDEX IF NOT EXISTS idx_class_attendance_status ON class_attendance(status);

-- Add RLS policies
ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;

-- Policy for instructors to manage attendance for their assigned classes
DROP POLICY IF EXISTS "Instructors can manage attendance for their classes" ON class_attendance;
CREATE POLICY "Instructors can manage attendance for their classes"
ON class_attendance FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM classes_instructors ci 
        WHERE ci.class_id = class_attendance.class_id 
        AND ci.instructor_id = auth.uid() 
        AND ci.is_active = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM classes_instructors ci 
        WHERE ci.class_id = class_attendance.class_id 
        AND ci.instructor_id = auth.uid() 
        AND ci.is_active = TRUE
    )
);

-- Policy for admins to view/manage all attendance
DROP POLICY IF EXISTS "Admins can manage all attendance" ON class_attendance;
CREATE POLICY "Admins can manage all attendance"
ON class_attendance FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM auth_user au 
        WHERE au.id = auth.uid() 
        AND (au.role IN ('admin', 'hr', 'superuser') OR au.is_superuser = TRUE OR au.is_staff = TRUE)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM auth_user au 
        WHERE au.id = auth.uid() 
        AND (au.role IN ('admin', 'hr', 'superuser') OR au.is_superuser = TRUE OR au.is_staff = TRUE)
    )
);

-- Grant permissions
GRANT ALL ON class_attendance TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE class_attendance_id_seq TO authenticated;

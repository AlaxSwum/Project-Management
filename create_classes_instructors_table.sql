-- Create classes_instructors junction table for many-to-many relationship
-- between classes and instructors

CREATE TABLE IF NOT EXISTS classes_instructors (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'instructor' CHECK (role IN ('instructor', 'lead', 'assistant')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by INTEGER REFERENCES auth_user(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of class and instructor
    UNIQUE(class_id, instructor_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_instructors_class_id ON classes_instructors(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_instructors_instructor_id ON classes_instructors(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_instructors_active ON classes_instructors(is_active);

-- Add RLS policies
ALTER TABLE classes_instructors ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view instructor assignments
CREATE POLICY "Allow authenticated users to view instructor assignments" ON classes_instructors
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Allow admins to manage instructor assignments
CREATE POLICY "Allow admins to manage instructor assignments" ON classes_instructors
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE auth_user.id = auth.uid()::integer 
            AND auth_user.role IN ('admin', 'hr', 'superuser') 
        )
        OR 
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE auth_user.id = auth.uid()::integer 
            AND (auth_user.is_staff = true OR auth_user.is_superuser = true)
        )
    );

-- Policy: Allow instructors to view their own assignments
CREATE POLICY "Allow instructors to view their own assignments" ON classes_instructors
    FOR SELECT
    USING (instructor_id = auth.uid()::integer);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON classes_instructors TO authenticated;
GRANT USAGE ON SEQUENCE classes_instructors_id_seq TO authenticated;

-- Backfill existing data from classes table (if any)
-- This will create instructor assignments for classes that already have instructor_name or instructor_id
INSERT INTO classes_instructors (class_id, instructor_id, role, is_active, assigned_at)
SELECT 
    c.id as class_id,
    au.id as instructor_id,
    'instructor' as role,
    true as is_active,
    NOW() as assigned_at
FROM classes c
JOIN auth_user au ON (
    (c.instructor_id IS NOT NULL AND au.id = c.instructor_id) 
    OR 
    (c.instructor_name IS NOT NULL AND au.name = c.instructor_name AND au.role = 'instructor')
)
WHERE NOT EXISTS (
    SELECT 1 FROM classes_instructors ci 
    WHERE ci.class_id = c.id AND ci.instructor_id = au.id
)
ON CONFLICT (class_id, instructor_id) DO NOTHING;

COMMIT;

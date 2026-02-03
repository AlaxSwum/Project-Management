-- Add instructor_id column to classes table for proper instructor assignment
-- Run this in Supabase SQL Editor

-- Check if instructor_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'instructor_id'
    ) THEN
        ALTER TABLE classes ADD COLUMN instructor_id INTEGER REFERENCES auth_user(id);
        RAISE NOTICE 'Added instructor_id column to classes table';
    ELSE
        RAISE NOTICE 'instructor_id column already exists in classes table';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);

-- Create absence tracking table for instructors
CREATE TABLE IF NOT EXISTS class_absences (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    absence_date DATE NOT NULL,
    absence_type VARCHAR(20) CHECK (absence_type IN ('excused', 'unexcused', 'sick', 'family')) NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    recorded_by INTEGER REFERENCES auth_user(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_absences_class_id ON class_absences(class_id);
CREATE INDEX IF NOT EXISTS idx_class_absences_student_id ON class_absences(student_id);
CREATE INDEX IF NOT EXISTS idx_class_absences_date ON class_absences(absence_date);

-- Create function to create absence table if it doesn't exist (for instructor dashboard)
CREATE OR REPLACE FUNCTION create_absence_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- This function exists to ensure the absence table is available
    -- The table is already created above, so this just returns
    RETURN;
END;
$$ LANGUAGE plpgsql;

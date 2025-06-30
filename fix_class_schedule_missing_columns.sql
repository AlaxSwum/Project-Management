-- Add missing columns to class schedule tables

-- 1. Add instructor_name column to class_schedule table
ALTER TABLE public.class_schedule 
ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);

-- 2. Add color column to class_schedule_folders table
ALTER TABLE public.class_schedule_folders 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#ffffff';

-- 3. Update existing records to have default values
UPDATE public.class_schedule 
SET instructor_name = '' 
WHERE instructor_name IS NULL;

UPDATE public.class_schedule_folders 
SET color = '#ffffff' 
WHERE color IS NULL;

-- 4. Verify both columns were added
SELECT 'class_schedule columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'class_schedule' 
AND table_schema = 'public' 
ORDER BY ordinal_position;

SELECT 'class_schedule_folders columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'class_schedule_folders' 
AND table_schema = 'public' 
ORDER BY ordinal_position; 
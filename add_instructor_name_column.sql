-- Add instructor_name column to class_schedule table
ALTER TABLE public.class_schedule 
ADD COLUMN instructor_name VARCHAR(255);

-- Update existing records to have empty instructor_name (optional)
UPDATE public.class_schedule 
SET instructor_name = '' 
WHERE instructor_name IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'class_schedule' 
AND table_schema = 'public' 
ORDER BY ordinal_position; 
-- Add missing folder_type column to class_schedule_folders table

ALTER TABLE public.class_schedule_folders 
ADD COLUMN IF NOT EXISTS folder_type VARCHAR(50) DEFAULT 'category';

-- Update existing records to have default folder_type
UPDATE public.class_schedule_folders 
SET folder_type = 'category' 
WHERE folder_type IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'class_schedule_folders' 
AND table_schema = 'public' 
ORDER BY ordinal_position; 
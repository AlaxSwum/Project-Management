-- =============================================
-- QUICK ADD DURATION TO PERSONAL TASKS
-- Copy this entire script and paste into Supabase SQL Editor
-- Then click RUN
-- =============================================

-- Add duration fields to personal_tasks
ALTER TABLE personal_tasks 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER CHECK (estimated_duration IS NULL OR estimated_duration > 0);

ALTER TABLE personal_tasks 
ADD COLUMN IF NOT EXISTS actual_duration INTEGER CHECK (actual_duration IS NULL OR actual_duration > 0);

-- Add duration field to personal_time_blocks
ALTER TABLE personal_time_blocks 
ADD COLUMN IF NOT EXISTS duration INTEGER CHECK (duration IS NULL OR duration > 0);

-- Add helpful comments
COMMENT ON COLUMN personal_tasks.estimated_duration IS 'Estimated time to complete the task in minutes';
COMMENT ON COLUMN personal_tasks.actual_duration IS 'Actual time spent on the task in minutes';
COMMENT ON COLUMN personal_time_blocks.duration IS 'Duration of the time block in minutes';

-- Update existing time_blocks with calculated duration (if they have start/end times)
UPDATE personal_time_blocks 
SET duration = EXTRACT(EPOCH FROM (end_time - start_time))/60
WHERE start_time IS NOT NULL 
  AND end_time IS NOT NULL 
  AND duration IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS! Duration fields added to your tables!';
    RAISE NOTICE '📊 You can now use duration in your personal tasks and time blocks';
    RAISE NOTICE '🚀 Deploy your frontend changes and start using the feature!';
END $$;


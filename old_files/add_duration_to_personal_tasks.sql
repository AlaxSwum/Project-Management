-- =============================================
-- Add Duration Field to Personal Tasks & Time Blocks
-- This ensures duration fields exist in both tables
-- =============================================

-- Add estimated_duration to personal_tasks if it doesn't exist
DO $$ 
BEGIN 
    -- Check and add estimated_duration column for personal_tasks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personal_tasks' 
        AND column_name = 'estimated_duration'
    ) THEN
        ALTER TABLE personal_tasks 
        ADD COLUMN estimated_duration INTEGER;
        
        RAISE NOTICE 'Added estimated_duration column to personal_tasks';
    ELSE
        RAISE NOTICE 'estimated_duration column already exists in personal_tasks';
    END IF;
    
    -- Check and add actual_duration column for personal_tasks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personal_tasks' 
        AND column_name = 'actual_duration'
    ) THEN
        ALTER TABLE personal_tasks 
        ADD COLUMN actual_duration INTEGER;
        
        RAISE NOTICE 'Added actual_duration column to personal_tasks';
    ELSE
        RAISE NOTICE 'actual_duration column already exists in personal_tasks';
    END IF;
    
    -- Check and add duration column for personal_time_blocks (explicit duration in minutes)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personal_time_blocks' 
        AND column_name = 'duration'
    ) THEN
        ALTER TABLE personal_time_blocks 
        ADD COLUMN duration INTEGER;
        
        RAISE NOTICE 'Added duration column to personal_time_blocks';
    ELSE
        RAISE NOTICE 'duration column already exists in personal_time_blocks';
    END IF;
END $$;

-- Add default constraint for estimated_duration (optional - ensures positive values)
DO $$ 
BEGIN 
    -- Add check constraint for estimated_duration if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'personal_tasks_estimated_duration_check'
    ) THEN
        ALTER TABLE personal_tasks 
        ADD CONSTRAINT personal_tasks_estimated_duration_check 
        CHECK (estimated_duration IS NULL OR estimated_duration > 0);
        
        RAISE NOTICE 'Added check constraint for estimated_duration';
    END IF;
    
    -- Add check constraint for actual_duration if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'personal_tasks_actual_duration_check'
    ) THEN
        ALTER TABLE personal_tasks 
        ADD CONSTRAINT personal_tasks_actual_duration_check 
        CHECK (actual_duration IS NULL OR actual_duration > 0);
        
        RAISE NOTICE 'Added check constraint for actual_duration';
    END IF;
    
    -- Add check constraint for time_blocks duration if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'personal_time_blocks_duration_check'
    ) THEN
        ALTER TABLE personal_time_blocks 
        ADD CONSTRAINT personal_time_blocks_duration_check 
        CHECK (duration IS NULL OR duration > 0);
        
        RAISE NOTICE 'Added check constraint for personal_time_blocks duration';
    END IF;
END $$;

-- Create helpful view to show tasks with duration information
DROP VIEW IF EXISTS personal_tasks_with_duration_info;
CREATE VIEW personal_tasks_with_duration_info AS
SELECT 
    pt.id,
    pt.user_id,
    pt.title,
    pt.description,
    pt.status,
    pt.priority,
    pt.category,
    pt.due_date,
    pt.estimated_duration,
    pt.actual_duration,
    pt.scheduled_start,
    pt.scheduled_end,
    -- Calculate scheduled duration from start and end times
    CASE 
        WHEN pt.scheduled_start IS NOT NULL AND pt.scheduled_end IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (pt.scheduled_end - pt.scheduled_start))/60 
        ELSE NULL 
    END as scheduled_duration_minutes,
    -- Calculate time variance (difference between estimated and actual)
    CASE 
        WHEN pt.estimated_duration IS NOT NULL AND pt.actual_duration IS NOT NULL 
        THEN pt.actual_duration - pt.estimated_duration 
        ELSE NULL 
    END as duration_variance,
    pt.created_at,
    pt.updated_at,
    pt.completed_at
FROM personal_tasks pt;

-- Grant permissions on the view
GRANT SELECT ON personal_tasks_with_duration_info TO authenticated;

-- Update existing time_blocks to populate duration from start_time and end_time
DO $$ 
BEGIN 
    -- Update duration for existing time_blocks if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personal_time_blocks' 
        AND column_name = 'duration'
    ) THEN
        -- Check if we have start_time and end_time columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'personal_time_blocks' 
            AND column_name = 'start_time'
        ) THEN
            UPDATE personal_time_blocks 
            SET duration = EXTRACT(EPOCH FROM (end_time - start_time))/60
            WHERE start_time IS NOT NULL 
                AND end_time IS NOT NULL 
                AND duration IS NULL;
                
            RAISE NOTICE 'Updated duration for existing time blocks using start_time/end_time';
        -- Or check for start_datetime and end_datetime columns
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'personal_time_blocks' 
            AND column_name = 'start_datetime'
        ) THEN
            UPDATE personal_time_blocks 
            SET duration = EXTRACT(EPOCH FROM (end_datetime - start_datetime))/60
            WHERE start_datetime IS NOT NULL 
                AND end_datetime IS NOT NULL 
                AND duration IS NULL;
                
            RAISE NOTICE 'Updated duration for existing time blocks using start_datetime/end_datetime';
        END IF;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Duration fields setup completed!';
    RAISE NOTICE '📊 Fields available:';
    RAISE NOTICE '   - personal_tasks.estimated_duration (INTEGER - minutes)';
    RAISE NOTICE '   - personal_tasks.actual_duration (INTEGER - minutes)';
    RAISE NOTICE '   - personal_time_blocks.duration (INTEGER - minutes)';
    RAISE NOTICE '📈 View created: personal_tasks_with_duration_info';
    RAISE NOTICE '✨ You can now track task duration in your application!';
END $$;

-- Optional: Add comments to document the columns
COMMENT ON COLUMN personal_tasks.estimated_duration IS 'Estimated time to complete the task in minutes';
COMMENT ON COLUMN personal_tasks.actual_duration IS 'Actual time spent on the task in minutes';

-- Check if personal_time_blocks has duration column before adding comment
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personal_time_blocks' 
        AND column_name = 'duration'
    ) THEN
        EXECUTE 'COMMENT ON COLUMN personal_time_blocks.duration IS ''Duration of the time block in minutes''';
    END IF;
END $$;


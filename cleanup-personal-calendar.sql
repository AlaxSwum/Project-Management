-- Personal Calendar Cleanup Script
-- Run this first to clean up any existing tables and policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own events" ON personal_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON personal_events;
DROP POLICY IF EXISTS "Users can update their own events" ON personal_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON personal_events;

DROP POLICY IF EXISTS "Users can view their own tasks" ON personal_tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON personal_tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON personal_tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON personal_tasks;

DROP POLICY IF EXISTS "Users can view their own settings" ON personal_calendar_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON personal_calendar_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON personal_calendar_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON personal_calendar_settings;

DROP POLICY IF EXISTS "Users can view their own time blocks" ON personal_time_blocks;
DROP POLICY IF EXISTS "Users can insert their own time blocks" ON personal_time_blocks;
DROP POLICY IF EXISTS "Users can update their own time blocks" ON personal_time_blocks;
DROP POLICY IF EXISTS "Users can delete their own time blocks" ON personal_time_blocks;

-- Drop existing view
DROP VIEW IF EXISTS personal_calendar_overview;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_personal_events_updated_at ON personal_events;
DROP TRIGGER IF EXISTS update_personal_tasks_updated_at ON personal_tasks;
DROP TRIGGER IF EXISTS update_personal_calendar_settings_updated_at ON personal_calendar_settings;
DROP TRIGGER IF EXISTS update_personal_time_blocks_updated_at ON personal_time_blocks;

-- Drop existing function
DROP FUNCTION IF EXISTS create_default_calendar_settings();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_personal_events_user_datetime;
DROP INDEX IF EXISTS idx_personal_events_datetime_range;
DROP INDEX IF EXISTS idx_personal_events_recurring;
DROP INDEX IF EXISTS idx_personal_tasks_user_due;
DROP INDEX IF EXISTS idx_personal_tasks_status;
DROP INDEX IF EXISTS idx_personal_tasks_project;
DROP INDEX IF EXISTS idx_personal_tasks_scheduled;
DROP INDEX IF EXISTS idx_personal_time_blocks_user_datetime;

-- Drop existing tables
DROP TABLE IF EXISTS personal_time_blocks;
DROP TABLE IF EXISTS personal_calendar_settings;
DROP TABLE IF EXISTS personal_tasks;
DROP TABLE IF EXISTS personal_events;

-- Success message
SELECT 'Personal calendar tables and policies cleaned up successfully!' as message; 
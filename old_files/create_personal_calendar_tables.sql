-- Personal Calendar Database Schema
-- This script creates tables for the personal calendar functionality
-- Similar to Motion and Google Calendar features

-- Create personal_events table for calendar events
CREATE TABLE IF NOT EXISTS personal_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'personal', -- personal, meeting, appointment, reminder
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, tentative, cancelled
    color VARCHAR(7) DEFAULT '#5884FD', -- hex color for event display
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- {type: 'daily|weekly|monthly|yearly', interval: 1, end_date: '2024-12-31', days: ['monday', 'tuesday']}
    reminder_minutes INTEGER[], -- array of minutes before event to remind [15, 30, 60]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_datetime CHECK (start_datetime < end_datetime),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT valid_status CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    CONSTRAINT valid_event_type CHECK (event_type IN ('personal', 'meeting', 'appointment', 'reminder', 'task', 'project'))
);

-- Create personal_tasks table for task management integrated with calendar
CREATE TABLE IF NOT EXISTS personal_tasks (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- in minutes
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    status VARCHAR(20) DEFAULT 'todo', -- todo, in_progress, completed, cancelled
    category VARCHAR(100), -- work, personal, health, learning, etc.
    project_id INTEGER, -- link to project tasks (optional foreign key)
    tags TEXT[], -- array of tags for organization
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    scheduled_start TIMESTAMP WITH TIME ZONE, -- when task is scheduled to start
    scheduled_end TIMESTAMP WITH TIME ZONE, -- when task is scheduled to end
    auto_scheduled BOOLEAN DEFAULT FALSE, -- whether this task was auto-scheduled by the system
    color VARCHAR(7) DEFAULT '#FFB333', -- hex color for task display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_priority_task CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT valid_status_task CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT valid_scheduled_time CHECK (scheduled_start IS NULL OR scheduled_end IS NULL OR scheduled_start < scheduled_end)
);

-- Create personal_calendar_settings table for user preferences
CREATE TABLE IF NOT EXISTS personal_calendar_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_view VARCHAR(20) DEFAULT 'week', -- month, week, day, agenda
    start_hour INTEGER DEFAULT 6 CHECK (start_hour >= 0 AND start_hour <= 23), -- day view start hour
    end_hour INTEGER DEFAULT 22 CHECK (end_hour >= 0 AND end_hour <= 23), -- day view end hour
    time_format VARCHAR(10) DEFAULT '12h', -- 12h or 24h
    first_day_of_week INTEGER DEFAULT 0 CHECK (first_day_of_week >= 0 AND first_day_of_week <= 6), -- 0=Sunday, 1=Monday
    timezone VARCHAR(50) DEFAULT 'UTC',
    auto_schedule_tasks BOOLEAN DEFAULT TRUE, -- automatically schedule tasks in free time
    working_hours_start TIME DEFAULT '09:00:00',
    working_hours_end TIME DEFAULT '17:00:00',
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Sunday, 1=Monday... 6=Saturday
    break_duration INTEGER DEFAULT 15, -- minutes between auto-scheduled tasks
    notification_settings JSONB DEFAULT '{"email": true, "browser": true, "sound": true}',
    theme_color VARCHAR(7) DEFAULT '#5884FD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_view CHECK (default_view IN ('month', 'week', 'day', 'agenda')),
    CONSTRAINT valid_time_format CHECK (time_format IN ('12h', '24h')),
    CONSTRAINT valid_hours CHECK (start_hour < end_hour),
    CONSTRAINT valid_working_hours CHECK (working_hours_start < working_hours_end)
);

-- Create personal_time_blocks table for blocking time (focus time, meetings, etc.)
CREATE TABLE IF NOT EXISTS personal_time_blocks (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    block_type VARCHAR(50) DEFAULT 'focus', -- focus, break, meeting, unavailable, travel
    color VARCHAR(7) DEFAULT '#C483D9',
    description TEXT,
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_block_datetime CHECK (start_datetime < end_datetime),
    CONSTRAINT valid_block_type CHECK (block_type IN ('focus', 'break', 'meeting', 'unavailable', 'travel', 'personal'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_events_user_datetime ON personal_events(user_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_personal_events_datetime_range ON personal_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_personal_events_recurring ON personal_events(recurring) WHERE recurring = true;

CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_due ON personal_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_status ON personal_tasks(status);
-- Note: Uncomment this index after ensuring project_id column exists
-- CREATE INDEX IF NOT EXISTS idx_personal_tasks_project ON personal_tasks(project_id) WHERE project_id IS NOT NULL;
-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN 
    -- Add project_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_tasks' 
                   AND column_name = 'project_id') THEN
        ALTER TABLE personal_tasks ADD COLUMN project_id INTEGER;
    END IF;
    
    -- Add scheduled_start column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_tasks' 
                   AND column_name = 'scheduled_start') THEN
        ALTER TABLE personal_tasks ADD COLUMN scheduled_start TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add scheduled_end column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_tasks' 
                   AND column_name = 'scheduled_end') THEN
        ALTER TABLE personal_tasks ADD COLUMN scheduled_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add auto_scheduled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_tasks' 
                   AND column_name = 'auto_scheduled') THEN
        ALTER TABLE personal_tasks ADD COLUMN auto_scheduled BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add estimated_duration column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_tasks' 
                   AND column_name = 'estimated_duration') THEN
        ALTER TABLE personal_tasks ADD COLUMN estimated_duration INTEGER;
    END IF;
    
    -- Add color column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_tasks' 
                   AND column_name = 'color') THEN
        ALTER TABLE personal_tasks ADD COLUMN color VARCHAR(7) DEFAULT '#FFB333';
    END IF;
    
    -- Add completion_percentage column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_tasks' 
                   AND column_name = 'completion_percentage') THEN
        ALTER TABLE personal_tasks ADD COLUMN completion_percentage INTEGER DEFAULT 0;
        ALTER TABLE personal_tasks ADD CONSTRAINT check_completion_percentage 
            CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;
    
    -- Add completed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_tasks' 
                   AND column_name = 'completed_at') THEN
        ALTER TABLE personal_tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Handle user_id type conversion safely (for existing tables with INTEGER user_id)
DO $$ 
BEGIN 
    -- For personal_tasks: if user_id is INTEGER, we need to handle this carefully
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'personal_tasks' 
               AND column_name = 'user_id' 
               AND data_type = 'integer') THEN
        
        -- Temporarily disable RLS to avoid conflicts during migration
        ALTER TABLE personal_tasks DISABLE ROW LEVEL SECURITY;
        
        -- Add a new UUID column
        ALTER TABLE personal_tasks ADD COLUMN user_id_uuid UUID;
        
        -- Since we can't directly convert integer IDs to UUIDs, we'll clear the data
        -- This is safer than having invalid UUID references
        -- Users will need to recreate their personal tasks after migration
        TRUNCATE TABLE personal_tasks CASCADE;
        
        -- Drop the old column and rename the new one
        ALTER TABLE personal_tasks DROP COLUMN user_id;
        ALTER TABLE personal_tasks RENAME COLUMN user_id_uuid TO user_id;
        
        -- Add NOT NULL constraint
        ALTER TABLE personal_tasks ALTER COLUMN user_id SET NOT NULL;
        
        -- Re-enable RLS (will be set up later in the script)
        -- ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Similar handling for other tables
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'personal_events' 
               AND column_name = 'user_id' 
               AND data_type = 'integer') THEN
        ALTER TABLE personal_events DISABLE ROW LEVEL SECURITY;
        ALTER TABLE personal_events ADD COLUMN user_id_uuid UUID;
        TRUNCATE TABLE personal_events CASCADE;
        ALTER TABLE personal_events DROP COLUMN user_id;
        ALTER TABLE personal_events RENAME COLUMN user_id_uuid TO user_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'personal_calendar_settings' 
               AND column_name = 'user_id' 
               AND data_type = 'integer') THEN
        ALTER TABLE personal_calendar_settings DISABLE ROW LEVEL SECURITY;
        ALTER TABLE personal_calendar_settings ADD COLUMN user_id_uuid UUID;
        TRUNCATE TABLE personal_calendar_settings CASCADE;
        ALTER TABLE personal_calendar_settings DROP COLUMN user_id;
        ALTER TABLE personal_calendar_settings RENAME COLUMN user_id_uuid TO user_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'personal_time_blocks' 
               AND column_name = 'user_id' 
               AND data_type = 'integer') THEN
        ALTER TABLE personal_time_blocks DISABLE ROW LEVEL SECURITY;
        ALTER TABLE personal_time_blocks ADD COLUMN user_id_uuid UUID;
        TRUNCATE TABLE personal_time_blocks CASCADE;
        ALTER TABLE personal_time_blocks DROP COLUMN user_id;
        ALTER TABLE personal_time_blocks RENAME COLUMN user_id_uuid TO user_id;
    END IF;
END $$;

-- Add missing columns for personal_events table
DO $$ 
BEGIN 
    -- Add missing columns for personal_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'start_datetime') THEN
        ALTER TABLE personal_events ADD COLUMN start_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'end_datetime') THEN
        ALTER TABLE personal_events ADD COLUMN end_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 hour';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'all_day') THEN
        ALTER TABLE personal_events ADD COLUMN all_day BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'location') THEN
        ALTER TABLE personal_events ADD COLUMN location VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'event_type') THEN
        ALTER TABLE personal_events ADD COLUMN event_type VARCHAR(50) DEFAULT 'personal';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'priority') THEN
        ALTER TABLE personal_events ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'status') THEN
        ALTER TABLE personal_events ADD COLUMN status VARCHAR(20) DEFAULT 'confirmed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'color') THEN
        ALTER TABLE personal_events ADD COLUMN color VARCHAR(7) DEFAULT '#5884FD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'recurring') THEN
        ALTER TABLE personal_events ADD COLUMN recurring BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'recurrence_pattern') THEN
        ALTER TABLE personal_events ADD COLUMN recurrence_pattern JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_events' 
                   AND column_name = 'reminder_minutes') THEN
        ALTER TABLE personal_events ADD COLUMN reminder_minutes INTEGER[];
    END IF;
END $$;

-- Add missing columns for personal_time_blocks table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_time_blocks' 
                   AND column_name = 'start_datetime') THEN
        ALTER TABLE personal_time_blocks ADD COLUMN start_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_time_blocks' 
                   AND column_name = 'end_datetime') THEN
        ALTER TABLE personal_time_blocks ADD COLUMN end_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 hour';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_time_blocks' 
                   AND column_name = 'block_type') THEN
        ALTER TABLE personal_time_blocks ADD COLUMN block_type VARCHAR(50) DEFAULT 'focus';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_time_blocks' 
                   AND column_name = 'color') THEN
        ALTER TABLE personal_time_blocks ADD COLUMN color VARCHAR(7) DEFAULT '#C483D9';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_time_blocks' 
                   AND column_name = 'recurring') THEN
        ALTER TABLE personal_time_blocks ADD COLUMN recurring BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_time_blocks' 
                   AND column_name = 'recurrence_pattern') THEN
        ALTER TABLE personal_time_blocks ADD COLUMN recurrence_pattern JSONB;
    END IF;
END $$;

-- Add missing columns for personal_calendar_settings table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'default_view') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN default_view VARCHAR(20) DEFAULT 'week';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'start_hour') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN start_hour INTEGER DEFAULT 6;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'end_hour') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN end_hour INTEGER DEFAULT 22;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'time_format') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN time_format VARCHAR(10) DEFAULT '12h';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'first_day_of_week') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN first_day_of_week INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'timezone') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'auto_schedule_tasks') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN auto_schedule_tasks BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'working_hours_start') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN working_hours_start TIME DEFAULT '09:00:00';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'working_hours_end') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN working_hours_end TIME DEFAULT '17:00:00';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'working_days') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'break_duration') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN break_duration INTEGER DEFAULT 15;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'notification_settings') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN notification_settings JSONB DEFAULT '{"email": true, "browser": true, "sound": true}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_calendar_settings' 
                   AND column_name = 'theme_color') THEN
        ALTER TABLE personal_calendar_settings ADD COLUMN theme_color VARCHAR(7) DEFAULT '#5884FD';
    END IF;
END $$;

-- Create indexes after ensuring all columns exist
CREATE INDEX IF NOT EXISTS idx_personal_tasks_project ON personal_tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personal_tasks_scheduled ON personal_tasks(scheduled_start, scheduled_end) WHERE scheduled_start IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_personal_time_blocks_user_datetime ON personal_time_blocks(user_id, start_datetime, end_datetime);

-- Create RLS (Row Level Security) policies
ALTER TABLE personal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_time_blocks ENABLE ROW LEVEL SECURITY;

-- Personal Events Policies
CREATE POLICY "Users can view their own events" ON personal_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" ON personal_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON personal_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON personal_events
    FOR DELETE USING (auth.uid() = user_id);

-- Personal Tasks Policies
CREATE POLICY "Users can view their own tasks" ON personal_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON personal_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON personal_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON personal_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Personal Calendar Settings Policies
CREATE POLICY "Users can view their own settings" ON personal_calendar_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON personal_calendar_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON personal_calendar_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON personal_calendar_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Personal Time Blocks Policies
CREATE POLICY "Users can view their own time blocks" ON personal_time_blocks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time blocks" ON personal_time_blocks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks" ON personal_time_blocks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks" ON personal_time_blocks
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates (with existence checks)
DO $$ 
BEGIN 
    -- Create trigger for personal_events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_personal_events_updated_at') THEN
        CREATE TRIGGER update_personal_events_updated_at BEFORE UPDATE ON personal_events
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for personal_tasks if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_personal_tasks_updated_at') THEN
        CREATE TRIGGER update_personal_tasks_updated_at BEFORE UPDATE ON personal_tasks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for personal_calendar_settings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_personal_calendar_settings_updated_at') THEN
        CREATE TRIGGER update_personal_calendar_settings_updated_at BEFORE UPDATE ON personal_calendar_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for personal_time_blocks if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_personal_time_blocks_updated_at') THEN
        CREATE TRIGGER update_personal_time_blocks_updated_at BEFORE UPDATE ON personal_time_blocks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create a function to automatically create default settings for new users
CREATE OR REPLACE FUNCTION create_default_calendar_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO personal_calendar_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create settings when a new user is created
-- Note: This assumes you have access to auth.users table
-- CREATE TRIGGER create_user_calendar_settings AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION create_default_calendar_settings();

-- Drop existing view if it exists to handle type changes
DROP VIEW IF EXISTS personal_calendar_overview;

-- Create a simplified view for calendar overview using text IDs to handle mixed types
CREATE VIEW personal_calendar_overview AS
SELECT 
    'event'::text as item_type,
    pe.id::text as id,
    pe.user_id,
    pe.title::text as title,
    COALESCE(pe.description, '')::text as description,
    pe.start_datetime,
    pe.end_datetime,
    pe.all_day,
    COALESCE(pe.color, '#5884FD')::text as color,
    COALESCE(pe.priority, 'medium')::text as priority,
    COALESCE(pe.status, 'confirmed')::text as status,
    null::integer as completion_percentage,
    COALESCE(pe.location, '')::text as location,
    COALESCE(pe.event_type, 'personal')::text as category
FROM personal_events pe
WHERE COALESCE(pe.status, 'confirmed') != 'cancelled'

UNION ALL

SELECT 
    'task'::text as item_type,
    pt.id::text as id,
    pt.user_id,
    pt.title::text as title,
    COALESCE(pt.description, '')::text as description,
    pt.scheduled_start as start_datetime,
    pt.scheduled_end as end_datetime,
    false as all_day,
    COALESCE(pt.color, '#FFB333')::text as color,
    COALESCE(pt.priority, 'medium')::text as priority,
    COALESCE(pt.status, 'todo')::text as status,
    COALESCE(pt.completion_percentage, 0)::integer as completion_percentage,
    ''::text as location,
    COALESCE(pt.category, 'personal')::text as category
FROM personal_tasks pt
WHERE pt.scheduled_start IS NOT NULL 
    AND COALESCE(pt.status, 'todo') NOT IN ('completed', 'cancelled')

UNION ALL

SELECT 
    'time_block'::text as item_type,
    ptb.id::text as id,
    ptb.user_id,
    ptb.title::text as title,
    COALESCE(ptb.description, '')::text as description,
    ptb.start_datetime,
    ptb.end_datetime,
    false as all_day,
    COALESCE(ptb.color, '#C483D9')::text as color,
    'medium'::text as priority,
    'confirmed'::text as status,
    null::integer as completion_percentage,
    ''::text as location,
    COALESCE(ptb.block_type, 'focus')::text as category
FROM personal_time_blocks ptb;

-- Grant appropriate permissions
GRANT ALL ON personal_events TO authenticated;
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_calendar_settings TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;
GRANT SELECT ON personal_calendar_overview TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Optional: Add meetings integration (run this after projects_meeting table exists)
-- This creates an extended view that includes meetings from the timetable
/*
CREATE OR REPLACE VIEW personal_calendar_overview_with_meetings AS
SELECT * FROM personal_calendar_overview

UNION ALL

SELECT 
    'meeting' as item_type,
    pm.id,
    auth.uid() as user_id,
    pm.title,
    pm.description,
    (pm.date || ' ' || pm.time)::timestamp with time zone as start_datetime,
    (pm.date || ' ' || pm.time)::timestamp with time zone + (pm.duration || ' minutes')::interval as end_datetime,
    false as all_day,
    '#FFB333' as color,
    'medium' as priority,
    'confirmed' as status,
    null as completion_percentage,
    null as location,
    'meeting' as category
FROM projects_meeting pm
WHERE pm.created_by IS NOT NULL
  AND (pm.created_by = (auth.uid()::text)::integer 
       OR (auth.uid()::text)::integer = ANY(pm.attendee_ids)
       OR pm.attendees LIKE '%' || (SELECT email FROM auth.users WHERE id = auth.uid()) || '%');
*/ 
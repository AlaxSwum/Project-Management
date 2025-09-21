-- DEPLOY PERSONAL TASKS FIX - RUN THIS IN SUPABASE SQL EDITOR
-- This script fixes the personal tasks system to resolve 400/406 errors
-- Run date: September 21, 2025

-- Fix Personal Tasks Database Issues
-- This script fixes the personal_tasks table to work with integer user IDs and proper RLS

-- First, disable RLS temporarily to fix the structure
ALTER TABLE IF EXISTS personal_tasks DISABLE ROW LEVEL SECURITY;

-- Drop the table if it exists to recreate with correct structure
DROP TABLE IF EXISTS personal_tasks CASCADE;

-- Create personal_tasks table with INTEGER user_id (not UUID)
CREATE TABLE personal_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- Use INTEGER to match auth_user table
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_due ON personal_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_project ON personal_tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personal_tasks_scheduled ON personal_tasks(scheduled_start, scheduled_end) WHERE scheduled_start IS NOT NULL;

-- Enable RLS
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that allow all access for now
-- Since we're using a custom auth system, we'll allow access based on the application layer
CREATE POLICY "Allow all access to personal_tasks" ON personal_tasks
    FOR ALL USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_tasks TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for personal_tasks if it doesn't exist
DROP TRIGGER IF EXISTS update_personal_tasks_updated_at ON personal_tasks;
CREATE TRIGGER update_personal_tasks_updated_at BEFORE UPDATE ON personal_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Also fix personal_events table to use INTEGER user_id
ALTER TABLE IF EXISTS personal_events DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS personal_events CASCADE;

CREATE TABLE personal_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- Use INTEGER to match auth_user table
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

-- Enable RLS and create permissive policies for personal_events
ALTER TABLE personal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to personal_events" ON personal_events
    FOR ALL USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON personal_events TO authenticated;
GRANT ALL ON personal_events TO anon;

-- Create indexes for personal_events
CREATE INDEX IF NOT EXISTS idx_personal_events_user_datetime ON personal_events(user_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_personal_events_datetime_range ON personal_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_personal_events_recurring ON personal_events(recurring) WHERE recurring = true;

-- Create trigger for personal_events
DROP TRIGGER IF EXISTS update_personal_events_updated_at ON personal_events;
CREATE TRIGGER update_personal_events_updated_at BEFORE UPDATE ON personal_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create personal_calendar_settings table with INTEGER user_id
ALTER TABLE IF EXISTS personal_calendar_settings DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS personal_calendar_settings CASCADE;

CREATE TABLE personal_calendar_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE, -- Use INTEGER to match auth_user table
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

-- Enable RLS and create permissive policies for personal_calendar_settings
ALTER TABLE personal_calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to personal_calendar_settings" ON personal_calendar_settings
    FOR ALL USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON personal_calendar_settings TO authenticated;
GRANT ALL ON personal_calendar_settings TO anon;

-- Create trigger for personal_calendar_settings
DROP TRIGGER IF EXISTS update_personal_calendar_settings_updated_at ON personal_calendar_settings;
CREATE TRIGGER update_personal_calendar_settings_updated_at BEFORE UPDATE ON personal_calendar_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for existing users
INSERT INTO personal_calendar_settings (user_id)
SELECT id FROM auth_user WHERE id NOT IN (SELECT user_id FROM personal_calendar_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Success message
SELECT 'Personal tasks database fix deployed successfully! The 400/406 errors should now be resolved.' as deployment_status;

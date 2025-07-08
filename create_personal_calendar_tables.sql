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
    project_id INTEGER REFERENCES projects_project(id) ON DELETE SET NULL, -- link to project tasks
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

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_personal_events_updated_at BEFORE UPDATE ON personal_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_tasks_updated_at BEFORE UPDATE ON personal_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_calendar_settings_updated_at BEFORE UPDATE ON personal_calendar_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_time_blocks_updated_at BEFORE UPDATE ON personal_time_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create a view for calendar overview (combines events, tasks, and time blocks)
CREATE OR REPLACE VIEW personal_calendar_overview AS
SELECT 
    'event' as item_type,
    pe.id,
    pe.user_id,
    pe.title,
    pe.description,
    pe.start_datetime,
    pe.end_datetime,
    pe.all_day,
    pe.color,
    pe.priority,
    pe.status,
    null as completion_percentage,
    pe.location,
    pe.event_type as category
FROM personal_events pe
WHERE pe.status != 'cancelled'

UNION ALL

SELECT 
    'task' as item_type,
    pt.id,
    pt.user_id,
    pt.title,
    pt.description,
    pt.scheduled_start as start_datetime,
    pt.scheduled_end as end_datetime,
    false as all_day,
    pt.color,
    pt.priority,
    pt.status,
    pt.completion_percentage,
    null as location,
    pt.category
FROM personal_tasks pt
WHERE pt.scheduled_start IS NOT NULL 
    AND pt.status NOT IN ('completed', 'cancelled')

UNION ALL

SELECT 
    'time_block' as item_type,
    ptb.id,
    ptb.user_id,
    ptb.title,
    ptb.description,
    ptb.start_datetime,
    ptb.end_datetime,
    false as all_day,
    ptb.color,
    'medium' as priority,
    'confirmed' as status,
    null as completion_percentage,
    null as location,
    ptb.block_type as category
FROM personal_time_blocks ptb;

-- Grant appropriate permissions
GRANT ALL ON personal_events TO authenticated;
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_calendar_settings TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;
GRANT SELECT ON personal_calendar_overview TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 
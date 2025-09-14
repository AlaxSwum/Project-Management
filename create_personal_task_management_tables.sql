-- =============================================
-- Personal Task Management System
-- Tables for personal tasks with time blocking
-- =============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS personal_time_blocks CASCADE;
DROP TABLE IF EXISTS personal_tasks CASCADE;

-- Create personal_tasks table
CREATE TABLE personal_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100),
    tags TEXT[], -- Array of tags
    due_date TIMESTAMPTZ,
    estimated_duration INTEGER, -- Duration in minutes
    actual_duration INTEGER, -- Actual time spent in minutes
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern JSONB, -- Store recurring pattern details
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Indexes for better performance
    CONSTRAINT personal_tasks_user_id_idx UNIQUE (user_id, id)
);

-- Create personal_time_blocks table for 15-minute time blocking
CREATE TABLE personal_time_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES personal_tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    block_type VARCHAR(50) DEFAULT 'task' CHECK (block_type IN ('task', 'break', 'meeting', 'focus', 'personal', 'other')),
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure end_time is after start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    -- Ensure blocks are in 15-minute increments (optional constraint)
    CONSTRAINT fifteen_minute_blocks CHECK (
        EXTRACT(EPOCH FROM (end_time - start_time)) % 900 = 0
    )
);

-- Create indexes for better performance
CREATE INDEX idx_personal_tasks_user_id ON personal_tasks(user_id);
CREATE INDEX idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX idx_personal_tasks_priority ON personal_tasks(priority);
CREATE INDEX idx_personal_tasks_created_at ON personal_tasks(created_at);

CREATE INDEX idx_personal_time_blocks_user_id ON personal_time_blocks(user_id);
CREATE INDEX idx_personal_time_blocks_task_id ON personal_time_blocks(task_id);
CREATE INDEX idx_personal_time_blocks_start_time ON personal_time_blocks(start_time);
CREATE INDEX idx_personal_time_blocks_date_range ON personal_time_blocks(start_time, end_time);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_personal_tasks_updated_at 
    BEFORE UPDATE ON personal_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_time_blocks_updated_at 
    BEFORE UPDATE ON personal_time_blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_time_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personal_tasks
CREATE POLICY "Users can view their own personal tasks" 
    ON personal_tasks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal tasks" 
    ON personal_tasks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal tasks" 
    ON personal_tasks FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal tasks" 
    ON personal_tasks FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for personal_time_blocks
CREATE POLICY "Users can view their own time blocks" 
    ON personal_time_blocks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time blocks" 
    ON personal_time_blocks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks" 
    ON personal_time_blocks FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks" 
    ON personal_time_blocks FOR DELETE 
    USING (auth.uid() = user_id);

-- =============================================
-- Useful Views for Different Time Periods
-- =============================================

-- View for today's tasks and time blocks
CREATE OR REPLACE VIEW personal_today_view AS
SELECT 
    pt.id,
    pt.user_id,
    pt.title,
    pt.description,
    pt.status,
    pt.priority,
    pt.due_date,
    pt.estimated_duration,
    'task' as item_type,
    pt.created_at as start_time,
    NULL as end_time
FROM personal_tasks pt
WHERE pt.due_date::date = CURRENT_DATE
    AND pt.status != 'completed'

UNION ALL

SELECT 
    ptb.id,
    ptb.user_id,
    ptb.title,
    ptb.description,
    CASE WHEN ptb.is_completed THEN 'completed' ELSE 'pending' END as status,
    'medium' as priority,
    ptb.end_time as due_date,
    EXTRACT(EPOCH FROM (ptb.end_time - ptb.start_time))/60 as estimated_duration,
    'time_block' as item_type,
    ptb.start_time,
    ptb.end_time
FROM personal_time_blocks ptb
WHERE ptb.start_time::date = CURRENT_DATE;

-- View for this week's tasks
CREATE OR REPLACE VIEW personal_week_view AS
SELECT 
    pt.id,
    pt.user_id,
    pt.title,
    pt.description,
    pt.status,
    pt.priority,
    pt.due_date,
    pt.estimated_duration,
    'task' as item_type,
    pt.created_at as start_time,
    NULL as end_time
FROM personal_tasks pt
WHERE pt.due_date >= date_trunc('week', CURRENT_DATE)
    AND pt.due_date < date_trunc('week', CURRENT_DATE) + interval '1 week'
    AND pt.status != 'completed'

UNION ALL

SELECT 
    ptb.id,
    ptb.user_id,
    ptb.title,
    ptb.description,
    CASE WHEN ptb.is_completed THEN 'completed' ELSE 'pending' END as status,
    'medium' as priority,
    ptb.end_time as due_date,
    EXTRACT(EPOCH FROM (ptb.end_time - ptb.start_time))/60 as estimated_duration,
    'time_block' as item_type,
    ptb.start_time,
    ptb.end_time
FROM personal_time_blocks ptb
WHERE ptb.start_time >= date_trunc('week', CURRENT_DATE)
    AND ptb.start_time < date_trunc('week', CURRENT_DATE) + interval '1 week';

-- View for this month's tasks
CREATE OR REPLACE VIEW personal_month_view AS
SELECT 
    pt.id,
    pt.user_id,
    pt.title,
    pt.description,
    pt.status,
    pt.priority,
    pt.due_date,
    pt.estimated_duration,
    'task' as item_type,
    pt.created_at as start_time,
    NULL as end_time
FROM personal_tasks pt
WHERE pt.due_date >= date_trunc('month', CURRENT_DATE)
    AND pt.due_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
    AND pt.status != 'completed'

UNION ALL

SELECT 
    ptb.id,
    ptb.user_id,
    ptb.title,
    ptb.description,
    CASE WHEN ptb.is_completed THEN 'completed' ELSE 'pending' END as status,
    'medium' as priority,
    ptb.end_time as due_date,
    EXTRACT(EPOCH FROM (ptb.end_time - ptb.start_time))/60 as estimated_duration,
    'time_block' as item_type,
    ptb.start_time,
    ptb.end_time
FROM personal_time_blocks ptb
WHERE ptb.start_time >= date_trunc('month', CURRENT_DATE)
    AND ptb.start_time < date_trunc('month', CURRENT_DATE) + interval '1 month';

-- =============================================
-- Helper Functions
-- =============================================

-- Function to get available time slots for a specific date
CREATE OR REPLACE FUNCTION get_available_time_slots(
    target_date DATE,
    target_user_id UUID,
    start_hour INTEGER DEFAULT 9,
    end_hour INTEGER DEFAULT 17
)
RETURNS TABLE (
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ,
    is_available BOOLEAN
) AS $$
DECLARE
    current_slot TIMESTAMPTZ;
    slot_end_time TIMESTAMPTZ;
    day_start TIMESTAMPTZ;
    day_end TIMESTAMPTZ;
BEGIN
    -- Set the day boundaries
    day_start := target_date + (start_hour || ' hours')::INTERVAL;
    day_end := target_date + (end_hour || ' hours')::INTERVAL;
    
    current_slot := day_start;
    
    WHILE current_slot < day_end LOOP
        slot_end_time := current_slot + INTERVAL '15 minutes';
        
        RETURN QUERY
        SELECT 
            current_slot,
            slot_end_time,
            NOT EXISTS (
                SELECT 1 FROM personal_time_blocks ptb
                WHERE ptb.user_id = target_user_id
                AND ptb.start_time < slot_end_time
                AND ptb.end_time > current_slot
            ) as is_available;
            
        current_slot := slot_end_time;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to create recurring tasks
CREATE OR REPLACE FUNCTION create_recurring_task_instances(
    task_id UUID,
    end_date DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    task_record personal_tasks%ROWTYPE;
    instances_created INTEGER := 0;
    next_due_date TIMESTAMPTZ;
    max_date DATE;
BEGIN
    -- Get the task details
    SELECT * INTO task_record FROM personal_tasks WHERE id = task_id;
    
    IF NOT task_record.is_recurring OR task_record.recurring_pattern IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Set maximum date (default to 1 year from now)
    max_date := COALESCE(end_date, CURRENT_DATE + INTERVAL '1 year');
    
    next_due_date := task_record.due_date;
    
    -- Create instances based on recurring pattern
    WHILE next_due_date::DATE <= max_date LOOP
        -- Calculate next occurrence based on pattern
        CASE task_record.recurring_pattern->>'frequency'
            WHEN 'daily' THEN
                next_due_date := next_due_date + INTERVAL '1 day';
            WHEN 'weekly' THEN
                next_due_date := next_due_date + INTERVAL '1 week';
            WHEN 'monthly' THEN
                next_due_date := next_due_date + INTERVAL '1 month';
            ELSE
                EXIT; -- Unknown frequency, stop
        END CASE;
        
        -- Insert new task instance
        INSERT INTO personal_tasks (
            user_id, title, description, status, priority, category,
            tags, due_date, estimated_duration, is_recurring, recurring_pattern
        ) VALUES (
            task_record.user_id,
            task_record.title,
            task_record.description,
            'pending',
            task_record.priority,
            task_record.category,
            task_record.tags,
            next_due_date,
            task_record.estimated_duration,
            FALSE, -- Individual instances are not recurring
            NULL
        );
        
        instances_created := instances_created + 1;
    END LOOP;
    
    RETURN instances_created;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;
GRANT SELECT ON personal_today_view TO authenticated;
GRANT SELECT ON personal_week_view TO authenticated;
GRANT SELECT ON personal_month_view TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Personal Task Management System created successfully!';
    RAISE NOTICE 'Tables created: personal_tasks, personal_time_blocks';
    RAISE NOTICE 'Views created: personal_today_view, personal_week_view, personal_month_view';
    RAISE NOTICE 'RLS policies enabled for user privacy';
    RAISE NOTICE 'Helper functions created for time slot management and recurring tasks';
END $$;

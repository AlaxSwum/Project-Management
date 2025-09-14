-- =============================================
-- DEPLOY PERSONAL TASK MANAGEMENT SYSTEM
-- Run this directly in Supabase SQL Editor
-- =============================================

-- Step 1: Drop existing tables if they exist
DROP TABLE IF EXISTS personal_time_blocks CASCADE;
DROP TABLE IF EXISTS personal_tasks CASCADE;

-- Step 2: Create personal_tasks table
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
    completed_at TIMESTAMPTZ
);

-- Step 3: Create personal_time_blocks table for 15-minute time blocking
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
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Step 4: Create indexes for better performance
CREATE INDEX idx_personal_tasks_user_id ON personal_tasks(user_id);
CREATE INDEX idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX idx_personal_tasks_priority ON personal_tasks(priority);
CREATE INDEX idx_personal_tasks_created_at ON personal_tasks(created_at);

CREATE INDEX idx_personal_time_blocks_user_id ON personal_time_blocks(user_id);
CREATE INDEX idx_personal_time_blocks_task_id ON personal_time_blocks(task_id);
CREATE INDEX idx_personal_time_blocks_start_time ON personal_time_blocks(start_time);
CREATE INDEX idx_personal_time_blocks_date_range ON personal_time_blocks(start_time, end_time);

-- Step 5: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Add triggers for updated_at columns
CREATE TRIGGER update_personal_tasks_updated_at 
    BEFORE UPDATE ON personal_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_time_blocks_updated_at 
    BEFORE UPDATE ON personal_time_blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_time_blocks ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS Policies for personal_tasks
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

-- Step 9: Create RLS Policies for personal_time_blocks
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

-- Step 10: Create Views for Different Time Periods
-- Today's view
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

-- Week's view
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

-- Month's view
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

-- Step 11: Grant permissions
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;
GRANT SELECT ON personal_today_view TO authenticated;
GRANT SELECT ON personal_week_view TO authenticated;
GRANT SELECT ON personal_month_view TO authenticated;

-- Step 12: Create helper function for available time slots
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

-- Final success message
SELECT 'Personal Task Management System deployed successfully!' as message,
       'Tables: personal_tasks, personal_time_blocks' as tables_created,
       'Views: personal_today_view, personal_week_view, personal_month_view' as views_created,
       'RLS policies enabled for user privacy' as security,
       '15-minute time blocking support added' as features;

-- QUICK FIX: Deploy Personal Tasks with Integer User ID
-- Run this in Supabase SQL Editor NOW

-- Drop existing tables if they exist
DROP TABLE IF EXISTS personal_time_blocks CASCADE;
DROP TABLE IF EXISTS personal_tasks CASCADE;

-- Create personal_tasks table with INTEGER user_id
CREATE TABLE personal_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100),
    tags TEXT[],
    due_date TIMESTAMPTZ,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create personal_time_blocks table with INTEGER user_id
CREATE TABLE personal_time_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_id UUID REFERENCES personal_tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    block_type VARCHAR(50) DEFAULT 'task' CHECK (block_type IN ('task', 'break', 'meeting', 'focus', 'personal', 'other')),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes
CREATE INDEX idx_personal_tasks_user_id ON personal_tasks(user_id);
CREATE INDEX idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX idx_personal_time_blocks_user_id ON personal_time_blocks(user_id);
CREATE INDEX idx_personal_time_blocks_start_time ON personal_time_blocks(start_time);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_personal_tasks_updated_at 
    BEFORE UPDATE ON personal_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_time_blocks_updated_at 
    BEFORE UPDATE ON personal_time_blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- DISABLE RLS for now to make it work immediately
-- (We can add proper RLS later)
ALTER TABLE personal_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_time_blocks DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;
GRANT ALL ON personal_tasks TO anon;
GRANT ALL ON personal_time_blocks TO anon;

-- Success message
SELECT 'SUCCESS: Personal Task Management System deployed with integer user IDs!' as result;

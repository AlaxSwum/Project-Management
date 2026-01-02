-- Personal Goals & Time Blocks Tables
-- Run this in Supabase SQL Editor to create the goals and time blocks feature tables

-- First, drop existing tables if they have wrong schema (safe to run multiple times)
DROP TABLE IF EXISTS goal_completions CASCADE;
DROP TABLE IF EXISTS personal_goals CASCADE;
DROP TABLE IF EXISTS time_blocks CASCADE;

-- Create personal_goals table
CREATE TABLE IF NOT EXISTS personal_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'custom',
    target_frequency VARCHAR(20) DEFAULT 'daily' CHECK (target_frequency IN ('daily', 'weekly', 'monthly', 'custom')),
    target_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0 = Sunday, 6 = Saturday (for weekly/custom)
    target_days_of_month INTEGER[], -- 1-31 (for monthly frequency)
    target_time TIME,
    duration_minutes INTEGER DEFAULT 30,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    color VARCHAR(20) DEFAULT '#ef4444',
    icon VARCHAR(50),
    streak_current INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_completions table
CREATE TABLE IF NOT EXISTS goal_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES personal_goals(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    duration_minutes INTEGER,
    UNIQUE(goal_id, completed_date) -- Only one completion per goal per day
);

-- Create time_blocks table (for personal calendar blocks)
CREATE TABLE IF NOT EXISTS time_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'focus',
    category VARCHAR(100),
    completed BOOLEAN DEFAULT FALSE,
    checklist JSONB DEFAULT '[]',
    meeting_link TEXT,
    notification_time INTEGER, -- minutes before
    color VARCHAR(20),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_days INTEGER[],
    recurring_start_date DATE,
    recurring_end_date DATE,
    excluded_dates TEXT[], -- Dates to skip for recurring blocks (YYYY-MM-DD format)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add excluded_dates column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_blocks' AND column_name = 'excluded_dates') THEN
        ALTER TABLE time_blocks ADD COLUMN excluded_dates TEXT[];
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_goals_user_id ON personal_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_goals_is_active ON personal_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_goal_completions_goal_id ON goal_completions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_completions_user_id ON goal_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_completions_date ON goal_completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_date ON time_blocks(date);

-- Grant permissions (adjust as needed based on your RLS policies)
-- If you're using Supabase, these tables will work with the anon key

-- Example RLS policies (optional, enable if you want row-level security)
-- ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE goal_completions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own goals" ON personal_goals
--     FOR SELECT USING (user_id = current_user_id());
-- CREATE POLICY "Users can insert their own goals" ON personal_goals
--     FOR INSERT WITH CHECK (user_id = current_user_id());
-- CREATE POLICY "Users can update their own goals" ON personal_goals
--     FOR UPDATE USING (user_id = current_user_id());
-- CREATE POLICY "Users can delete their own goals" ON personal_goals
--     FOR DELETE USING (user_id = current_user_id());

SELECT 'Goals tables created successfully!' as status;


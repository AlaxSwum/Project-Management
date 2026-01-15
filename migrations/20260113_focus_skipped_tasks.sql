-- Focus Desktop App - Skipped Tasks Table
-- This table stores tasks that users skip with their reasons
-- Only used by the Focus desktop app

-- Create the skipped_tasks table
CREATE TABLE IF NOT EXISTS focus_skipped_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL, -- 'timeblock', 'meeting', 'todo', 'social'
    task_title TEXT NOT NULL,
    task_date DATE NOT NULL,
    skip_reason TEXT,
    skipped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_focus_skipped_tasks_user_id ON focus_skipped_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_skipped_tasks_task_date ON focus_skipped_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_focus_skipped_tasks_task_id ON focus_skipped_tasks(task_id);

-- Enable RLS
ALTER TABLE focus_skipped_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own skipped tasks"
    ON focus_skipped_tasks FOR SELECT
    USING (user_id = (SELECT id FROM auth_user WHERE id = user_id));

CREATE POLICY "Users can insert their own skipped tasks"
    ON focus_skipped_tasks FOR INSERT
    WITH CHECK (user_id = (SELECT id FROM auth_user WHERE id = user_id));

CREATE POLICY "Users can delete their own skipped tasks"
    ON focus_skipped_tasks FOR DELETE
    USING (user_id = (SELECT id FROM auth_user WHERE id = user_id));

-- Grant permissions
GRANT ALL ON focus_skipped_tasks TO authenticated;
GRANT ALL ON focus_skipped_tasks TO anon;

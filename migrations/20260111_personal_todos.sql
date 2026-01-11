-- Personal Todos Table for Quick Task Tracking
-- This table stores quick to-do items from conversations with start/deadline dates

-- Create personal_todos table (no foreign key to users - stores user_id as text/integer)
CREATE TABLE IF NOT EXISTS personal_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Can store integer or UUID as text
    task_name VARCHAR(500) NOT NULL,
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    duration DECIMAL(5,2) DEFAULT 1.0, -- hours to complete
    description TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'important', 'normal')),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_personal_todos_user_id ON personal_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_todos_deadline ON personal_todos(deadline);
CREATE INDEX IF NOT EXISTS idx_personal_todos_start_date ON personal_todos(start_date);
CREATE INDEX IF NOT EXISTS idx_personal_todos_completed ON personal_todos(completed);

-- Enable Row Level Security (RLS)
ALTER TABLE personal_todos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own todos (flexible to match user_id as text)
CREATE POLICY "Users can view own todos"
    ON personal_todos FOR SELECT
    USING (user_id = auth.uid()::text OR user_id = (auth.uid())::text);

-- Policy: Users can insert their own todos
CREATE POLICY "Users can create own todos"
    ON personal_todos FOR INSERT
    WITH CHECK (true); -- Allow insert, user_id is set by the app

-- Policy: Users can update their own todos
CREATE POLICY "Users can update own todos"
    ON personal_todos FOR UPDATE
    USING (user_id = auth.uid()::text OR user_id = (auth.uid())::text);

-- Policy: Users can delete their own todos
CREATE POLICY "Users can delete own todos"
    ON personal_todos FOR DELETE
    USING (user_id = auth.uid()::text OR user_id = (auth.uid())::text);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_personal_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_personal_todos_updated_at ON personal_todos;
CREATE TRIGGER trigger_personal_todos_updated_at
    BEFORE UPDATE ON personal_todos
    FOR EACH ROW
    EXECUTE FUNCTION update_personal_todos_updated_at();

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_todos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_todos TO anon;

COMMENT ON TABLE personal_todos IS 'Personal quick to-do items with start date and deadline tracking';
COMMENT ON COLUMN personal_todos.task_name IS 'Name/title of the to-do item';
COMMENT ON COLUMN personal_todos.start_date IS 'Date when the task should start appearing';
COMMENT ON COLUMN personal_todos.deadline IS 'Date by which the task must be completed';
COMMENT ON COLUMN personal_todos.duration IS 'Estimated hours to complete the task';
COMMENT ON COLUMN personal_todos.priority IS 'Priority level: urgent, important, or normal';

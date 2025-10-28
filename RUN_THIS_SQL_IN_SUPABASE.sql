-- =============================================
-- PERSONAL TASKS CHECKLIST FEATURE
-- Run this in Supabase SQL Editor
-- =============================================

-- Create personal_task_checklist table for checklist items
CREATE TABLE IF NOT EXISTS personal_task_checklist (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL, -- References personal_tasks table
    user_id INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    item_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_task_checklist_task_id ON personal_task_checklist(task_id);
CREATE INDEX IF NOT EXISTS idx_personal_task_checklist_user_id ON personal_task_checklist(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_task_checklist_order ON personal_task_checklist(task_id, item_order);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_personal_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at column
DROP TRIGGER IF EXISTS update_personal_task_checklist_updated_at ON personal_task_checklist;
CREATE TRIGGER update_personal_task_checklist_updated_at 
    BEFORE UPDATE ON personal_task_checklist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_personal_checklist_updated_at();

-- Disable RLS for simplicity (since we're using user_id filtering)
ALTER TABLE personal_task_checklist DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON personal_task_checklist TO authenticated;
GRANT ALL ON personal_task_checklist TO anon;
GRANT USAGE, SELECT ON SEQUENCE personal_task_checklist_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE personal_task_checklist_id_seq TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Personal Task Checklist Feature created successfully!';
    RAISE NOTICE 'Table created: personal_task_checklist';
    RAISE NOTICE 'You can now add discussion points and checklists to personal tasks!';
END $$;

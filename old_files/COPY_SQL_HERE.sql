-- =============================================
-- COPY THIS ENTIRE SCRIPT TO SUPABASE SQL EDITOR
-- =============================================
-- Task Checklist Feature - Database Setup
-- =============================================

-- Create task_checklist_items table
CREATE TABLE IF NOT EXISTS task_checklist_items (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    item_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_task_checklist_task 
        FOREIGN KEY (task_id) 
        REFERENCES projects_meeting(id) 
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_checklist_task_id ON task_checklist_items(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_user_id ON task_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_order ON task_checklist_items(task_id, item_order);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at column
DROP TRIGGER IF EXISTS update_task_checklist_updated_at ON task_checklist_items;
CREATE TRIGGER update_task_checklist_updated_at 
    BEFORE UPDATE ON task_checklist_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_checklist_updated_at();

-- Enable RLS
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own task checklist items" ON task_checklist_items;
DROP POLICY IF EXISTS "Users can insert their own task checklist items" ON task_checklist_items;
DROP POLICY IF EXISTS "Users can update their own task checklist items" ON task_checklist_items;
DROP POLICY IF EXISTS "Users can delete their own task checklist items" ON task_checklist_items;

-- RLS Policies for task_checklist_items
CREATE POLICY "Users can view their own task checklist items" 
    ON task_checklist_items FOR SELECT 
    USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

CREATE POLICY "Users can insert their own task checklist items" 
    ON task_checklist_items FOR INSERT 
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::INTEGER);

CREATE POLICY "Users can update their own task checklist items" 
    ON task_checklist_items FOR UPDATE 
    USING (user_id = current_setting('app.current_user_id', true)::INTEGER)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::INTEGER);

CREATE POLICY "Users can delete their own task checklist items" 
    ON task_checklist_items FOR DELETE 
    USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

-- Grant necessary permissions
GRANT ALL ON task_checklist_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE task_checklist_items_id_seq TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Task Checklist Feature deployed successfully!';
    RAISE NOTICE 'Table created: task_checklist_items';
    RAISE NOTICE 'You can now add to-do lists to your personal tasks!';
END $$;


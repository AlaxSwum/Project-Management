-- Create task assignees many-to-many relationship table for Supabase
-- This enables multiple assignees per task functionality
-- Run this in Supabase SQL Editor

-- First, add assignee_ids column to projects_task table for frontend compatibility
ALTER TABLE projects_task 
ADD COLUMN IF NOT EXISTS assignee_ids INTEGER[] DEFAULT '{}';

-- Create task_assignees junction table for proper many-to-many relationship
CREATE TABLE IF NOT EXISTS task_assignees (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES projects_task(id) ON DELETE CASCADE,
    assignee_id INTEGER NOT NULL, -- References auth_user.id
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by INTEGER, -- References auth_user.id (who assigned this person)
    UNIQUE(task_id, assignee_id) -- Prevent duplicate assignments
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_assignee_id ON task_assignees(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_assigned_at ON task_assignees(assigned_at DESC);

-- Create function to sync assignee_ids array with task_assignees table
CREATE OR REPLACE FUNCTION sync_task_assignees()
RETURNS TRIGGER AS $$
BEGIN
    -- When assignee_ids is updated, sync with task_assignees table
    IF TG_OP = 'UPDATE' AND OLD.assignee_ids IS DISTINCT FROM NEW.assignee_ids THEN
        -- Delete existing assignees for this task
        DELETE FROM task_assignees WHERE task_id = NEW.id;
        
        -- Insert new assignees if assignee_ids is not empty
        IF NEW.assignee_ids IS NOT NULL AND array_length(NEW.assignee_ids, 1) > 0 THEN
            INSERT INTO task_assignees (task_id, assignee_id, assigned_by)
            SELECT NEW.id, unnest(NEW.assignee_ids), NEW.created_by
            ON CONFLICT (task_id, assignee_id) DO NOTHING;
        END IF;
    END IF;
    
    -- When inserting a new task with assignee_ids
    IF TG_OP = 'INSERT' AND NEW.assignee_ids IS NOT NULL AND array_length(NEW.assignee_ids, 1) > 0 THEN
        INSERT INTO task_assignees (task_id, assignee_id, assigned_by)
        SELECT NEW.id, unnest(NEW.assignee_ids), NEW.created_by
        ON CONFLICT (task_id, assignee_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync assignee_ids with task_assignees table
DROP TRIGGER IF EXISTS trigger_sync_task_assignees ON projects_task;
CREATE TRIGGER trigger_sync_task_assignees
    AFTER INSERT OR UPDATE ON projects_task
    FOR EACH ROW
    EXECUTE FUNCTION sync_task_assignees();

-- Create function to update assignee_ids when task_assignees table changes
CREATE OR REPLACE FUNCTION update_assignee_ids_array()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the assignee_ids array in projects_task table
    UPDATE projects_task 
    SET assignee_ids = COALESCE((
        SELECT array_agg(assignee_id ORDER BY assignee_id)
        FROM task_assignees 
        WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
    ), '{}')
    WHERE id = COALESCE(NEW.task_id, OLD.task_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update assignee_ids when task_assignees changes
DROP TRIGGER IF EXISTS trigger_update_assignee_ids ON task_assignees;
CREATE TRIGGER trigger_update_assignee_ids
    AFTER INSERT OR UPDATE OR DELETE ON task_assignees
    FOR EACH ROW
    EXECUTE FUNCTION update_assignee_ids_array();

-- Create a view for easy querying of tasks with their assignees
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
    t.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', ta.assignee_id,
                'assigned_at', ta.assigned_at,
                'assigned_by', ta.assigned_by
            ) ORDER BY ta.assigned_at
        ) FILTER (WHERE ta.assignee_id IS NOT NULL),
        '[]'::json
    ) as assignee_details
FROM projects_task t
LEFT JOIN task_assignees ta ON t.id = ta.task_id
GROUP BY t.id;

-- Add comment for documentation
COMMENT ON TABLE task_assignees IS 'Many-to-many relationship table for task assignees, enabling multiple assignees per task';
COMMENT ON COLUMN projects_task.assignee_ids IS 'Array of assignee IDs for frontend compatibility, automatically synced with task_assignees table';
COMMENT ON VIEW tasks_with_assignees IS 'View that includes task details with assignee information for easy querying';

-- Example usage:
-- To assign multiple users to a task:
-- UPDATE projects_task SET assignee_ids = ARRAY[1, 2, 3] WHERE id = 123;
-- 
-- To query tasks with assignees:
-- SELECT * FROM tasks_with_assignees WHERE id = 123; 
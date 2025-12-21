-- Link Timeline Folders to Projects and Timeline Items to Tasks
-- This allows bi-directional sync between Timeline and Dashboard

-- Add timeline_folder_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS timeline_folder_id INTEGER REFERENCES timeline_folders(id) ON DELETE SET NULL;

-- Add timeline_item_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timeline_item_id INTEGER REFERENCES timeline_items(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_timeline_folder ON projects(timeline_folder_id);
CREATE INDEX IF NOT EXISTS idx_tasks_timeline_item ON tasks(timeline_item_id);

-- Function to sync timeline item status to task status
CREATE OR REPLACE FUNCTION sync_timeline_to_task()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE tasks
    SET 
      status = CASE 
        WHEN NEW.status = 'not_started' THEN 'todo'
        WHEN NEW.status = 'in_progress' THEN 'in_progress'
        WHEN NEW.status = 'completed' THEN 'done'
        WHEN NEW.status = 'on_hold' THEN 'blocked'
        ELSE 'todo'
      END,
      updated_at = NOW()
    WHERE timeline_item_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for syncing
DROP TRIGGER IF EXISTS sync_timeline_status ON timeline_items;
CREATE TRIGGER sync_timeline_status
  AFTER UPDATE ON timeline_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_timeline_to_task();

-- Function to sync task status back to timeline item
CREATE OR REPLACE FUNCTION sync_task_to_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.timeline_item_id IS NOT NULL THEN
    UPDATE timeline_items
    SET 
      status = CASE 
        WHEN NEW.status = 'todo' THEN 'not_started'
        WHEN NEW.status = 'in_progress' THEN 'in_progress'
        WHEN NEW.status = 'done' THEN 'completed'
        WHEN NEW.status = 'blocked' THEN 'on_hold'
        ELSE 'not_started'
      END,
      completion_percentage = CASE WHEN NEW.status = 'done' THEN 100 ELSE completion_percentage END
    WHERE id = NEW.timeline_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reverse syncing
DROP TRIGGER IF EXISTS sync_task_status ON tasks;
CREATE TRIGGER sync_task_status
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_task_to_timeline();

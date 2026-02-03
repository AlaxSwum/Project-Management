-- =============================================
-- UPDATE: Add Team Member Assignment to Checklist
-- Run this if you already ran create_timeline_roadmap_system.sql
-- =============================================

-- Add assigned_user_id column to timeline_item_checklist table
ALTER TABLE timeline_item_checklist 
ADD COLUMN IF NOT EXISTS assigned_user_id INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_timeline_checklist_assigned_user ON timeline_item_checklist(assigned_user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Timeline checklist updated successfully!';
    RAISE NOTICE 'You can now assign team members to checklist items.';
END $$;



-- Fix timeline_folder_members role constraint to allow 'admin' and 'member' roles

-- First, drop the existing check constraint
ALTER TABLE timeline_folder_members 
DROP CONSTRAINT IF EXISTS timeline_folder_members_role_check;

-- Update any existing roles to new format
UPDATE timeline_folder_members SET role = 'admin' WHERE role IN ('owner', 'manager');
UPDATE timeline_folder_members SET role = 'member' WHERE role IN ('editor', 'viewer');

-- Add new check constraint with correct roles
ALTER TABLE timeline_folder_members 
ADD CONSTRAINT timeline_folder_members_role_check 
CHECK (role IN ('admin', 'member', 'owner'));

-- Confirm the change
SELECT 'Role constraint updated successfully' as status;

-- Fix Personal Calendar Privacy
-- This script ensures personal calendar events are only visible to their creators

-- Enable RLS on projects_meeting table if not already enabled
ALTER TABLE projects_meeting ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view accessible meetings" ON projects_meeting;
DROP POLICY IF EXISTS "Users can create meetings in accessible projects" ON projects_meeting;
DROP POLICY IF EXISTS "Users can update meetings they created or attend" ON projects_meeting;
DROP POLICY IF EXISTS "Users can delete meetings they created" ON projects_meeting;

-- Create comprehensive RLS policies for projects_meeting table
-- Policy 1: Users can view meetings they created or are assigned to
CREATE POLICY "Users can view their own meetings or assigned meetings" ON projects_meeting
    FOR SELECT USING (
        -- User created the meeting
        created_by_id = auth.uid()::integer
        OR 
        -- User is in attendee_ids array
        (attendee_ids IS NOT NULL AND auth.uid()::integer = ANY(attendee_ids))
        OR
        -- User has access to the project (for project meetings)
        (project_id IS NOT NULL AND project_id IN (
            SELECT p.id FROM projects p 
            WHERE p.created_by = auth.uid()::integer
            OR p.id IN (
                SELECT t.project_id FROM tasks t 
                WHERE t.assignee = auth.uid()::integer OR t.created_by = auth.uid()::integer
            )
        ))
    );

-- Policy 2: Users can create meetings in projects they have access to
CREATE POLICY "Users can create meetings in accessible projects" ON projects_meeting
    FOR INSERT WITH CHECK (
        -- User can create personal events (no project_id) as themselves
        (project_id IS NULL AND created_by_id = auth.uid()::integer)
        OR
        -- User can create meetings in projects they have access to
        (project_id IS NOT NULL AND project_id IN (
            SELECT p.id FROM projects p 
            WHERE p.created_by = auth.uid()::integer
            OR p.id IN (
                SELECT t.project_id FROM tasks t 
                WHERE t.assignee = auth.uid()::integer OR t.created_by = auth.uid()::integer
            )
        ) AND created_by_id = auth.uid()::integer)
    );

-- Policy 3: Users can update meetings they created or are assigned to
CREATE POLICY "Users can update their own meetings or assigned meetings" ON projects_meeting
    FOR UPDATE USING (
        -- User created the meeting
        created_by_id = auth.uid()::integer
        OR 
        -- User is in attendee_ids array
        (attendee_ids IS NOT NULL AND auth.uid()::integer = ANY(attendee_ids))
    );

-- Policy 4: Users can delete meetings they created
CREATE POLICY "Users can delete meetings they created" ON projects_meeting
    FOR DELETE USING (created_by_id = auth.uid()::integer);

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_projects_meeting_created_by ON projects_meeting(created_by_id);
CREATE INDEX IF NOT EXISTS idx_projects_meeting_attendee_ids ON projects_meeting USING gin(attendee_ids);
CREATE INDEX IF NOT EXISTS idx_projects_meeting_project_id ON projects_meeting(project_id);

-- Add comment explaining the privacy model
COMMENT ON TABLE projects_meeting IS 'Meetings table with RLS enabled - users can only see meetings they created, are assigned to, or have project access for';

SELECT 'Personal calendar privacy policies created successfully!' as message,
       'Users can now only see their own personal events and assigned meetings' as status; 
-- Add attendee_ids column to projects_meeting table for proper attendee assignment
-- This enables users to be assigned to meetings via ID array instead of just string names

-- Check if column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects_meeting' 
        AND column_name = 'attendee_ids'
    ) THEN
        ALTER TABLE projects_meeting 
        ADD COLUMN attendee_ids integer[];
        
        COMMENT ON COLUMN projects_meeting.attendee_ids IS 'Array of user IDs assigned as attendees to this meeting';
        
        RAISE NOTICE 'Added attendee_ids column to projects_meeting table';
    ELSE
        RAISE NOTICE 'attendee_ids column already exists in projects_meeting table';
    END IF;
END $$;

-- Create index for efficient querying of attendee assignments
CREATE INDEX IF NOT EXISTS idx_projects_meeting_attendee_ids 
ON projects_meeting USING gin(attendee_ids);

COMMENT ON INDEX idx_projects_meeting_attendee_ids IS 'GIN index for efficient attendee_ids array queries';

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects_meeting' 
AND column_name IN ('attendees', 'attendee_ids')
ORDER BY column_name;

RAISE NOTICE 'attendee_ids column setup completed successfully'; 
-- Add agenda_items column to projects_meeting table
-- This stores an array of agenda item strings for each meeting

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects_meeting' 
        AND column_name = 'agenda_items'
    ) THEN
        ALTER TABLE projects_meeting 
        ADD COLUMN agenda_items TEXT[] DEFAULT NULL;
        
        RAISE NOTICE 'Added agenda_items column to projects_meeting table';
    ELSE
        RAISE NOTICE 'agenda_items column already exists';
    END IF;
END $$;

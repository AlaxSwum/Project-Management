-- Add section columns to meeting_notes table
-- Run this in Supabase SQL Editor to add the new section fields for meeting notes

-- Add discussion_sections column (JSONB for storing array of sections)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' AND column_name = 'discussion_sections'
    ) THEN 
        ALTER TABLE meeting_notes ADD COLUMN discussion_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add decision_sections column
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' AND column_name = 'decision_sections'
    ) THEN 
        ALTER TABLE meeting_notes ADD COLUMN decision_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add action_sections column
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' AND column_name = 'action_sections'
    ) THEN 
        ALTER TABLE meeting_notes ADD COLUMN action_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add next_step_sections column
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' AND column_name = 'next_step_sections'
    ) THEN 
        ALTER TABLE meeting_notes ADD COLUMN next_step_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Create index for better query performance on sections
CREATE INDEX IF NOT EXISTS idx_meeting_notes_discussion_sections ON meeting_notes USING GIN (discussion_sections);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_decision_sections ON meeting_notes USING GIN (decision_sections);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_action_sections ON meeting_notes USING GIN (action_sections);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_next_step_sections ON meeting_notes USING GIN (next_step_sections);

-- Note: This migration is safe to run multiple times - it only adds columns if they don't exist


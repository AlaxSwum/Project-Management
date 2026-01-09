-- Meeting Notes Table and Section Columns
-- Run this in Supabase SQL Editor

-- First, create the meeting_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS meeting_notes (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    attendees TEXT[] DEFAULT '{}',
    discussion_points TEXT[] DEFAULT '{}',
    decisions_made TEXT[] DEFAULT '{}',
    action_items TEXT[] DEFAULT '{}',
    next_steps TEXT[] DEFAULT '{}',
    follow_up_date DATE,
    -- Section columns for organizing notes by person
    discussion_sections JSONB DEFAULT '[]'::jsonb,
    decision_sections JSONB DEFAULT '[]'::jsonb,
    action_sections JSONB DEFAULT '[]'::jsonb,
    next_step_sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add section columns if table already exists but columns are missing
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' AND column_name = 'discussion_sections'
    ) THEN 
        ALTER TABLE meeting_notes ADD COLUMN discussion_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' AND column_name = 'decision_sections'
    ) THEN 
        ALTER TABLE meeting_notes ADD COLUMN decision_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' AND column_name = 'action_sections'
    ) THEN 
        ALTER TABLE meeting_notes ADD COLUMN action_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' AND column_name = 'next_step_sections'
    ) THEN 
        ALTER TABLE meeting_notes ADD COLUMN next_step_sections JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes (meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_date ON meeting_notes (date);

-- Note: This migration is safe to run multiple times


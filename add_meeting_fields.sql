-- Add meeting_link and reminder_time columns to projects_meeting table
-- Run this in your Supabase SQL editor

-- Add meeting_link column for Zoom/Google Meet/Teams links
ALTER TABLE projects_meeting 
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Add reminder_time column for email notification (in minutes before meeting)
ALTER TABLE projects_meeting 
ADD COLUMN IF NOT EXISTS reminder_time INTEGER DEFAULT 15;

-- Add index for reminder queries (useful for scheduled reminder jobs)
CREATE INDEX IF NOT EXISTS idx_meetings_reminder 
ON projects_meeting (date, time, reminder_time) 
WHERE reminder_time IS NOT NULL AND reminder_time > 0;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects_meeting' 
AND column_name IN ('meeting_link', 'reminder_time');


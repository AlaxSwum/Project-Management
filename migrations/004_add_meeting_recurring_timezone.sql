-- Add timezone and recurring columns to projects_meeting table
ALTER TABLE projects_meeting
ADD COLUMN IF NOT EXISTS input_timezone TEXT DEFAULT 'UK',
ADD COLUMN IF NOT EXISTS display_timezones TEXT[] DEFAULT ARRAY['UK', 'MM'],
ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
ADD COLUMN IF NOT EXISTS excluded_dates TEXT[] DEFAULT ARRAY[]::TEXT[];

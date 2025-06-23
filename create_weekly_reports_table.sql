-- Create weekly reports table for Supabase
-- Run this in Supabase SQL Editor

-- Create weekly_reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL, -- Reference to auth_user.id
    employee_name TEXT NOT NULL,
    employee_email TEXT NOT NULL,
    project_id INTEGER REFERENCES projects_project(id) ON DELETE SET NULL,
    project_name TEXT,
    week_number INTEGER NOT NULL, -- Week number (1-53)
    year INTEGER NOT NULL, -- Year (2025, 2026, etc.)
    week_start_date DATE NOT NULL, -- Start date of the week
    week_end_date DATE NOT NULL, -- End date of the week
    date_range_display TEXT NOT NULL, -- "Week 25 – June 17 to June 23, 2025"
    key_activities TEXT NOT NULL, -- Key Activities Completed
    ongoing_tasks TEXT, -- Ongoing Tasks
    challenges TEXT, -- Challenges / Issues
    team_performance TEXT, -- Team Performance / KPIs
    next_week_priorities TEXT, -- Next Week's Priorities
    other_notes TEXT, -- Other Notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_reports_employee ON weekly_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_project ON weekly_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_number, year);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_date ON weekly_reports(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_created ON weekly_reports(created_at DESC);

-- Create unique constraint to prevent duplicate reports for same employee/week/year
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_reports_unique 
ON weekly_reports(employee_id, week_number, year, project_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_weekly_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_weekly_reports_updated_at
    BEFORE UPDATE ON weekly_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_reports_updated_at();

-- Disable RLS for simplicity (since we handle access control in code)
ALTER TABLE weekly_reports DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON weekly_reports TO authenticated;
GRANT ALL ON weekly_reports TO anon;
GRANT USAGE, SELECT ON SEQUENCE weekly_reports_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE weekly_reports_id_seq TO anon;

-- Insert sample weekly report for testing (optional)
-- Uncomment if you want test data
/*
INSERT INTO weekly_reports (
    employee_id, employee_name, employee_email, project_id, project_name,
    week_number, year, week_start_date, week_end_date, date_range_display,
    key_activities, ongoing_tasks, challenges, team_performance, next_week_priorities, other_notes
) VALUES (
    1, 'John Doe', 'john.doe@company.com', 1, 'Website Redesign',
    25, 2025, '2025-06-16', '2025-06-22', 'Week 25 – June 16 to June 22, 2025',
    'Completed user interface mockups, Implemented responsive design for mobile devices, Conducted user testing sessions',
    'Finalizing authentication system, Reviewing code with senior developer, Preparing presentation for stakeholders',
    'Facing integration issues with third-party API, Need clarification on design requirements for admin panel',
    'Team velocity: 85% sprint completion, Code review turnaround: 24hrs average, Bug resolution rate: 92%',
    'Deploy to staging environment, Complete API integration, Prepare demo for client meeting',
    'Team working well together. Recommend investing in better development tools for improved productivity.'
);
*/ 
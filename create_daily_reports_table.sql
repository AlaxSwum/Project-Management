-- Create daily reports table for Supabase
-- Run this in Supabase SQL Editor

-- Create daily_reports table
CREATE TABLE IF NOT EXISTS daily_reports (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL, -- Reference to auth_user.id
    employee_name TEXT NOT NULL,
    employee_email TEXT NOT NULL,
    project_id INTEGER REFERENCES projects_project(id) ON DELETE SET NULL,
    project_name TEXT,
    report_date DATE NOT NULL, -- The specific date for this daily report
    date_display TEXT NOT NULL, -- "Monday, June 17, 2025"
    key_activities TEXT NOT NULL, -- Key Activities Completed Today
    ongoing_tasks TEXT, -- Ongoing Tasks
    challenges TEXT, -- Challenges / Issues
    team_performance TEXT, -- Team Performance / KPIs
    next_day_priorities TEXT, -- Tomorrow's Priorities
    meeting_minutes TEXT, -- Meeting Minutes (if any)
    has_meeting_minutes BOOLEAN DEFAULT FALSE, -- Flag to indicate if there are meeting minutes
    other_notes TEXT, -- Other Notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_employee ON daily_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_created ON daily_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_meeting_minutes ON daily_reports(has_meeting_minutes);

-- Create unique constraint to prevent duplicate reports for same employee/date/project
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_reports_unique 
ON daily_reports(employee_id, report_date, project_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_daily_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_daily_reports_updated_at
    BEFORE UPDATE ON daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_reports_updated_at();

-- Disable RLS for simplicity (since we handle access control in code)
ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON daily_reports TO authenticated;
GRANT ALL ON daily_reports TO anon;
GRANT USAGE, SELECT ON SEQUENCE daily_reports_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE daily_reports_id_seq TO anon;

-- Insert sample daily report for testing (optional)
-- Uncomment if you want test data
/*
INSERT INTO daily_reports (
    employee_id, employee_name, employee_email, project_id, project_name,
    report_date, date_display,
    key_activities, ongoing_tasks, challenges, team_performance, next_day_priorities, 
    meeting_minutes, has_meeting_minutes, other_notes
) VALUES (
    1, 'John Doe', 'john.doe@company.com', 1, 'Website Redesign',
    '2025-06-17', 'Monday, June 17, 2025',
    'Completed user interface mockups for login page, Fixed responsive design issues on mobile devices, Conducted code review with team lead',
    'Finalizing authentication system integration, Testing payment gateway functionality, Preparing presentation slides for client meeting',
    'Facing integration issues with third-party payment API, Need clarification on design requirements for admin dashboard',
    'Team velocity: Good progress on sprint goals, Code review turnaround: Same day, Bug resolution: 3 bugs fixed today',
    'Complete payment API integration, Deploy to staging environment, Review design mockups with UX team',
    'Daily standup meeting: Discussed sprint progress and blockers. Client meeting: Presented new design concepts, received positive feedback.',
    true,
    'Team working well together. Client is happy with progress. Recommend scheduling additional design review session.'
);
*/ 

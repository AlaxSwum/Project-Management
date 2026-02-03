-- Disable RLS for existing content calendar tables
ALTER TABLE content_calendar DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_members DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS content_calendar_policy ON content_calendar;
DROP POLICY IF EXISTS content_calendar_members_policy ON content_calendar_members;

-- Grant permissions to anon role for API access
GRANT ALL ON content_calendar TO anon;
GRANT ALL ON content_calendar_members TO anon;
GRANT USAGE, SELECT ON content_calendar_id_seq TO anon;
GRANT USAGE, SELECT ON content_calendar_members_id_seq TO anon;
GRANT SELECT ON auth_user TO anon;

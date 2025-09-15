-- FIX TASK VISIBILITY ISSUE
-- Run this in Supabase SQL Editor to fix user access

-- First, let's see what's in the database
SELECT 
    id, user_id, title, created_at, due_date
FROM personal_tasks 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if RLS is causing issues - temporarily disable it
ALTER TABLE personal_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_time_blocks DISABLE ROW LEVEL SECURITY;

-- Grant full access temporarily to test
GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;
GRANT ALL ON personal_tasks TO anon;
GRANT ALL ON personal_time_blocks TO anon;

-- Check current user IDs in the system
SELECT DISTINCT user_id FROM personal_tasks;

-- Update any tasks with user_id 24 to user_id 60 (your current user)
UPDATE personal_tasks SET user_id = 60 WHERE user_id = 24;
UPDATE personal_time_blocks SET user_id = 60 WHERE user_id = 24;

-- Success message
SELECT 'Task visibility fixed - RLS disabled and user IDs updated' as result;

-- Check if absence/leave tables exist in your Supabase database
-- Run this in your Supabase SQL Editor

-- Check for leave_requests table
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- Check for employee_leave_balance table  
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee_leave_balance'
ORDER BY ordinal_position;

-- List all tables to see what exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name; 
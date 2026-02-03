-- Create absence/leave management tables for Supabase
-- Run this ONLY if the tables don't exist yet

-- Create leave_requests table for employee absence management
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    employee_email TEXT NOT NULL,
    project_id INTEGER REFERENCES projects_project(id) ON DELETE SET NULL,
    project_name TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'family', 'medical', 'other')),
    reason TEXT NOT NULL,
    notes TEXT,
    days_requested INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by INTEGER,
    approved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_leave_balance table for tracking leave balances
CREATE TABLE IF NOT EXISTS employee_leave_balance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL UNIQUE,
    total_days INTEGER DEFAULT 14,
    used_days INTEGER DEFAULT 0,
    available_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
    year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_project_id ON leave_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_leave_balance_employee_id ON employee_leave_balance(employee_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leave_requests_updated_at') THEN
        CREATE TRIGGER update_leave_requests_updated_at 
        BEFORE UPDATE ON leave_requests 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employee_leave_balance_updated_at') THEN
        CREATE TRIGGER update_employee_leave_balance_updated_at 
        BEFORE UPDATE ON employee_leave_balance 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- Disable RLS (Row Level Security) for simplicity
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balance DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON leave_requests TO authenticated;
GRANT ALL ON employee_leave_balance TO authenticated;
GRANT ALL ON leave_requests TO anon;
GRANT ALL ON employee_leave_balance TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE leave_requests_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE employee_leave_balance_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE leave_requests_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE employee_leave_balance_id_seq TO anon;

-- Insert sample data to test (optional)
INSERT INTO leave_requests (
    employee_id, employee_name, employee_email, project_name,
    start_date, end_date, leave_type, reason, days_requested, status
) VALUES 
(1, 'John Doe', 'john.doe@company.com', 'Website Redesign',
 '2025-07-01', '2025-07-03', 'vacation', 'Family vacation', 3, 'pending'),
(2, 'Jane Smith', 'jane.smith@company.com', 'Mobile App Development', 
 '2025-07-10', '2025-07-12', 'sick', 'Medical appointment', 3, 'approved')
ON CONFLICT DO NOTHING;

-- Insert default leave balance for sample users (optional)
INSERT INTO employee_leave_balance (employee_id, total_days, used_days)
VALUES 
(1, 14, 0),
(2, 14, 3)
ON CONFLICT (employee_id) DO NOTHING; 
-- =====================================================
-- EMPLOYEE LEAVE MANAGEMENT SYSTEM
-- =====================================================
-- Complete absence/leave management for admin dashboard

-- Drop existing tables if they exist
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS employee_leave_balance CASCADE;
DROP TABLE IF EXISTS employee_leave_allocations CASCADE;
DROP TABLE IF EXISTS important_dates CASCADE;

-- 1. Create employee_leave_allocations table
-- This stores the leave allocation rules for each employee
CREATE TABLE employee_leave_allocations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    employee_email TEXT NOT NULL,
    
    -- Annual Leave
    annual_leave_total INTEGER DEFAULT 10,
    annual_leave_used INTEGER DEFAULT 0,
    annual_leave_remaining INTEGER GENERATED ALWAYS AS (annual_leave_total - annual_leave_used) STORED,
    annual_leave_max_per_request INTEGER DEFAULT 3,
    
    -- Sick Leave
    sick_leave_total INTEGER DEFAULT 24,
    sick_leave_used INTEGER DEFAULT 0,
    sick_leave_remaining INTEGER GENERATED ALWAYS AS (sick_leave_total - sick_leave_used) STORED,
    sick_leave_max_per_month INTEGER DEFAULT 7,
    
    -- Casual Leave
    casual_leave_total INTEGER DEFAULT 6,
    casual_leave_used INTEGER DEFAULT 0,
    casual_leave_remaining INTEGER GENERATED ALWAYS AS (casual_leave_total - casual_leave_used) STORED,
    casual_leave_max_per_month INTEGER DEFAULT 2,
    
    -- Metadata
    year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER,
    
    -- Unique constraint for employee per year
    UNIQUE(employee_id, year)
);

-- 2. Create leave_requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    employee_email TEXT NOT NULL,
    
    -- Leave Details
    leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Approval Details
    approved_by INTEGER,
    approved_by_name TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_days CHECK (days_requested > 0)
);

-- 3. Create important_dates table
-- These are dates when leave is not allowed (holidays, important company events, etc.)
CREATE TABLE important_dates (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'company_event' CHECK (type IN ('company_event', 'holiday', 'meeting', 'deadline')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER
);

-- Create indexes for better performance
CREATE INDEX idx_leave_allocations_employee_id ON employee_leave_allocations(employee_id);
CREATE INDEX idx_leave_allocations_year ON employee_leave_allocations(year);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_leave_type ON leave_requests(leave_type);
CREATE INDEX idx_important_dates_date ON important_dates(date);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_leave_allocations_updated_at ON employee_leave_allocations;
CREATE TRIGGER update_leave_allocations_updated_at 
BEFORE UPDATE ON employee_leave_allocations 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at 
BEFORE UPDATE ON leave_requests 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Disable RLS (Row Level Security) for simplicity
ALTER TABLE employee_leave_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE important_dates DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON employee_leave_allocations TO authenticated;
GRANT ALL ON leave_requests TO authenticated;
GRANT ALL ON important_dates TO authenticated;
GRANT ALL ON employee_leave_allocations TO anon;
GRANT ALL ON leave_requests TO anon;
GRANT ALL ON important_dates TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE employee_leave_allocations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE leave_requests_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE important_dates_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE employee_leave_allocations_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE leave_requests_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE important_dates_id_seq TO anon;

-- Insert some sample important dates
INSERT INTO important_dates (date, title, description, type) VALUES
('2025-12-25', 'Christmas Day', 'No leave allowed - Company holiday', 'holiday'),
('2025-01-01', 'New Year''s Day', 'No leave allowed - Company holiday', 'holiday'),
('2025-12-31', 'Year End', 'No leave allowed - Year end closing', 'company_event')
ON CONFLICT (date) DO NOTHING;

-- Create a function to validate leave requests
CREATE OR REPLACE FUNCTION validate_leave_request(
    p_employee_id INTEGER,
    p_leave_type TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_days_requested INTEGER
) RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_allocation RECORD;
    v_monthly_usage INTEGER;
    v_important_date RECORD;
    v_current_year INTEGER;
BEGIN
    v_current_year := EXTRACT(YEAR FROM p_start_date);
    
    -- Check if dates fall on important dates
    FOR v_important_date IN 
        SELECT * FROM important_dates 
        WHERE date BETWEEN p_start_date AND p_end_date
    LOOP
        RETURN QUERY SELECT FALSE, 'Leave not allowed on ' || v_important_date.title || ' (' || v_important_date.date || ')';
        RETURN;
    END LOOP;
    
    -- Get employee allocation
    SELECT * INTO v_allocation 
    FROM employee_leave_allocations 
    WHERE employee_id = p_employee_id AND year = v_current_year;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'No leave allocation found for employee';
        RETURN;
    END IF;
    
    -- Validate based on leave type
    IF p_leave_type = 'annual' THEN
        IF p_days_requested > v_allocation.annual_leave_max_per_request THEN
            RETURN QUERY SELECT FALSE, 'Annual leave: Maximum ' || v_allocation.annual_leave_max_per_request || ' days per request';
            RETURN;
        END IF;
        
        IF p_days_requested > v_allocation.annual_leave_remaining THEN
            RETURN QUERY SELECT FALSE, 'Insufficient annual leave balance. Available: ' || v_allocation.annual_leave_remaining || ' days';
            RETURN;
        END IF;
        
    ELSIF p_leave_type = 'sick' THEN
        -- Check monthly usage for sick leave
        SELECT COALESCE(SUM(days_requested), 0) INTO v_monthly_usage
        FROM leave_requests
        WHERE employee_id = p_employee_id
          AND leave_type = 'sick'
          AND status = 'approved'
          AND EXTRACT(YEAR FROM start_date) = v_current_year
          AND EXTRACT(MONTH FROM start_date) = EXTRACT(MONTH FROM p_start_date);
          
        IF (v_monthly_usage + p_days_requested) > v_allocation.sick_leave_max_per_month THEN
            RETURN QUERY SELECT FALSE, 'Sick leave: Maximum ' || v_allocation.sick_leave_max_per_month || ' days per month';
            RETURN;
        END IF;
        
        IF p_days_requested > v_allocation.sick_leave_remaining THEN
            RETURN QUERY SELECT FALSE, 'Insufficient sick leave balance. Available: ' || v_allocation.sick_leave_remaining || ' days';
            RETURN;
        END IF;
        
    ELSIF p_leave_type = 'casual' THEN
        -- Check monthly usage for casual leave
        SELECT COALESCE(SUM(days_requested), 0) INTO v_monthly_usage
        FROM leave_requests
        WHERE employee_id = p_employee_id
          AND leave_type = 'casual'
          AND status = 'approved'
          AND EXTRACT(YEAR FROM start_date) = v_current_year
          AND EXTRACT(MONTH FROM start_date) = EXTRACT(MONTH FROM p_start_date);
          
        IF (v_monthly_usage + p_days_requested) > v_allocation.casual_leave_max_per_month THEN
            RETURN QUERY SELECT FALSE, 'Casual leave: Maximum ' || v_allocation.casual_leave_max_per_month || ' days per month';
            RETURN;
        END IF;
        
        IF p_days_requested > v_allocation.casual_leave_remaining THEN
            RETURN QUERY SELECT FALSE, 'Insufficient casual leave balance. Available: ' || v_allocation.casual_leave_remaining || ' days';
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT TRUE, 'Leave request is valid';
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Employee Leave Management System created successfully!';
    RAISE NOTICE 'Tables created: employee_leave_allocations, leave_requests, important_dates';
END $$;


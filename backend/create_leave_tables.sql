-- Create leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    employee_email VARCHAR(254) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    days_requested INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by_id INTEGER,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee leave balance table
CREATE TABLE IF NOT EXISTS employee_leave_balance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    total_days INTEGER DEFAULT 14,
    used_days INTEGER DEFAULT 0,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, year)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_leave_balance_employee_year ON employee_leave_balance(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Insert sample leave balance for existing users
INSERT INTO employee_leave_balance (employee_id, total_days, used_days, year)
SELECT id, 14, 0, EXTRACT(YEAR FROM NOW())
FROM auth_user 
WHERE NOT EXISTS (
    SELECT 1 FROM employee_leave_balance 
    WHERE employee_id = auth_user.id 
    AND year = EXTRACT(YEAR FROM NOW())
); 
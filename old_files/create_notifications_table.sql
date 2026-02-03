-- Create notifications table for leave request workflow
-- Run this in Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL, -- User who should receive this notification
    sender_id INTEGER, -- User who triggered this notification (optional)
    type TEXT NOT NULL CHECK (type IN ('leave_request_submitted', 'leave_request_approved', 'leave_request_rejected', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data (leave request ID, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Disable RLS for simplicity (since we handle access control in code)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO anon;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO anon;

-- Insert some sample notifications for testing (optional)
-- Uncomment if you want test data
/*
INSERT INTO notifications (recipient_id, sender_id, type, title, message, data) VALUES
(1, 2, 'leave_request_submitted', 'New Leave Request', 'Employee John Doe has submitted a leave request for review.', '{"leave_request_id": 1, "employee_name": "John Doe", "days": 3}'),
(2, 1, 'leave_request_approved', 'Leave Request Approved', 'Your leave request from 2025-07-01 to 2025-07-03 has been approved.', '{"leave_request_id": 1, "status": "approved"}');
*/ 
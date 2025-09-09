-- Update notifications table to support task-related notifications
-- Run this in Supabase SQL Editor

-- Update the type constraint to include new notification types
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'leave_request_submitted', 
  'leave_request_approved', 
  'leave_request_rejected', 
  'general',
  'task_assigned',
  'task_reminder', 
  'task_status_changed',
  'task_completed',
  'task_overdue',
  'project_updated',
  'meeting_scheduled',
  'meeting_reminder'
));

-- Add indexes for better performance on task-related notifications
CREATE INDEX IF NOT EXISTS idx_notifications_task_type ON notifications(type) WHERE type LIKE 'task_%';
CREATE INDEX IF NOT EXISTS idx_notifications_created_unread ON notifications(created_at DESC, is_read) WHERE is_read = false;

-- Create a function to clean up old read notifications (optional - keeps DB clean)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
  -- Delete unread notifications older than 90 days (very old)
  DELETE FROM notifications 
  WHERE is_read = false 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- You can run this function periodically to clean up old notifications
-- SELECT cleanup_old_notifications();

-- Create a view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  recipient_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE type LIKE 'task_%') as task_notifications,
  COUNT(*) FILTER (WHERE type = 'task_assigned') as task_assignments,
  COUNT(*) FILTER (WHERE type = 'task_reminder') as task_reminders,
  MAX(created_at) as last_notification_at
FROM notifications 
GROUP BY recipient_id;

-- Grant access to the view
GRANT SELECT ON notification_stats TO authenticated;
GRANT SELECT ON notification_stats TO anon;

COMMENT ON TABLE notifications IS 'Stores in-app notifications for users including task assignments and reminders';
COMMENT ON VIEW notification_stats IS 'Provides notification statistics per user';

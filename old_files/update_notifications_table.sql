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

-- =====================================================
-- NOTIFICATION MANAGEMENT FORMS AND FUNCTIONS
-- =====================================================

-- Create function to send test notification
CREATE OR REPLACE FUNCTION create_test_notification(
    recipient_email TEXT,
    notification_type TEXT DEFAULT 'general',
    title TEXT DEFAULT 'Test Notification',
    message TEXT DEFAULT 'This is a test notification to verify the system is working.'
) RETURNS JSON AS $$
DECLARE
    recipient_user_id INTEGER;
    result JSON;
BEGIN
    -- Get recipient user ID from email
    SELECT id INTO recipient_user_id 
    FROM auth_user 
    WHERE email = recipient_email AND is_active = true;
    
    IF recipient_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'User not found with email: ' || recipient_email
        );
    END IF;
    
    -- Create the notification
    INSERT INTO notifications (
        recipient_id, 
        type, 
        title, 
        message, 
        data,
        is_read
    ) VALUES (
        recipient_user_id,
        notification_type,
        title,
        message,
        json_build_object(
            'test', true,
            'created_by', 'admin',
            'timestamp', NOW()
        ),
        false
    );
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Test notification created successfully for ' || recipient_email
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error creating notification: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to bulk create notifications for all users
CREATE OR REPLACE FUNCTION create_bulk_notification(
    notification_type TEXT DEFAULT 'general',
    title TEXT DEFAULT 'System Announcement',
    message TEXT DEFAULT 'This is a system-wide notification.'
) RETURNS JSON AS $$
DECLARE
    notification_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Create notification for all active users
    FOR user_record IN 
        SELECT id FROM auth_user WHERE is_active = true
    LOOP
        INSERT INTO notifications (
            recipient_id, 
            type, 
            title, 
            message, 
            data,
            is_read
        ) VALUES (
            user_record.id,
            notification_type,
            title,
            message,
            json_build_object(
                'bulk', true,
                'created_by', 'admin',
                'timestamp', NOW()
            ),
            false
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Created ' || notification_count || ' notifications for all users'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error creating bulk notifications: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
    user_email TEXT
) RETURNS JSON AS $$
DECLARE
    target_user_id INTEGER;
    updated_count INTEGER;
BEGIN
    -- Get user ID from email
    SELECT id INTO target_user_id 
    FROM auth_user 
    WHERE email = user_email AND is_active = true;
    
    IF target_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'User not found with email: ' || user_email
        );
    END IF;
    
    -- Mark all unread notifications as read
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE recipient_id = target_user_id AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Marked ' || updated_count || ' notifications as read for ' || user_email
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error marking notifications as read: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EXAMPLE USAGE FORMS (Copy and modify as needed)
-- =====================================================

-- FORM 1: Create Test Notification
-- Copy this block, modify the values, and run:
/*
SELECT create_test_notification(
    recipient_email => 'user@example.com',
    notification_type => 'general',
    title => 'Welcome to the System!',
    message => 'Welcome to our enhanced project management system with notifications!'
);
*/

-- FORM 2: Create Task Assignment Notification
-- Copy this block, modify the values, and run:
/*
SELECT create_test_notification(
    recipient_email => 'user@example.com',
    notification_type => 'task_assigned',
    title => 'New Task Assigned',
    message => 'You have been assigned to a new task: "Complete project documentation"'
);
*/

-- FORM 3: Create System-wide Announcement
-- Copy this block, modify the values, and run:
/*
SELECT create_bulk_notification(
    notification_type => 'general',
    title => 'System Update',
    message => 'The system has been updated with new features including 15-minute time blocking and enhanced password sharing!'
);
*/

-- FORM 4: Mark All Notifications as Read for a User
-- Copy this block, modify the email, and run:
/*
SELECT mark_all_notifications_read('user@example.com');
*/

-- FORM 5: View Notification Statistics
-- Copy this block and run to see notification stats:
/*
SELECT 
    au.email,
    au.name,
    ns.total_notifications,
    ns.unread_count,
    ns.task_notifications,
    ns.last_notification_at
FROM notification_stats ns
JOIN auth_user au ON ns.recipient_id = au.id
ORDER BY ns.unread_count DESC, ns.last_notification_at DESC;
*/

-- FORM 6: Clean Up Old Notifications
-- Copy this block and run to clean up old notifications:
/*
SELECT cleanup_old_notifications();
SELECT 'Old notifications cleaned up successfully!' as message;
*/

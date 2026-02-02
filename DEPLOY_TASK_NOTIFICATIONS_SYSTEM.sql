-- ========================================
-- TASK NOTIFICATIONS & REPORT-TO SYSTEM
-- ========================================
-- This SQL creates the report_to field and notification system
-- When tasks are updated, users in report_to receive notifications

-- Step 1: Add report_to column to projects_task table
-- This allows selecting multiple users who should be notified about task updates
ALTER TABLE projects_task 
ADD COLUMN IF NOT EXISTS report_to_ids INTEGER[] DEFAULT '{}';

COMMENT ON COLUMN projects_task.report_to_ids IS 'Array of user IDs who should receive notifications for this task';

-- Step 2: Create notifications table for task updates
CREATE TABLE IF NOT EXISTS task_notifications (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES projects_task(id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    -- Notification types: 'task_created', 'status_changed', 'comment_added', 'task_updated', 'assigned', 'mentioned'
    message TEXT NOT NULL,
    task_name TEXT NOT NULL,
    task_status VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    comment_text TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_notifications_recipient ON task_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_task_notifications_task ON task_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_created ON task_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_notifications_unread ON task_notifications(recipient_id, is_read) WHERE is_read = FALSE;

-- Step 3: Create notification preferences table (optional - for user settings)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    notify_on_status_change BOOLEAN DEFAULT TRUE,
    notify_on_comment BOOLEAN DEFAULT TRUE,
    notify_on_assigned BOOLEAN DEFAULT TRUE,
    notify_on_mention BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create function to automatically create notifications on task updates
CREATE OR REPLACE FUNCTION notify_task_update()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id_var INTEGER;
    sender_user_record RECORD;
BEGIN
    -- Get sender information
    SELECT id, name, email INTO sender_user_record
    FROM auth_user
    WHERE id = NEW.created_by_id;

    -- Notify all users in report_to_ids when task is updated
    IF TG_OP = 'UPDATE' THEN
        -- Status changed
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            -- Notify report_to users
            IF NEW.report_to_ids IS NOT NULL THEN
                FOREACH recipient_id_var IN ARRAY NEW.report_to_ids
                LOOP
                    IF recipient_id_var != NEW.created_by_id THEN -- Don't notify self
                        INSERT INTO task_notifications (
                            task_id,
                            project_id,
                            recipient_id,
                            sender_id,
                            notification_type,
                            message,
                            task_name,
                            task_status,
                            old_status,
                            new_status
                        ) VALUES (
                            NEW.id,
                            NEW.project_id,
                            recipient_id_var,
                            NEW.created_by_id,
                            'status_changed',
                            sender_user_record.name || ' changed task status from ' || OLD.status || ' to ' || NEW.status,
                            NEW.name,
                            NEW.status,
                            OLD.status,
                            NEW.status
                        );
                    END IF;
                END LOOP;
            END IF;

            -- Also notify assignees
            IF NEW.assignee_ids IS NOT NULL THEN
                FOREACH recipient_id_var IN ARRAY NEW.assignee_ids
                LOOP
                    IF recipient_id_var != NEW.created_by_id AND (NEW.report_to_ids IS NULL OR recipient_id_var != ALL(NEW.report_to_ids)) THEN
                        INSERT INTO task_notifications (
                            task_id,
                            project_id,
                            recipient_id,
                            sender_id,
                            notification_type,
                            message,
                            task_name,
                            task_status,
                            old_status,
                            new_status
                        ) VALUES (
                            NEW.id,
                            NEW.project_id,
                            recipient_id_var,
                            NEW.created_by_id,
                            'status_changed',
                            sender_user_record.name || ' moved task to ' || NEW.status,
                            NEW.name,
                            NEW.status,
                            OLD.status,
                            NEW.status
                        );
                    END IF;
                END LOOP;
            END IF;
        END IF;

        -- Task details updated (name, description, etc.)
        IF (OLD.name IS DISTINCT FROM NEW.name) OR 
           (OLD.description IS DISTINCT FROM NEW.description) OR
           (OLD.priority IS DISTINCT FROM NEW.priority) OR
           (OLD.due_date IS DISTINCT FROM NEW.due_date) THEN
            
            IF NEW.report_to_ids IS NOT NULL THEN
                FOREACH recipient_id_var IN ARRAY NEW.report_to_ids
                LOOP
                    IF recipient_id_var != NEW.created_by_id THEN
                        INSERT INTO task_notifications (
                            task_id,
                            project_id,
                            recipient_id,
                            sender_id,
                            notification_type,
                            message,
                            task_name,
                            task_status
                        ) VALUES (
                            NEW.id,
                            NEW.project_id,
                            recipient_id_var,
                            NEW.created_by_id,
                            'task_updated',
                            sender_user_record.name || ' updated task: ' || NEW.name,
                            NEW.name,
                            NEW.status
                        );
                    END IF;
                END LOOP;
            END IF;
        END IF;
    END IF;

    -- Notify when new task is created
    IF TG_OP = 'INSERT' THEN
        IF NEW.report_to_ids IS NOT NULL THEN
            FOREACH recipient_id_var IN ARRAY NEW.report_to_ids
            LOOP
                IF recipient_id_var != NEW.created_by_id THEN
                    INSERT INTO task_notifications (
                        task_id,
                        project_id,
                        recipient_id,
                        sender_id,
                        notification_type,
                        message,
                        task_name,
                        task_status
                    ) VALUES (
                        NEW.id,
                        NEW.project_id,
                        recipient_id_var,
                        NEW.created_by_id,
                        'task_created',
                        sender_user_record.name || ' created a new task: ' || NEW.name,
                        NEW.name,
                        NEW.status
                    );
                END IF;
            END LOOP;
        END IF;

        -- Notify assignees about new assignment
        IF NEW.assignee_ids IS NOT NULL THEN
            FOREACH recipient_id_var IN ARRAY NEW.assignee_ids
            LOOP
                IF recipient_id_var != NEW.created_by_id AND (NEW.report_to_ids IS NULL OR recipient_id_var != ALL(NEW.report_to_ids)) THEN
                    INSERT INTO task_notifications (
                        task_id,
                        project_id,
                        recipient_id,
                        sender_id,
                        notification_type,
                        message,
                        task_name,
                        task_status
                    ) VALUES (
                        NEW.id,
                        NEW.project_id,
                        recipient_id_var,
                        NEW.created_by_id,
                        'assigned',
                        sender_user_record.name || ' assigned you to: ' || NEW.name,
                        NEW.name,
                        NEW.status
                    );
                END IF;
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_task_update ON projects_task;

-- Create trigger for task updates
CREATE TRIGGER trigger_notify_task_update
    AFTER INSERT OR UPDATE ON projects_task
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_update();

-- Step 5: Create table for task comments (to track comment notifications)
CREATE TABLE IF NOT EXISTS task_comments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES projects_task(id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at DESC);

-- Step 6: Create function to notify on comments
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id_var INTEGER;
    sender_user_record RECORD;
    task_record RECORD;
BEGIN
    -- Get sender and task information
    SELECT id, name, email INTO sender_user_record
    FROM auth_user
    WHERE id = NEW.user_id;

    SELECT id, name, project_id, report_to_ids, assignee_ids INTO task_record
    FROM projects_task
    WHERE id = NEW.task_id;

    -- Notify report_to users
    IF task_record.report_to_ids IS NOT NULL THEN
        FOREACH recipient_id_var IN ARRAY task_record.report_to_ids
        LOOP
            IF recipient_id_var != NEW.user_id THEN
                INSERT INTO task_notifications (
                    task_id,
                    project_id,
                    recipient_id,
                    sender_id,
                    notification_type,
                    message,
                    task_name,
                    comment_text
                ) VALUES (
                    NEW.task_id,
                    NEW.project_id,
                    recipient_id_var,
                    NEW.user_id,
                    'comment_added',
                    sender_user_record.name || ' commented on: ' || task_record.name,
                    task_record.name,
                    NEW.comment_text
                );
            END IF;
        END LOOP;
    END IF;

    -- Also notify assignees
    IF task_record.assignee_ids IS NOT NULL THEN
        FOREACH recipient_id_var IN ARRAY task_record.assignee_ids
        LOOP
            IF recipient_id_var != NEW.user_id AND (task_record.report_to_ids IS NULL OR recipient_id_var != ALL(task_record.report_to_ids)) THEN
                INSERT INTO task_notifications (
                    task_id,
                    project_id,
                    recipient_id,
                    sender_id,
                    notification_type,
                    message,
                    task_name,
                    comment_text
                ) VALUES (
                    NEW.task_id,
                    NEW.project_id,
                    recipient_id_var,
                    NEW.user_id,
                    'comment_added',
                    sender_user_record.name || ' commented on: ' || task_record.name,
                    task_record.name,
                    NEW.comment_text
                );
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_task_comment ON task_comments;

-- Create trigger for comments
CREATE TRIGGER trigger_notify_task_comment
    AFTER INSERT ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_comment();

-- Step 7: Grant permissions
ALTER TABLE projects_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own notifications
CREATE POLICY IF NOT EXISTS "Users can view their own notifications"
    ON task_notifications FOR SELECT
    USING (recipient_id = current_setting('app.current_user_id')::INTEGER);

-- Allow users to update their notifications (mark as read)
CREATE POLICY IF NOT EXISTS "Users can update their own notifications"
    ON task_notifications FOR UPDATE
    USING (recipient_id = current_setting('app.current_user_id')::INTEGER);

-- Allow authenticated users to create comments
CREATE POLICY IF NOT EXISTS "Authenticated users can create comments"
    ON task_comments FOR INSERT
    WITH CHECK (true);

-- Allow users to view comments on tasks they have access to
CREATE POLICY IF NOT EXISTS "Users can view task comments"
    ON task_comments FOR SELECT
    USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON projects_task TO authenticated;
GRANT ALL ON task_notifications TO authenticated;
GRANT ALL ON task_comments TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE task_notifications_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE task_comments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notification_preferences_id_seq TO authenticated;

-- Step 8: Create helper function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM task_notifications
    WHERE recipient_id = user_id_param
    AND is_read = FALSE;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_unread_notification_count(INTEGER) TO authenticated;

-- Step 9: Create view for notification summary
CREATE OR REPLACE VIEW notification_summary AS
SELECT 
    tn.id,
    tn.task_id,
    tn.project_id,
    tn.recipient_id,
    tn.sender_id,
    tn.notification_type,
    tn.message,
    tn.task_name,
    tn.task_status,
    tn.old_status,
    tn.new_status,
    tn.comment_text,
    tn.is_read,
    tn.read_at,
    tn.created_at,
    sender.name as sender_name,
    sender.email as sender_email,
    project.name as project_name
FROM task_notifications tn
LEFT JOIN auth_user sender ON tn.sender_id = sender.id
LEFT JOIN projects_project project ON tn.project_id = project.id
ORDER BY tn.created_at DESC;

GRANT SELECT ON notification_summary TO authenticated;

-- ========================================
-- DEPLOYMENT INSTRUCTIONS
-- ========================================
-- 1. Copy this entire SQL
-- 2. Go to https://supabase.com/dashboard
-- 3. Select your project
-- 4. Go to SQL Editor
-- 5. Paste and click "Run"
-- 6. Verify success messages

-- ========================================
-- TESTING THE SYSTEM
-- ========================================
-- After deployment, test with:
-- 
-- 1. Create a task with report_to_ids:
--    INSERT INTO projects_task (name, project_id, created_by_id, report_to_ids)
--    VALUES ('Test Task', 1, 1, ARRAY[2, 3]);
--
-- 2. Check notifications were created:
--    SELECT * FROM task_notifications WHERE task_id = [new_task_id];
--
-- 3. Get unread count for a user:
--    SELECT get_unread_notification_count(2);
--
-- 4. View notification summary:
--    SELECT * FROM notification_summary WHERE recipient_id = 2;

-- ========================================
-- SUCCESS!
-- ========================================
-- After running this SQL:
-- ✅ report_to_ids field added to tasks
-- ✅ Notification system created
-- ✅ Automatic notifications on:
--    - Task created
--    - Status changed
--    - Task updated
--    - Comment added
--    - User assigned
-- ✅ Unread notification counter function
-- ✅ Notification summary view
-- ✅ All permissions granted

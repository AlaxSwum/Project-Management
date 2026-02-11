-- Remove users: maryaung246@gmail.com, htethtetmon@gmail.com, swumpyaesone.creative@gmail.com
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    admin_id INT;
    user_ids INT[];
BEGIN
    -- Get admin user (keep swumpyaesone.personal@gmail.com as fallback admin)
    SELECT id INTO admin_id FROM auth_user 
    WHERE email = 'swumpyaesone.personal@gmail.com' 
    LIMIT 1;

    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM auth_user 
        WHERE role = 'admin' OR is_superuser = true 
        ORDER BY id LIMIT 1;
    END IF;

    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found. Cannot reassign resources.';
    END IF;

    -- Get user IDs to delete
    SELECT ARRAY_AGG(id) INTO user_ids FROM auth_user WHERE email IN (
        'maryaung246@gmail.com',
        'htethtetmon@gmail.com',
        'swumpyaesone.creative@gmail.com'
    );

    IF user_ids IS NULL THEN 
        RAISE NOTICE 'No users found with these emails'; 
        RETURN; 
    END IF;

    -- REASSIGN ownership of shared resources to admin
    UPDATE projects_project SET created_by_id = admin_id WHERE created_by_id = ANY(user_ids);
    UPDATE projects_task SET created_by_id = admin_id WHERE created_by_id = ANY(user_ids);
    UPDATE conversations SET created_by_id = admin_id WHERE created_by_id = ANY(user_ids);

    -- Clear assignee on tasks (assignee will be removed)
    UPDATE projects_task SET assignee_id = NULL WHERE assignee_id = ANY(user_ids);

    -- Delete all references (order matters for FKs)
    DELETE FROM auth_user_groups WHERE user_id = ANY(user_ids);
    DELETE FROM auth_user_user_permissions WHERE user_id = ANY(user_ids);
    DELETE FROM django_admin_log WHERE user_id = ANY(user_ids);
    DELETE FROM token_blacklist_outstandingtoken WHERE user_id = ANY(user_ids);
    DELETE FROM classes_participants WHERE enrolled_by = ANY(user_ids);
    DELETE FROM classes_instructors WHERE assigned_by = ANY(user_ids) OR instructor_id = ANY(user_ids);
    DELETE FROM classes_members WHERE user_id = ANY(user_ids) OR added_by = ANY(user_ids);
    DELETE FROM classes WHERE created_by_id = ANY(user_ids);
    DELETE FROM classes_folders WHERE created_by_id = ANY(user_ids);
    DELETE FROM class_schedule_members WHERE user_id = ANY(user_ids);
    DELETE FROM class_schedule_folders WHERE created_by = ANY(user_ids);
    DELETE FROM class_schedule WHERE created_by = ANY(user_ids);
    DELETE FROM class_attendance_folders WHERE created_by = ANY(user_ids);
    DELETE FROM class_daily_attendance WHERE recorded_by = ANY(user_ids);
    DELETE FROM business_members WHERE user_id = ANY(user_ids) OR invited_by_id = ANY(user_ids);
    DELETE FROM businesses WHERE created_by_id = ANY(user_ids);
    DELETE FROM campaigns WHERE created_by_id = ANY(user_ids);
    DELETE FROM company_outreach_members WHERE user_id = ANY(user_ids) OR added_by = ANY(user_ids);
    DELETE FROM company_outreach_specializations WHERE created_by_id = ANY(user_ids);
    DELETE FROM company_outreach WHERE created_by_id = ANY(user_ids) OR contact_person_id = ANY(user_ids) OR follow_up_person_id = ANY(user_ids);
    DELETE FROM content_post_approvals WHERE approver_id = ANY(user_ids);
    DELETE FROM content_post_checklist WHERE completed_by_id = ANY(user_ids);
    DELETE FROM content_activity_log WHERE user_id = ANY(user_ids);
    DELETE FROM content_templates WHERE created_by_id = ANY(user_ids);
    DELETE FROM content_calendar_members WHERE user_id = ANY(user_ids);
    DELETE FROM content_calendar_folder_members WHERE user_id = ANY(user_ids);
    DELETE FROM content_calendar_folders WHERE created_by_id = ANY(user_ids);
    DELETE FROM content_calendar WHERE created_by_id = ANY(user_ids);
    -- content_posts: try created_by_id first (common schema)
    DELETE FROM content_post_targets WHERE post_id IN (SELECT id FROM content_posts WHERE created_by_id = ANY(user_ids));
    DELETE FROM content_posts WHERE created_by_id = ANY(user_ids);
    DELETE FROM messages WHERE sender_id = ANY(user_ids);
    DELETE FROM conversation_participants WHERE user_id = ANY(user_ids);
    DELETE FROM task_subtasks WHERE created_by_id = ANY(user_ids) OR completed_by_id = ANY(user_ids);
    DELETE FROM task_attachment_links WHERE user_id = ANY(user_ids);
    DELETE FROM task_comments WHERE user_id = ANY(user_ids);
    DELETE FROM task_categories WHERE created_by_id = ANY(user_ids);
    DELETE FROM task_activity_log WHERE user_id = ANY(user_ids);
    DELETE FROM task_notifications WHERE recipient_id = ANY(user_ids) OR sender_id = ANY(user_ids);
    DELETE FROM projects_taskattachment WHERE user_id = ANY(user_ids);
    DELETE FROM projects_taskcomment WHERE user_id = ANY(user_ids);
    DELETE FROM projects_meeting WHERE created_by_id = ANY(user_ids);
    DELETE FROM projects_projecttemplate WHERE created_by_id = ANY(user_ids);
    DELETE FROM project_custom_columns WHERE created_by_id = ANY(user_ids);
    DELETE FROM project_admins WHERE user_id = ANY(user_ids);
    DELETE FROM project_members WHERE user_id = ANY(user_ids) OR added_by_id = ANY(user_ids);
    DELETE FROM projects_project_members WHERE user_id = ANY(user_ids);
    DELETE FROM focus_skipped_tasks WHERE user_id = ANY(user_ids);
    DELETE FROM goal_completions WHERE user_id = ANY(user_ids);
    DELETE FROM personal_goals WHERE user_id = ANY(user_ids);
    DELETE FROM monthly_plan_templates WHERE created_by_id = ANY(user_ids);
    DELETE FROM notification_preferences WHERE user_id = ANY(user_ids);
    DELETE FROM time_blocks WHERE user_id = ANY(user_ids);
    DELETE FROM timeline_personal_todos WHERE member_id = ANY(user_ids);
    DELETE FROM timeline_item_allocations WHERE member_id = ANY(user_ids);
    DELETE FROM timeline_item_assignees WHERE member_id = ANY(user_ids);
    DELETE FROM timeline_member_capacity WHERE member_id = ANY(user_ids);
    DELETE FROM payroll_members WHERE user_id = ANY(user_ids) OR added_by = ANY(user_ids);
    DELETE FROM payroll_records WHERE created_by = ANY(user_ids);

    -- Delete password vault references if tables exist
    BEGIN
        DELETE FROM password_vault_folder_access WHERE user_id = ANY(user_ids);
        DELETE FROM password_vault_folder_members WHERE user_id = ANY(user_ids);
        DELETE FROM password_vault_folders WHERE created_by_id = ANY(user_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    -- Finally delete the users
    DELETE FROM auth_user WHERE id = ANY(user_ids);

    RAISE NOTICE 'Successfully deleted % users. Projects/tasks reassigned to admin ID %', array_length(user_ids, 1), admin_id;
END $$;

-- =====================================================
-- PROJECT ADMIN ACCESS CONTROL SYSTEM
-- =====================================================
-- Creates project-specific admin access control where
-- admins can only manage projects they are assigned to
-- =====================================================

-- 1. Create project_admins table for granular admin access control
CREATE TABLE IF NOT EXISTS project_admins (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects_project(id) ON DELETE CASCADE,
    admin_user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    
    -- Admin Permissions for this specific project
    can_create_users BOOLEAN DEFAULT true,
    can_edit_users BOOLEAN DEFAULT true,
    can_delete_users BOOLEAN DEFAULT false,
    can_manage_project BOOLEAN DEFAULT true,
    can_view_reports BOOLEAN DEFAULT true,
    can_assign_tasks BOOLEAN DEFAULT true,
    
    -- Audit Trail
    assigned_by INTEGER REFERENCES auth_user(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Prevent duplicate admin assignments per project
    UNIQUE(project_id, admin_user_id)
);

-- 2. Create project_user_creation_log for tracking user creation by project admins
CREATE TABLE IF NOT EXISTS project_user_creation_log (
    id SERIAL PRIMARY KEY,
    created_user_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_by_admin_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects_project(id) ON DELETE SET NULL,
    creation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_role VARCHAR(50), -- role assigned to the created user
    notes TEXT
);

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_admins_project_id ON project_admins(project_id);
CREATE INDEX IF NOT EXISTS idx_project_admins_admin_user_id ON project_admins(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_project_admins_active ON project_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_project_user_creation_log_project ON project_user_creation_log(project_id);
CREATE INDEX IF NOT EXISTS idx_project_user_creation_log_admin ON project_user_creation_log(created_by_admin_id);

-- 4. Create function to check if user is admin for specific project
CREATE OR REPLACE FUNCTION is_project_admin(user_id INTEGER, project_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM project_admins pa
        WHERE pa.admin_user_id = user_id 
        AND pa.project_id = project_id 
        AND pa.is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to get admin's accessible projects
CREATE OR REPLACE FUNCTION get_admin_projects(admin_user_id INTEGER)
RETURNS TABLE(
    project_id INTEGER,
    project_name TEXT,
    can_create_users BOOLEAN,
    can_edit_users BOOLEAN,
    can_delete_users BOOLEAN,
    can_manage_project BOOLEAN,
    can_view_reports BOOLEAN,
    can_assign_tasks BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.project_id,
        pp.name::TEXT as project_name,
        pa.can_create_users,
        pa.can_edit_users,
        pa.can_delete_users,
        pa.can_manage_project,
        pa.can_view_reports,
        pa.can_assign_tasks
    FROM project_admins pa
    JOIN projects_project pp ON pp.id = pa.project_id
    WHERE pa.admin_user_id = admin_user_id 
    AND pa.is_active = true
    ORDER BY pp.name;
END;
$$ LANGUAGE plpgsql;

-- 6. Create RLS policies for project_admins table
ALTER TABLE project_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own admin assignments
CREATE POLICY "Users can view their own project admin assignments" ON project_admins
    FOR SELECT TO authenticated 
    USING (admin_user_id = (SELECT id FROM auth_user WHERE id = auth.uid()::integer));

-- Policy: Super admins can manage all project admin assignments
CREATE POLICY "Super admins can manage all project admin assignments" ON project_admins
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE id = auth.uid()::integer 
            AND (role = 'admin' OR is_superuser = true)
        )
    );

-- 7. Grant permissions
GRANT SELECT ON project_admins TO authenticated;
GRANT ALL ON project_user_creation_log TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Insert example project admin assignment (adjust user_id and project_id as needed)
-- INSERT INTO project_admins (project_id, admin_user_id, assigned_by) 
-- VALUES (1, 50, 50) ON CONFLICT (project_id, admin_user_id) DO NOTHING;

-- Verification query
SELECT 'Project Admin Access System created successfully!' as status,
       (SELECT COUNT(*) FROM project_admins) as total_project_admin_assignments;

-- ========================================
-- PROJECT MEMBER ROLES SYSTEM
-- ========================================
-- Allows setting roles for project members (Owner, Admin, Member, Viewer)

-- Step 1: Create project members table with roles
CREATE TABLE IF NOT EXISTS project_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    -- Roles: 'owner', 'admin', 'member', 'viewer'
    can_edit BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_manage_members BOOLEAN DEFAULT FALSE,
    added_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
GRANT ALL ON project_members TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE project_members_id_seq TO authenticated;

-- Step 2: Add member to project function
CREATE OR REPLACE FUNCTION add_project_member(
    p_project_id BIGINT,
    p_user_id INTEGER,
    p_role VARCHAR(50) DEFAULT 'member'
)
RETURNS BIGINT AS $$
DECLARE
    v_member_id BIGINT;
    v_can_edit BOOLEAN;
    v_can_delete BOOLEAN;
    v_can_manage_members BOOLEAN;
BEGIN
    -- Set permissions based on role
    CASE p_role
        WHEN 'owner' THEN
            v_can_edit := TRUE;
            v_can_delete := TRUE;
            v_can_manage_members := TRUE;
        WHEN 'admin' THEN
            v_can_edit := TRUE;
            v_can_delete := TRUE;
            v_can_manage_members := TRUE;
        WHEN 'member' THEN
            v_can_edit := TRUE;
            v_can_delete := FALSE;
            v_can_manage_members := FALSE;
        WHEN 'viewer' THEN
            v_can_edit := FALSE;
            v_can_delete := FALSE;
            v_can_manage_members := FALSE;
        ELSE
            v_can_edit := TRUE;
            v_can_delete := FALSE;
            v_can_manage_members := FALSE;
    END CASE;
    
    -- Insert or update member
    INSERT INTO project_members (project_id, user_id, role, can_edit, can_delete, can_manage_members)
    VALUES (p_project_id, p_user_id, p_role, v_can_edit, v_can_delete, v_can_manage_members)
    ON CONFLICT (project_id, user_id)
    DO UPDATE SET 
        role = EXCLUDED.role,
        can_edit = EXCLUDED.can_edit,
        can_delete = EXCLUDED.can_delete,
        can_manage_members = EXCLUDED.can_manage_members
    RETURNING id INTO v_member_id;
    
    RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_project_member(BIGINT, INTEGER, VARCHAR) TO authenticated;

-- Step 3: Update member role function
CREATE OR REPLACE FUNCTION update_member_role(
    p_project_id BIGINT,
    p_user_id INTEGER,
    p_new_role VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
    UPDATE project_members
    SET role = p_new_role,
        can_edit = CASE 
            WHEN p_new_role IN ('owner', 'admin', 'member') THEN TRUE
            ELSE FALSE
        END,
        can_delete = CASE 
            WHEN p_new_role IN ('owner', 'admin') THEN TRUE
            ELSE FALSE
        END,
        can_manage_members = CASE 
            WHEN p_new_role IN ('owner', 'admin') THEN TRUE
            ELSE FALSE
        END
    WHERE project_id = p_project_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_member_role(BIGINT, INTEGER, VARCHAR) TO authenticated;

-- Step 4: View for project members with user details
CREATE OR REPLACE VIEW project_members_with_details AS
SELECT 
    pm.id,
    pm.project_id,
    pm.user_id,
    pm.role,
    pm.can_edit,
    pm.can_delete,
    pm.can_manage_members,
    pm.added_at,
    u.name as user_name,
    u.email as user_email,
    u.role as user_system_role,
    p.name as project_name
FROM project_members pm
LEFT JOIN auth_user u ON pm.user_id = u.id
LEFT JOIN projects_project p ON pm.project_id = p.id;

GRANT SELECT ON project_members_with_details TO authenticated;

-- ========================================
-- SUCCESS!
-- ========================================
-- After running this SQL:
-- ✅ project_members table created
-- ✅ Role-based permissions (Owner, Admin, Member, Viewer)
-- ✅ Functions to add/update member roles
-- ✅ View with user details
-- ✅ All permissions granted

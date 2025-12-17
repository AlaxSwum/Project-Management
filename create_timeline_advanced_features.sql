-- ============================================================================
-- TIMELINE ADVANCED FEATURES MIGRATION
-- Adds: Assignees, Allocations, Personal Todos, Member Capacity
-- ============================================================================

-- ============================================================================
-- TABLE 1: timeline_item_assignees
-- Tracks who is assigned to a timeline item and their allocation mode
-- ============================================================================
CREATE TABLE IF NOT EXISTS timeline_item_assignees (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    allocation_mode TEXT NOT NULL DEFAULT 'SPAN' CHECK (allocation_mode IN ('SPAN', 'DAILY')),
    allocation_effort_total NUMERIC(10,2) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, member_id)
);

-- ============================================================================
-- TABLE 2: timeline_item_allocations
-- Daily allocations for timeline items (for DAILY mode or generated from SPAN)
-- ============================================================================
CREATE TABLE IF NOT EXISTS timeline_item_allocations (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    allocation_date DATE NOT NULL,
    phase TEXT DEFAULT 'Development',
    planned_effort NUMERIC(10,2) DEFAULT 1,
    actual_effort NUMERIC(10,2) DEFAULT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: timeline_personal_todos
-- Standalone personal todos per member per day
-- ============================================================================
CREATE TABLE IF NOT EXISTS timeline_personal_todos (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES timeline_folders(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    todo_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    linked_item_id INTEGER DEFAULT NULL REFERENCES timeline_items(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    planned_effort NUMERIC(10,2) DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE 4: timeline_member_capacity
-- Member capacity settings per folder
-- ============================================================================
CREATE TABLE IF NOT EXISTS timeline_member_capacity (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES timeline_folders(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    unit TEXT DEFAULT 'tasks' CHECK (unit IN ('tasks', 'hours', 'points')),
    capacity_per_day NUMERIC(10,2) DEFAULT 8,
    capacity_per_week NUMERIC(10,2) DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(folder_id, member_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_timeline_item_assignees_item ON timeline_item_assignees(item_id);
CREATE INDEX IF NOT EXISTS idx_timeline_item_assignees_member ON timeline_item_assignees(member_id);
CREATE INDEX IF NOT EXISTS idx_timeline_item_assignees_item_member ON timeline_item_assignees(item_id, member_id);

CREATE INDEX IF NOT EXISTS idx_timeline_item_allocations_item ON timeline_item_allocations(item_id);
CREATE INDEX IF NOT EXISTS idx_timeline_item_allocations_member ON timeline_item_allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_timeline_item_allocations_date ON timeline_item_allocations(allocation_date);
CREATE INDEX IF NOT EXISTS idx_timeline_item_allocations_member_date ON timeline_item_allocations(member_id, allocation_date);
CREATE INDEX IF NOT EXISTS idx_timeline_item_allocations_status ON timeline_item_allocations(status);

CREATE INDEX IF NOT EXISTS idx_timeline_personal_todos_folder ON timeline_personal_todos(folder_id);
CREATE INDEX IF NOT EXISTS idx_timeline_personal_todos_member ON timeline_personal_todos(member_id);
CREATE INDEX IF NOT EXISTS idx_timeline_personal_todos_date ON timeline_personal_todos(todo_date);
CREATE INDEX IF NOT EXISTS idx_timeline_personal_todos_member_date ON timeline_personal_todos(member_id, todo_date);

CREATE INDEX IF NOT EXISTS idx_timeline_member_capacity_folder ON timeline_member_capacity(folder_id);
CREATE INDEX IF NOT EXISTS idx_timeline_member_capacity_member ON timeline_member_capacity(member_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE timeline_item_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_item_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_personal_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_member_capacity ENABLE ROW LEVEL SECURITY;

-- Helper function to check folder membership
CREATE OR REPLACE FUNCTION is_folder_member(p_folder_id INTEGER, p_user_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM timeline_folder_members 
        WHERE folder_id = p_folder_id AND user_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM timeline_folders 
        WHERE id = p_folder_id AND created_by_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get folder_id from item_id
CREATE OR REPLACE FUNCTION get_folder_id_from_item(p_item_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_folder_id INTEGER;
BEGIN
    SELECT folder_id INTO v_folder_id FROM timeline_items WHERE id = p_item_id;
    RETURN v_folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit folder
CREATE OR REPLACE FUNCTION can_edit_folder(p_folder_id INTEGER, p_user_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM timeline_folder_members 
        WHERE folder_id = p_folder_id AND user_id = p_user_id AND can_edit = TRUE
    ) OR EXISTS (
        SELECT 1 FROM timeline_folders 
        WHERE id = p_folder_id AND created_by_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can manage folder
CREATE OR REPLACE FUNCTION can_manage_folder(p_folder_id INTEGER, p_user_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM timeline_folder_members 
        WHERE folder_id = p_folder_id AND user_id = p_user_id AND (role = 'owner' OR role = 'manager')
    ) OR EXISTS (
        SELECT 1 FROM timeline_folders 
        WHERE id = p_folder_id AND created_by_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES: timeline_item_assignees
-- ============================================================================
DROP POLICY IF EXISTS assignees_select_policy ON timeline_item_assignees;
CREATE POLICY assignees_select_policy ON timeline_item_assignees
    FOR SELECT USING (
        is_folder_member(get_folder_id_from_item(item_id), (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS assignees_insert_policy ON timeline_item_assignees;
CREATE POLICY assignees_insert_policy ON timeline_item_assignees
    FOR INSERT WITH CHECK (
        can_edit_folder(get_folder_id_from_item(item_id), (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS assignees_update_policy ON timeline_item_assignees;
CREATE POLICY assignees_update_policy ON timeline_item_assignees
    FOR UPDATE USING (
        can_edit_folder(get_folder_id_from_item(item_id), (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS assignees_delete_policy ON timeline_item_assignees;
CREATE POLICY assignees_delete_policy ON timeline_item_assignees
    FOR DELETE USING (
        can_manage_folder(get_folder_id_from_item(item_id), (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

-- ============================================================================
-- RLS POLICIES: timeline_item_allocations
-- ============================================================================
DROP POLICY IF EXISTS allocations_select_policy ON timeline_item_allocations;
CREATE POLICY allocations_select_policy ON timeline_item_allocations
    FOR SELECT USING (
        is_folder_member(get_folder_id_from_item(item_id), (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS allocations_insert_policy ON timeline_item_allocations;
CREATE POLICY allocations_insert_policy ON timeline_item_allocations
    FOR INSERT WITH CHECK (
        can_edit_folder(get_folder_id_from_item(item_id), (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS allocations_update_policy ON timeline_item_allocations;
CREATE POLICY allocations_update_policy ON timeline_item_allocations
    FOR UPDATE USING (
        can_edit_folder(get_folder_id_from_item(item_id), (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS allocations_delete_policy ON timeline_item_allocations;
CREATE POLICY allocations_delete_policy ON timeline_item_allocations
    FOR DELETE USING (
        can_manage_folder(get_folder_id_from_item(item_id), (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

-- ============================================================================
-- RLS POLICIES: timeline_personal_todos
-- ============================================================================
DROP POLICY IF EXISTS todos_select_policy ON timeline_personal_todos;
CREATE POLICY todos_select_policy ON timeline_personal_todos
    FOR SELECT USING (
        is_folder_member(folder_id, (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS todos_insert_policy ON timeline_personal_todos;
CREATE POLICY todos_insert_policy ON timeline_personal_todos
    FOR INSERT WITH CHECK (
        can_edit_folder(folder_id, (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS todos_update_policy ON timeline_personal_todos;
CREATE POLICY todos_update_policy ON timeline_personal_todos
    FOR UPDATE USING (
        can_edit_folder(folder_id, (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
        OR member_id = (SELECT id FROM auth_user WHERE email = current_user LIMIT 1)
    );

DROP POLICY IF EXISTS todos_delete_policy ON timeline_personal_todos;
CREATE POLICY todos_delete_policy ON timeline_personal_todos
    FOR DELETE USING (
        can_manage_folder(folder_id, (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
        OR member_id = (SELECT id FROM auth_user WHERE email = current_user LIMIT 1)
    );

-- ============================================================================
-- RLS POLICIES: timeline_member_capacity
-- ============================================================================
DROP POLICY IF EXISTS capacity_select_policy ON timeline_member_capacity;
CREATE POLICY capacity_select_policy ON timeline_member_capacity
    FOR SELECT USING (
        is_folder_member(folder_id, (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS capacity_insert_policy ON timeline_member_capacity;
CREATE POLICY capacity_insert_policy ON timeline_member_capacity
    FOR INSERT WITH CHECK (
        can_manage_folder(folder_id, (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS capacity_update_policy ON timeline_member_capacity;
CREATE POLICY capacity_update_policy ON timeline_member_capacity
    FOR UPDATE USING (
        can_manage_folder(folder_id, (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

DROP POLICY IF EXISTS capacity_delete_policy ON timeline_member_capacity;
CREATE POLICY capacity_delete_policy ON timeline_member_capacity
    FOR DELETE USING (
        can_manage_folder(folder_id, (SELECT id FROM auth_user WHERE email = current_user LIMIT 1))
    );

-- ============================================================================
-- UPDATE TRIGGER FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_timeline_item_assignees_modtime ON timeline_item_assignees;
CREATE TRIGGER update_timeline_item_assignees_modtime
    BEFORE UPDATE ON timeline_item_assignees
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_timeline_item_allocations_modtime ON timeline_item_allocations;
CREATE TRIGGER update_timeline_item_allocations_modtime
    BEFORE UPDATE ON timeline_item_allocations
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_timeline_personal_todos_modtime ON timeline_personal_todos;
CREATE TRIGGER update_timeline_personal_todos_modtime
    BEFORE UPDATE ON timeline_personal_todos
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_timeline_member_capacity_modtime ON timeline_member_capacity;
CREATE TRIGGER update_timeline_member_capacity_modtime
    BEFORE UPDATE ON timeline_member_capacity
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- GRANT PERMISSIONS (for Supabase anon/authenticated roles)
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_item_assignees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_item_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_personal_todos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_member_capacity TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE timeline_item_assignees_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE timeline_item_allocations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE timeline_personal_todos_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE timeline_member_capacity_id_seq TO authenticated;

-- ============================================================================
-- SAMPLE DATA MIGRATION
-- This will generate allocations from existing team_member_ids on timeline_items
-- ============================================================================
-- Uncomment and run if you want to migrate existing assignments:
/*
INSERT INTO timeline_item_assignees (item_id, member_id, allocation_mode, allocation_effort_total)
SELECT 
    ti.id as item_id,
    unnest(ti.team_member_ids) as member_id,
    'SPAN' as allocation_mode,
    NULL as allocation_effort_total
FROM timeline_items ti
WHERE ti.team_member_ids IS NOT NULL 
  AND array_length(ti.team_member_ids, 1) > 0
ON CONFLICT (item_id, member_id) DO NOTHING;
*/

SELECT 'Timeline Advanced Features Migration Complete!' as status;

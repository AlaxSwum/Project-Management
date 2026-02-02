-- ========================================
-- CUSTOM COLUMNS SYSTEM (LIKE MONDAY.COM)
-- ========================================
-- Allows users to add custom fields/columns per project

-- Step 1: Create custom_columns table
CREATE TABLE IF NOT EXISTS project_custom_columns (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    column_name VARCHAR(100) NOT NULL,
    column_type VARCHAR(50) NOT NULL,
    -- Column types: 'text', 'number', 'date', 'status', 'person', 'dropdown', 'checkbox', 'url', 'email', 'phone', 'file'
    column_order INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    column_width INTEGER DEFAULT 150, -- Width in pixels
    options JSONB, -- For dropdown/status types: {"options": ["Option 1", "Option 2"]}
    default_value TEXT,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, column_name)
);

CREATE INDEX IF NOT EXISTS idx_custom_columns_project ON project_custom_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_columns_order ON project_custom_columns(project_id, column_order);

-- Step 2: Create custom_field_values table to store actual values
CREATE TABLE IF NOT EXISTS task_custom_field_values (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES projects_task(id) ON DELETE CASCADE,
    column_id BIGINT NOT NULL REFERENCES project_custom_columns(id) ON DELETE CASCADE,
    value TEXT, -- Stored as text, parsed based on column_type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, column_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_task ON task_custom_field_values(task_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_column ON task_custom_field_values(column_id);

-- Step 3: Add default columns for new projects
CREATE OR REPLACE FUNCTION create_default_project_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Add default columns to new project
    INSERT INTO project_custom_columns (project_id, column_name, column_type, column_order, column_width, is_visible) VALUES
    (NEW.id, 'Owner', 'person', 1, 120, true),
    (NEW.id, 'Status', 'status', 2, 130, true),
    (NEW.id, 'Due date', 'date', 3, 120, true),
    (NEW.id, 'Notes', 'text', 4, 200, true),
    (NEW.id, 'Files', 'file', 5, 100, true),
    (NEW.id, 'Timeline', 'text', 6, 150, true),
    (NEW.id, 'Last updated', 'date', 7, 130, true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_create_default_columns ON projects_project;

-- Create trigger to add default columns
CREATE TRIGGER trigger_create_default_columns
    AFTER INSERT ON projects_project
    FOR EACH ROW
    EXECUTE FUNCTION create_default_project_columns();

-- Step 4: Create view for tasks with custom fields
CREATE OR REPLACE VIEW task_with_custom_fields AS
SELECT 
    t.id as task_id,
    t.project_id,
    t.name as task_name,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.start_date,
    t.assignee_ids,
    t.report_to_ids,
    t.created_by_id,
    t.created_at,
    t.updated_at,
    jsonb_object_agg(
        COALESCE(cc.column_name, 'none'),
        COALESCE(cfv.value, '')
    ) FILTER (WHERE cc.id IS NOT NULL) as custom_fields
FROM projects_task t
LEFT JOIN task_custom_field_values cfv ON t.id = cfv.task_id
LEFT JOIN project_custom_columns cc ON cfv.column_id = cc.id
GROUP BY t.id;

GRANT SELECT ON task_with_custom_fields TO authenticated;

-- Step 5: Function to add custom column to project
CREATE OR REPLACE FUNCTION add_project_custom_column(
    p_project_id BIGINT,
    p_column_name VARCHAR(100),
    p_column_type VARCHAR(50),
    p_column_width INTEGER DEFAULT 150,
    p_options JSONB DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_column_id BIGINT;
    v_max_order INTEGER;
BEGIN
    -- Get max order
    SELECT COALESCE(MAX(column_order), 0) + 1 INTO v_max_order
    FROM project_custom_columns
    WHERE project_id = p_project_id;
    
    -- Insert new column
    INSERT INTO project_custom_columns (
        project_id,
        column_name,
        column_type,
        column_order,
        column_width,
        options
    ) VALUES (
        p_project_id,
        p_column_name,
        p_column_type,
        v_max_order,
        p_column_width,
        p_options
    )
    RETURNING id INTO v_column_id;
    
    RETURN v_column_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_project_custom_column(BIGINT, VARCHAR, VARCHAR, INTEGER, JSONB) TO authenticated;

-- Step 6: Function to update custom field value
CREATE OR REPLACE FUNCTION update_task_custom_field(
    p_task_id BIGINT,
    p_column_id BIGINT,
    p_value TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO task_custom_field_values (task_id, column_id, value, updated_at)
    VALUES (p_task_id, p_column_id, p_value, NOW())
    ON CONFLICT (task_id, column_id)
    DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_task_custom_field(BIGINT, BIGINT, TEXT) TO authenticated;

-- Step 7: Grant permissions
ALTER TABLE project_custom_columns DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_custom_field_values DISABLE ROW LEVEL SECURITY;

GRANT ALL ON project_custom_columns TO authenticated;
GRANT ALL ON task_custom_field_values TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE project_custom_columns_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE task_custom_field_values_id_seq TO authenticated;

-- ========================================
-- USAGE EXAMPLES
-- ========================================

-- Add a custom column to a project:
-- SELECT add_project_custom_column(1, 'Budget', 'number', 120, NULL);
-- SELECT add_project_custom_column(1, 'Priority Level', 'dropdown', 150, '{"options": ["Low", "Medium", "High", "Critical"]}');

-- Set custom field value for a task:
-- SELECT update_task_custom_field(1, 1, '5000'); -- Set Budget to 5000
-- SELECT update_task_custom_field(1, 2, 'High'); -- Set Priority Level to High

-- View tasks with custom fields:
-- SELECT * FROM task_with_custom_fields WHERE project_id = 1;

-- Get all columns for a project:
-- SELECT * FROM project_custom_columns WHERE project_id = 1 ORDER BY column_order;

-- ========================================
-- SUCCESS!
-- ========================================

-- ========================================
-- TASK CATEGORIES & SUB-CATEGORIES SYSTEM
-- ========================================
-- Hierarchical categories for better task organization

-- Step 1: Create task categories table
CREATE TABLE IF NOT EXISTS task_categories (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id BIGINT REFERENCES task_categories(id) ON DELETE CASCADE,
    -- NULL = top-level category, otherwise it's a sub-category
    color VARCHAR(20) DEFAULT '#71717A',
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_categories_project ON task_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_task_categories_parent ON task_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_task_categories_order ON task_categories(project_id, display_order);

-- Step 2: Add category_id to tasks table
ALTER TABLE projects_task 
ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES task_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_task_category ON projects_task(category_id);

COMMENT ON COLUMN projects_task.category_id IS 'Category this task belongs to (e.g., UI/UX Progress, Backend Development)';

-- Step 3: Create function to add category
CREATE OR REPLACE FUNCTION add_task_category(
    p_project_id BIGINT,
    p_category_name VARCHAR(100),
    p_parent_category_id BIGINT DEFAULT NULL,
    p_color VARCHAR(20) DEFAULT '#71717A'
)
RETURNS BIGINT AS $$
DECLARE
    v_category_id BIGINT;
    v_max_order INTEGER;
BEGIN
    -- Get max display order
    SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_max_order
    FROM task_categories
    WHERE project_id = p_project_id
    AND parent_category_id IS NOT DISTINCT FROM p_parent_category_id;
    
    -- Insert category
    INSERT INTO task_categories (
        project_id,
        category_name,
        parent_category_id,
        color,
        display_order
    ) VALUES (
        p_project_id,
        p_category_name,
        p_parent_category_id,
        p_color,
        v_max_order
    )
    RETURNING id INTO v_category_id;
    
    RETURN v_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_task_category(BIGINT, VARCHAR, BIGINT, VARCHAR) TO authenticated;

-- Step 4: Create view for categories with task counts
CREATE OR REPLACE VIEW category_with_counts AS
SELECT 
    c.id,
    c.project_id,
    c.category_name,
    c.parent_category_id,
    c.color,
    c.icon,
    c.display_order,
    c.is_active,
    parent.category_name as parent_category_name,
    (
        SELECT COUNT(*)
        FROM projects_task t
        WHERE t.category_id = c.id
    ) as task_count,
    (
        SELECT COUNT(*)
        FROM projects_task t
        WHERE t.category_id = c.id
        AND t.status = 'done'
    ) as completed_count
FROM task_categories c
LEFT JOIN task_categories parent ON c.parent_category_id = parent.id
WHERE c.is_active = TRUE
ORDER BY c.display_order;

GRANT SELECT ON category_with_counts TO authenticated;

-- Step 5: Create default categories for new projects
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Add default top-level categories
    INSERT INTO task_categories (project_id, category_name, color, display_order) VALUES
    (NEW.id, 'UI/UX Progress', '#EC4899', 1),
    (NEW.id, 'Development', '#3B82F6', 2),
    (NEW.id, 'Design', '#8B5CF6', 3),
    (NEW.id, 'Marketing', '#F59E0B', 4),
    (NEW.id, 'Testing & QA', '#10B981', 5);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_categories ON projects_project;

CREATE TRIGGER trigger_create_default_categories
    AFTER INSERT ON projects_project
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories();

-- Step 6: Grant permissions
ALTER TABLE task_categories DISABLE ROW LEVEL SECURITY;

GRANT ALL ON task_categories TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE task_categories_id_seq TO authenticated;

-- ========================================
-- USAGE EXAMPLES
-- ========================================

-- Add top-level category:
-- SELECT add_task_category(1, 'Backend Development', NULL, '#3B82F6');

-- Add sub-category:
-- SELECT add_task_category(1, 'API Development', 3, '#60A5FA');
-- (where 3 is the parent category ID)

-- Assign task to category:
-- UPDATE projects_task SET category_id = 5 WHERE id = 10;

-- View categories with counts:
-- SELECT * FROM category_with_counts WHERE project_id = 1;

-- ========================================
-- SUCCESS!
-- ========================================
-- After running this SQL:
-- ✅ task_categories table created
-- ✅ category_id added to tasks
-- ✅ Hierarchical categories (parent/sub-category)
-- ✅ Default categories auto-created for new projects
-- ✅ View with task counts
-- ✅ Color coding per category
-- ✅ All permissions granted

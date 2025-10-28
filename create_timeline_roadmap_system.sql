-- =============================================
-- TIMELINE & ROADMAP SYSTEM WITH GANTT CHART
-- Complete KPI Tracking, Budget Management, Team Performance
-- =============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS timeline_item_checklist CASCADE;
DROP TABLE IF EXISTS timeline_kpis CASCADE;
DROP TABLE IF EXISTS team_performance_logs CASCADE;
DROP TABLE IF EXISTS timeline_items CASCADE;
DROP TABLE IF EXISTS timeline_categories CASCADE;
DROP TABLE IF EXISTS timeline_folder_members CASCADE;
DROP TABLE IF EXISTS timeline_folders CASCADE;

-- =============================================
-- 1. TIMELINE FOLDERS (Project Timelines)
-- =============================================
CREATE TABLE timeline_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    total_budget DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Constraints
    CONSTRAINT valid_folder_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
    CONSTRAINT unique_folder_name UNIQUE (name, created_by_id)
);

-- =============================================
-- 2. TIMELINE FOLDER MEMBERS (Access Control)
-- =============================================
CREATE TABLE timeline_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES timeline_folders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'editor', 'viewer')),
    
    -- Permissions
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_manage_members BOOLEAN DEFAULT FALSE,
    can_manage_budget BOOLEAN DEFAULT FALSE,
    
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by_id INTEGER,
    
    -- Unique constraint
    CONSTRAINT unique_folder_member UNIQUE (folder_id, user_id)
);

-- =============================================
-- 3. TIMELINE CATEGORIES (Departments/Work Areas)
-- =============================================
CREATE TABLE timeline_categories (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES timeline_folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    responsible_person_id INTEGER, -- Person responsible for this department
    parent_category_id INTEGER REFERENCES timeline_categories(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id INTEGER
    
    -- Constraints (removed unique constraint that was causing 409 errors)
    -- Allow duplicate names in different folders or as subcategories
);

-- =============================================
-- 4. TIMELINE ITEMS (Tasks/Deliverables on Gantt)
-- =============================================
CREATE TABLE timeline_items (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES timeline_folders(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES timeline_categories(id) ON DELETE SET NULL,
    
    -- Basic Info
    title VARCHAR(500) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#FFB333',
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    phase VARCHAR(100), -- Planning, Design, Development, Testing, Launch, etc.
    
    -- Status & Progress
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled', 'delayed')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Budget (for KPI tracking)
    planned_budget DECIMAL(15, 2) DEFAULT 0,
    actual_spending DECIMAL(15, 2) DEFAULT 0,
    budget_variance_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN planned_budget > 0 THEN ((actual_spending - planned_budget) / planned_budget) * 100
            ELSE 0
        END
    ) STORED,
    
    -- Team
    team_leader_id INTEGER,
    team_member_ids INTEGER[], -- Array of user IDs
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Dependencies
    depends_on_item_ids INTEGER[], -- Array of timeline_item IDs that must complete first
    
    -- Notes
    notes TEXT,
    
    -- Tracking
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_timeline_dates CHECK (start_date <= end_date),
    CONSTRAINT valid_actual_dates CHECK (actual_start_date IS NULL OR actual_end_date IS NULL OR actual_start_date <= actual_end_date)
);

-- =============================================
-- 5. TIMELINE ITEM CHECKLIST
-- =============================================
CREATE TABLE timeline_item_checklist (
    id SERIAL PRIMARY KEY,
    timeline_item_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    item_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    item_order INTEGER DEFAULT 0,
    completed_by_id INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. TIMELINE KPIs (Custom KPI Tracking)
-- =============================================
CREATE TABLE timeline_kpis (
    id SERIAL PRIMARY KEY,
    timeline_item_id INTEGER REFERENCES timeline_items(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES timeline_folders(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES timeline_categories(id) ON DELETE CASCADE,
    
    -- KPI Details
    kpi_name VARCHAR(255) NOT NULL,
    kpi_type VARCHAR(50) CHECK (kpi_type IN ('percentage', 'number', 'currency', 'duration', 'rating')),
    target_value DECIMAL(15, 2),
    actual_value DECIMAL(15, 2),
    unit VARCHAR(50), -- %, hours, USD, items, etc.
    
    -- Tracking
    measurement_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    updated_by_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: KPI must belong to either an item, folder, or category
    CONSTRAINT kpi_belongs_to_something CHECK (
        (timeline_item_id IS NOT NULL) OR 
        (folder_id IS NOT NULL) OR 
        (category_id IS NOT NULL)
    )
);

-- =============================================
-- 7. TEAM PERFORMANCE TRACKING
-- =============================================
CREATE TABLE team_performance_logs (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES timeline_folders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    
    -- Performance Metrics
    tasks_completed INTEGER DEFAULT 0,
    tasks_on_time INTEGER DEFAULT 0,
    tasks_delayed INTEGER DEFAULT 0,
    total_hours_logged DECIMAL(10, 2) DEFAULT 0,
    quality_score DECIMAL(5, 2), -- 0-100 or 0-5 rating
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_performance_period UNIQUE (folder_id, user_id, period_start, period_end)
);

-- =============================================
-- INDEXES for Performance
-- =============================================

-- Timeline Folders
CREATE INDEX idx_timeline_folders_created_by ON timeline_folders(created_by_id);
CREATE INDEX idx_timeline_folders_active ON timeline_folders(is_active);

-- Folder Members
CREATE INDEX idx_timeline_folder_members_folder ON timeline_folder_members(folder_id);
CREATE INDEX idx_timeline_folder_members_user ON timeline_folder_members(user_id);
CREATE INDEX idx_timeline_folder_members_role ON timeline_folder_members(role);

-- Categories
CREATE INDEX idx_timeline_categories_folder ON timeline_categories(folder_id);
CREATE INDEX idx_timeline_categories_parent ON timeline_categories(parent_category_id);
CREATE INDEX idx_timeline_categories_order ON timeline_categories(folder_id, display_order);
CREATE INDEX idx_timeline_categories_responsible ON timeline_categories(responsible_person_id);

-- Timeline Items
CREATE INDEX idx_timeline_items_folder ON timeline_items(folder_id);
CREATE INDEX idx_timeline_items_category ON timeline_items(category_id);
CREATE INDEX idx_timeline_items_dates ON timeline_items(start_date, end_date);
CREATE INDEX idx_timeline_items_status ON timeline_items(status);
CREATE INDEX idx_timeline_items_team_leader ON timeline_items(team_leader_id);
CREATE INDEX idx_timeline_items_created_by ON timeline_items(created_by_id);

-- Checklist
CREATE INDEX idx_timeline_checklist_item ON timeline_item_checklist(timeline_item_id);
CREATE INDEX idx_timeline_checklist_order ON timeline_item_checklist(timeline_item_id, item_order);

-- KPIs
CREATE INDEX idx_timeline_kpis_item ON timeline_kpis(timeline_item_id);
CREATE INDEX idx_timeline_kpis_folder ON timeline_kpis(folder_id);
CREATE INDEX idx_timeline_kpis_category ON timeline_kpis(category_id);
CREATE INDEX idx_timeline_kpis_date ON timeline_kpis(measurement_date);

-- Team Performance
CREATE INDEX idx_team_performance_folder ON team_performance_logs(folder_id);
CREATE INDEX idx_team_performance_user ON team_performance_logs(user_id);
CREATE INDEX idx_team_performance_period ON team_performance_logs(period_start, period_end);

-- =============================================
-- TRIGGERS for updated_at
-- =============================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_timeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_timeline_folders_updated_at BEFORE UPDATE ON timeline_folders FOR EACH ROW EXECUTE FUNCTION update_timeline_updated_at();
CREATE TRIGGER update_timeline_categories_updated_at BEFORE UPDATE ON timeline_categories FOR EACH ROW EXECUTE FUNCTION update_timeline_updated_at();
CREATE TRIGGER update_timeline_items_updated_at BEFORE UPDATE ON timeline_items FOR EACH ROW EXECUTE FUNCTION update_timeline_updated_at();
CREATE TRIGGER update_timeline_checklist_updated_at BEFORE UPDATE ON timeline_item_checklist FOR EACH ROW EXECUTE FUNCTION update_timeline_updated_at();
CREATE TRIGGER update_timeline_kpis_updated_at BEFORE UPDATE ON timeline_kpis FOR EACH ROW EXECUTE FUNCTION update_timeline_updated_at();
CREATE TRIGGER update_team_performance_updated_at BEFORE UPDATE ON team_performance_logs FOR EACH ROW EXECUTE FUNCTION update_timeline_updated_at();

-- =============================================
-- DISABLE RLS (for simplicity)
-- =============================================

ALTER TABLE timeline_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_folder_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_item_checklist DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_kpis DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_performance_logs DISABLE ROW LEVEL SECURITY;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT ALL ON timeline_folders TO authenticated, anon;
GRANT ALL ON timeline_folder_members TO authenticated, anon;
GRANT ALL ON timeline_categories TO authenticated, anon;
GRANT ALL ON timeline_items TO authenticated, anon;
GRANT ALL ON timeline_item_checklist TO authenticated, anon;
GRANT ALL ON timeline_kpis TO authenticated, anon;
GRANT ALL ON team_performance_logs TO authenticated, anon;

GRANT USAGE, SELECT ON SEQUENCE timeline_folders_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE timeline_folder_members_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE timeline_categories_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE timeline_items_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE timeline_item_checklist_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE timeline_kpis_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE team_performance_logs_id_seq TO authenticated, anon;

-- =============================================
-- SAMPLE DATA (for testing)
-- =============================================

-- Sample folder
INSERT INTO timeline_folders (name, description, created_by_id, start_date, end_date, total_budget, currency)
VALUES 
('2025 Company Roadmap', 'Main company timeline for 2025 initiatives', 1, '2025-01-01', '2025-12-31', 500000, 'USD');

-- Sample categories
INSERT INTO timeline_categories (folder_id, name, description, color, responsible_person_id, display_order)
VALUES 
(1, 'Social Media', 'Social media marketing and campaigns', '#F59E0B', 1, 1),
(1, 'Pharmacy', 'Pharmacy business initiatives', '#8B5CF6', 1, 2),
(1, 'IT', 'Technology and system development', '#10B981', 1, 3),
(1, 'Online Presence', 'Website and digital presence', '#3B82F6', 1, 4);

-- Sample timeline items
INSERT INTO timeline_items (folder_id, category_id, title, description, start_date, end_date, phase, status, planned_budget, actual_spending, completion_percentage, priority, created_by_id)
VALUES 
(1, 1, 'Campaign Development for Winter Season', 'Social media campaign planning and execution', '2025-09-01', '2025-10-15', 'Planning', 'in_progress', 15000, 8500, 45, 'high', 1),
(1, 1, 'Community Building Initiative', 'Build and engage online community', '2025-10-01', '2025-11-30', 'Execution', 'in_progress', 12000, 5000, 30, 'medium', 1),
(1, 2, 'Pharmacy Partnership Setup', 'Establish pharmacy partnerships', '2025-09-15', '2025-10-31', 'Development', 'in_progress', 25000, 18000, 60, 'high', 1),
(1, 3, 'Website Redesign Project', 'Complete website overhaul', '2025-10-01', '2025-12-15', 'Design', 'in_progress', 45000, 22000, 40, 'urgent', 1);

-- =============================================
-- FUNCTIONS & VIEWS
-- =============================================

-- Function to calculate folder completion percentage
CREATE OR REPLACE FUNCTION calculate_folder_completion(p_folder_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    avg_completion DECIMAL;
BEGIN
    SELECT AVG(completion_percentage)
    INTO avg_completion
    FROM timeline_items
    WHERE folder_id = p_folder_id AND status != 'cancelled';
    
    RETURN COALESCE(avg_completion, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate budget utilization
CREATE OR REPLACE FUNCTION calculate_budget_utilization(p_folder_id INTEGER)
RETURNS TABLE (
    total_planned DECIMAL,
    total_spent DECIMAL,
    variance DECIMAL,
    utilization_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(planned_budget), 0) as total_planned,
        COALESCE(SUM(actual_spending), 0) as total_spent,
        COALESCE(SUM(actual_spending - planned_budget), 0) as variance,
        CASE 
            WHEN SUM(planned_budget) > 0 THEN (SUM(actual_spending) / SUM(planned_budget)) * 100
            ELSE 0
        END as utilization_percentage
    FROM timeline_items
    WHERE folder_id = p_folder_id;
END;
$$ LANGUAGE plpgsql;

-- View for comprehensive timeline overview
CREATE OR REPLACE VIEW timeline_overview AS
SELECT 
    ti.id,
    ti.folder_id,
    ti.title,
    ti.start_date,
    ti.end_date,
    ti.status,
    ti.completion_percentage,
    ti.phase,
    tc.name as category_name,
    tc.color as category_color,
    tc.responsible_person_id,
    ti.planned_budget,
    ti.actual_spending,
    ti.budget_variance_percentage,
    tf.name as folder_name,
    -- Calculate if item is overdue
    CASE 
        WHEN ti.status != 'completed' AND ti.end_date < CURRENT_DATE THEN true
        ELSE false
    END as is_overdue,
    -- Calculate days remaining
    CASE 
        WHEN ti.status != 'completed' THEN ti.end_date - CURRENT_DATE
        ELSE 0
    END as days_remaining,
    -- Calculate checklist completion
    (SELECT COUNT(*) FILTER (WHERE is_completed = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
     FROM timeline_item_checklist 
     WHERE timeline_item_id = ti.id) as checklist_completion_percentage
FROM timeline_items ti
LEFT JOIN timeline_categories tc ON ti.category_id = tc.id
LEFT JOIN timeline_folders tf ON ti.folder_id = tf.id
WHERE ti.status != 'cancelled';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'TIMELINE & ROADMAP SYSTEM CREATED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '   - timeline_folders (Project timeline containers)';
    RAISE NOTICE '   - timeline_folder_members (Access control)';
    RAISE NOTICE '   - timeline_categories (Departments/work areas)';
    RAISE NOTICE '   - timeline_items (Timeline tasks on Gantt chart)';
    RAISE NOTICE '   - timeline_item_checklist (Task checklists)';
    RAISE NOTICE '   - timeline_kpis (KPI tracking)';
    RAISE NOTICE '   - team_performance_logs (Team metrics)';
    RAISE NOTICE '';
    RAISE NOTICE 'Features Enabled:';
    RAISE NOTICE '   - Gantt chart data structure';
    RAISE NOTICE '   - Folder-based access control';
    RAISE NOTICE '   - Category & subcategory management';
    RAISE NOTICE '   - Budget tracking (planned vs actual)';
    RAISE NOTICE '   - Project completion percentage tracking';
    RAISE NOTICE '   - Team performance metrics';
    RAISE NOTICE '   - Timeline item checklists';
    RAISE NOTICE '   - Drag and drop ordering support';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Data Inserted:';
    RAISE NOTICE '   - 1 folder (2025 Company Roadmap)';
    RAISE NOTICE '   - 4 categories (Social Media, Pharmacy, IT, Online Presence)';
    RAISE NOTICE '   - 4 sample timeline items';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready to build the frontend!';
END $$;


-- Migration: Optimize Login & Initial Load Performance
-- Run this in Supabase SQL Editor
-- Key insight: auth_user JOINs are slow on this instance, so RPCs
-- return member user_ids only — the client resolves names from cache.

-- ============================================================
-- 1. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_auth_user_email_active
  ON auth_user (email) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_project_members_user_id
  ON projects_project_members (user_id);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id
  ON projects_project_members (project_id);

CREATE INDEX IF NOT EXISTS idx_project_members_user_project
  ON projects_project_members (user_id, project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id
  ON projects_task (project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_ids
  ON projects_task USING gin (assignee_ids);

CREATE INDEX IF NOT EXISTS idx_tasks_project_due_date
  ON projects_task (project_id, due_date ASC NULLS LAST);


-- ============================================================
-- 2. authenticate_and_load — login
--    Returns user + projects with member IDs only (no auth_user join)
-- ============================================================

CREATE OR REPLACE FUNCTION authenticate_and_load(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user JSON;
  v_user_id INTEGER;
  v_projects JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'email', email,
    'name', name,
    'phone', phone,
    'role', role,
    'position', position,
    'password', password,
    'avatar_url', avatar_url,
    'location', location,
    'bio', bio,
    'date_joined', date_joined,
    'is_active', is_active,
    'is_staff', is_staff,
    'is_superuser', is_superuser
  ), id
  INTO v_user, v_user_id
  FROM auth_user
  WHERE email = p_email AND is_active = true
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('user', NULL, 'projects', '[]'::json);
  END IF;

  -- Projects with member_ids array (no auth_user join)
  SELECT COALESCE(json_agg(proj ORDER BY proj.updated_at DESC), '[]'::json)
  INTO v_projects
  FROM (
    SELECT
      p.id,
      p.name,
      p.color,
      p.status,
      p.project_type,
      p.is_archived,
      p.due_date,
      p.start_date,
      p.created_by_id,
      p.created_at,
      p.updated_at,
      COALESCE(ma.member_ids, '[]'::json) AS member_ids
    FROM projects_project p
    INNER JOIN projects_project_members pm ON pm.project_id = p.id AND pm.user_id = v_user_id
    LEFT JOIN (
      SELECT project_id, json_agg(user_id) AS member_ids
      FROM projects_project_members
      GROUP BY project_id
    ) ma ON ma.project_id = p.id
  ) proj;

  RETURN json_build_object('user', v_user, 'projects', v_projects);
END;
$$;


-- ============================================================
-- 3. get_user_sidebar_projects — sidebar refresh
--    Returns projects with member_ids (no auth_user join)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_sidebar_projects(p_user_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_projects JSON;
BEGIN
  SELECT COALESCE(json_agg(proj ORDER BY proj.updated_at DESC), '[]'::json)
  INTO v_projects
  FROM (
    SELECT
      p.id,
      p.name,
      p.color,
      p.status,
      p.project_type,
      p.is_archived,
      p.due_date,
      p.start_date,
      p.created_by_id,
      p.created_at,
      p.updated_at,
      COALESCE(ma.member_ids, '[]'::json) AS member_ids
    FROM projects_project p
    INNER JOIN projects_project_members pm ON pm.project_id = p.id AND pm.user_id = p_user_id
    LEFT JOIN (
      SELECT project_id, json_agg(user_id) AS member_ids
      FROM projects_project_members
      GROUP BY project_id
    ) ma ON ma.project_id = p.id
  ) proj;

  RETURN v_projects;
END;
$$;


-- ============================================================
-- 4. get_all_users_lean — fetch all active users once
--    Client caches this for member name resolution
-- ============================================================

CREATE OR REPLACE FUNCTION get_all_users_lean()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'email', email,
      'role', role,
      'avatar_url', avatar_url
    )
  ), '[]'::json)
  FROM auth_user
  WHERE is_active = true;
$$;


-- ============================================================
-- 5. get_project_with_tasks — kanban load
--    Returns project + member_ids + tasks (no auth_user join)
-- ============================================================

CREATE OR REPLACE FUNCTION get_project_with_tasks(p_project_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project JSON;
  v_member_ids JSON;
  v_tasks JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'name', name,
    'description', description,
    'color', color,
    'status', status,
    'project_type', project_type,
    'is_archived', is_archived,
    'due_date', due_date,
    'start_date', start_date,
    'created_by_id', created_by_id,
    'created_at', created_at,
    'updated_at', updated_at
  )
  INTO v_project
  FROM projects_project
  WHERE id = p_project_id;

  IF v_project IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  SELECT COALESCE(json_agg(user_id), '[]'::json)
  INTO v_member_ids
  FROM projects_project_members
  WHERE project_id = p_project_id;

  SELECT COALESCE(json_agg(
    json_build_object(
      'id', t.id,
      'name', t.name,
      'description', t.description,
      'status', t.status,
      'priority', t.priority,
      'due_date', t.due_date,
      'start_date', t.start_date,
      'completed_at', t.completed_at,
      'estimated_hours', t.estimated_hours,
      'actual_hours', t.actual_hours,
      'position', t.position,
      'tags', t.tags,
      'created_at', t.created_at,
      'updated_at', t.updated_at,
      'assignee_ids', t.assignee_ids,
      'created_by_id', t.created_by_id,
      'project_id', t.project_id,
      'report_to_ids', t.report_to_ids
    )
  ), '[]'::json)
  INTO v_tasks
  FROM projects_task t
  WHERE t.project_id = p_project_id;

  RETURN json_build_object(
    'project', v_project,
    'member_ids', v_member_ids,
    'tasks', v_tasks
  );
END;
$$;


-- ============================================================
-- 6. get_dashboard_data — dashboard load (already fast)
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_ids INTEGER[];
  v_projects JSON;
  v_tasks JSON;
BEGIN
  SELECT ARRAY_AGG(project_id)
  INTO v_project_ids
  FROM projects_project_members
  WHERE user_id = p_user_id;

  IF v_project_ids IS NULL THEN
    RETURN json_build_object('projects', '[]'::json, 'tasks', '[]'::json);
  END IF;

  SELECT COALESCE(json_agg(
    json_build_object(
      'id', p.id,
      'name', p.name,
      'color', p.color,
      'status', p.status,
      'due_date', p.due_date
    )
  ), '[]'::json)
  INTO v_projects
  FROM projects_project p
  WHERE p.id = ANY(v_project_ids);

  SELECT COALESCE(json_agg(t_row), '[]'::json)
  INTO v_tasks
  FROM (
    SELECT json_build_object(
      'id', t.id,
      'name', t.name,
      'status', t.status,
      'due_date', t.due_date,
      'project_id', t.project_id
    ) AS t_row
    FROM projects_task t
    WHERE t.project_id = ANY(v_project_ids)
    ORDER BY t.due_date ASC NULLS LAST
    LIMIT 20
  ) sub;

  RETURN json_build_object('projects', v_projects, 'tasks', v_tasks);
END;
$$;


-- ============================================================
-- 7. get_user_tasks — my-tasks page
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_tasks(p_user_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_ids INTEGER[];
  v_tasks JSON;
BEGIN
  SELECT ARRAY_AGG(project_id)
  INTO v_project_ids
  FROM projects_project_members
  WHERE user_id = p_user_id;

  IF v_project_ids IS NULL THEN
    RETURN '[]'::json;
  END IF;

  SELECT COALESCE(json_agg(task_row), '[]'::json)
  INTO v_tasks
  FROM (
    SELECT json_build_object(
      'id', t.id,
      'name', t.name,
      'description', t.description,
      'status', t.status,
      'priority', t.priority,
      'due_date', t.due_date,
      'start_date', t.start_date,
      'completed_at', t.completed_at,
      'estimated_hours', t.estimated_hours,
      'actual_hours', t.actual_hours,
      'position', t.position,
      'tags', t.tags,
      'created_at', t.created_at,
      'updated_at', t.updated_at,
      'assignee_ids', t.assignee_ids,
      'created_by_id', t.created_by_id,
      'project_id', t.project_id,
      'project', json_build_object('id', p.id, 'name', p.name)
    ) AS task_row
    FROM projects_task t
    JOIN projects_project p ON p.id = t.project_id
    WHERE t.assignee_ids @> ARRAY[p_user_id]
      AND t.project_id = ANY(v_project_ids)
    ORDER BY t.due_date ASC NULLS LAST
  ) sub;

  RETURN v_tasks;
END;
$$;


-- ============================================================
-- 8. Permissions
-- ============================================================

GRANT EXECUTE ON FUNCTION authenticate_and_load(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_user_sidebar_projects(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_all_users_lean() TO anon;
GRANT EXECUTE ON FUNCTION get_project_with_tasks(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_data(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_user_tasks(INTEGER) TO anon;

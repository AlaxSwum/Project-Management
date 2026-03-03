-- Cold-start optimization: single-RTT RPC functions for sidebar and kanban

-- 1. Sidebar: returns projects + members for a given user in one query
CREATE OR REPLACE FUNCTION get_user_sidebar_projects(p_user_id INT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(proj) INTO result
  FROM (
    SELECT
      p.id, p.name, p.color, p.status, p.project_type,
      p.is_archived, p.due_date, p.start_date,
      p.created_by_id, p.created_at, p.updated_at,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', u.id, 'name', u.name, 'email', u.email,
          'role', u.role, 'avatar_url', u.avatar_url
        ))
        FROM projects_project_members pm2
        JOIN auth_user u ON u.id = pm2.user_id
        WHERE pm2.project_id = p.id),
        '[]'::json
      ) AS members
    FROM projects_project_members pm
    JOIN projects_project p ON p.id = pm.project_id
    WHERE pm.user_id = p_user_id
    ORDER BY p.updated_at DESC
  ) proj;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 2. Kanban: returns project + tasks + enriched users in one query
CREATE OR REPLACE FUNCTION get_project_with_tasks(p_project_id INT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSON;
  proj JSON;
  task_list JSON;
  members_list JSON;
BEGIN
  -- Project row
  SELECT row_to_json(p) INTO proj
  FROM (
    SELECT * FROM projects_project WHERE id = p_project_id
  ) p;

  IF proj IS NULL THEN
    RETURN json_build_object('project', NULL, 'tasks', '[]'::json, 'error', 'not_found');
  END IF;

  -- Members with user details
  SELECT COALESCE(json_agg(json_build_object(
    'id', u.id, 'name', u.name, 'email', u.email,
    'role', u.role, 'avatar_url', u.avatar_url
  )), '[]'::json)
  INTO members_list
  FROM projects_project_members pm
  JOIN auth_user u ON u.id = pm.user_id
  WHERE pm.project_id = p_project_id;

  -- Tasks with project name embedded
  SELECT COALESCE(json_agg(json_build_object(
    'id', t.id, 'name', t.name, 'description', t.description,
    'status', t.status, 'priority', t.priority,
    'due_date', t.due_date, 'start_date', t.start_date,
    'completed_at', t.completed_at,
    'estimated_hours', t.estimated_hours, 'actual_hours', t.actual_hours,
    'position', t.position, 'tags', t.tags,
    'created_at', t.created_at, 'updated_at', t.updated_at,
    'assignee_ids', t.assignee_ids, 'created_by_id', t.created_by_id,
    'project_id', t.project_id,
    'report_to_ids', t.report_to_ids
  )), '[]'::json)
  INTO task_list
  FROM projects_task t
  WHERE t.project_id = p_project_id;

  RETURN json_build_object(
    'project', proj,
    'members', members_list,
    'tasks', task_list
  );
END;
$$;

-- 3. Combined login: returns user row + sidebar projects in 1 RTT
-- Client checks password; this just fetches data.
CREATE OR REPLACE FUNCTION authenticate_and_load(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  user_row RECORD;
  projects_json JSON;
BEGIN
  SELECT id, email, name, phone, role, position, password,
         avatar_url, location, bio, date_joined, is_active
  INTO user_row
  FROM auth_user
  WHERE email = p_email AND is_active = true
  LIMIT 1;

  IF user_row IS NULL THEN
    RETURN json_build_object('user', NULL, 'projects', '[]'::json);
  END IF;

  SELECT COALESCE(json_agg(proj), '[]'::json) INTO projects_json
  FROM (
    SELECT
      p.id, p.name, p.color, p.status, p.project_type,
      p.is_archived, p.due_date, p.start_date,
      p.created_by_id, p.created_at, p.updated_at,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', u.id, 'name', u.name, 'email', u.email,
          'role', u.role, 'avatar_url', u.avatar_url
        ))
        FROM projects_project_members pm2
        JOIN auth_user u ON u.id = pm2.user_id
        WHERE pm2.project_id = p.id),
        '[]'::json
      ) AS members
    FROM projects_project_members pm
    JOIN projects_project p ON p.id = pm.project_id
    WHERE pm.user_id = user_row.id
    ORDER BY p.updated_at DESC
  ) proj;

  RETURN json_build_object(
    'user', json_build_object(
      'id', user_row.id, 'email', user_row.email, 'name', user_row.name,
      'phone', user_row.phone, 'role', user_row.role, 'position', user_row.position,
      'password', user_row.password, 'avatar_url', user_row.avatar_url,
      'location', user_row.location, 'bio', user_row.bio,
      'date_joined', user_row.date_joined
    ),
    'projects', projects_json
  );
END;
$$;

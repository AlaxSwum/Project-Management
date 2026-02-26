import { NextRequest } from 'next/server'
import { authenticateRequest, apiResponse, handleCORS, supabase } from '@/lib/api-auth'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/tasks
 * Get user's tasks with filters.
 * Query params:
 *   ?status=todo|in_progress|review|done
 *   ?priority=low|medium|high|urgent
 *   ?due=today|overdue|this_week
 *   ?project_id=123
 *   ?limit=50
 */
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const due = searchParams.get('due')
  const projectId = searchParams.get('project_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  const today = new Date().toISOString().split('T')[0]

  try {
    // Tasks use assignee_ids (array) - we need to filter with contains
    let query = supabase
      .from('projects_task')
      .select('id, name, description, status, priority, due_date, start_date, created_at, updated_at, project_id, assignee_ids, report_to_ids, estimated_hours, actual_hours, position, tags, category_id')
      .contains('assignee_ids', [user!.id])

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (projectId) {
      query = query.eq('project_id', parseInt(projectId))
    }

    if (due === 'today') {
      query = query.gte('due_date', `${today}T00:00:00`).lte('due_date', `${today}T23:59:59`)
    } else if (due === 'overdue') {
      query = query.lt('due_date', `${today}T00:00:00`).neq('status', 'done').not('due_date', 'is', null)
    } else if (due === 'this_week') {
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
      query = query.gte('due_date', `${today}T00:00:00`).lte('due_date', `${weekEnd.toISOString().split('T')[0]}T23:59:59`)
    }

    // Exclude done tasks by default unless specifically requesting done
    if (!status) {
      query = query.neq('status', 'done')
    }

    query = query.order('priority', { ascending: true }).limit(limit)

    const { data: tasks, error: tasksError } = await query

    if (tasksError) {
      return apiResponse({ error: 'Failed to fetch tasks', details: tasksError.message }, 500)
    }

    // Get project names for context
    const projectIds = [...new Set((tasks || []).map((t: any) => t.project_id).filter(Boolean))]
    let projectsMap: Record<number, string> = {}

    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects_project')
        .select('id, name')
        .in('id', projectIds)

      if (projects) {
        projectsMap = Object.fromEntries(projects.map((p: any) => [p.id, p.name]))
      }
    }

    const enrichedTasks = (tasks || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      start_date: t.start_date,
      project_id: t.project_id,
      project_name: projectsMap[t.project_id] || null,
      estimated_hours: t.estimated_hours,
      actual_hours: t.actual_hours,
      tags: t.tags,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }))

    return apiResponse({
      count: enrichedTasks.length,
      filters: { status, priority, due, project_id: projectId },
      tasks: enrichedTasks,
    })
  } catch (err: any) {
    return apiResponse({ error: 'Failed to fetch tasks', details: err.message }, 500)
  }
}

/**
 * POST /api/v1/tasks
 * Create a new task.
 * Body: { name, description?, project_id, priority?, due_date?, status? }
 */
export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  try {
    const body = await request.json()

    if (!body.name) {
      return apiResponse({ error: 'name is required' }, 400)
    }

    if (!body.project_id) {
      return apiResponse({ error: 'project_id is required' }, 400)
    }

    // Verify user has access to the project
    const { data: membership } = await supabase
      .from('projects_project_members')
      .select('project_id')
      .eq('project_id', body.project_id)
      .eq('user_id', user!.id)
      .single()

    if (!membership) {
      return apiResponse({ error: 'You do not have access to this project' }, 403)
    }

    const taskData = {
      name: body.name,
      description: body.description || '',
      project_id: body.project_id,
      assignee_ids: [user!.id],
      report_to_ids: body.report_to_ids || [],
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      due_date: body.due_date || null,
      start_date: body.start_date || null,
      estimated_hours: body.estimated_hours || null,
      tags: body.tags || '',
      position: 0,
      created_by_id: user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: task, error: taskError } = await supabase
      .from('projects_task')
      .insert([taskData])
      .select()

    if (taskError) {
      return apiResponse({ error: 'Failed to create task', details: taskError.message }, 500)
    }

    return apiResponse({ message: 'Task created successfully', task: task[0] }, 201)
  } catch (err: any) {
    return apiResponse({ error: 'Failed to create task', details: err.message }, 500)
  }
}

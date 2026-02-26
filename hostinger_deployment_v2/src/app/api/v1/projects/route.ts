import { NextRequest } from 'next/server'
import { authenticateRequest, apiResponse, handleCORS, supabase } from '@/lib/api-auth'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/projects
 * Get all projects the user is a member of.
 * Query params:
 *   ?status=planning|active|completed|on_hold
 */
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')

  try {
    // Get user's project IDs
    const { data: memberships, error: memberError } = await supabase
      .from('projects_project_members')
      .select('project_id')
      .eq('user_id', user!.id)

    if (memberError) {
      return apiResponse({ error: 'Failed to fetch projects', details: memberError.message }, 500)
    }

    if (!memberships || memberships.length === 0) {
      return apiResponse({ count: 0, projects: [] })
    }

    const projectIds = memberships.map((m: any) => m.project_id)

    let query = supabase
      .from('projects_project')
      .select('id, name, description, color, status, project_type, is_archived, due_date, start_date, created_at, updated_at')
      .in('id', projectIds)
      .eq('is_archived', false)

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('updated_at', { ascending: false })

    const { data: projects, error: projectsError } = await query

    if (projectsError) {
      return apiResponse({ error: 'Failed to fetch projects', details: projectsError.message }, 500)
    }

    // Get task counts per project
    const { data: taskCounts } = await supabase
      .from('projects_task')
      .select('project_id, status')
      .in('project_id', projectIds)

    const taskStats: Record<number, { total: number; done: number; in_progress: number }> = {}
    ;(taskCounts || []).forEach((t: any) => {
      if (!taskStats[t.project_id]) {
        taskStats[t.project_id] = { total: 0, done: 0, in_progress: 0 }
      }
      taskStats[t.project_id].total++
      if (t.status === 'done') taskStats[t.project_id].done++
      if (t.status === 'in_progress') taskStats[t.project_id].in_progress++
    })

    const enrichedProjects = (projects || []).map((p: any) => ({
      ...p,
      task_stats: taskStats[p.id] || { total: 0, done: 0, in_progress: 0 },
    }))

    return apiResponse({
      count: enrichedProjects.length,
      projects: enrichedProjects,
    })
  } catch (err: any) {
    return apiResponse({ error: 'Failed to fetch projects', details: err.message }, 500)
  }
}

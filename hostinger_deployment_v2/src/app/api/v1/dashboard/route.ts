import { NextRequest } from 'next/server'
import { authenticateRequest, apiResponse, handleCORS, supabase } from '@/lib/api-auth'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/dashboard
 * Returns a full summary of the user's day - tasks, meetings, todos, schedule.
 * This is the main endpoint for "Hey Focus, what's my day like?"
 */
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const today = new Date().toISOString().split('T')[0]
  const userId = user!.id

  try {
    // Run all queries in parallel
    const [
      tasksResult,
      meetingsResult,
      todosResult,
      timeBlocksResult,
      overdueTasksResult,
      projectsResult,
    ] = await Promise.all([
      // All open tasks assigned to user (assignee_ids contains userId)
      supabase
        .from('projects_task')
        .select('id, name, status, priority, due_date, project_id')
        .contains('assignee_ids', [userId])
        .neq('status', 'done')
        .order('priority', { ascending: true }),

      // Today's meetings (user in attendee_ids or created by user)
      supabase
        .from('projects_meeting')
        .select('id, title, date, time, duration, completed, project_id, notes, location, event_type, attendee_ids')
        .eq('date', today)
        .eq('completed', false)
        .order('time', { ascending: true }),

      // Incomplete personal todos
      supabase
        .from('personal_todos')
        .select('id, task_name, completed, priority, deadline, created_at')
        .eq('user_id', String(userId))
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(10),

      // Today's time blocks
      supabase
        .from('time_blocks')
        .select('id, title, start_time, end_time, completed, date, type, description')
        .eq('user_id', userId)
        .eq('date', today)
        .order('start_time', { ascending: true }),

      // Overdue tasks
      supabase
        .from('projects_task')
        .select('id, name, status, priority, due_date, project_id')
        .contains('assignee_ids', [userId])
        .neq('status', 'done')
        .lt('due_date', `${today}T00:00:00`)
        .not('due_date', 'is', null),

      // User's projects
      supabase
        .from('projects_project_members')
        .select('project_id')
        .eq('user_id', userId),
    ])

    const allTasks = tasksResult.data || []
    const urgentTasks = allTasks.filter(
      (t: any) => t.priority === 'high' || t.priority === 'urgent'
    )
    const todayTasks = allTasks.filter((t: any) => {
      if (!t.due_date) return false
      return t.due_date.startsWith(today)
    })
    const overdueTasks = overdueTasksResult.data || []

    // Filter meetings where user is attendee or creator
    const allMeetings = meetingsResult.data || []
    const userMeetings = allMeetings.filter((m: any) =>
      (m.attendee_ids && m.attendee_ids.includes(userId)) || m.created_by_id === userId
    )

    const todos = todosResult.data || []
    const timeBlocks = timeBlocksResult.data || []

    // Get project names for context
    const allProjectIds = [
      ...new Set([
        ...allTasks.map((t: any) => t.project_id),
        ...userMeetings.map((m: any) => m.project_id),
      ].filter(Boolean))
    ]
    let projectsMap: Record<number, string> = {}
    if (allProjectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects_project')
        .select('id, name')
        .in('id', allProjectIds)
      if (projects) {
        projectsMap = Object.fromEntries(projects.map((p: any) => [p.id, p.name]))
      }
    }

    // Enrich with project names
    const enrichTask = (t: any) => ({ ...t, project_name: projectsMap[t.project_id] || null })
    const enrichMeeting = (m: any) => ({ ...m, project_name: projectsMap[m.project_id] || null })

    return apiResponse({
      greeting: `Good ${getTimeOfDay()}, ${user!.name}!`,
      date: today,
      summary: {
        urgent_tasks: urgentTasks.length,
        tasks_due_today: todayTasks.length,
        overdue_tasks: overdueTasks.length,
        total_open_tasks: allTasks.length,
        meetings_today: userMeetings.length,
        pending_todos: todos.length,
        time_blocks_today: timeBlocks.length,
        active_projects: (projectsResult.data || []).length,
      },
      urgent_tasks: urgentTasks.map(enrichTask),
      tasks_due_today: todayTasks.map(enrichTask),
      overdue_tasks: overdueTasks.map(enrichTask),
      meetings_today: userMeetings.map(enrichMeeting),
      pending_todos: todos.map((t: any) => ({
        id: t.id,
        name: t.task_name,
        priority: t.priority,
        deadline: t.deadline,
      })),
      schedule_today: timeBlocks,
    })
  } catch (err: any) {
    return apiResponse({ error: 'Failed to fetch dashboard', details: err.message }, 500)
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

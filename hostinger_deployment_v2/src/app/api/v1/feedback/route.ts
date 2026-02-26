import { NextRequest } from 'next/server'
import { authenticateRequest, apiResponse, handleCORS, supabase } from '@/lib/api-auth'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/feedback
 * Personalized productivity feedback & insights for the authenticated user.
 * Analyzes task completion, overdue patterns, workload, and gives actionable advice.
 *
 * Query params:
 *   ?period=week|month|all (default: week)
 */
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get('period') || 'week'

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const userId = user!.id

  // Calculate period start date
  let periodStart: string
  if (period === 'month') {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    periodStart = d.toISOString().split('T')[0]
  } else if (period === 'all') {
    periodStart = '2020-01-01'
  } else {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    periodStart = d.toISOString().split('T')[0]
  }

  try {
    // Run all queries in parallel
    const [
      allTasksResult,
      completedTasksResult,
      overdueTasksResult,
      recentCompletedResult,
      meetingsResult,
      completedMeetingsResult,
      todosResult,
      completedTodosResult,
      timeBlocksResult,
      completedTimeBlocksResult,
      projectsResult,
      reportsResult,
    ] = await Promise.all([
      // All open tasks assigned to user
      supabase
        .from('projects_task')
        .select('id, name, status, priority, due_date, project_id, created_at, updated_at')
        .contains('assignee_ids', [userId])
        .neq('status', 'done'),

      // All completed tasks for this user (in period)
      supabase
        .from('projects_task')
        .select('id, name, status, priority, due_date, completed_at, project_id, updated_at')
        .contains('assignee_ids', [userId])
        .eq('status', 'done')
        .gte('updated_at', `${periodStart}T00:00:00`),

      // Overdue tasks
      supabase
        .from('projects_task')
        .select('id, name, priority, due_date, project_id, status')
        .contains('assignee_ids', [userId])
        .neq('status', 'done')
        .lt('due_date', `${today}T00:00:00`)
        .not('due_date', 'is', null),

      // Recently completed tasks (last 7 days always for momentum)
      supabase
        .from('projects_task')
        .select('id, name, priority, due_date, updated_at, project_id')
        .contains('assignee_ids', [userId])
        .eq('status', 'done')
        .gte('updated_at', `${new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]}T00:00:00`)
        .order('updated_at', { ascending: false }),

      // Meetings in period (all for user)
      supabase
        .from('projects_meeting')
        .select('id, title, date, time, duration, completed, attendee_ids, created_by_id, project_id')
        .gte('date', periodStart)
        .lte('date', today),

      // Completed meetings in period
      supabase
        .from('projects_meeting')
        .select('id, date, duration')
        .eq('completed', true)
        .gte('date', periodStart)
        .lte('date', today),

      // Pending todos
      supabase
        .from('personal_todos')
        .select('id, task_name, priority, deadline, created_at')
        .eq('user_id', String(userId))
        .eq('completed', false),

      // Completed todos in period
      supabase
        .from('personal_todos')
        .select('id, task_name, updated_at')
        .eq('user_id', String(userId))
        .eq('completed', true)
        .gte('updated_at', `${periodStart}T00:00:00`),

      // Time blocks in period
      supabase
        .from('time_blocks')
        .select('id, title, date, start_time, end_time, completed, type')
        .eq('user_id', userId)
        .gte('date', periodStart)
        .lte('date', today),

      // Completed time blocks
      supabase
        .from('time_blocks')
        .select('id, date, start_time, end_time, type')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('date', periodStart)
        .lte('date', today),

      // User's projects
      supabase
        .from('projects_project_members')
        .select('project_id')
        .eq('user_id', userId),

      // Employee reports submitted
      supabase
        .from('org_employee_reports')
        .select('id, report_type, report_date, status')
        .eq('user_id', userId)
        .gte('report_date', periodStart),
    ])

    const openTasks = allTasksResult.data || []
    const completedTasks = completedTasksResult.data || []
    const overdueTasks = overdueTasksResult.data || []
    const recentCompleted = recentCompletedResult.data || []
    const allMeetings = (meetingsResult.data || []).filter((m: any) =>
      (m.attendee_ids && m.attendee_ids.includes(userId)) || m.created_by_id === userId
    )
    const completedMeetings = completedMeetingsResult.data || []
    const pendingTodos = todosResult.data || []
    const completedTodos = completedTodosResult.data || []
    const allTimeBlocks = timeBlocksResult.data || []
    const completedTimeBlocks = completedTimeBlocksResult.data || []
    const projects = projectsResult.data || []
    const reports = reportsResult.data || []

    // --- Calculate metrics ---

    // Task completion rate
    const totalTasksTouched = completedTasks.length + openTasks.length
    const taskCompletionRate = totalTasksTouched > 0
      ? Math.round((completedTasks.length / totalTasksTouched) * 100)
      : 0

    // Overdue rate
    const tasksWithDueDate = openTasks.filter((t: any) => t.due_date)
    const overdueRate = tasksWithDueDate.length > 0
      ? Math.round((overdueTasks.length / tasksWithDueDate.length) * 100)
      : 0

    // Priority distribution
    const priorityBreakdown = {
      urgent: openTasks.filter((t: any) => t.priority === 'urgent').length,
      high: openTasks.filter((t: any) => t.priority === 'high').length,
      medium: openTasks.filter((t: any) => t.priority === 'medium').length,
      low: openTasks.filter((t: any) => t.priority === 'low').length,
    }

    // Time blocks completion rate
    const timeBlockCompletionRate = allTimeBlocks.length > 0
      ? Math.round((completedTimeBlocks.length / allTimeBlocks.length) * 100)
      : 0

    // Meeting hours
    const totalMeetingMinutes = completedMeetings.reduce(
      (sum: number, m: any) => sum + (m.duration || 60), 0
    )
    const meetingHours = Math.round(totalMeetingMinutes / 60 * 10) / 10

    // Workload by project
    const projectWorkload: Record<number, { name: string; open: number; done: number }> = {}
    const allProjectIds = [...new Set([
      ...openTasks.map((t: any) => t.project_id),
      ...completedTasks.map((t: any) => t.project_id),
    ].filter(Boolean))]

    let projectsMap: Record<number, string> = {}
    if (allProjectIds.length > 0) {
      const { data: projectData } = await supabase
        .from('projects_project')
        .select('id, name')
        .in('id', allProjectIds)
      if (projectData) {
        projectsMap = Object.fromEntries(projectData.map((p: any) => [p.id, p.name]))
      }
    }

    openTasks.forEach((t: any) => {
      if (!t.project_id) return
      if (!projectWorkload[t.project_id]) {
        projectWorkload[t.project_id] = { name: projectsMap[t.project_id] || 'Unknown', open: 0, done: 0 }
      }
      projectWorkload[t.project_id].open++
    })
    completedTasks.forEach((t: any) => {
      if (!t.project_id) return
      if (!projectWorkload[t.project_id]) {
        projectWorkload[t.project_id] = { name: projectsMap[t.project_id] || 'Unknown', open: 0, done: 0 }
      }
      projectWorkload[t.project_id].done++
    })

    // --- Generate feedback insights ---
    const insights: string[] = []
    const warnings: string[] = []
    const wins: string[] = []

    // Wins
    if (recentCompleted.length > 0) {
      wins.push(`Completed ${recentCompleted.length} task${recentCompleted.length > 1 ? 's' : ''} in the last 7 days. Keep the momentum going!`)
    }
    if (taskCompletionRate >= 70) {
      wins.push(`Strong ${taskCompletionRate}% task completion rate this ${period}.`)
    }
    if (timeBlockCompletionRate >= 80 && allTimeBlocks.length > 0) {
      wins.push(`Excellent schedule discipline - ${timeBlockCompletionRate}% of time blocks completed.`)
    }
    if (completedTodos.length > 3) {
      wins.push(`Cleared ${completedTodos.length} personal todos this ${period}.`)
    }

    // Warnings
    if (overdueTasks.length > 0) {
      const highPriorityOverdue = overdueTasks.filter((t: any) => t.priority === 'high' || t.priority === 'urgent')
      if (highPriorityOverdue.length > 0) {
        warnings.push(`${highPriorityOverdue.length} HIGH/URGENT task${highPriorityOverdue.length > 1 ? 's are' : ' is'} overdue. These need immediate attention.`)
      } else {
        warnings.push(`${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} past due date.`)
      }
    }
    if (overdueRate > 50) {
      warnings.push(`${overdueRate}% of your tasks with deadlines are overdue. Consider re-prioritizing or adjusting due dates.`)
    }
    if (priorityBreakdown.urgent + priorityBreakdown.high > 5) {
      warnings.push(`Heavy load: ${priorityBreakdown.urgent + priorityBreakdown.high} urgent/high priority tasks open. Consider delegating or reprioritizing.`)
    }

    // Insights
    if (openTasks.length > 20) {
      insights.push(`You have ${openTasks.length} open tasks across ${projects.length} projects. Consider breaking this down or archiving stale tasks.`)
    } else if (openTasks.length > 0) {
      insights.push(`${openTasks.length} open tasks across ${projects.length} projects. Manageable workload.`)
    }

    if (meetingHours > 15 && period === 'week') {
      insights.push(`${meetingHours} hours in meetings this week. That's significant - make sure you have enough deep work time.`)
    } else if (meetingHours > 0) {
      insights.push(`${meetingHours} hours spent in meetings this ${period}.`)
    }

    if (pendingTodos.length > 10) {
      insights.push(`${pendingTodos.length} personal todos piling up. Try to clear the quick wins today.`)
    }

    if (taskCompletionRate < 30 && totalTasksTouched > 5) {
      insights.push(`Task completion rate is ${taskCompletionRate}%. Focus on finishing existing tasks before starting new ones.`)
    }

    // Status breakdown of open tasks
    const statusBreakdown = {
      todo: openTasks.filter((t: any) => t.status === 'todo').length,
      in_progress: openTasks.filter((t: any) => t.status === 'in_progress').length,
      review: openTasks.filter((t: any) => t.status === 'review').length,
    }

    if (statusBreakdown.in_progress > 5) {
      insights.push(`${statusBreakdown.in_progress} tasks in progress simultaneously. Try to finish some before starting new work.`)
    }

    // Most overloaded project
    const sortedWorkload = Object.values(projectWorkload).sort((a, b) => b.open - a.open)
    if (sortedWorkload.length > 0 && sortedWorkload[0].open > 3) {
      insights.push(`"${sortedWorkload[0].name}" has the most open tasks (${sortedWorkload[0].open}). Consider focusing here.`)
    }

    return apiResponse({
      user: { id: user!.id, name: user!.name, role: user!.role },
      period,
      period_start: periodStart,
      period_end: today,
      metrics: {
        task_completion_rate: `${taskCompletionRate}%`,
        tasks_completed: completedTasks.length,
        tasks_open: openTasks.length,
        tasks_overdue: overdueTasks.length,
        overdue_rate: `${overdueRate}%`,
        meetings_attended: allMeetings.length,
        meeting_hours: meetingHours,
        todos_completed: completedTodos.length,
        todos_pending: pendingTodos.length,
        time_blocks_total: allTimeBlocks.length,
        time_block_completion_rate: `${timeBlockCompletionRate}%`,
        active_projects: projects.length,
        reports_submitted: reports.length,
      },
      priority_breakdown: priorityBreakdown,
      status_breakdown: statusBreakdown,
      workload_by_project: Object.values(projectWorkload).sort((a, b) => b.open - a.open),
      overdue_tasks: overdueTasks.map((t: any) => ({
        id: t.id,
        name: t.name,
        priority: t.priority,
        due_date: t.due_date,
        project_name: projectsMap[t.project_id] || null,
        days_overdue: Math.floor((now.getTime() - new Date(t.due_date).getTime()) / 86400000),
      })),
      recent_completions: recentCompleted.slice(0, 5).map((t: any) => ({
        name: t.name,
        priority: t.priority,
        completed_on: t.updated_at,
        project_name: projectsMap[t.project_id] || null,
      })),
      feedback: {
        wins,
        warnings,
        insights,
      },
    })
  } catch (err: any) {
    return apiResponse({ error: 'Failed to generate feedback', details: err.message }, 500)
  }
}

import { NextRequest } from 'next/server'
import { authenticateRequest, apiResponse, handleCORS, supabase } from '@/lib/api-auth'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/meetings
 * Get meetings.
 * Query params:
 *   ?filter=today|upcoming|past
 *   ?project_id=123
 *   ?limit=20
 */
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const filter = searchParams.get('filter') || 'today'
  const projectId = searchParams.get('project_id')
  const limit = parseInt(searchParams.get('limit') || '20')

  const today = new Date().toISOString().split('T')[0]

  try {
    let query = supabase
      .from('projects_meeting')
      .select('id, title, description, date, time, duration, completed, project_id, notes, location, event_type, attendee_ids, meeting_link, color, all_day, agenda_items, created_by_id, created_at')

    if (projectId) {
      query = query.eq('project_id', parseInt(projectId))
    }

    if (filter === 'today') {
      query = query.eq('date', today)
    } else if (filter === 'upcoming') {
      query = query.gte('date', today).eq('completed', false)
    } else if (filter === 'past') {
      query = query.lt('date', today)
    }

    query = query.order('date', { ascending: filter !== 'past' }).order('time', { ascending: true }).limit(limit)

    const { data: meetings, error: meetingsError } = await query

    if (meetingsError) {
      return apiResponse({ error: 'Failed to fetch meetings', details: meetingsError.message }, 500)
    }

    // Filter to meetings where user is attendee or creator
    const userId = user!.id
    const userMeetings = (meetings || []).filter((m: any) =>
      (m.attendee_ids && m.attendee_ids.includes(userId)) ||
      m.created_by_id === userId
    )

    // Get project names
    const meetingProjectIds = [...new Set(userMeetings.map((m: any) => m.project_id).filter(Boolean))]
    let projectsMap: Record<number, string> = {}

    if (meetingProjectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects_project')
        .select('id, name')
        .in('id', meetingProjectIds)

      if (projects) {
        projectsMap = Object.fromEntries(projects.map((p: any) => [p.id, p.name]))
      }
    }

    // Get attendee names
    const allAttendeeIds = [...new Set(userMeetings.flatMap((m: any) => m.attendee_ids || []))]
    let usersMap: Record<number, string> = {}

    if (allAttendeeIds.length > 0) {
      const { data: users } = await supabase
        .from('auth_user')
        .select('id, name')
        .in('id', allAttendeeIds)

      if (users) {
        usersMap = Object.fromEntries(users.map((u: any) => [u.id, u.name]))
      }
    }

    const enrichedMeetings = userMeetings.map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      date: m.date,
      time: m.time,
      duration: m.duration,
      location: m.location,
      meeting_link: m.meeting_link,
      event_type: m.event_type,
      completed: m.completed,
      project_id: m.project_id,
      project_name: projectsMap[m.project_id] || null,
      attendees: (m.attendee_ids || []).map((id: number) => usersMap[id] || `User ${id}`),
      notes: m.notes,
      agenda_items: m.agenda_items,
    }))

    return apiResponse({
      count: enrichedMeetings.length,
      filter,
      meetings: enrichedMeetings,
    })
  } catch (err: any) {
    return apiResponse({ error: 'Failed to fetch meetings', details: err.message }, 500)
  }
}

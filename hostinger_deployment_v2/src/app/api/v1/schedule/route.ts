import { NextRequest } from 'next/server'
import { authenticateRequest, apiResponse, handleCORS, supabase } from '@/lib/api-auth'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/schedule
 * Get time blocks / calendar events.
 * Query params:
 *   ?date=2026-02-26 (default: today)
 */
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  try {
    const { data: timeBlocks, error: blocksError } = await supabase
      .from('time_blocks')
      .select('id, title, start_time, end_time, completed, date, description')
      .eq('user_id', user!.id)
      .eq('date', date)
      .order('start_time', { ascending: true })

    if (blocksError) {
      return apiResponse({ error: 'Failed to fetch schedule', details: blocksError.message }, 500)
    }

    const completed = (timeBlocks || []).filter((b: any) => b.completed).length
    const total = (timeBlocks || []).length

    return apiResponse({
      date,
      count: total,
      completed,
      remaining: total - completed,
      time_blocks: timeBlocks || [],
    })
  } catch (err: any) {
    return apiResponse({ error: 'Failed to fetch schedule', details: err.message }, 500)
  }
}

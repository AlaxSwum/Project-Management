import { NextRequest } from 'next/server'
import { authenticateRequest, apiResponse, handleCORS, supabase } from '@/lib/api-auth'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/todos
 * Get personal todos.
 * Query params:
 *   ?completed=true|false (default: false)
 *   ?limit=50
 */
export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const completed = searchParams.get('completed') === 'true'
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    // personal_todos uses user_id as string
    const { data: todos, error: todosError } = await supabase
      .from('personal_todos')
      .select('id, task_name, completed, priority, deadline, start_date, duration, description, created_at, updated_at')
      .eq('user_id', String(user!.id))
      .eq('completed', completed)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (todosError) {
      return apiResponse({ error: 'Failed to fetch todos', details: todosError.message }, 500)
    }

    const enrichedTodos = (todos || []).map((t: any) => ({
      id: t.id,
      name: t.task_name,
      completed: t.completed,
      priority: t.priority,
      deadline: t.deadline,
      start_date: t.start_date,
      duration: t.duration,
      description: t.description,
      created_at: t.created_at,
    }))

    return apiResponse({
      count: enrichedTodos.length,
      showing: completed ? 'completed' : 'pending',
      todos: enrichedTodos,
    })
  } catch (err: any) {
    return apiResponse({ error: 'Failed to fetch todos', details: err.message }, 500)
  }
}

/**
 * POST /api/v1/todos
 * Create a personal todo.
 * Body: { name, priority?, deadline?, description? }
 */
export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request)
  if (error) return error

  try {
    const body = await request.json()

    if (!body.name) {
      return apiResponse({ error: 'name is required' }, 400)
    }

    const { data: todo, error: todoError } = await supabase
      .from('personal_todos')
      .insert([{
        task_name: body.name,
        user_id: String(user!.id),
        completed: false,
        priority: body.priority || 'normal',
        deadline: body.deadline || null,
        start_date: body.start_date || null,
        description: body.description || null,
        duration: body.duration || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()

    if (todoError) {
      return apiResponse({ error: 'Failed to create todo', details: todoError.message }, 500)
    }

    return apiResponse({ message: 'Todo created successfully', todo: todo[0] }, 201)
  } catch (err: any) {
    return apiResponse({ error: 'Failed to create todo', details: err.message }, 500)
  }
}

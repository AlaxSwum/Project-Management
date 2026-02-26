import { NextRequest } from 'next/server'
import { apiResponse, handleCORS } from '@/lib/api-auth'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/openapi
 * Returns the OpenAPI 3.1 schema for ChatGPT Custom GPT integration.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const schema = {
    openapi: '3.1.0',
    info: {
      title: 'Focus - Personal Project Management Assistant API',
      description: 'API for Focus project management app. Each user authenticates with their own credentials and can ONLY see their own data - tasks, meetings, projects, todos, and schedule are all scoped to the authenticated user. You are a personal productivity assistant named Focus. When giving feedback, be specific, reference actual task names, and give actionable advice. Use getFeedback for performance insights and getDashboard for daily overview.',
      version: '1.0.0',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/v1/dashboard': {
        get: {
          operationId: 'getDashboard',
          summary: 'Get full daily overview - urgent tasks, meetings, todos, schedule, and stats. Use this when the user asks about their day, what they need to do, or for a general summary.',
          responses: {
            '200': {
              description: 'Dashboard summary with all daily data',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Dashboard' } } },
            },
          },
        },
      },
      '/api/v1/tasks': {
        get: {
          operationId: 'getTasks',
          summary: 'Get tasks with optional filters. Use when user asks about specific tasks, urgent items, overdue work, or tasks in a project.',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] }, description: 'Filter by status' },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }, description: 'Filter by priority' },
            { name: 'due', in: 'query', schema: { type: 'string', enum: ['today', 'overdue', 'this_week'] }, description: 'Filter by due date' },
            { name: 'project_id', in: 'query', schema: { type: 'integer' }, description: 'Filter by project ID' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Max results' },
          ],
          responses: {
            '200': { description: 'List of tasks', content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskList' } } } },
          },
        },
        post: {
          operationId: 'createTask',
          summary: 'Create a new task. Use when user wants to add a task to a project.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'project_id'],
                  properties: {
                    name: { type: 'string', description: 'Task name' },
                    description: { type: 'string', description: 'Task description' },
                    project_id: { type: 'integer', description: 'Project to add task to. Use getProjects to find the ID.' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
                    due_date: { type: 'string', format: 'date-time', description: 'Due date (ISO format, e.g. 2026-02-28T00:00:00)' },
                    start_date: { type: 'string', format: 'date-time', description: 'Start date' },
                    status: { type: 'string', enum: ['todo', 'in_progress', 'review'], default: 'todo' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Task created' },
          },
        },
      },
      '/api/v1/projects': {
        get: {
          operationId: 'getProjects',
          summary: 'Get all projects the user is a member of, with task statistics. Use when user asks about their projects or needs a project ID.',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['planning', 'active', 'completed', 'on_hold'] }, description: 'Filter by status' },
          ],
          responses: {
            '200': { description: 'List of projects', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectList' } } } },
          },
        },
      },
      '/api/v1/meetings': {
        get: {
          operationId: 'getMeetings',
          summary: "Get meetings. Use when user asks about today's meetings, upcoming meetings, or past meetings.",
          parameters: [
            { name: 'filter', in: 'query', schema: { type: 'string', enum: ['today', 'upcoming', 'past'], default: 'today' }, description: 'Time filter' },
            { name: 'project_id', in: 'query', schema: { type: 'integer' }, description: 'Filter by project' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': { description: 'List of meetings' },
          },
        },
      },
      '/api/v1/todos': {
        get: {
          operationId: 'getTodos',
          summary: 'Get personal to-do items. Use when user asks about their personal todo list or pending items.',
          parameters: [
            { name: 'completed', in: 'query', schema: { type: 'string', enum: ['true', 'false'], default: 'false' }, description: 'Show completed or pending' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: {
            '200': { description: 'List of todos' },
          },
        },
        post: {
          operationId: 'createTodo',
          summary: 'Create a personal todo item. Use when user wants to add something to their personal list.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', description: 'Todo text / task name' },
                    priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
                    deadline: { type: 'string', format: 'date', description: 'Due date (YYYY-MM-DD)' },
                    description: { type: 'string', description: 'Additional details' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Todo created' },
          },
        },
      },
      '/api/v1/schedule': {
        get: {
          operationId: 'getSchedule',
          summary: "Get time blocks and calendar events for a date. Use when user asks about their schedule or what's on their calendar.",
          parameters: [
            { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Date to check (YYYY-MM-DD, defaults to today)' },
          ],
          responses: {
            '200': { description: 'Schedule for the day' },
          },
        },
      },
      '/api/v1/feedback': {
        get: {
          operationId: 'getFeedback',
          summary: 'Get personalized productivity feedback, insights, and performance metrics. Use when user asks "how am I doing?", "give me feedback", "what should I improve?", "my performance", or any self-reflection question.',
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['week', 'month', 'all'], default: 'week' }, description: 'Time period for analysis' },
          ],
          responses: {
            '200': {
              description: 'Productivity feedback with metrics, wins, warnings, insights, and workload analysis',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      metrics: { type: 'object', description: 'Completion rates, task counts, meeting hours, etc.' },
                      priority_breakdown: { type: 'object', description: 'Count of tasks by priority level' },
                      status_breakdown: { type: 'object', description: 'Count of tasks by status' },
                      workload_by_project: { type: 'array', description: 'Open/done tasks per project' },
                      overdue_tasks: { type: 'array', description: 'Tasks past due with days_overdue count' },
                      recent_completions: { type: 'array', description: 'Recently finished tasks' },
                      feedback: {
                        type: 'object',
                        properties: {
                          wins: { type: 'array', description: 'Positive achievements to celebrate' },
                          warnings: { type: 'array', description: 'Issues needing attention' },
                          insights: { type: 'array', description: 'Actionable productivity advice' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth': {
        get: {
          operationId: 'verifyAuth',
          summary: 'Verify API key and get user info. Use this to confirm connection is working.',
          responses: {
            '200': { description: 'Authentication status and user info' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'API key from Focus app. Generate at POST /api/v1/auth with email+password.',
        },
      },
      schemas: {
        Dashboard: {
          type: 'object',
          properties: {
            greeting: { type: 'string' },
            date: { type: 'string' },
            summary: {
              type: 'object',
              properties: {
                urgent_tasks: { type: 'integer' },
                tasks_due_today: { type: 'integer' },
                overdue_tasks: { type: 'integer' },
                total_open_tasks: { type: 'integer' },
                meetings_today: { type: 'integer' },
                pending_todos: { type: 'integer' },
                time_blocks_today: { type: 'integer' },
                active_projects: { type: 'integer' },
              },
            },
            urgent_tasks: { type: 'array' },
            tasks_due_today: { type: 'array' },
            overdue_tasks: { type: 'array' },
            meetings_today: { type: 'array' },
            pending_todos: { type: 'array' },
            schedule_today: { type: 'array' },
          },
        },
        TaskList: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            tasks: { type: 'array' },
          },
        },
        ProjectList: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            projects: { type: 'array' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }

  return apiResponse(schema)
}

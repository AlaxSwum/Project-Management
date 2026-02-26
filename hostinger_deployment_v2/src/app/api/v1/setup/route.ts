import { NextRequest } from 'next/server'
import { apiResponse, handleCORS } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bayyefskgflbyyuwrlgm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * GET /api/v1/setup
 * Check API system status.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check if table exists by trying to query it
    const { error: checkError } = await supabase
      .from('api_keys')
      .select('id')
      .limit(1)

    if (checkError && checkError.message.includes('does not exist')) {
      return apiResponse({
        status: 'table_missing',
        message: 'The api_keys table needs to be created. POST to this endpoint to create it automatically.',
      })
    }

    if (checkError) {
      return apiResponse({ status: 'error', message: checkError.message }, 500)
    }

    const { data: keys } = await supabase
      .from('api_keys')
      .select('id, name, is_active, created_at, last_used_at, user_id')

    return apiResponse({
      status: 'ready',
      message: 'API system is set up and ready!',
      existing_keys: keys || [],
      endpoints: {
        setup: 'GET /api/v1/setup - This page',
        generate_key: 'POST /api/v1/auth - Generate API key with { email, password }',
        verify_key: 'GET /api/v1/auth - Verify API key (Bearer token)',
        dashboard: 'GET /api/v1/dashboard - Full daily summary',
        tasks: 'GET /api/v1/tasks - Tasks (filters: status, priority, due)',
        create_task: 'POST /api/v1/tasks - Create task { title, project_id }',
        projects: 'GET /api/v1/projects - All projects',
        meetings: 'GET /api/v1/meetings - Meetings (filter: today/upcoming/past)',
        todos: 'GET /api/v1/todos - Personal todos',
        create_todo: 'POST /api/v1/todos - Create todo { title }',
        schedule: 'GET /api/v1/schedule - Time blocks (date param)',
        openapi: 'GET /api/v1/openapi - OpenAPI schema for ChatGPT',
      },
    })
  } catch (err: any) {
    return apiResponse({ error: 'Setup check failed', details: err.message }, 500)
  }
}

/**
 * POST /api/v1/setup
 * Create the api_keys table automatically.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Try to create the table using rpc('sql', ...)
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL DEFAULT 'Default API Key',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_used_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    `

    const { error: rpcError } = await supabase.rpc('sql', { query: createTableSQL })

    if (rpcError) {
      return apiResponse({
        status: 'manual_setup_required',
        message: 'Could not auto-create table. Please run this SQL in Supabase Dashboard → SQL Editor:',
        sql: `CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Default API Key',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all api_keys operations" ON api_keys
    FOR ALL USING (true) WITH CHECK (true);`,
        rpc_error: rpcError.message,
      })
    }

    // Now enable RLS and add policy
    await supabase.rpc('sql', {
      query: `ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;`
    })
    await supabase.rpc('sql', {
      query: `CREATE POLICY "Allow all api_keys operations" ON api_keys FOR ALL USING (true) WITH CHECK (true);`
    })

    return apiResponse({
      status: 'created',
      message: 'api_keys table created successfully! Now generate your API key:',
      next_step: 'POST /api/v1/auth with { "email": "your@email.com", "password": "yourpassword" }',
    })
  } catch (err: any) {
    return apiResponse({ error: 'Table creation failed', details: err.message }, 500)
  }
}

import { NextRequest } from 'next/server'
import { apiResponse, handleCORS } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

export async function OPTIONS() {
  return handleCORS()
}

/**
 * POST /api/v1/migrate
 * Run pending database migrations.
 * This uses the Supabase Management API via the service role key.
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = 'https://bayyefskgflbyyuwrlgm.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM'
  const supabase = createClient(supabaseUrl, supabaseKey)

  // First try rpc('sql'), then provide manual instructions
  try {
    const { error: rpcError } = await supabase.rpc('sql', {
      query: `
        DROP INDEX IF EXISTS idx_meeting_notes_unique_meeting;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_notes_unique_meeting_date ON meeting_notes(meeting_id, date);
        ALTER TABLE projects_meeting ADD COLUMN IF NOT EXISTS agenda_overrides jsonb DEFAULT '{}';
      `
    })

    if (!rpcError) {
      return apiResponse({
        status: 'success',
        message: 'Migration complete: per-day notes + per-occurrence agenda for recurring meetings.',
      })
    }

    // rpc('sql') not available - provide manual SQL
    return apiResponse({
      status: 'manual_required',
      message: 'Please run this SQL in Supabase Dashboard → SQL Editor:',
      sql: `-- Fix 1: Allow per-day notes for recurring meetings
DROP INDEX IF EXISTS idx_meeting_notes_unique_meeting;
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_notes_unique_meeting_date ON meeting_notes(meeting_id, date);

-- Fix 2: Allow per-occurrence agenda items for recurring meetings
ALTER TABLE projects_meeting ADD COLUMN IF NOT EXISTS agenda_overrides jsonb DEFAULT '{}';`,
      instructions: [
        '1. Go to https://supabase.com/dashboard',
        '2. Select your project (bayyefskgflbyyuwrlgm)',
        '3. Click "SQL Editor" in the left sidebar',
        '4. Paste the SQL above and click "Run"',
        '5. Done! Recurring meetings will now have separate notes and agenda per day.',
      ],
    })
  } catch (err: any) {
    return apiResponse({ error: 'Migration failed', details: err.message }, 500)
  }
}

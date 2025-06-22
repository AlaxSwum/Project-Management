'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DatabaseSetup() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const createMeetingNotesTable = async () => {
    setLoading(true);
    setStatus('Creating meeting_notes table...');

    try {
      // First, try to create the table
      const { error: createError } = await supabase.rpc('sql', {
        query: `
          CREATE TABLE IF NOT EXISTS meeting_notes (
              id BIGSERIAL PRIMARY KEY,
              meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              date DATE NOT NULL,
              time TIME NOT NULL,
              attendees TEXT[] DEFAULT '{}',
              discussion_points TEXT[] DEFAULT '{}',
              decisions_made TEXT[] DEFAULT '{}',
              action_items TEXT[] DEFAULT '{}',
              next_steps TEXT[] DEFAULT '{}',
              follow_up_date DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createError) {
        console.error('Error creating table:', createError);
        
        // Try alternative method using direct SQL execution
        const { error: altError } = await supabase
          .from('meeting_notes')
          .select('id')
          .limit(1);

        if (altError && altError.code === '42P01') {
          setStatus('❌ Table creation failed. Please create the table manually in Supabase dashboard.');
          setLoading(false);
          return;
        } else if (!altError) {
          setStatus('✅ Table already exists!');
          setLoading(false);
          return;
        }
      }

      // Create indexes
      await supabase.rpc('sql', {
        query: `
          CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);
          CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_notes_unique_meeting 
          ON meeting_notes(meeting_id);
        `
      });

      // Enable RLS
      await supabase.rpc('sql', {
        query: `ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;`
      });

      // Create RLS policies
      const policies = [
        `
        CREATE POLICY "Users can view meeting notes for accessible meetings" ON meeting_notes
        FOR SELECT USING (
            meeting_id IN (
                SELECT m.id 
                FROM meetings m
                JOIN projects p ON p.id = m.project
                WHERE p.created_by = auth.uid()
                OR p.id IN (
                    SELECT project_id 
                    FROM tasks 
                    WHERE assignee = auth.uid() OR created_by = auth.uid()
                )
            )
        );
        `,
        `
        CREATE POLICY "Users can create meeting notes for accessible meetings" ON meeting_notes
        FOR INSERT WITH CHECK (
            meeting_id IN (
                SELECT m.id 
                FROM meetings m
                JOIN projects p ON p.id = m.project
                WHERE p.created_by = auth.uid()
                OR p.id IN (
                    SELECT project_id 
                    FROM tasks 
                    WHERE assignee = auth.uid() OR created_by = auth.uid()
                )
            )
        );
        `,
        `
        CREATE POLICY "Users can update meeting notes for accessible meetings" ON meeting_notes
        FOR UPDATE USING (
            meeting_id IN (
                SELECT m.id 
                FROM meetings m
                JOIN projects p ON p.id = m.project
                WHERE p.created_by = auth.uid()
                OR p.id IN (
                    SELECT project_id 
                    FROM tasks 
                    WHERE assignee = auth.uid() OR created_by = auth.uid()
                )
            )
        );
        `,
        `
        CREATE POLICY "Users can delete meeting notes for accessible meetings" ON meeting_notes
        FOR DELETE USING (
            meeting_id IN (
                SELECT m.id 
                FROM meetings m
                JOIN projects p ON p.id = m.project
                WHERE p.created_by = auth.uid()
                OR p.id IN (
                    SELECT project_id 
                    FROM tasks 
                    WHERE assignee = auth.uid() OR created_by = auth.uid()
                )
            )
        );
        `
      ];

      for (const policy of policies) {
        await supabase.rpc('sql', { query: policy });
      }

      setStatus('✅ Meeting notes table created successfully with all policies!');
    } catch (error) {
      console.error('Setup error:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setLoading(false);
  };

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing database connection...');

    try {
      const { data, error } = await supabase
        .from('meeting_notes')
        .select('count(*)')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          setStatus('⚠️ Table does not exist. Click "Create Table" to set it up.');
        } else {
          setStatus(`❌ Connection error: ${error.message}`);
        }
      } else {
        setStatus('✅ Connection successful! Table exists and is accessible.');
      }
    } catch (error) {
      setStatus(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Setup</h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Meeting Notes Table Setup</h2>
              <p className="text-blue-700 mb-4">
                This utility helps you set up the meeting_notes table required for the meeting notes feature.
              </p>
              
              <div className="flex gap-4 mb-4">
                <button
                  onClick={testConnection}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Connection'}
                </button>
                
                <button
                  onClick={createMeetingNotesTable}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Table'}
                </button>
              </div>
              
              {status && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="font-mono text-sm">{status}</p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Manual Setup Instructions</h3>
              <p className="text-yellow-700 mb-2">
                If the automatic setup doesn't work, you can manually create the table in Supabase:
              </p>
              <ol className="list-decimal list-inside text-yellow-700 text-sm space-y-1">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Run the SQL commands from the create_meeting_notes_table.sql file</li>
                <li>Refresh this page and test the connection</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SQL Commands</h3>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`-- Create meeting_notes table
CREATE TABLE IF NOT EXISTS meeting_notes (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    attendees TEXT[] DEFAULT '{}',
    discussion_points TEXT[] DEFAULT '{}',
    decisions_made TEXT[] DEFAULT '{}',
    action_items TEXT[] DEFAULT '{}',
    next_steps TEXT[] DEFAULT '{}',
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_notes_unique_meeting ON meeting_notes(meeting_id);

-- Enable RLS
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
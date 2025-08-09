'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DatabaseSetup() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Tables listing state
  interface TableInfo {
    table_name: string;
    table_schema: string;
    table_type: string;
  }
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string>('');

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

  const fetchSupabaseTables = async () => {
    setTablesLoading(true);
    setTablesError('');
    try {
      // Prefer RPC function if available
      const { data, error } = await supabase.rpc('list_public_tables');
      if (error) throw error;
      setTables((data as any) || []);
    } catch (err: any) {
      console.error('Fetch tables error:', err);
      setTables([]);
      setTablesError('Could not fetch tables. Please run add_list_public_tables_function.sql in Supabase SQL editor.');
    } finally {
      setTablesLoading(false);
    }
  };

  const createTodoItemsTable = async () => {
    setLoading(true);
    setStatus('Creating todo_items table...');

    try {
      // Create todo_items table (simplified schema)
      const { error: createError } = await supabase.rpc('sql', {
        query: `
          CREATE TABLE IF NOT EXISTS todo_items (
              id SERIAL PRIMARY KEY,
              project_id INTEGER NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT,
              completed BOOLEAN DEFAULT FALSE,
              due_date DATE,
              created_by INTEGER NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createError) {
        console.error('Error creating todo table:', createError);
        
        // Try to check if table exists
        const { error: altError } = await supabase
          .from('todo_items')
          .select('id')
          .limit(1);

        if (altError && altError.code === '42P01') {
          setStatus('❌ Todo table creation failed. Please create the table manually in Supabase dashboard.');
          setLoading(false);
          return;
        } else if (!altError) {
          setStatus('✅ Todo table already exists!');
          setLoading(false);
          return;
        }
      }

      // Create indexes (simplified)  
      await supabase.rpc('sql', {
        query: `
          CREATE INDEX IF NOT EXISTS idx_todo_items_project_id ON todo_items(project_id);
          CREATE INDEX IF NOT EXISTS idx_todo_items_created_by ON todo_items(created_by);
          CREATE INDEX IF NOT EXISTS idx_todo_items_due_date ON todo_items(due_date);
          CREATE INDEX IF NOT EXISTS idx_todo_items_completed ON todo_items(completed);
        `
      });

      // Enable RLS
      await supabase.rpc('sql', {
        query: `ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;`
      });

      // Create RLS policies (updated table references)
      const todoPolicies = [
        `
        CREATE POLICY "Users can view todos for accessible projects" ON todo_items
        FOR SELECT USING (
            project_id IN (
                SELECT DISTINCT p.id 
                FROM projects_project p
                LEFT JOIN projects_project_members pm ON p.id = pm.project_id
                WHERE p.created_by_id = auth.uid()::INTEGER 
                   OR pm.user_id = auth.uid()::INTEGER
            )
        );
        `,
        `
        CREATE POLICY "Users can create todos for accessible projects" ON todo_items
        FOR INSERT WITH CHECK (
            created_by = auth.uid()::INTEGER AND
            project_id IN (
                SELECT DISTINCT p.id 
                FROM projects_project p
                LEFT JOIN projects_project_members pm ON p.id = pm.project_id
                WHERE p.created_by_id = auth.uid()::INTEGER 
                   OR pm.user_id = auth.uid()::INTEGER
            )
        );
        `,
        `
        CREATE POLICY "Users can update their own todos" ON todo_items
        FOR UPDATE USING (created_by = auth.uid()::INTEGER);
        `,
        `
        CREATE POLICY "Users can delete their own todos" ON todo_items
        FOR DELETE USING (created_by = auth.uid()::INTEGER);
        `
      ];

      for (const policy of todoPolicies) {
        await supabase.rpc('sql', { query: policy });
      }

      setStatus('✅ Todo items table created successfully with all policies!');
    } catch (error) {
      console.error('Todo setup error:', error);
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

  const testTodoConnection = async () => {
    setLoading(true);
    setStatus('Testing todo_items table connection...');

    try {
      const { data, error } = await supabase
        .from('todo_items')
        .select('count(*)')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          setStatus('⚠️ Todo table does not exist. Click "Create Todo Table" to set it up.');
        } else {
          setStatus(`❌ Todo table error: ${error.message}`);
        }
      } else {
        setStatus('✅ Todo table connection successful! Table exists and is accessible.');
      }
    } catch (error) {
      setStatus(`❌ Todo test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white p-6">
            <h1 className="text-2xl font-bold">Database Setup</h1>
            <p className="text-gray-300 mt-2">Set up and test database tables for the project management system</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Supabase Tables Listing */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Supabase Tables</h2>
                <div className="flex flex-wrap gap-4 mb-4">
                  <button
                    onClick={fetchSupabaseTables}
                    disabled={tablesLoading}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tablesLoading ? 'Fetching...' : 'Fetch Tables'}
                  </button>
                </div>
                {tablesError && (
                  <div className="p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200 mb-3">
                    {tablesError}
                  </div>
                )}
                {tables.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tables.map((t) => (
                          <tr key={`${t.table_schema}.${t.table_name}`}>
                            <td className="px-4 py-2 text-sm text-gray-900">{t.table_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{t.table_schema}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{t.table_type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {/* Meeting Notes Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Notes Table</h2>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <button
                    onClick={createMeetingNotesTable}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Meeting Notes Table'}
                  </button>
                  
                  <button
                    onClick={testConnection}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* Todo Items Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Todo Items Table</h2>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <button
                    onClick={createTodoItemsTable}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Todo Items Table'}
                  </button>
                  
                  <button
                    onClick={testTodoConnection}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Testing...' : 'Test Todo Table'}
                  </button>
                </div>
              </div>

              {/* Status Display */}
              {status && (
                <div className={`p-4 rounded-lg ${
                  status.includes('✅') ? 'bg-green-50 border border-green-200' :
                  status.includes('❌') ? 'bg-red-50 border border-red-200' :
                  status.includes('⚠️') ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`font-medium ${
                    status.includes('✅') ? 'text-green-800' :
                    status.includes('❌') ? 'text-red-800' :
                    status.includes('⚠️') ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {status}
                  </p>
                </div>
              )}

              {/* Manual Setup Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Manual Setup Instructions</h3>
                <p className="text-yellow-700 mb-2">
                  If automatic setup doesn't work, you can manually create tables in Supabase:
                </p>
                <ol className="list-decimal list-inside text-yellow-700 text-sm space-y-1">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Run the SQL commands below</li>
                  <li>Refresh this page and test the connection</li>
                </ol>
              </div>

              {/* SQL Commands for Meeting Notes */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Meeting Notes SQL Commands</h3>
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

              {/* SQL Commands for Todo Items */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Todo Items SQL Commands (Simplified)</h3>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`-- Create todo_items table (simplified: title, description, due_date only)
CREATE TABLE IF NOT EXISTS todo_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_todo_items_project_id ON todo_items(project_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_created_by ON todo_items(created_by);
CREATE INDEX IF NOT EXISTS idx_todo_items_due_date ON todo_items(due_date);
CREATE INDEX IF NOT EXISTS idx_todo_items_completed ON todo_items(completed);

-- Enable RLS
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
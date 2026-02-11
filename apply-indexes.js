// Apply database indexes for performance
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://bayyefskgflbyyuwrlgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI1ODQzMCwiZXhwIjoyMDY1ODM0NDMwfQ.8kTOQKzxI-mW8JJlTdYNWXXBQCVmhqQvuBZxe0gGDLo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyIndexes() {
  try {
    console.log('Applying database indexes...');
    
    const sql = fs.readFileSync('./FIX_PROJECT_MEMBERS_PERFORMANCE.sql', 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error applying indexes:', error);
    } else {
      console.log('Indexes applied successfully!');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

applyIndexes();

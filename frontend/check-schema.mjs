import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bayyefskgflbyyuwrlgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  try {
    console.log('🔍 Checking projects_meeting table schema...');
    
    // Try to get one record to see what columns exist
    const { data, error } = await supabase
      .from('projects_meeting')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying table:', error.message);
    } else {
      if (data && data.length > 0) {
        console.log('✅ Found data! Available columns in projects_meeting:');
        console.log(Object.keys(data[0]).sort());
        console.log('\n📋 Sample record structure:');
        console.log(data[0]);
      } else {
        console.log('📝 Table exists but no data found');
        
        // Try to insert and immediately delete a test record to see what columns are required
        console.log('🧪 Testing table structure with empty insert...');
        const { error: insertError } = await supabase
          .from('projects_meeting')
          .insert([{}]);
        
        if (insertError) {
          console.log('📊 Insert error reveals required columns:', insertError.message);
        }
      }
    }
    
    // Also check if we can query with attendee_ids specifically
    console.log('\n🔍 Testing attendee_ids column specifically...');
    const { data: testData, error: testError } = await supabase
      .from('projects_meeting')
      .select('id, attendee_ids')
      .limit(1);
    
    if (testError) {
      console.log('❌ attendee_ids column test failed:', testError.message);
      console.log('🔧 attendee_ids column does NOT exist in database');
    } else {
      console.log('✅ attendee_ids column exists and is accessible');
    }
    
  } catch (error) {
    console.error('💥 Exception:', error.message);
  }
  
  process.exit(0);
}

checkTableSchema(); 
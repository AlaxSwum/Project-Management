const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './frontend/.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.log('Key:', supabaseAnonKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugInstructorAssignments() {
  try {
    console.log('🔍 Debugging instructor assignments...\n');

    // 1. Check instructors in auth_user
    const { data: instructors, error: instructorsError } = await supabase
      .from('auth_user')
      .select('id, name, email, role')
      .eq('role', 'instructor');

    console.log('👨‍🏫 Instructors in auth_user:');
    if (instructorsError) {
      console.error('❌ Error:', instructorsError);
    } else {
      console.table(instructors || []);
    }

    // 2. Check classes table for instructor assignments
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, class_title, instructor_id, instructor_name, status')
      .limit(10);

    console.log('\n📚 Classes with instructor assignments:');
    if (classesError) {
      console.error('❌ Error:', classesError);
    } else {
      console.table((classes || []).map(c => ({
        id: c.id,
        title: c.class_title?.substring(0, 30) + '...',
        instructor_id: c.instructor_id,
        instructor_name: c.instructor_name,
        status: c.status
      })));
    }

    // 3. Check classes_instructors junction table
    const { data: junctionData, error: junctionError } = await supabase
      .from('classes_instructors')
      .select(`
        class_id,
        instructor_id,
        is_active,
        classes(id, class_title),
        auth_user(id, name, email)
      `);

    console.log('\n🔗 Classes-Instructors junction table:');
    if (junctionError) {
      console.error('❌ Error:', junctionError);
    } else {
      console.table((junctionData || []).map(j => ({
        class_id: j.class_id,
        class_title: j.classes?.class_title?.substring(0, 30) + '...',
        instructor_id: j.instructor_id,
        instructor_name: j.auth_user?.name,
        is_active: j.is_active
      })));
    }

    // 4. Check if specific instructor (84) has assignments
    const instructorId = 84;
    const { data: specificAssignments, error: specificError } = await supabase
      .from('classes_instructors')
      .select(`
        class_id,
        is_active,
        classes(id, class_title, status)
      `)
      .eq('instructor_id', instructorId)
      .eq('is_active', true);

    console.log(`\n🎯 Assignments for instructor ID ${instructorId}:`);
    if (specificError) {
      console.error('❌ Error:', specificError);
    } else {
      console.table((specificAssignments || []).map(a => ({
        class_id: a.class_id,
        class_title: a.classes?.class_title?.substring(0, 40) + '...',
        status: a.classes?.status,
        is_active: a.is_active
      })));
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugInstructorAssignments();

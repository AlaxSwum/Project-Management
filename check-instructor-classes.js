const { createClient } = require('@supabase/supabase-js');

// Hardcode credentials for debug
const supabaseUrl = 'https://bayyefskgflbyyuwrlgm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NzE4NDcsImV4cCI6MjA2MjU0Nzg0N30.KHjFz3qcELfBVP2-pu-2lhd7YGz9kOZp-TxE2YWfGw8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkInstructorClasses() {
  try {
    console.log('🔍 Checking instructor "Kaung Zin Thu" and classes...\n');

    // 1. Find instructor in auth_user table
    console.log('👨‍🏫 Looking for instructor in auth_user table:');
    const { data: instructors, error: instructorError } = await supabase
      .from('auth_user')
      .select('id, name, email, role')
      .eq('role', 'instructor');

    if (instructorError) {
      console.error('❌ Error:', instructorError);
    } else {
      console.table(instructors || []);
      
      // Find Kaung Zin Thu specifically
      const kaungInstructor = instructors?.find(i => 
        i.name?.toLowerCase().includes('kaung') || 
        i.email?.includes('kaungzinthu')
      );
      
      if (kaungInstructor) {
        console.log('\n🎯 Found Kaung Zin Thu:', kaungInstructor);
        
        // 2. Check classes assigned to this instructor by name
        console.log('\n📚 Checking classes where instructor_name matches:');
        const { data: classByName, error: nameError } = await supabase
          .from('classes')
          .select('id, class_title, instructor_name, instructor_id, status')
          .eq('instructor_name', kaungInstructor.name);

        if (nameError) {
          console.error('❌ Error:', nameError);
        } else {
          console.log(`Classes with instructor_name = "${kaungInstructor.name}":`);
          console.table(classByName || []);
        }

        // 3. Check if instructor_id column exists and has assignments
        console.log('\n🔗 Checking classes with instructor_id:');
        const { data: classById, error: idError } = await supabase
          .from('classes')
          .select('id, class_title, instructor_name, instructor_id, status')
          .eq('instructor_id', kaungInstructor.id);

        if (idError) {
          console.log('❌ instructor_id column likely doesn\'t exist:', idError.message);
        } else {
          console.log(`Classes with instructor_id = ${kaungInstructor.id}:`);
          console.table(classById || []);
        }

        // 4. Check classes_instructors junction table
        console.log('\n🔗 Checking classes_instructors junction table:');
        const { data: junctionClasses, error: junctionError } = await supabase
          .from('classes_instructors')
          .select('class_id, instructor_id, is_active, classes(id, class_title, status)')
          .eq('instructor_id', kaungInstructor.id);

        if (junctionError) {
          console.log('❌ Junction table error:', junctionError.message);
        } else {
          console.log(`Junction table assignments for instructor ${kaungInstructor.id}:`);
          console.table((junctionClasses || []).map(j => ({
            class_id: j.class_id,
            class_title: j.classes?.class_title,
            status: j.classes?.status,
            is_active: j.is_active
          })));
        }

      } else {
        console.log('\n❌ Could not find Kaung Zin Thu in instructors');
      }
    }

    // 5. Check all classes that contain "Kaung" or similar in instructor_name
    console.log('\n🔍 Checking ALL classes that might be assigned to Kaung:');
    const { data: allKaungClasses, error: allError } = await supabase
      .from('classes')
      .select('id, class_title, instructor_name, status')
      .or('instructor_name.ilike.*kaung*, instructor_name.ilike.*zin*, instructor_name.ilike.*thu*');

    if (allError) {
      console.error('❌ Error:', allError);
    } else {
      console.log('Classes with instructor_name containing "kaung", "zin", or "thu":');
      console.table(allKaungClasses || []);
    }

    // 6. Sample of all classes to see the structure
    console.log('\n📋 Sample of all classes (first 5):');
    const { data: sampleClasses, error: sampleError } = await supabase
      .from('classes')
      .select('id, class_title, instructor_name, status')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error:', sampleError);
    } else {
      console.table(sampleClasses || []);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkInstructorClasses();

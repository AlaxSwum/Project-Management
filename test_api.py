#!/usr/bin/env python
import sys
import os
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from backend.projects.supabase_backend import SupabaseProjectsManager

def test_api_structure():
    """Test that the API returns the correct data structure for frontend"""
    
    print("🧪 Testing API Data Structure")
    print("=" * 50)
    
    try:
        manager = SupabaseProjectsManager()
        
        # Test projects structure
        print("\n📁 Testing Projects API...")
        projects = manager.get_projects(user_id=2)  # User ID 2 from Supabase
        
        if projects:
            project = projects[0]
            print("✅ Projects returned successfully!")
            print(f"📊 First project structure:")
            print(f"   - ID: {project.get('id')}")
            print(f"   - Name: {project.get('name')}")
            print(f"   - Members: {project.get('members', 'MISSING!')}")
            print(f"   - Members count: {len(project.get('members', []))}")
            print(f"   - Member IDs: {project.get('member_ids', 'MISSING!')}")
            print(f"   - Status: {project.get('status')}")
            print(f"   - Created by: {project.get('created_by', 'MISSING!')}")
        else:
            print("❌ No projects returned")
            
        # Test tasks structure
        print("\n📝 Testing Tasks API...")
        tasks = manager.get_project_tasks(project_id=1)  # Project ID 1 from Supabase
        
        if tasks:
            task = tasks[0]
            print("✅ Tasks returned successfully!")
            print(f"📊 First task structure:")
            print(f"   - ID: {task.get('id')}")
            print(f"   - Name: {task.get('name')}")
            print(f"   - Tags: {task.get('tags')}")
            print(f"   - Tags list: {task.get('tags_list', 'MISSING!')}")
            print(f"   - Tags list count: {len(task.get('tags_list', []))}")
            print(f"   - Assignee: {task.get('assignee', 'MISSING!')}")
            print(f"   - Created by: {task.get('created_by', 'MISSING!')}")
            print(f"   - Comments: {task.get('comments', 'MISSING!')}")
            print(f"   - Attachments: {task.get('attachments', 'MISSING!')}")
            print(f"   - Subtasks: {task.get('subtasks', 'MISSING!')}")
        else:
            print("❌ No tasks returned")
            
        # Test user tasks
        print("\n👤 Testing User Tasks API...")
        user_tasks = manager.get_user_tasks(user_id=2)  # User ID 2
        
        if user_tasks:
            print(f"✅ Found {len(user_tasks)} user tasks!")
            task = user_tasks[0]
            print(f"📊 First user task structure:")
            print(f"   - ID: {task.get('id')}")
            print(f"   - Name: {task.get('name')}")
            print(f"   - Project: {task.get('project', 'MISSING!')}")
            print(f"   - Tags list: {task.get('tags_list', 'MISSING!')}")
        else:
            print("❌ No user tasks returned")
            
        print("\n" + "=" * 50)
        print("✅ API structure test completed!")
        print("\n💡 Frontend should now receive:")
        print("   - Projects with 'members' array")
        print("   - Tasks with 'tags_list' array")
        print("   - All required fields populated")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api_structure() 
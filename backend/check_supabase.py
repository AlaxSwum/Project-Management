#!/usr/bin/env python
import os
from supabase import create_client, Client

def check_supabase():
    """Check Supabase connection and list tables using the API"""
    
    # Supabase configuration
    SUPABASE_URL = "https://bayyefskgflbyyuwrlgm.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM"
    
    try:
        print("🔗 Connecting to Supabase...")
        
        # Create Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        print("✅ Supabase client created successfully!")
        print(f"📍 URL: {SUPABASE_URL}")
        
        # Try to list tables by attempting to query common table names
        print("\n🔍 Checking for existing tables...")
        
        # Common table names to check (expanded list)
        table_names = [
            'users', 'auth_user', 'profiles', 'projects', 'tasks',
            'authentication_user', 'project_user', 'user_profiles',
            'projects_project', 'projects_task', 'project_members',
            'task_assignments', 'project_templates', 'categories'
        ]
        
        existing_tables = []
        
        for table_name in table_names:
            try:
                print(f"   Checking {table_name}...")
                result = supabase.table(table_name).select("*").limit(1).execute()
                if result.data is not None:
                    existing_tables.append(table_name)
                    count_result = supabase.table(table_name).select("*", count="exact").execute()
                    count = count_result.count if hasattr(count_result, 'count') else len(result.data)
                    print(f"   ✅ Found table: {table_name} (≥{count} records)")
            except Exception as e:
                error_msg = str(e).lower()
                if "does not exist" in error_msg or "relation" in error_msg:
                    print(f"   ❌ Table {table_name} not found")
                else:
                    print(f"   ⚠️  Table {table_name}: {str(e)[:50]}...")
        
        if existing_tables:
            print(f"\n📊 Found {len(existing_tables)} tables:")
            for table in existing_tables:
                print(f"   • {table}")
                
                # Get sample data from each table
                try:
                    sample = supabase.table(table).select("*").limit(3).execute()
                    if sample.data:
                        print(f"     Sample data columns: {list(sample.data[0].keys())}")
                        for record in sample.data:
                            print(f"     - {record}")
                    print()
                except Exception as e:
                    print(f"     Error getting sample data: {e}")
                    print()
        else:
            print("⚠️  No tables found with standard names")
        
        # Special focus on projects data
        print("\n🗂️  CHECKING PROJECTS DATA:")
        project_table_names = ['projects', 'projects_project', 'project']
        
        for table_name in project_table_names:
            try:
                result = supabase.table(table_name).select("*").execute()
                if result.data:
                    print(f"✅ Found {len(result.data)} projects in table '{table_name}':")
                    for project in result.data:
                        print(f"   - {project}")
                    break
            except Exception as e:
                continue
        else:
            print("❌ No project data found in any table")
            
        return True
        
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False

if __name__ == "__main__":
    check_supabase() 
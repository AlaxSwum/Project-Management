#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from django.db import connection

def check_database():
    try:
        # Test database connection
        print("Testing database connection...")
        cursor = connection.cursor()
        
        # Get all tables in the public schema
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"\n✅ Database connection successful!")
        print(f"📊 Found {len(tables)} tables in the database:")
        print("-" * 40)
        
        for table in tables:
            table_name = table[0]
            print(f"📋 {table_name}")
            
            # Get column info for each table
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = %s AND table_schema = 'public'
                ORDER BY ordinal_position;
            """, [table_name])
            
            columns = cursor.fetchall()
            for col in columns[:5]:  # Show first 5 columns
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                print(f"   ├─ {col[0]} ({col[1]}) {nullable}")
            
            if len(columns) > 5:
                print(f"   └─ ... and {len(columns) - 5} more columns")
            print()
        
        # Check for auth_user table specifically
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name = 'auth_user' AND table_schema = 'public';
        """)
        auth_table_exists = cursor.fetchone()[0] > 0
        
        if auth_table_exists:
            cursor.execute("SELECT COUNT(*) FROM auth_user;")
            user_count = cursor.fetchone()[0]
            print(f"👥 Found {user_count} users in auth_user table")
            
            if user_count > 0:
                cursor.execute("SELECT id, email, name FROM auth_user LIMIT 5;")
                users = cursor.fetchall()
                print("📋 Sample users:")
                for user in users:
                    print(f"   - ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
        else:
            print("⚠️  No auth_user table found - will need to run migrations")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    check_database() 
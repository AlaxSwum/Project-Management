#!/usr/bin/env python
import requests
import json

def test_login():
    """Test login functionality with Supabase users"""
    
    # Backend URL
    LOGIN_URL = "http://localhost:8000/api/auth/login/"
    
    # Test users from your Supabase database
    test_users = [
        {
            "email": "swumpyaealax@gmail.com",
            "password": "test123",  # You'll need to provide the actual password
            "name": "Swum Pyae Sone (Admin)"
        },
        {
            "email": "alaxenderps2002@gmail.com", 
            "password": "test123",  # You'll need to provide the actual password
            "name": "Swum Pyae Sone (Developer)"
        }
    ]
    
    print("🔐 Testing Login Functionality")
    print("=" * 50)
    
    for user in test_users:
        print(f"\n👤 Testing login for: {user['name']}")
        print(f"📧 Email: {user['email']}")
        
        # Login request
        login_data = {
            "email": user["email"],
            "password": user["password"]
        }
        
        try:
            response = requests.post(LOGIN_URL, json=login_data)
            
            print(f"📡 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Login Successful!")
                print(f"🔑 Access Token: {data.get('access', 'N/A')[:50]}...")
                print(f"👤 User ID: {data.get('user', {}).get('id', 'N/A')}")
                print(f"📧 User Email: {data.get('user', {}).get('email', 'N/A')}")
                print(f"🏷️  User Role: {data.get('user', {}).get('role', 'N/A')}")
                
            else:
                print("❌ Login Failed!")
                try:
                    error_data = response.json()
                    print(f"🚨 Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"🚨 Error: {response.text}")
                    
        except requests.exceptions.ConnectionError:
            print("❌ Connection Error: Backend server is not running")
            print("   Please make sure Django server is running on http://localhost:8000")
            break
        except Exception as e:
            print(f"❌ Unexpected Error: {e}")
    
    print("\n" + "=" * 50)
    print("💡 Note: If login fails, you may need to:")
    print("   1. Provide the correct passwords for your Supabase users")
    print("   2. Check if the backend server is running")
    print("   3. Verify Supabase connection is working")

if __name__ == "__main__":
    test_login() 
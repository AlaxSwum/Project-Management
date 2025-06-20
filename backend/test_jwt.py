#!/usr/bin/env python
import os
import sys
import django
import json

# Add the project directory to the Python path
sys.path.append('/Users/swumpyaesone/Documents/project_management/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from authentication.backends import SupabaseAuthBackend
from projects.supabase_backend import SupabaseProjectsManager
from django.contrib.auth import get_user_model

User = get_user_model()

def test_jwt_flow():
    """Test the complete JWT authentication flow"""
    print("🔍 TESTING JWT AUTHENTICATION FLOW")
    print("=" * 50)
    
    # Step 1: Test authentication backend
    print("1. Testing Supabase Authentication Backend...")
    auth_backend = SupabaseAuthBackend()
    
    # Try to authenticate a user
    user = auth_backend.authenticate(None, username="swumpyaealax@gmail.com", password="password123")
    
    if user:
        print(f"✅ Authentication successful: {user.email} (ID: {user.id})")
        
        # Step 2: Create JWT token
        print("\n2. Creating JWT tokens...")
        try:
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            print(f"✅ Tokens created successfully")
            print(f"   Access Token (first 50 chars): {str(access_token)[:50]}...")
            print(f"   Refresh Token (first 50 chars): {str(refresh)[:50]}...")
            
            # Step 3: Decode the access token to see what's inside
            print("\n3. Analyzing token contents...")
            try:
                token_payload = access_token.payload
                print(f"   Token payload: {json.dumps(token_payload, indent=2)}")
                
                # Step 4: Test token validation
                print("\n4. Testing token validation...")
                from authentication.jwt_auth import SupabaseJWTAuthentication
                
                jwt_auth = SupabaseJWTAuthentication()
                
                # Create a mock request with the token
                class MockRequest:
                    def __init__(self, token):
                        self.META = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
                
                mock_request = MockRequest(str(access_token))
                
                try:
                    validated_user, validated_token = jwt_auth.authenticate(mock_request)
                    if validated_user:
                        print(f"✅ Token validation successful: {validated_user}")
                        print(f"   User type: {type(validated_user)}")
                        print(f"   User ID: {getattr(validated_user, 'id', 'No ID')}")
                        print(f"   Is authenticated: {getattr(validated_user, 'is_authenticated', 'Unknown')}")
                    else:
                        print("❌ Token validation returned None")
                        
                except Exception as e:
                    print(f"❌ Token validation failed: {e}")
                    import traceback
                    traceback.print_exc()
                    
            except Exception as e:
                print(f"❌ Token analysis failed: {e}")
                
        except Exception as e:
            print(f"❌ Token creation failed: {e}")
            import traceback
            traceback.print_exc()
            
    else:
        print("❌ Authentication failed")
    
    # Step 5: Test direct Supabase user lookup
    print("\n5. Testing Supabase user lookup...")
    supabase_manager = SupabaseProjectsManager()
    users = supabase_manager.get_all_users()
    print(f"   Found {len(users)} users in Supabase:")
    for user_data in users:
        print(f"   - {user_data['email']} (ID: {user_data['id']})")

if __name__ == "__main__":
    test_jwt_flow() 
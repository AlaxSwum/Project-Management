#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def get_test_token():
    # Get the first user or create one
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        print(f"Created test user: {user.email}")
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    print(f"User: {user.name} ({user.email})")
    print(f"User ID: {user.id}")
    print(f"Access Token: {access_token}")
    print(f"\nTo test in browser console, run:")
    print(f'localStorage.setItem("token", "{access_token}");')
    
    return access_token

if __name__ == "__main__":
    get_test_token() 
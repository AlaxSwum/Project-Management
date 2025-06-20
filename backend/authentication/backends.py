from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from projects.supabase_backend import SupabaseProjectsManager

User = get_user_model()

class SupabaseAuthBackend(BaseBackend):
    """
    Custom authentication backend that authenticates against Supabase
    instead of Django's built-in auth system
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user against Supabase
        """
        if not username or not password:
            return None
            
        try:
            supabase_manager = SupabaseProjectsManager()
            
            # Get user with password for authentication
            user_data = supabase_manager.get_user_for_authentication(username)
            
            if not user_data:
                return None
            
            # Verify password using Django's check_password
            if check_password(password, user_data.get('password', '')):
                # Create Django user object for session/JWT purposes (not saved to DB)
                django_user = User(
                    id=user_data['id'],
                    email=user_data['email'],
                    name=user_data['name'],
                    phone=user_data.get('phone', ''),
                    role=user_data['role'],
                    position=user_data.get('position', ''),
                    is_active=user_data.get('is_active', True),
                    is_superuser=user_data.get('is_superuser', False)
                )
                return django_user
            
            return None
            
        except Exception as e:
            print(f"Supabase authentication error: {e}")
            return None
    

    
    def get_user(self, user_id):
        """
        Get user by ID from Supabase
        """
        try:
            supabase_manager = SupabaseProjectsManager()
            user_data = supabase_manager.get_user_by_id(user_id)
            
            if user_data:
                return User(
                    id=user_data['id'],
                    email=user_data['email'],
                    name=user_data['name'],
                    phone=user_data.get('phone', ''),
                    role=user_data['role'],
                    position=user_data.get('position', ''),
                    is_active=user_data.get('is_active', True),
                    is_superuser=user_data.get('is_superuser', False)
                )
            return None
            
        except Exception as e:
            print(f"Error getting user from Supabase: {e}")
            return None 
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.contrib.auth import get_user_model
from projects.supabase_backend import SupabaseProjectsManager

User = get_user_model()

class SupabaseJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that fetches users from Supabase instead of Django database
    """
    
    def get_user(self, validated_token):
        """
        Override the get_user method to fetch user data from Supabase
        """
        try:
            user_id = validated_token.get('user_id')
            if not user_id:
                raise AuthenticationFailed('Token contained no recognizable user identification')
            
            # Get user from Supabase
            supabase_manager = SupabaseProjectsManager()
            user_data = supabase_manager.get_user_by_id(user_id)
            
            if not user_data:
                raise AuthenticationFailed('User not found in Supabase')
            
            # Create a Django user object (not saved to database)
            user = User(
                id=user_data['id'],
                email=user_data['email'],
                name=user_data['name'],
                phone=user_data.get('phone', ''),
                role=user_data['role'],
                position=user_data.get('position', ''),
                is_active=user_data.get('is_active', True),
                is_superuser=user_data.get('is_superuser', False)
            )
            
            return user
            
        except Exception as e:
            raise AuthenticationFailed(f'Failed to authenticate user: {str(e)}') 
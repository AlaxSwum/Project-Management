from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
User = get_user_model()
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT tokens"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get current user profile from Supabase"""
    from projects.supabase_backend import SupabaseProjectsManager
    
    # Get fresh user data from Supabase
    supabase_manager = SupabaseProjectsManager()
    all_users = supabase_manager.get_all_users()
    
    # Find current user in Supabase data
    current_user_data = None
    for user in all_users:
        if user['id'] == request.user.id:
            current_user_data = user
            break
    
    if current_user_data:
        return Response({
            'id': current_user_data['id'],
            'email': current_user_data['email'],
            'name': current_user_data['name'],
            'phone': current_user_data.get('phone', ''),
            'role': current_user_data['role'],
            'position': current_user_data.get('position', ''),
            'date_joined': current_user_data.get('date_joined'),
        })
    else:
        # Fallback to user object data
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update current user profile in Supabase"""
    from projects.supabase_backend import SupabaseProjectsManager
    
    # Update user in Supabase
    supabase_manager = SupabaseProjectsManager()
    updated_user = supabase_manager.update_user_in_supabase(request.user.id, request.data)
    
    if updated_user:
        return Response({
            'id': updated_user['id'],
            'email': updated_user['email'],
            'name': updated_user['name'],
            'phone': updated_user.get('phone', ''),
            'role': updated_user['role'],
            'position': updated_user.get('position', ''),
            'date_joined': updated_user.get('date_joined'),
        })
    else:
        return Response({'error': 'Failed to update user profile'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_user_registration(request):
    """Debug endpoint to check user registration system"""
    from projects.supabase_backend import SupabaseProjectsManager
    
    supabase_manager = SupabaseProjectsManager()
    all_users = supabase_manager.get_all_users()
    
    return Response({
        'current_user': {
            'id': request.user.id,
            'email': request.user.email,
            'name': request.user.name
        },
        'supabase_users_count': len(all_users),
        'supabase_users': all_users,
        'database_mode': 'SUPABASE_ONLY',
        'message': 'Registration system now uses ONLY Supabase - no local database storage'
    })

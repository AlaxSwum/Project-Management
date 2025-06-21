from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from projects.supabase_backend import SupabaseProjectsManager


class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('developer', 'Developer'),
        ('designer', 'Designer'),
        ('analyst', 'Analyst'),
        ('member', 'Member'),
    ], default='member')
    position = serializers.CharField(max_length=100, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        """Check if email already exists in Supabase"""
        supabase_manager = SupabaseProjectsManager()
        all_users = supabase_manager.get_all_users()
        
        # Check if email already exists in Supabase
        for user in all_users:
            if user['email'].lower() == value.lower():
                raise serializers.ValidationError("User with this email already exists.")
        
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        # Create user ONLY in Supabase
        supabase_manager = SupabaseProjectsManager()
        supabase_user = supabase_manager.create_user_in_supabase(validated_data)
        
        if supabase_user:
            # Create a minimal Django user object ONLY for JWT token purposes
            # This user is NOT saved to the database
            user = User(
                id=supabase_user['id'],
                email=supabase_user['email'],
                name=supabase_user['name'],
                phone=supabase_user.get('phone', ''),
                role=supabase_user['role'],
                position=supabase_user.get('position', ''),
                is_active=supabase_user['is_active'],
                is_superuser=supabase_user['is_superuser']
            )
            # Don't save to database - just return the object for JWT
        return user
        else:
            raise serializers.ValidationError("Failed to create user in Supabase")


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')

        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'phone', 'role', 'position', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined'] 
from django.shortcuts import render, get_object_or_404
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Project, Task, TaskComment, TaskAttachment, ProjectTemplate, Meeting, LeaveRequest, EmployeeLeaveBalance
from .serializers import (
    ProjectSerializer, UserSerializer, TaskSerializer, 
    TaskCommentSerializer, TaskAttachmentSerializer, ProjectTemplateSerializer, MeetingSerializer,
    LeaveRequestSerializer, EmployeeLeaveBalanceSerializer
)
from .supabase_backend import SupabaseProjectsManager
from .google_drive_manager import GoogleDriveManager
import mimetypes
from django.core.files.storage import default_storage
from django.conf import settings
import os

User = get_user_model()


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_list_create(request):
    """List all projects or create a new project using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    if request.method == 'GET':
        # Get projects for the current user
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists and all_users:
            user_id = all_users[0]['id']  # Use first available user as fallback
        
        projects = supabase_manager.get_projects(user_id=user_id)
        return Response(projects)
    
    elif request.method == 'POST':
        # Create a new project
        project_data = request.data.copy()
        
        # Validate that the user exists in Supabase
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists:
            # Fallback: use the first available user or create the missing user
            if all_users:
                user_id = all_users[0]['id']  # Use first available user
                print(f"User {request.user.id} not found in Supabase, using user {user_id} instead")
            else:
                return Response({'error': 'No users available in Supabase'}, status=status.HTTP_400_BAD_REQUEST)
        
        project_data['created_by_id'] = user_id
        project_data['status'] = project_data.get('status', 'planning')
        project_data['project_type'] = project_data.get('project_type', 'general')
        project_data['is_archived'] = False
        
        # Ensure required fields have values
        if not project_data.get('name'):
            return Response({'error': 'Project name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set default values for other fields
        project_data['description'] = project_data.get('description', '')
        project_data['color'] = project_data.get('color', '#3B82F6')
        
        # Clean up date fields - convert empty strings to None
        date_fields = ['start_date', 'due_date']
        for field in date_fields:
            if field in project_data and (project_data[field] == '' or project_data[field] is None):
                project_data[field] = None
        
        project = supabase_manager.create_project(project_data)
        if project:
            return Response(project, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to create project'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def project_detail(request, pk):
    """Retrieve, update or delete a project using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    if request.method == 'GET':
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists and all_users:
            user_id = all_users[0]['id']  # Use first available user as fallback
        
        project = supabase_manager.get_project(pk, user_id=user_id)
        if project:
            return Response(project)
        else:
            return Response({'error': 'Project not found or access denied'}, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'PUT':
        # Check if user has access to this project
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists and all_users:
            user_id = all_users[0]['id']  # Use first available user as fallback
        
        if not supabase_manager.user_has_project_access(pk, user_id):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        project = supabase_manager.update_project(pk, request.data)
        if project:
            return Response(project)
        else:
            return Response({'error': 'Failed to update project'}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Check if user has access to this project
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists and all_users:
            user_id = all_users[0]['id']  # Use first available user as fallback
        
        if not supabase_manager.user_has_project_access(pk, user_id):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if supabase_manager.delete_project(pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'error': 'Failed to delete project'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_tasks(request, project_id):
    """List tasks for a project or create a new task using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    # Check if user has access to this project
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    if not supabase_manager.user_has_project_access(project_id, user_id):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        tasks = supabase_manager.get_project_tasks(project_id)
        return Response(tasks)
    
    elif request.method == 'POST':
        # Create a new task using Supabase
        task_data = request.data.copy()
        task_data['project_id'] = project_id
        
        # Validate that the user exists in Supabase
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists and all_users:
            user_id = all_users[0]['id']  # Use first available user as fallback
        
        task_data['created_by_id'] = user_id
        
        # Clean up date fields - convert empty strings to None
        date_fields = ['due_date', 'start_date']
        for field in date_fields:
            if field in task_data and (task_data[field] == '' or task_data[field] is None):
                task_data[field] = None
        
        # Clean up numeric fields - convert empty strings to None
        numeric_fields = ['assignee_id', 'estimated_hours']
        for field in numeric_fields:
            if field in task_data and (task_data[field] == '' or task_data[field] is None):
                task_data[field] = None
        
        created_task = supabase_manager.create_task(task_data)
        if created_task:
            return Response(created_task, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to create task'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    """Get all users for adding to projects from Supabase"""
    supabase_manager = SupabaseProjectsManager()
    users = supabase_manager.get_all_users()
    return Response(users)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_supabase(request):
    """Debug endpoint to test Supabase connection and data"""
    supabase_manager = SupabaseProjectsManager()
    
    try:
        # Test connection and get basic info
        users = supabase_manager.get_all_users()
        
        # Use fallback user logic for projects
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists and all_users:
            user_id = all_users[0]['id']  # Use first available user as fallback
        
        projects = supabase_manager.get_projects(user_id=user_id)
        
        # Test task table structure
        try:
            sample_task = supabase_manager.supabase.table('projects_task').select('*').limit(1).execute()
        except Exception as e:
            sample_task = f"Error: {e}"
        
        debug_info = {
            'current_user_id': request.user.id,
            'effective_user_id': user_id,
            'user_exists_in_supabase': user_exists,
            'users_count': len(users),
            'users': users,
            'projects_count': len(projects),
            'projects': projects,
            'sample_task_data': sample_task.data if hasattr(sample_task, 'data') else str(sample_task),
            'all_user_emails': [u['email'] for u in users]
        }
        
        return Response(debug_info)
        
    except Exception as e:
        return Response({'error': str(e), 'current_user_id': request.user.id}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_projects(request):
    """Get projects for the current user using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    projects = supabase_manager.get_projects(user_id=user_id)
    return Response(projects)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_tasks(request):
    """Get tasks assigned to the current user using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    tasks = supabase_manager.get_user_tasks(user_id=user_id)
    return Response(tasks)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_members(request, project_id):
    """Get or add project members using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    # Check if user has access to this project
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    if not supabase_manager.user_has_project_access(project_id, user_id):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        members = supabase_manager.get_project_members(project_id)
        return Response(members)
    
    elif request.method == 'POST':
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        success = supabase_manager.add_project_member(project_id, user_id)
        if success:
            return Response({'message': 'Member added successfully'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to add member'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_project_member(request, project_id, user_id):
    """Remove a member from a project using Supabase"""
    supabase_manager = SupabaseProjectsManager()
        
        # Check if user has access to this project
    current_user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == current_user_id for user in all_users)
    
    if not user_exists and all_users:
        current_user_id = all_users[0]['id']  # Use first available user as fallback
    
    if not supabase_manager.user_has_project_access(project_id, current_user_id):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    success = supabase_manager.remove_project_member(project_id, user_id)
    if success:
        return Response({'message': 'Member removed successfully'}, status=status.HTTP_204_NO_CONTENT)
    else:
        return Response({'error': 'Failed to remove member'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder_tasks(request):
    """Reorder tasks within a project - placeholder for Supabase implementation"""
    return Response({'status': 'success'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_task_status(request, task_id):
    """Update task status using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    new_status = request.data.get('status')
    
    if not new_status:
        return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    updated_task = supabase_manager.update_task_status(task_id, new_status)
    if updated_task:
        return Response(updated_task)
    else:
        return Response({'error': 'Failed to update task status'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_task(request, task_id):
    """Update or delete a task using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    if request.method == 'PUT':
        # Prepare task data
        task_data = request.data.copy()
        
        # Clean up date fields - convert empty strings to None
        date_fields = ['due_date', 'start_date']
        for field in date_fields:
            if field in task_data and (task_data[field] == '' or task_data[field] is None):
                task_data[field] = None
        
        # Clean up numeric fields - convert empty strings to None
        numeric_fields = ['assignee_id', 'estimated_hours']
        for field in numeric_fields:
            if field in task_data and (task_data[field] == '' or task_data[field] is None):
                task_data[field] = None
        
        updated_task = supabase_manager.update_task(task_id, task_data)
        if updated_task:
            return Response(updated_task)
        else:
            return Response({'error': 'Failed to update task'}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        success = supabase_manager.delete_task(task_id)
        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'error': 'Failed to delete task'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_task(request, project_id):
    """Create a new task using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    # Prepare task data
    task_data = request.data.copy()
    task_data['project_id'] = project_id
    
    # Validate that the user exists in Supabase
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    task_data['created_by_id'] = user_id
    
    # Clean up date fields - convert empty strings to None
    date_fields = ['due_date', 'start_date']
    for field in date_fields:
        if field in task_data and (task_data[field] == '' or task_data[field] is None):
            task_data[field] = None
    
    # Clean up numeric fields - convert empty strings to None
    numeric_fields = ['assignee_id', 'estimated_hours']
    for field in numeric_fields:
        if field in task_data and (task_data[field] == '' or task_data[field] is None):
            task_data[field] = None
    
    created_task = supabase_manager.create_task(task_data)
    if created_task:
        return Response(created_task, status=status.HTTP_201_CREATED)
    else:
        return Response({'error': 'Failed to create task'}, status=status.HTTP_400_BAD_REQUEST)


# Supabase-based Comments and Attachments views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_comments_supabase(request, task_id):
    """List comments for a task or create a new comment using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    # Get current user ID
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    if request.method == 'GET':
        comments = supabase_manager.get_task_comments(task_id)
        return Response(comments)
    
    elif request.method == 'POST':
        comment_text = request.data.get('comment')
        if not comment_text:
            return Response({'error': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        comment = supabase_manager.create_task_comment(task_id, user_id, comment_text)
        if comment:
            return Response(comment, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to create comment'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_attachments_supabase(request, task_id):
    """List attachments for a task or create a new attachment using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    # Get current user ID
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    if request.method == 'GET':
        attachments = supabase_manager.get_task_attachments(task_id)
        return Response(attachments)
    
    elif request.method == 'POST':
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # For now, just store metadata - in production you'd upload to storage
        attachment = supabase_manager.create_task_attachment(
            task_id, 
            user_id, 
            uploaded_file.name, 
            uploaded_file.size, 
            uploaded_file.content_type
        )
        
        if attachment:
            return Response(attachment, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to create attachment'}, status=status.HTTP_400_BAD_REQUEST)


# Legacy Django ORM views for features not yet migrated to Supabase
class TaskRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            project__in=Project.objects.filter(
                models.Q(created_by=user) | models.Q(members=user)
            )
        ).select_related('assignee', 'created_by', 'project').prefetch_related(
            'comments', 'attachments', 'subtasks'
        )


class TaskCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        user = self.request.user
        
        # Check if user has access to this task
        task = get_object_or_404(
            Task.objects.filter(
                project__in=Project.objects.filter(
                    models.Q(created_by=user) | models.Q(members=user)
                )
            ),
            id=task_id
        )
        
        return TaskComment.objects.filter(task=task).select_related('user')

    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        user = self.request.user
        
        # Check if user has access to this task
        task = get_object_or_404(
            Task.objects.filter(
                project__in=Project.objects.filter(
                    models.Q(created_by=user) | models.Q(members=user)
                )
            ),
            id=task_id
        )
        
        serializer.save(user=user, task=task)


class TaskAttachmentListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        user = self.request.user
        
        # Check if user has access to this task
        task = get_object_or_404(
            Task.objects.filter(
                project__in=Project.objects.filter(
                    models.Q(created_by=user) | models.Q(members=user)
                )
            ),
            id=task_id
        )
        
        return TaskAttachment.objects.filter(task=task).select_related('user')

    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        user = self.request.user
        
        # Check if user has access to this task
        task = get_object_or_404(
            Task.objects.filter(
                project__in=Project.objects.filter(
                    models.Q(created_by=user) | models.Q(members=user)
                )
            ),
            id=task_id
        )
        
        serializer.save(user=user, task=task)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_project_templates(request):
    """Get available project templates"""
    templates = ProjectTemplate.objects.filter(
        models.Q(is_public=True) | models.Q(created_by=request.user)
    ).prefetch_related('template_tasks')
    serializer = ProjectTemplateSerializer(templates, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_project_from_template(request, template_id):
    """Create a new project from a template"""
    try:
        template = ProjectTemplate.objects.get(id=template_id)
        project_data = request.data
        
        # Create the project
        project = Project.objects.create(
            name=project_data.get('name', template.name),
            description=project_data.get('description', template.description),
            project_type=template.project_type,
            created_by=request.user,
            start_date=project_data.get('start_date'),
            due_date=project_data.get('due_date'),
        )
        
        # Add members if provided
        member_ids = project_data.get('member_ids', [])
        if member_ids:
            members = User.objects.filter(id__in=member_ids)
            project.members.set(members)
        
        # Create tasks from template
        for template_task in template.template_tasks.all():
            Task.objects.create(
                name=template_task.name,
                description=template_task.description,
                project=project,
                created_by=request.user,
                priority=template_task.priority,
                estimated_hours=template_task.estimated_hours,
                position=template_task.position,
            )
        
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=201)
        
    except ProjectTemplate.DoesNotExist:
        return Response({'error': 'Template not found'}, status=404)

# Old class-based views for reference/fallback
class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return projects where user is either creator or member
        user = self.request.user
        return Project.objects.filter(
            models.Q(created_by=user) | models.Q(members=user)
        ).distinct().prefetch_related('members', 'tasks')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return projects where user is either creator or member
        user = self.request.user
        return Project.objects.filter(
            models.Q(created_by=user) | models.Q(members=user)
        ).distinct().prefetch_related('members', 'tasks')


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        user = self.request.user
        
        # Check if user has access to this project
        project = get_object_or_404(
            Project.objects.filter(
                models.Q(created_by=user) | models.Q(members=user)
            ),
            id=project_id
        )
        
        return Task.objects.filter(project=project).select_related(
            'assignee', 'created_by', 'project'
        ).prefetch_related('comments', 'attachments', 'subtasks')

    def create(self, request, *args, **kwargs):
        project_id = self.kwargs.get('project_id')
        print(f"Task creation request for project {project_id}: {request.data}")
        
        # Add project_id to the request data
        data = request.data.copy()
        data['project'] = project_id
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            print(f"Task creation validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        user = self.request.user
        
        # Debug logging
        print(f"Creating task for project {project_id} by user {user}")
        print(f"Request data: {self.request.data}")
        
        # Check if user has access to this project
        project = get_object_or_404(
            Project.objects.filter(
                models.Q(created_by=user) | models.Q(members=user)
            ),
            id=project_id
        )
        
        serializer.save(created_by=user, project=project)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_drive_files(request):
    try:
        folder_id = request.GET.get('folderId')
        drive_manager = GoogleDriveManager()
        files = drive_manager.list_files(folder_id)
        return Response(files)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_drive_files(request):
    try:
        query = request.GET.get('q', '')
        drive_manager = GoogleDriveManager()
        files = drive_manager.search_files(query)
        return Response(files)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_to_drive(request):
    try:
        file = request.FILES.get('file')
        folder_id = request.POST.get('folderId')
        
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save file temporarily
        temp_path = default_storage.save(f'temp/{file.name}', file)
        temp_file_path = os.path.join(settings.MEDIA_ROOT, temp_path)
        
        try:
            drive_manager = GoogleDriveManager()
            file_data = drive_manager.upload_file(temp_file_path, file.name, folder_id)
            return Response(file_data)
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_drive_folder(request):
    try:
        name = request.data.get('name')
        parent_id = request.data.get('parentId')
        
        if not name:
            return Response({'error': 'Folder name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        drive_manager = GoogleDriveManager()
        folder = drive_manager.create_folder(name, parent_id)
        return Response(folder)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Team Reporting and KPI Endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_team_kpi_report(request):
    """Get comprehensive team KPI report with task statistics for each member"""
    try:
        supabase_manager = SupabaseProjectsManager()
        
        # Get all users (team members)
        all_users = supabase_manager.get_all_users()
        
        # Get all tasks for statistics
        all_tasks = supabase_manager.get_all_tasks()
        
        team_report = []
        
        for user in all_users:
            user_id = user['id']
            
            # Filter tasks for this user
            user_tasks = [task for task in all_tasks if task.get('assignee_id') == user_id]
            
            # Calculate KPIs
            total_tasks = len(user_tasks)
            finished_tasks = len([task for task in user_tasks if task.get('status') == 'done'])
            unfinished_tasks = total_tasks - finished_tasks
            in_progress_tasks = len([task for task in user_tasks if task.get('status') == 'in_progress'])
            todo_tasks = len([task for task in user_tasks if task.get('status') == 'todo'])
            review_tasks = len([task for task in user_tasks if task.get('status') == 'review'])
            
            # Calculate overdue tasks
            from datetime import datetime
            current_date = datetime.now().date()
            overdue_tasks = 0
            for task in user_tasks:
                if task.get('due_date') and task.get('status') != 'done':
                    try:
                        due_date_str = task['due_date']
                        # Handle both ISO format and simple date format
                        if 'T' in due_date_str:
                            # ISO format: 2025-06-21T00:00:00+00:00
                            # Extract just the date part before 'T'
                            date_part = due_date_str.split('T')[0]
                            due_date = datetime.strptime(date_part, '%Y-%m-%d').date()
                        else:
                            # Simple format: 2025-06-21
                            due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
                        
                        if due_date < current_date:
                            overdue_tasks += 1
                    except (ValueError, TypeError):
                        continue
            
            # Calculate completion rate
            completion_rate = (finished_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Get user's projects
            user_projects = supabase_manager.get_user_projects(user_id)
            
            # Calculate average task completion time (placeholder - would need completion dates)
            avg_completion_time = 0  # Placeholder for future implementation
            
            team_member_kpi = {
                'user_id': user_id,
                'user_name': user['name'],
                'user_email': user['email'],
                'user_role': user.get('role', 'Member'),
                'user_position': user.get('position', ''),
                'total_tasks': total_tasks,
                'finished_tasks': finished_tasks,
                'unfinished_tasks': unfinished_tasks,
                'in_progress_tasks': in_progress_tasks,
                'todo_tasks': todo_tasks,
                'review_tasks': review_tasks,
                'overdue_tasks': overdue_tasks,
                'completion_rate': round(completion_rate, 1),
                'active_projects': len(user_projects),
                'avg_completion_time': avg_completion_time,
                'last_task_update': None  # Placeholder for future implementation
            }
            
            team_report.append(team_member_kpi)
        
        # Sort by completion rate descending
        team_report.sort(key=lambda x: x['completion_rate'], reverse=True)
        
        return Response({
            'team_report': team_report,
            'summary': {
                'total_team_members': len(team_report),
                'total_tasks_across_team': sum(member['total_tasks'] for member in team_report),
                'total_finished_tasks': sum(member['finished_tasks'] for member in team_report),
                'average_completion_rate': round(sum(member['completion_rate'] for member in team_report) / len(team_report), 1) if team_report else 0
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_member_detailed_report(request, user_id):
    """Get detailed report for a specific team member"""
    try:
        supabase_manager = SupabaseProjectsManager()
        
        # Get user information
        all_users = supabase_manager.get_all_users()
        user = next((u for u in all_users if u['id'] == user_id), None)
        
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get user's tasks with detailed information
        all_tasks = supabase_manager.get_all_tasks()
        user_tasks = [task for task in all_tasks if task.get('assignee_id') == user_id]
        
        # Get user's projects
        user_projects = supabase_manager.get_user_projects(user_id)
        
        # Organize tasks by status
        tasks_by_status = {
            'todo': [task for task in user_tasks if task.get('status') == 'todo'],
            'in_progress': [task for task in user_tasks if task.get('status') == 'in_progress'],
            'review': [task for task in user_tasks if task.get('status') == 'review'],
            'done': [task for task in user_tasks if task.get('status') == 'done']
        }
        
        # Organize tasks by priority
        tasks_by_priority = {
            'urgent': [task for task in user_tasks if task.get('priority') == 'urgent'],
            'high': [task for task in user_tasks if task.get('priority') == 'high'],
            'medium': [task for task in user_tasks if task.get('priority') == 'medium'],
            'low': [task for task in user_tasks if task.get('priority') == 'low']
        }
        
        # Calculate time-based metrics
        from datetime import datetime, timedelta
        current_date = datetime.now().date()
        
        # Tasks due this week
        week_from_now = current_date + timedelta(days=7)
        tasks_due_this_week = []
        overdue_tasks = []
        
        for task in user_tasks:
            if task.get('due_date') and task.get('status') != 'done':
                try:
                    due_date_str = task['due_date']
                    # Handle both ISO format and simple date format
                    if 'T' in due_date_str:
                        # ISO format: 2025-06-21T00:00:00+00:00
                        # Extract just the date part before 'T'
                        date_part = due_date_str.split('T')[0]
                        due_date = datetime.strptime(date_part, '%Y-%m-%d').date()
                    else:
                        # Simple format: 2025-06-21
                        due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
                    
                    if due_date < current_date:
                        overdue_tasks.append(task)
                    elif due_date <= week_from_now:
                        tasks_due_this_week.append(task)
                except (ValueError, TypeError):
                    continue
        
        # Recent activity (tasks updated in last 7 days)
        recent_tasks = []
        week_ago = current_date - timedelta(days=7)
        for task in user_tasks:
            if task.get('updated_at'):
                try:
                    updated_date = datetime.strptime(task['updated_at'][:10], '%Y-%m-%d').date()
                    if updated_date >= week_ago:
                        recent_tasks.append(task)
                except (ValueError, TypeError):
                    continue
        
        detailed_report = {
            'user_info': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user.get('role', 'Member'),
                'position': user.get('position', ''),
                'created_at': user.get('created_at')
            },
            'task_statistics': {
                'total_tasks': len(user_tasks),
                'tasks_by_status': {
                    'todo': len(tasks_by_status['todo']),
                    'in_progress': len(tasks_by_status['in_progress']),
                    'review': len(tasks_by_status['review']),
                    'done': len(tasks_by_status['done'])
                },
                'tasks_by_priority': {
                    'urgent': len(tasks_by_priority['urgent']),
                    'high': len(tasks_by_priority['high']),
                    'medium': len(tasks_by_priority['medium']),
                    'low': len(tasks_by_priority['low'])
                },
                'overdue_tasks': len(overdue_tasks),
                'tasks_due_this_week': len(tasks_due_this_week),
                'recent_activity': len(recent_tasks)
            },
            'project_involvement': {
                'active_projects': len(user_projects),
                'projects': user_projects
            },
            'detailed_tasks': {
                'overdue': overdue_tasks,
                'due_this_week': tasks_due_this_week,
                'recent_activity': recent_tasks,
                'all_tasks': user_tasks
            }
        }
        
        return Response(detailed_report)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_team_performance_analytics(request):
    """Get team performance analytics with trends and comparisons"""
    try:
        supabase_manager = SupabaseProjectsManager()
        
        # Get all data
        all_users = supabase_manager.get_all_users()
        all_tasks = supabase_manager.get_all_tasks()
        all_projects = supabase_manager.get_all_projects()
        
        # Calculate team-wide metrics
        total_tasks = len(all_tasks)
        completed_tasks = len([task for task in all_tasks if task.get('status') == 'done'])
        active_projects = len([proj for proj in all_projects if proj.get('status') != 'completed'])
        
        # Performance by role
        performance_by_role = {}
        for user in all_users:
            role = user.get('role', 'Member')
            if role not in performance_by_role:
                performance_by_role[role] = {
                    'members': 0,
                    'total_tasks': 0,
                    'completed_tasks': 0,
                    'completion_rate': 0
                }
            
            user_tasks = [task for task in all_tasks if task.get('assignee_id') == user['id']]
            user_completed = len([task for task in user_tasks if task.get('status') == 'done'])
            
            performance_by_role[role]['members'] += 1
            performance_by_role[role]['total_tasks'] += len(user_tasks)
            performance_by_role[role]['completed_tasks'] += user_completed
        
        # Calculate completion rates for each role
        for role_data in performance_by_role.values():
            if role_data['total_tasks'] > 0:
                role_data['completion_rate'] = round(role_data['completed_tasks'] / role_data['total_tasks'] * 100, 1)
        
        analytics = {
            'team_overview': {
                'total_members': len(all_users),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'completion_rate': round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0,
                'active_projects': active_projects,
                'total_projects': len(all_projects)
            },
            'performance_by_role': performance_by_role,
            'top_performers': sorted(
                [
                    {
                        'user_name': user['name'],
                        'user_role': user.get('role', 'Member'),
                        'completion_rate': round(
                            len([task for task in all_tasks if task.get('assignee_id') == user['id'] and task.get('status') == 'done']) /
                            max(len([task for task in all_tasks if task.get('assignee_id') == user['id']]), 1) * 100, 1
                        ),
                        'total_tasks': len([task for task in all_tasks if task.get('assignee_id') == user['id']])
                    }
                    for user in all_users
                ],
                key=lambda x: x['completion_rate'],
                reverse=True
            )[:5]  # Top 5 performers
        }
        
        return Response(analytics)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Meeting Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def meeting_list_create(request):
    """List all meetings or create a new meeting using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    if request.method == 'GET':
        # Get meetings for projects the user has access to
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists and all_users:
            user_id = all_users[0]['id']  # Use first available user as fallback
        
        meetings = supabase_manager.get_user_meetings(user_id=user_id)
        return Response(meetings)
    
    elif request.method == 'POST':
        # Create a new meeting
        meeting_data = request.data.copy()
        
        # Validate that the user exists in Supabase
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists:
            if all_users:
                user_id = all_users[0]['id']  # Use first available user
            else:
                return Response({'error': 'No users available in Supabase'}, status=status.HTTP_400_BAD_REQUEST)
        
        meeting_data['created_by_id'] = user_id
        
        # Ensure required fields have values
        if not meeting_data.get('title'):
            return Response({'error': 'Meeting title is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not meeting_data.get('project'):
            return Response({'error': 'Project is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set default values
        meeting_data['description'] = meeting_data.get('description', '')
        meeting_data['duration'] = meeting_data.get('duration', 60)
        meeting_data['attendees'] = meeting_data.get('attendees', '')
        
        meeting = supabase_manager.create_meeting(meeting_data)
        if meeting:
            return Response(meeting, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to create meeting'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def meeting_detail(request, pk):
    """Retrieve, update or delete a meeting using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    if request.method == 'GET':
        user_id = request.user.id
        all_users = supabase_manager.get_all_users()
        user_exists = any(user['id'] == user_id for user in all_users)
        
        if not user_exists and all_users:
            user_id = all_users[0]['id']  # Use first available user as fallback
        
        meeting = supabase_manager.get_meeting(pk, user_id=user_id)
        if meeting:
            return Response(meeting)
        else:
            return Response({'error': 'Meeting not found or access denied'}, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'PUT':
        meeting = supabase_manager.update_meeting(pk, request.data)
        if meeting:
            return Response(meeting)
        else:
            return Response({'error': 'Failed to update meeting'}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if supabase_manager.delete_meeting(pk):
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'error': 'Failed to delete meeting'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_project_meetings(request, project_id):
    """Get meetings for a specific project using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    # Check if user has access to this project
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    if not supabase_manager.user_has_project_access(project_id, user_id):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    meetings = supabase_manager.get_project_meetings(project_id)
    return Response(meetings)


# Leave Request Views (Django ORM with Supabase fallback)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_request_list_create(request):
    """List all leave requests or create a new leave request using Django ORM"""
    
    if request.method == 'GET':
        # Get leave requests for the current user using Django ORM
        leave_requests = LeaveRequest.objects.filter(employee=request.user).order_by('-created_at')
        serializer = LeaveRequestSerializer(leave_requests, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create a new leave request using Django ORM
        try:
            # Calculate days requested
            from datetime import datetime
            start_date = datetime.strptime(request.data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(request.data['end_date'], '%Y-%m-%d').date()
            days_requested = (end_date - start_date).days + 1
            
            # Check if user has enough leave balance
            current_year = datetime.now().year
            balance, created = EmployeeLeaveBalance.objects.get_or_create(
                employee=request.user,
                year=current_year,
                defaults={'total_days': 14, 'used_days': 0}
            )
            
            # Get pending requests
            pending_requests = LeaveRequest.objects.filter(
                employee=request.user,
                status='pending'
            )
            pending_days = sum(req.days_requested for req in pending_requests)
            
            available_days = balance.available_days - pending_days
            if available_days < days_requested:
                return Response({
                    'error': f'Insufficient leave balance. You have {available_days} days available.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create leave request
            leave_request = LeaveRequest.objects.create(
                employee=request.user,
                employee_name=request.user.name,
                employee_email=request.user.email,
                start_date=start_date,
                end_date=end_date,
                leave_type=request.data['leave_type'],
                reason=request.data['reason'],
                notes=request.data.get('notes', ''),
                days_requested=days_requested,
                status='pending'
            )
            
            # Create notification (simplified version)
            # In production, you'd want to notify HR users specifically
            print(f"Leave request created: {leave_request.id} for {request.user.name}")
            
            serializer = LeaveRequestSerializer(leave_request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print(f"ERROR in leave_request_list_create: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            print(f"Request data: {request.data}")
            print(f"Request user: {request.user}")
            return Response({
                'error': f'Failed to create leave request: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leave_balance(request):
    """Get the current user's leave balance using Django ORM"""
    try:
        from datetime import datetime
        current_year = datetime.now().year
        
        # Get or create leave balance for current year
        balance, created = EmployeeLeaveBalance.objects.get_or_create(
            employee=request.user,
            year=current_year,
            defaults={'total_days': 14, 'used_days': 0}
        )
        
        # Get pending requests
        pending_requests = LeaveRequest.objects.filter(
            employee=request.user,
            status='pending'
        )
        pending_days = sum(req.days_requested for req in pending_requests)
        
        # Serialize and add pending days
        serializer = EmployeeLeaveBalanceSerializer(balance)
        data = serializer.data
        data['pending_days'] = pending_days
        
        return Response(data)
        
    except Exception as e:
        import traceback
        print(f"ERROR in get_leave_balance: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        print(f"Request user: {request.user}")
        return Response({
            'error': f'Could not fetch leave balance: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def approve_leave_request(request, request_id):
    """Approve or reject a leave request (HR only) using Supabase"""
    supabase_manager = SupabaseProjectsManager()
    
    # Check if user has HR permissions (you can customize this logic)
    if not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    action = request.data.get('action')  # 'approve' or 'reject'
    if action not in ['approve', 'reject']:
        return Response({'error': 'Invalid action. Use "approve" or "reject"'}, status=status.HTTP_400_BAD_REQUEST)
    
    status_value = 'approved' if action == 'approve' else 'rejected'
    
    user_id = request.user.id
    all_users = supabase_manager.get_all_users()
    user_exists = any(user['id'] == user_id for user in all_users)
    
    if not user_exists and all_users:
        user_id = all_users[0]['id']  # Use first available user as fallback
    
    # Update leave request status
    updated_request = supabase_manager.update_leave_request_status(request_id, status_value, user_id)
    if updated_request:
        return Response(updated_request)
    else:
        return Response({'error': 'Failed to update leave request or request not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get notifications for the current user - simplified version"""
    # For now, return sample notifications
    sample_notifications = [
        {
            'id': 1,
            'type': 'leave_request',
            'title': 'Leave Request System Ready',
            'message': 'You can now submit leave requests through the absence form.',
            'is_read': False,
            'created_at': timezone.now().isoformat()
        }
    ]
    return Response(sample_notifications)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read - simplified version"""
    return Response({'status': 'success'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_notification_count(request):
    """Get count of unread notifications - simplified version"""
    # Return 0 for now since we don't have real notifications yet
    return Response({'count': 0})

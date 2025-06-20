from django.urls import path
from . import views

urlpatterns = [
    # Projects (Supabase-powered)
    path('projects/', views.project_list_create, name='project-list-create'),
    path('projects/<int:pk>/', views.project_detail, name='project-detail'),
    
    # Tasks (Supabase-powered)
    path('projects/<int:project_id>/tasks/', views.project_tasks, name='project-tasks'),
    path('tasks/<int:task_id>/', views.update_task, name='task-update'),
    path('tasks/<int:task_id>/status/', views.update_task_status, name='task-status-update'),
    path('tasks/reorder/', views.reorder_tasks, name='tasks-reorder'),
    
    # Legacy task endpoint (Django ORM - for fallback)
    path('tasks/<int:pk>/legacy/', views.TaskRetrieveUpdateDestroyView.as_view(), name='task-detail-legacy'),
    
    # Task Comments (Supabase-powered)
    path('tasks/<int:task_id>/comments/', views.task_comments_supabase, name='task-comments'),
    
    # Task Attachments (Supabase-powered)
    path('tasks/<int:task_id>/attachments/', views.task_attachments_supabase, name='task-attachments'),
    
    # Users and assignments (Supabase-powered)
    path('users/', views.get_users, name='users-list'),
    path('my-projects/', views.get_user_projects, name='user-projects'),
    path('my-tasks/', views.get_user_tasks, name='user-tasks'),
    
    # Debug endpoint
    path('debug/', views.debug_supabase, name='debug-supabase'),
    
    # Project Members (Supabase-powered)
    path('projects/<int:project_id>/members/', views.project_members, name='project-members'),
    path('projects/<int:project_id>/members/<int:user_id>/', views.remove_project_member, name='remove-project-member'),
    
    # Project Templates (Django ORM - to be migrated later)
    path('templates/', views.get_project_templates, name='project-templates'),
    path('templates/<int:template_id>/create-project/', views.create_project_from_template, name='create-from-template'),
    
    # Google Drive endpoints
    path('drive/files/', views.list_drive_files, name='drive-files'),
    path('drive/search/', views.search_drive_files, name='drive-search'),
    path('drive/upload/', views.upload_to_drive, name='drive-upload'),
    path('drive/create-folder/', views.create_drive_folder, name='drive-create-folder'),
    
    # Team Reporting and KPI endpoints
    path('reporting/team-kpi/', views.get_team_kpi_report, name='team-kpi-report'),
    path('reporting/member/<int:user_id>/', views.get_member_detailed_report, name='member-detailed-report'),
    path('reporting/analytics/', views.get_team_performance_analytics, name='team-performance-analytics'),
    
    # Meeting endpoints
    path('meetings/', views.meeting_list_create, name='meeting-list-create'),
    path('meetings/<int:pk>/', views.meeting_detail, name='meeting-detail'),
    path('projects/<int:project_id>/meetings/', views.get_project_meetings, name='project-meetings'),
    
    # Leave Request endpoints
    path('leave-requests/', views.leave_request_list_create, name='leave-request-list-create'),
    path('leave-balance/', views.get_leave_balance, name='leave-balance'),
    path('leave-requests/<int:request_id>/approve/', views.approve_leave_request, name='approve-leave-request'),
    
    # Notification endpoints
    path('notifications/', views.get_notifications, name='notifications'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    path('notifications/unread-count/', views.get_unread_notification_count, name='unread-notification-count'),
] 
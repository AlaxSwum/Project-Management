from django.contrib import admin
from .models import Project, Task, TaskComment, TaskAttachment, ProjectTemplate, TemplateTask


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'project_type', 'status', 'created_by', 'created_at', 'get_members_count', 'get_tasks_count']
    list_filter = ['project_type', 'status', 'created_at', 'updated_at', 'is_archived']
    search_fields = ['name', 'description', 'created_by__name']
    filter_horizontal = ['members']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_members_count(self, obj):
        return obj.members.count()
    get_members_count.short_description = 'Members'
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()
    get_tasks_count.short_description = 'Tasks'
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'project_type', 'status', 'created_by')
        }),
        ('Dates', {
            'fields': ('start_date', 'due_date')
        }),
        ('Settings', {
            'fields': ('color', 'is_archived')
        }),
        ('Members', {
            'fields': ('members',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'assignee', 'status', 'priority', 'due_date', 'created_by', 'created_at']
    list_filter = ['status', 'priority', 'project', 'created_at', 'due_date']
    search_fields = ['name', 'description', 'project__name', 'assignee__name', 'created_by__name']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'project', 'assignee', 'created_by')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority')
        }),
        ('Dates', {
            'fields': ('start_date', 'due_date', 'completed_at')
        }),
        ('Time Tracking', {
            'fields': ('estimated_hours', 'actual_hours')
        }),
        ('Organization', {
            'fields': ('position', 'parent_task', 'tags')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'comment_preview', 'created_at']
    list_filter = ['created_at', 'task__project']
    search_fields = ['comment', 'task__name', 'user__name']
    readonly_fields = ['created_at', 'updated_at']
    
    def comment_preview(self, obj):
        return obj.comment[:50] + "..." if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Comment'


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'task', 'user', 'file_size', 'created_at']
    list_filter = ['created_at', 'task__project']
    search_fields = ['filename', 'task__name', 'user__name']
    readonly_fields = ['created_at', 'file_size']


class TemplateTaskInline(admin.TabularInline):
    model = TemplateTask
    extra = 0
    ordering = ['position']


@admin.register(ProjectTemplate)
class ProjectTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'project_type', 'is_public', 'created_by', 'created_at']
    list_filter = ['project_type', 'is_public', 'created_at']
    search_fields = ['name', 'description', 'created_by__name']
    readonly_fields = ['created_at']
    inlines = [TemplateTaskInline]
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'project_type', 'is_public', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(TemplateTask)
class TemplateTaskAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'priority', 'position', 'days_after_start']
    list_filter = ['priority', 'template__project_type']
    search_fields = ['name', 'description', 'template__name']
    ordering = ['template', 'position']

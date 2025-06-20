from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Project, Task, TaskComment, TaskAttachment, ProjectTemplate, TemplateTask, Meeting, LeaveRequest, EmployeeLeaveBalance

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'phone', 'role', 'position']


class TaskCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'user', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ['id', 'user', 'file', 'filename', 'file_size', 'created_at']
        read_only_fields = ['created_at', 'filename', 'file_size']

    def create(self, validated_data):
        file = validated_data.get('file')
        if file:
            validated_data['filename'] = file.name
            validated_data['file_size'] = file.size
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    subtasks = serializers.SerializerMethodField()
    assignee_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    tags_list = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'name', 'description', 'project', 'assignee', 'assignee_id',
            'created_by', 'status', 'priority', 'due_date', 'start_date',
            'completed_at', 'estimated_hours', 'actual_hours', 'position',
            'parent_task', 'tags', 'tags_list', 'comments', 'attachments',
            'subtasks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'completed_at']

    def get_subtasks(self, obj):
        if obj.subtasks.exists():
            return TaskSerializer(obj.subtasks.all(), many=True, context=self.context).data
        return []

    def get_tags_list(self, obj):
        if obj.tags:
            return [tag.strip() for tag in obj.tags.split(',') if tag.strip()]
        return []

    def create(self, validated_data):
        assignee_id = validated_data.pop('assignee_id', None)
        tags = validated_data.pop('tags', '')
        
        # Create the task
        task = Task.objects.create(
            **validated_data,
            tags=tags.strip() if tags else ''
        )
        
        # Set assignee if provided
        if assignee_id:
            try:
                assignee = User.objects.get(id=assignee_id)
                task.assignee = assignee
                task.save()
            except User.DoesNotExist:
                pass
        
        return task

    def update(self, instance, validated_data):
        assignee_id = validated_data.pop('assignee_id', None)
        
        # Handle status change to done
        if validated_data.get('status') == 'done' and instance.status != 'done':
            validated_data['completed_at'] = timezone.now()
        elif validated_data.get('status') != 'done':
            validated_data['completed_at'] = None
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if assignee_id is not None:
            if assignee_id == 0:
                instance.assignee = None
            else:
                try:
                    assignee = User.objects.get(id=assignee_id)
                    instance.assignee = assignee
                except User.DoesNotExist:
                    pass
        
        instance.save()
        return instance


class ProjectSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'project_type', 'status', 'members', 
            'member_ids', 'start_date', 'due_date', 'color', 'is_archived',
            'tasks', 'task_count', 'completed_task_count', 'created_at', 
            'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_completed_task_count(self, obj):
        return obj.tasks.filter(status='done').count()

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        project = Project.objects.create(**validated_data)
        
        if member_ids:
            members = User.objects.filter(id__in=member_ids)
            project.members.set(members)
        
        return project

    def update(self, instance, validated_data):
        member_ids = validated_data.pop('member_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if member_ids is not None:
            members = User.objects.filter(id__in=member_ids)
            instance.members.set(members)
        
        return instance


class TemplateTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateTask
        fields = [
            'id', 'name', 'description', 'priority', 'estimated_hours',
            'position', 'days_after_start'
        ]


class ProjectTemplateSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    template_tasks = TemplateTaskSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectTemplate
        fields = [
            'id', 'name', 'description', 'project_type', 'is_public',
            'template_tasks', 'created_by', 'created_at'
        ]
        read_only_fields = ['created_at', 'created_by']


class MeetingSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    attendees_list = serializers.ReadOnlyField()
    attendee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'description', 'project', 'project_name', 'date', 'time', 
            'duration', 'attendees', 'attendees_list', 'attendee_ids',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def create(self, validated_data):
        attendee_ids = validated_data.pop('attendee_ids', [])
        
        # Handle attendees
        if attendee_ids:
            # Get user names for the selected IDs
            users = User.objects.filter(id__in=attendee_ids)
            attendee_names = [user.name for user in users]
            validated_data['attendees'] = ', '.join(attendee_names)
        
        # Create the meeting
        meeting = Meeting.objects.create(**validated_data)
        return meeting

    def update(self, instance, validated_data):
        attendee_ids = validated_data.pop('attendee_ids', None)
        
        # Handle attendees update
        if attendee_ids is not None:
            if attendee_ids:
                # Get user names for the selected IDs
                users = User.objects.filter(id__in=attendee_ids)
                attendee_names = [user.name for user in users]
                validated_data['attendees'] = ', '.join(attendee_names)
            else:
                validated_data['attendees'] = ''
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    employee_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_id', 'employee_name', 'employee_email',
            'start_date', 'end_date', 'leave_type', 'reason', 'notes',
            'days_requested', 'status', 'approved_by', 'approved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'approved_by', 'approved_at']

    def create(self, validated_data):
        employee_id = validated_data.pop('employee_id')
        employee = User.objects.get(id=employee_id)
        
        # Auto-populate employee details
        validated_data['employee'] = employee
        validated_data['employee_name'] = employee.name
        validated_data['employee_email'] = employee.email
        
        return LeaveRequest.objects.create(**validated_data)


class EmployeeLeaveBalanceSerializer(serializers.ModelSerializer):
    employee = UserSerializer(read_only=True)
    available_days = serializers.ReadOnlyField()

    class Meta:
        model = EmployeeLeaveBalance
        fields = [
            'id', 'employee', 'total_days', 'used_days', 'available_days',
            'year', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at'] 
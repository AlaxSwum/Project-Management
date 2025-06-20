from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Project(models.Model):
    PROJECT_TYPES = [
        ('team', 'Team Project'),
        ('marketing', 'Marketing Campaign'),
        ('product', 'Product Development'),
        ('design', 'Design Project'),
        ('engineering', 'Engineering'),
        ('sales', 'Sales Project'),
        ('hr', 'HR Initiative'),
        ('finance', 'Finance Project'),
        ('general', 'General Project'),
    ]
    
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    members = models.ManyToManyField(User, related_name='projects', blank=True)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    color = models.CharField(max_length=7, default='#000000')  # Hex color
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('in_review', 'In Review'),
        ('done', 'Done'),
    ]
    
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateTimeField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    estimated_hours = models.PositiveIntegerField(null=True, blank=True)
    actual_hours = models.PositiveIntegerField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)  # For task ordering
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    tags = models.CharField(max_length=500, blank=True)  # Comma-separated tags
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['position', '-created_at']


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.user.name} on {self.task.name}"

    class Meta:
        ordering = ['-created_at']


class TaskAttachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='task_attachments/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.filename} - {self.task.name}"

    class Meta:
        ordering = ['-created_at']


class ProjectTemplate(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    project_type = models.CharField(max_length=20, choices=Project.PROJECT_TYPES)
    is_public = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TemplateTask(models.Model):
    template = models.ForeignKey(ProjectTemplate, on_delete=models.CASCADE, related_name='template_tasks')
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Task.PRIORITY_CHOICES, default='medium')
    estimated_hours = models.PositiveIntegerField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    days_after_start = models.PositiveIntegerField(default=0)  # Due date relative to project start

    def __str__(self):
        return f"{self.template.name} - {self.name}"

    class Meta:
        ordering = ['position']


class Meeting(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='meetings')
    date = models.DateField()
    time = models.TimeField()
    duration = models.PositiveIntegerField(default=60)  # Duration in minutes
    attendees = models.TextField(blank=True)  # Comma-separated list of attendees
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_meetings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.date} {self.time}"

    class Meta:
        ordering = ['-date', '-time']

    @property
    def attendees_list(self):
        """Return attendees as a list"""
        if self.attendees:
            return [attendee.strip() for attendee in self.attendees.split(',') if attendee.strip()]
        return []


class LeaveRequest(models.Model):
    LEAVE_TYPE_CHOICES = [
        ('vacation', 'Vacation'),
        ('sick', 'Sick Leave'),
        ('personal', 'Personal Leave'),
        ('family', 'Family Emergency'),
        ('medical', 'Medical Appointment'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_requests')
    employee_name = models.CharField(max_length=200)
    employee_email = models.EmailField()
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    reason = models.TextField()
    notes = models.TextField(blank=True, null=True)
    days_requested = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leave_requests')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_name} - {self.leave_type} ({self.start_date} to {self.end_date})"

    class Meta:
        ordering = ['-created_at']


class EmployeeLeaveBalance(models.Model):
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_balance')
    total_days = models.PositiveIntegerField(default=14)
    used_days = models.PositiveIntegerField(default=0)
    year = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def available_days(self):
        return self.total_days - self.used_days

    def __str__(self):
        return f"{self.employee.username} - {self.year} ({self.available_days}/{self.total_days} days available)"

    class Meta:
        unique_together = ['employee', 'year']
        ordering = ['-year']

# Generated by Django 5.2.3 on 2025-06-20 15:30

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0005_remove_meeting_assignee"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LeaveRequest",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("employee_name", models.CharField(max_length=200)),
                ("employee_email", models.EmailField(max_length=254)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                (
                    "leave_type",
                    models.CharField(
                        choices=[
                            ("vacation", "Vacation"),
                            ("sick", "Sick Leave"),
                            ("personal", "Personal Leave"),
                            ("family", "Family Emergency"),
                            ("medical", "Medical Appointment"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                ("reason", models.TextField()),
                ("notes", models.TextField(blank=True, null=True)),
                ("days_requested", models.PositiveIntegerField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "approved_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="approved_leave_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "employee",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="leave_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="EmployeeLeaveBalance",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("total_days", models.PositiveIntegerField(default=14)),
                ("used_days", models.PositiveIntegerField(default=0)),
                ("year", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "employee",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="leave_balance",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-year"],
                "unique_together": {("employee", "year")},
            },
        ),
    ]

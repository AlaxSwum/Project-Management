from django.conf import settings
from supabase import create_client, Client
from rest_framework import status
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

class SupabaseProjectsManager:
    """
    Manager for handling project and task operations via Supabase API
    """
    
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_ANON_KEY
        )
    
    def get_projects(self, user_id=None):
        """Get projects where user is creator or member"""
        try:
            if not user_id:
                return []
            
            # Get projects where user is creator
            created_projects = self.supabase.table('projects_project').select('*').eq('created_by_id', user_id).execute()
            
            # Get projects where user is a member
            member_projects_result = self.supabase.table('projects_project_members').select(
                'project_id, projects_project(*)'
            ).eq('user_id', user_id).execute()
            
            all_projects = []
            project_ids_seen = set()
            
            # Add created projects
            if created_projects.data:
                for project in created_projects.data:
                    if project['id'] not in project_ids_seen:
                        all_projects.append(project)
                        project_ids_seen.add(project['id'])
            
            # Add member projects
            if member_projects_result.data:
                for member_data in member_projects_result.data:
                    project = member_data.get('projects_project')
                    if project and project['id'] not in project_ids_seen:
                        all_projects.append(project)
                        project_ids_seen.add(project['id'])
            
            # Format projects
            projects = []
            for project in all_projects:
                # Get creator info
                creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', project['created_by_id']).execute()
                creator = creator_result.data[0] if creator_result.data else None
                
                # Get all members
                members = self.get_project_members(project['id'])
                if creator and not any(m['id'] == creator['id'] for m in members):
                    members.insert(0, creator)  # Ensure creator is always in members list
                
                projects.append({
                    'id': project['id'],
                    'name': project['name'],
                    'description': project['description'],
                    'project_type': project['project_type'],
                    'status': project['status'],
                    'color': project['color'],
                    'start_date': project['start_date'],
                    'due_date': project['due_date'],
                    'is_archived': project['is_archived'],
                    'created_at': project['created_at'],
                    'updated_at': project['updated_at'],
                    'created_by_id': project['created_by_id'],
                    'created_by': creator,
                    'members': members,
                    'member_ids': [m['id'] for m in members],
                })
            return projects
            
        except Exception as e:
            logger.error(f"Error fetching projects from Supabase: {e}")
            return []
    
    def get_project(self, project_id, user_id=None):
        """Get a specific project by ID (with access control)"""
        try:
            # Check access if user_id is provided
            if user_id and not self.user_has_project_access(project_id, user_id):
                return None
            
            result = self.supabase.table('projects_project').select('*').eq('id', project_id).execute()
            
            if result.data:
                project = result.data[0]
                
                # Get creator info
                creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', project['created_by_id']).execute()
                creator = creator_result.data[0] if creator_result.data else None
                
                # Get all members
                members = self.get_project_members(project['id'])
                if creator and not any(m['id'] == creator['id'] for m in members):
                    members.insert(0, creator)  # Ensure creator is always in members list
                
                return {
                    'id': project['id'],
                    'name': project['name'],
                    'description': project['description'],
                    'project_type': project['project_type'],
                    'status': project['status'],
                    'color': project['color'],
                    'start_date': project['start_date'],
                    'due_date': project['due_date'],
                    'is_archived': project['is_archived'],
                    'created_at': project['created_at'],
                    'updated_at': project['updated_at'],
                    'created_by_id': project['created_by_id'],
                    'created_by': creator,
                    'members': members,
                    'member_ids': [m['id'] for m in members],
                }
            return None
            
        except Exception as e:
            logger.error(f"Error fetching project {project_id} from Supabase: {e}")
            return None
    
    def create_project(self, project_data):
        """Create a new project in Supabase"""
        try:
            # Clean the project data before insertion
            clean_data = project_data.copy()
            
            # Clean up date fields - convert empty strings to None
            date_fields = ['start_date', 'due_date']
            for field in date_fields:
                if field in clean_data and (clean_data[field] == '' or clean_data[field] is None):
                    clean_data[field] = None
            
            # Add timestamps if not present
            from datetime import datetime
            now = datetime.now().isoformat()
            if 'created_at' not in clean_data:
                clean_data['created_at'] = now
            if 'updated_at' not in clean_data:
                clean_data['updated_at'] = now
            
            result = self.supabase.table('projects_project').insert(clean_data).execute()
            
            if result.data:
                project = result.data[0]
                
                # Get creator info
                creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', project['created_by_id']).execute()
                creator = creator_result.data[0] if creator_result.data else None
                
                return {
                    'id': project['id'],
                    'name': project['name'],
                    'description': project['description'],
                    'project_type': project['project_type'],
                    'status': project['status'],
                    'color': project['color'],
                    'start_date': project['start_date'],
                    'due_date': project['due_date'],
                    'is_archived': project['is_archived'],
                    'created_at': project['created_at'],
                    'updated_at': project['updated_at'],
                    'created_by_id': project['created_by_id'],
                    'created_by': creator,
                    'members': [creator] if creator else [],  # For now, only creator is member
                    'member_ids': [project['created_by_id']] if project['created_by_id'] else [],
                }
            return None
            
        except Exception as e:
            logger.error(f"Error creating project in Supabase: {e}")
            return None
    
    def update_project(self, project_id, project_data):
        """Update an existing project in Supabase"""
        try:
            result = self.supabase.table('projects_project').update(project_data).eq('id', project_id).execute()
            
            if result.data:
                project = result.data[0]
                
                # Get creator info
                creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', project['created_by_id']).execute()
                creator = creator_result.data[0] if creator_result.data else None
                
                return {
                    'id': project['id'],
                    'name': project['name'],
                    'description': project['description'],
                    'project_type': project['project_type'],
                    'status': project['status'],
                    'color': project['color'],
                    'start_date': project['start_date'],
                    'due_date': project['due_date'],
                    'is_archived': project['is_archived'],
                    'created_at': project['created_at'],
                    'updated_at': project['updated_at'],
                    'created_by_id': project['created_by_id'],
                    'created_by': creator,
                    'members': [creator] if creator else [],  # For now, only creator is member
                    'member_ids': [project['created_by_id']] if project['created_by_id'] else [],
                }
            return None
            
        except Exception as e:
            logger.error(f"Error updating project {project_id} in Supabase: {e}")
            return None
    
    def delete_project(self, project_id):
        """Delete a project from Supabase"""
        try:
            # First delete all tasks associated with this project
            try:
                self.supabase.table('projects_task').delete().eq('project_id', project_id).execute()
            except Exception as task_error:
                logger.error(f"Error deleting tasks for project {project_id}: {task_error}")
            
            # Delete project members
            try:
                self.supabase.table('projects_project_members').delete().eq('project_id', project_id).execute()
            except Exception as member_error:
                logger.error(f"Error deleting members for project {project_id}: {member_error}")
            
            # Finally delete the project
            result = self.supabase.table('projects_project').delete().eq('id', project_id).execute()
            return True
            
        except Exception as e:
            logger.error(f"Error deleting project {project_id} from Supabase: {e}")
            return False
    
    def get_project_tasks(self, project_id):
        """Get all tasks for a specific project"""
        try:
            result = self.supabase.table('projects_task').select('*').eq('project_id', project_id).execute()
            
            if result.data:
                tasks = []
                for task in result.data:
                    # Get assignee info if available
                    assignee = None
                    if task['assignee_id']:
                        assignee_result = self.supabase.table('auth_user').select('id, name, email').eq('id', task['assignee_id']).execute()
                        assignee = assignee_result.data[0] if assignee_result.data else None
                    
                    # Get creator info
                    creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', task['created_by_id']).execute()
                    creator = creator_result.data[0] if creator_result.data else None
                    
                    tasks.append({
                        'id': task['id'],
                        'name': task['name'],
                        'description': task['description'],
                        'status': task['status'],
                        'priority': task['priority'],
                        'due_date': task['due_date'],
                        'start_date': task['start_date'],
                        'completed_at': task['completed_at'],
                        'estimated_hours': task['estimated_hours'],
                        'actual_hours': task['actual_hours'],
                        'position': task['position'],
                        'tags': task['tags'],
                        'tags_list': task['tags'].split(',') if task['tags'] else [],  # Convert string to array
                        'created_at': task['created_at'],
                        'updated_at': task['updated_at'],
                        'assignee_id': task['assignee_id'],
                        'assignee': assignee,
                        'created_by_id': task['created_by_id'],
                        'created_by': creator,
                        'parent_task_id': task['parent_task_id'],
                        'project_id': task['project_id'],
                        # Add other fields that frontend might expect
                        'comments': [],  # Placeholder for comments
                        'attachments': [],  # Placeholder for attachments
                        'subtasks': [],  # Placeholder for subtasks
                    })
                return tasks
            return []
            
        except Exception as e:
            logger.error(f"Error fetching tasks for project {project_id} from Supabase: {e}")
            return []
    
    def get_user_tasks(self, user_id):
        """Get all tasks assigned to a specific user"""
        try:
            result = self.supabase.table('projects_task').select('*').eq('assignee_id', user_id).execute()
            
            if result.data:
                tasks = []
                for task in result.data:
                    # Get assignee info
                    assignee_result = self.supabase.table('auth_user').select('id, name, email').eq('id', task['assignee_id']).execute()
                    assignee = assignee_result.data[0] if assignee_result.data else None
                    
                    # Get creator info
                    creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', task['created_by_id']).execute()
                    creator = creator_result.data[0] if creator_result.data else None
                    
                    # Get project info
                    project_result = self.supabase.table('projects_project').select('id, name').eq('id', task['project_id']).execute()
                    project = project_result.data[0] if project_result.data else None
                    
                    tasks.append({
                        'id': task['id'],
                        'name': task['name'],
                        'description': task['description'],
                        'status': task['status'],
                        'priority': task['priority'],
                        'due_date': task['due_date'],
                        'start_date': task['start_date'],
                        'completed_at': task['completed_at'],
                        'estimated_hours': task['estimated_hours'],
                        'actual_hours': task['actual_hours'],
                        'position': task['position'],
                        'tags': task['tags'],
                        'tags_list': task['tags'].split(',') if task['tags'] else [],  # Convert string to array
                        'created_at': task['created_at'],
                        'updated_at': task['updated_at'],
                        'assignee_id': task['assignee_id'],
                        'assignee': assignee,
                        'created_by_id': task['created_by_id'],
                        'created_by': creator,
                        'parent_task_id': task['parent_task_id'],
                        'project_id': task['project_id'],
                        'project': project,
                        # Add other fields that frontend might expect
                        'comments': [],  # Placeholder for comments
                        'attachments': [],  # Placeholder for attachments
                        'subtasks': [],  # Placeholder for subtasks
                    })
                return tasks
            return []
            
        except Exception as e:
            logger.error(f"Error fetching tasks for user {user_id} from Supabase: {e}")
            return []
    
    def create_task(self, task_data):
        """Create a new task in Supabase"""
        try:
            project_id = task_data.get('project_id')
            
            # Set a simple incremental position - use timestamp if position calculation fails
            next_position = 1  # Default fallback
            
            try:
                # Try to get max position first
                position_result = self.supabase.table('projects_task').select('position').eq('project_id', project_id).order('position', desc=True).limit(1).execute()
                
                if position_result.data and len(position_result.data) > 0:
                    max_position = position_result.data[0].get('position')
                    if max_position is not None and isinstance(max_position, (int, float)):
                        next_position = int(max_position) + 1
                    else:
                        next_position = 1
                else:
                    next_position = 1
                    
            except Exception as e:
                # Fallback: use current timestamp as position to ensure uniqueness
                import time
                next_position = int(time.time())
            
            # Prepare the task data for insertion
            from datetime import datetime
            now = datetime.now().isoformat()
            
            insert_data = {
                'name': task_data.get('name'),
                'description': task_data.get('description', ''),
                'project_id': project_id,
                'created_by_id': task_data.get('created_by_id'),
                'status': task_data.get('status', 'todo'),
                'priority': task_data.get('priority', 'medium'),
                'tags': task_data.get('tags', ''),
                'position': next_position,
                'created_at': now,
                'updated_at': now,
            }
            
            # Add optional fields only if they have values (and are not empty strings)
            if task_data.get('assignee_id') and task_data['assignee_id'] != '':
                insert_data['assignee_id'] = task_data['assignee_id']
            if task_data.get('due_date') and task_data['due_date'] != '':
                insert_data['due_date'] = task_data['due_date']
            if task_data.get('start_date') and task_data['start_date'] != '':
                insert_data['start_date'] = task_data['start_date']
            if task_data.get('estimated_hours') and task_data['estimated_hours'] != '':
                insert_data['estimated_hours'] = task_data['estimated_hours']
            
            # Insert the task
            result = self.supabase.table('projects_task').insert(insert_data).execute()
            
            if result.data:
                task = result.data[0]
                formatted_task = self._format_task_data(task)
                return formatted_task
            else:
                return None
            
        except Exception as e:
            logger.error(f"Error creating task in Supabase: {e}")
            return None
    
    def update_task(self, task_id, task_data):
        """Update a task in Supabase"""
        try:
            # Prepare the update data
            from datetime import datetime
            update_data = {
                'updated_at': datetime.now().isoformat()
            }
            
            # Add fields that are being updated
            if 'name' in task_data:
                update_data['name'] = task_data['name']
            if 'description' in task_data:
                update_data['description'] = task_data['description']
            if 'priority' in task_data:
                update_data['priority'] = task_data['priority']
            if 'status' in task_data:
                update_data['status'] = task_data['status']
            if 'assignee_id' in task_data:
                update_data['assignee_id'] = task_data['assignee_id'] if task_data['assignee_id'] and task_data['assignee_id'] != '' else None
            if 'due_date' in task_data:
                update_data['due_date'] = task_data['due_date'] if task_data['due_date'] and task_data['due_date'] != '' else None
            if 'start_date' in task_data:
                update_data['start_date'] = task_data['start_date'] if task_data['start_date'] and task_data['start_date'] != '' else None
            if 'estimated_hours' in task_data:
                update_data['estimated_hours'] = task_data['estimated_hours'] if task_data['estimated_hours'] and task_data['estimated_hours'] != '' else None
            if 'tags' in task_data:
                update_data['tags'] = task_data['tags']
            
            # Update the task
            result = self.supabase.table('projects_task').update(update_data).eq('id', task_id).execute()
            
            if result.data:
                task = result.data[0]
                return self._format_task_data(task)
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating task {task_id} in Supabase: {e}")
            return None
    
    def update_task_status(self, task_id, new_status):
        """Update only the status of a task in Supabase"""
        try:
            from datetime import datetime
            update_data = {
                'status': new_status,
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('projects_task').update(update_data).eq('id', task_id).execute()
            
            if result.data:
                task = result.data[0]
                return self._format_task_data(task)
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating task status for {task_id} in Supabase: {e}")
            return None
    
    def delete_task(self, task_id):
        """Delete a task from Supabase"""
        try:
            result = self.supabase.table('projects_task').delete().eq('id', task_id).execute()
            return True
            
        except Exception as e:
            logger.error(f"Error deleting task {task_id} from Supabase: {e}")
            return False
    
    def _format_task_data(self, task):
        """Format raw task data from Supabase into Django-like format"""
        try:
            # Get assignee info if available
            assignee = None
            if task['assignee_id']:
                assignee_result = self.supabase.table('auth_user').select('id, name, email').eq('id', task['assignee_id']).execute()
                assignee = assignee_result.data[0] if assignee_result.data else None
            
            # Get creator info
            creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', task['created_by_id']).execute()
            creator = creator_result.data[0] if creator_result.data else None
            
            # Get project info if needed
            project = None
            if task.get('project_id'):
                project_result = self.supabase.table('projects_project').select('id, name, description, project_type, status').eq('id', task['project_id']).execute()
                project = project_result.data[0] if project_result.data else None
            
            return {
                'id': task['id'],
                'name': task['name'],
                'description': task['description'],
                'status': task['status'],
                'priority': task['priority'],
                'due_date': task['due_date'],
                'start_date': task['start_date'],
                'completed_at': task.get('completed_at'),
                'estimated_hours': task['estimated_hours'],
                'actual_hours': task['actual_hours'],
                'position': task.get('position'),
                'tags': task['tags'],
                'tags_list': task['tags'].split(',') if task['tags'] else [],
                'created_at': task['created_at'],
                'updated_at': task['updated_at'],
                'assignee_id': task['assignee_id'],
                'assignee': assignee,
                'created_by_id': task['created_by_id'],
                'created_by': creator,
                'parent_task_id': task.get('parent_task_id'),
                'project_id': task['project_id'],
                'project': project,
                # Add other fields that frontend might expect
                'comments': [],  # Placeholder for comments
                'attachments': [],  # Placeholder for attachments
                'subtasks': [],  # Placeholder for subtasks
            }
            
        except Exception as e:
            logger.error(f"Error formatting task data: {e}")
            return None
    
    def add_project_member(self, project_id, user_id):
        """Add a member to a project"""
        try:
            # Check if membership already exists
            existing = self.supabase.table('projects_project_members').select('*').eq('project_id', project_id).eq('user_id', user_id).execute()
            
            if existing.data:
                return True  # Already a member
            
            # Add the membership
            result = self.supabase.table('projects_project_members').insert({
                'project_id': project_id,
                'user_id': user_id
            }).execute()
            
            return result.data is not None
            
        except Exception as e:
            logger.error(f"Error adding project member: {e}")
            return False
    
    def remove_project_member(self, project_id, user_id):
        """Remove a member from a project"""
        try:
            result = self.supabase.table('projects_project_members').delete().eq('project_id', project_id).eq('user_id', user_id).execute()
            return True
            
        except Exception as e:
            logger.error(f"Error removing project member: {e}")
            return False
    
    def get_project_members(self, project_id):
        """Get all members of a project"""
        try:
            # Get members from the junction table
            result = self.supabase.table('projects_project_members').select(
                'user_id, auth_user(id, name, email)'
            ).eq('project_id', project_id).execute()
            
            members = []
            for member_data in result.data:
                user = member_data.get('auth_user')
                if user:
                    members.append({
                        'id': user['id'],
                        'name': user['name'],
                        'email': user['email']
                    })
            
            return members
            
        except Exception as e:
            logger.error(f"Error getting project members: {e}")
            return []
    
    def user_has_project_access(self, project_id, user_id):
        """Check if a user has access to a project (either as creator or member)"""
        try:
            # Check if user is the project creator
            project_result = self.supabase.table('projects_project').select('created_by_id').eq('id', project_id).execute()
            
            if project_result.data and project_result.data[0]['created_by_id'] == user_id:
                return True
            
            # Check if user is a member
            member_result = self.supabase.table('projects_project_members').select('*').eq('project_id', project_id).eq('user_id', user_id).execute()
            
            return member_result.data is not None and len(member_result.data) > 0
            
        except Exception as e:
            logger.error(f"Error checking project access: {e}")
            return False
    
    def get_all_users(self):
        """Get all users from Supabase auth_user table (without passwords)"""
        try:
            result = self.supabase.table('auth_user').select('*').execute()
            
            users = []
            if result.data:
                for user_data in result.data:
                    users.append({
                        'id': user_data['id'],
                        'name': user_data.get('name', user_data.get('email', 'Unknown')),
                        'email': user_data['email'],
                        'role': user_data.get('role', 'member'),
                        'phone': user_data.get('phone', ''),
                        'position': user_data.get('position', ''),
                        'is_active': user_data.get('is_active', True),
                        'is_staff': user_data.get('is_staff', False),
                        'is_superuser': user_data.get('is_superuser', False),
                        'date_joined': user_data.get('date_joined'),
                        'last_login': user_data.get('last_login')
                    })
            
            return users
            
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []
    
    def get_user_for_authentication(self, email):
        """Get user with password for authentication purposes"""
        try:
            result = self.supabase.table('auth_user').select('*').eq('email', email).execute()
            
            if result.data:
                user_data = result.data[0]
                return {
                    'id': user_data['id'],
                    'name': user_data.get('name', user_data.get('email', 'Unknown')),
                    'email': user_data['email'],
                    'password': user_data['password'],  # Include password for authentication
                    'role': user_data.get('role', 'member'),
                    'phone': user_data.get('phone', ''),
                    'position': user_data.get('position', ''),
                    'is_active': user_data.get('is_active', True),
                    'is_staff': user_data.get('is_staff', False),
                    'is_superuser': user_data.get('is_superuser', False),
                    'date_joined': user_data.get('date_joined'),
                    'last_login': user_data.get('last_login')
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting user for authentication: {e}")
            return None
    
    def get_user_by_id(self, user_id):
        """Get user by ID for authentication purposes"""
        try:
            result = self.supabase.table('auth_user').select('*').eq('id', user_id).execute()
            
            if result.data:
                user_data = result.data[0]
                return {
                    'id': user_data['id'],
                    'name': user_data.get('name', user_data.get('email', 'Unknown')),
                    'email': user_data['email'],
                    'role': user_data.get('role', 'member'),
                    'phone': user_data.get('phone', ''),
                    'position': user_data.get('position', ''),
                    'is_active': user_data.get('is_active', True),
                    'is_staff': user_data.get('is_staff', False),
                    'is_superuser': user_data.get('is_superuser', False),
                    'date_joined': user_data.get('date_joined'),
                    'last_login': user_data.get('last_login')
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    def create_user_in_supabase(self, user_data):
        """Create a new user in Supabase auth_user table"""
        try:
            from datetime import datetime
            from django.contrib.auth.hashers import make_password
            
            # Prepare user data for Supabase
            supabase_user_data = {
                'name': user_data.get('name', ''),
                'email': user_data['email'],
                'role': user_data.get('role', 'member'),
                'phone': user_data.get('phone', ''),
                'position': user_data.get('position', ''),
                'password': make_password(user_data['password']),  # Hash the password properly
                'is_active': True,
                'is_staff': user_data.get('role') == 'admin',
                'is_superuser': user_data.get('role') == 'admin',
                'date_joined': datetime.now().isoformat(),
                'last_login': None,
                'updated_at': datetime.now().isoformat()
            }
            
            # Insert user into Supabase
            result = self.supabase.table('auth_user').insert(supabase_user_data).execute()
            
            if result.data:
                created_user = result.data[0]
                return {
                    'id': created_user['id'],
                    'name': created_user['name'],
                    'email': created_user['email'],
                    'role': created_user['role'],
                    'phone': created_user.get('phone', ''),
                    'position': created_user.get('position', ''),
                    'is_active': created_user.get('is_active', True),
                    'is_superuser': created_user.get('is_superuser', False),
                    'date_joined': created_user.get('date_joined')
                }
            return None
            
        except Exception as e:
            logger.error(f"Error creating user in Supabase: {e}")
            return None
    
    def update_user_in_supabase(self, user_id, user_data):
        """Update an existing user in Supabase auth_user table"""
        try:
            from datetime import datetime
            
            # Prepare update data
            update_data = {}
            
            if 'name' in user_data:
                update_data['name'] = user_data['name']
            if 'phone' in user_data:
                update_data['phone'] = user_data['phone']
            if 'role' in user_data:
                update_data['role'] = user_data['role']
            if 'position' in user_data:
                update_data['position'] = user_data['position']
            
            # Always update the updated timestamp
            update_data['updated_at'] = datetime.now().isoformat()
            
            # Update user in Supabase
            result = self.supabase.table('auth_user').update(update_data).eq('id', user_id).execute()
            
            if result.data:
                updated_user = result.data[0]
                return {
                    'id': updated_user['id'],
                    'name': updated_user['name'],
                    'email': updated_user['email'],
                    'role': updated_user['role'],
                    'phone': updated_user.get('phone', ''),
                    'position': updated_user.get('position', ''),
                    'is_active': updated_user.get('is_active', True),
                    'is_superuser': updated_user.get('is_superuser', False),
                    'date_joined': updated_user.get('date_joined')
                }
            return None
            
        except Exception as e:
            logger.error(f"Error updating user in Supabase: {e}")
            return None

    # Task Comments methods
    def get_task_comments(self, task_id):
        """Get all comments for a specific task"""
        try:
            result = self.supabase.table('projects_taskcomment').select('*').eq('task_id', task_id).order('created_at', desc=True).execute()
            
            if result.data:
                comments = []
                for comment in result.data:
                    # Get user info for the comment
                    user_result = self.supabase.table('auth_user').select('id, name, email').eq('id', comment['user_id']).execute()
                    user = user_result.data[0] if user_result.data else None
                    
                    comments.append({
                        'id': comment['id'],
                        'comment': comment['comment'],
                        'author': user['name'] if user else 'Unknown User',
                        'author_email': user['email'] if user else '',
                        'created_at': comment['created_at'],
                        'updated_at': comment['updated_at'],
                        'task_id': comment['task_id'],
                        'user': user
                    })
                return comments
            return []
            
        except Exception as e:
            logger.error(f"Error fetching comments for task {task_id} from Supabase: {e}")
            return []

    def create_task_comment(self, task_id, user_id, comment_text):
        """Create a new comment for a task"""
        try:
            from datetime import datetime
            now = datetime.now().isoformat()
            
            comment_data = {
                'task_id': task_id,
                'user_id': user_id,
                'comment': comment_text,
                'created_at': now,
                'updated_at': now
            }
            
            result = self.supabase.table('projects_taskcomment').insert(comment_data).execute()
            
            if result.data:
                comment = result.data[0]
                # Get user info for the comment
                user_result = self.supabase.table('auth_user').select('id, name, email').eq('id', user_id).execute()
                user = user_result.data[0] if user_result.data else None
                
                return {
                    'id': comment['id'],
                    'comment': comment['comment'],
                    'author': user['name'] if user else 'Unknown User',
                    'author_email': user['email'] if user else '',
                    'created_at': comment['created_at'],
                    'updated_at': comment['updated_at'],
                    'task_id': comment['task_id'],
                    'user': user
                }
            return None
            
        except Exception as e:
            logger.error(f"Error creating comment for task {task_id} in Supabase: {e}")
            return None

    # Task Attachments methods
    def get_task_attachments(self, task_id):
        """Get all attachments for a specific task"""
        try:
            result = self.supabase.table('projects_taskattachment').select('*').eq('task_id', task_id).order('created_at', desc=True).execute()
            
            if result.data:
                attachments = []
                for attachment in result.data:
                    # Get user info for the attachment
                    user_result = self.supabase.table('auth_user').select('id, name, email').eq('id', attachment['user_id']).execute()
                    user = user_result.data[0] if user_result.data else None
                    
                    attachments.append({
                        'id': attachment['id'],
                        'name': attachment['filename'],
                        'filename': attachment['filename'],
                        'size': attachment['file_size'],
                        'type': attachment.get('file_type', 'application/octet-stream'),
                        'uploaded_by': user['name'] if user else 'Unknown User',
                        'uploaded_at': attachment['created_at'],
                        'created_at': attachment['created_at'],
                        'task_id': attachment['task_id'],
                        'url': attachment.get('file', '#'),
                        'user': user
                    })
                return attachments
            return []
            
        except Exception as e:
            logger.error(f"Error fetching attachments for task {task_id} from Supabase: {e}")
            return []

    def create_task_attachment(self, task_id, user_id, file_name, file_size, file_type=None):
        """Create a task attachment in Supabase"""
        try:
            from datetime import datetime
            now = datetime.now().isoformat()
            
            attachment_data = {
                'task_id': task_id,
                'user_id': user_id,
                'name': file_name,
                'file_size': file_size,
                'file_type': file_type or 'application/octet-stream',
                'created_at': now,
            }
            
            result = self.supabase.table('projects_taskattachment').insert(attachment_data).execute()
            
            if result.data:
                attachment = result.data[0]
                
                # Get user info
                user_result = self.supabase.table('auth_user').select('id, name, email').eq('id', attachment['user_id']).execute()
                user = user_result.data[0] if user_result.data else None
                
                return {
                    'id': attachment['id'],
                    'name': attachment['name'],
                    'file_size': attachment['file_size'],
                    'file_type': attachment['file_type'],
                    'uploaded_at': attachment['created_at'],
                    'user_id': attachment['user_id'],
                    'user': user,
                    'task_id': attachment['task_id'],
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating task attachment in Supabase: {e}")
            return None

    # Reporting and Analytics Methods
    def get_all_tasks(self):
        """Get all tasks from all projects for reporting purposes"""
        try:
            result = self.supabase.table('projects_task').select('*').execute()
            
            if result.data:
                tasks = []
                for task in result.data:
                    # Get assignee info if available
                    assignee = None
                    if task['assignee_id']:
                        assignee_result = self.supabase.table('auth_user').select('id, name, email').eq('id', task['assignee_id']).execute()
                        assignee = assignee_result.data[0] if assignee_result.data else None
                    
                    # Get creator info
                    creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', task['created_by_id']).execute()
                    creator = creator_result.data[0] if creator_result.data else None
                    
                    # Get project info
                    project_result = self.supabase.table('projects_project').select('id, name').eq('id', task['project_id']).execute()
                    project = project_result.data[0] if project_result.data else None
                    
                    tasks.append({
                        'id': task['id'],
                        'name': task['name'],
                        'description': task['description'],
                        'status': task['status'],
                        'priority': task['priority'],
                        'due_date': task['due_date'],
                        'start_date': task['start_date'],
                        'completed_at': task['completed_at'],
                        'estimated_hours': task['estimated_hours'],
                        'actual_hours': task['actual_hours'],
                        'position': task['position'],
                        'tags': task['tags'],
                        'created_at': task['created_at'],
                        'updated_at': task['updated_at'],
                        'assignee_id': task['assignee_id'],
                        'assignee': assignee,
                        'created_by_id': task['created_by_id'],
                        'created_by': creator,
                        'parent_task_id': task['parent_task_id'],
                        'project_id': task['project_id'],
                        'project': project,
                    })
                return tasks
            return []
            
        except Exception as e:
            logger.error(f"Error fetching all tasks from Supabase: {e}")
            return []

    def get_all_projects(self):
        """Get all projects for reporting purposes"""
        try:
            result = self.supabase.table('projects_project').select('*').execute()
            
            if result.data:
                projects = []
                for project in result.data:
                    # Get creator info
                    creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', project['created_by_id']).execute()
                    creator = creator_result.data[0] if creator_result.data else None
                    
                    # Get all members
                    members = self.get_project_members(project['id'])
                    if creator and not any(m['id'] == creator['id'] for m in members):
                        members.insert(0, creator)  # Ensure creator is always in members list
                    
                    projects.append({
                        'id': project['id'],
                        'name': project['name'],
                        'description': project['description'],
                        'project_type': project['project_type'],
                        'status': project['status'],
                        'color': project['color'],
                        'start_date': project['start_date'],
                        'due_date': project['due_date'],
                        'is_archived': project['is_archived'],
                        'created_at': project['created_at'],
                        'updated_at': project['updated_at'],
                        'created_by_id': project['created_by_id'],
                        'created_by': creator,
                        'members': members,
                        'member_ids': [m['id'] for m in members],
                    })
                return projects
            return []
            
        except Exception as e:
            logger.error(f"Error fetching all projects from Supabase: {e}")
            return []

    def get_user_projects(self, user_id):
        """Get projects for a specific user (where they are creator or member)"""
        try:
            return self.get_projects(user_id)
        except Exception as e:
            logger.error(f"Error fetching user projects for user {user_id}: {e}")
            return []
    
    # Meeting management methods
    def get_user_meetings(self, user_id):
        """Get all meetings for projects the user has access to"""
        try:
            # Get user's projects
            user_projects = self.get_user_projects(user_id)
            if not user_projects:
                return []
            
            project_ids = [p['id'] for p in user_projects]
            
            # Get meetings for these projects
            meetings = []
            for project_id in project_ids:
                project_meetings = self.get_project_meetings(project_id)
                meetings.extend(project_meetings)
            
            # Sort by date and time
            meetings.sort(key=lambda x: (x.get('date', ''), x.get('time', '')))
            return meetings
            
        except Exception as e:
            logger.error(f"Error fetching user meetings from Supabase: {e}")
            return []
    
    def get_project_meetings(self, project_id):
        """Get all meetings for a specific project"""
        try:
            result = self.supabase.table('projects_meeting').select('*').eq('project_id', project_id).execute()
            
            if result.data:
                meetings = []
                for meeting in result.data:
                    formatted_meeting = self._format_meeting_data(meeting)
                    meetings.append(formatted_meeting)
                return meetings
            return []
            
        except Exception as e:
            logger.error(f"Error fetching meetings for project {project_id} from Supabase: {e}")
            return []
    
    def get_meeting(self, meeting_id, user_id=None):
        """Get a specific meeting by ID"""
        try:
            result = self.supabase.table('projects_meeting').select('*').eq('id', meeting_id).execute()
            
            if result.data:
                meeting = result.data[0]
                
                # Check if user has access to this meeting's project
                if user_id and not self.user_has_project_access(meeting['project_id'], user_id):
                    return None
                
                return self._format_meeting_data(meeting)
            return None
            
        except Exception as e:
            logger.error(f"Error fetching meeting {meeting_id} from Supabase: {e}")
            return None
    
    def create_meeting(self, meeting_data):
        """Create a new meeting in Supabase"""
        try:
            from datetime import datetime
            now = datetime.now().isoformat()
            
            # Handle attendee_ids if provided
            attendees_text = meeting_data.get('attendees', '')
            if meeting_data.get('attendee_ids'):
                # Get user names for the selected IDs
                attendee_names = []
                for user_id in meeting_data['attendee_ids']:
                    user_result = self.supabase.table('auth_user').select('name').eq('id', user_id).execute()
                    if user_result.data:
                        attendee_names.append(user_result.data[0]['name'])
                attendees_text = ', '.join(attendee_names)
            
            # Prepare meeting data
            insert_data = {
                'title': meeting_data.get('title'),
                'description': meeting_data.get('description', ''),
                'project_id': meeting_data.get('project'),
                'date': meeting_data.get('date'),
                'time': meeting_data.get('time'),
                'duration': meeting_data.get('duration', 60),
                'attendees': attendees_text,
                'created_by_id': meeting_data.get('created_by_id'),
                'created_at': now,
                'updated_at': now,
            }
            
            result = self.supabase.table('projects_meeting').insert(insert_data).execute()
            
            if result.data:
                meeting = result.data[0]
                return self._format_meeting_data(meeting)
            return None
            
        except Exception as e:
            logger.error(f"Error creating meeting in Supabase: {e}")
            return None
    
    def update_meeting(self, meeting_id, meeting_data):
        """Update a meeting in Supabase"""
        try:
            from datetime import datetime
            update_data = {
                'updated_at': datetime.now().isoformat()
            }
            
            # Add fields that are being updated
            if 'title' in meeting_data:
                update_data['title'] = meeting_data['title']
            if 'description' in meeting_data:
                update_data['description'] = meeting_data['description']
            if 'project' in meeting_data:
                update_data['project_id'] = meeting_data['project']
            if 'date' in meeting_data:
                update_data['date'] = meeting_data['date']
            if 'time' in meeting_data:
                update_data['time'] = meeting_data['time']
            if 'duration' in meeting_data:
                update_data['duration'] = meeting_data['duration']
            
            # Handle attendees update
            if 'attendee_ids' in meeting_data:
                if meeting_data['attendee_ids']:
                    # Get user names for the selected IDs
                    attendee_names = []
                    for user_id in meeting_data['attendee_ids']:
                        user_result = self.supabase.table('auth_user').select('name').eq('id', user_id).execute()
                        if user_result.data:
                            attendee_names.append(user_result.data[0]['name'])
                    update_data['attendees'] = ', '.join(attendee_names)
                else:
                    update_data['attendees'] = ''
            elif 'attendees' in meeting_data:
                update_data['attendees'] = meeting_data['attendees']
            
            result = self.supabase.table('projects_meeting').update(update_data).eq('id', meeting_id).execute()
            
            if result.data:
                meeting = result.data[0]
                return self._format_meeting_data(meeting)
            return None
            
        except Exception as e:
            logger.error(f"Error updating meeting {meeting_id} in Supabase: {e}")
            return None
    
    def delete_meeting(self, meeting_id):
        """Delete a meeting from Supabase"""
        try:
            result = self.supabase.table('projects_meeting').delete().eq('id', meeting_id).execute()
            return True
            
        except Exception as e:
            logger.error(f"Error deleting meeting {meeting_id} from Supabase: {e}")
            return False
    
    def _format_meeting_data(self, meeting):
        """Format raw meeting data from Supabase into structured format"""
        try:
            # Get creator info
            creator_result = self.supabase.table('auth_user').select('id, name, email').eq('id', meeting['created_by_id']).execute()
            creator = creator_result.data[0] if creator_result.data else None
            
            # Get project info
            project_result = self.supabase.table('projects_project').select('id, name').eq('id', meeting['project_id']).execute()
            project = project_result.data[0] if project_result.data else None
            
            return {
                'id': meeting['id'],
                'title': meeting['title'],
                'description': meeting['description'],
                'project': meeting['project_id'],
                'project_name': project['name'] if project else 'Unknown Project',
                'date': meeting['date'],
                'time': meeting['time'],
                'duration': meeting['duration'],
                'attendees': meeting['attendees'],
                'attendees_list': [a.strip() for a in meeting['attendees'].split(',') if a.strip()] if meeting['attendees'] else [],
                'created_by': creator,
                'created_at': meeting['created_at'],
                'updated_at': meeting['updated_at'],
            }
            
        except Exception as e:
            logger.error(f"Error formatting meeting data: {e}")
            return meeting

    # Leave Request Methods
    def create_leave_request(self, leave_data):
        """Create a new leave request in Supabase"""
        try:
            from datetime import datetime
            
            # Calculate days requested
            start_date = datetime.strptime(leave_data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(leave_data['end_date'], '%Y-%m-%d').date()
            days_requested = (end_date - start_date).days + 1
            
            # Get employee info
            employee_result = self.supabase.table('auth_user').select('id, name, email').eq('id', leave_data['employee_id']).execute()
            employee = employee_result.data[0] if employee_result.data else None
            
            if not employee:
                logger.error(f"Employee not found: {leave_data['employee_id']}")
                return None
            
            # Prepare insert data
            insert_data = {
                'employee_id': leave_data['employee_id'],
                'employee_name': employee['name'],
                'employee_email': employee['email'],
                'start_date': leave_data['start_date'],
                'end_date': leave_data['end_date'],
                'leave_type': leave_data['leave_type'],
                'reason': leave_data['reason'],
                'notes': leave_data.get('notes', ''),
                'days_requested': days_requested,
                'status': 'pending',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Insert leave request
            result = self.supabase.table('leave_requests').insert(insert_data).execute()
            
            if result.data:
                leave_request = result.data[0]
                
                # Create notification for HR/managers
                self.create_notification({
                    'recipient_id': None,  # For all HR users
                    'type': 'leave_request',
                    'title': f'New Leave Request from {employee["name"]}',
                    'message': f'{employee["name"]} has requested {days_requested} days of {leave_data["leave_type"]} leave from {leave_data["start_date"]} to {leave_data["end_date"]}.',
                    'data': {
                        'leave_request_id': leave_request['id'],
                        'employee_id': leave_data['employee_id'],
                        'employee_name': employee['name'],
                        'days_requested': days_requested,
                        'leave_type': leave_data['leave_type']
                    }
                })
                
                return self._format_leave_request_data(leave_request)
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating leave request in Supabase: {e}")
            return None
    
    def get_leave_requests(self, user_id=None, status=None):
        """Get leave requests, optionally filtered by user or status"""
        try:
            query = self.supabase.table('leave_requests').select('*')
            
            if user_id:
                query = query.eq('employee_id', user_id)
            
            if status:
                query = query.eq('status', status)
            
            result = query.order('created_at', desc=True).execute()
            
            if result.data:
                return [self._format_leave_request_data(req) for req in result.data]
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching leave requests from Supabase: {e}")
            return []
    
    def get_leave_request(self, request_id):
        """Get a specific leave request by ID"""
        try:
            result = self.supabase.table('leave_requests').select('*').eq('id', request_id).execute()
            
            if result.data:
                return self._format_leave_request_data(result.data[0])
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching leave request {request_id} from Supabase: {e}")
            return None
    
    def update_leave_request_status(self, request_id, status, approved_by_id):
        """Update leave request status (approve/reject)"""
        try:
            from datetime import datetime
            
            # Get the leave request first
            leave_request = self.get_leave_request(request_id)
            if not leave_request:
                return None
            
            # Get approver info
            approver_result = self.supabase.table('auth_user').select('id, name, email').eq('id', approved_by_id).execute()
            approver = approver_result.data[0] if approver_result.data else None
            
            # Update the request
            update_data = {
                'status': status,
                'approved_by_id': approved_by_id,
                'approved_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('leave_requests').update(update_data).eq('id', request_id).execute()
            
            if result.data:
                updated_request = result.data[0]
                
                # Create notification for employee
                status_text = "approved" if status == "approved" else "rejected"
                self.create_notification({
                    'recipient_id': leave_request['employee_id'],
                    'type': 'leave_status_update',
                    'title': f'Leave Request {status_text.title()}',
                    'message': f'Your leave request for {leave_request["days_requested"]} days has been {status_text} by {approver["name"] if approver else "HR"}.',
                    'data': {
                        'leave_request_id': request_id,
                        'status': status,
                        'approved_by': approver['name'] if approver else 'HR'
                    }
                })
                
                # If approved, update leave balance
                if status == 'approved':
                    self.update_leave_balance(leave_request['employee_id'], leave_request['days_requested'])
                
                return self._format_leave_request_data(updated_request)
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating leave request status in Supabase: {e}")
            return None
    
    def get_leave_balance(self, employee_id):
        """Get employee leave balance"""
        try:
            from datetime import datetime
            current_year = datetime.now().year
            
            # Get or create leave balance for current year
            result = self.supabase.table('employee_leave_balance').select('*').eq('employee_id', employee_id).eq('year', current_year).execute()
            
            if result.data:
                balance = result.data[0]
            else:
                # Create default balance
                default_balance = {
                    'employee_id': employee_id,
                    'total_days': 14,
                    'used_days': 0,
                    'year': current_year,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                create_result = self.supabase.table('employee_leave_balance').insert(default_balance).execute()
                balance = create_result.data[0] if create_result.data else default_balance
            
            # Get pending requests
            pending_requests = self.get_leave_requests(employee_id, 'pending')
            pending_days = sum(req['days_requested'] for req in pending_requests)
            
            return {
                'id': balance.get('id'),
                'employee_id': balance['employee_id'],
                'total_days': balance['total_days'],
                'used_days': balance['used_days'],
                'available_days': balance['total_days'] - balance['used_days'],
                'pending_days': pending_days,
                'year': balance['year'],
                'created_at': balance['created_at'],
                'updated_at': balance['updated_at']
            }
            
        except Exception as e:
            logger.error(f"Error fetching leave balance for employee {employee_id}: {e}")
            return None
    
    def update_leave_balance(self, employee_id, days_to_deduct):
        """Update employee leave balance (deduct used days)"""
        try:
            balance = self.get_leave_balance(employee_id)
            if not balance:
                return False
            
            new_used_days = balance['used_days'] + days_to_deduct
            from datetime import datetime
            
            update_data = {
                'used_days': new_used_days,
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('employee_leave_balance').update(update_data).eq('id', balance['id']).execute()
            return result.data is not None
            
        except Exception as e:
            logger.error(f"Error updating leave balance for employee {employee_id}: {e}")
            return False
    
    def _format_leave_request_data(self, leave_request):
        """Format leave request data"""
        try:
            # Get employee info
            employee = None
            if leave_request['employee_id']:
                employee_result = self.supabase.table('auth_user').select('id, name, email').eq('id', leave_request['employee_id']).execute()
                employee = employee_result.data[0] if employee_result.data else None
            
            # Get approver info
            approved_by = None
            if leave_request.get('approved_by_id'):
                approver_result = self.supabase.table('auth_user').select('id, name, email').eq('id', leave_request['approved_by_id']).execute()
                approved_by = approver_result.data[0] if approver_result.data else None
            
            return {
                'id': leave_request['id'],
                'employee_id': leave_request['employee_id'],
                'employee': employee,
                'employee_name': leave_request['employee_name'],
                'employee_email': leave_request['employee_email'],
                'start_date': leave_request['start_date'],
                'end_date': leave_request['end_date'],
                'leave_type': leave_request['leave_type'],
                'reason': leave_request['reason'],
                'notes': leave_request.get('notes', ''),
                'days_requested': leave_request['days_requested'],
                'status': leave_request['status'],
                'approved_by_id': leave_request.get('approved_by_id'),
                'approved_by': approved_by,
                'approved_at': leave_request.get('approved_at'),
                'created_at': leave_request['created_at'],
                'updated_at': leave_request['updated_at']
            }
            
        except Exception as e:
            logger.error(f"Error formatting leave request data: {e}")
            return leave_request

    # Notification Methods
    def create_notification(self, notification_data):
        """Create a new notification in Supabase"""
        try:
            from datetime import datetime
            
            insert_data = {
                'recipient_id': notification_data.get('recipient_id'),
                'type': notification_data['type'],
                'title': notification_data['title'],
                'message': notification_data['message'],
                'data': notification_data.get('data', {}),
                'is_read': False,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('notifications').insert(insert_data).execute()
            
            if result.data:
                return result.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating notification in Supabase: {e}")
            return None
    
    def get_notifications(self, user_id, is_read=None, limit=50):
        """Get notifications for a user"""
        try:
            query = self.supabase.table('notifications').select('*')
            
            # Get notifications for specific user or all users (recipient_id is null for broadcast)
            query = query.or_(f'recipient_id.eq.{user_id},recipient_id.is.null')
            
            if is_read is not None:
                query = query.eq('is_read', is_read)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            if result.data:
                return result.data
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching notifications for user {user_id}: {e}")
            return []
    
    def mark_notification_read(self, notification_id, user_id):
        """Mark a notification as read"""
        try:
            from datetime import datetime
            
            update_data = {
                'is_read': True,
                'updated_at': datetime.now().isoformat()
            }
            
            # Only allow marking as read if it's the user's notification
            query = self.supabase.table('notifications').update(update_data).eq('id', notification_id)
            query = query.or_(f'recipient_id.eq.{user_id},recipient_id.is.null')
            
            result = query.execute()
            return result.data is not None
            
        except Exception as e:
            logger.error(f"Error marking notification {notification_id} as read: {e}")
            return False
    
    def get_unread_notification_count(self, user_id):
        """Get count of unread notifications for a user"""
        try:
            query = self.supabase.table('notifications').select('id', count='exact').eq('is_read', False)
            query = query.or_(f'recipient_id.eq.{user_id},recipient_id.is.null')
            
            result = query.execute()
            return result.count or 0
            
        except Exception as e:
            logger.error(f"Error getting unread notification count for user {user_id}: {e}")
            return 0 
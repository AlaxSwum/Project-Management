# Focus - Project Management System

## 🚀 Production URL
**https://focus-project.co.uk**

Always clear cache after updates: `Cmd+Shift+R`

## 🗄️ Essential SQL Files to Deploy

Deploy these in **https://supabase.com/dashboard** → SQL Editor:

### Required Deployment Files (in order):
1. `DEPLOY_TASK_NOTIFICATIONS_SYSTEM.sql` - Notifications, subtasks, comments, attachments
2. `DEPLOY_CUSTOM_COLUMNS_SYSTEM.sql` - Custom columns per project
3. `ADD_PROJECT_MEMBER_ROLES.sql` - Member roles (Owner/Admin/Member/Viewer)
4. `DEPLOY_MESSAGING_SYSTEM.sql` - Real-time chat system
5. `DEPLOY_CATEGORIES_SYSTEM.sql` - Task categories and sub-categories
6. `ADD_FOLDER_ACCESS_CONTROL_FIXED.sql` - Folder permissions
7. `DEPLOY_TO_FOCUSPROJECT.sh` - Main deployment script

## ✨ Features Deployed

### UI/UX
- ✅ Complete dark theme (#0D0D0D)
- ✅ Mabry Pro font throughout
- ✅ Clean, professional design
- ✅ Fully responsive

### Project Views
- ✅ Kanban (drag & drop, uniform cards)
- ✅ Table (month grouping, status breakdown)
- ✅ Gantt (ClickUp-style continuous timeline)
- ✅ Calendar (monthly grid)

### Task Management
- ✅ Complete task creation form
- ✅ Subtasks with checkboxes
- ✅ Comments
- ✅ Attachment links
- ✅ Notifications to Report To users
- ✅ Activity log

### Communication
- ✅ Real-time messaging (1-sec refresh)
- ✅ Direct messages
- ✅ Group chat
- ✅ Message deletion

### Advanced
- ✅ Monday.com-style filtering
- ✅ Custom columns
- ✅ Member role management
- ✅ Smart project filtering

## 📁 Project Structure

```
project_management/
├── frontend/                    # Next.js application
├── FocusApp-Swift/             # iOS app
├── electron-desktop/           # Desktop app
├── hostinger_deployment_v2/    # Deployment config
├── migrations/                 # Database migrations  
├── archive/                    # Old deployment scripts
├── old_files/                  # Archived SQL/docs
└── Essential SQL files (7 files listed above)
```

## 🎯 Deployment

### Main Deployment Script
```bash
bash DEPLOY_TO_FOCUSPROJECT.sh
```

### Server Details
- Host: 168.231.116.32
- User: root
- Domain: focus-project.co.uk
- Path: /var/www/project_management
- Service: nextjs-pm

## 📚 Documentation

All old documentation archived in:
- `/archive` - Old deployment scripts
- `/old_files` - Old SQL and markdown files

Only essential files remain in root directory.

## ✅ Clean Project

- 137 old files archived
- Only 6 essential SQL deployment files kept
- 1 deployment script
- Clean, organized structure

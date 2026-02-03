# Table View Redesign - ClickUp Style

## Target Design
Based on screenshot: Grouped by status with columns:
- Checkbox
- Task Name
- Description  
- Estimation (date range)
- Type (tags/badges)
- People (avatars)
- Priority (badges)
- Three-dot menu

## Current Implementation Needed

### Status Grouping
- To-do (expandable)
- On Progress (expandable)
- In Review (expandable)
- Done (expandable)

### Columns
1. Checkbox - Task selection
2. Task Name - With icon
3. Description - Task details
4. Estimation - Start date - End date
5. Type - Dashboard/Mobile App tags
6. People - User avatars (assignees)
7. Priority - Medium/Low/High badges
8. More - Three-dot menu

### Features
- Click row to open task detail
- + Add New Task at bottom of each group
- Collapsible status groups
- Dark theme (#0D0D0D background)

## Files to Update
- frontend/src/app/projects/[id]/page.tsx (Table view section)

## Deployment
After changes: 
```bash
git add -A
git commit -m "Redesign table view to match ClickUp"
git push origin main
ssh root@168.231.116.32 "cd /var/www/project_management && git pull && cd frontend && npm run build && systemctl restart nextjs-pm"
```

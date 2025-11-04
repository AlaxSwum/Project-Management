# Email Tracking System Deployment Guide
## Rother Care Pharmacy - Communication Management

This guide will help you deploy the email tracking system for managing incoming communications (finance, customer support, etc.).

---

## Features Overview

### 1. Folder-Based Organization
- Year folders (2025, 2026, etc.)
- Month folders within each year
- Week folders within each month
- Hierarchical structure for easy navigation

### 2. Comprehensive Data Tracking
Each entry includes:
- Date (with date picker and filtering)
- From (sender name/email)
- Subject (short description)
- Remark (internal note)
- To Do (action needed)
- Final Remark (outcome)
- Folder Placed (file location)
- Response (if replied)
- Email Account (dropdown selector)
- Confirmed (completion checkbox)

### 3. Advanced Filtering
- Filter by exact date or date range
- Filter by day, week, or month
- Search across all text fields
- Filter by email account
- Filter by confirmation status
- Multiple filters can be combined

### 4. Access Control
- Folder-specific permissions
- Three access levels: VIEWER, EDITOR, ADMIN
- Owner can manage all folder access
- Row-level security enforced

### 5. Automation
- Archive old confirmed entries
- Automatic date-based organization
- Bulk operations support

---

## Deployment Steps

### Step 1: Deploy Database Schema

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create_email_tracking_system.sql`
4. Click "Run" to execute the SQL script

This will create:
- `email_accounts` table
- `email_tracking_folders` table
- `email_tracking_entries` table
- `email_tracking_folder_access` table
- `email_tracking_archive` table
- All necessary indexes and RLS policies
- Helper functions for folder creation and archiving

### Step 2: Verify Database Setup

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'email_%'
ORDER BY table_name;
```

You should see:
- email_accounts
- email_tracking_archive
- email_tracking_entries
- email_tracking_folder_access
- email_tracking_folders

### Step 3: Verify Default Email Accounts

Run this query to check default accounts:

```sql
SELECT account_name, full_email, description 
FROM email_accounts 
ORDER BY account_name;
```

Default accounts include:
- accounts@rothercare.com
- admin@rothercare.com
- info@rothercare.com
- marketing@rothercare.com
- support@rothercare.com

### Step 4: Deploy Frontend

The frontend page is located at:
```
frontend/src/app/email-tracking/page.tsx
```

If deploying to your existing Next.js application:
1. The file is already in place
2. Navigate to `/email-tracking` in your application
3. The page will be automatically available

If you need to add it to your navigation:

Add to your main navigation file (e.g., `components/Sidebar.tsx`):

```typescript
{
  name: 'Email Tracking',
  href: '/email-tracking',
  icon: MailIcon, // or your preferred icon
}
```

### Step 5: Deploy to Production

If using Hostinger or similar hosting:

```bash
# Build the frontend
cd frontend
npm install
npm run build

# Deploy using your existing deployment script
cd ..
./deploy-to-hostinger-now.sh
```

Or use the automated deployment:

```bash
chmod +x deploy-email-tracking-system.sh
./deploy-email-tracking-system.sh
```

---

## Usage Guide

### Creating Folder Structure

#### 1. Create Year Folder
1. Click "New Year Folder" button
2. Enter the year (e.g., 2025)
3. The folder will be created

#### 2. Create Month Folder
1. Select a year folder
2. Click "Add Month" button
3. Enter month number (1-12)
4. Month folder is automatically named

#### 3. Create Week Folder
1. Select a year and month folder
2. Click "Add Week" button
3. Enter week number, start date, and end date
4. Week folder is created

### Adding Email Tracking Entries

1. Select the appropriate folder (year/month/week)
2. Click "Add New Entry" button
3. Fill in all required fields:
   - Date (defaults to today)
   - From (sender)
   - Subject (required)
   - Additional fields as needed
4. Select email account from dropdown
5. Check "Confirmed" if already completed
6. Click "Add Entry"

### Filtering and Searching

#### Date Filtering
- **Exact Date**: Select a specific date
- **Date Range**: Choose start and end dates
- Works with day/week/month views

#### Text Filtering
- Enter search terms in any filter field
- Filters are case-insensitive
- Multiple filters work together (AND logic)

#### Status Filtering
- All Statuses
- Confirmed only
- Pending only

#### Clear Filters
Click "Clear Filters" to reset all filters

### Managing Entries

#### Edit Entry
1. Click "Edit" button on any entry
2. Modify fields inline
3. Click "Save" to confirm or "Cancel" to discard

#### Quick Confirm
- Click checkbox in "Confirmed" column
- Entry is immediately updated

#### Delete Entry
1. Click "Delete" button
2. Confirm deletion in popup
3. Entry is permanently removed

### Folder Access Control

#### Grant Access
1. Select a folder
2. Click "Manage Access" button
3. Enter user ID (UUID)
4. Select access level:
   - **VIEWER**: Can view entries only
   - **EDITOR**: Can view and edit entries
   - **ADMIN**: Full control (except deletion)
5. Click "Grant"

#### Revoke Access
1. Open "Manage Access" modal
2. Find the user in the list
3. Click "Revoke" button
4. Confirm action

### Archiving Data

#### Manual Archive
1. Click "Archive Data" button
2. Select cutoff date
3. All confirmed entries before this date will be archived
4. Archived entries are moved to `email_tracking_archive` table

#### Viewing Archived Data
Archives are stored in the `email_tracking_archive` table and can be queried via SQL:

```sql
SELECT * FROM email_tracking_archive
WHERE entry_date >= '2025-01-01'
ORDER BY archived_at DESC;
```

---

## Email Account Management

### Adding New Email Accounts

1. Click "Add Email Account" button
2. Fill in details:
   - Account Name (e.g., "billing@")
   - Full Email (e.g., "billing@rothercare.com")
   - Description (optional)
3. Click "Add Account"
4. New account appears in all dropdowns

### Deactivating Email Accounts

Via SQL:

```sql
UPDATE email_accounts
SET is_active = false
WHERE account_name = 'old-account@';
```

---

## Advanced Features

### Automated Archiving

Create a PostgreSQL cron job to automatically archive old entries:

```sql
-- Archive entries older than 90 days (confirmed only)
SELECT cron.schedule(
  'archive-old-emails',
  '0 2 * * 0', -- Every Sunday at 2 AM
  $$
  SELECT archive_old_email_entries(CURRENT_DATE - INTERVAL '90 days');
  $$
);
```

### Bulk Import

To import existing data, use a SQL INSERT:

```sql
INSERT INTO email_tracking_entries (
  folder_id, entry_date, from_sender, subject, 
  email_account_id, created_by
)
SELECT 
  'your-folder-id'::uuid,
  date_column,
  sender_column,
  subject_column,
  (SELECT id FROM email_accounts WHERE account_name = 'support@' LIMIT 1),
  auth.uid()
FROM your_import_table;
```

### Export Data

Export to CSV via SQL:

```sql
COPY (
  SELECT 
    e.entry_date,
    e.from_sender,
    e.subject,
    e.remark,
    e.to_do,
    e.final_remark,
    e.folder_placed,
    e.response,
    ea.account_name,
    e.confirmed
  FROM email_tracking_entries e
  LEFT JOIN email_accounts ea ON e.email_account_id = ea.id
  WHERE e.folder_id = 'your-folder-id'
  ORDER BY e.entry_date DESC
) TO '/tmp/email_tracking_export.csv' WITH CSV HEADER;
```

---

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access folders they created or have been granted access to
- Admins have full access to all folders

### Access Levels

| Level | View | Edit | Delete | Manage Access |
|-------|------|------|--------|---------------|
| VIEWER | Yes | No | No | No |
| EDITOR | Yes | Yes | Own entries only | No |
| ADMIN | Yes | Yes | Yes | No |
| OWNER | Yes | Yes | Yes | Yes |

### Best Practices
1. Regularly audit folder access using the "Manage Access" feature
2. Revoke access when team members change roles
3. Use VIEWER access for read-only stakeholders
4. Archive old data to maintain performance
5. Keep email accounts list clean and up-to-date

---

## Troubleshooting

### Issue: Cannot see any folders
**Solution**: Verify you have RLS permissions. Admins and folder creators can see folders.

### Issue: Cannot add entries
**Solution**: Ensure you have EDITOR or ADMIN access to the selected folder.

### Issue: Email account dropdown is empty
**Solution**: Add email accounts using "Add Email Account" button or via SQL.

### Issue: Archive function not working
**Solution**: Check that the PostgreSQL function exists and you have permissions:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'archive_old_email_entries';
```

### Issue: Filters not working
**Solution**: Clear browser cache and refresh. Check that data exists in the selected folder.

---

## Database Maintenance

### Weekly Tasks
- Review new email accounts added
- Check folder access permissions
- Archive old confirmed entries

### Monthly Tasks
- Analyze entry volumes by folder
- Review archived data
- Clean up inactive email accounts

### Quarterly Tasks
- Full database backup
- Review RLS policies
- Audit user access levels

---

## Support and Customization

### Adding Custom Fields

To add a new field to entries:

1. Add column to database:
```sql
ALTER TABLE email_tracking_entries
ADD COLUMN your_new_field VARCHAR(255);
```

2. Update the interface in `page.tsx`:
   - Add to `EmailEntry` interface
   - Add to `newEntry` state
   - Add input field in the form
   - Add column to table
   - Add filter if needed

### Modifying Email Accounts

Edit existing accounts:

```sql
UPDATE email_accounts
SET 
  full_email = 'newemail@rothercare.com',
  description = 'Updated description'
WHERE account_name = 'accounts@';
```

### Custom Reports

Generate monthly summary:

```sql
SELECT 
  TO_CHAR(entry_date, 'YYYY-MM') as month,
  ea.account_name,
  COUNT(*) as total_entries,
  SUM(CASE WHEN confirmed THEN 1 ELSE 0 END) as confirmed_count,
  SUM(CASE WHEN NOT confirmed THEN 1 ELSE 0 END) as pending_count
FROM email_tracking_entries e
LEFT JOIN email_accounts ea ON e.email_account_id = ea.id
WHERE entry_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(entry_date, 'YYYY-MM'), ea.account_name
ORDER BY month DESC, account_name;
```

---

## System Architecture

### Database Schema
```
email_accounts
  ├── email_tracking_entries (references email_accounts)
  
email_tracking_folders (hierarchical structure)
  ├── email_tracking_entries (references folders)
  └── email_tracking_folder_access (references folders and users)

email_tracking_archive (historical data)
```

### Data Flow
1. User creates folder structure (Year → Month → Week)
2. User adds entries to specific folder
3. Entries can be filtered, searched, and edited
4. Folder access is controlled per folder
5. Old entries are archived automatically or manually

---

## Conclusion

The Email Tracking System provides a comprehensive solution for managing incoming communications at Rother Care Pharmacy. With its clean interface, robust filtering, and granular access control, it enables efficient organization and tracking of all email-related tasks.

For questions or support, please contact your system administrator.

**System Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Rother Care Pharmacy IT Team


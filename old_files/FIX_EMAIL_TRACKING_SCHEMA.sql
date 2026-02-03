-- =====================================================
-- FIX EMAIL TRACKING SCHEMA - Use Integer IDs
-- Change UUID fields to INTEGER to match auth_user table
-- =====================================================

-- 1. Drop existing foreign key constraints
ALTER TABLE email_tracking_folders DROP CONSTRAINT IF EXISTS email_tracking_folders_created_by_fkey;
ALTER TABLE email_tracking_entries DROP CONSTRAINT IF EXISTS email_tracking_entries_created_by_fkey;
ALTER TABLE email_tracking_entries DROP CONSTRAINT IF EXISTS email_tracking_entries_updated_by_fkey;
ALTER TABLE email_tracking_folder_access DROP CONSTRAINT IF EXISTS email_tracking_folder_access_user_id_fkey;
ALTER TABLE email_tracking_folder_access DROP CONSTRAINT IF EXISTS email_tracking_folder_access_granted_by_fkey;
ALTER TABLE email_tracking_archive DROP CONSTRAINT IF EXISTS email_tracking_archive_archived_by_fkey;

-- 2. Change created_by from UUID to INTEGER in email_tracking_folders
ALTER TABLE email_tracking_folders ALTER COLUMN created_by DROP DEFAULT;
ALTER TABLE email_tracking_folders ALTER COLUMN created_by TYPE INTEGER USING created_by::text::integer;

-- 3. Change created_by and updated_by from UUID to INTEGER in email_tracking_entries
ALTER TABLE email_tracking_entries ALTER COLUMN created_by DROP DEFAULT;
ALTER TABLE email_tracking_entries ALTER COLUMN created_by TYPE INTEGER USING created_by::text::integer;
ALTER TABLE email_tracking_entries ALTER COLUMN updated_by DROP DEFAULT;
ALTER TABLE email_tracking_entries ALTER COLUMN updated_by TYPE INTEGER USING updated_by::text::integer;

-- 4. Change user_id and granted_by from UUID to INTEGER in email_tracking_folder_access
ALTER TABLE email_tracking_folder_access ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE email_tracking_folder_access ALTER COLUMN user_id TYPE INTEGER USING user_id::text::integer;
ALTER TABLE email_tracking_folder_access ALTER COLUMN granted_by DROP DEFAULT;
ALTER TABLE email_tracking_folder_access ALTER COLUMN granted_by TYPE INTEGER USING granted_by::text::integer;

-- 5. Change archived_by from UUID to INTEGER in email_tracking_archive
ALTER TABLE email_tracking_archive ALTER COLUMN archived_by DROP DEFAULT;
ALTER TABLE email_tracking_archive ALTER COLUMN archived_by TYPE INTEGER USING archived_by::text::integer;

-- 6. Add back foreign key constraints to auth_user table
ALTER TABLE email_tracking_folders 
  ADD CONSTRAINT email_tracking_folders_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth_user(id);

ALTER TABLE email_tracking_entries 
  ADD CONSTRAINT email_tracking_entries_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth_user(id);

ALTER TABLE email_tracking_entries 
  ADD CONSTRAINT email_tracking_entries_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES auth_user(id);

ALTER TABLE email_tracking_folder_access 
  ADD CONSTRAINT email_tracking_folder_access_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth_user(id);

ALTER TABLE email_tracking_folder_access 
  ADD CONSTRAINT email_tracking_folder_access_granted_by_fkey 
  FOREIGN KEY (granted_by) REFERENCES auth_user(id);

ALTER TABLE email_tracking_archive 
  ADD CONSTRAINT email_tracking_archive_archived_by_fkey 
  FOREIGN KEY (archived_by) REFERENCES auth_user(id);

-- Success message
COMMENT ON TABLE email_tracking_folders IS 'Fixed to use INTEGER IDs matching auth_user table';


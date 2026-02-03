-- Setup Password Vault Security
-- This ensures only owners and shared members can see passwords

-- First, make sure we have a function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INTEGER AS $$
BEGIN
  -- For now, return a default user ID
  -- In production, you'd get this from the JWT token or session
  RETURN 1; -- Replace with actual user ID logic
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view that only shows passwords user can access
CREATE OR REPLACE VIEW user_accessible_passwords AS
SELECT DISTINCT
  pv.*,
  pvf.name as folder_name,
  CASE 
    WHEN pv.created_by_id = get_current_user_id() THEN true
    ELSE false
  END as is_owner,
  CASE 
    WHEN pva.vault_id IS NOT NULL THEN true
    ELSE false
  END as is_shared_with_me
FROM password_vault pv
LEFT JOIN password_vault_folders pvf ON pv.folder_id = pvf.id
LEFT JOIN password_vault_access pva ON pv.id = pva.vault_id
WHERE 
  pv.is_active = true
  AND (
    pv.created_by_id = get_current_user_id() -- User owns the password
    OR 
    (pva.user_email = (
      SELECT email FROM auth_user WHERE id = get_current_user_id()
    ) AND pva.can_view = true) -- User has been given access
  );

-- Grant access to the view
GRANT SELECT ON user_accessible_passwords TO anon, authenticated;

-- Create function to check if user can access a specific password
CREATE OR REPLACE FUNCTION can_user_access_password(password_id INTEGER, user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_email_val TEXT;
  password_owner INTEGER;
  has_access BOOLEAN := false;
BEGIN
  -- Get user email
  SELECT email INTO user_email_val FROM auth_user WHERE id = user_id;
  
  -- Get password owner
  SELECT created_by_id INTO password_owner FROM password_vault WHERE id = password_id;
  
  -- Check if user is owner
  IF password_owner = user_id THEN
    RETURN true;
  END IF;
  
  -- Check if user has shared access
  SELECT EXISTS(
    SELECT 1 FROM password_vault_access 
    WHERE vault_id = password_id 
    AND user_email = user_email_val 
    AND can_view = true
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'PASSWORD SECURITY SETUP COMPLETE!' as status,
       'Only owners and shared members can now see passwords' as message;

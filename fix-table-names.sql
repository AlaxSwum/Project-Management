-- Fix table name mismatch - Create password_vault_folders table
-- Run this in Supabase SQL Editor to fix the 404 error

-- Create the password_vault_folders table that the application expects
CREATE TABLE IF NOT EXISTS password_vault_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#5884FD',
    icon VARCHAR(50) DEFAULT 'folder',
    created_by_id INTEGER, -- This matches what the app is sending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for immediate access
ALTER TABLE password_vault_folders DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon role
GRANT ALL ON password_vault_folders TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Copy any existing data from password_folders to password_vault_folders
INSERT INTO password_vault_folders (name, description, color, created_by_id, created_at, updated_at)
SELECT name, description, color, created_by, created_at, updated_at 
FROM password_folders
ON CONFLICT DO NOTHING;

-- Also create password_vault table if the app needs it
CREATE TABLE IF NOT EXISTS password_vault (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES password_vault_folders(id),
    account_name VARCHAR(255) NOT NULL,
    website_url TEXT,
    email VARCHAR(255),
    username VARCHAR(255),
    password_encrypted TEXT NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS and grant access for password_vault
ALTER TABLE password_vault DISABLE ROW LEVEL SECURITY;
GRANT ALL ON password_vault TO anon;

-- Create password_vault_access table for sharing
CREATE TABLE IF NOT EXISTS password_vault_access (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER REFERENCES password_vault(id),
    user_id INTEGER,
    user_email VARCHAR(255),
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    granted_by_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS and grant access for password_vault_access
ALTER TABLE password_vault_access DISABLE ROW LEVEL SECURITY;
GRANT ALL ON password_vault_access TO anon;

-- Create audit log table
CREATE TABLE IF NOT EXISTS password_audit_log (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS and grant access for audit log
ALTER TABLE password_audit_log DISABLE ROW LEVEL SECURITY;
GRANT ALL ON password_audit_log TO anon;

SELECT 'PASSWORD VAULT TABLES CREATED SUCCESSFULLY!' as status,
       'password_vault_folders table is now available' as message;

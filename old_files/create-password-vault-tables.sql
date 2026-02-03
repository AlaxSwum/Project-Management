-- Complete Password Vault System Setup
-- Run this ENTIRE script in Supabase SQL Editor

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS password_vault_access CASCADE;
DROP TABLE IF EXISTS password_vault CASCADE;
DROP TABLE IF EXISTS password_vault_folders CASCADE;
DROP TABLE IF EXISTS password_audit_log CASCADE;

-- Create password_vault_folders table
CREATE TABLE password_vault_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#5884FD',
    icon VARCHAR(50) DEFAULT 'folder',
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password_vault table
CREATE TABLE password_vault (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES password_vault_folders(id) ON DELETE SET NULL,
    account_name VARCHAR(255) NOT NULL,
    website_url TEXT,
    email VARCHAR(255),
    username VARCHAR(255),
    password_encrypted TEXT NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password_vault_access table for sharing
CREATE TABLE password_vault_access (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER REFERENCES password_vault(id) ON DELETE CASCADE,
    user_id INTEGER,
    user_email VARCHAR(255),
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    granted_by_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table
CREATE TABLE password_audit_log (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on all tables for immediate access
ALTER TABLE password_vault_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_audit_log DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to anon and authenticated roles
GRANT ALL ON password_vault_folders TO anon, authenticated;
GRANT ALL ON password_vault TO anon, authenticated;
GRANT ALL ON password_vault_access TO anon, authenticated;
GRANT ALL ON password_audit_log TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert a default "Personal" folder for testing
INSERT INTO password_vault_folders (name, description, color, icon, created_by_id)
VALUES ('Personal', 'Personal passwords folder', '#5884FD', 'folder', 1)
ON CONFLICT DO NOTHING;

SELECT 'PASSWORD VAULT SYSTEM SETUP COMPLETE!' as status,
       'Tables created: password_vault_folders, password_vault, password_vault_access, password_audit_log' as message;

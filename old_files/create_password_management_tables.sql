-- =====================================================
-- PASSWORD MANAGEMENT SYSTEM DATABASE
-- =====================================================
-- Secure password vault similar to Bitwarden with access controls

-- 1. Create password_vault table for storing encrypted passwords
CREATE TABLE IF NOT EXISTS password_vault (
    id SERIAL PRIMARY KEY,
    
    -- Basic Information
    account_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    username VARCHAR(255),
    password_encrypted TEXT NOT NULL, -- Encrypted password
    
    -- Additional Details
    phone_number VARCHAR(50),
    website_url VARCHAR(500),
    notes TEXT,
    
    -- Organization/Category
    folder_name VARCHAR(100) DEFAULT 'Personal',
    category VARCHAR(50) DEFAULT 'login', -- login, card, identity, note
    tags TEXT[], -- Array of tags for organization
    
    -- Security
    two_factor_auth BOOLEAN DEFAULT FALSE,
    security_questions JSONB, -- Array of security questions/answers
    
    -- Metadata
    created_by_id INTEGER NOT NULL REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    -- Password Health
    password_strength VARCHAR(20) DEFAULT 'unknown', -- weak, fair, good, strong
    password_created_date DATE,
    password_last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_compromised BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE
);

-- 2. Create password_vault_access table for permission management
CREATE TABLE IF NOT EXISTS password_vault_access (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER REFERENCES password_vault(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    
    -- Permission Levels
    permission_level VARCHAR(20) DEFAULT 'viewer', -- owner, editor, viewer
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    
    -- Audit Trail
    granted_by INTEGER REFERENCES auth_user(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    
    -- Unique constraint to prevent duplicate permissions
    UNIQUE(vault_id, user_id)
);

-- 3. Create password_vault_folders for organization
CREATE TABLE IF NOT EXISTS password_vault_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#5884FD',
    icon VARCHAR(50) DEFAULT 'folder',
    
    -- Hierarchy
    parent_folder_id INTEGER REFERENCES password_vault_folders(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    
    -- Access Control
    created_by_id INTEGER REFERENCES auth_user(id),
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate folder names for same user
    UNIQUE(name, created_by_id, parent_folder_id)
);

-- 4. Create password_audit_log for security tracking
CREATE TABLE IF NOT EXISTS password_audit_log (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER REFERENCES password_vault(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id),
    
    -- Action Details
    action VARCHAR(50) NOT NULL, -- view, create, update, delete, share, access_granted, access_revoked
    details JSONB, -- Additional action details
    ip_address INET,
    user_agent TEXT,
    
    -- Security
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create password_sharing_links for secure sharing
CREATE TABLE IF NOT EXISTS password_sharing_links (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER REFERENCES password_vault(id) ON DELETE CASCADE,
    
    -- Link Details
    share_token VARCHAR(255) UNIQUE NOT NULL,
    share_url VARCHAR(500) NOT NULL,
    
    -- Access Control
    created_by_id INTEGER REFERENCES auth_user(id),
    max_views INTEGER DEFAULT 1,
    current_views INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Permissions
    allow_download BOOLEAN DEFAULT FALSE,
    require_password BOOLEAN DEFAULT FALSE,
    access_password VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_vault_created_by ON password_vault(created_by_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folder ON password_vault(folder_name);
CREATE INDEX IF NOT EXISTS idx_password_vault_category ON password_vault(category);
CREATE INDEX IF NOT EXISTS idx_password_vault_tags ON password_vault USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_password_vault_active ON password_vault(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_password_vault_favorite ON password_vault(is_favorite) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_password_vault_access_vault ON password_vault_access(vault_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_access_user ON password_vault_access(user_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_access_permission ON password_vault_access(permission_level);

CREATE INDEX IF NOT EXISTS idx_password_audit_log_vault ON password_audit_log(vault_id);
CREATE INDEX IF NOT EXISTS idx_password_audit_log_user ON password_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_password_audit_log_action ON password_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_password_audit_log_created ON password_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_folders_created_by ON password_vault_folders(created_by_id);
CREATE INDEX IF NOT EXISTS idx_password_folders_parent ON password_vault_folders(parent_folder_id);

-- 7. Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_password_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.password_last_changed = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_password_vault_updated_at 
    BEFORE UPDATE ON password_vault
    FOR EACH ROW 
    EXECUTE FUNCTION update_password_vault_updated_at();

CREATE TRIGGER update_password_vault_folders_updated_at 
    BEFORE UPDATE ON password_vault_folders
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to automatically grant owner permissions
CREATE OR REPLACE FUNCTION grant_owner_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Grant owner permissions to the creator
    INSERT INTO password_vault_access (vault_id, user_id, permission_level, can_view, can_edit, can_delete, can_share, granted_by)
    VALUES (NEW.id, NEW.created_by_id, 'owner', true, true, true, true, NEW.created_by_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER grant_owner_permissions_trigger
    AFTER INSERT ON password_vault
    FOR EACH ROW
    EXECUTE FUNCTION grant_owner_permissions();

-- 9. Create audit logging function
CREATE OR REPLACE FUNCTION log_password_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the action
    IF TG_OP = 'INSERT' THEN
        INSERT INTO password_audit_log (vault_id, user_id, action, details)
        VALUES (NEW.id, NEW.created_by_id, 'create', json_build_object('account_name', NEW.account_name));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO password_audit_log (vault_id, user_id, action, details)
        VALUES (NEW.id, NEW.created_by_id, 'update', json_build_object('account_name', NEW.account_name));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO password_audit_log (vault_id, user_id, action, details)
        VALUES (OLD.id, OLD.created_by_id, 'delete', json_build_object('account_name', OLD.account_name));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_password_access_trigger
    AFTER INSERT OR UPDATE OR DELETE ON password_vault
    FOR EACH ROW
    EXECUTE FUNCTION log_password_access();

-- 10. Create views for easy querying
CREATE OR REPLACE VIEW password_vault_with_access AS
SELECT 
    pv.*,
    pva.permission_level,
    pva.can_view,
    pva.can_edit,
    pva.can_delete,
    pva.can_share,
    CASE 
        WHEN pv.password_created_date IS NOT NULL AND pv.password_created_date < CURRENT_DATE - INTERVAL '90 days' THEN true
        ELSE false
    END as password_needs_update
FROM password_vault pv
LEFT JOIN password_vault_access pva ON pv.id = pva.vault_id
WHERE pv.is_active = true;

-- 11. Insert default folders
INSERT INTO password_vault_folders (name, description, color, icon, created_by_id) VALUES
('Personal', 'Personal accounts and passwords', '#5884FD', 'user', 1),
('Work', 'Work-related accounts', '#F87239', 'briefcase', 1),
('Social Media', 'Social media accounts', '#C483D9', 'share', 1),
('Banking', 'Banking and financial accounts', '#10b981', 'credit-card', 1),
('Shopping', 'E-commerce and shopping sites', '#FFB333', 'shopping-cart', 1),
('Entertainment', 'Streaming and entertainment services', '#ef4444', 'play', 1)
ON CONFLICT (name, created_by_id, parent_folder_id) DO NOTHING;

-- 12. Create sample data (optional - remove in production)
-- INSERT INTO password_vault (account_name, email, username, password_encrypted, website_url, folder_name, category, created_by_id) VALUES
-- ('Gmail', 'user@gmail.com', 'user@gmail.com', 'encrypted_password_here', 'https://gmail.com', 'Personal', 'login', 1),
-- ('Facebook', 'user@gmail.com', 'username', 'encrypted_password_here', 'https://facebook.com', 'Social Media', 'login', 1);

-- Success message
SELECT 'Password management system tables created successfully!' as message,
       'Tables: password_vault, password_vault_access, password_vault_folders, password_audit_log, password_sharing_links' as tables_created,
       'Features: Encryption, Access Control, Audit Logging, Sharing, Folders' as features; 
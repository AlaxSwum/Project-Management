-- =====================================================
-- EMAIL TRACKING SYSTEM FOR ROTHER CARE PHARMACY
-- Clean, Professional, Scalable Communication Management
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. EMAIL ACCOUNTS TABLE
-- Stores all email accounts used in the business
-- =====================================================

CREATE TABLE IF NOT EXISTS email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name VARCHAR(255) NOT NULL UNIQUE, -- e.g., "accounts@", "support@", "marketing@"
    full_email VARCHAR(255) NOT NULL UNIQUE,   -- e.g., "accounts@rothercare.com"
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. EMAIL TRACKING FOLDERS TABLE
-- Year/Month/Week folder structure
-- =====================================================

CREATE TABLE IF NOT EXISTS email_tracking_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_name VARCHAR(255) NOT NULL,           -- e.g., "2025", "January 2025", "Week 1 - Jan 2025"
    folder_type VARCHAR(50) NOT NULL,             -- 'YEAR', 'MONTH', 'WEEK'
    parent_folder_id UUID REFERENCES email_tracking_folders(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,                        -- For easy filtering
    month INTEGER,                                -- 1-12, NULL for year folders
    week_number INTEGER,                          -- 1-52, NULL for year/month folders
    start_date DATE,                              -- For week/month folders
    end_date DATE,                                -- For week/month folders
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT false,
    CONSTRAINT unique_folder_structure UNIQUE (folder_type, year, month, week_number)
);

-- =====================================================
-- 3. EMAIL TRACKING ENTRIES TABLE
-- Main data table with all required columns
-- =====================================================

CREATE TABLE IF NOT EXISTS email_tracking_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID NOT NULL REFERENCES email_tracking_folders(id) ON DELETE CASCADE,
    
    -- Core tracking fields
    entry_date DATE NOT NULL,
    from_sender VARCHAR(500) NOT NULL,            -- Sender name or email
    subject TEXT NOT NULL,                        -- Short description
    remark TEXT,                                  -- Internal note or reference
    to_do TEXT,                                   -- Task/action needed
    final_remark TEXT,                            -- Result or outcome
    folder_placed VARCHAR(500),                   -- Where email/file was saved
    response TEXT,                                -- If replied
    
    -- Categorization
    email_account_id UUID REFERENCES email_accounts(id),
    
    -- Status
    confirmed BOOLEAN DEFAULT false,              -- Completion checkbox
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Indexing for performance
    CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES email_tracking_folders(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. FOLDER ACCESS CONTROL TABLE
-- Manage who can view/edit each folder
-- =====================================================

CREATE TABLE IF NOT EXISTS email_tracking_folder_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID NOT NULL REFERENCES email_tracking_folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_level VARCHAR(20) NOT NULL,            -- 'VIEWER', 'EDITOR', 'ADMIN'
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_folder_user_access UNIQUE (folder_id, user_id)
);

-- =====================================================
-- 5. ARCHIVED ENTRIES TABLE
-- Store old/cleared data for historical reference
-- =====================================================

CREATE TABLE IF NOT EXISTS email_tracking_archive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_entry_id UUID,
    folder_name VARCHAR(255),
    entry_date DATE,
    from_sender VARCHAR(500),
    subject TEXT,
    remark TEXT,
    to_do TEXT,
    final_remark TEXT,
    folder_placed VARCHAR(500),
    response TEXT,
    email_account_name VARCHAR(255),
    confirmed BOOLEAN,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_email_entries_folder ON email_tracking_entries(folder_id);
CREATE INDEX IF NOT EXISTS idx_email_entries_date ON email_tracking_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_email_entries_confirmed ON email_tracking_entries(confirmed);
CREATE INDEX IF NOT EXISTS idx_email_entries_account ON email_tracking_entries(email_account_id);
CREATE INDEX IF NOT EXISTS idx_email_entries_created_by ON email_tracking_entries(created_by);

CREATE INDEX IF NOT EXISTS idx_folders_parent ON email_tracking_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_year ON email_tracking_folders(year);
CREATE INDEX IF NOT EXISTS idx_folders_type ON email_tracking_folders(folder_type);

CREATE INDEX IF NOT EXISTS idx_folder_access_folder ON email_tracking_folder_access(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_access_user ON email_tracking_folder_access(user_id);

CREATE INDEX IF NOT EXISTS idx_archive_date ON email_tracking_archive(entry_date);
CREATE INDEX IF NOT EXISTS idx_archive_archived_at ON email_tracking_archive(archived_at);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_folder_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_archive ENABLE ROW LEVEL SECURITY;

-- Email Accounts: All authenticated users can view, only admins can modify
CREATE POLICY "Anyone can view email accounts"
    ON email_accounts FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only creators and admins can manage email accounts"
    ON email_accounts FOR ALL
    USING (auth.uid() = created_by OR 
           EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

-- Folders: Based on access control table
CREATE POLICY "Users can view folders they have access to"
    ON email_tracking_folders FOR SELECT
    USING (
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM email_tracking_folder_access WHERE folder_id = id AND user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Users can create folders"
    ON email_tracking_folders FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update folders they have EDITOR or ADMIN access to"
    ON email_tracking_folders FOR UPDATE
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM email_tracking_folder_access 
            WHERE folder_id = id AND user_id = auth.uid() 
            AND access_level IN ('EDITOR', 'ADMIN')
        ) OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Only folder creators and admins can delete folders"
    ON email_tracking_folders FOR DELETE
    USING (
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

-- Entries: Based on folder access
CREATE POLICY "Users can view entries in folders they have access to"
    ON email_tracking_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM email_tracking_folders f
            LEFT JOIN email_tracking_folder_access fa ON f.id = fa.folder_id
            WHERE f.id = folder_id AND (
                f.created_by = auth.uid() OR
                fa.user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
            )
        )
    );

CREATE POLICY "Users can create entries in folders they have access to"
    ON email_tracking_entries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM email_tracking_folders f
            LEFT JOIN email_tracking_folder_access fa ON f.id = fa.folder_id
            WHERE f.id = folder_id AND (
                f.created_by = auth.uid() OR
                fa.user_id = auth.uid() AND fa.access_level IN ('EDITOR', 'ADMIN') OR
                EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
            )
        )
    );

CREATE POLICY "Users can update entries in folders with EDITOR access"
    ON email_tracking_entries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM email_tracking_folders f
            LEFT JOIN email_tracking_folder_access fa ON f.id = fa.folder_id
            WHERE f.id = folder_id AND (
                f.created_by = auth.uid() OR
                fa.user_id = auth.uid() AND fa.access_level IN ('EDITOR', 'ADMIN') OR
                auth.uid() = created_by OR
                EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
            )
        )
    );

CREATE POLICY "Users can delete their own entries or if they have ADMIN access"
    ON email_tracking_entries FOR DELETE
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM email_tracking_folders f
            LEFT JOIN email_tracking_folder_access fa ON f.id = fa.folder_id
            WHERE f.id = folder_id AND (
                f.created_by = auth.uid() OR
                fa.user_id = auth.uid() AND fa.access_level = 'ADMIN' OR
                EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
            )
        )
    );

-- Folder Access: Only folder creators and admins can manage access
CREATE POLICY "Users can view access for their folders"
    ON email_tracking_folder_access FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM email_tracking_folders WHERE id = folder_id AND created_by = auth.uid()) OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Folder creators can grant access"
    ON email_tracking_folder_access FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM email_tracking_folders WHERE id = folder_id AND created_by = auth.uid()) OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Folder creators can revoke access"
    ON email_tracking_folder_access FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM email_tracking_folders WHERE id = folder_id AND created_by = auth.uid()) OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

-- Archive: Only admins and original creators can view
CREATE POLICY "Admins and creators can view archive"
    ON email_tracking_archive FOR SELECT
    USING (
        auth.uid() = archived_by OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

-- =====================================================
-- 8. FUNCTIONS FOR AUTOMATION
-- =====================================================

-- Function to archive entries older than a specific date
CREATE OR REPLACE FUNCTION archive_old_email_entries(cutoff_date DATE)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Insert into archive
    INSERT INTO email_tracking_archive (
        original_entry_id, folder_name, entry_date, from_sender, subject, 
        remark, to_do, final_remark, folder_placed, response, 
        email_account_name, confirmed, archived_by
    )
    SELECT 
        e.id,
        f.folder_name,
        e.entry_date,
        e.from_sender,
        e.subject,
        e.remark,
        e.to_do,
        e.final_remark,
        e.folder_placed,
        e.response,
        ea.account_name,
        e.confirmed,
        auth.uid()
    FROM email_tracking_entries e
    JOIN email_tracking_folders f ON e.folder_id = f.id
    LEFT JOIN email_accounts ea ON e.email_account_id = ea.id
    WHERE e.entry_date < cutoff_date AND e.confirmed = true;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Delete archived entries
    DELETE FROM email_tracking_entries
    WHERE entry_date < cutoff_date AND confirmed = true;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create year folder structure
CREATE OR REPLACE FUNCTION create_year_folder(year_val INTEGER, creator_id UUID)
RETURNS UUID AS $$
DECLARE
    folder_id UUID;
BEGIN
    INSERT INTO email_tracking_folders (
        folder_name, folder_type, year, created_by
    ) VALUES (
        year_val::VARCHAR, 'YEAR', year_val, creator_id
    )
    RETURNING id INTO folder_id;
    
    RETURN folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create month folder
CREATE OR REPLACE FUNCTION create_month_folder(
    parent_id UUID, 
    year_val INTEGER, 
    month_val INTEGER, 
    creator_id UUID
)
RETURNS UUID AS $$
DECLARE
    folder_id UUID;
    month_name VARCHAR;
    start_dt DATE;
    end_dt DATE;
BEGIN
    -- Get month name
    month_name := TO_CHAR(TO_DATE(month_val::TEXT, 'MM'), 'Month') || ' ' || year_val::TEXT;
    
    -- Calculate start and end dates
    start_dt := DATE(year_val || '-' || LPAD(month_val::TEXT, 2, '0') || '-01');
    end_dt := (start_dt + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    INSERT INTO email_tracking_folders (
        folder_name, folder_type, parent_folder_id, year, month, 
        start_date, end_date, created_by
    ) VALUES (
        TRIM(month_name), 'MONTH', parent_id, year_val, month_val, 
        start_dt, end_dt, creator_id
    )
    RETURNING id INTO folder_id;
    
    RETURN folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create week folder
CREATE OR REPLACE FUNCTION create_week_folder(
    parent_id UUID,
    year_val INTEGER,
    week_num INTEGER,
    start_dt DATE,
    end_dt DATE,
    creator_id UUID
)
RETURNS UUID AS $$
DECLARE
    folder_id UUID;
    week_name VARCHAR;
    month_val INTEGER;
BEGIN
    month_val := EXTRACT(MONTH FROM start_dt)::INTEGER;
    week_name := 'Week ' || week_num::TEXT || ' - ' || TO_CHAR(start_dt, 'Mon YYYY');
    
    INSERT INTO email_tracking_folders (
        folder_name, folder_type, parent_folder_id, year, month, week_number,
        start_date, end_date, created_by
    ) VALUES (
        week_name, 'WEEK', parent_id, year_val, month_val, week_num,
        start_dt, end_dt, creator_id
    )
    RETURNING id INTO folder_id;
    
    RETURN folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. INSERT DEFAULT EMAIL ACCOUNTS
-- =====================================================

INSERT INTO email_accounts (account_name, full_email, description) VALUES
    ('accounts@', 'accounts@rothercare.com', 'Accounts and Finance Department'),
    ('support@', 'support@rothercare.com', 'Customer Support'),
    ('marketing@', 'marketing@rothercare.com', 'Marketing and Communications'),
    ('admin@', 'admin@rothercare.com', 'Administration'),
    ('info@', 'info@rothercare.com', 'General Inquiries')
ON CONFLICT (account_name) DO NOTHING;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON email_accounts TO authenticated;
GRANT ALL ON email_tracking_folders TO authenticated;
GRANT ALL ON email_tracking_entries TO authenticated;
GRANT ALL ON email_tracking_folder_access TO authenticated;
GRANT ALL ON email_tracking_archive TO authenticated;

-- =====================================================
-- DEPLOYMENT COMPLETE
-- =====================================================

-- Summary Comment
COMMENT ON TABLE email_tracking_entries IS 'Clean email and project tracking system for Rother Care Pharmacy - manages incoming communications with folder-based organization and access control';


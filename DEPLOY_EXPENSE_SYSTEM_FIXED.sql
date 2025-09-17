-- DEPLOY EXPENSE MANAGEMENT SYSTEM - FIXED VERSION
-- Copy and paste this entire SQL script in Supabase SQL Editor

-- Create expense_folders table
CREATE TABLE IF NOT EXISTS expense_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_by INTEGER NOT NULL, -- Using INTEGER like other tables in your system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    folder_type VARCHAR(50) DEFAULT 'expense' CHECK (folder_type IN ('expense', 'budget', 'reimbursement')),
    budget_limit DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD'
);

-- Create expense_folder_members table
CREATE TABLE IF NOT EXISTS expense_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES expense_folders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL, -- Using INTEGER like other tables in your system
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    added_by INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(folder_id, user_id)
);

-- Create expense_items table
CREATE TABLE IF NOT EXISTS expense_items (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES expense_folders(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL,
    created_by_name TEXT NOT NULL,
    created_by_email TEXT NOT NULL,
    item_name VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(15,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (price * quantity) STORED,
    currency VARCHAR(3) DEFAULT 'USD',
    expense_date DATE NOT NULL,
    month_year VARCHAR(7) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
    receipt_url TEXT,
    notes TEXT,
    approved_by INTEGER,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    default_currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default expense categories
INSERT INTO expense_categories (name, description) VALUES
('Office Supplies', 'Pens, paper, office equipment'),
('Travel', 'Transportation, accommodation, travel expenses'),
('Meals & Entertainment', 'Business meals, client entertainment'),
('Software & Subscriptions', 'Software licenses, online subscriptions'),
('Equipment', 'Hardware, computers, office equipment'),
('Marketing', 'Advertising, promotional materials'),
('Training & Education', 'Courses, conferences, training materials'),
('Utilities', 'Internet, phone, electricity'),
('Rent & Facilities', 'Office rent, facility costs'),
('Miscellaneous', 'Other business expenses')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_folders_created_by ON expense_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_folders_active ON expense_folders(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_folder_members_folder ON expense_folder_members(folder_id);
CREATE INDEX IF NOT EXISTS idx_expense_folder_members_user ON expense_folder_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_folder ON expense_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_created_by ON expense_items(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_items_date ON expense_items(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_items_month ON expense_items(month_year);
CREATE INDEX IF NOT EXISTS idx_expense_items_status ON expense_items(status);
CREATE INDEX IF NOT EXISTS idx_expense_items_category ON expense_items(category);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_expense_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_expense_folders_updated_at ON expense_folders;
CREATE TRIGGER update_expense_folders_updated_at
    BEFORE UPDATE ON expense_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_updated_at();

DROP TRIGGER IF EXISTS update_expense_items_updated_at ON expense_items;
CREATE TRIGGER update_expense_items_updated_at
    BEFORE UPDATE ON expense_items
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_updated_at();

-- Create function to automatically set month_year
CREATE OR REPLACE FUNCTION set_expense_month_year()
RETURNS TRIGGER AS $$
BEGIN
    NEW.month_year = TO_CHAR(NEW.expense_date, 'YYYY-MM');
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_expense_month_year_trigger ON expense_items;
CREATE TRIGGER set_expense_month_year_trigger
    BEFORE INSERT OR UPDATE ON expense_items
    FOR EACH ROW
    EXECUTE FUNCTION set_expense_month_year();

-- Disable RLS for simplicity (we handle access control in application)
ALTER TABLE expense_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_folder_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON expense_folders TO authenticated;
GRANT ALL ON expense_folders TO anon;
GRANT ALL ON expense_folder_members TO authenticated;
GRANT ALL ON expense_folder_members TO anon;
GRANT ALL ON expense_items TO authenticated;
GRANT ALL ON expense_items TO anon;
GRANT ALL ON expense_categories TO authenticated;
GRANT ALL ON expense_categories TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE expense_folders_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE expense_folders_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE expense_folder_members_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE expense_folder_members_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE expense_items_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE expense_items_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE expense_categories_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE expense_categories_id_seq TO anon;

-- Success message
SELECT 'SUCCESS: Expense Management System deployed successfully!' as result;

-- =====================================================
-- PHARMACY SALES TRACKING SYSTEM
-- Rother Care Pharmacy - Daily Sales and Services
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SALES ITEMS TABLE
-- For products: ETP, Green, New Service, etc.
-- =====================================================

CREATE TABLE IF NOT EXISTS pharmacy_sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL,          -- 'ETP', 'Green', 'New Service'
    sub_category VARCHAR(100),                -- 'New User', 'Existing User', etc.
    item_type VARCHAR(100) NOT NULL,          -- Column name (e.g., 'ETP New User Items')
    item_name TEXT,                           -- Specific product name
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2),                      -- Optional: price per item
    total_amount DECIMAL(10,2),               -- Optional: quantity * price
    notes TEXT,
    created_by INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SERVICE ITEMS TABLE
-- For services: Consultations, Services, Other
-- =====================================================

CREATE TABLE IF NOT EXISTS pharmacy_service_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL,          -- 'Services', 'Other', 'Consultation'
    sub_category VARCHAR(100),                -- Service type
    service_type VARCHAR(100) NOT NULL,       -- Column name
    service_name TEXT,                        -- Specific service name
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2),                      -- Optional: price per service
    total_amount DECIMAL(10,2),               -- Optional: quantity * price
    notes TEXT,
    created_by INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CATEGORIES CONFIGURATION TABLE
-- Store category and sub-category definitions
-- =====================================================

CREATE TABLE IF NOT EXISTS pharmacy_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'service')),
    category_name VARCHAR(100) NOT NULL,
    sub_category_name VARCHAR(100),
    item_type_name VARCHAR(100) NOT NULL,     -- Column header name
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sales_date ON pharmacy_sales_items(entry_date);
CREATE INDEX IF NOT EXISTS idx_sales_category ON pharmacy_sales_items(category);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON pharmacy_sales_items(created_by);

CREATE INDEX IF NOT EXISTS idx_service_date ON pharmacy_service_items(entry_date);
CREATE INDEX IF NOT EXISTS idx_service_category ON pharmacy_service_items(category);
CREATE INDEX IF NOT EXISTS idx_service_created_by ON pharmacy_service_items(created_by);

CREATE INDEX IF NOT EXISTS idx_categories_type ON pharmacy_categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON pharmacy_categories(is_active);

-- =====================================================
-- 5. INSERT DEFAULT CATEGORIES
-- =====================================================

-- SALES CATEGORIES
INSERT INTO pharmacy_categories (type, category_name, sub_category_name, item_type_name, display_order) VALUES
    ('sale', 'ETP', 'New User', 'ETP New User Items', 1),
    ('sale', 'ETP', 'Existing User', 'ETP Exist User Items', 2),
    ('sale', 'Green', NULL, 'Green Items', 3),
    ('sale', 'New Service', NULL, 'New Service Items', 4)
ON CONFLICT DO NOTHING;

-- SERVICE CATEGORIES
INSERT INTO pharmacy_categories (type, category_name, sub_category_name, item_type_name, display_order) VALUES
    ('service', 'Services', 'Consultation', 'Consultation Services', 1),
    ('service', 'Services', 'Health Check', 'Health Check Services', 2),
    ('service', 'Other', NULL, 'Other Services', 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE pharmacy_sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_categories ENABLE ROW LEVEL SECURITY;

-- Sales Items: All authenticated users can view and manage
CREATE POLICY "Authenticated users can view sales items"
    ON pharmacy_sales_items FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sales items"
    ON pharmacy_sales_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own sales items"
    ON pharmacy_sales_items FOR UPDATE
    USING (created_by = (SELECT id FROM auth_user WHERE id = auth.uid()::integer));

CREATE POLICY "Users can delete their own sales items"
    ON pharmacy_sales_items FOR DELETE
    USING (created_by = (SELECT id FROM auth_user WHERE id = auth.uid()::integer));

-- Service Items: All authenticated users can view and manage
CREATE POLICY "Authenticated users can view service items"
    ON pharmacy_service_items FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert service items"
    ON pharmacy_service_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own service items"
    ON pharmacy_service_items FOR UPDATE
    USING (created_by = (SELECT id FROM auth_user WHERE id = auth.uid()::integer));

CREATE POLICY "Users can delete their own service items"
    ON pharmacy_service_items FOR DELETE
    USING (created_by = (SELECT id FROM auth_user WHERE id = auth.uid()::integer));

-- Categories: All can view
CREATE POLICY "Everyone can view categories"
    ON pharmacy_categories FOR SELECT
    USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON pharmacy_sales_items TO authenticated;
GRANT ALL ON pharmacy_service_items TO authenticated;
GRANT ALL ON pharmacy_categories TO authenticated;

-- =====================================================
-- 8. VIEWS FOR DAILY TOTALS
-- =====================================================

-- Daily Sales Summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    entry_date,
    category,
    sub_category,
    item_type,
    SUM(quantity) as total_quantity,
    SUM(total_amount) as total_amount
FROM pharmacy_sales_items
GROUP BY entry_date, category, sub_category, item_type
ORDER BY entry_date DESC, category, item_type;

-- Daily Services Summary
CREATE OR REPLACE VIEW daily_services_summary AS
SELECT 
    entry_date,
    category,
    sub_category,
    service_type,
    SUM(quantity) as total_quantity,
    SUM(total_amount) as total_amount
FROM pharmacy_service_items
GROUP BY entry_date, category, sub_category, service_type
ORDER BY entry_date DESC, category, service_type;

-- =====================================================
-- DEPLOYMENT COMPLETE
-- =====================================================

COMMENT ON TABLE pharmacy_sales_items IS 'Daily sales tracking for pharmacy products - ETP, Green, New Service';
COMMENT ON TABLE pharmacy_service_items IS 'Daily service tracking for pharmacy services - Consultations, Health Checks, Other';


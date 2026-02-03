-- =====================================================
-- PAYROLL SYSTEM TABLES
-- =====================================================
-- Creates tables for payroll management with access control

-- =====================================================
-- 1. PAYROLL MEMBERS TABLE (Access Control)
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    can_view BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_generate_pdf BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by INTEGER REFERENCES auth_user(id),
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payroll_members_user_id ON payroll_members(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_members_role ON payroll_members(role);

-- =====================================================
-- 2. PAYROLL RECORDS TABLE (Store Generated Payrolls)
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_records (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    company_name VARCHAR(255) NOT NULL,
    payroll_type VARCHAR(20) NOT NULL CHECK (payroll_type IN ('myanmar', 'uk')),
    month_ending_date DATE NOT NULL,
    
    -- Employee Details
    tax_code VARCHAR(50),
    national_insurance_number VARCHAR(50),
    national_insurance_table VARCHAR(10),
    annual_leave_remaining INTEGER,
    
    -- Payments
    hours_worked DECIMAL(10, 2),
    hourly_rate DECIMAL(10, 2),
    gross_pay DECIMAL(10, 2),
    holiday_pay DECIMAL(10, 2),
    total_payments DECIMAL(10, 2),
    
    -- Deductions
    tax DECIMAL(10, 2),
    national_insurance DECIMAL(10, 2),
    holiday_repayment DECIMAL(10, 2),
    pension DECIMAL(10, 2),
    advance DECIMAL(10, 2),
    other_deductions DECIMAL(10, 2),
    total_deductions DECIMAL(10, 2),
    
    -- Summary
    taxable_gross_pay DECIMAL(10, 2),
    employer_national_insurance DECIMAL(10, 2),
    employer_pension DECIMAL(10, 2),
    net_pay DECIMAL(10, 2),
    
    -- Year to Date
    ytd_taxable_gross_pay DECIMAL(10, 2),
    ytd_tax DECIMAL(10, 2),
    ytd_employee_ni DECIMAL(10, 2),
    ytd_employer_ni DECIMAL(10, 2),
    ytd_net_pay DECIMAL(10, 2),
    
    -- Payment Info
    payment_method VARCHAR(50),
    paid_date DATE,
    employer_paye_reference VARCHAR(100),
    
    -- Additional UK Fields
    pensionable_pay_this_period DECIMAL(10, 2),
    pensionable_pay_ytd DECIMAL(10, 2),
    
    -- Metadata
    created_by INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- JSON field for flexible additional data
    additional_data JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_name ON payroll_records(employee_name);
CREATE INDEX IF NOT EXISTS idx_payroll_records_company_name ON payroll_records(company_name);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_ending ON payroll_records(month_ending_date);
CREATE INDEX IF NOT EXISTS idx_payroll_records_type ON payroll_records(payroll_type);
CREATE INDEX IF NOT EXISTS idx_payroll_records_created_by ON payroll_records(created_by);

-- =====================================================
-- 3. DISABLE RLS & GRANT PERMISSIONS
-- =====================================================
ALTER TABLE payroll_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records DISABLE ROW LEVEL SECURITY;

GRANT ALL ON payroll_members TO authenticated, anon;
GRANT ALL ON payroll_records TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE payroll_members_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE payroll_records_id_seq TO authenticated, anon;

-- =====================================================
-- 4. ADD UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_payroll_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payroll_records_updated_at
    BEFORE UPDATE ON payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_records_updated_at();


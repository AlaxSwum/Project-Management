-- =====================================================
-- STUDENT MANAGEMENT SYSTEM DATABASE
-- =====================================================
-- Enhanced Classes system for student enrollment and payment management

-- 1. Update Classes Participants table for student management
DROP TABLE IF EXISTS classes_participants;

CREATE TABLE classes_participants (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    
    -- Student Information
    student_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    facebook_link VARCHAR(255),
    
    -- Payment Information
    payment_method VARCHAR(20) CHECK (payment_method IN ('Kpay', 'Aya Pay', 'Wave Pay')) NOT NULL,
    payment_type VARCHAR(20) CHECK (payment_type IN ('full', 'split')) NOT NULL DEFAULT 'full',
    
    -- Course Fee and Discount
    course_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Full Payment
    full_payment_amount DECIMAL(10,2),
    full_payment_date DATE,
    
    -- Split Payment Details
    number_of_splits INTEGER DEFAULT 1,
    split_1_amount DECIMAL(10,2),
    split_1_date DATE,
    split_2_amount DECIMAL(10,2),
    split_2_date DATE,
    split_3_amount DECIMAL(10,2),
    split_3_date DATE,
    split_4_amount DECIMAL(10,2),
    split_4_date DATE,
    
    -- Calculated Fields
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN discount_percentage > 0 THEN course_fee - (course_fee * discount_percentage / 100)
            ELSE course_fee - COALESCE(discount_amount, 0)
        END
    ) STORED,
    
    paid_amount DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN payment_type = 'full' THEN COALESCE(full_payment_amount, 0)
            ELSE COALESCE(split_1_amount, 0) + COALESCE(split_2_amount, 0) + 
                 COALESCE(split_3_amount, 0) + COALESCE(split_4_amount, 0)
        END
    ) STORED,
    
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (
        (CASE 
            WHEN discount_percentage > 0 THEN course_fee - (course_fee * discount_percentage / 100)
            ELSE course_fee - COALESCE(discount_amount, 0)
        END) - 
        (CASE 
            WHEN payment_type = 'full' THEN COALESCE(full_payment_amount, 0)
            ELSE COALESCE(split_1_amount, 0) + COALESCE(split_2_amount, 0) + 
                 COALESCE(split_3_amount, 0) + COALESCE(split_4_amount, 0)
        END)
    ) STORED,
    
    -- Status
    enrollment_status VARCHAR(20) DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'completed', 'dropped', 'pending')),
    payment_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN (CASE 
                WHEN discount_percentage > 0 THEN course_fee - (course_fee * discount_percentage / 100)
                ELSE course_fee - COALESCE(discount_amount, 0)
            END) <= (CASE 
                WHEN payment_type = 'full' THEN COALESCE(full_payment_amount, 0)
                ELSE COALESCE(split_1_amount, 0) + COALESCE(split_2_amount, 0) + 
                     COALESCE(split_3_amount, 0) + COALESCE(split_4_amount, 0)
            END) THEN 'paid'
            WHEN (CASE 
                WHEN payment_type = 'full' THEN COALESCE(full_payment_amount, 0)
                ELSE COALESCE(split_1_amount, 0) + COALESCE(split_2_amount, 0) + 
                     COALESCE(split_3_amount, 0) + COALESCE(split_4_amount, 0)
            END) > 0 THEN 'partial'
            ELSE 'unpaid'
        END
    ) STORED,
    
    -- Metadata
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enrolled_by INTEGER REFERENCES auth_user(id),
    notes TEXT,
    
    UNIQUE(class_id, email)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_class ON classes_participants(class_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON classes_participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_payment_status ON classes_participants(payment_status);
CREATE INDEX IF NOT EXISTS idx_participants_enrollment_status ON classes_participants(enrollment_status);

-- Disable RLS for this table
ALTER TABLE classes_participants DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON classes_participants TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Student Management System Ready!' as status; 
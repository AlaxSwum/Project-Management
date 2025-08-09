-- Check auth_user table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'auth_user' 
ORDER BY ordinal_position;

-- Check if required columns exist and add them if missing
DO $$
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE auth_user ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to auth_user';
    END IF;

    -- Add date_joined column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user' AND column_name = 'date_joined'
    ) THEN
        ALTER TABLE auth_user ADD COLUMN date_joined TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added date_joined column to auth_user';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE auth_user ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to auth_user';
    END IF;

    -- Add is_staff column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user' AND column_name = 'is_staff'
    ) THEN
        ALTER TABLE auth_user ADD COLUMN is_staff BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Added is_staff column to auth_user';
    END IF;

    -- Add is_superuser column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_user' AND column_name = 'is_superuser'
    ) THEN
        ALTER TABLE auth_user ADD COLUMN is_superuser BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Added is_superuser column to auth_user';
    END IF;

    RAISE NOTICE 'Auth user schema check completed';
END $$;

-- Show final schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'auth_user' 
ORDER BY ordinal_position;

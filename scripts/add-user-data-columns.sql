-- Add missing name and email columns to user_data table
-- Run this in Supabase SQL Editor FIRST before running fix-user-data.sql

-- Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_data' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add name and email columns if they don't exist
DO $$ 
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_data' 
        AND column_name = 'name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_data ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Added name column to user_data table';
    ELSE
        RAISE NOTICE 'name column already exists in user_data table';
    END IF;

    -- Add email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_data' 
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_data ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Added email column to user_data table';
    ELSE
        RAISE NOTICE 'email column already exists in user_data table';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_data' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show current user_data records
SELECT 
    id,
    user_id, 
    name, 
    email, 
    role,
    created_at
FROM user_data 
ORDER BY created_at DESC;

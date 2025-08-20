-- Safe Reset: Only Reset Sequences (Keep Existing Data)
-- This script resets auto-incrementing sequences without deleting data
-- Use this if you want to restart numbering but keep existing records

-- Run this in Supabase SQL Editor

-- =============================================================================
-- SECTION 1: SHOW CURRENT STATUS
-- =============================================================================
SELECT 
    'Current Status' as info,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM user_data) as total_users,
    (SELECT MAX(id) FROM orders) as highest_order_id,
    (SELECT MAX(id) FROM user_data) as highest_user_id;

-- =============================================================================
-- SECTION 2: SAFE SEQUENCE RESET
-- =============================================================================
-- Option A: Reset to start after highest existing ID
-- This ensures no ID conflicts with existing data

-- Reset orders sequence to continue after highest existing ID
DO $$
DECLARE
    max_order_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO max_order_id FROM orders;
    EXECUTE format('ALTER SEQUENCE orders_id_seq RESTART WITH %s', max_order_id);
    RAISE NOTICE 'Orders sequence reset to start from %', max_order_id;
END $$;

-- Reset user_data sequence to continue after highest existing ID
DO $$
DECLARE
    max_user_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO max_user_id FROM user_data;
    EXECUTE format('ALTER SEQUENCE user_data_id_seq RESTART WITH %s', max_user_id);
    RAISE NOTICE 'User data sequence reset to start from %', max_user_id;
END $$;

-- =============================================================================
-- SECTION 3: FORCE RESET TO 1 (DANGEROUS - USE ONLY IF NO DATA EXISTS)
-- =============================================================================
-- ⚠️ WARNING: Only uncomment if tables are empty!
-- This will cause ID conflicts if data exists

-- -- Force reset orders sequence to 1
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;
-- 
-- -- Force reset user_data sequence to 1  
-- ALTER SEQUENCE user_data_id_seq RESTART WITH 1;

-- =============================================================================
-- SECTION 4: VERIFICATION
-- =============================================================================
SELECT 
    'Sequence Reset Complete' as status,
    pg_get_serial_sequence('orders', 'id') as orders_sequence,
    pg_get_serial_sequence('user_data', 'id') as user_data_sequence;

-- Test what the next IDs will be (without creating records)
SELECT 
    'Next IDs Preview' as info,
    nextval('orders_id_seq') as next_order_id,
    nextval('user_data_id_seq') as next_user_id;

-- Reset sequences back (since nextval advanced them)
DO $$
DECLARE
    max_order_id INTEGER;
    max_user_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO max_order_id FROM orders;
    SELECT COALESCE(MAX(id), 0) + 1 INTO max_user_id FROM user_data;
    
    EXECUTE format('ALTER SEQUENCE orders_id_seq RESTART WITH %s', max_order_id);
    EXECUTE format('ALTER SEQUENCE user_data_id_seq RESTART WITH %s', max_user_id);
    
    RAISE NOTICE 'Sequences restored: Orders will start from %, Users will start from %', max_order_id, max_user_id;
END $$;

SELECT '✅ Safe sequence reset complete!' as message;

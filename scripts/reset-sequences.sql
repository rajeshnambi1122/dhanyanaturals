-- Reset Order ID and User Count Sequences
-- ⚠️ WARNING: This will reset auto-incrementing IDs and clear data
-- 🚨 BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT!

-- This script will:
-- 1. Clear all existing data from orders and user_data tables
-- 2. Reset the auto-incrementing sequences to start from 1
-- 3. Optionally reset products and reviews sequences

-- Run this in Supabase SQL Editor

-- =============================================================================
-- SECTION 1: BACKUP CHECK
-- =============================================================================
-- Uncomment the line below to confirm you have a backup
-- SELECT 'I have backed up my database' as backup_confirmation;

-- =============================================================================
-- SECTION 2: SHOW CURRENT COUNTS (for reference)
-- =============================================================================
SELECT 
    'Current Data Counts' as info,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM user_data) as total_users,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM reviews) as total_reviews;

-- Show current sequence values
SELECT 
    'Current Sequence Values' as info,
    currval('orders_id_seq') as orders_next_id,
    currval('user_data_id_seq') as user_data_next_id,
    currval('products_id_seq') as products_next_id;

-- =============================================================================
-- SECTION 3: RESET ORDERS (START FROM ORDER #1)
-- =============================================================================
-- Clear all orders
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;

-- Reset the orders sequence to start from 1
ALTER SEQUENCE orders_id_seq RESTART WITH 1;

-- Verify orders reset
SELECT 
    'Orders Reset Complete' as status,
    (SELECT COUNT(*) FROM orders) as remaining_orders,
    nextval('orders_id_seq') as next_order_id;

-- Reset the sequence back to 1 (nextval advances it)
ALTER SEQUENCE orders_id_seq RESTART WITH 1;

-- =============================================================================
-- SECTION 4: RESET USER DATA (START FROM USER #1)
-- =============================================================================
-- ⚠️ WARNING: This will remove all user profiles, cart data, and preferences
-- Users will need to log in again to recreate their profiles

-- Clear all user data
TRUNCATE TABLE user_data RESTART IDENTITY CASCADE;

-- Reset the user_data sequence to start from 1
ALTER SEQUENCE user_data_id_seq RESTART WITH 1;

-- Verify user_data reset
SELECT 
    'User Data Reset Complete' as status,
    (SELECT COUNT(*) FROM user_data) as remaining_users,
    nextval('user_data_id_seq') as next_user_id;

-- Reset the sequence back to 1 (nextval advances it)
ALTER SEQUENCE user_data_id_seq RESTART WITH 1;

-- =============================================================================
-- SECTION 5: OPTIONAL - RESET PRODUCTS (UNCOMMENT TO USE)
-- =============================================================================
-- ⚠️ Uncomment below ONLY if you want to reset products too

-- -- Clear all products
-- TRUNCATE TABLE products RESTART IDENTITY CASCADE;
-- 
-- -- Reset the products sequence to start from 1
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;
-- 
-- -- Verify products reset
-- SELECT 
--     'Products Reset Complete' as status,
--     (SELECT COUNT(*) FROM products) as remaining_products,
--     nextval('products_id_seq') as next_product_id;
-- 
-- -- Reset the sequence back to 1 (nextval advances it)
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- =============================================================================
-- SECTION 6: OPTIONAL - RESET REVIEWS (UNCOMMENT TO USE)
-- =============================================================================
-- ⚠️ Uncomment below ONLY if you want to reset reviews too

-- -- Clear all reviews
-- TRUNCATE TABLE reviews RESTART IDENTITY CASCADE;
-- 
-- -- Reset the reviews sequence to start from 1
-- ALTER SEQUENCE reviews_id_seq RESTART WITH 1;
-- 
-- -- Verify reviews reset
-- SELECT 
--     'Reviews Reset Complete' as status,
--     (SELECT COUNT(*) FROM reviews) as remaining_reviews,
--     nextval('reviews_id_seq') as next_review_id;
-- 
-- -- Reset the sequence back to 1 (nextval advances it)
-- ALTER SEQUENCE reviews_id_seq RESTART WITH 1;

-- =============================================================================
-- SECTION 7: FINAL VERIFICATION
-- =============================================================================
SELECT 
    'Reset Summary' as info,
    (SELECT COUNT(*) FROM orders) as final_orders_count,
    (SELECT COUNT(*) FROM user_data) as final_users_count,
    (SELECT COUNT(*) FROM products) as final_products_count,
    (SELECT COUNT(*) FROM reviews) as final_reviews_count;

-- Show final sequence values (should all be 1)
SELECT 
    'Final Sequence Values' as info,
    currval('orders_id_seq') as orders_next_id,
    currval('user_data_id_seq') as user_data_next_id;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
SELECT 
    '✅ Reset Complete!' as message,
    'Next order will be #1' as order_info,
    'Next user will be #1' as user_info,
    'Users will need to log in again' as note;

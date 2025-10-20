-- Script to delete all existing orders and reset order ID sequence to start from #1001
-- Created: October 18, 2025
-- Purpose: Clean up testing orders and set proper order numbering

-- Step 1: Delete all existing orders
DELETE FROM orders;

-- Step 2: Reset the sequence to start from 1001
-- This ensures the next order will be #1001
ALTER SEQUENCE orders_id_seq RESTART WITH 1001;

-- Step 3: Verify the sequence is set correctly
-- You can check the current value with:
SELECT last_value FROM orders_id_seq;

-- Expected output: last_value = 1000 (because it will be incremented to 1001 on next insert)

-- Note: This script will:
-- ✅ Delete ALL orders (cannot be undone!)
-- ✅ Reset the auto-increment counter to 1001
-- ✅ The next order created will have ID = 1001


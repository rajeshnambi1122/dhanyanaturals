-- Script to backup orders before deletion (optional safety step)
-- Created: October 18, 2025
-- Purpose: Create a backup of orders before deleting them

-- Step 1: Create a backup table
CREATE TABLE IF NOT EXISTS orders_backup (
    id INTEGER,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    items JSONB,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    payment_status VARCHAR(20),
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    backup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Copy all existing orders to backup
INSERT INTO orders_backup (
    id, customer_name, customer_email, customer_phone, items, 
    total_amount, status, shipping_address, billing_address, 
    payment_method, payment_id, payment_status, tracking_number, 
    notes, created_at, updated_at
)
SELECT 
    id, customer_name, customer_email, customer_phone, items, 
    total_amount, status, shipping_address, billing_address, 
    payment_method, payment_id, payment_status, tracking_number, 
    notes, created_at, updated_at
FROM orders;

-- Step 3: Show count of backed up orders
SELECT COUNT(*) as backed_up_orders_count FROM orders_backup;

-- To restore orders later (if needed):
-- INSERT INTO orders SELECT id, customer_name, customer_email, customer_phone, items, total_amount, status, shipping_address, billing_address, payment_method, payment_id, payment_status, tracking_number, notes, created_at, updated_at FROM orders_backup;


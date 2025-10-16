-- Add payment-related fields to orders table
-- This migration adds payment tracking fields to support Zoho Payments integration

-- Add payment_id field
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

-- Add payment_status field with check constraint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Add check constraint for payment_status (drop first if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_status') THEN
        ALTER TABLE orders DROP CONSTRAINT check_payment_status;
    END IF;
END $$;
ALTER TABLE orders ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'success', 'failed', 'cancelled'));

-- Update existing status constraint to include 'confirmed'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Update existing orders to have default payment_status
UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.payment_id IS 'Zoho Payments payment ID for tracking';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, success, failed, cancelled';
COMMENT ON COLUMN orders.status IS 'Order status: pending, processing, confirmed, shipped, delivered, cancelled';

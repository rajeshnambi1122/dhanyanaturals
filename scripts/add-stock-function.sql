-- Add the missing decrement_stock function to existing database

-- Create function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_stock(product_id INTEGER, quantity INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE products 
    SET stock_quantity = GREATEST(0, stock_quantity - quantity),
        updated_at = NOW()
    WHERE id = product_id;
    
    -- The stock status will be automatically updated by the existing trigger
END;
$$ language 'plpgsql';

-- Verify the function was created
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'decrement_stock';

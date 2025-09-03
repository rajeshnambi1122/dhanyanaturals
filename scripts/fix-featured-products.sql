-- Fix featured products issue
-- First, ensure all products have correct in_stock status based on stock_quantity
UPDATE products 
SET in_stock = (stock_quantity > 0)
WHERE in_stock IS NULL OR in_stock != (stock_quantity > 0);

-- Mark the first 4 products with stock as featured
UPDATE products 
SET featured = true 
WHERE id IN (
  SELECT id FROM products 
  WHERE in_stock = true AND stock_quantity > 0
  ORDER BY rating DESC, id ASC 
  LIMIT 4
);

-- Show the results
SELECT 
  id, 
  name, 
  featured, 
  in_stock, 
  stock_quantity,
  rating
FROM products 
ORDER BY featured DESC, rating DESC;

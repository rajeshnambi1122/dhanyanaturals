-- Check if there are any products in the database
SELECT COUNT(*) as total_products FROM products;

-- Check how many products are marked as featured
SELECT COUNT(*) as featured_products FROM products WHERE featured = true;

-- Show all products and their featured status
SELECT id, name, featured, in_stock, stock_quantity FROM products ORDER BY id;

-- If no products are featured, mark the first 4 products as featured
UPDATE products 
SET featured = true 
WHERE id IN (
  SELECT id FROM products 
  WHERE in_stock = true 
  ORDER BY rating DESC, id ASC 
  LIMIT 4
);

-- Verify the update
SELECT id, name, featured, in_stock, stock_quantity FROM products WHERE featured = true;

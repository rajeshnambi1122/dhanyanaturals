-- ============================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- This adds an additional layer of security at the database level
-- ============================================

-- ============================================
-- 1. PRODUCTS TABLE
-- ============================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active products
CREATE POLICY "Anyone can view active products"
ON products
FOR SELECT
USING (status = 'active' OR status = 'out-of-stock');

-- Policy: Only admins can insert products
CREATE POLICY "Only admins can insert products"
ON products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Only admins can update products
CREATE POLICY "Only admins can update products"
ON products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Only admins can delete products
CREATE POLICY "Only admins can delete products"
ON products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 2. ORDERS TABLE
-- ============================================

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
USING (
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Authenticated users can create orders with their own email
CREATE POLICY "Users can create orders for themselves"
ON orders
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy: Only admins can update orders
CREATE POLICY "Only admins can update orders"
ON orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Only admins can delete orders
CREATE POLICY "Only admins can delete orders"
ON orders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 3. USER_DATA TABLE
-- ============================================

-- Enable RLS on user_data table
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read their own data"
ON user_data
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can update their own data (but not role field)
CREATE POLICY "Users can update their own data"
ON user_data
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  -- Prevent users from changing their own role
  AND (
    role = (SELECT role FROM user_data WHERE user_id = auth.uid())
  )
);

-- Policy: Admins can read all user data
CREATE POLICY "Admins can read all user data"
ON user_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Admins can update any user data
CREATE POLICY "Admins can update any user data"
ON user_data
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: New users can insert their own data (auto-creation)
CREATE POLICY "Users can insert their own data"
ON user_data
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND role = 'customer' -- New users are always customers by default
);

-- ============================================
-- 4. REVIEWS TABLE (if exists)
-- ============================================

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
ON reviews
FOR SELECT
USING (true);

-- Policy: Authenticated users can create reviews
CREATE POLICY "Users can create reviews"
ON reviews
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()::text
);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON reviews
FOR UPDATE
USING (user_id = auth.uid()::text);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON reviews
FOR DELETE
USING (user_id = auth.uid()::text);

-- Policy: Admins can delete any review
CREATE POLICY "Admins can delete any review"
ON reviews
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_data
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 5. STORAGE BUCKET POLICIES (product-images)
-- ============================================

-- NOTE: Storage policies are set through the Supabase Dashboard
-- Go to: Storage > product-images > Policies
-- 
-- Recommended policies:
-- 
-- 1. Anyone can view images:
--    Policy name: Public read access
--    Operation: SELECT
--    Policy: true
--
-- 2. Only admins can upload:
--    Policy name: Admin upload only
--    Operation: INSERT
--    Policy: EXISTS (
--      SELECT 1 FROM user_data
--      WHERE user_id = auth.uid()
--      AND role = 'admin'
--    )
--
-- 3. Only admins can delete:
--    Policy name: Admin delete only
--    Operation: DELETE
--    Policy: EXISTS (
--      SELECT 1 FROM user_data
--      WHERE user_id = auth.uid()
--      AND role = 'admin'
--    )

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify your RLS policies are working:

-- 1. Check which tables have RLS enabled:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. List all policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test as a specific user (replace with your user UUID):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = 'USER_UUID_HERE';
-- SELECT * FROM products; -- Should only show active products
-- SELECT * FROM orders;   -- Should only show that user's orders

-- ============================================
-- NOTES
-- ============================================
-- 
-- 1. RLS is DISABLED by default on all tables
-- 2. Once enabled, ALL queries must pass through policies
-- 3. Admin users need policies too - they don't bypass RLS automatically
-- 4. Service role key DOES bypass RLS (keep it secret!)
-- 5. Test policies thoroughly before deploying to production
-- 6. You can disable RLS temporarily: ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
--
-- ============================================
-- EMERGENCY DISABLE (if locked out)
-- ============================================
-- If you accidentally lock yourself out, run this in SQL Editor
-- using your Supabase dashboard (which uses service role):
--
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_data DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
--
-- Then fix the policies and re-enable RLS
-- ============================================


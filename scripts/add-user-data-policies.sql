-- Add Row Level Security policies for user_data table
-- Run this in Supabase SQL Editor

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_data';

-- Enable RLS on user_data table if not already enabled
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON user_data;
DROP POLICY IF EXISTS "Users can insert their own data" ON user_data;
DROP POLICY IF EXISTS "Users can update their own data" ON user_data;
DROP POLICY IF EXISTS "Service role can access all user data" ON user_data;

-- Policy 1: Users can view their own data
CREATE POLICY "Users can view their own data" ON user_data
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy 2: Users can insert their own data (for OAuth registration)
CREATE POLICY "Users can insert their own data" ON user_data
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy 3: Users can update their own data
CREATE POLICY "Users can update their own data" ON user_data
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy 4: Service role can access all user data (for admin functions)
CREATE POLICY "Service role can access all user data" ON user_data
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR auth.uid()::text = user_id
    );

-- Verify policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'user_data';

-- Test the policies with current auth context
SELECT 
    'Current auth context:' as info,
    auth.uid() as current_user_id,
    current_setting('request.jwt.claims', true)::json->>'role' as current_role;

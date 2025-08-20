-- Fix existing user_data records missing name and email
-- Run this in Supabase SQL Editor

-- First, let's see what user data we have
SELECT 
    user_id, 
    role,
    created_at
FROM user_data 
ORDER BY created_at DESC;

-- Update the first user (Rajesh Nambi)
UPDATE user_data 
SET 
    name = 'Rajesh Nambi',
    email = 'rajeshnambi2016@gmail.com'
WHERE user_id = '4b46f9fc-0cca-475d-a2ce-d3aea0d6601e';

-- Update the second user with email from auth.users
-- You'll need to check the actual auth.users table for this user's email
UPDATE user_data 
SET 
    name = COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_data.user_id),
        (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_data.user_id),
        (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = user_data.user_id AND email IS NOT NULL),
        'User'
    ),
    email = (SELECT email FROM auth.users WHERE id = user_data.user_id)
WHERE user_id = '90672233-407d-4b42-bd3c-cfff99327fda';

-- Verify the updates
SELECT 
    user_id, 
    name, 
    email, 
    role,
    updated_at
FROM user_data 
ORDER BY updated_at DESC;

# Google Authentication Setup Guide

## Overview
The application now supports Google OAuth authentication alongside traditional email/password registration and login.

## Prerequisites

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Set application type to "Web application"

### 2. OAuth Configuration
Add the following URLs to your OAuth 2.0 Client:

**Authorized JavaScript origins:**
```
http://localhost:3000
https://yourdomain.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### 3. Supabase Configuration
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Set the redirect URL: `https://your-project.supabase.co/auth/v1/callback`

## Environment Variables

Add the following to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features Implemented

### 1. Registration Page (`/register`)
- ✅ Traditional email/password registration with name field
- ✅ Google OAuth registration
- ✅ Automatic user profile creation
- ✅ Form validation with Zod
- ✅ Loading states for both methods

### 2. Login Page (`/login`)
- ✅ Traditional email/password login
- ✅ Google OAuth login
- ✅ Automatic user profile creation for existing OAuth users
- ✅ Loading states and error handling

### 3. OAuth Callback (`/auth/callback`)
- ✅ Handles Google OAuth redirect
- ✅ Creates user profile if doesn't exist
- ✅ Redirects to home page or login on error

### 4. User Management
- ✅ Simplified user creation (no role API methods)
- ✅ Default role set to 'customer'
- ✅ Admin roles set manually in database
- ✅ Automatic profile creation for OAuth users

## Database Schema

The `user_data` table includes:
```sql
CREATE TABLE user_data (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255),           -- User's full name
    email VARCHAR(255),          -- User's email
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- Role (admin/customer)
    cart_items JSONB DEFAULT '[]'::jsonb,
    wishlist_items JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

## Authentication Flow

### Traditional Registration/Login
1. User fills out form (name, email, password)
2. Supabase Auth creates user account
3. App creates user profile in `user_data` table
4. User redirected to home page

### Google OAuth Flow
1. User clicks "Sign up/in with Google"
2. Redirected to Google OAuth consent screen
3. Google redirects back to `/auth/callback`
4. App checks if user profile exists
5. If not, creates user profile with Google data
6. User redirected to home page

## Admin Role Management

### Setting Admin Roles
Since admin roles are set manually in the database:

```sql
-- Make a user admin
UPDATE user_data 
SET role = 'admin' 
WHERE email = 'admin@example.com';

-- Check user roles
SELECT user_id, name, email, role 
FROM user_data 
WHERE role = 'admin';
```

### Admin Access
- Admin page checks user role from `user_data` table
- Only users with `role = 'admin'` can access admin features
- Role changes require direct database updates

## Security Considerations

1. **OAuth Security**:
   - Validate redirect URIs in Google Console
   - Use HTTPS in production
   - Keep OAuth secrets secure

2. **Database Security**:
   - Implement Row Level Security (RLS) policies
   - Validate user permissions on server side
   - Use Supabase's built-in auth checks

3. **Role Management**:
   - Admin roles only changed via direct database access
   - No API endpoints for role modification
   - Regular audit of admin users

## Testing

### Local Development
1. Set up Google OAuth with localhost URLs
2. Test both registration and login flows
3. Verify user profile creation
4. Test admin access with manually set admin role

### Production Deployment
1. Update OAuth URLs to production domain
2. Test OAuth flow end-to-end
3. Verify user data persistence
4. Test admin functionality

## Troubleshooting

### Common Issues

1. **OAuth redirect errors**:
   - Check redirect URIs in Google Console
   - Verify Supabase provider configuration
   - Check environment variables

2. **User profile not created**:
   - Check callback page functionality
   - Verify user_data table permissions
   - Check browser network tab for errors

3. **Admin access denied**:
   - Verify user role in database
   - Check admin page authentication logic
   - Ensure user is properly authenticated

### Debug Steps
1. Check browser console for errors
2. Verify Supabase Auth dashboard for user creation
3. Check user_data table for profile creation
4. Test with different browsers/incognito mode

## Future Enhancements

Potential improvements:
- Add more OAuth providers (GitHub, Facebook)
- Implement email verification flow
- Add password reset functionality
- Create admin user management interface
- Add user profile editing features
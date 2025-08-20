# Admin Authentication Setup

## Overview
The admin page now has role-based access control. Only users with the "admin" role can access the admin dashboard.

## Database Setup

### 1. Create Tables
Run the SQL scripts to create the necessary tables:

```bash
# Create tables
psql -d your_database -f scripts/create-tables.sql

# Insert seed data (includes admin user)
psql -d your_database -f scripts/seed-data.sql
```

### 2. Database Schema
The system uses the existing `user_data` table with added role functionality:

```sql
CREATE TABLE user_data (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    cart_items JSONB DEFAULT '[]'::jsonb,
    wishlist_items JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

## Authentication Flow

### 1. Admin Access
- Users must be authenticated through Supabase Auth
- User profile must have `role = "admin"`
- Non-admin users see an "Access Denied" message

### 2. User Management
The system includes services for:
- Getting current user profile
- Checking admin status
- Creating user profiles
- Managing user roles

## Default Admin User

The seed data creates a default admin user:
- **Email**: `admin@dhanyanaturals.com`
- **Role**: `admin`
- **ID**: `00000000-0000-0000-0000-000000000001`

> **Note**: In production, you should set up proper authentication for this user through Supabase Auth.

## Admin Page Features

### Access Control
- Authentication check on page load
- Role verification
- Automatic redirect for unauthorized users
- Loading states during authentication

### UI Elements
- User profile display in header
- Sign-out functionality
- Admin role indicator
- Responsive design

## API Services

### `authService`
Located in `lib/supabase.ts`:

```typescript
// Check if user is admin
const isAdmin = await authService.isAdmin()

// Get current user profile
const user = await authService.getUserProfile()

// Sign in
await authService.signIn(email, password)

// Sign out
await authService.signOut()

// Create user profile
await authService.createUserProfile(userId, name, email, role)
```

## Security Considerations

1. **Database Security**: Ensure row-level security (RLS) policies are set up in Supabase
2. **Role Validation**: Always verify user roles on both client and server side
3. **Authentication**: Use secure authentication methods
4. **Session Management**: Implement proper session timeout and refresh

## Troubleshooting

### Common Issues

1. **Access Denied**: 
   - Check if user exists in `users` table
   - Verify user role is set to "admin"
   - Ensure user is properly authenticated

2. **Authentication Errors**:
   - Check Supabase configuration
   - Verify environment variables
   - Check network connectivity

3. **Database Errors**:
   - Ensure tables are created
   - Check database permissions
   - Verify Supabase connection

## Development

### Testing Admin Access
1. Create a test admin user in the database
2. Set up authentication for that user
3. Test access to `/admin` page

### Adding New Roles
To add new roles, update:
1. Database check constraint
2. TypeScript types
3. Role checking logic

## Production Deployment

1. Set up proper environment variables
2. Configure Supabase authentication
3. Set up RLS policies
4. Create admin users through proper channels
5. Test authentication flow thoroughly
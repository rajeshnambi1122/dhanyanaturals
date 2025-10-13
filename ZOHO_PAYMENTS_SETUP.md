# Zoho Payments Integration Guide

## Environment Variables Setup

Create a `.env.local` file in your project root with:

```env
# Zoho Payments Configuration
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_ACCESS_TOKEN=your_access_token_here
ZOHO_ACCOUNT_ID=your_account_id_here

# Widget Configuration (for client-side)
NEXT_PUBLIC_ZOHO_ACCOUNT_ID=your_account_id_here
NEXT_PUBLIC_ZOHO_API_KEY=your_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## OAuth2 Setup Steps

### 1. Create Zoho OAuth2 App
1. Go to https://api-console.zoho.in/
2. Click "Add Client" → "Server-based Applications"
3. Configure:
   - Application Name: "Dhanya Naturals Payment Integration"
   - Homepage URL: `https://yourdomain.com`
   - Authorized Redirect URIs: `https://yourdomain.com/api/auth/zoho/callback` (Note: Different from both Supabase auth/callback and payment/callback)

### 2. Required Scopes
Ensure your OAuth2 app has these scopes:
- `ZohoPay.payments.CREATE` - Create payment links
- `ZohoPay.payments.READ` - Read payment details
- `ZohoPay.payments.UPDATE` - Update payment links

### 3. OAuth2 Flow Implementation

The application now implements a complete OAuth2 flow:

1. **Initial Authentication**: When a user attempts to make a payment without authentication:
   - The payment API returns a 401 status with an auth URL
   - User is redirected to Zoho's consent screen
   
2. **Authorization Callback**: After user approves on Zoho:
   - Zoho redirects to `/api/auth/zoho/callback` with an authorization code
   - The server exchanges the code for access and refresh tokens
   - Tokens are stored as secure HTTP-only cookies
   - User is redirected back to `/payment/callback` with success status

3. **Automatic Retry**: If user was in checkout:
   - The pending order is preserved in sessionStorage
   - After successful authentication, checkout automatically retries the payment

4. **Token Management**:
   - Access tokens are automatically refreshed when expired
   - Tokens are stored securely in HTTP-only cookies
   - No manual token generation needed

5. **Checkout Widget Integration**:
   - Embedded payment widget for seamless user experience
   - No redirects - payments processed directly on your website
   - Automatic session creation and token validation
   - Real-time payment status updates

## Current Implementation Status

✅ **Completed:**
- Fixed API endpoint (payments.zoho.in)
- Updated to Payment Links API
- Fixed request format
- Updated to OAuth2 authentication
- Made return_url optional for development
- **Separated callback routes**: `/auth/callback` for Supabase, `/payment/callback` for payment results, `/api/auth/zoho/callback` for OAuth
- **Implemented complete OAuth2 flow**: Automatic code exchange, token storage, and refresh
- **Seamless authentication**: Users are automatically redirected to Zoho consent when needed
- **Token management**: Secure HTTP-only cookie storage with automatic refresh
- **Checkout Widget**: Embedded payment widget for better user experience
- **Hybrid approach**: OAuth for session management, API key for widget initialization

## Testing the Integration

1. Set up your environment variables
2. Start your development server: `npm run dev`
3. Go to checkout page and test online payment
4. Check console logs for any errors

## Production Considerations

1. **HTTPS Required**: Ensure your production domain uses HTTPS
2. **Return URL**: Set up proper return URLs for production
3. **Webhook Handling**: Implement webhook endpoint for payment status updates
4. **Error Handling**: Add proper error handling and user feedback

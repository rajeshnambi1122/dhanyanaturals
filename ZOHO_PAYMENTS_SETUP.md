# Zoho Payments Integration Guide

## Environment Variables Setup

Create a `.env.local` file in your project root with:

```env
# Zoho Payments Configuration
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_ACCESS_TOKEN=your_access_token_here
ZOHO_ACCOUNT_ID=your_account_id_here

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
   - Authorized Redirect URIs: `https://yourdomain.com/payment/callback` (Note: Different from Supabase auth/callback)

### 2. Required Scopes
Ensure your OAuth2 app has these scopes:
- `ZohoPay.payments.CREATE` - Create payment links
- `ZohoPay.payments.READ` - Read payment details
- `ZohoPay.payments.UPDATE` - Update payment links

### 3. Generate Access Token
You can generate an access token using:
- Zoho API Console (for testing)
- OAuth2 flow implementation (for production)

## Current Implementation Status

✅ **Completed:**
- Fixed API endpoint (payments.zoho.in)
- Updated to Payment Links API
- Fixed request format
- Updated to OAuth2 authentication
- Made return_url optional for development
- **Separated callback routes**: `/auth/callback` for Supabase, `/payment/callback` for Zoho Payments

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

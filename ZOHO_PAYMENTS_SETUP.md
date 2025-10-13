# Zoho Payments Integration Guide

## Environment Variables Setup

Create a `.env.local` file in your project root with:

```env
# Zoho Payments Configuration (Required)
ZOHO_ACCOUNT_ID=your_account_id_here

# OAuth Configuration (Required for server-side API calls)
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here

# Production Tokens (Get these from your OAuth flow)
ZOHO_ACCESS_TOKEN=1005.your_access_token_here
ZOHO_REFRESH_TOKEN=1000.your_refresh_token_here

# Widget Configuration (for client-side widget)
NEXT_PUBLIC_ZOHO_ACCOUNT_ID=your_account_id_here
NEXT_PUBLIC_ZOHO_API_KEY=your_api_key_here

# App Configuration (IMPORTANT: Set this to your actual domain)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Setup Steps

### 1. OAuth2 Setup (Required for Server-side API calls)
1. Go to https://api-console.zoho.in/
2. Click "Add Client" → "Server-based Applications"
3. Configure:
   - Application Name: "Dhanya Naturals Payment Integration"
   - Homepage URL: `https://yourdomain.com`
   - Authorized Redirect URIs: `https://yourdomain.com/api/auth/zoho/callback`
4. Note down your Client ID and Client Secret
5. Add them to your environment variables

### 2. Get API Key (For Widget Only)
1. Go to Zoho Payments > Settings > Developer Space
2. Generate an API Key
3. Note down your Account ID and API Key
4. Add both to your environment variables

### 3. Required Scopes (OAuth2 Only)
If using OAuth2, ensure these scopes:
- `ZohoPay.payments.CREATE` - Create payment links
- `ZohoPay.payments.READ` - Read payment details
- `ZohoPay.payments.UPDATE` - Update payment links

### 4. Get Production Tokens
To get tokens for production:

1. **Run OAuth flow locally** (on your development machine)
2. **Open DevTools** → Application → Cookies → localhost:3000
3. **Find these cookies**:
   - `zoho_access_token` - Copy the value
   - `zoho_refresh_token` - Copy the value
4. **Add to production environment**:
   ```env
   ZOHO_ACCESS_TOKEN=1005.your_actual_access_token_here
   ZOHO_REFRESH_TOKEN=1000.your_actual_refresh_token_here
   ```

**Note**: Access tokens expire in 1 hour, but refresh tokens can generate new access tokens automatically.

## How It Actually Works

### For Customers (Simple Payment Flow):
1. **Customer clicks "Pay Now"** in checkout
2. **Payment widget appears** with payment options (cards, UPI, net banking)
3. **Customer enters payment details** directly
4. **Payment is processed** immediately
5. **No Zoho login required** for customers

### For You (Merchant Setup):
1. **Get API Key** from Zoho Payments settings
2. **Configure environment variables** with your API key and account ID
3. **That's it!** No OAuth needed for basic payments

### Widget Integration:
- **Embedded payment widget** for seamless user experience
- **No redirects** - payments processed directly on your website
- **Real-time payment status** updates
- **Multiple payment methods** supported (cards, UPI, net banking)

## Current Implementation Status

✅ **Completed:**
- Fixed API endpoint (payments.zoho.in)
- Updated to Payment Links API
- Fixed request format
- Updated to OAuth2 authentication
- Made return_url optional for development
- **OAuth2 authentication**: Proper server-side authentication with access tokens
- **Customer-friendly flow**: No OAuth redirects for customers
- **Embedded payment widget**: Payments processed directly on your website
- **Multiple payment methods**: Cards, UPI, net banking support
- **Real-time processing**: Immediate payment status updates
- **Secure implementation**: OAuth for server-side, API keys for widget

## Testing the Integration

1. Set up your environment variables
2. Start your development server: `npm run dev`
3. Go to checkout page and test online payment
4. Check console logs for any errors

## Troubleshooting

### OAuth Redirect URI Issues
If you see `redirect_uri=undefined/api/auth/zoho/callback` in the OAuth URL:

1. **Check Environment Variables**: Ensure `NEXT_PUBLIC_APP_URL` is set in your `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **For Development**: Use your local development URL:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **For Production**: Use your actual production domain:
   ```env
   NEXT_PUBLIC_APP_URL=https://www.dhanyanaturals.in
   ```

4. **Restart Development Server**: After updating environment variables, restart your Next.js server:
   ```bash
   npm run dev
   ```

### Widget Not Loading
If the payment widget doesn't appear:

1. Check browser console for JavaScript errors
2. Verify `NEXT_PUBLIC_ZOHO_ACCOUNT_ID` and `NEXT_PUBLIC_ZOHO_API_KEY` are set
3. Ensure the Zoho Payments script is loading (check Network tab in browser dev tools)

## Production Considerations

1. **HTTPS Required**: Ensure your production domain uses HTTPS
2. **Return URL**: Set up proper return URLs for production
3. **Webhook Handling**: Implement webhook endpoint for payment status updates
4. **Error Handling**: Add proper error handling and user feedback

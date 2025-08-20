# Google OAuth Branding Setup for Dhanya Naturals

## Current Issue
The Google sign-in shows "ccklbyexywvclddrqjwr.supabase.co" instead of "Dhanya Naturals" with your logo.

## 🚀 Development Setup (No Domain Required)

**Good news!** You can fix the branding right now without a production domain. The app name and logo will show correctly even in development.

## 🎯 **Quick Setup for Development (Do This Now!)**

### Immediate Steps (No Domain Required):
1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/) → Select "dhanyanaturals" project
2. **Navigate to**: APIs & Services → OAuth consent screen
3. **Set App name**: `Dhanya Naturals`
4. **Upload your logo**: 120x120px image of Dhanya Naturals logo
5. **User support email**: `rajeshnambi2016@gmail.com`
6. **Leave App domain empty** (you'll add it when you buy domain)
7. **Add test users**: Add `rajeshnambi2016@gmail.com` and any other emails for testing
8. **Save settings**

### Result After Setup:
- ✅ Google sign-in will show "Dhanya Naturals" instead of Supabase URL
- ✅ Your logo will appear on the sign-in screen
- ✅ Professional branding even in development
- ✅ Works perfectly with localhost testing

## Solution: Configure OAuth Consent Screen

### Step 1: Access Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select project: **dhanyanaturals**
3. Navigate to **APIs & Services** → **OAuth consent screen**

### Step 2: Configure App Information

#### For Development (No Production Domain Yet):

| Field | Value |
|-------|-------|
| **App name** | `Dhanya Naturals` |
| **User support email** | `rajeshnambi2016@gmail.com` |
| **App logo** | Upload Dhanya Naturals logo (120x120px) |
| **App domain** | Leave empty for now |
| **Terms of service** | Leave empty for now |
| **Privacy policy** | Leave empty for now |

#### When You Get Production Domain:

| Field | Value |
|-------|-------|
| **App name** | `Dhanya Naturals` |
| **User support email** | `rajeshnambi2016@gmail.com` |
| **App logo** | Upload Dhanya Naturals logo (120x120px) |
| **App domain** | `https://yourdomain.com` |
| **Terms of service** | `https://yourdomain.com/terms` (optional) |
| **Privacy policy** | `https://yourdomain.com/privacy` (optional) |

### Step 3: Configure Authorized Domains

#### For Development Only:
```
localhost               # For development testing
```

#### When You Get Production Domain:
```
yourdomain.com          # Your production domain
localhost               # Keep for development testing
```

### Step 4: Configure Scopes

Add these OAuth scopes:
```
- ../auth/userinfo.email
- ../auth/userinfo.profile  
- openid
```

### Step 5: Test Users (Development)

During development, add test email addresses:
```
- your-email@gmail.com
- test-user@gmail.com
```

## Logo Requirements

### Image Specifications:
- **Size**: 120x120 pixels
- **Format**: PNG or JPG
- **Background**: Transparent or white
- **Content**: Dhanya Naturals logo/brand

### Logo Design Tips:
- Keep it simple and recognizable
- Ensure good contrast
- Use your brand colors
- Make text readable at small size

## Before and After

### ❌ Before (Current Issue):
```
Sign in to ccklbyexywvclddrqjwr.supabase.co
[No logo]
```

### ✅ After (Fixed):
```
Sign in to Dhanya Naturals
[Your logo]
```

## Production Deployment

### For Production Domain:
1. **Update OAuth Consent Screen**:
   - App domain: `https://dhanyanaturals.com`
   - Authorized domains: `dhanyanaturals.com`

2. **Update OAuth Credentials**:
   - Authorized JavaScript origins: `https://dhanyanaturals.com`
   - Authorized redirect URIs: `https://ccklbyexywvclddrqjwr.supabase.co/auth/v1/callback`

3. **Update Supabase Settings**:
   - Site URL: `https://dhanyanaturals.com`
   - Redirect URLs: `https://dhanyanaturals.com/**`

## Verification Process

### For Public Use:
If you want public users (not just test users):
1. **Submit for verification** in Google Cloud Console
2. **Provide privacy policy and terms of service**
3. **Wait for Google review** (can take days/weeks)

### For Development/Limited Use:
- Keep as "Testing" mode
- Add specific test user emails
- No verification needed

## 🔧 Fix Redirect URL Issue

You mentioned URL 1 (`http://localhost:3000/auth/callback`) is not working but URL 2 (Supabase URL) is working. Here's the fix:

### Update Google Cloud Console:
1. **Remove**: `http://localhost:3000/auth/callback`
2. **Keep only**: `https://ccklbyexywvclddrqjwr.supabase.co/auth/v1/callback`

### The OAuth Flow:
```
User clicks "Sign in with Google" 
→ Google OAuth 
→ Supabase handles callback 
→ Redirects to your app homepage
```

### For JavaScript Origins:
Keep these in Google Console:
- `http://localhost:3000` (for development)
- Your future production domain

## Testing Steps

1. **Save OAuth consent screen settings**
2. **Remove the localhost callback URL from Google Console**
3. **Clear browser cache/cookies**
4. **Test Google sign-in flow**
5. **Verify branding appears correctly**

## Troubleshooting

### Common Issues:

1. **Logo not showing**:
   - Check image size (120x120px)
   - Verify file format (PNG/JPG)
   - Clear browser cache

2. **Still showing Supabase URL**:
   - Save consent screen settings
   - Wait 10-15 minutes for changes
   - Clear browser cache

3. **"App domain" errors**:
   - Verify domain ownership
   - Check DNS settings
   - Ensure HTTPS in production

## Security Notes

1. **Never share client secrets publicly**
2. **Use environment variables for secrets**
3. **Regenerate credentials if exposed**
4. **Limit authorized domains to your actual domains**

## Next Steps

1. ✅ Configure OAuth consent screen
2. ✅ Upload Dhanya Naturals logo
3. ✅ Test the sign-in flow
4. ✅ Deploy to production with proper domain
5. ✅ Submit for verification (if needed for public use)
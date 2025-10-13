import { NextRequest, NextResponse } from 'next/server';

const ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/payment/callback?error=${encodeURIComponent(error)}`, process.env.NEXT_PUBLIC_APP_URL!)
      );
    }
    
    // Validate authorization code
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/payment/callback?error=no_code', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }
    
    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      code: code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/zoho/callback`
    });
    
    console.log('Exchanging code for token...');
    
    const tokenResponse = await fetch(ZOHO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL(`/payment/callback?error=token_exchange_failed`, process.env.NEXT_PUBLIC_APP_URL!)
      );
    }
    
    // Store the tokens (you might want to store these in a database for production)
    // For now, we'll pass them as query parameters to the client
    const { access_token, refresh_token, expires_in } = tokenData;
    
    console.log('Token exchange successful');
    
    // Redirect to client-side callback with success status
    // In production, you'd store these tokens securely server-side
    const callbackUrl = new URL('/payment/callback', process.env.NEXT_PUBLIC_APP_URL!);
    callbackUrl.searchParams.set('status', 'oauth_success');
    callbackUrl.searchParams.set('auth_completed', 'true');
    
    // Create a response with the redirect
    const response = NextResponse.redirect(callbackUrl);
    
    // Set tokens as HTTP-only cookies for security
    response.cookies.set('zoho_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in || 3600, // Use expires_in from Zoho or default to 1 hour
    });
    
    if (refresh_token) {
      response.cookies.set('zoho_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
    
    return response;
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/payment/callback?error=server_error', process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}

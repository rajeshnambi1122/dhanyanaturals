import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        new URL(`/admin?error=${encodeURIComponent(error)}`, baseUrl)
      );
    }
    
    // Validate authorization code
    if (!code) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        new URL('/admin?error=no_code', baseUrl)
      );
    }
    
    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      code: code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/zoho/callback`
    });
    
    
    const tokenResponse = await fetch(ZOHO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        new URL(`/admin?error=token_exchange_failed`, baseUrl)
      );
    }
    
    // Store the tokens (you might want to store these in a database for production)
    // For now, we'll pass them as query parameters to the client
    const { access_token, refresh_token, expires_in } = tokenData;
    
    // Redirect to admin page with success status
    // In production, you'd store these tokens securely server-side
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = new URL('/admin', baseUrl);
    callbackUrl.searchParams.set('status', 'oauth_success');
    callbackUrl.searchParams.set('auth_completed', 'true');
    
    // Create a response with the redirect
    const response = NextResponse.redirect(callbackUrl);
    
    // Set access token as HTTP-only cookie (refresh token should be stored server-side only)
    response.cookies.set('zoho_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in || 3600, // Use expires_in from Zoho or default to 1 hour
    });
    
    // Refresh token should be stored server-side only (environment variables or database)
    // Do NOT store refresh token in client-side cookies for security
    
    return response;
    
  } catch (error) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      new URL('/admin?error=server_error', baseUrl)
    );
  }
}

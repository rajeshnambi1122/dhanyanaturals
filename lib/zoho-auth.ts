import { cookies } from 'next/headers';

const ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';
const ZOHO_AUTH_URL = 'https://accounts.zoho.in/oauth/v2/auth';

export interface ZohoTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Get the authorization URL for Zoho OAuth
 */
export function getZohoAuthUrl(): string {
  // Get the base URL with fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ZOHO_CLIENT_ID!,
    scope: 'ZohoPay.payments.CREATE,ZohoPay.payments.READ,ZohoPay.payments.UPDATE',
    redirect_uri: `${baseUrl}/api/auth/zoho/callback`,
    access_type: 'offline', // To get refresh token
    prompt: 'consent', // Force consent to get refresh token
  });
  
  return `${ZOHO_AUTH_URL}?${params.toString()}`;
}

/**
 * Get access token from cookies or environment variable
 */
export async function getAccessToken(): Promise<string | null> {
  // First try to get from cookies (for development)
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('zoho_access_token');
  
  if (accessToken) {
    return accessToken.value;
  }
  
  // Fallback to environment variable (for production)
  if (process.env.ZOHO_ACCESS_TOKEN) {
    return process.env.ZOHO_ACCESS_TOKEN;
  }
  
  // Try to refresh token if we have a refresh token
  const refreshToken = cookieStore.get('zoho_refresh_token');
  if (refreshToken) {
    const newTokens = await refreshAccessToken(refreshToken.value);
    if (newTokens) {
      return newTokens.access_token;
    }
  }
  
  // Try environment variable refresh token for production
  if (process.env.ZOHO_REFRESH_TOKEN) {
    console.log('Using environment variable refresh token');
    const newTokens = await refreshAccessToken(process.env.ZOHO_REFRESH_TOKEN);
    if (newTokens) {
      return newTokens.access_token;
    }
  }
  
  return null;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<ZohoTokens | null> {
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      refresh_token: refreshToken,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/zoho/callback`
    });
    
    console.log('Refreshing access token...');
    
    const response = await fetch(ZOHO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      console.error('Failed to refresh token:', await response.text());
      return null;
    }
    
    const tokens = await response.json();
    console.log('Token refresh successful');
    
    // Update cookies with new tokens
    const cookieStore = await cookies();
    cookieStore.set('zoho_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
    });
    
    // Update refresh token if provided
    if (tokens.refresh_token) {
      cookieStore.set('zoho_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
    
    return tokens;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Clear Zoho tokens from cookies
 */
export async function clearZohoTokens() {
  const cookieStore = await cookies();
  cookieStore.delete('zoho_access_token');
  cookieStore.delete('zoho_refresh_token');
}

/**
 * Check if user is authenticated with Zoho
 */
export async function isZohoAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

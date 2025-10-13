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
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ZOHO_CLIENT_ID!,
    scope: 'ZohoPay.payments.CREATE,ZohoPay.payments.READ,ZohoPay.payments.UPDATE',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/zoho/callback`,
    access_type: 'offline', // To get refresh token
    prompt: 'consent', // Force consent to get refresh token
  });
  
  return `${ZOHO_AUTH_URL}?${params.toString()}`;
}

/**
 * Get access token from cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('zoho_access_token');
  
  if (accessToken) {
    return accessToken.value;
  }
  
  // Try to refresh token if we have a refresh token
  const refreshToken = cookieStore.get('zoho_refresh_token');
  if (refreshToken) {
    const newTokens = await refreshAccessToken(refreshToken.value);
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
    });
    
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
    
    // Update cookies with new tokens
    const cookieStore = await cookies();
    cookieStore.set('zoho_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
    });
    
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

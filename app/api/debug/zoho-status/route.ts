import { NextResponse } from 'next/server';
import { getTokenStatus, getAccessToken } from '@/lib/zoho';

/**
 * Debug endpoint to check Zoho token configuration
 * This helps identify authentication issues
 */
export async function GET() {
  try {
    // Get token status
    const status = await getTokenStatus();
    
    // Try to get an access token
    let tokenTest = 'Not attempted';
    try {
      const token = await getAccessToken();
      tokenTest = token ? '✅ Token retrieved successfully' : '❌ Failed to retrieve token';
    } catch (error) {
      tokenTest = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Check environment variables (without exposing values)
    const envCheck = {
      ZOHO_ACCOUNT_ID: !!process.env.ZOHO_ACCOUNT_ID,
      ZOHO_CLIENT_ID: !!process.env.ZOHO_CLIENT_ID,
      ZOHO_CLIENT_SECRET: !!process.env.ZOHO_CLIENT_SECRET,
      ZOHO_REFRESH_TOKEN: !!process.env.ZOHO_REFRESH_TOKEN,
      ZOHO_ACCESS_TOKEN: !!process.env.ZOHO_ACCESS_TOKEN,
      NEXT_PUBLIC_ZOHO_ACCOUNT_ID: !!process.env.NEXT_PUBLIC_ZOHO_ACCOUNT_ID,
      NEXT_PUBLIC_ZOHO_API_KEY: !!process.env.NEXT_PUBLIC_ZOHO_API_KEY,
    };

    return NextResponse.json({
      status: 'success',
      tokenStatus: status,
      tokenTest,
      environmentVariables: envCheck,
      recommendations: getRecommendations(envCheck, status),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getRecommendations(envCheck: Record<string, boolean>, status: any): string[] {
  const recommendations: string[] = [];

  // Check critical environment variables
  if (!envCheck.ZOHO_ACCOUNT_ID) {
    recommendations.push('❌ ZOHO_ACCOUNT_ID is missing - required for all Zoho API calls');
  }

  if (!envCheck.ZOHO_REFRESH_TOKEN && !envCheck.ZOHO_ACCESS_TOKEN) {
    recommendations.push('❌ No tokens found - set ZOHO_REFRESH_TOKEN for automatic token refresh');
  }

  if (!envCheck.ZOHO_REFRESH_TOKEN && envCheck.ZOHO_ACCESS_TOKEN) {
    recommendations.push('⚠️  Only ZOHO_ACCESS_TOKEN is set - this will expire. Add ZOHO_REFRESH_TOKEN for automatic renewal');
  }

  if (!envCheck.ZOHO_CLIENT_ID || !envCheck.ZOHO_CLIENT_SECRET) {
    recommendations.push('⚠️  ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET missing - required for token refresh');
  }

  if (!envCheck.NEXT_PUBLIC_ZOHO_ACCOUNT_ID) {
    recommendations.push('⚠️  NEXT_PUBLIC_ZOHO_ACCOUNT_ID missing - required for client-side payment widget');
  }

  if (!envCheck.NEXT_PUBLIC_ZOHO_API_KEY) {
    recommendations.push('⚠️  NEXT_PUBLIC_ZOHO_API_KEY missing - required for client-side payment widget');
  }

  if (envCheck.ZOHO_REFRESH_TOKEN && envCheck.ZOHO_CLIENT_ID && envCheck.ZOHO_CLIENT_SECRET) {
    recommendations.push('✅ All required tokens configured for automatic refresh');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Configuration looks good!');
  }

  return recommendations;
}


/**
 * Internal API Authentication
 * Used to protect internal-only endpoints like email sending
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify internal API key for server-to-server calls
 * This prevents external abuse of email and notification endpoints
 */
export function verifyInternalApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const internalApiKey = process.env.INTERNAL_API_SECRET
  
  if (!internalApiKey) {
    console.error('[API Auth] INTERNAL_API_SECRET not configured')
    return false
  }
  
  if (!apiKey) {
    console.warn('[API Auth] Missing x-api-key header')
    return false
  }
  
  if (apiKey !== internalApiKey) {
    console.warn('[API Auth] Invalid API key provided')
    return false
  }
  
  return true
}

/**
 * Middleware to protect internal API endpoints
 * Returns 401 Unauthorized if authentication fails
 */
export function requireInternalAuth(request: NextRequest): NextResponse | null {
  if (!verifyInternalApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing API key' },
      { status: 401 }
    )
  }
  return null // Auth successful, continue
}

/**
 * Helper to create authenticated fetch requests for internal APIs
 */
export function createInternalApiHeaders(): HeadersInit {
  const apiKey = process.env.INTERNAL_API_SECRET
  
  if (!apiKey) {
    console.error('[API Auth] INTERNAL_API_SECRET not configured')
    throw new Error('Internal API key not configured')
  }
  
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  }
}


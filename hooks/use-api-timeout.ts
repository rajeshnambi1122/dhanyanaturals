"use client";

import { useEffect, useRef } from 'react';

/**
 * Hook to monitor API calls and auto-refresh page if timeout exceeds
 * @param isLoading - Loading state from API call
 * @param timeoutSeconds - Timeout in seconds (default: 5)
 * @param onTimeout - Optional callback before refresh
 */
export function useApiTimeout(
  isLoading: boolean,
  timeoutSeconds: number = 5,
  onTimeout?: () => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If loading starts, set a timeout
    if (isLoading) {
      console.log(`⏱️ API timeout monitor started (${timeoutSeconds}s)`);
      
      timeoutRef.current = setTimeout(() => {
        console.warn(`⚠️ API call exceeded ${timeoutSeconds} seconds - refreshing page...`);
        
        // Call optional callback
        if (onTimeout) {
          onTimeout();
        }
        
        // Refresh the page
        window.location.reload();
      }, timeoutSeconds * 1000);
    }

    // Cleanup on unmount or when loading stops
    return () => {
      if (timeoutRef.current) {
        console.log('✅ API call completed - timeout cleared');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, timeoutSeconds, onTimeout]);
}

/**
 * Wrapper for fetch with automatic timeout and page refresh
 * @param url - API endpoint
 * @param options - Fetch options
 * @param timeoutSeconds - Timeout in seconds (default: 5)
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutSeconds: number = 5
): Promise<Response> {
  const controller = new AbortController();
  const { signal } = controller;

  // Set timeout to abort and refresh
  const timeoutId = setTimeout(() => {
    console.warn(`⚠️ API call to ${url} exceeded ${timeoutSeconds} seconds - refreshing page...`);
    controller.abort();
    
    // Refresh page after a short delay to show error
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, timeoutSeconds * 1000);

  try {
    console.log(`⏱️ Starting API call to ${url} with ${timeoutSeconds}s timeout`);
    
    const response = await fetch(url, {
      ...options,
      signal,
    });
    
    console.log(`✅ API call to ${url} completed successfully`);
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout - page will refresh`);
    }
    
    throw error;
  }
}


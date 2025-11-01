import type { NextRequest } from 'next/server';

// Whitelist of allowed origins for CORS
// Add domains where your feedback widget will be embedded
const ALLOWED_ORIGINS: string[] = [
  // Production domains (add your customer websites here)
  // 'https://yourdomain.com',
  // 'https://www.yourdomain.com',
  // 'https://customer-site.com',
];

// Development origins
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push(
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  );
}

// Allow your own Vercel deployment
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (appUrl) {
  ALLOWED_ORIGINS.push(appUrl);
}

/**
 * Get CORS headers based on request origin
 * Returns appropriate headers for whitelisted origins
 *
 * Set CORS_ALLOW_ALL=true in environment variables to allow all origins (less secure)
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || '';

  // Check if we should allow all origins (useful for public widgets)
  const allowAll = process.env.CORS_ALLOW_ALL === 'true';

  if (allowAll) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }

  // Use whitelist
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true', // Allows cookies/credentials with whitelisted origins
  };
}

import type { NextRequest } from 'next/server';

// Whitelist of allowed origins for CORS
// Supports wildcards like '*.example.com' for subdomains
const ALLOWED_ORIGINS: string[] = [
  // Production domains (add your customer websites here)
  // Exact domains:
  // 'https://yourdomain.com',
  // 'https://www.yourdomain.com',

  // Wildcard patterns (all subdomains):
  'https://*.getspendless.com', // Matches app.getspendless.com, api.getspendless.com, etc.
  // 'https://*.vercel.app',      // All Vercel preview deployments
  // '*.customer-sites.io',       // All customer subdomains
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
 * Check if origin matches a wildcard pattern
 * Supports patterns like '*.example.com' or 'https://*.example.com'
 */
function matchesPattern(origin: string, pattern: string): boolean {
  // If no wildcard, do exact match
  if (!pattern.includes('*')) {
    return origin === pattern;
  }

  // Convert pattern to regex
  // Escape special regex chars except *, then replace * with .*
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*'); // Replace * with .*

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(origin);
}

/**
 * Check if origin is allowed (exact match or pattern match)
 */
function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.some((pattern) => matchesPattern(origin, pattern));
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

  // Use whitelist with pattern matching
  const isAllowed = isOriginAllowed(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true', // Allows cookies/credentials with whitelisted origins
  };
}

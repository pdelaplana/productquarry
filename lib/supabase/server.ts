import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return { supabaseUrl, supabaseServiceKey, supabaseAnonKey };
}

// Server-side client with service role key (bypasses RLS)
// Use lazy initialization to avoid module-level crashes
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const { supabaseUrl, supabaseServiceKey } = getEnvVars();
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabaseAdmin;
}

// Server-side client with user auth (respects RLS)
export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Handle error when cookies can't be set (e.g., in middleware)
          console.error('Error setting cookies:', error);
        }
      },
    },
  });
}

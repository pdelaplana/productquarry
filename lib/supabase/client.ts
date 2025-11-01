import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Lazy initialization
let _supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!_supabase) {
    const { supabaseUrl, supabaseAnonKey } = getEnvVars();
    _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Create a Supabase client for the browser that handles cookies
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});

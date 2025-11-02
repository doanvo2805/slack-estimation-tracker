import { createClient } from '@supabase/supabase-js';

// Create a function that returns the client with runtime environment variables
// This ensures we get the values from next.config.ts env option
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // Custom fetch for development to handle self-signed certificates
  // This is needed when behind corporate proxies or VPNs that use SSL inspection
  const customFetch: typeof fetch = (input, init) => {
    // For Node.js runtime (server-side), disable TLS verification in development
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      // Set Node.js to accept self-signed certificates (development only)
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    return fetch(input, init);
  };

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: customFetch
    }
  });
}

// Create a singleton instance but initialize it lazily
let _supabase: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = getSupabaseClient();
    }
    return (_supabase as any)[prop];
  }
});

export type Estimation = {
  id: string;
  fund_name: string;
  items: string | null;
  ds_estimation: string | null;
  le_estimation: string | null;
  qa_estimation: string | null;
  slack_link: string | null;
  clickup_link: string | null;
  raw_thread: string | null;
  created_at: string;
  updated_at: string;
};

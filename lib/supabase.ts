import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Create the client with placeholder values for build time
// At runtime, the API routes will validate that real credentials are provided
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

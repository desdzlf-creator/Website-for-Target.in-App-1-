import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuilfieifgowpwykcofn.supabase.co"

const supabasePublickey = "sb_publishable_nrrTZK0g1lc2uYQfFiFLqA_y8ES47E1"

if (!supabaseUrl || !supabasePublickey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabasePublickey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

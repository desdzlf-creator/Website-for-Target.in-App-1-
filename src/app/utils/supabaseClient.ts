import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuilfieifgowpwykcofn.supabase.co"

const supabasePublickey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWxmaWVpZmdvd3B3eWtjb2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTk5MTAsImV4cCI6MjA5NDQ5NTkxMH0.I4uQqANoucLItpAJlhAGC9jjNDe0TaWLPHQoPrpXIAE"

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

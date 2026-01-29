
import { createClient } from '@supabase/supabase-js';

// Support multiple env naming conventions for maximum compatibility
// Fix: Use type assertion for import.meta.env to resolve TS error in some environments
const env = (import.meta as any).env || {};

const SUPABASE_URL = 
  env.VITE_SUPABASE_URL || 
  env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://bvbzsbsxhrboflpojrxr.supabase.co';

const SUPABASE_ANON_KEY = 
  env.VITE_SUPABASE_ANON_KEY || 
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'sb_publishable_44CNpSoKFM27rwczTj6L0Q_rxGjvyyv';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Ansury Systems: Missing Supabase environment variables.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvbzsbsxhrboflpojrxr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_44CNpSoKFM27rwczTj6L0Q_rxGjvyyv';

/**
 * CORE REQUIREMENTS FOR SUPABASE:
 * 
 * You must run the following SQL in your Supabase SQL Editor:
 * 
 * 1. Table 'clients': stores branding and AI instructions.
 * 2. Table 'api_keys': stores keys for external API access.
 * 3. RLS Policies: ensure users can only see/edit their own data.
 * 
 * See the README or the prompt response for the full SQL script.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

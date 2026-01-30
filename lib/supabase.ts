
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

// NOTE: These are likely your current placeholders. 
// If your project returns 406, verify these exactly match your Supabase Dashboard.
const SUPABASE_URL = 
  env.VITE_SUPABASE_URL || 
  env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const SUPABASE_ANON_KEY = 
  env.VITE_SUPABASE_ANON_KEY || 
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

// Create a dummy client if keys are missing to prevent runtime crashes
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Supabase keys not configured' } }),
            order: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ error: { message: 'Read-only mode' } }),
        upsert: () => Promise.resolve({ error: { message: 'Read-only mode' } }),
        delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Read-only mode' } }) })
      }),
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => {}
    } as any;

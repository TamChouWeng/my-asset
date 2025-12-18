
import { createClient } from '@supabase/supabase-js';

// Accessing environment variables via process.env for compatibility with the deployment environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

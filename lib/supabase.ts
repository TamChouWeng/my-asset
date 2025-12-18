import { createClient } from '@supabase/supabase-js';

// Vite uses import.meta.env and requires variables to start with VITE_
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
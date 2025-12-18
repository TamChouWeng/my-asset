
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase credentials provided by the user. 
 * Hardcoding these ensures the client is always initialized correctly 
 * and prevents "Failed to fetch" or "URL is required" errors.
 */
const supabaseUrl = 'https://rdcigdilbtajnvmbyrdv.supabase.co';
const supabaseKey = 'sb_publishable_K3UXxJubZKu43pzBASbKlQ_TKRJnite';

/**
 * Confirms that the Supabase configuration is present.
 */
export const hasValidSupabaseConfig = (): boolean => {
  return !!supabaseUrl && supabaseUrl.startsWith('https://');
};

/**
 * Initialize the Supabase client.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

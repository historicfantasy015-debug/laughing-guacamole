import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check your .env file.");
  // Provide dummy values to prevent app crash in dev, but warn user
  // In a production app, you'd want to halt or show a critical error.
  // For this context, we'll let it proceed with a warning.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

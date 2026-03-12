/**
 * Supabase Client Configuration
 *
 * This module initializes and exports the Supabase client for use throughout
 * the Compass application. It provides access to the PostgreSQL database
 * with real-time subscriptions and authentication support.
 *
 * Setup:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
 * 3. Run the migration in src/data/migrations/001_initial_schema.sql
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase configuration. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

// Create Supabase client with options
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'compass',
    },
  },
});

/**
 * Helper function to check if Supabase is properly configured
 * @returns {boolean} True if Supabase credentials are present
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Helper function to handle Supabase errors consistently
 * @param {Error} error - The error from Supabase
 * @returns {string} A user-friendly error message
 */
export function handleSupabaseError(error) {
  if (!error) return 'An unknown error occurred';

  // Handle common Supabase error codes
  const errorMessages = {
    'PGRST116': 'No data found',
    '23505': 'This record already exists',
    '23503': 'Referenced record not found',
    '42501': 'Permission denied',
  };

  const code = error.code || error.message?.match(/\d+/)?.[0];
  return errorMessages[code] || error.message || 'Database operation failed';
}

export default supabase;

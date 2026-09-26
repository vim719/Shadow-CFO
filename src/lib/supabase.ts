// ============================================================================
// Supabase Client Factory for Backend Routes
// ============================================================================
// This file provides a function to create Supabase admin clients for backend use.
// IMPORTANT: This uses the SERVICE_ROLE_KEY which bypasses Row Level Security (RLS).
// Only use this in server-side routes where you trust the code (not in browser!).
// 
// Why not use the browser client?
// - Browser client respects RLS (user can only see their own data)
// - Backend needs to write data for users (e.g., storing transactions from Plaid)
// - Service role key has admin privileges - keep it secret!
// ============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables for Supabase connection
// NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL (safe to expose in browser too)
// SUPABASE_SERVICE_ROLE_KEY: Secret admin key (NEVER expose in browser!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Factory function to create a new Supabase admin client
// Returns a fresh client instance each call (avoids shared state issues)
// Configuration:
// - persistSession: false (we don't need to persist auth state for server-side)
// - autoRefreshToken: false (service role tokens don't expire like user tokens)
export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false, // Server-side doesn't need session persistence
      autoRefreshToken: false, // Service role key doesn't need refresh
    },
  });
}

// Note: The global `supabase` export pattern (seen in some files) is buggy:
// - It returns `null` when called on the backend (due to browser-specific initialization)
// - Always use this factory function instead for backend routes

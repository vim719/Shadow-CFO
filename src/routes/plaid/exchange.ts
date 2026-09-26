// ============================================================================
// Plaid Public Token Exchange Route
// ============================================================================
// This route exchanges a `public_token` (from Plaid Link) for an `access_token`.
// 
// Flow:
// 1. User connects bank via Plaid Link widget (frontend)
// 2. Plaid Link returns a public_token to the frontend
// 3. Frontend sends public_token to this route
// 4. This route exchanges it for an access_token (stored securely in DB)
// 5. access_token is used to fetch transactions in the future
// 
// SECURITY: access_token should be encrypted before storing in database!
// ============================================================================

import { plaidClient } from "../../lib/plaid";
import { createSupabaseAdminClient } from "../../lib/supabase";

// Handler function to exchange public token for access token
// Returns the access_token and item_id (Plaid's identifier for this bank connection)
export async function exchangePublicToken(publicToken: string, userId: string = "shadow-user-123") {
  // Call Plaid API to exchange the short-lived public_token for a long-lived access_token
  // public_token: Single-use token from Plaid Link (expires quickly)
  // access_token: Long-lived token to access this user's bank data (store this!)
  const exchangeResponse = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  // Extract the access_token and item_id from Plaid's response
  const accessToken = exchangeResponse.data.access_token; // Long-lived token for API calls
  const itemId = exchangeResponse.data.item_id; // Plaid's unique ID for this connection

  // Store the bank connection in Supabase
  // IMPORTANT: In production, encrypt the access_token before storing!
  // (Plaid recommends using AES-256 encryption at rest)
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("bank_connections")
    .insert({
      user_id: userId, // TODO: Replace with actual Supabase auth user ID
      access_token_encrypted: accessToken, // TODO: Encrypt this before storing!
      item_id: itemId,
      institution_name: "Unknown", // TODO: Fetch from Plaid's /institutions/get endpoint
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to store bank connection:", error);
    throw new Error("Failed to store bank connection");
  }

  // Return the access_token and item_id to the frontend
  // Frontend can use this to trigger transaction syncing
  return {
    access_token: accessToken,
    item_id: itemId,
    connection_id: data.id, // Our internal ID for this connection
  };
}

// Note: The actual API route is defined in src/index.ts
// TODO: Add encryption for access_token before storing in production

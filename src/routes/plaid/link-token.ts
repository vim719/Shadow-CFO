// ============================================================================
// Plaid Link Token Creation Route
// ============================================================================
// This route generates a `link_token` which is used to initialize Plaid Link.
// Plaid Link is the frontend widget that lets users connect their bank accounts.
// 
// Flow:
// 1. Frontend calls this route to get a link_token
// 2. Frontend passes link_token to Plaid Link widget
// 3. User logs into their bank via Plaid Link
// 4. Plaid Link returns a public_token (exchanged for access_token in next step)
// ============================================================================

import { plaidClient, Products, CountryCode } from "../../lib/plaid";

// Handler function to create a Plaid Link token
// This is called by the frontend when user clicks "Connect Bank"
export async function createLinkToken(userId: string = "shadow-user-123") {
  // Call Plaid API to create a link token
  // Parameters:
  // - user.client_user_id: Unique identifier for the user (should be Supabase auth ID)
  // - client_name: Name shown to user in Plaid Link UI
  // - products: Array of Plaid products to request access to
  // - country_codes: Which countries' banks to show (US for now)
  // - language: Language for Plaid Link UI
  const response = await plaidClient.linkTokenCreate({
    user: {
      client_user_id: userId, // TODO: Replace with actual Supabase user ID from auth
    },
    client_name: "Shadow CFO", // Shown in Plaid Link UI
    products: [Products.Transactions], // Request access to transaction data
    country_codes: [CountryCode.Us], // US banks only for now
    language: "en", // English UI
  });

  // Return the link token and expiration info to the frontend
  // Frontend uses this token to initialize Plaid Link widget
  return response.data;
}

// Note: The actual API route is defined in src/index.ts
// This file just exports the logic for testability and separation of concerns

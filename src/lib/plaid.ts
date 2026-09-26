// ============================================================================
// Plaid API Client Configuration
// ============================================================================
// This file initializes the Plaid API client using the official Plaid SDK.
// It reads credentials from environment variables (never hardcode these!).
// The client is configured to use the sandbox environment for safe testing.
// ============================================================================

import { Configuration, PlaidApi, Products, PlaidEnvironments, CountryCode } from "plaid";

// Read Plaid credentials from environment variables
// PLAID_CLIENT_ID: Your Plaid application's client ID (from Plaid Dashboard)
// PLAID_SECRET: Your Plaid application's secret key (from Plaid Dashboard)
// PLAID_ENV: Environment to use - 'sandbox' for testing, 'production' for live
const clientId = process.env.PLAID_CLIENT_ID!;
const secret = process.env.PLAID_SECRET!;
const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();

// Map string environment names to Plaid SDK Environment enum
// - 'sandbox': Test environment with mock data (no real bank connections)
// - 'development': Limited production data for development
// - 'production': Live bank data (requires Plaid approval)
const basePath =
  env === "production"
    ? PlaidEnvironments.production
    : PlaidEnvironments.sandbox;

// Create the Plaid API client instance
// This client will be used by all Plaid routes to make API calls
// Configuration includes: clientId, secret, and environment-specific base URL
export const plaidClient = new PlaidApi(
  new Configuration({
    basePath, // Fallback to sandbox unless explicitly set to production
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId, // Identifies your app to Plaid
        "PLAID-SECRET": secret, // Authenticates your app to Plaid
      },
    },
  })
);

// Export Products enum for use in other files
// Products define what data you want to access from the user's bank
// - 'transactions': Access to transaction history
// - 'accounts': Access to account balances and details
// - 'identity': Access to account holder information
export { Products, CountryCode };

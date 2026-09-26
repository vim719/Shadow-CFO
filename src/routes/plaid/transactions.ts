// ============================================================================
// Plaid Transactions Fetching Route
// ============================================================================
// This route fetches transactions from Plaid and stores them in Supabase.
// 
// Flow:
// 1. Called with an access_token (from exchange step)
// 2. Calls Plaid API to get transactions for the connected bank account
// 3. Transforms Plaid transaction format to our database schema
// 4. Bulk inserts transactions into Supabase
// 5. Returns count of inserted transactions
// 
// NOTE: This is a simplified version. Production should:
// - Handle pagination (Plaid returns max 500 transactions per call)
// - Implement incremental sync (only fetch new transactions)
// - Handle removed transactions (Plaid marks some as removed)
// ============================================================================

import { plaidClient } from "../../lib/plaid";
import { createSupabaseAdminClient } from "../../lib/supabase";

// Handler function to fetch and store transactions
// access_token: The token from the exchange step (identifies which bank to fetch from)
// Returns: Number of transactions inserted
export async function fetchAndStoreTransactions(
  accessToken: string,
  userId: string = "shadow-user-123",
  connectionId: string = "unknown"
) {
  // Initialize Supabase admin client (bypasses RLS for server-side write)
  const supabase = createSupabaseAdminClient();

  // Call Plaid API to fetch transactions
  // Parameters:
  // - access_token: Identifies which bank connection to fetch from
  // - start_date: Fetch transactions from this date (goes back 3+ years for initial sync)
  // - end_date: Fetch transactions up to this date (today for full sync)
  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: "2023-01-01", // TODO: Store last_sync date and only fetch new ones
    end_date: new Date().toISOString().split("T")[0] || new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  });

  // Transform Plaid transaction format to our database schema
  // Plaid returns: transaction_id, amount, date, merchant_name, category[], etc.
  // Our DB expects: id, amount, date, merchant, category, user_id, bank_connection_id
  const transactions = response.data.transactions.map((t: any) => ({
    id: t.transaction_id, // Plaid's unique transaction ID (used for deduplication)
    user_id: userId, // TODO: Replace with actual Supabase auth user ID
    bank_connection_id: connectionId, // TODO: Pass actual connection ID
    amount: t.amount, // Positive = expense, Negative = income (Plaid's convention)
    date: t.date, // Transaction date (YYYY-MM-DD)
    merchant: t.merchant_name || t.name, // Merchant name (fallback to raw name)
    category: t.category?.[0] || "unknown", // Primary category (e.g., "Food and Drink")
    plaid_transaction_id: t.transaction_id, // Store original ID for reference
    raw_data: t, // Store full Plaid response for auditing/debugging (jsonb column)
  }));

  // Bulk insert all transactions into Supabase
  // Note: This uses upsert-like behavior if you have unique constraints on plaid_transaction_id
  const { error } = await supabase
    .from("transactions")
    .insert(transactions);

  if (error) {
    console.error("Supabase insert error:", error);
    throw new Error("Failed to insert transactions");
  }

  // Return count of successfully inserted transactions
  return transactions.length;
}

// Note: The actual API route is defined in src/index.ts
// TODO: Add pagination handling (response.data.transactions may be truncated)
// TODO: Handle 'removed' transactions (Plaid flags some as removed)
// TODO: Implement incremental sync using stored cursor from Plaid

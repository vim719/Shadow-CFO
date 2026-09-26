-- ============================================================================
-- Shadow CFO - Real Bank Connection Migration
-- ============================================================================
-- This migration creates the necessary tables for Plaid bank integration.
-- Created: 2026-05-05
-- 
-- WHY THESE TABLES?
-- 1. bank_connections: Stores Plaid connection metadata per user
--    - access_token_encrypted: The Plaid access token (encrypted at rest!)
--    - item_id: Plaid's unique ID for this bank connection
--    - status: Track if connection is active, disconnected, or error
-- 
-- 2. transactions: Stores synced transactions from Plaid
--    - plaid_transaction_id: Unique ID from Plaid (for deduplication)
--    - raw_data: Full Plaid response (jsonb) for auditing/debugging
-- 
-- ROW LEVEL SECURITY (RLS):
-- Both tables have RLS enabled with policies to ensure users can only
-- access their own data (user_id = auth.uid()).
-- ============================================================================

-- ============================================================================
-- TABLE 1: bank_connections
-- ============================================================================
-- Stores metadata about each connected bank account via Plaid.
-- One user can have multiple bank connections (multiple banks).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Our internal unique ID
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Links to Supabase auth
  access_token_encrypted text NOT NULL, -- Plaid access token (MUST be encrypted at rest!)
  item_id text NOT NULL UNIQUE, -- Plaid's unique identifier for this connection
  institution_name text, -- Bank name (e.g., "Chase", "Bank of America")
  institution_id text, -- Plaid's institution ID (for fetching logo, etc.)
  account_id text, -- Specific account ID within the institution
  status text DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')), -- Connection health
  last_synced_at timestamptz, -- Track when we last fetched transactions
  created_at timestamptz DEFAULT now(), -- When connection was first created
  updated_at timestamptz DEFAULT now() -- Track last update for sync logic
);

-- Performance indexes for bank_connections
CREATE INDEX idx_bank_connections_user_id ON public.bank_connections(user_id);
CREATE INDEX idx_bank_connections_item_id ON public.bank_connections(item_id);

-- Enable Row Level Security (RLS) - users can only see their own connections
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only SELECT their own bank connections
CREATE POLICY "Users can view own bank connections"
  ON public.bank_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only INSERT their own bank connections
CREATE POLICY "Users can insert own bank connections"
  ON public.bank_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only UPDATE their own bank connections
CREATE POLICY "Users can update own bank connections"
  ON public.bank_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only DELETE their own bank connections
CREATE POLICY "Users can delete own bank connections"
  ON public.bank_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 2: transactions
-- ============================================================================
-- Stores individual transactions fetched from Plaid.
-- Each transaction is linked to a bank_connection (which bank it came from).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Our internal unique ID
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Links to Supabase auth
  bank_connection_id uuid REFERENCES public.bank_connections(id) ON DELETE CASCADE NOT NULL, -- Which bank
  plaid_transaction_id text NOT NULL UNIQUE, -- Plaid's unique transaction ID (for deduplication)
  amount decimal(12,2) NOT NULL, -- Transaction amount (positive = expense, negative = income)
  date date NOT NULL, -- Transaction date (YYYY-MM-DD)
  name text, -- Raw transaction name from Plaid
  merchant_name text, -- Cleaned merchant name (if available)
  category text[], -- Plaid category array (e.g., ["Food and Drink", "Restaurants"])
  pending boolean DEFAULT false, -- Whether transaction is still pending
  transaction_type text CHECK (transaction_type IN ('place', 'digital', 'special')), -- Plaid type
  iso_currency_code text DEFAULT 'USD', -- Currency code
  raw_data jsonb, -- Full Plaid transaction JSON (for auditing/debugging)
  created_at timestamptz DEFAULT now() -- When we stored this transaction
);

-- Performance indexes for transactions
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_bank_connection_id ON public.transactions(bank_connection_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC); -- Optimize date-range queries
CREATE INDEX idx_transactions_plaid_id ON public.transactions(plaid_transaction_id);

-- Enable Row Level Security (RLS) - users can only see their own transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only SELECT their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only INSERT their own transactions
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only UPDATE their own transactions
CREATE POLICY "Users can update own transactions"
  ON public.transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only DELETE their own transactions
CREATE POLICY "Users can delete own transactions"
  ON public.transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at for bank_connections
-- ============================================================================
-- This trigger automatically sets `updated_at = now()` on every UPDATE.
-- Useful for tracking when connections were last modified.
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_connections_updated_at
  BEFORE UPDATE ON public.bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MODIFY TABLE: documents
-- ============================================================================
-- Add bank_connection_id to documents table if it exists.
-- This links uploaded documents (statements) to a specific bank connection.
-- ============================================================================
ALTER TABLE IF EXISTS public.documents
  ADD COLUMN IF NOT EXISTS bank_connection_id uuid REFERENCES public.bank_connections(id) ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE public.bank_connections IS 'Stores Plaid bank connection metadata per user';
COMMENT ON TABLE public.transactions IS 'Stores synced transactions from Plaid (real bank data)';
COMMENT ON COLUMN public.bank_connections.access_token_encrypted IS 'Plaid access token - MUST be encrypted at rest!';
COMMENT ON COLUMN public.transactions.raw_data IS 'Full Plaid transaction JSON for auditing/debugging';

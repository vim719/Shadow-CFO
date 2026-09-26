ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'flagged', 'fixed', 'skipped')),
  ADD COLUMN IF NOT EXISTS potential_savings decimal(12,2),
  ADD COLUMN IF NOT EXISTS og_da_commitment_hash text,
  ADD COLUMN IF NOT EXISTS og_storage_status text NOT NULL DEFAULT 'not_configured'
    CHECK (og_storage_status IN ('not_configured', 'pending', 'archived', 'failed')),
  ADD COLUMN IF NOT EXISTS og_storage_error text;

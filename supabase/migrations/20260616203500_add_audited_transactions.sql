CREATE TABLE IF NOT EXISTS public.audited_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL,
  risk_score numeric NOT NULL,
  verdict_summary text NOT NULL,
  provider_address text NOT NULL,
  model_signature text NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audited_transactions_transaction_id
  ON public.audited_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_audited_transactions_computed_at
  ON public.audited_transactions(computed_at DESC);

ALTER TABLE public.audited_transactions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.audited_transactions IS
  'Cryptographic audit logs from 0G Compute TEE verifiable inference executions.';

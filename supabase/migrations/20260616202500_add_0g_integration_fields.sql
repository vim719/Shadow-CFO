-- ============================================================================
-- Shadow CFO - 0G Integration Fields
-- ============================================================================
-- This migration keeps Supabase as the live operational database while adding
-- optional 0G proof pointers for encrypted document archives and Fix-It audits.
-- No existing row must have a 0G proof; these fields are nullable by design so
-- the Web2 app keeps working when 0G credentials are absent or a 0G call fails.
-- ============================================================================

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS og_storage_root_hash text,
  ADD COLUMN IF NOT EXISTS og_storage_tx_hash text,
  ADD COLUMN IF NOT EXISTS og_storage_tx_seq bigint,
  ADD COLUMN IF NOT EXISTS og_storage_key_hash text,
  ADD COLUMN IF NOT EXISTS og_storage_status text NOT NULL DEFAULT 'not_configured'
    CHECK (og_storage_status IN ('not_configured', 'pending', 'archived', 'failed')),
  ADD COLUMN IF NOT EXISTS og_storage_error text,
  ADD COLUMN IF NOT EXISTS og_archived_at timestamptz;

COMMENT ON COLUMN public.documents.og_storage_root_hash IS
  '0G Storage root hash for the encrypted document archive, when 0G archival is configured.';

COMMENT ON COLUMN public.documents.og_storage_tx_hash IS
  '0G Storage transaction hash for the document archive upload.';

COMMENT ON COLUMN public.documents.og_storage_tx_seq IS
  '0G Storage transaction sequence returned by the indexer for the upload.';

COMMENT ON COLUMN public.documents.og_storage_key_hash IS
  'SHA-256 hash of the AES key used for 0G encryption; stores a verifier, never the key itself.';

COMMENT ON COLUMN public.documents.og_storage_status IS
  'Document archival state for the optional 0G sidecar workflow.';

COMMENT ON COLUMN public.documents.og_storage_error IS
  'Last non-sensitive 0G archival error message, if archival failed without blocking Web2 processing.';

COMMENT ON COLUMN public.documents.og_archived_at IS
  'Timestamp when the document was successfully archived to 0G Storage.';

CREATE TABLE IF NOT EXISTS public.zero_g_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('transaction_flagged', 'fix_approved', 'fix_skipped')),
  insight_id text,
  payload_commitment_hash text NOT NULL,
  payload jsonb NOT NULL,
  og_storage_root_hash text,
  og_storage_tx_hash text,
  og_storage_tx_seq bigint,
  og_storage_key_hash text,
  og_storage_status text NOT NULL DEFAULT 'not_configured'
    CHECK (og_storage_status IN ('not_configured', 'pending', 'archived', 'failed')),
  og_storage_error text,
  created_at timestamptz DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_zero_g_audit_events_document_id
  ON public.zero_g_audit_events(document_id);

CREATE INDEX IF NOT EXISTS idx_zero_g_audit_events_user_id
  ON public.zero_g_audit_events(user_id);

CREATE INDEX IF NOT EXISTS idx_zero_g_audit_events_action_type_created_at
  ON public.zero_g_audit_events(action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_zero_g_audit_events_payload_commitment_hash
  ON public.zero_g_audit_events(payload_commitment_hash);

ALTER TABLE public.zero_g_audit_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.zero_g_audit_events IS
  'Tamper-evident audit commitments for AI findings and human-approved Fix-It actions.';

COMMENT ON COLUMN public.zero_g_audit_events.payload_commitment_hash IS
  'SHA-256 hash of the canonical audit payload; this is the local non-repudiation anchor.';

COMMENT ON COLUMN public.zero_g_audit_events.payload IS
  'Structured audit payload recorded in Supabase for operational lookup; avoid raw Plaid tokens or secrets.';

COMMENT ON COLUMN public.zero_g_audit_events.og_storage_root_hash IS
  '0G Storage root hash for the encrypted audit payload archive, when configured.';

COMMENT ON COLUMN public.zero_g_audit_events.og_storage_status IS
  'Audit archival state for the optional 0G sidecar workflow.';

-- ============================================================================
-- Shadow CFO - Document Upload + Processing Tables
-- ============================================================================
-- This migration adds a `documents` table to store uploaded statements and
-- processing results (parsed text + leak findings).
--
-- Storage:
-- - This repo uploads PDFs to Supabase Storage (recommended bucket: `documents`)
-- - Bucket creation is typically done in the Supabase Dashboard.
--   If you prefer infra-as-code, you can create buckets via SQL, but the exact
--   storage schema can vary across Supabase versions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bank_connection_id uuid REFERENCES public.bank_connections(id) ON DELETE SET NULL,

  original_filename text,
  mime_type text,
  storage_bucket text DEFAULT 'documents',
  storage_path text,

  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'error')),
  error_message text,

  parsed_text text,
  findings jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_bank_connection_id ON public.documents(bank_connection_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- NOTE:
-- We intentionally do NOT add `anon`/`authenticated` policies here.
-- The intended access pattern for this prototype is:
-- - Uploads + reads happen through a server endpoint using the Supabase service role.

CREATE OR REPLACE FUNCTION public.update_documents_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_documents_updated_at_column();

COMMENT ON TABLE public.documents IS 'Uploaded statements and processing results (parsed text + findings)';

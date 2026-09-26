-- Adds a sync_status column so the CRON-based retry loop can filter items that need a second chance.
ALTER TABLE public.zero_g_audit_events
  ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'archived', 'failed', 'retrying'));

COMMENT ON COLUMN public.zero_g_audit_events.sync_status IS
  'Tracks whether the 0G archival attempt succeeded, failed, or is queued for retry.';

-- Pick up failed items and mark them as retrying so the edge function can process them.
CREATE OR REPLACE FUNCTION public.retry_failed_0g_audits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.zero_g_audit_events
  SET sync_status = 'retrying'
  WHERE sync_status = 'failed'
    AND created_at > NOW() - INTERVAL '24 hours';
END;
$$;

COMMENT ON FUNCTION public.retry_failed_0g_audits() IS
  'Marks failed 0G audit rows as retrying so the retry-sync edge function can pick them up.';

-- Add RLS policies for zero_g_audit_events (missing from original migration).

CREATE POLICY "service_role_insert_audit_events"
  ON public.zero_g_audit_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select_audit_events"
  ON public.zero_g_audit_events
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_update_audit_events"
  ON public.zero_g_audit_events
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "users_select_own_audit_events"
  ON public.zero_g_audit_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

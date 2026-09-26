-- Create a public wrapper for reading Supabase Vault secrets.
-- The vault schema is restricted, so we create this in public with SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.read_vault_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault
AS $$
DECLARE
  result text;
BEGIN
  SELECT decrypted_secret INTO result
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;
  RETURN result;
END;
$$;

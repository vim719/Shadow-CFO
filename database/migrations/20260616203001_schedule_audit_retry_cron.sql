-- Enable pg_cron for scheduled job execution.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the retry function to run every 10 minutes.
SELECT cron.schedule(
  'retry-failed-0g-audits',
  '*/10 * * * *',
  'SELECT retry_failed_0g_audits()'
);

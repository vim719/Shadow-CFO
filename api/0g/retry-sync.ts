import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { archiveAuditPayloadToZeroG, type ZeroGAuditPayload } from "../../src/lib/0g/audit";

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  // Fetch all items marked 'retrying' by the CRON function.
  const { data: retrying, error: fetchError } = await supabase
    .from("zero_g_audit_events")
    .select("id, payload, document_id, user_id")
    .eq("sync_status", "retrying")
    .limit(50);

  if (fetchError) {
    console.error("Failed to fetch retrying audits:", fetchError.message);
    return json(res, 500, { error: "Failed to fetch retrying audits" });
  }

  if (!retrying || retrying.length === 0) {
    return json(res, 200, { retried: 0 });
  }

  let succeeded = 0;
  let failed = 0;

  for (const row of retrying) {
    try {
      // Reconstruct the payload from the stored JSONB so the commitment hash matches the original.
      const stored = row.payload as Record<string, unknown>;
      const payload: ZeroGAuditPayload = {
        actionType: stored.actionType as ZeroGAuditPayload["actionType"],
        documentId: (stored.documentId as string) ?? null,
        userId: (stored.userId as string) ?? null,
        insightId: (stored.insightId as string) ?? null,
        title: (stored.title as string) ?? null,
        category: (stored.category as string) ?? null,
        reason: (stored.reason as string) ?? null,
        evidence: Array.isArray(stored.evidence) ? stored.evidence.filter((e): e is string => typeof e === "string") : [],
        confidence: typeof stored.confidence === "number" ? stored.confidence : null,
        estimatedSavings: typeof stored.estimatedSavings === "number" ? stored.estimatedSavings : null,
        frequency: stored.frequency === "monthly" || stored.frequency === "yearly" ? stored.frequency : null,
        fixDescription: (stored.fixDescription as string) ?? null,
        createdAt: (stored.createdAt as string) ?? new Date().toISOString(),
      };

      const audit = await archiveAuditPayloadToZeroG(payload);
      const synced = audit.archive.status === "archived";

      const { error: updateError } = await supabase
        .from("zero_g_audit_events")
        .update({
          sync_status: synced ? "archived" : "failed",
          payload_commitment_hash: audit.commitmentHash,
          og_storage_root_hash: audit.archive.rootHash,
          og_storage_tx_hash: audit.archive.txHash,
          og_storage_tx_seq: audit.archive.txSeq,
          og_storage_key_hash: audit.archive.keyHash,
          og_storage_status: audit.archive.status,
          og_storage_error: audit.archive.error,
          archived_at: synced ? new Date().toISOString() : null,
        })
        .eq("id", row.id);

      if (updateError) {
        console.error(`Failed to update audit ${row.id}: ${updateError.message}`);
        failed++;
      } else {
        succeeded++;
      }
    } catch (error) {
      console.error(`Retry failed for audit ${row.id}:`, error instanceof Error ? error.message : "Unknown error");
      // Mark back as 'failed' so the next CRON cycle can retry again.
      await supabase
        .from("zero_g_audit_events")
        .update({ sync_status: "failed" })
        .eq("id", row.id);
      failed++;
    }
  }

  return json(res, 200, { retried: succeeded + failed, succeeded, failed });
}

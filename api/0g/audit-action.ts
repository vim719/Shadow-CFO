import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";

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

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const body = await readJson(req);
  const actionType = stringOrNull(body.actionType);
  if (actionType !== "fix_approved" && actionType !== "fix_skipped" && actionType !== "transaction_flagged") {
    return json(res, 400, { error: "Unsupported action type" });
  }

  const evidence = Array.isArray(body.evidence) ? body.evidence.filter((item): item is string => typeof item === "string").slice(0, 20) : [];
  const payload = {
    actionType,
    documentId: stringOrNull(body.documentId),
    userId: stringOrNull(body.userId),
    insightId: stringOrNull(body.insightId),
    title: stringOrNull(body.title),
    category: stringOrNull(body.category),
    reason: stringOrNull(body.reason),
    evidence,
    confidence: numberOrNull(body.confidence),
    estimatedSavings: numberOrNull(body.estimatedSavings),
    frequency: body.frequency === "monthly" || body.frequency === "yearly" ? body.frequency : null,
    fixDescription: stringOrNull(body.fixDescription),
    createdAt: new Date().toISOString(),
  };

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let audit;
  try {
    const { archiveAuditPayloadToZeroG } = await import("../../src/lib/0g/audit");
    audit = await archiveAuditPayloadToZeroG(payload as any);
  } catch (error) {
    await supabase.from("zero_g_audit_events").insert({
      document_id: payload.documentId,
      user_id: payload.userId,
      action_type: payload.actionType,
      insight_id: payload.insightId,
      payload_commitment_hash: null,
      payload,
      og_storage_status: "failed",
      og_storage_error: error instanceof Error ? error.message : "Unknown 0G archival error",
      sync_status: "failed",
    }).select("id").single();
    return json(res, 200, {
      auditEventId: null,
      commitmentHash: null,
      ogStorageStatus: "failed",
      ogStorageRootHash: null,
    });
  }

  const syncStatus = audit.archive.status === "archived" ? "archived" : "failed";

  const insert = await supabase.from("zero_g_audit_events").insert({
    document_id: payload.documentId,
    user_id: payload.userId,
    action_type: payload.actionType,
    insight_id: payload.insightId,
    payload_commitment_hash: audit.commitmentHash,
    payload: JSON.parse(audit.canonicalPayload),
    og_storage_root_hash: audit.archive.rootHash,
    og_storage_tx_hash: audit.archive.txHash,
    og_storage_tx_seq: audit.archive.txSeq,
    og_storage_key_hash: audit.archive.keyHash,
    og_storage_status: audit.archive.status,
    og_storage_error: audit.archive.error,
    archived_at: audit.archive.status === "archived" ? new Date().toISOString() : null,
    sync_status: syncStatus,
  }).select("id").single();

  if (insert.error) {
    console.error("Audit insert failed:", insert.error.message);
    return json(res, 500, { error: "Failed to persist audit event" });
  }

  return json(res, 200, {
    auditEventId: insert.data.id,
    commitmentHash: audit.commitmentHash,
    ogStorageStatus: audit.archive.status,
    ogStorageRootHash: audit.archive.rootHash,
  });
}

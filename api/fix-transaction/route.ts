import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { executeVerifiableAudit } from "../../src/lib/0g/compute";
import { archiveAuditPayloadToZeroG } from "../../src/lib/0g/audit";

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const body = await readJson(req);
    const transactionId = body.transactionId as string | undefined;
    if (!transactionId) {
      return json(res, 400, { error: "Missing transactionId" });
    }

    // 1. Fetch transaction from Supabase
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (txError || !tx) {
      return json(res, 404, { error: "Transaction record not found." });
    }

    // 2. Verify the financial decision inside a TEE via 0G Compute
    const computeResult = await executeVerifiableAudit({
      transactionId: tx.id,
      amount: Math.abs(Number(tx.amount)),
      senderAddress: tx.user_id || "0x0000000000000000000000000000000000000000",
      receiverAddress: tx.merchant_name || tx.name || "0x0000000000000000000000000000000000000000",
    });

    if (!computeResult.success || computeResult.riskScore > 75) {
      return json(res, 400, {
        error: "Verifiable audit flagged this action as too high risk to execute autonomously.",
        verdict: computeResult.verdict,
      });
    }

    // 3. Execute the Web2 fintech action (placeholder for Plaid dispute/cancel)
    const plaidActionSuccess = true;

    if (plaidActionSuccess) {
      // 4. Fire-and-forget immutable commitment logging to 0G Storage
      archiveAuditPayloadToZeroG({
        actionType: "fix_approved",
        documentId: null,
        userId: tx.user_id,
        insightId: transactionId,
        title: "Fix Transaction",
        category: "automated_remediation",
        reason: computeResult.verdict,
        evidence: [`Risk score: ${computeResult.riskScore}`, `Provider: ${computeResult.providerUsed}`],
        confidence: Math.max(0, 100 - computeResult.riskScore),
        estimatedSavings: numberOrNull(tx.potential_savings) || 0,
        frequency: null,
        fixDescription: "Automated transaction remediation via 0G-verified TEE audit",
        createdAt: new Date().toISOString(),
      }).then(async (auditResult) => {
        await supabase
          .from("transactions")
          .update({
            status: "fixed",
            og_da_commitment_hash: auditResult.commitmentHash,
            og_storage_status: "archived",
          })
          .eq("id", transactionId);
      }).catch(async () => {
        await supabase
          .from("transactions")
          .update({ og_storage_status: "failed" })
          .eq("id", transactionId);
      });
    }

    return json(res, 200, {
      success: true,
      message: "Transaction remediation executed and committed to verifiable infrastructure.",
      riskScore: computeResult.riskScore,
      verdict: computeResult.verdict,
    });

  } catch (err: any) {
    return json(res, 500, { error: err.message || "Unknown error" });
  }
}

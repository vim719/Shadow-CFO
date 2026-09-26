import crypto from "node:crypto"; // Provides deterministic SHA-256 commitments for audit payloads.
import { archiveBufferToZeroG, type ZeroGArchiveResult } from "./storage"; // Reuses encrypted 0G Storage archival for audit payload backups.

export type ZeroGAuditPayload = { // Describes the structured payload captured when an AI finding or Fix action is audited.
  actionType: "transaction_flagged" | "fix_approved" | "fix_skipped"; // Defines the action category allowed by the Supabase check constraint.
  documentId?: string | null; // Links the audit to an uploaded statement when available.
  userId?: string | null; // Links the audit to a Supabase user when available.
  insightId?: string | null; // Links the audit to the specific frontend/backend insight.
  title?: string | null; // Captures the user-facing finding title for later review.
  category?: string | null; // Captures the finding category used by the agent UI.
  reason?: string | null; // Captures the explainability text shown to the user.
  evidence?: string[]; // Captures concise evidence strings shown in the expandable reasoning UI.
  confidence?: number | null; // Captures the AI confidence percentage shown to the user.
  estimatedSavings?: number | null; // Captures the dollar amount displayed for the finding.
  frequency?: "monthly" | "yearly" | null; // Captures the cadence attached to the displayed savings.
  fixDescription?: string | null; // Captures the user-facing action description before approval.
  createdAt: string; // Captures the server-side timestamp used in the commitment.
}; // Ends the audit payload type.

export type ZeroGAuditResult = { // Describes the local commitment plus optional 0G archive result.
  canonicalPayload: string; // Stores the deterministic JSON string used for hashing and archival.
  commitmentHash: string; // Stores the SHA-256 commitment hash for non-repudiation.
  archive: ZeroGArchiveResult; // Stores the optional encrypted 0G Storage archive result.
}; // Ends the audit result type.

function sortForCanonicalJson(value: unknown): unknown { // Recursively sorts object keys so equivalent payloads hash the same way.
  if (Array.isArray(value)) return value.map(sortForCanonicalJson); // Preserves array order while canonicalizing array values.
  if (value && typeof value === "object") { // Detects plain object-like values that need key ordering.
    return Object.fromEntries( // Rebuilds the object with sorted entries.
      Object.entries(value as Record<string, unknown>) // Reads key/value pairs from the input object.
        .filter(([, entryValue]) => entryValue !== undefined) // Removes undefined fields so omitted fields hash consistently.
        .sort(([a], [b]) => a.localeCompare(b)) // Sorts keys alphabetically for deterministic output.
        .map(([key, entryValue]) => [key, sortForCanonicalJson(entryValue)]) // Recursively canonicalizes nested values.
    ); // Ends the rebuilt object.
  } // Ends object branch.
  return value; // Returns primitive values unchanged.
} // Ends canonical sort helper.

export function createAuditCommitment(payload: ZeroGAuditPayload): Pick<ZeroGAuditResult, "canonicalPayload" | "commitmentHash"> { // Builds a deterministic local proof.
  const canonicalPayload = JSON.stringify(sortForCanonicalJson(payload)); // Serializes the sorted payload into a stable JSON string.
  const commitmentHash = crypto.createHash("sha256").update(canonicalPayload).digest("hex"); // Hashes the canonical payload into a tamper-evident commitment.
  return { canonicalPayload, commitmentHash }; // Returns both the source string and its hash for storage/auditing.
} // Ends local commitment helper.

export async function archiveAuditPayloadToZeroG(payload: ZeroGAuditPayload): Promise<ZeroGAuditResult> { // Creates and optionally archives an audit payload.
  const { canonicalPayload, commitmentHash } = createAuditCommitment(payload); // Generates the deterministic local proof before any network work.
  const archive = await archiveBufferToZeroG(Buffer.from(canonicalPayload, "utf8"), `audit:${payload.actionType}:${payload.insightId ?? "unknown"}`); // Stores the canonical audit payload in encrypted 0G Storage when configured.
  return { canonicalPayload, commitmentHash, archive }; // Returns the local proof and optional decentralized archive pointer.
} // Ends audit archive helper.

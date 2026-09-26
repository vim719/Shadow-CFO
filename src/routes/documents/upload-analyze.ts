import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import pdf from "pdf-parse";

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || (fallback ? process.env[fallback] : undefined);
  if (!value) throw new Error(`Missing required env var: ${name}${fallback ? ` (or ${fallback})` : ""}`);
  return value;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

type ParsedTransaction = {
  date: string;
  merchant: string;
  amount: number;
  direction: "expense" | "income";
  rawLine: string;
};

type LeakInsight = {
  id: string;
  title: string;
  amount: number;
  frequency: "monthly" | "yearly";
  confidence: number;
  category: string;
  agentReasoning: string;
  agentEvidence: string[];
  fixDescription: string;
  fixDestination?: string;
};

function toIsoDate(mmddyyyy: string): string | null {
  const m = mmddyyyy.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.abs(n);
}

function parseSignedDirection(line: string): "expense" | "income" | null {
  if (/\+\s*\$/.test(line) || /\bIncome\+/.test(line)) return "income";
  if (/\-\s*\$/.test(line) || /\b[A-Za-z]+\-\b/.test(line)) return "expense";
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function toIsoDateFromMonthDay(monthToken: string, dayToken: string, year: number): string | null {
  const month = MONTHS[monthToken.toLowerCase()];
  const day = Number(dayToken);
  if (!month || !Number.isFinite(day) || day < 1 || day > 31) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractTransactionsFromText(text: string): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const txs: ParsedTransaction[] = [];
  let currentYear: number | null = null;

  for (const line of lines) {
    const header = line.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/i);
    if (header?.[2]) {
      const y = Number(header[2]);
      if (Number.isFinite(y)) currentYear = y;
      continue;
    }

    let isoDate: string | null = null;
    const numericDateMatch = line.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
    if (numericDateMatch?.[1]) isoDate = toIsoDate(numericDateMatch[1]);

    if (!isoDate) {
      const monthDay = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?=\D)/i);
      if (monthDay?.[1] && monthDay?.[2] && currentYear) {
        isoDate = toIsoDateFromMonthDay(monthDay[1], monthDay[2], currentYear);
      }
    }

    if (!isoDate) continue;

    const direction = parseSignedDirection(line);
    if (!direction) continue;

    const balanceMatch = line.match(/\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)\s*$/);
    const lineNoBalance = balanceMatch ? line.slice(0, balanceMatch.index).trim() : line;

    const amountMatch = lineNoBalance.match(/([+-])\s*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/);
    if (!amountMatch?.[2]) continue;
    const amount = parseAmount(amountMatch[2]);
    if (!amount || amount <= 0) continue;

    let core = lineNoBalance;
    if (numericDateMatch?.[0]) core = core.replace(numericDateMatch[0], " ");
    core = core.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2}(?=\D)/i, " ");
    core = core.replace(amountMatch[0], " ");
    core = core.replace(/\s+/g, " ").trim();

    const merchantGuess = core.toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    if (!merchantGuess) continue;

    txs.push({
      date: isoDate,
      merchant: merchantGuess,
      amount: Math.round(amount * 100) / 100,
      direction,
      rawLine: line,
    });
  }

  return txs;
}

function daysBetween(a: string, b: string) {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

function findZombieSubscriptions(txs: ParsedTransaction[]): LeakInsight[] {
  const byMerchant = new Map<string, ParsedTransaction[]>();
  for (const tx of txs) {
    if (tx.direction !== "expense") continue;
    if (tx.amount >= 50) continue;
    if (tx.amount < 1) continue;
    const list = byMerchant.get(tx.merchant) ?? [];
    list.push(tx);
    byMerchant.set(tx.merchant, list);
  }

  const findings: LeakInsight[] = [];

  for (const [merchant, list] of byMerchant.entries()) {
    if (list.length < 6) continue;
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (!prev || !cur) continue;
      gaps.push(daysBetween(prev.date, cur.date));
    }
    const monthlyish = gaps.filter(g => g >= 25 && g <= 35).length;
    if (monthlyish < Math.min(5, gaps.length)) continue;

    const amounts = sorted.map(t => t.amount);
    const avg = amounts.reduce((s, n) => s + n, 0) / amounts.length;
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    if (avg > 0 && (max - min) / avg > 0.15) continue;

    const monthlyAmount = Math.round(avg * 100) / 100;
    const confidence = Math.min(92, 70 + monthlyish * 4);

    findings.push({
      id: `zombie-${crypto.createHash("sha1").update(merchant).digest("hex").slice(0, 10)}`,
      title: `${merchant} recurring charge`,
      amount: monthlyAmount,
      frequency: "monthly",
      confidence,
      category: "Zombie Subscription",
      agentReasoning: "This merchant appears repeatedly with a consistent amount on a monthly cadence in the statement you uploaded.",
      agentEvidence: sorted.slice(0, 8).map(t => `${t.date}: $${t.amount} — ${t.rawLine}`),
      fixDescription: "Educational note: this looks like an ongoing recurring charge. If it's not intentional, it's a good candidate to review for potential cancellation or downgrade.",
    });
  }

  findings.sort((a, b) => b.amount - a.amount);
  return findings.slice(0, 10);
}

function monthKey(iso: string) { return iso.slice(0, 7); }

function findDuplicateSubscriptions(txs: ParsedTransaction[]): LeakInsight[] {
  const expenses = txs.filter(t => t.direction === "expense" && t.amount > 0);
  const groups = new Map<string, ParsedTransaction[]>();
  for (const t of expenses) {
    const key = `${t.merchant}::${t.amount.toFixed(2)}`;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const findings: LeakInsight[] = [];
  for (const [key, list] of groups.entries()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (!prev || !cur) continue;
      const gap = Math.abs(daysBetween(prev.date, cur.date));
      if (gap <= 5 && monthKey(prev.date) === monthKey(cur.date)) {
        const [merchant, amount] = key.split("::");
        if (!merchant || !amount) continue;
        findings.push({
          id: `dup-${crypto.createHash("sha1").update(key + prev.date).digest("hex").slice(0, 10)}`,
          title: `${merchant} charged twice`,
          amount: Number(amount),
          frequency: "monthly",
          confidence: 86,
          category: "Duplicate Subscription",
          agentReasoning: "The same merchant and amount appeared more than once within a few days in the same month in the statement you uploaded.",
          agentEvidence: [prev, cur].map(t => `${t.date}: $${t.amount} — ${t.rawLine}`),
          fixDescription: "Educational note: this may be a double-bill or overlapping subscription. If you don't expect two charges, it's worth reviewing what each one is tied to.",
        });
        break;
      }
    }
  }
  findings.sort((a, b) => b.amount - a.amount);
  return findings.slice(0, 5);
}

function buildFindings(txs: ParsedTransaction[]) {
  const dup = findDuplicateSubscriptions(txs);
  const zombies = findZombieSubscriptions(txs);
  const seen = new Set<string>();
  const merged: LeakInsight[] = [];
  for (const f of [...dup, ...zombies]) {
    const k = f.title.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(f);
  }
  return merged;
}

export async function handleUpload(req: Request): Promise<Response> {
  try {
    const supabaseUrl = requireEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const bucket = process.env.SUPABASE_DOCUMENTS_BUCKET || "documents";

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const form = await req.formData();
    const fileField = form.get("file");
    if (!fileField || typeof fileField === "string") {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const file = fileField as File;
    const mimeType = file.type || "application/pdf";
    const filename = file.name || "statement.pdf";

    if (!mimeType.includes("pdf") && !filename.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Only PDF uploads are supported right now." }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const documentId = crypto.randomUUID();
    const safeName = sanitizeFilename(filename);
    const storagePath = `${documentId}/${safeName}`;

    const insertRes = await supabase
      .from("documents")
      .insert({
        id: documentId,
        original_filename: filename,
        mime_type: mimeType,
        storage_bucket: bucket,
        storage_path: storagePath,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertRes.error) {
      return Response.json({ error: `Supabase insert failed: ${insertRes.error.message}` }, { status: 500 });
    }

    const uploadRes = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (uploadRes.error) {
      return Response.json({ error: `Storage upload failed: ${uploadRes.error.message}` }, { status: 500 });
    }

    const parsed = await pdf(fileBuffer);
    const parsedText = parsed.text || "";
    const transactions = extractTransactionsFromText(parsedText);
    const findings = buildFindings(transactions);

    const updateRes = await supabase
      .from("documents")
      .update({
        status: "processed",
        parsed_text: parsedText,
        findings: { findings, transactions_count: transactions.length },
      })
      .eq("id", documentId);

    if (updateRes.error) {
      return Response.json({ error: `Supabase update failed: ${updateRes.error.message}` }, { status: 500 });
    }

    const ogProof = await (async () => {
      try {
        const { archiveAuditPayloadToZeroG } = await import("../../lib/0g/audit");
        const audit = await archiveAuditPayloadToZeroG({
          actionType: "transaction_flagged",
          documentId,
          title: `PDF scan: ${safeName}`,
          category: "statement_upload",
          evidence: findings.map(f => `${f.title}: $${f.amount}/${f.frequency}`),
          confidence: Math.round(findings.reduce((s, f) => s + f.confidence, 0) / Math.max(findings.length, 1)),
          estimatedSavings: findings.reduce((s, f) => s + f.amount, 0),
          frequency: findings.some(f => f.frequency === "yearly") ? "yearly" : "monthly",
          createdAt: new Date().toISOString(),
        });
        await supabase.from("documents").update({
          og_storage_root_hash: audit.archive.rootHash,
          og_storage_tx_hash: audit.archive.txHash,
          og_storage_tx_seq: audit.archive.txSeq,
          og_storage_key_hash: audit.archive.keyHash,
          og_storage_status: audit.archive.status,
          og_storage_error: audit.archive.error,
          og_archived_at: audit.archive.status === "archived" ? new Date().toISOString() : null,
        }).eq("id", documentId);
        return audit.archive;
      } catch {
        return null;
      }
    })();

    return Response.json({
      documentId,
      storage: { bucket, path: storagePath },
      filename: safeName,
      findings,
      meta: { transactionsCount: transactions.length },
      ogProof: ogProof && ogProof.status === "archived" ? {
        status: ogProof.status,
        rootHash: ogProof.rootHash,
        txHash: ogProof.txHash,
        txSeq: ogProof.txSeq,
      } : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

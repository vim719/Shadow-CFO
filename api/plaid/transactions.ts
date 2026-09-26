import type { IncomingMessage, ServerResponse } from "node:http";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
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

function getPlaidClient() {
  const clientId = requireEnv("PLAID_CLIENT_ID");
  const secret = requireEnv("PLAID_SECRET");
  const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
  const basePath = env === "production" ? PlaidEnvironments.production : PlaidEnvironments.sandbox;

  return new PlaidApi(
    new Configuration({
      basePath,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": clientId,
          "PLAID-SECRET": secret,
        },
      },
    })
  );
}

async function readJson(req: IncomingMessage) {
  return await new Promise<any>((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const body = await readJson(req);
    const bankConnectionId = body?.bankConnectionId;
    const userId = typeof body?.userId === "string" && body.userId ? body.userId : null;

    if (typeof bankConnectionId !== "string" || !bankConnectionId) {
      return json(res, 400, { error: "Missing `bankConnectionId`" });
    }

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const conn = await supabase
      .from("bank_connections")
      .select("id, access_token_encrypted, user_id")
      .eq("id", bankConnectionId)
      .single();

    if (conn.error) throw new Error(`Bank connection not found: ${conn.error.message}`);
    const accessToken = conn.data.access_token_encrypted;

    const plaid = getPlaidClient();
    const endDate = new Date().toISOString().split("T")[0] || new Date().toISOString().slice(0, 10);
    const startDate = "2024-01-01";

    const response = await plaid.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    const transactions = response.data.transactions.map((t: any) => ({
      user_id: userId ?? conn.data.user_id,
      bank_connection_id: bankConnectionId,
      plaid_transaction_id: t.transaction_id,
      amount: t.amount,
      date: t.date,
      name: t.name ?? null,
      merchant_name: t.merchant_name ?? null,
      category: t.category ?? null,
      pending: Boolean(t.pending),
      transaction_type: t.transaction_type ?? null,
      iso_currency_code: t.iso_currency_code ?? "USD",
      raw_data: t,
    }));

    const insert = await supabase.from("transactions").upsert(transactions, { onConflict: "plaid_transaction_id" });
    if (insert.error) throw new Error(`Supabase upsert failed: ${insert.error.message}`);

    await supabase.from("bank_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", bankConnectionId);

    return json(res, 200, { inserted: transactions.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(res, 500, { error: message });
  }
}


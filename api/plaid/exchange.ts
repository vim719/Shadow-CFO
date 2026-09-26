import type { IncomingMessage, ServerResponse } from "node:http";
import crypto from "node:crypto";
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

async function ensureUserId(supabase: any, userId: string | null) {
  if (userId) return userId;

  // Prototype mode: create an ephemeral Supabase Auth user so `bank_connections.user_id` (NOT NULL FK)
  // is satisfied even when the app has no login flow yet.
  const email = `anon+${crypto.randomUUID()}@shadowcfo.local`;
  const password = crypto.randomBytes(18).toString("base64url");

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.error || !created.data?.user?.id) {
    throw new Error(`Supabase createUser failed: ${created.error?.message || "unknown error"}`);
  }

  return created.data.user.id;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const body = await readJson(req);
    const publicToken = body?.publicToken;
    const institutionName = body?.institutionName;
    const institutionId = body?.institutionId;
    const accountId = body?.accountId;
    const userId = typeof body?.userId === "string" && body.userId ? body.userId : null;

    if (typeof publicToken !== "string" || !publicToken) {
      return json(res, 400, { error: "Missing `publicToken`" });
    }

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const ensuredUserId = await ensureUserId(supabase, userId);

    const plaid = getPlaidClient();
    const exchange = await plaid.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    // NOTE: This stores the access token as plaintext in `access_token_encrypted`.
    // For production, replace this with real encryption (or Supabase Vault).
    const insert = await supabase
      .from("bank_connections")
      .insert({
        user_id: ensuredUserId,
        access_token_encrypted: accessToken,
        item_id: itemId,
        institution_name: typeof institutionName === "string" ? institutionName : null,
        institution_id: typeof institutionId === "string" ? institutionId : null,
        account_id: typeof accountId === "string" ? accountId : null,
        status: "active",
        last_synced_at: null,
      })
      .select("id, item_id")
      .single();

    if (insert.error) throw new Error(`Supabase insert failed: ${insert.error.message}`);

    return json(res, 200, { bankConnectionId: insert.data.id, itemId: insert.data.item_id, userId: ensuredUserId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(res, 500, { error: message });
  }
}

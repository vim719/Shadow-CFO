import type { IncomingMessage, ServerResponse } from "node:http";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const body = await new Promise<any>((resolve, reject) => {
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

    const userId = typeof body?.userId === "string" && body.userId ? body.userId : "shadow-user-123";

    const plaid = getPlaidClient();
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Shadow CFO",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });

    return json(res, 200, response.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(res, 500, { error: message });
  }
}


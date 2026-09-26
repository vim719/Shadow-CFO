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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

    const url = new URL(req.url || "", "http://localhost");
    const documentId = url.searchParams.get("documentId");
    if (!documentId) return json(res, 400, { error: "Missing `documentId`" });

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const doc = await supabase
      .from("documents")
      .select("storage_bucket, storage_path, original_filename")
      .eq("id", documentId)
      .single();

    if (doc.error) throw new Error(`Document not found: ${doc.error.message}`);
    const bucket = doc.data.storage_bucket || "documents";
    const path = doc.data.storage_path;
    if (!path) return json(res, 400, { error: "Document has no storage path" });

    const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
    if (signed.error) throw new Error(`Signed URL failed: ${signed.error.message}`);

    return json(res, 200, {
      url: signed.data.signedUrl,
      filename: doc.data.original_filename ?? null,
      expiresIn: 60 * 30,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(res, 500, { error: message });
  }
}


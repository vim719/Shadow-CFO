import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || (fallback ? process.env[fallback] : undefined);
  if (!value) throw new Error(`Missing required env var: ${name}${fallback ? ` (or ${fallback})` : ""}`);
  return value;
}

export async function handleSignedUrl(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const documentId = url.searchParams.get("documentId");
    if (!documentId) {
      return Response.json({ error: "Missing `documentId`" }, { status: 400 });
    }

    const supabaseUrl = requireEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const doc = await supabase
      .from("documents")
      .select("storage_bucket, storage_path, original_filename")
      .eq("id", documentId)
      .single();

    if (doc.error) {
      return Response.json({ error: `Document not found: ${doc.error.message}` }, { status: 404 });
    }

    const bucket = doc.data.storage_bucket || "documents";
    const path = doc.data.storage_path;
    if (!path) {
      return Response.json({ error: "Document has no storage path" }, { status: 400 });
    }

    const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
    if (signed.error) {
      return Response.json({ error: `Signed URL failed: ${signed.error.message}` }, { status: 500 });
    }

    return Response.json({
      url: signed.data.signedUrl,
      filename: doc.data.original_filename ?? null,
      expiresIn: 60 * 30,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

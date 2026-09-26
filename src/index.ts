// ============================================================================
// Shadow CFO - Backend Server Entry Point (Bun.serve)
// ============================================================================
// This file starts a Bun server that handles Plaid API routes.
// It runs separately from the Next.js frontend (Vercel deployment).
// 
// ARCHITECTURE NOTE (Important!):
// - Frontend: Deployed on Vercel (Next.js)
// - Backend: This Bun server (needs separate deployment: Railway, Fly.io, etc.)
// - Why separate? Vercel serverless functions don't support persistent Bun.serve()
// 
// ROUTES DEFINED HERE:
// 1. POST /api/plaid/link-token  → Generate Plaid Link token
// 2. POST /api/plaid/exchange    → Exchange public token for access token
// 3. POST /api/plaid/transactions → Fetch and store transactions
// ============================================================================

// Import route handlers
import { createLinkToken } from "./routes/plaid/link-token";
import { exchangePublicToken } from "./routes/plaid/exchange";
import { fetchAndStoreTransactions } from "./routes/plaid/transactions";
import { existsSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { handleUpload } from "./routes/documents/upload-analyze";
import { handleSignedUrl } from "./routes/documents/signed-url";
import { handleAnalyze } from "./routes/harness/analyze";

// ============================================================================
// SANITY TEST: Check environment variables at startup
// ============================================================================
// These console.logs help verify that environment variables are loaded correctly.
// If any show "UNDEFINED", the server won't work properly with Plaid/Supabase.
console.log("🧪 Sanity test (startup):");
console.log("PLAID_CLIENT_ID:", process.env.PLAID_CLIENT_ID ? "✅ OK" : "❌ UNDEFINED!");
console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ OK" : "❌ UNDEFINED!");
console.log("SUPABASE_SERVICE_ROLE:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ OK" : "❌ UNDEFINED!");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ OK" : "❌ UNDEFINED!");

// ============================================================================
// MIME types for static file serving
// ============================================================================
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

// ============================================================================
// Static file serving helper
// ============================================================================
function serveStatic(url: string): Response | null {
  const publicDir = join(import.meta.dir, "..", "public");
  const filePath = url === "/" ? join(publicDir, "index.html") : join(publicDir, url);
  if (!existsSync(filePath)) return null;
  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
  const content = readFileSync(filePath);
  return new Response(content, { headers: { "Content-Type": contentType } });
}

// ============================================================================
// API route handlers
// ============================================================================
const apiRoutes: Record<string, Record<string, (req: Request) => Promise<Response>>> = {
  "/api/plaid/link-token": {
    POST: async () => {
      try {
        const data = await createLinkToken();
        return Response.json(data);
      } catch (error) {
        console.error("Link token creation failed:", error);
        return Response.json({ error: "Failed to create link token" }, { status: 500 });
      }
    },
  },
  "/api/plaid/exchange": {
    POST: async (req) => {
      try {
        const { public_token } = await req.json();
        if (!public_token) {
          return Response.json({ error: "Missing public_token" }, { status: 400 });
        }
        const data = await exchangePublicToken(public_token);
        return Response.json(data);
      } catch (error) {
        console.error("Token exchange failed:", error);
        return Response.json({ error: "Failed to exchange token" }, { status: 500 });
      }
    },
  },
  "/api/plaid/transactions": {
    POST: async (req) => {
      try {
        const { access_token } = await req.json();
        if (!access_token) {
          return Response.json({ error: "Missing access_token" }, { status: 400 });
        }
        const count = await fetchAndStoreTransactions(access_token);
        return Response.json({ success: true, inserted: count });
      } catch (error) {
        console.error("Transaction fetch failed:", error);
        return Response.json({ error: "Failed to fetch transactions" }, { status: 500 });
      }
    },
  },
  "/api/documents/upload-analyze": {
    POST: handleUpload,
  },
  "/api/documents/signed-url": {
    GET: handleSignedUrl,
  },
  "/api/analyze": {
    POST: handleAnalyze,
  },
};

// ============================================================================
// Bun.serve - HTTP Server
// ============================================================================
Bun.serve({
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Try API routes first
    const route = apiRoutes[path];
    if (route) {
      const handler = route[req.method];
      if (handler) return handler(req);
      return new Response("Method not allowed", { status: 405 });
    }

    // Fall through to static file serving (local dev only)
    const staticResponse = serveStatic(path);
    if (staticResponse) return staticResponse;

    return new Response("Not found", { status: 404 });
  },

  error(error: Error) {
    console.error("Server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

// Log that server is ready
console.log("🚀 Shadow CFO Backend (Bun) is running...");
console.log("   Endpoints:");
console.log("   - POST /api/plaid/link-token");
console.log("   - POST /api/plaid/exchange");
console.log("   - POST /api/plaid/transactions");
console.log("   - POST /api/analyze");

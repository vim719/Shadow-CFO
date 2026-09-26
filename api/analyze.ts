// ============================================================================
// Recursive Harness — Vercel serverless function for POST /api/analyze
// ============================================================================
// Thin Node adapter around the shared runAnalysis() orchestration so the
// Bun dev server and the deployed site behave identically.
// ============================================================================

import type { IncomingMessage, ServerResponse } from "node:http";
import { runAnalysis } from "../src/routes/harness/analyze";

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    return json(res, 200, await runAnalysis());
  } catch (error) {
    console.error("Harness analysis failed:", error);
    return json(res, 500, { error: "Failed to run harness analysis" });
  }
}

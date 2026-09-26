// ============================================================================
// Recursive Harness — Vercel serverless function for POST /api/analyze
// ============================================================================
// Self-contained: the Vercel bundler does not follow imports outside api/
// (see CHANGELOG 0.3.0 "Vercel serverless bundle exclusion"), so this handler
// inlines the harness logic instead of importing from src/. The Bun dev
// server keeps the shared implementation in src/routes/harness/analyze.ts.
// ============================================================================

import type { IncomingMessage, ServerResponse } from "node:http";
import { MongoClient } from "mongodb";

const HARNESS_KEY = "default";
const CHURN_RULE =
  "Always cross-verify cash runway against upcoming recurring SaaS renewals";
const DB_NAME = process.env.MONGODB_DB_NAME || "shadowcfo";

const SAMPLE = {
  cashBalance: 120_000,
  monthlyBurn: 15_000,
  upcomingRenewal: { name: "Enterprise SaaS suite", amount: 5_000 },
};

type HarnessConfig = {
  key: string;
  version: number;
  rules: string[];
  guardrails: { max_unsupported_assumptions: number };
  active_tools: string[];
  evolution_history: {
    version: number;
    triggeredAt: string;
    triggerReason: string;
    addedRule: string;
    previousVersion: number;
  }[];
  createdAt?: string;
  updatedAt?: string;
};

type AnalyzeResponse = {
  result: {
    runwayMonths: number;
    accountedForRenewal: boolean;
    note: string;
  };
  harness: HarnessConfig;
  evolved: boolean;
};

// ponytail: module-scope cache, fine for warm serverless instances
let cachedClient: MongoClient | null = null;

async function getCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, { maxPoolSize: 10 });
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME).collection<HarnessConfig>("harness_configs");
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const col = await getCollection();
    let harness = await col.findOne({ key: HARNESS_KEY });
    if (!harness) {
      const now = new Date().toISOString();
      const seed: HarnessConfig = {
        key: HARNESS_KEY,
        version: 1,
        rules: ["Compute runway as cash balance divided by monthly burn rate."],
        guardrails: { max_unsupported_assumptions: 0 },
        active_tools: ["calculate_runway"],
        evolution_history: [],
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne({ ...seed, _id: undefined });
      harness = seed;
    }
    const current: HarnessConfig = (({ _id, ...rest }) => rest)(harness as HarnessConfig & { _id?: unknown });

    const honorsChurnRule = current.rules.includes(CHURN_RULE);
    const effectiveBurn = honorsChurnRule
      ? SAMPLE.monthlyBurn + SAMPLE.upcomingRenewal.amount
      : SAMPLE.monthlyBurn;
    const runwayMonths = Math.floor(SAMPLE.cashBalance / effectiveBurn);
    const result = {
      runwayMonths,
      accountedForRenewal: honorsChurnRule,
      note: honorsChurnRule
        ? `Includes the upcoming ${SAMPLE.upcomingRenewal.name} renewal ($${SAMPLE.upcomingRenewal.amount}/mo).`
        : `Did NOT account for the upcoming ${SAMPLE.upcomingRenewal.name} renewal — runway is overstated.`,
    };
    const unsupportedAssumptions = honorsChurnRule ? 0 : 1;

    let updatedHarness = current;
    let evolved = false;

    if (unsupportedAssumptions > current.guardrails.max_unsupported_assumptions) {
      const nextVersion = current.version + 1;
      const now = new Date().toISOString();
      updatedHarness = {
        ...current,
        version: nextVersion,
        rules: [...current.rules, CHURN_RULE],
        evolution_history: [
          ...current.evolution_history,
          {
            version: nextVersion,
            triggeredAt: now,
            triggerReason:
              "Runway projection ignored a known upcoming recurring cost",
            addedRule: CHURN_RULE,
            previousVersion: current.version,
          },
        ],
        updatedAt: now,
      };
      await col.replaceOne({ key: HARNESS_KEY }, updatedHarness);
      evolved = true;
    }

    const response: AnalyzeResponse = { result, harness: updatedHarness, evolved };
    return json(res, 200, response);
  } catch (error) {
    console.error("Harness analysis failed:", error);
    return json(res, 500, { error: "Failed to run harness analysis" });
  }
}

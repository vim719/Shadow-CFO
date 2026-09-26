// ============================================================================
// Recursive Harness — Runway Analysis Endpoint
// ============================================================================
// Loads the agent harness from MongoDB, runs a canned cash-runway analysis,
// evaluates the result against the harness guardrails, and mutates the harness
// (adds a rule + bumps version) when a known recurring cost is ignored.
// ============================================================================

import { getDb } from "../../lib/mongodb";

export const HARNESS_KEY = "default";

export type HarnessRule = string;

export type HarnessEvolutionEvent = {
  version: number;
  triggeredAt: string;
  triggerReason: string;
  addedRule: HarnessRule;
  previousVersion: number;
};

export type HarnessConfig = {
  key: string;
  version: number;
  rules: HarnessRule[];
  guardrails: { max_unsupported_assumptions: number };
  active_tools: string[];
  evolution_history: HarnessEvolutionEvent[];
  createdAt?: string;
  updatedAt?: string;
};

// Canned sample data for the demo — later this will come from Plaid/real ledgers.
const SAMPLE = {
  cashBalance: 120_000,
  monthlyBurn: 15_000,
  upcomingRenewal: { name: "Enterprise SaaS suite", amount: 5_000 },
};

export const CHURN_RULE =
  "Always cross-verify cash runway against upcoming recurring SaaS renewals";

export interface AnalysisResult {
  runwayMonths: number;
  accountedForRenewal: boolean;
  note: string;
}

export interface AnalyzeResponse {
  result: AnalysisResult;
  harness: HarnessConfig;
  evolved: boolean;
}

/**
 * Pure evaluator: decide whether the current harness misses the renewal rule.
 */
export function evaluateRunway(harness: HarnessConfig): {
  result: AnalysisResult;
  unsupportedAssumptions: number;
} {
  const honorsChurnRule = harness.rules.includes(CHURN_RULE);

  const effectiveBurn = honorsChurnRule
    ? SAMPLE.monthlyBurn + SAMPLE.upcomingRenewal.amount
    : SAMPLE.monthlyBurn;

  const runwayMonths = Math.floor(SAMPLE.cashBalance / effectiveBurn);

  const result: AnalysisResult = {
    runwayMonths,
    accountedForRenewal: honorsChurnRule,
    note: honorsChurnRule
      ? `Includes the upcoming ${SAMPLE.upcomingRenewal.name} renewal ($${SAMPLE.upcomingRenewal.amount}/mo).`
      : `Did NOT account for the upcoming ${SAMPLE.upcomingRenewal.name} renewal — runway is overstated.`,
  };

  const unsupportedAssumptions = honorsChurnRule ? 0 : 1;
  return { result, unsupportedAssumptions };
}

/**
 * Pure evolution step: build the next harness version when a guardrail is hit.
 */
export function evolveHarness(
  current: HarnessConfig,
  newRule: string,
  reason: string
): HarnessConfig {
  const nextVersion = current.version + 1;
  const now = new Date().toISOString();

  return {
    ...current,
    version: nextVersion,
    rules: current.rules.includes(newRule)
      ? current.rules
      : [...current.rules, newRule],
    evolution_history: [
      ...current.evolution_history,
      {
        version: nextVersion,
        triggeredAt: now,
        triggerReason: reason,
        addedRule: newRule,
        previousVersion: current.version,
      },
    ],
    updatedAt: now,
  };
}

/**
 * Load the current harness config from MongoDB.
 */
export async function getHarness(): Promise<HarnessConfig> {
  const db = await getDb();
  const col = db.collection<HarnessConfig>("harness_configs");
  const existing = await col.findOne({ key: HARNESS_KEY });

  if (existing) {
    // Strip MongoDB's _id before returning.
    const { _id, ...rest } = existing as HarnessConfig & { _id?: unknown };
    return rest;
  }

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

  await col.insertOne(seed);
  return seed;
}

/**
 * Persist an evolved harness config back to MongoDB.
 */
export async function commitHarnessVersion(
  current: HarnessConfig,
  newRule: string,
  reason: string
): Promise<HarnessConfig> {
  const db = await getDb();
  const col = db.collection<HarnessConfig>("harness_configs");
  const updated = evolveHarness(current, newRule, reason);

  await col.replaceOne({ key: HARNESS_KEY }, updated);
  return updated;
}

/**
 * Shared orchestration: load harness, evaluate, evolve if guardrails are violated.
 * Used by both the Bun.serve route and the Vercel serverless function.
 */
export async function runAnalysis(): Promise<AnalyzeResponse> {
  const harness = await getHarness();
  const { result, unsupportedAssumptions } = evaluateRunway(harness);

  let updatedHarness = harness;
  let evolved = false;

  if (unsupportedAssumptions > harness.guardrails.max_unsupported_assumptions) {
    updatedHarness = await commitHarnessVersion(
      harness,
      CHURN_RULE,
      "Runway projection ignored a known upcoming recurring cost"
    );
    evolved = true;
  }

  return {
    result,
    harness: updatedHarness,
    evolved,
  };
}

/**
 * Bun.serve handler for POST /api/analyze
 */
export async function handleAnalyze(_req: Request): Promise<Response> {
  try {
    return Response.json(await runAnalysis());
  } catch (error) {
    console.error("Harness analysis failed:", error);
    return Response.json(
      { error: "Failed to run harness analysis" },
      { status: 500 }
    );
  }
}

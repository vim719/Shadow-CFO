# MongoDB Atlas Integration

Shadow CFO uses MongoDB Atlas as the storage layer for its **recursive harness** — the mechanism that lets the agent evolve its own rules, guardrails, and tool access without a code deploy.

## Why Atlas

The harness's rules don't have a fixed shape. A guardrail today might be a number (`max_unsupported_assumptions: 0`); a rule the agent adds tomorrow might be a new nested policy no one designed for in advance. A rigid relational schema would need a migration every time the agent's own rule set grows a new shape. A document store doesn't — `harness_configs` just accepts whatever the agent writes, and the full evolution history rides along in the same document, so "show me every version this agent has ever been, and why" is a single read.

## Where it's used

Atlas stores one document, in the `shadowcfo` database, `harness_configs` collection:

```json
{
  "key": "default",
  "version": 2,
  "rules": [
    "Compute runway as cash balance divided by monthly burn rate.",
    "Always cross-verify cash runway against upcoming recurring SaaS renewals"
  ],
  "guardrails": { "max_unsupported_assumptions": 0 },
  "active_tools": ["calculate_runway"],
  "evolution_history": [
    {
      "version": 2,
      "triggeredAt": "...",
      "triggerReason": "Runway projection ignored a known upcoming recurring cost",
      "addedRule": "Always cross-verify cash runway against upcoming recurring SaaS renewals",
      "previousVersion": 1
    }
  ]
}
```

**Connection path:**

```
Bun server → mongodb@6 driver → MONGODB_URI → MongoDB Atlas Cluster0 → shadowcfo.harness_configs
```

The connection is cached in `src/lib/mongodb.ts` so `Bun.serve` hot reload doesn't open a new connection per request.

## The recursive-harness workflow

1. **Seed** — `scripts/seed-harness.ts` creates the v1 harness with one basic rule.
2. **Run analysis** — `POST /api/analyze`:
   - Loads the current harness from Atlas.
   - Calculates runway from the request's financial data.
   - Checks whether the harness already contains the renewal rule.
   - If not, that counts as an *unsupported assumption* (1 > guardrail max of 0).
3. **Evolve** — the harness mutates itself:
   - Appends the missing rule.
   - Increments `version`.
   - Writes the event to `evolution_history`.
   - Saves back to Atlas (`replaceOne`).
4. **Run again** — the same endpoint now sees the rule, computes the corrected runway, and doesn't evolve.

That's the self-improving mechanism: the rules are data in Atlas, and the agent rewrites its own rules the moment it detects a guardrail violation.

## Local setup

1. Create a free Atlas cluster (M0 is enough for this collection).
2. Add a database user and allow-list your IP (or `0.0.0.0/0` for local dev only).
3. Copy the connection string into `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/shadowcfo
   ```
4. Run the seed script once: `bun run scripts/seed-harness.ts`
5. Start the server — `POST /api/analyze` will now read/write the live harness document.

## What's intentionally out of scope

`agent_memories` (vector-embedded long-term memory) and `execution_logs`/`metrics` (time-series performance tracking) are not part of this implementation. Those support a different problem — long-horizon context and goal tracking — rather than the rule-evolution mechanism this integration demonstrates.

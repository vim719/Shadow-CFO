import { getDb } from "../src/lib/mongodb";

const HARNESS_KEY = "default";

async function seed() {
  const db = await getDb();
  const collection = db.collection("harness_configs");

  const existing = await collection.findOne({ key: HARNESS_KEY });
  if (existing) {
    console.log("Harness config already seeded (version", existing.version, ")");
    process.exit(0);
  }

  const now = new Date().toISOString();
  await collection.insertOne({
    key: HARNESS_KEY,
    version: 1,
    rules: ["Compute runway as cash balance divided by monthly burn rate."],
    guardrails: { max_unsupported_assumptions: 0 },
    active_tools: ["calculate_runway"],
    evolution_history: [],
    createdAt: now,
    updatedAt: now,
  });

  console.log("✅ Seeded initial harness config v1");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed harness config:", err);
  process.exit(1);
});

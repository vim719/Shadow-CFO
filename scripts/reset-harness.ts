import { getDb } from "../src/lib/mongodb";

const HARNESS_KEY = "default";

async function reset() {
  const db = await getDb();
  const col = db.collection("harness_configs");
  await col.deleteOne({ key: HARNESS_KEY });
  console.log("🧹 Reset harness config");
  process.exit(0);
}

reset().catch((err) => {
  console.error("Failed to reset harness config:", err);
  process.exit(1);
});

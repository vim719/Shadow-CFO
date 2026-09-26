// ============================================================================
// MongoDB Atlas Client for Backend Routes
// ============================================================================
// Provides a cached MongoClient connection for Bun.serve routes.
// The client promise is cached in module scope so hot reload does not open
// a new connection on every request.
// ============================================================================

import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "shadowcfo";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
  });

  await client.connect();
  cachedClient = client;
  console.log("✅ Connected to MongoDB Atlas");
  return client;
}

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await getMongoClient();
  cachedDb = client.db(dbName);
  return cachedDb;
}

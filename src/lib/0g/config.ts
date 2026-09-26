import crypto from "node:crypto";

export const zeroGConfig = {
  enabled: process.env.ZERO_G_ENABLED === "true",
  evmRpc: process.env.OG_EVM_RPC_URL || "https://evmrpc-testnet.0g.ai",
  indexerRpc: process.env.OG_INDEXER_RPC_URL || "https://indexer-storage-testnet-turbo.0g.ai",
  daRpc: process.env.OG_DA_RPC_URL || "https://disperser-testnet.0g.ai",
  encryptionKey: process.env.ZERO_G_ENCRYPTION_KEY,
};

if (zeroGConfig.enabled && (!zeroGConfig.encryptionKey || zeroGConfig.encryptionKey.length !== 64)) {
  throw new Error("Configuration Error: ZERO_G_ENCRYPTION_KEY must be an active 64-character hex string.");
}

export function getEncryptionKeyBytes(): Uint8Array | null {
  if (!zeroGConfig.encryptionKey) return null;
  const raw = Buffer.from(zeroGConfig.encryptionKey.replace(/^0x/i, ""), "hex");
  if (raw.byteLength !== 32) return null;
  return new Uint8Array(raw);
}

export function getEncryptionKeyHash(): string | null {
  const bytes = getEncryptionKeyBytes();
  if (!bytes) return null;
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

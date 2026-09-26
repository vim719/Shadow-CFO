import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import { zeroGConfig, getEncryptionKeyBytes, getEncryptionKeyHash } from "./config";
import { createClient } from "@supabase/supabase-js";

export type ZeroGArchiveResult = {
  status: "not_configured" | "archived" | "failed";
  rootHash: string | null;
  txHash: string | null;
  txSeq: number | null;
  keyHash: string | null;
  error: string | null;
};

function normalizeUploadResult(result: unknown): Pick<ZeroGArchiveResult, "rootHash" | "txHash" | "txSeq"> {
  const candidate = result as { rootHash?: string; txHash?: string; txSeq?: number; rootHashes?: string[]; txHashes?: string[]; txSeqs?: number[] };
  return {
    rootHash: candidate.rootHash ?? candidate.rootHashes?.[0] ?? null,
    txHash: candidate.txHash ?? candidate.txHashes?.[0] ?? null,
    txSeq: candidate.txSeq ?? candidate.txSeqs?.[0] ?? null,
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSponsorWallet(provider: ethers.JsonRpcProvider): Promise<ethers.Wallet> {
  // Prefer env var for local dev; production uses Supabase Vault.
  const envKey = process.env.ZERO_G_SPONSOR_PRIVATE_KEY;
  if (envKey) return new ethers.Wallet(envKey, provider);

  // Fetch from Supabase Vault (production path).
  // Vault secret name: ZERO_G_SPONSOR_PRIVATE_KEY
  const { data, error } = await supabase.rpc("read_vault_secret", {
    secret_name: "ZERO_G_SPONSOR_PRIVATE_KEY",
  });
  if (error || !data) {
    throw new Error("0G sponsor key not found in env or Supabase Vault");
  }
  return new ethers.Wallet(data as string, provider);
}

export async function archiveBufferToZeroG(buffer: Buffer, label: string): Promise<ZeroGArchiveResult> {
  if (!zeroGConfig.enabled) {
    return { status: "not_configured", rootHash: null, txHash: null, txSeq: null, keyHash: null, error: null };
  }

  const encryptionKey = getEncryptionKeyBytes();
  const keyHash = getEncryptionKeyHash();
  if (!encryptionKey || !keyHash) {
    return { status: "failed", rootHash: null, txHash: null, txSeq: null, keyHash: null, error: "Encryption key not configured or invalid" };
  }

  try {
    const indexer = new Indexer(zeroGConfig.indexerRpc);
    const provider = new ethers.JsonRpcProvider(zeroGConfig.evmRpc);
    const wallet = await getSponsorWallet(provider);
    const file = new MemData(new Uint8Array(buffer));
    const [upload, uploadError] = await indexer.upload(file, zeroGConfig.evmRpc, wallet, {
      encryption: { type: "aes256", key: encryptionKey },
      onProgress: (message) => console.info(`[0G:${label}] ${message}`),
    });

    if (uploadError) throw uploadError;

    const normalized = normalizeUploadResult(upload);
    if (!normalized.rootHash) throw new Error("0G upload completed without a root hash");

    return {
      status: "archived",
      rootHash: normalized.rootHash,
      txHash: normalized.txHash,
      txSeq: normalized.txSeq,
      keyHash,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown 0G Storage error";
    console.warn(`[0G:${label}] archive failed: ${message}`);
    return { status: "failed", rootHash: null, txHash: null, txSeq: null, keyHash, error: message };
  }
}

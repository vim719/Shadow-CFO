# Changelog

All notable changes to Shadow CFO are documented here.

## [0.3.0] — 2026-06-18

### Added
- 0G Storage archival for audit payloads: encrypted PDF scan findings archived to 0G decentralized storage on every bank statement upload
- 0G Trust Proof badge on scan results screen showing archival status, root hash, and transaction hash with link to 0G Chain Explorer
- Dedicated Bun server routes for document upload (`/api/documents/upload-analyze`) and signed URL generation (`/api/documents/signed-url`) to support local development
- Static file serving from Bun server (`public/` directory) so the frontend SPA works locally
- 0G import diagnostic endpoint to debug Vercel serverless bundle exclusion
- Error logging to 0G catch block in Vercel upload handler for debugging

### Fixed
- Vercel serverless bundle exclusion: inlined 0G SDK calls directly into upload handler (Vercel bundler did not include `src/lib/0g/` files referenced via dynamic `import()`)
- TypeScript TS2345 error in `audit-action.ts`: added runtime payload cast for Vercel build
- Updated 0G indexer endpoint to Galileo V3 turbo endpoint (`indexer-storage-testnet-turbo.0g.ai`) — old endpoint was deprecated
- Stale `.env.local` with dead Supabase project URL that blocked local development
- Supabase env var name mismatch: added fallback from `SUPABASE_URL` to `NEXT_PUBLIC_SUPABASE_URL` in local handlers

### Changed
- Upload handler on Vercel uses `@0gfoundation/0g-storage-ts-sdk` and `ethers` directly instead of importing from `src/lib/0g/` wrapper
- Frontend rebuilt with Tailwind CSS v4.2

### Removed
- 0G import diagnostic endpoint after confirming fix

## [0.2.0] — 2026-06-17

### Added
- Logo, project preview, and thumbnail assets to `public/`

### Fixed
- Restored project-preview and thumbnail to full native resolution (removed unintended downscale)

## [0.1.0] — 2026-06-16

### Added (0G Integration)
- 0G Storage SDK integration: `Indexer`, `MemData`, encrypted upload with AES-256 via `@0gfoundation/0g-storage-ts-sdk`
- 0G Galileo testnet configuration (`config.ts`) with `ZERO_G_ENABLED`, RPC URLs, encryption key, and sponsor wallet
- `archiveBufferToZeroG()` in `storage.ts`: encrypted file archival to 0G decentralized storage with sponsor wallet from env or Supabase Vault
- `createAuditCommitment()` and `archiveAuditPayloadToZeroG()` in `audit.ts`: SHA-256 commitment generation + optional 0G archival for audit trails
- `verifyLedgerBalances()`: double-entry accounting check for ShadowLedger
- 0G Compute TEE broker (`compute.ts`): `executeVerifiableAudit()` for verifiable AI risk scoring via `@0gfoundation/0g-compute-ts-sdk`
- Gas watcher: monitors sponsor wallet balance, alerts via Telegram if below 0.01 A0GI
- `read_vault_secret` Supabase RPC for fetching sponsor key from Vault in production
- `fix-transaction` Vercel route (`/api/0g/fix-transaction`): TEE-verified "Fix It" button endpoint
- `zero_g_audit_events` table with sync status, retry loop, and CRON scheduler (`retry-sync` edge function)
- `VerificationBadge` React component showing 0G Trust Proof UI (status, rootHash, txHash, chain explorer link)
- `FirstLeakScreen` wired to display `VerificationBadge` from `sessionStorage` after scan
- `zero_g_audit_events` table columns for status, commitment hash, and storage metadata
- Database migrations for 0G tables (`zero_g_audit_events`, `audited_transactions`, columns on `documents`)

### Fixed
- Sponsor key resolution: falls back from env var (`ZERO_G_SPONSOR_PRIVATE_KEY`) to Supabase Vault `read_vault_secret` RPC
- Vault schema access: moved RPC to `public.read_vault_secret` (vault schema was restricted)
- Gas alert channel: swapped from Slack webhook to Telegram for reliability
- Telegram credentials: read from Supabase Vault instead of env vars
- Audit archival: removed premature wiring from upload pipeline that caused import-time crash when `ZERO_G_ENABLED=true` on Vercel — switched to lazy `import()` pattern
- Debug logging added to `audit-action.ts` to trace silent failures on Vercel

### Changed
- Plaid + Supabase + 0G env vars moved to production-only on Vercel

## [0.0.1] — 2026-06-14

### Added
- Plaid bank account connection (link token, exchange, transaction fetch)
- PDF statement upload with transaction parsing and duplicate/zombie subscription detection
- Supabase database for documents, transactions, and user data
- React SPA frontend with landing page, upload screen, and leak detection results
- Bun HTTP server for Plaid API routes

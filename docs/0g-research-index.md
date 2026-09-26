# 0G Research Index for ShadowCFO

Last reviewed: 2026-06-16

## Purpose

This index captures the working knowledge needed to evaluate and implement 0G integrations in ShadowCFO. It is not a verbatim mirror of 0G documentation. Use it as a project-local map, then verify live values against the official docs before production deployment.

## Source Map

| Source | Role in research | ShadowCFO relevance |
| --- | --- | --- |
| https://0g.ai/ | 0G product positioning and stack overview. | Frames 0G as modular AI infrastructure for agents: chain, compute, storage, data availability, service marketplace, alignment nodes, and dApps. |
| https://build.0g.ai/ | Builder hub landing page. | Entry point for builders, docs, hacker guide, and no-code/AI-coding resources. |
| https://pc.0g.ai/ | 0G Private Computer and model marketplace. | Useful for verifiable/private AI inference options if ShadowCFO moves sensitive AI workloads beyond current providers. |
| https://hub.0g.ai/discover | Ecosystem discovery hub. | Useful for finding examples, ecosystem apps, and partner projects. The public page is app-rendered, so verify in browser when needed. |
| https://docs.0g.ai/ | Main documentation portal. | Official source for network details, product docs, developer flows, and the maintained AI coding context. |
| https://docs.0g.ai/ai-context | AI coding assistant context. | Best single reference for future Codex work because it aggregates network configs, contracts, SDK examples, services, starter kits, and quick references. |
| https://docs.0g.ai/developer-hub/getting-started | Developer hub overview. | Explains the modular service choices: Chain, Compute, Storage, DA. |
| https://docs.0g.ai/developer-hub/building-on-0g/introduction | Build-path selector. | Confirms 0G services can be added to Web2 apps and existing chains without migrating everything. |
| https://build.0g.ai/zero-coding | AI-coding resource page. | Points builders to 0G App, Claude Code, Cursor, recommended context docs, and 0G skills/resources. |
| https://build.0g.ai/hacker-guide | Quick reference for hackathon/building. | Fast source for model provider addresses, chain IDs, RPC URLs, storage indexer URLs, and faucet links. |
| https://github.com/0gfoundation/0g-storage-web-starter-kit | Browser storage starter kit. | Reference for wallet-connected upload/download UI patterns. |
| https://github.com/0gfoundation/0g-storage-ts-starter-kit | TypeScript storage starter kit. | Reference for backend scripts, encrypted upload/download, KV storage, and reusable TS storage flows. |
| https://github.com/0gfoundation/0g-compute-ts-starter-kit | TypeScript compute starter kit. | Reference for compute service listing, provider acknowledgment, provider funding, and inference flows. |
| https://github.com/0gfoundation/mcp-0g | MCP server for 0G. | Candidate tool surface for wallet, balance, token, transaction, faucet, and contract deployment operations through MCP-compatible assistants. |
| https://github.com/0gfoundation/awesome-0g | Ecosystem index. | Discovery map for community projects, official resources, guides, examples, and ecosystem categories. |

## Core 0G Model

0G is a modular AI blockchain stack intended for decentralized AI applications. The major building blocks are:

* `0G Chain`: EVM-compatible chain optimized for AI workloads and high throughput.
* `0G Compute`: decentralized GPU and inference marketplace with verifiable/private execution options.
* `0G Storage`: decentralized storage for datasets, files, and application data.
* `0G DA`: data availability layer for rollups and high-throughput applications.
* `Agentic IDs`: ERC-7857-oriented tokenization of AI agents and their encrypted/dynamic metadata.
* `0G Hub` / ecosystem: discovery, examples, and service marketplace surface.

## Network Constants

Verify before production use.

### Testnet: Galileo

| Field | Value |
| --- | --- |
| Chain ID | `16602` |
| Token | `0G` |
| Development RPC | `https://evmrpc-testnet.0g.ai` |
| Chain explorer | `https://chainscan-galileo.0g.ai` |
| Storage explorer | `https://storagescan-galileo.0g.ai` |
| Faucet | `https://faucet.0g.ai` |
| Storage indexer | `https://indexer-storage-testnet-turbo.0g.ai` |
| Storage Flow contract | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| Storage Mine contract | `0x00A9E9604b0538e06b268Fb297Df333337f9593b` |
| Storage Reward contract | `0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69` |
| DAEntrance contract | `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` |

### Mainnet

| Field | Value |
| --- | --- |
| Chain ID | `16661` |
| Token | `0G` |
| RPC | `https://evmrpc.0g.ai` |
| Storage indexer | `https://indexer-storage-turbo.0g.ai` |
| Chain explorer | `https://chainscan.0g.ai` |
| Storage Flow contract | `0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526` |
| Storage Mine contract | `0xCd01c5Cd953971CE4C2c9bFb95610236a7F414fe` |
| Storage Reward contract | `0x457aC76B58ffcDc118AABD6DbC63ff9072880870` |

## Compute Notes

0G Compute has two developer paths:

* `Router`: recommended for server-side apps, agents, and prototypes. It exposes OpenAI/Anthropic-compatible API shapes, one API key, unified balance, provider discovery, billing, and failover.
* `Direct`: recommended for browser dApps, wallet-signed requests, or explicit per-provider control. It uses the `@0gfoundation/0g-compute-ts-sdk` SDK and per-provider sub-accounts.

The Router supports an OpenAI-compatible `POST /v1/chat/completions` endpoint with streaming, tool calling, JSON mode, and reasoning-token models when the selected model advertises support. The live model catalog is available at `https://router-api.0g.ai/v1/models` and through `pc.0g.ai`.

Hacker guide model references included:

| Model | Use | Provider address |
| --- | --- | --- |
| `llama-3.3-70b-instruct` | General AI tasks | `0xf07240Efa67755B5311bc75784a061eDB47165Dd` |
| `deepseek-r1-70b` | Advanced reasoning | `0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3` |
| `qwen2.5-vl-72b-instruct` | Vision-language tasks | `0x6D233D2610c32f630ED53E8a7Cbf759568041f8f` |

Private Computer emphasizes verifiable routing, TEE-based privacy, cryptographic attestation, low-cost provider competition, and model/provider proof metadata. For ShadowCFO, treat this as relevant only for server-side workloads and never expose API keys or wallet secrets to the browser.

## Storage Notes

0G Storage has Go and TypeScript SDKs. The TypeScript path is the best match for ShadowCFO.

Useful patterns from the docs and starter kits:

* Upload/download files with the TypeScript SDK.
* Use browser `File`/`Blob` support through wallet-connected flows where appropriate.
* Use backend/server-side flows for sensitive document upload, indexing, and user-owned file metadata.
* Use encryption for sensitive files.
* For encrypted downloads, prefer `downloadToBlob()` with decryption options; the starter-kit docs warn that direct disk download does not support decryption hooks.
* Store root hashes and metadata in Supabase, not raw sensitive file contents.

Potential ShadowCFO use cases:

* Verifiable external storage for uploaded financial documents after Supabase records ownership and access metadata.
* Encrypted storage of non-PII derived artifacts, such as analysis records or signed recommendation bundles.
* Audit trail attachment storage for user-approved actions, if legal/compliance review approves.

## Chain Notes

0G Chain is EVM-compatible. The docs position it as compatible with Hardhat, Foundry, Remix, `ethers`, and familiar smart-contract deployment tooling.

For ShadowCFO, chain usage should stay narrow until there is a clear product requirement:

* Membership credential or proof artifact experiments.
* Non-transferable `$SOLV` proof-of-achievement prototype, only after legal/product review.
* Public proof of action completion without publishing private financial details.

Do not put user financial data, Plaid data, documents, or personally identifying metadata onchain.

## Agentic ID Notes

Agentic IDs are 0G's AI-agent ownership/transfer pattern, connected to ERC-7857. The idea is to represent AI agents with secure ownership, encrypted/dynamic metadata, and transfer mechanisms that include the underlying agent intelligence rather than a static NFT pointer.

Potential fit for ShadowCFO is future-facing:

* A user-owned financial agent identity.
* A family/Legacy Vault agent that can preserve policy, instructions, and permissions.
* Tokenized agent capability bundles.

This should be treated as exploratory until ShadowCFO has a concrete privacy, compliance, and custody design.

## MCP Notes

`0gfoundation/mcp-0g` exposes 0G operations to MCP-compatible assistants. The public README describes capabilities such as:

* monitoring 0G testnet activity,
* querying contract state and balances,
* estimating transaction costs,
* faucet access,
* wallet management with encryption,
* token transfers and approvals,
* Solidity compile/deploy workflows,
* transaction approval workflows and spending limits.

For ShadowCFO, the MCP route is useful for developer workflows, not direct user-facing production behavior unless carefully reviewed.

## Suggested ShadowCFO Integration Order

1. Research spike only: map 0G Storage and Compute to ShadowCFO use cases without changing production behavior.
2. 0G Storage proof of concept: encrypted upload of a non-sensitive test artifact, root hash stored in Supabase.
3. 0G Compute proof of concept: server-side Router call behind a feature flag for non-sensitive demo analysis.
4. Compliance review: decide whether any `$SOLV`, audit, document, or AI inference use case can leave the current Supabase/Vercel boundary.
5. Product spec: use `features/template` and `docs/agent-committee.md` before implementing a real user-facing feature.

## Security Rules for ShadowCFO

* Never expose wallet private keys, 0G API keys, Supabase service role keys, Plaid secrets, or compute provider credentials in frontend code.
* Do not send Plaid transaction details or financial documents to 0G Compute until there is explicit user consent, data-processing policy, and privacy review.
* Prefer testnet for all early work.
* Store only 0G references, hashes, and operational metadata in Supabase.
* Keep every external AI/storage action tied to a deterministic audit record and user ownership checks.

## Open Questions

* Should 0G be used first for storage, compute, or `$SOLV`/credential experiments?
* Is ShadowCFO willing to use decentralized infrastructure for regulated financial workflows, or should 0G remain limited to public/non-sensitive artifacts?
* Should a Codex/Claude project skill be added later that loads this index and the official `https://docs.0g.ai/ai-context` page before any 0G-related implementation?
* Does the current `.codex-plugin/plugin.json` need additional 0G-oriented prompts or commands, or should 0G stay as docs-only until a feature spec is approved?

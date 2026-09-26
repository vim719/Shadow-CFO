# Technical Requirements

## 1. Architecture

### Current Architecture

Shadow CFO is currently a Bun-based app with a static front-end shell, a Bun HTTP backend entry point in `index.ts`, and route handlers for Plaid account sync. The repository already contains a dashboard concept and separate persistence helpers for Supabase-backed product data.

### Proposed Changes

Add a narrow integration path that:
* starts from the landing page,
* opens Plaid Link,
* exchanges the public token,
* fetches/stores transactions,
* computes the first leak,
* and renders the result in the UI.

### Constraints

* Keep the current Bun runtime.
* Do not introduce a second frontend framework.
* Avoid non-deterministic scoring.

## 2. Data Model

### Tables / Structures

* `bank_connections`: connected institutions and Plaid tokens.
* `accounts`: synced account metadata and balances.
* `transactions`: normalized transaction feed from Plaid.
* `findings`: one or more leak records per user.
* `score_history`: record of the user's score after sync.

### Relationships

* All records must belong to the authenticated user.
* Findings may reference an account or a connection as the source of truth.

### Validation

* Prevent duplicate connection records for the same Plaid item.
* Prevent duplicate first-leak findings on repeated syncs.
* Require a positive ownership boundary for all writes.

## 3. API / Interface

### Endpoints

* `POST /api/plaid/link-token`
* `POST /api/plaid/exchange`
* `POST /api/plaid/transactions`
* `GET /api/crm` or equivalent product summary endpoint for the dashboard

### Client Interfaces

* `ConnectBankScreen` or equivalent onboarding screen.
* `FirstLeakScreen` or equivalent insight screen.
* A dashboard summary component that can show the first leak and next action.

## 4. Logic

### Rules

1. Transactions from the latest sync should be normalized into one canonical shape before scoring.
2. The top leak should be selected by confidence and annualized impact, not by random order.

### Error Handling

* If Plaid fails, show a recoverable error and keep the user on the connect screen.
* If the sync returns no transactions, show a calm empty state with a retry action.

### Idempotency / Safety

* Repeated syncs should update existing records instead of duplicating the first leak.
* Any user-visible recommendation must be derived from stored data, not from transient UI state.

## 5. Security

* Keep Plaid and Supabase service credentials on the server.
* Verify the authenticated user before writes.
* Ensure account data is only visible to the owning user.

## 6. Testing Strategy

### Unit Tests

* Leak scoring and selection.
* No duplicate finding creation on repeat sync.

### Integration Tests

* Plaid route happy path.
* First leak rendering path after sync.

### Manual Checks

* Verify connect flow on desktop.
* Verify connect flow on mobile.
* Verify the first leak explanation is readable and calm.

## 7. Deployment Notes

* Environment variables: Plaid, Supabase URL, Supabase service key, optional Claude key.
* Migrations: add the missing banking tables if they do not already exist.
* Feature flags: keep demo mode available during rollout.


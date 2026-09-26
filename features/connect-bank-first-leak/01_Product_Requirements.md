# Product Requirements Document

## 1. Overview

### Feature Name

Connect Bank -> First Leak Detected

### Summary

Give a new user one clear path from landing on Shadow CFO to seeing their first personalized financial leak. The feature should connect a bank account, ingest recent data, and show one explainable recommendation with a confidence-backed reason.

### Background

Shadow CFO currently has a polished landing experience and a Bun backend that already speaks Plaid and Supabase in separate layers. The missing beta moment is the first trust loop: connect an account, detect a leak, and show the reason in language a user can understand without training.

## 2. Goals

### Business Goals

* Increase trial activation by getting users to a personalized insight within the first session.
* Improve trust by showing transparent reasoning before any suggested action.

### User Goals

* Connect a bank account in a low-friction flow.
* See one clear leak with the exact evidence that triggered it.

### Non-Goals

* No automated money movement.
* No full financial planning or tax filing workflow.

## 3. Users and Use Cases

### Primary Users

* New Shadow CFO trial users.
* Returning users who have not yet connected a bank account.

### Key Use Cases

1. A new user needs to connect a bank so they can immediately see whether Shadow CFO found anything worth fixing.
2. A returning user needs to review a first leak explanation so they can decide whether to continue into the Fix Queue.

## 4. Current Experience

The current experience has a strong landing page and a dashboard shell, but the trust loop is still fragmented. Users can see demo or seeded dashboard data, and the backend contains Plaid route scaffolding, but the product does not yet present a cohesive connect-bank flow that ends with a first explainable leak.

### Pain Points

* Users can reach the app without a clear first action.
* The current backend routes exist, but the UI does not present a single bank-connect-to-insight story.

## 5. Proposed Experience

The user lands on the marketing page, chooses to get started, connects a bank account, waits for a short scan, and then sees the first leak card with a visible confidence signal and reason summary. From there they can continue to the fix queue or dismiss the insight.

### User Flow

1. User lands on the landing page.
2. User chooses `Connect Bank`.
3. User completes Plaid Link and returns to Shadow CFO.
4. Dashboard reflects the first detected leak and next best action.

### UX Requirements

* The feature must be understandable without training.
* The first leak card must explain why it was flagged.
* The user must always have a visible next step.

## 6. Functional Requirements

| ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| FR-1 | User can connect a bank account through Plaid Link. | Must | Use the existing Bun backend Plaid routes. |
| FR-2 | System stores connected account and transaction data in Supabase. | Must | Keep ownership scoped to the authenticated user. |
| FR-3 | System shows one explainable leak after the first successful sync. | Must | Include amount, category, and reason. |
| FR-4 | User can dismiss or continue from the first leak card. | Should | Dismissal should not break the flow. |

## 7. Data Requirements

### Inputs

* Plaid public token and access token.
* Recent account and transaction records.

### Outputs

* Connected account records.
* First leak card with headline, explanation, and suggested fix.
* Dashboard summary counts for the connected user.

### Data Shape Changes

Document any required changes to the data model. Prefer fixture/data changes over hardcoded UI special cases.

```json
{
  "accounts": [
    {
      "institution_name": "Chase",
      "account_type": "checking",
      "balance_current": 4521.32
    }
  ],
  "findings": [
    {
      "category": "cash_drag",
      "annual_amount": 883.0,
      "headline": "Idle cash is sitting too long",
      "explanation": "This checking balance is earning nearly nothing.",
      "fix_action": "Move excess cash to a high-yield savings account",
      "fix_complexity": "one_tap",
      "urgency": "this_month"
    }
  ]
}
```

## 8. Business Logic

The first leak should be deterministic and explainable. For a given set of connected accounts and transactions, the system should identify the highest-confidence leak category, create one top finding, and attach the evidence used to produce it.

### Rules

1. If checking or savings cash exceeds a safe threshold and the yield is low, flag cash drag first.
2. If recent transactions show a repeated fee or subscription pattern, surface the highest-confidence recurring leak next.

### Explainability

Every leak card must show the category, the amount, and the human-readable reason it was flagged. The user should not have to guess what data triggered the recommendation.

## 9. Edge Cases

* Plaid connection succeeds but no transactions are returned yet.
* The user has multiple accounts and one of them is not scannable.
* The scan produces no clear leak, so the app must still show a calm empty state.
* Duplicate syncs should not create duplicate first-leak cards.

## 10. Success Metrics

### Product Metrics

* Percent of new users who reach a first leak within the first session.
* Percent of connected users who open the Fix Queue after first leak detection.

### Quality Metrics

* The feature is covered by tests for scoring and persistence.
* The first leak UI loads correctly on desktop and mobile.

## 11. Rollout Plan

### Release Scope

Ship a single connected-account flow, one leak generation path, and one explanation card with a clear CTA into the fix experience.

### Dependencies

* Plaid Link and transaction sync routes.
* Supabase tables for accounts, transactions, and findings.

### Risks

* Plaid or sync failures: show a recoverable error state and keep the user on the connect screen.
* Overly broad detection: keep the initial leak logic narrow and deterministic.

## 12. Testing Plan

### Automated Tests

* Add tests for leak scoring and leak selection.
* Add tests for idempotent first-sync behavior.

### Manual Verification

1. Run the app locally.
2. Connect a test account.
3. Verify one first leak appears.
4. Verify the explanation text matches the detected data.

## 13. Open Questions

* Should the first leak always be cash drag, or should the detector pick the strongest category?
* Do we keep the demo path visible after the bank is connected?

## 14. Decision Log

| Date | Decision | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-10 | Use connect-bank-first-leak as the next product slice | Codex | Matches the repo's current chosen-action direction |

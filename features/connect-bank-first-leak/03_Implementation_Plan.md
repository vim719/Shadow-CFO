# Implementation Plan

## Phase 1: Foundation

* Confirm or add the banking tables and relationships.
* Add tests for first-leak selection and idempotent sync.
* Normalize transaction input into a canonical shape.

## Phase 2: UI

* Build the connect-bank screen or wire it into the existing landing flow.
* Add the first leak card with clear reasons and a strong CTA.
* Add loading, empty, and error states.

## Phase 3: Integration

* Wire the Plaid link-token and exchange routes.
* Persist accounts, transactions, and findings in Supabase.
* Connect the dashboard summary to the newly stored data.

## Phase 4: Verification

* Run the automated test suite.
* Walk through the connect flow end to end.
* Check mobile layout and error recovery.

## Phase 5: Release

* Document any operational steps or environment variables.
* Note open questions around scoring thresholds.
* Keep demo mode available until the live path is stable.

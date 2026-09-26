# Agent Committee

This project can use a lightweight committee workflow when a feature needs multiple perspectives.

## Roles

* `Spec agent`: writes the product requirements and non-goals.
* `Tech agent`: translates the spec into data, API, and UI constraints.
* `Implementation agent`: builds the code from the approved spec.
* `Review agent`: checks for regressions, missing tests, and scope drift.

## Working Rules

* Start from the spec template in `features/template`.
* Do not code until the spec is complete enough to answer what, why, and how.
* Keep the implementation deterministic and explainable.
* Keep one source of truth for data shape changes.
* Validate the result with tests before claiming it is done.

## Suggested Flow

1. Spec agent drafts `01_Product_Requirements.md`.
2. Tech agent drafts `02_Tech_Requirements.md`.
3. Implementation agent executes `03_Implementation_Plan.md`.
4. Review agent confirms test coverage and edge cases.


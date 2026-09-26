# Repository Guidelines

## Spec-First Workflow

Start feature work from `features/template/01_Product_Requirements.md`, then fill in `02_Tech_Requirements.md`, then execute `03_Implementation_Plan.md`.

## Agent Committee Workflow

Use the roles and flow in `docs/agent-committee.md` when a feature needs multiple perspectives.

## Implementation Rules

* Keep business logic deterministic and explainable.
* Update tests whenever behavior changes.
* Prefer small, compatible changes over broad rewrites.
* Verify the app still builds before handoff.

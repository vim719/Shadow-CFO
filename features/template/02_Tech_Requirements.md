# Technical Requirements

## 1. Architecture

### Current Architecture

Describe the current system boundaries, data flow, and relevant modules.

### Proposed Changes

Describe how the new feature should fit into the existing codebase.

### Constraints

* Keep business logic deterministic where possible.
* Avoid unnecessary external dependencies.
* Preserve existing public routes unless there is a strong reason to change them.

## 2. Data Model

### Tables / Structures

List the data entities involved and what each stores.

### Relationships

Describe foreign keys, ownership boundaries, and read/write paths.

### Validation

Describe constraints, allowed values, and invariants.

## 3. API / Interface

### Endpoints

Document any new routes, request bodies, response payloads, and auth rules.

### Client Interfaces

Describe any new components, hooks, or UI contracts.

## 4. Logic

### Rules

1. `<Rule>`
2. `<Rule>`

### Error Handling

Describe how the system should behave when inputs are missing, invalid, or partially available.

### Idempotency / Safety

Document any repeated-action protections, consent checks, or replay behavior.

## 5. Security

* Scope the minimum required permissions.
* Avoid exposing service credentials to the browser.
* Verify user ownership on all read/write operations.

## 6. Testing Strategy

### Unit Tests

* `<Test area>`
* `<Test area>`

### Integration Tests

* `<Test area>`
* `<Test area>`

### Manual Checks

* Verify the happy path.
* Verify the empty state.
* Verify mobile layout.

## 7. Deployment Notes

* List environment variables.
* List migration steps.
* List any required feature flags.


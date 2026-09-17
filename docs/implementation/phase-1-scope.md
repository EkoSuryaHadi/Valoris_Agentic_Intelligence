# Phase 1 — Project Setup & Cost Baseline

## Vertical slice

Project context → WBS/CBS/cost codes → budget lines → baseline version → submit/review/approve/lock → audit trail.

## Rules

- WBS and CBS are separate trees with explicit project ownership.
- Budget lines require WBS and cost code mapping and non-negative fixed-precision amounts.
- BAC is the sum of approved baseline lines.
- Only one approved/locked baseline is active for a project.
- Locked baseline data is immutable; corrections create a new version.
- Approval and lock are human actions and produce audit events.

## UI screens

- Project Setup: project metadata, currency, dates, status.
- WBS/CBS: tree table, add/edit node, mapping and validation errors.
- Budget: editable grid, import/entry, totals by WBS and cost code.
- Baseline Review: version, BAC, changes, approval timeline, evidence drawer.

## Acceptance

- User with project permission can create project hierarchy and cost codes.
- Invalid/empty codes, names, levels, cross-project parents, or negative amounts are rejected.
- BAC reconciles to budget line sum and is displayed with currency.
- Baseline can move through DRAFT → UNDER_REVIEW → SUBMITTED → APPROVED → LOCKED.
- Unauthorized users cannot approve or lock.
- Locked data cannot be edited.
- All mutations are tenant-scoped and auditable.

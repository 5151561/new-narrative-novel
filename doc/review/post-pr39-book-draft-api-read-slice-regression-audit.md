# Post-PR39 Book Draft API Read-Slice Regression Audit

Date: 2026-04-27
Verdict: pass

## Branch

- Source branch: `codex/pr39-runtime-fixture-parity-guard`
- PR branch: `codex/pr40-book-draft-api-read-slice-regression-closure`
- Bundle focus: PR40 Bundle B

## Why This PR Existed

- PR39 left the full renderer suite red because Book Draft API read-slice tests still encoded the pre-`draft-assembly` read graph.
- PR40 closes that regression without changing product direction, layout behavior, route semantics, or the Book Draft workbench surface.

## Contract Decision

- `book draft assembly` is the default API live read model for the Book Draft workspace.
- When `GET /api/projects/{projectId}/books/{bookId}/draft-assembly` resolves to `null`, the Book Draft workspace must render the existing not-found/null-state UI and stop dependent compare/export/branch/review/chapter/scene reads.
- For the null-state path covered here, the allowed baseline requests are `runtime-info` and `draft-assembly` only.

## What Changed

- Updated `packages/renderer/src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx` so the not-found regression case overrides live `draft-assembly` to `null` instead of overriding `bookStructure`.
- Tightened the same test to assert the null-state request baseline exactly: `GET /runtime-info` plus `GET /books/{bookId}/draft-assembly`, with no downstream compare/export/branch/review/chapter/scene reads.
- No production hook or container changes were required after the focused regression test proved current null-state gating already blocks downstream reads.

## Files Changed

- `packages/renderer/src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx`
- `doc/review/post-pr39-book-draft-api-read-slice-regression-audit.md`

Pre-existing local workspace note:

- `doc/post-pr39-roadmap-and-pr40-ai-execution-plan.md` was already present as a local input document before this Bundle B pass.
- It remained untracked and untouched here, and it is intentionally not part of the Bundle B changed-file list above.

## Verification Matrix

| Command | Result |
| --- | --- |
| `pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/api-read-slice-contract.test.tsx src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx` | pass, 2 files / 8 tests |
| `pnpm --filter @narrative-novel/renderer test` | pass, 160 files / 935 tests |
| `pnpm --filter @narrative-novel/renderer typecheck` | pass, `tsc --noEmit` |

## Scope Notes

- Storybook was not changed. This bundle updates regression coverage only and does not introduce a user-visible Book Draft state or layout change.
- The production null-state contract already held, so this bundle stays inside the owned Bundle B test/doc scope instead of widening into hook/container churn.

## Deferred Follow-up

- Shared fixture seed extraction remains deferred to PR41.
- No additional fixture identity cleanup was required in this Bundle B pass.

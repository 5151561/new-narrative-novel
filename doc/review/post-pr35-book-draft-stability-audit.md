# Post-PR35 Book Draft Stability Audit

Audited branch: `codex/pr35-scene-review-gate-main-stage-correction`

PR36 bundle branch: `codex/pr36-book-draft-stability-regression-cleanup`

## Summary

Before PR36, Book Draft export/artifact test flows rendered the Artifact gate with duplicate React keys. The warning class was not caused by route state, WorkbenchShell layout state, Scene review gate ownership, API contracts, or fixture server behavior.

Root cause: `buildBookExportArtifactGate` merged export readiness issues and open review blockers into one `gate.reasons` list. When the review inbox mirrored the same export readiness issue, both reason rows reused the same raw issue id, so `BookExportArtifactGate` rendered duplicate sibling keys.

## Files Changed

| File | Purpose |
| --- | --- |
| `packages/renderer/src/features/book/lib/book-export-artifact-mappers.ts` | Added source-qualified Artifact gate reason ids for export-readiness and review-open-blocker rows. |
| `packages/renderer/src/features/book/lib/book-export-artifact-mappers.test.ts` | Added a focused stable-identity assertion for duplicated source issues across export readiness and review. |
| `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx` | Added a targeted Book Draft regression test that fails if React duplicate-key warnings return in the export Artifact gate flow. |

No Storybook story changed because the rendered structure and visible states did not change.

## Duplicate Key Findings

| Warning key class | Source list | Finding | Fix |
| --- | --- | --- | --- |
| `trace-gap-*` | Artifact gate reasons | Export readiness blocker also appears as an open review blocker with the same raw issue id. | Prefix local gate reason id with `export-readiness:` or `review-open-blocker:`. |
| `missing-draft-*` | Artifact gate reasons | Same mirrored export issue can appear twice in one gate reason list. | Same source-qualified reason id rule. |
| `warnings-*` | Artifact gate reasons | Warning-level export readiness rows can be mirrored by review warning rows. | Same source-qualified reason id rule. |
| `compare-added-*`, `compare-changed-*`, `compare-missing-*`, `compare-draft-missing-*` | Artifact gate reasons | Compare/export readiness warnings mirrored through review used the same raw issue id. | Same source-qualified reason id rule. |

## Stable Identity Rules Introduced

- Raw source issue ids remain unchanged in export readiness and review models.
- Artifact gate rows use deterministic compound ids: `<gate-source>:<source-issue-id>`.
- Gate source remains explicit as `export-readiness` or `review-open-blocker`, preserving existing labels and counts.
- No array index keys were introduced for dynamic export, review, trace, warning, or compare rows.

## Tests Added Or Changed

| Test | Coverage |
| --- | --- |
| `BookDraftWorkspace > does not emit duplicate React key warnings when export readiness and review blockers share source issues` | Renders the real Book Draft export route and asserts local `console.error` captured no React duplicate-key warnings. |
| `book export artifact mappers > keeps artifact gate reason ids unique when export readiness issues also appear in review` | Locks the source-qualified reason id contract in the pure mapper. |

## Verification

| Command | Result |
| --- | --- |
| `pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace --runInBand` | Baseline before fix: passed `158` files / `910` tests, but emitted the known duplicate-key warnings. |
| `pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace.test.tsx -t "does not emit duplicate React key warnings" --runInBand` | Red before fix: failed the new regression test with duplicate-key warnings; green after fix: passed `158` files / `912` tests. |
| `pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace` | Passed after fix: `158` files / `912` tests. The current renderer test script ran the full suite for this pattern. |
| `pnpm --filter @narrative-novel/renderer test -- book-export-artifact-mappers` | Passed after fix: `158` files / `912` tests. The current renderer test script ran the full suite for this pattern. |
| `pnpm --filter @narrative-novel/renderer typecheck` | Passed: `tsc --noEmit`. |

## Deferred Follow-Up

None for this PR36 bundle. Broader review/export deduplication or product-surface changes remain out of scope because the warning source was local Artifact gate row identity.

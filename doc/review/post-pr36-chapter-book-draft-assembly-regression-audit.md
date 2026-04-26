# Post-PR36 Chapter / Book Draft Assembly Regression Audit

## Branch

- Source branch: `codex/pr36-book-draft-stability-regression-cleanup`
- PR branch: `codex/pr37-chapter-book-draft-assembly-regression`

## Summary

- What was verified:
  - The existing API contract already closes the scene-to-chapter propagation path for accepted run review decisions through ref-based run artifacts, scene prose materialization, chapter prose status updates, and explicit `proposal -> canon fact -> canon patch -> prose draft` trace links.
  - `accept-with-edit` preserves selected variant provenance through canon patch detail, prose draft detail, scene prose trace summary, and execution accepted-fact summaries.
  - `request-rewrite` and `reject` do not overwrite the existing scene prose draft or chapter-facing prose status.
  - The existing renderer assembly path already keeps Chapter Draft and Book Draft aligned with current scene prose reads, explicit missing-draft gaps, canonical chapter/scene identities, stable review/export issue ids, and the pre-existing PR36 duplicate-key guard once the missing regression coverage is added.
- What was fixed:
  - Bundle A already committed the focused PR37 API regression-closure test file on this branch, locking the selected-variant -> review-decision -> canon-patch -> prose-draft -> scene prose -> chapter status -> trace chain under the current HTTP contract.
  - Bundle B adds focused renderer regression tests for chapter draft assembly, book draft assembly, manuscript compare identity, review issue identity, and export-readiness issue identity.
  - Added this audit so the current propagation path and the remaining API gap are explicit.
- What was intentionally left unchanged:
  - No production API/repository/orchestration code changed in Bundle A because the owned API path passed once the missing regression coverage was added.
  - No production renderer/workbench code changed in Bundle B because the owned renderer path also passed once the missing regression coverage was added.
  - No new endpoint was added for live Book Draft assembly/read/compare/export propagation.
  - Existing manuscript checkpoint and export artifact records remain snapshot-style fixture data; they are not mutated by run review submission in the current API contract.
  - No new Storybook story was added; existing chapter/book draft stories already cover the read and missing-draft states, and Bundle B changed no renderer production behavior.

## Regression Chain

```text
selected proposal variant
  -> review decision
  -> canon patch
  -> prose draft artifact
  -> scene prose read model
  -> chapter draft assembly
  -> book draft read / compare / review / export-readiness trace
```

## Inventory the Current Chain

- `POST /api/projects/:projectId/runs/:runId/review-decisions`
  - route: `packages/api/src/routes/run.ts`
  - repository entry: `fixtureRepository.submitRunReviewDecision(...)`
  - run-state transition owner: `runFixtureStore.submitRunReviewDecision(...)`
  - transition builder: `applySceneRunReviewDecisionTransition(...)` in `packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts`
- Accepted review decisions (`accept`, `accept-with-edit`) append lightweight post-review events with refs only:
  - `review_decision_submitted`
  - `canon_patch_applied`
  - `prose_generated`
  - `run_completed`
- After the run state is updated, `fixtureRepository.submitRunReviewDecision(...)` calls:
  - `syncRunMutations(projectId, run)` to refresh scene workspace/execution state and chapter run metadata
  - `syncSceneProseFromAcceptedRun(projectId, run, decision)` to materialize accepted prose into the scene/chapter read surfaces
- `syncSceneProseFromAcceptedRun(...)` currently does the API-observable propagation work:
  - reads latest `proposal-set`, `canon-patch`, and `prose-draft` artifact details from the run store
  - maps prose into `scene.prose` via `buildSceneProseFromProseDraftArtifact(...)`
  - maps accepted facts into `scene.execution.acceptedSummary` and `scene.inspector.context.acceptedFacts`
  - updates chapter-facing prose status through `syncChapterSceneProseStatus(...)`
- Read contracts used by this bundle:
  - Scene prose: `GET /api/projects/:projectId/scenes/:sceneId/prose`
  - Chapter structure/status: `GET /api/projects/:projectId/chapters/:chapterId/structure`
  - Run trace: `GET /api/projects/:projectId/runs/:runId/trace`
  - Run artifacts/events: `GET /api/projects/:projectId/runs/:runId/artifacts/:artifactId`, `GET /api/projects/:projectId/runs/:runId/events`
- Current book-level note:
  - `GET /api/projects/:projectId/books/:bookId/manuscript-checkpoints` and `GET /api/projects/:projectId/books/:bookId/export-artifacts` are snapshot/read-profile fixtures today.
  - They are not updated by `submitRunReviewDecision(...)`, and the current API has no live Book Draft assembly endpoint in this owned scope.
  - That gap is documented here instead of being widened by adding new contracts in PR37 Bundle A.

## Verification Matrix

| Flow | Expected propagation | Test / story | Result |
|---|---|---|---|
| Accept selected variant | Review completes; post-review events stay ref-based; canon patch + prose draft refs resolve; scene prose, chapter prose status, and the intermediate `proposal -> canon fact -> canon patch -> prose draft` trace links reflect the selected variant | `packages/api/src/createServer.draft-assembly-regression.test.ts` -> `propagates accepted selected variants through ref-based artifacts, scene prose, chapter status, and trace links` | PASS |
| Accept with edit | `accept-with-edit` keeps edited acceptance semantics plus selected variant provenance through canon patch, prose draft, scene prose trace, and execution accepted facts | `packages/api/src/createServer.draft-assembly-regression.test.ts` -> `preserves accept-with-edit source semantics and selected variant provenance across artifacts and scene read models` | PASS |
| Reject / request rewrite | Existing prose draft and chapter-facing prose status remain unchanged | `packages/api/src/createServer.draft-assembly-regression.test.ts` -> `keeps request-rewrite decisions from overwriting existing scene prose or chapter prose status`; `keeps reject decisions from overwriting existing scene prose or chapter prose status` | PASS |
| Scene prose surface | Scene prose endpoint reads generated/revised prose from accepted run artifacts under the current materialization path | `packages/api/src/createServer.draft-assembly-regression.test.ts`; `packages/api/src/createServer.prose-revision.test.ts` | PASS |
| Chapter draft assembly | Chapter Draft reads accepted prose, accept-with-edit prose, and explicit missing-draft gaps without drifting scene/chapter identity | `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx`; `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx`; `packages/api/src/createServer.draft-assembly-regression.test.ts` | PASS |
| Book draft read | Book Draft read assembly reuses current scene prose from the shared propagation chain, preserves word counts/readiness/scene counts, and leaves missing scene prose as explicit gaps | `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx`; `packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts` | PASS |
| Book compare | Compare marks changed/missing prose correctly and matches chapters/scenes by canonical ids rather than display-label drift | `packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx`; `packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts` | PASS |
| Book review/export readiness | Review issue ids stay stable across chapter/scene relabeling, export-readiness issue ids stay stable across relabeling, and the existing duplicate-key guard still passes | `packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts`; `packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts`; preserved coverage in `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx` -> `does not emit duplicate React key warnings when export readiness and review blockers share source issues` | PASS |
| Trace | Run trace links continue to connect selected proposal -> canon fact -> canon patch -> prose draft, with the same accepted fact id flowing through the middle hops | `packages/api/src/createServer.draft-assembly-regression.test.ts` -> `propagates accepted selected variants through ref-based artifacts, scene prose, chapter status, and trace links` | PASS |
| Duplicate key regression | Export readiness and review blockers can still share source issues without duplicate React key warnings in the renderer | Preserved coverage in `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx` -> `does not emit duplicate React key warnings when export readiness and review blockers share source issues` | PASS |
| API-observable chapter-facing propagation note | Chapter status propagation is real and centralized in `syncSceneProseFromAcceptedRun(...)` + `syncChapterSceneProseStatus(...)` | Code inventory plus regression tests above | PASS |

## Files Changed

- Already committed on this branch from Bundle A:
  - `packages/api/src/createServer.draft-assembly-regression.test.ts`
    - Added focused PR37 API regression-closure coverage for accept, accept-with-edit, request-rewrite, reject, scene prose, chapter status, trace, and lightweight events.
- Changed by Bundle B in the current renderer work:
  - `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx`
    - Added chapter-draft regression coverage for accepted prose, accept-with-edit prose, explicit gap handling, and stable scene/chapter identities.
  - `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx`
    - Added workbench-level chapter draft proof that current prose and missing-draft gaps render through the existing chapter assembly surface.
  - `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx`
    - Added book-draft shared-source coverage for current prose propagation, readiness totals, and explicit missing scene gaps.
  - `packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx`
    - Added compare-hook coverage that canonical chapter/scene ids survive display-label drift.
  - `packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts`
    - Added mapper coverage for stable chapter sections and missing-draft handling in book draft assembly.
  - `packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts`
    - Added compare-mapper coverage that chapter/scene matching stays id-based instead of title-based.
  - `packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts`
    - Added export-readiness coverage that issue ids stay stable across relabeling.
  - `packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts`
    - Added review-inbox coverage that review issue ids stay stable across chapter/scene relabeling.
  - `doc/review/post-pr36-chapter-book-draft-assembly-regression-audit.md`
    - Added renderer-side verification coverage, corrected branch/worktree attribution, and recorded the exact commands/results for both bundles.
- Preserved coverage verified but not changed by Bundle B:
  - `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx`
    - The PR36 duplicate-key regression guard remained green and was used as preserved evidence only.

## Commands Run

- `pnpm --filter @narrative-novel/api test -- src/createServer.draft-assembly-regression.test.ts`
  - First red pass exposed assertion/contract-alignment gaps in the new test file.
  - Final green pass: `17` test files passed, `74` tests passed.
- `pnpm --filter @narrative-novel/api test -- src/createServer.run-flow.test.ts src/createServer.prose-revision.test.ts src/createServer.read-surfaces.test.ts src/createServer.draft-assembly-regression.test.ts`
  - Green: `17` test files passed, `74` tests passed.
- `pnpm --filter @narrative-novel/renderer test -- src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx src/features/chapter/containers/ChapterDraftWorkspace.test.tsx src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx src/features/book/lib/book-draft-workspace-mappers.test.ts src/features/book/lib/book-manuscript-compare-mappers.test.ts src/features/book/lib/book-export-preview-mappers.test.ts src/features/book/containers/BookDraftWorkspace.test.tsx`
  - Green: `158` test files passed, `919` tests passed.
- `pnpm --filter @narrative-novel/renderer test -- src/features/review/lib/book-review-inbox-mappers.test.ts`
  - Green: `158` test files passed, `920` tests passed.
- Storybook MCP verification against the existing `http://127.0.0.1:6006` instance
  - `mcp__storybook_mcp__.getComponentList` confirmed both `Mockups/Book/BookDraftWorkspace` and `Mockups/Chapter/ChapterDraftWorkspace` were exposed.
  - Playwright MCP inspected `mockups-chapter-chapterdraftworkspace--default` and `mockups-book-bookdraftworkspace--export-blocked-by-missing-draft` with structured snapshots plus full-page screenshots.
  - Both stories rendered the expected workbench surfaces for this PR37 regression slice. The only observed console noise was a missing `favicon.svg` `404` on the chapter storybook shell, which is unrelated to the draft-assembly regression path.

## Deferred Follow-up

- If PR37 needs live Book Draft assembly propagation to be API-verifiable, add or expose a real book-draft read contract in a later scoped PR instead of mutating snapshot-style manuscript checkpoints or export artifact fixtures here.
- Live post-review mutation of manuscript checkpoints/export artifact fixtures remains out of scope; the renderer bundle proves identity/readiness behavior against current scene prose reads plus existing snapshot compare/export surfaces, not a new backend mutation contract.

# Post-PR36 Chapter / Book Draft Assembly Regression Audit

## Branch

- Source branch: `codex/pr36-book-draft-stability-regression-cleanup`
- PR branch: `codex/pr37-chapter-book-draft-assembly-regression`

## Summary

- What was verified:
  - The existing API contract already closes the scene-to-chapter propagation path for accepted run review decisions through ref-based run artifacts, scene prose materialization, chapter prose status updates, and explicit `proposal -> canon fact -> canon patch -> prose draft` trace links.
  - `accept-with-edit` preserves selected variant provenance through canon patch detail, prose draft detail, scene prose trace summary, and execution accepted-fact summaries.
  - `request-rewrite` and `reject` do not overwrite the existing scene prose draft or chapter-facing prose status.
- What was fixed:
  - Added a focused PR37 regression-closure API test file that locks the selected-variant -> review-decision -> canon-patch -> prose-draft -> scene prose -> chapter status -> trace chain under the current HTTP contract.
  - Added this audit so the current propagation path and the remaining API gap are explicit.
- What was intentionally left unchanged:
  - No production API/repository/orchestration code changed because the owned API path passed once the missing regression coverage was added.
  - No new endpoint was added for live Book Draft assembly/read/compare/export propagation.
  - Existing manuscript checkpoint and export artifact records remain snapshot-style fixture data; they are not mutated by run review submission in the current API contract.

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
| Chapter draft assembly | Chapter structure reflects accepted prose status changes and preserves status on rewrite/reject | `packages/api/src/createServer.draft-assembly-regression.test.ts` | PASS |
| Book draft read | No live Book Draft assembly read endpoint exists in the owned API scope; existing manuscript checkpoints are snapshot fixtures and were intentionally left unchanged | Inventory note only | GAP DOCUMENTED |
| Book compare | No API contract in owned scope exposes a live post-review compare assembly update | Inventory note only | GAP DOCUMENTED |
| Book review/export readiness | Existing export profile/artifact endpoints are snapshot/profile reads, not live post-review assembly surfaces | Inventory note only | GAP DOCUMENTED |
| Trace | Run trace links continue to connect selected proposal -> canon fact -> canon patch -> prose draft, with the same accepted fact id flowing through the middle hops | `packages/api/src/createServer.draft-assembly-regression.test.ts` -> `propagates accepted selected variants through ref-based artifacts, scene prose, chapter status, and trace links` | PASS |
| Duplicate key regression | Not API-observable; renderer concern owned by non-API bundle(s) | N/A | OUT OF SCOPE |
| API-observable chapter-facing propagation note | Chapter status propagation is real and centralized in `syncSceneProseFromAcceptedRun(...)` + `syncChapterSceneProseStatus(...)` | Code inventory plus regression tests above | PASS |

## Files Changed

- `packages/api/src/createServer.draft-assembly-regression.test.ts`
  - Added focused PR37 API regression-closure coverage for accept, accept-with-edit, request-rewrite, reject, scene prose, chapter status, trace, and lightweight events.
- `doc/review/post-pr36-chapter-book-draft-assembly-regression-audit.md`
  - Added the API-side propagation inventory, verification matrix, and current book-level contract gap note.

## Commands Run

- `pnpm --filter @narrative-novel/api test -- src/createServer.draft-assembly-regression.test.ts`
  - First red pass exposed assertion/contract-alignment gaps in the new test file.
  - Final green pass: `17` test files passed, `74` tests passed.
- `pnpm --filter @narrative-novel/api test -- src/createServer.run-flow.test.ts src/createServer.prose-revision.test.ts src/createServer.read-surfaces.test.ts src/createServer.draft-assembly-regression.test.ts`
  - Green: `17` test files passed, `74` tests passed.

## Deferred Follow-up

- If PR37 needs live Book Draft assembly propagation to be API-verifiable, add or expose a real book-draft read contract in a later scoped PR instead of mutating snapshot-style manuscript checkpoints or export artifact fixtures here.
- Duplicate React key regression closure remains a renderer/workbench verification concern, not an API contract change.

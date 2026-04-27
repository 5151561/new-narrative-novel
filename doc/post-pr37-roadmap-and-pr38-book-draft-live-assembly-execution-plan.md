# Post-PR37 Roadmap and PR38 AI Execution Plan

> Date: 2026-04-26  
> Source branch: `codex/pr37-chapter-book-draft-assembly-regression`  
> Recommended next branch: `codex/pr38-book-draft-live-assembly-read-contract`  
> Audience: AI coding agent / implementation agent  
> Scope: narrow API/read-model contract closure after PR37, with no new product surface

---

## 0. Executive Decision

PR37 successfully locked the regression chain:

```text
selected proposal variant
  -> review decision
  -> canon patch
  -> prose draft artifact
  -> scene prose read model
  -> chapter draft assembly
  -> book draft read / compare / review / export-readiness trace
```

However, PR37 also documented the key remaining contract gap:

```text
Book manuscript checkpoints and export artifacts are still snapshot-style fixture data.
They are not mutated by run review decisions.
There is no live Book Draft assembly endpoint in the current API-owned scope.
```

Therefore, the next PR should **not** jump straight to SSE, Temporal, real persistence, prompt/RAG, desktop project picker, or visual generation.

The next PR should be:

```text
PR38: Book Draft Live Assembly Read Contract
```

This intentionally supersedes the earlier tentative “Runtime Polling / Stale-State UX Hardening” priority. Polling UX should be hardened **after** the Book Draft current-read surface has a real API contract; otherwise PR38 would polish stale states around a client-side fanout that is still missing a server-owned read model.

---

## 1. AI Agent Implementation Instruction

Start from:

```bash
git checkout codex/pr37-chapter-book-draft-assembly-regression
git checkout -b codex/pr38-book-draft-live-assembly-read-contract
```

Then execute this plan without broadening the PR.

### Main Goal

Add a narrow, live, API-backed Book Draft assembly read contract that can represent the current manuscript assembled from current scene prose and chapter order, without mutating historical manuscript checkpoints or export artifacts.

The target read path is:

```text
accepted scene run review decision
  -> scene prose materialized
  -> chapter scene prose status updated
  -> GET /books/{bookId}/draft-assembly reads current scene prose
  -> Book Draft renderer can read the current manuscript assembly from the API-owned contract
  -> compare / export / review can continue deriving from current Book Draft workspace
```

### Recommended Endpoint

Add:

```http
GET /api/projects/{projectId}/books/{bookId}/draft-assembly
```

The exact route name can be adjusted if the repository already has a stronger convention, but do **not** reuse manuscript checkpoint or export artifact endpoints for this current-read surface.

### One-line Product Meaning

```text
manuscript-checkpoints = historical snapshots
export-artifacts = generated deliverables
book draft assembly = current live read model
```

---

## 2. Why PR38 Comes Next

PR37 proved the propagation chain at the current fixture/API level, but it also recorded that book-level checkpoint/export records are snapshot/read-profile fixtures and are not updated by `submitRunReviewDecision(...)`.

That is the correct boundary for PR37, but it becomes the most important next gap after PR37 because Book Draft is where these surfaces converge:

```text
Scene prose
Chapter draft assembly
Book manuscript read
Book compare
Book review inbox
Export readiness
Trace/source handoff
```

Without a server-owned current Book Draft assembly read surface, the renderer must keep reconstructing the current book manuscript through a multi-client fanout:

```text
book structure
  + chapter workspaces
  + scene prose reads
  + scene trace reads
  -> client-side BookDraftWorkspaceViewModel
```

That worked as a renderer regression closure, but it is not the right API seam for real persistence.

PR38 should therefore add the API read model seam now, while keeping all existing UI behavior stable.

---

## 3. Do Not Do

PR38 must not add or implement:

- production database / real persistence
- Temporal / durable workflow engine
- real LLM integration
- real SSE / WebSocket event streaming
- prompt editor
- RAG / vector search
- Asset Context Policy mutation
- domain-safe recipes
- desktop project picker / local project directory
- filesystem-backed project storage
- new Workbench layout behavior
- editor tabs / command palette / status bar
- new dashboard-like UI
- new page-level route outside `WorkbenchShell`
- checkpoint mutation after run review
- export artifact mutation after run review
- broad visual redesign

If a test exposes a missing contract that requires production persistence or workflow execution, document it in the audit and keep PR38 narrow.

---

## 4. Mandatory Reading Before Coding

Read these files before making changes:

```text
README.md
AGENTS.md
FRONTEND_WORKFLOW.md
doc/api-contract.md
doc/frontend-workbench-constitution.md
doc/review/post-pr36-chapter-book-draft-assembly-regression-audit.md
doc/review/post-pr35-book-draft-stability-audit.md
```

Inspect current implementation around:

```text
packages/api/src/routes/book.ts
packages/api/src/routes/run.ts
packages/api/src/contracts/api-records.ts
packages/api/src/repositories/fixtureRepository.ts
packages/api/src/repositories/fixture-data.ts
packages/api/src/orchestration/sceneRun/sceneRunProseMaterialization.ts
packages/api/src/createServer.draft-assembly-regression.test.ts
packages/api/src/createServer.read-surfaces.test.ts
packages/renderer/src/app/project-runtime/**
packages/renderer/src/features/book/api/book-client.ts
packages/renderer/src/features/book/hooks/book-query-keys.ts
packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx
packages/renderer/src/features/review/lib/book-review-inbox-mappers.ts
packages/renderer/src/features/traceability/**
```

If a listed path differs, search for the nearest current equivalent by feature name.

---

## 5. Workbench Constitution Compliance

This PR must not:

- bypass `WorkbenchShell`
- add page-like dashboards
- implement local pane layout
- duplicate shell state
- put primary work in Inspector or Bottom Dock
- mix route state with layout preference
- create a second selected-object truth source
- convert prose generation or review into chat UI
- inline large prompt / context / raw LLM payload in run events
- make AI output look like canon without review/artifact/trace

This PR must:

- preserve the Scope × Lens model
- preserve route as the business-state source of truth
- preserve layout as shell-owned local preference
- keep Book Draft inside the existing Book / Draft workbench surface
- keep Main Stage ownership clear
- keep run events lightweight and ref-based
- keep prose as artifact/read model, not raw event metadata
- add tests for the new API read model and renderer adoption
- preserve PR36 duplicate-key guard
- preserve PR37 propagation regression coverage

If implementation makes the product feel more like a generic web app than a Narrative IDE, the PR fails.

---

## 6. PR38 Deliverables

### 6.1 Add Audit Document

Create:

```text
doc/review/post-pr37-book-draft-live-assembly-audit.md
```

Use this structure:

```md
# Post-PR37 Book Draft Live Assembly Audit

## Branch
- Source branch:
- PR branch:

## Summary
- What was verified
- What was added
- What was intentionally left unchanged

## Current Read Model Boundary
```text
manuscript checkpoints = historical snapshots
export artifacts = generated deliverables
book draft assembly = current live manuscript read model
```

## Verification Matrix
| Flow | Expected behavior | Test / story | Result |
|---|---|---|---|
| Accept selected variant | Live book draft assembly reads current scene prose | | |
| Accept with edit | Edited prose/source provenance appears in live assembly | | |
| Reject / request rewrite | Does not overwrite live assembly prose | | |
| Missing scene prose | Live assembly reports explicit gap | | |
| Chapter order / scene order | Assembly order follows current chapter structure | | |
| Current vs checkpoint compare | Compare still derives from current assembly and historical checkpoint | | |
| Export preview / review inbox | Existing downstream surfaces still work | | |
| Duplicate key guard | PR36 guard still passes | | |
| Lightweight events | No run event carries full prose payload | | |

## Files Changed
-

## Commands Run
-

## Deferred Follow-up
-
```

### 6.2 API Contract

Update:

```text
doc/api-contract.md
```

Add the new endpoint to the matrix:

```http
GET /api/projects/{projectId}/books/{bookId}/draft-assembly
```

Document these rules:

1. It is a **current live read model**, not a checkpoint.
2. It may include assembled prose bodies because it is a product read surface, not a run event.
3. It must not mutate manuscript checkpoints.
4. It must not mutate export artifacts.
5. It must preserve stable book/chapter/scene ids.
6. It must represent missing scene prose as explicit gaps, not successful empty text.
7. It must include enough source refs / trace rollup metadata for Book Draft, Review, Compare, and Export readiness to explain source identity.
8. Run events remain lightweight; this endpoint does not change event payload rules.

### 6.3 API Record Type

Add a narrow record type in the existing API contract layer.

Suggested shape:

```ts
export interface BookDraftAssemblyRecord {
  bookId: string
  title: LocalizedTextRecord
  sourceSignature: string
  assembledAtLabel: string
  chapterCount: number
  sceneCount: number
  wordCount: number
  missingDraftSceneCount: number
  chapters: BookDraftAssemblyChapterRecord[]
}

export interface BookDraftAssemblyChapterRecord {
  chapterId: string
  order: number
  title: LocalizedTextRecord
  summary?: LocalizedTextRecord
  wordCount: number
  missingDraftSceneCount: number
  scenes: BookDraftAssemblySceneRecord[]
}

export interface BookDraftAssemblySceneRecord {
  sceneId: string
  order: number
  title: LocalizedTextRecord
  proseStatus: 'generated' | 'updated' | 'revision_queued' | 'missing' | 'unavailable'
  proseStatusLabel: LocalizedTextRecord
  proseDraftId?: string
  sourceRunId?: string
  sourceProposalSetId?: string
  sourceCanonPatchId?: string
  wordCount: number
  body?: LocalizedTextRecord
  gapReason?: LocalizedTextRecord
  traceRollup?: {
    acceptedFactCount: number
    relatedAssetCount: number
    sourceProposalCount: number
    missingLinks: number
  }
}
```

Adapt names to actual repo conventions. Do not overfit to UI text. Keep stable ids primary.

### 6.4 API Repository / Route Implementation

Add a repository method, for example:

```ts
getBookDraftAssembly(projectId: string, bookId: string): BookDraftAssemblyRecord | null
```

Implementation rules:

- Assemble from the existing fixture project data.
- Use current `BookStructureRecord.chapterIds` order.
- Use current `ChapterStructureWorkspaceRecord.scenes[].order` order.
- Use current `SceneProseViewModel` from fixture scene data after run decisions have materialized prose.
- Use current chapter-facing `proseStatusLabel` when available.
- Include missing scene prose as explicit gap rows.
- Preserve canonical ids; never match by display title.
- Do not mutate anything while reading.
- Do not create export artifacts or checkpoints.
- Do not call run store history as a source of truth except through already materialized scene/read-model records or existing artifact/trace refs needed for rollups.

Route:

```ts
app.get(`${projectBase}/books/:bookId/draft-assembly`, ...)
```

Return `null` if the book does not exist, following current detail read conventions.

### 6.5 API Tests

Add or extend:

```text
packages/api/src/createServer.book-draft-live-assembly.test.ts
```

Cover:

1. `GET /books/{bookId}/draft-assembly` returns current book/chapter/scene assembly with stable ids.
2. After `POST /runs/{runId}/review-decisions` with `accept`, the live assembly reads the generated scene prose.
3. After `accept-with-edit`, the live assembly preserves edited source/prose provenance where current records expose it.
4. `reject` and `request-rewrite` do not overwrite existing live assembly prose.
5. Missing prose appears as an explicit gap with stable scene id and gap reason.
6. Chapter/scene ordering is id/order based, not display-title based.
7. Run events remain lightweight and do not inline prose.
8. Existing PR37 draft assembly regression tests remain green.

Prefer reusing setup helpers from:

```text
packages/api/src/createServer.draft-assembly-regression.test.ts
packages/api/src/createServer.run-flow.test.ts
packages/api/src/createServer.read-surfaces.test.ts
```

### 6.6 Renderer Client / Runtime Contract

Add the new read method to the renderer API boundary:

```ts
BookClient.getBookDraftAssembly(input: { bookId: string }): Promise<BookDraftAssemblyRecord | null>
```

Update all relevant runtime implementations:

```text
mock book client
API transport / createApiProjectRuntime book client
book query keys
```

Do not let production renderer code bypass `ProjectRuntime` or manually fetch the endpoint.

### 6.7 Renderer Query Adoption

Update Book Draft query logic so Book Draft can consume the live assembly contract.

Preferred outcome:

```text
useBookDraftWorkspaceQuery
  -> reads book draft assembly through BookClient when available
  -> maps BookDraftAssemblyRecord into existing BookDraftWorkspaceViewModel
  -> keeps selectedChapterId from route
  -> keeps compare/export/review deriving from BookDraftWorkspaceViewModel
```

Acceptable fallback if needed for Storybook/mock:

```text
API runtime uses getBookDraftAssembly.
Mock/story runtime can temporarily use the existing client-side fanout path.
```

If this fallback is used, document it in the audit and make sure product API runtime still exercises the new endpoint.

### 6.8 Renderer Mapper Tests

Add or extend tests near:

```text
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts
packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts
```

Cover:

- live assembly record maps to existing Book Draft read surface
- selected chapter still comes from route, not layout/local storage
- missing draft scenes remain explicit gaps
- compare still uses current assembly vs historical checkpoint
- export preview still consumes current assembly without mutating export artifacts
- review inbox stable issue ids survive live assembly source changes
- PR36 duplicate key guard remains green

### 6.9 Storybook Preservation

Do not rewrite Storybook.

Only add a narrow story if it helps document the new read boundary, for example:

```text
Mockups/Book/BookDraftWorkspace / LiveAssemblyApiRead
```

The story must use fixed fixtures and must not require the real API server.

If existing stories already cover the relevant visual states and no UI changes are visible, do not add a story; record the decision in the audit.

---

## 7. Expected File Touch Map

Expected new files:

```text
doc/review/post-pr37-book-draft-live-assembly-audit.md
packages/api/src/createServer.book-draft-live-assembly.test.ts
```

Expected API files to touch:

```text
doc/api-contract.md
packages/api/src/contracts/api-records.ts
packages/api/src/routes/book.ts
packages/api/src/repositories/fixtureRepository.ts
packages/api/src/repositories/fixture-data.ts              # only if fixture seed needs stable missing/generated cases
packages/api/src/createServer.read-surfaces.test.ts        # optional, only if current read-surface matrix needs updating
```

Expected renderer files to touch:

```text
packages/renderer/src/features/book/api/book-client.ts
packages/renderer/src/features/book/hooks/book-query-keys.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts       # only if retaining fallback/shared code
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.ts
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
packages/renderer/src/app/project-runtime/**
```

Allowed only if necessary:

```text
packages/renderer/src/features/book/types/**
packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx
packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts
```

Do not touch unless explicitly justified:

```text
apps/desktop/**
packages/renderer/src/features/workbench/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/scene/**       # except tests if invalidation evidence requires it
pnpm-lock.yaml
package.json
Temporal / worker / SSE placeholders
```

---

## 8. Implementation Order

### Step 1: Baseline Tests

Run focused baseline commands before changing code:

```bash
pnpm --filter @narrative-novel/api test -- src/createServer.draft-assembly-regression.test.ts
pnpm --filter @narrative-novel/api test -- src/createServer.read-surfaces.test.ts
pnpm --filter @narrative-novel/renderer test -- src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
pnpm --filter @narrative-novel/renderer test -- src/features/book/lib/book-draft-workspace-mappers.test.ts
pnpm --filter @narrative-novel/renderer test -- src/features/book/containers/BookDraftWorkspace.test.tsx
```

If the runner broadens to the full suite, keep the command and record actual output.

### Step 2: Inventory Current Assembly Sources

Search for:

```text
BookDraftWorkspaceViewModel
buildBookDraftWorkspaceViewModel
useBookWorkspaceSources
sceneProseBySceneId
traceRollupsBySceneId
BookManuscriptCheckpointRecord
BookExportArtifactRecord
submitRunReviewDecision
syncSceneProseFromAcceptedRun
syncChapterSceneProseStatus
```

Record the source graph in the audit before changing behavior.

### Step 3: Add API Record + Route + Repository Method

Add the API record, repository method, and route.

Start with a minimal response shape that can support the existing Book Draft workspace. Do not add a giant manuscript/export schema.

### Step 4: Add API Tests

Write tests that fail before the route exists and pass after implementation.

Focus on the real gap:

```text
review accept -> live book draft assembly reads current generated scene prose
```

### Step 5: Add Renderer Client Method

Add `getBookDraftAssembly` to the BookClient and API runtime.

Do not bypass runtime with direct fetches.

### Step 6: Adopt in Book Draft Query

Map the new record into the existing `BookDraftWorkspaceViewModel` and preserve current `BookDraftWorkspace` UI behavior.

Do not redesign Book Draft.

### Step 7: Re-run PR36 / PR37 Guards

Run the tests that guarded the two previous PRs:

```bash
pnpm --filter @narrative-novel/renderer test -- src/features/book/containers/BookDraftWorkspace.test.tsx
pnpm --filter @narrative-novel/api test -- src/createServer.draft-assembly-regression.test.ts
```

### Step 8: Update Audit and Contract

Fill the audit verification matrix with exact commands/results.

### Step 9: Final Commands

Run at minimum:

```bash
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/renderer typecheck
pnpm typecheck
pnpm test
```

If Storybook files changed, also run:

```bash
pnpm --filter @narrative-novel/renderer build-storybook
```

If full suites are too slow or the local agent environment has unrelated failures, run all focused tests plus package-level typecheck and document skipped full commands in the audit.

---

## 9. Acceptance Criteria

PR38 is complete only if all of the following are true:

1. `doc/review/post-pr37-book-draft-live-assembly-audit.md` exists and is filled.
2. `doc/api-contract.md` documents the live Book Draft assembly read endpoint.
3. `GET /api/projects/{projectId}/books/{bookId}/draft-assembly` exists and returns `null` for missing books.
4. The endpoint assembles current chapter/scene order from current fixture read models.
5. Accepted selected variants materialized into scene prose are visible in the live book draft assembly.
6. `accept-with-edit` semantics remain visible where current source/provenance records expose them.
7. `reject` and `request-rewrite` do not overwrite live book draft prose.
8. Missing scene prose appears as an explicit gap, not an empty success row.
9. Historical manuscript checkpoints remain snapshots and are not mutated by run review decisions.
10. Export artifacts remain generated deliverables and are not mutated by run review decisions.
11. Book Draft renderer can consume the live API read contract or has a documented temporary mock fallback while API runtime uses the new endpoint.
12. Compare/export/review surfaces continue to derive from the current Book Draft workspace without duplicate identities.
13. Run events remain lightweight and ref-based.
14. No new dashboard/page-like UI is added.
15. No Workbench layout ownership is moved into business components.
16. PR36 duplicate-key guard remains green.
17. PR37 draft assembly regression coverage remains green.
18. Typecheck and relevant tests pass, or any environment-only limitation is explicitly recorded.

---

## 10. Suggested PR Description

Use this as the PR body:

```md
## Summary

PR38 adds a live Book Draft assembly read contract after PR37 proved the Scene -> Chapter -> Book draft regression chain.

It introduces `GET /api/projects/{projectId}/books/{bookId}/draft-assembly` as the current manuscript read surface, separate from historical manuscript checkpoints and generated export artifacts.

## What changed

- Added a post-PR37 live Book Draft assembly audit.
- Documented the new API read contract in `doc/api-contract.md`.
- Added API record/route/repository support for current Book Draft assembly.
- Added API regression coverage for accepted scene prose appearing in live Book Draft assembly.
- Added renderer client/query/mapper coverage so Book Draft can consume the current read model.
- Preserved PR36 duplicate key stability and PR37 propagation regression tests.

## Non-goals

- No production database / real persistence.
- No Temporal / durable workflow engine.
- No real SSE / WebSocket streaming.
- No real LLM integration.
- No prompt editor / RAG / context policy mutation.
- No Workbench layout or new product surface.
- No mutation of manuscript checkpoints after run review decisions.
- No mutation of export artifacts after run review decisions.

## Validation

- [ ] pnpm --filter @narrative-novel/api test
- [ ] pnpm --filter @narrative-novel/renderer test
- [ ] pnpm --filter @narrative-novel/api typecheck
- [ ] pnpm --filter @narrative-novel/renderer typecheck
- [ ] pnpm typecheck
- [ ] pnpm test
```

---

## 11. Roadmap After PR38

After PR38, continue in this order unless new evidence changes the priority:

```text
PR39: Runtime Polling / Stale-State UX Hardening
PR40: Repository Persistence Boundary Planning
PR41: Context Builder Seam and Policy-to-Builder Transition
PR42: Thin Real Persistence Vertical Slice
PR43: Optional SSE Transport After Polling Is Stable
PR44: Desktop Project Picker / Local Project Directory Contract
PR45: Durable Workflow Kernel Planning or Temporal Spike
```

### PR39 — Runtime Polling / Stale-State UX Hardening

Goal:

```text
Make REST polling/page contract feel reliable before SSE.
```

Focus:

- explicit stale / refreshing / failed-poll states
- retry affordance in support surfaces
- current-run event pagination confidence
- no `events/stream` implementation yet
- Book Draft live assembly invalidation/refresh after scene review decisions

### PR40 — Repository Persistence Boundary Planning

Goal:

```text
Prepare to replace fixture-only API internals without disturbing renderer contracts.
```

Focus:

- repository interfaces
- data ownership notes
- current/live read models vs historical snapshots
- artifacts/trace/run-events as product read surfaces
- no Temporal-first rewrite

### PR41 — Context Builder Seam

Goal:

```text
Move from read-only context activation explanation toward a backend-owned context builder seam.
```

Focus:

- context packet source ownership
- asset visibility rules
- included/excluded/redacted trace semantics
- no prompt editor, no full RAG, no policy mutation UI yet

### PR42 — Thin Real Persistence Vertical Slice

Goal:

```text
Persist one narrow product path without changing renderer contracts.
```

Suggested first slice:

```text
project -> book/chapter/scene read models -> scene prose materialization -> live book draft assembly
```

### PR43 — Optional SSE After Polling Is Stable

Goal:

```text
Implement real run event streaming only after polling UX and read-model invalidation are stable.
```

### PR44+ — Desktop and Durable Workflow Lines

Desktop can continue, but only behind the API/runtime boundary. Durable workflow planning can start after the repository seam and at least one thin persistence slice are stable.

Do not move to Spatial Blackboard / Blender / visual generation until the text manuscript chain and runtime read model are reliable.

---

## 12. Final Rule

PR38 succeeds when the product can answer, through an API-owned read contract:

```text
What is the current Book Draft manuscript now?
Which current Scene prose rows does it include?
Which rows are missing drafts?
Which source ids and trace rollups explain those rows?
Which historical checkpoints remain snapshots rather than live state?
Why can Compare / Export / Review derive from this current assembly without inventing another truth source?
```

If the answer still depends only on renderer-side fanout and cannot be verified through a product API endpoint, PR38 is not finished.

# Post-PR39 Roadmap and PR40 AI Execution Plan

> Source branch: `codex/pr39-runtime-fixture-parity-guard`  
> Recommended next branch: `codex/pr40-book-draft-api-read-slice-regression-closure`  
> Date: 2026-04-27  
> Audience: AI coding agent  
> Status: executable plan

---

## 0. Executive Decision

PR39 successfully hardened the runtime / fixture parity boundary, but it left the full renderer suite red because two Book Draft API read-slice tests still expect the pre-`draft-assembly` read graph.

Therefore the next PR should **not** start the originally planned shared fixture extraction yet.

The next PR should be:

```text
PR40: Book Draft API Read-Slice Regression Closure
```

The purpose of PR40 is narrow:

```text
Make the full renderer test suite green again by aligning the Book Draft API read-slice tests,
test helpers, and null-state expectations with the current live `book draft assembly` contract.
```

PR40 is a regression-closure PR, not a product feature PR.

---

## 1. Why PR40 Comes Next

PR39's audit says the focused PR39 runtime parity checks passed, but the full renderer suite still has two failing tests:

```text
src/app/project-runtime/api-read-slice-contract.test.tsx
  api read-slice contract
  renders the book draft review deep link through the API runtime and keeps the read graph on stable GET-only query keys

src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
  BookDraftWorkspace API read-slice review states
  shows book not found and stops chapter scene and review reads when book structure resolves to null
```

Those failures are not a reason to change product direction. They are a signal that the tests still encode an older read graph.

The current API contract says the live Book Draft read model is:

```text
GET /api/projects/:projectId/books/:bookId/draft-assembly
```

It is no longer correct for the default API runtime path to assert the older fanout as the main contract:

```text
book structure
-> chapter structure
-> scene prose
-> scene execution
-> scene inspector
-> scene patch preview
```

That fanout may remain as a deliberate fallback path, but it should not be the default API read-slice expectation when `draft-assembly` is supported.

---

## 2. Non-Negotiable Product Constraints

This PR must preserve the Narrative IDE / Workbench direction.

### This PR must not

- Add a new page-like dashboard.
- Change `WorkbenchShell` layout behavior.
- Add local pane layout state inside a business scope.
- Touch Electron desktop process supervision unless a test import requires it.
- Introduce real DB persistence.
- Introduce Temporal, SSE, WebSocket, LLM, RAG, or model provider code.
- Implement shared fixture seed extraction.
- Rewrite Book Draft UI.
- Change route semantics.
- Hide the full renderer test failure by skipping tests.
- Weaken the product contract so that invalid dependent reads are silently accepted.

### This PR must

- Preserve route/layout separation.
- Keep Book Draft as a Workbench scope/lens surface.
- Treat `draft-assembly` as the default live Book Draft API read model.
- Keep legacy book/chapter/scene fanout only as an explicit fallback test path.
- Ensure null / not-found Book Draft states stop dependent reads.
- Keep run events and artifact reads lightweight and ref-based.
- Add or update an audit note that records what was changed and what commands passed.

---

## 3. Mandatory Reading Before Coding

Read these files first:

```text
doc/frontend-workbench-constitution.md
doc/api-contract.md
doc/post-pr38-roadmap-and-pr39-ai-execution-plan.md
doc/review/post-pr38-runtime-fixture-parity-audit.md
README.md
```

Then inspect these implementation files:

```text
packages/renderer/src/app/project-runtime/api-read-slice-contract.test.tsx
packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx
packages/renderer/src/app/project-runtime/book-query-keys.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
```

Only inspect API files if renderer fixture helpers require confirmation:

```text
packages/api/src/createServer.book-draft-live-assembly.test.ts
packages/api/src/createServer.book-draft-live-assembly-regression.test.ts
packages/api/src/createServer.fixture-integrity.test.ts
packages/api/src/fixtures.ts
```

---

## 4. Workbench Constitution Compliance

This PR must not:

- bypass `WorkbenchShell`;
- add page-like dashboard UI;
- implement local pane layout;
- duplicate shell state;
- put primary work in Inspector or Bottom Dock;
- mix route state with layout preference;
- create a second selected-object truth source.

This PR must:

- keep Book Draft ownership inside the existing Workbench route/scope/lens model;
- keep Main Stage primary task unchanged;
- preserve route restore behavior;
- preserve layout restore behavior;
- avoid visual/layout refactors;
- test read graph and null-state behavior rather than just text rendering.

---

## 5. PR40 Deliverables

### Deliverable A — Baseline Reproduction

Run the failing tests before changing code.

```bash
pnpm --filter @narrative-novel/renderer exec vitest run \
  src/app/project-runtime/api-read-slice-contract.test.tsx \
  src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
```

Record the exact failures in the PR audit file created in Deliverable F.

Expected starting point:

```text
api-read-slice-contract.test.tsx fails because expected API requests/query keys still represent the legacy fanout read graph.

BookDraftReviewApiReadSlice.test.tsx fails because it overrides `bookStructure` to null, but the current live path reads `bookDraftAssembly`.
```

If the exact failure text differs, update the audit with the observed failure and solve the observed issue without expanding PR scope.

---

### Deliverable B — Align API Read-Slice Fixture Expectations

Update:

```text
packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts
```

The default API read-slice contract for Book Draft Review must expect the current live assembly path.

The expected default read graph should include the relevant subset of:

```text
GET /api/projects/:projectId/runtime-info

GET /api/projects/:projectId/books/:bookId/draft-assembly

GET /api/projects/:projectId/books/:bookId/manuscript-checkpoints
GET /api/projects/:projectId/books/:bookId/manuscript-checkpoints/:checkpointId

GET /api/projects/:projectId/books/:bookId/export-profiles
GET /api/projects/:projectId/books/:bookId/export-profiles/:profileId
GET /api/projects/:projectId/books/:bookId/export-artifacts

GET /api/projects/:projectId/books/:bookId/experiment-branches
GET /api/projects/:projectId/books/:bookId/experiment-branches/:branchId

GET /api/projects/:projectId/review/decisions
GET /api/projects/:projectId/review/fix-actions
```

The default expected graph must not include legacy per-chapter / per-scene fanout reads such as:

```text
GET /api/projects/:projectId/books/:bookId/structure
GET /api/projects/:projectId/chapters/:chapterId/structure
GET /api/projects/:projectId/scenes/:sceneId/prose
GET /api/projects/:projectId/scenes/:sceneId/execution
GET /api/projects/:projectId/scenes/:sceneId/inspector
GET /api/projects/:projectId/scenes/:sceneId/patch-preview
```

Those legacy reads may appear only in a dedicated fallback test that explicitly disables or rejects `draft-assembly` support.

Also update expected query keys so that the default API live path uses the current draft assembly key.

Expected direction:

```text
bookQueryKeys.draftAssembly(bookId, locale)
```

Do not keep default expectations that require the old `book workspace -> chapter structure -> scene reads` query-key tree.

---

### Deliverable C — Update the API Read-Slice Contract Test

Update:

```text
packages/renderer/src/app/project-runtime/api-read-slice-contract.test.tsx
```

The test named approximately:

```text
renders the book draft review deep link through the API runtime and keeps the read graph on stable GET-only query keys
```

must now assert:

1. The route still opens Book Draft Review through the API runtime.
2. The read graph is still GET-only.
3. The default Book Draft workspace read uses `draft-assembly`.
4. Review / compare / export / branch support reads remain stable if the route needs them.
5. No legacy chapter/scene fanout is requested in the live assembly path.
6. Query keys match the current live path, not the old fallback path.

Important: do not remove the test. Fix the test so it protects the current contract.

---

### Deliverable D — Add or Preserve a Dedicated Legacy Fallback Test

If the old fanout behavior still exists intentionally, preserve it as a separate explicit test.

Suggested test name:

```text
falls back to the legacy book/chapter/scene read graph when draft assembly is unsupported
```

That test should force the runtime to behave as if `getBookDraftAssembly` is unsupported, then assert the legacy graph.

Acceptable ways to force fallback:

- a fake runtime method that throws the existing unsupported-method sentinel;
- a helper option such as `supportsDraftAssembly: false`;
- an explicit test runtime wrapper that omits `getBookDraftAssembly`.

Do not let the fallback path remain mixed into the default API live path expectations.

---

### Deliverable E — Fix Book Draft Not-Found / Null-State Test

Update:

```text
packages/renderer/src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
```

The current failing test overrides `bookStructure` to null. That is stale for the live assembly path.

Update the test so the live `draft-assembly` response is null or not found.

Expected behavior:

```text
- Book Draft workspace shows the existing not-found/null-state UI.
- Dependent review / checkpoint / export / branch / chapter / scene reads do not start after the workspace resolves to null.
- The allowed baseline requests are limited to runtime-info and draft-assembly, unless the implementation has a clearly justified preflight read.
```

If the component currently starts dependent reads before the null workspace is known, fix the production gating rather than weakening the test.

Likely implementation areas:

```text
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
```

However, avoid production changes if fixture/test helper alignment is enough.

---

### Deliverable F — Add a PR40 Audit Note

Create:

```text
doc/review/post-pr39-book-draft-api-read-slice-regression-audit.md
```

Minimum content:

```md
# Post-PR39 Book Draft API Read-Slice Regression Audit

- Source branch:
- PR branch:
- Date:
- Verdict:

## Why this PR existed

Explain that PR39 passed focused runtime parity checks but the full renderer suite remained red because two Book Draft API read-slice tests still expected the old fanout graph.

## Contract decision

State that `book draft assembly` is the default API live read model for Book Draft workspace.

## Files changed

List changed files.

## Tests run

List commands and pass/fail result.

## Deferred follow-up

Mention that shared fixture seed extraction is deferred to PR41.
Mention any remaining fixture identity cleanup such as extra scenes or gap wording if still present.
```

Do not over-document unrelated future work.

---

## 6. Expected Touch Map

Expected files to change:

```text
packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts
packages/renderer/src/app/project-runtime/api-read-slice-contract.test.tsx
packages/renderer/src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
doc/review/post-pr39-book-draft-api-read-slice-regression-audit.md
```

Possible files to change only if required:

```text
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/book-query-keys.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
```

Files that should normally not change:

```text
packages/api/**
apps/desktop/**
packages/renderer/src/features/workbench/**
packages/renderer/src/features/scene/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/asset/**
```

If those files need changes, explain why in the audit.

---

## 7. Implementation Order

Follow this order exactly.

### Step 1 — Reproduce

Run:

```bash
pnpm --filter @narrative-novel/renderer exec vitest run \
  src/app/project-runtime/api-read-slice-contract.test.tsx \
  src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
```

Write down current failures.

### Step 2 — Inspect current live assembly behavior

Inspect:

```text
useBookDraftWorkspaceQuery.ts
book-query-keys.ts
api-read-slice-fixtures.ts
```

Confirm:

```text
- live path prefers getBookDraftAssembly;
- legacy fallback is only for unsupported draft assembly;
- query keys have a draftAssembly key.
```

### Step 3 — Update API read-slice fixtures

Update expected requests and expected query keys.

### Step 4 — Update default API read-slice contract test

Make the default test protect the live assembly contract.

### Step 5 — Add or update fallback test

Only keep legacy fanout in an explicit unsupported-assembly test.

### Step 6 — Update null-state test

Make the null-state test return null from draft assembly, not book structure.

If dependent reads still fire after null assembly, fix gating.

### Step 7 — Run focused tests

```bash
pnpm --filter @narrative-novel/renderer exec vitest run \
  src/app/project-runtime/api-read-slice-contract.test.tsx \
  src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
```

### Step 8 — Run full renderer suite

```bash
pnpm --filter @narrative-novel/renderer test
```

### Step 9 — Run typecheck

```bash
pnpm --filter @narrative-novel/renderer typecheck
```

### Step 10 — Add audit note

Create the audit file and record commands.

### Step 11 — Optional root verification

If time allows and no unrelated failures appear:

```bash
pnpm test
pnpm typecheck
```

If root commands fail because of unrelated pre-existing issues, record them precisely in the audit.

---

## 8. Acceptance Criteria

PR40 is complete only when all of the following are true:

- The two known failing renderer tests pass.
- `pnpm --filter @narrative-novel/renderer test` passes.
- `pnpm --filter @narrative-novel/renderer typecheck` passes.
- The default Book Draft API read-slice test expects `draft-assembly`.
- Legacy chapter/scene fanout is tested only as an explicit fallback path.
- The Book Draft null-state test is based on null / not-found `draft-assembly`, not null `bookStructure`.
- Dependent reads do not continue after the workspace resolves to null.
- No Workbench layout or product UI behavior is changed.
- PR40 audit note exists and records commands.

---

## 9. Suggested PR Description

Use this structure:

```md
## Summary

- closes the post-PR39 Book Draft API read-slice regression
- updates the default Book Draft API contract to use the live `draft-assembly` read model
- moves legacy chapter/scene fanout expectations into an explicit fallback path
- updates the Book Draft not-found test to null the draft assembly response
- records the regression closure audit

## Why

PR39 hardened runtime fixture parity but left the full renderer suite red because two Book Draft API read-slice tests still asserted the old fanout graph.

## Tests

- [ ] pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/api-read-slice-contract.test.tsx src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
- [ ] pnpm --filter @narrative-novel/renderer test
- [ ] pnpm --filter @narrative-novel/renderer typecheck
```

---

## 10. Roadmap After PR40

After PR40 makes the renderer suite green again, continue with the post-PR39 roadmap, renumbered by one PR.

### PR41 — Shared Canonical Fixture Seed Extraction

Purpose:

```text
Extract one canonical seed for book/chapter/scene identity so API fixture and renderer mock cannot drift again.
```

Focus:

- central fixture seed for `book-signal-arc`;
- canonical scene ordering;
- explicit treatment of extra mock scenes such as `scene-canal-watch` and `scene-dawn-slip`;
- renderer mock and API fixture derive identity from shared seed;
- view models remain separate.

Do not do DB, SSE, LLM, or UI redesign.

---

### PR42 — Runtime Polling / Stale-State UX Hardening

Purpose:

```text
Make polling and stale-state behavior product-safe before implementing SSE.
```

Focus:

- stale / refreshing / failed-poll states;
- retry affordance;
- invalidation after review decision, prose revision, scene reorder;
- no full stream implementation yet.

---

### PR43 — Repository Persistence Boundary Planning

Purpose:

```text
Define the repository boundary before adding real persistence.
```

Focus:

- repository interfaces;
- artifact/event/domain ownership;
- fixture repository vs future persistent repository;
- migration plan.

Do not implement a real DB in this PR.

---

### PR44 — Thin Real Persistence Vertical Slice

Purpose:

```text
Persist one narrow write path for real, while preserving fixture/runtime contracts.
```

Recommended first target:

```text
scene prose revision
```

Alternative target:

```text
review decision -> canon patch materialization
```

Choose one, not both.

---

### PR45 — Context Builder Seam

Purpose:

```text
Move from fixture context packets toward a real context builder boundary.
```

Focus:

- typed context packet inputs;
- asset policy application seam;
- included/excluded/redacted trace;
- no RAG/vector database yet.

---

### PR46 — Optional SSE / Event Stream Implementation

Only start this after polling and stale-state behavior are stable.

Purpose:

```text
Implement real event streaming without changing product-level run event semantics.
```

Rules:

- product run events remain lightweight refs;
- no raw LLM token stream as product truth;
- `events/stream` can replace polling transport, not product model.

---

## 11. Final Rule for the AI Agent

Do not make PR40 “more useful” by adding features.

PR40 exists to close a concrete regression and restore suite trust after PR39.

If you discover a broader issue, record it in the audit and defer it.

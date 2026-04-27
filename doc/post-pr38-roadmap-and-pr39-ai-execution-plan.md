# Post-PR38 Roadmap and PR39 AI Execution Plan

> Date: 2026-04-27  
> Source branch: `codex/pr38-book-draft-live-assembly-read-contract`  
> Recommended next branch: `codex/pr39-runtime-fixture-parity-guard`  
> Audience: AI coding agent / implementation agent  
> Scope: contract hardening after PR38, especially Web/mock vs Desktop/API fixture drift prevention

---

## 0. Executive Decision

PR38 has moved Book Draft toward the correct read boundary:

```text
GET /api/projects/{projectId}/books/{bookId}/draft-assembly
```

The next PR should **not** add another product surface, real persistence, Temporal, SSE, LLM integration, Spatial Blackboard, Blender, prompt editor, RAG, policy mutation, or desktop project picker.

The next PR should be:

```text
PR39: Runtime / Fixture Parity Guard
```

The purpose is to prevent the exact class of bug recently exposed in Desktop:

```text
Navigator / chapter / book structure can reference an object
but the API runtime cannot open/read that object.
```

This is a contract-hardening PR, not a feature PR.

---

## 1. Why PR39 Comes Next

PR38 made the Book Draft live assembly contract real enough for the renderer to prefer it when available, while keeping the legacy client fanout path as fallback.

That is good, but it also raises the cost of fixture/runtime drift:

```text
Web/mock runtime may look healthy.
Desktop-local API runtime may expose missing scene/chapter/book read surfaces.
Book Draft live assembly can now depend on API-only assembly semantics.
```

The recent Desktop/Web drift diagnosis showed three classes of issue:

1. Web and Electron do not necessarily use the same runtime source.
2. Renderer/mock fixture and API fixture can drift.
3. Desktop dev/build behavior can hide stale renderer or stale local API state.

PR39 should lock these as tests and an audit, so future AI PRs cannot accidentally add a scene/chapter/book reference that only works in one runtime.

---

## 2. Final Instruction to the AI Coding Agent

Start from:

```bash
git checkout codex/pr38-book-draft-live-assembly-read-contract
git checkout -b codex/pr39-runtime-fixture-parity-guard
```

Then execute this plan without broadening the PR.

### Main Goal

Create automated guardrails proving:

```text
book structure -> chapter structure -> scene ids -> scene read surfaces
book draft live assembly -> chapter ids / scene ids -> scene prose/read surfaces
renderer mock runtime -> same fixture identity rules
api runtime -> same fixture identity rules
desktop-local runtime config -> uses API runtime, not mock fallback
run events -> remain lightweight refs, not prose/context payloads
```

### Do Not Do

Do not implement or add:

- real persistence / DB
- Temporal / durable workflow engine
- real SSE / WebSocket stream
- real LLM integration
- prompt editor
- RAG / vector search
- Asset Context Policy mutation
- domain-safe recipes
- desktop project picker
- local file/project directory integration
- Workbench layout changes
- editor tabs / command palette / status bar
- Spatial Blackboard / Blender
- new dashboard-like UI
- new page-level route outside WorkbenchShell
- broad visual redesign

If a missing fixture contract cannot be fixed narrowly, document it in the PR39 audit and do not expand into a new architecture PR.

---

## 3. Mandatory Reading Before Coding

Read these files first:

```text
README.md
AGENTS.md
doc/api-contract.md
doc/frontend-workbench-constitution.md
doc/review/post-pr37-book-draft-live-assembly-audit.md
doc/review/post-pr36-chapter-book-draft-assembly-regression-audit.md
doc/review/post-pr35-book-draft-stability-audit.md
```

Also inspect:

```text
packages/api/src/createServer.book-draft-live-assembly.test.ts
packages/api/src/createServer.draft-assembly-regression.test.ts
packages/api/src/createServer.read-surfaces.test.ts
packages/api/src/repositories/fixture-data.ts
packages/api/src/repositories/fixtureRepository.ts
packages/api/src/routes/book.ts
packages/api/src/routes/chapter.ts
packages/api/src/routes/scene.ts
packages/renderer/src/app/runtime/runtime-config.ts
packages/renderer/src/app/runtime/runtime-config.test.ts
packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx
packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
packages/renderer/src/app/project-runtime/api-route-contract.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
packages/renderer/src/features/book/api/book-draft-assembly-records.ts
packages/renderer/src/features/book/api/book-client.ts
apps/desktop/src/main/runtime-config.ts
apps/desktop/src/main/local-api-supervisor.ts
apps/desktop/src/preload/desktop-api.ts
scripts/desktop-dev.mjs
scripts/desktop-dev-utils.mjs
scripts/desktop-dev-utils.test.mjs
```

If a listed file path has changed, find the nearest current equivalent by grepping the feature name.

---

## 4. Workbench Constitution Compliance

This PR must not:

- bypass `WorkbenchShell`
- add page-like dashboards
- implement local pane layout
- duplicate shell state
- put primary work in Inspector or Bottom Dock
- mix route state with layout preference
- create a second selected-object truth source
- convert run/review/prose into chat transcript UI
- inline large prompt / prose / raw LLM payload in run events

This PR must:

- preserve the Scope × Lens model
- preserve route as the business-state source of truth
- preserve layout as shell-owned local preference
- keep Main Stage ownership clear
- keep runtime source distinction explicit
- keep run events lightweight and ref-based
- add tests for fixture identity boundaries
- add tests for runtime selection boundaries
- add an audit document explaining what is guarded

If implementation makes the product feel more like a generic web app than a Narrative IDE, the PR fails.

---

## 5. PR39 Deliverables

### 5.1 Add Runtime / Fixture Parity Audit

Create:

```text
doc/review/post-pr38-runtime-fixture-parity-audit.md
```

Use this structure:

```md
# Post-PR38 Runtime / Fixture Parity Audit

## Branch
- Source branch:
- PR branch:

## Summary
- What runtime/fixture drift class PR39 protects against
- What tests were added
- What was fixed
- What remains intentionally deferred

## Runtime Matrix
| Runtime | Source | Expected behavior | Guarded by |
|---|---|---|---|
| Web without API base URL | renderer mock runtime | Storybook/test/demo only | |
| Web with `VITE_NARRATIVE_API_BASE_URL` | API runtime | product contract path | |
| Desktop local | desktop-local API runtime | product contract path with local API supervisor | |

## Fixture Identity Matrix
| Object graph | Rule | Test |
|---|---|---|
| book -> chapter ids | every book chapter id resolves through chapter structure API | |
| chapter -> scene ids | every chapter scene id resolves through scene workspace/setup/execution/prose/inspector/dock API | |
| book draft assembly -> scene rows | every scene row has canonical scene id and resolves to scene read surface | |
| gap rows | gaps mean missing prose, not missing scene fixture | |
| run artifacts/events | events only carry refs/counts; large payloads stay in artifacts/read models | |
| renderer mock runtime | mock navigator/book/chapter scene ids resolve inside mock runtime | |

## Desktop/Web Drift Checklist
- Does desktop-local runtime bypass mock fallback?
- Does desktop API fixture cover every navigator-visible scene?
- Does renderer build/dev behavior match documented desktop behavior?
- Does local API status expose enough signal to debug stale processes?

## Verification Matrix
| Area | Command | Result |
|---|---|---|

## Files Changed
-

## Commands Run
```bash

```

## Deferred Follow-up
- Only list items outside PR39 scope.
```

---

### 5.2 API Fixture Integrity Tests

Add or extend tests that prove the API fixture is internally reachable.

Preferred new file:

```text
packages/api/src/createServer.fixture-integrity.test.ts
```

Required assertions:

1. Every `book.chapterIds[]` from `GET /books/{bookId}/structure` resolves through:

```text
GET /api/projects/{projectId}/chapters/{chapterId}/structure
```

2. Every `chapter.scenes[].id` from every chapter structure resolves through scene read surfaces:

```text
GET /api/projects/{projectId}/scenes/{sceneId}/workspace
GET /api/projects/{projectId}/scenes/{sceneId}/setup
GET /api/projects/{projectId}/scenes/{sceneId}/execution
GET /api/projects/{projectId}/scenes/{sceneId}/prose
GET /api/projects/{projectId}/scenes/{sceneId}/inspector
GET /api/projects/{projectId}/scenes/{sceneId}/dock-summary
```

Expected result: `200` for existing scene fixtures.

Important: `prose` may be an empty/missing prose read model, but it must not be `SCENE_NOT_FOUND` for navigator-visible scene ids.

3. `GET /books/{bookId}/draft-assembly` must not introduce anonymous or title-matched identity. For every chapter/scene row:

```text
assembly.chapter.chapterId exists in book structure
assembly.scene.sceneId exists in that chapter's scene list
scene.kind === 'gap' means missing prose/readiness, not missing scene fixture
scene.kind === 'draft' means prose body is read-model payload, not run-event payload
```

4. `reject` and `request-rewrite` decisions must not overwrite live assembly prose.

5. Run events after review remain lightweight:

```text
serialized events must not contain full prose body
serialized events must not contain full context packet body
serialized events must include refs for canon patch / prose draft when those events exist
```

Prefer extending existing coverage only if it stays readable:

```text
packages/api/src/createServer.book-draft-live-assembly.test.ts
packages/api/src/createServer.draft-assembly-regression.test.ts
packages/api/src/createServer.read-surfaces.test.ts
```

If a new file is clearer, use the new `createServer.fixture-integrity.test.ts`.

---

### 5.3 Renderer Runtime Selection Tests

Add or extend tests so runtime selection cannot silently regress.

Likely files:

```text
packages/renderer/src/app/runtime/runtime-config.test.ts
packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.test.ts
```

Required assertions:

1. `desktopBridge.getRuntimeConfig()` returning `{ runtimeMode: 'desktop-local', apiBaseUrl }` makes renderer create API runtime.
2. Web runtime with `VITE_NARRATIVE_API_BASE_URL` makes renderer create API runtime.
3. Web runtime without `VITE_NARRATIVE_API_BASE_URL` stays mock runtime.
4. Invalid desktop runtime config fails loudly; it must not silently fall back to mock.
5. `bookClient.getBookDraftAssembly` is available in API runtime and fake API runtime test helpers.
6. Mock runtime either supports the same canonical fixture ids or explicitly remains fallback-only.

Do not change product runtime behavior unless a test proves the current behavior is wrong.

---

### 5.4 Renderer Mock Fixture Reachability Tests

Add a narrow mock-runtime integrity test.

Preferred new file:

```text
packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.ts
```

Alternative: extend `mock-project-runtime.test.ts` if that file already owns this concern.

Required assertions:

1. Book structure chapter ids resolve in mock runtime.
2. Chapter structure scene ids resolve in mock runtime scene clients.
3. Book Draft fallback path can still assemble with explicit gaps, not missing-object crashes.
4. Mock runtime fixture ids should match the API fixture ids for the canonical sample project where possible:

```text
book-signal-arc
chapter-signals-in-rain
chapter-open-water-signals
scene-midnight-platform
scene-concourse-delay
scene-ticket-window
scene-departure-bell
scene-warehouse-bridge
```

If any id is intentionally API-only or mock-only, record it in the audit doc with a reason. Do not silently ignore it.

---

### 5.5 Desktop Runtime Contract Tests

This PR should not make a full Desktop feature, but it should lock the runtime boundary.

Likely files:

```text
apps/desktop/src/main/runtime-config.test.ts
apps/desktop/src/main/local-api-supervisor.test.ts
apps/desktop/src/preload/desktop-api.test.ts
scripts/desktop-dev-utils.test.mjs
```

Required assertions:

1. `createDesktopRuntimeConfig(port)` returns:

```text
runtimeMode: 'desktop-local'
apiBaseUrl: http://127.0.0.1:{port}/api
apiHealthUrl: http://127.0.0.1:{port}/api/health
```

2. Local API supervisor exposes `runtimeConfig` only when status is `ready`.
3. Restart clears stale status/errors and returns a fresh snapshot.
4. Preload bridge exposes only the narrow `window.narrativeDesktop` API; no `ipcRenderer`, `fs`, or `child_process` leaks.
5. `desktop-dev` script behavior matches documentation.

Important reconciliation task:

- If the current branch code and docs disagree about whether `desktop:dev` starts a live renderer dev server or fresh-builds renderer dist, do **not** quietly leave the mismatch.
- Record the current behavior in the audit.
- Add or update tests for the intended behavior.
- If changing behavior is necessary, keep it narrow and update README/doc commands in the same PR.

---

### 5.6 Documentation Update

Update only narrow docs that explain runtime boundaries:

Allowed docs:

```text
doc/api-contract.md
README.md
doc/review/post-pr38-runtime-fixture-parity-audit.md
```

Do not rewrite product positioning or frontend constitution.

Required doc notes:

1. Web/mock and desktop-local API are intentionally different runtime modes.
2. Desktop-local is the stricter product contract validation path.
3. Fixture identity invariants are enforced by tests.
4. `draft-assembly` is current live manuscript read model, not a checkpoint/export artifact.
5. `events/stream` remains `501`; PR39 does not implement SSE.

---

## 6. Expected File Touch Map

### Expected new file

```text
doc/review/post-pr38-runtime-fixture-parity-audit.md
packages/api/src/createServer.fixture-integrity.test.ts
```

### Likely test files to touch

```text
packages/api/src/createServer.book-draft-live-assembly.test.ts
packages/api/src/createServer.draft-assembly-regression.test.ts
packages/api/src/createServer.read-surfaces.test.ts
packages/renderer/src/app/runtime/runtime-config.test.ts
packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.test.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.test.ts
apps/desktop/src/main/runtime-config.test.ts
apps/desktop/src/main/local-api-supervisor.test.ts
apps/desktop/src/preload/desktop-api.test.ts
scripts/desktop-dev-utils.test.mjs
```

### Source files may be touched only if tests prove a narrow mismatch

```text
packages/api/src/repositories/fixture-data.ts
packages/api/src/repositories/fixtureRepository.ts
packages/renderer/src/app/runtime/runtime-config.ts
packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
apps/desktop/src/main/runtime-config.ts
apps/desktop/src/main/local-api-supervisor.ts
apps/desktop/src/preload/desktop-api.ts
scripts/desktop-dev.mjs
scripts/desktop-dev-utils.mjs
README.md
doc/api-contract.md
```

### Do not touch

```text
packages/renderer/src/features/workbench/**
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx
packages/renderer/src/features/scene/containers/**
packages/renderer/src/features/asset/**
package.json
pnpm-lock.yaml
apps/desktop/package.json
```

Exception: if a narrow test import or type-only fix is unavoidable, document it in the audit.

---

## 7. Implementation Order

Follow this order exactly.

### Step 1: Baseline verification

Run focused tests first:

```bash
pnpm --filter @narrative-novel/api exec vitest run src/createServer.book-draft-live-assembly.test.ts
pnpm --filter @narrative-novel/api exec vitest run src/createServer.draft-assembly-regression.test.ts
pnpm --filter @narrative-novel/api exec vitest run src/createServer.read-surfaces.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/api-project-runtime.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
pnpm --filter @narrative-novel/desktop test
node --test scripts/desktop-dev-utils.test.mjs
```

If broad `pnpm test -- pattern` unexpectedly runs the full suite, use `pnpm ... exec vitest run exact-file` instead. Record any baseline unrelated failures in the audit.

### Step 2: Inventory canonical fixture ids

Use grep/search to inventory all book/chapter/scene ids referenced by:

```text
API book structure
API chapter structures
API scene records
API book draft assembly
renderer mock book/chapter/scene fixtures
storybook book/chapter/scene fixtures
navigator-visible ids
```

Suggested commands:

```bash
rg "book-signal-arc|chapter-|scene-" packages/api/src packages/renderer/src -g '*.ts' -g '*.tsx'
rg "scene-concourse-delay|scene-ticket-window|scene-departure-bell|scene-warehouse-bridge" packages/api/src packages/renderer/src -g '*.ts' -g '*.tsx'
```

Record the id matrix in the audit before modifying source code.

### Step 3: Write protective tests first

Write tests that fail on known drift patterns:

```text
chapter references scene but scene workspace returns 404
book draft assembly references scene id not in chapter structure
gap row means missing prose, not missing scene record
desktop-local runtime silently falls back to mock
run event contains full prose/context body
```

Do not start by editing fixtures.

### Step 4: Apply minimal fixes

Only fix what protective tests prove is broken:

- missing scene fixture
- missing route handler coverage
- wrong id mapping
- title-based matching where id-based matching is required
- mock/runtime fallback masking an invalid desktop config
- docs/test mismatch around `desktop:dev`

Avoid refactors.

### Step 5: Fill the audit

Update:

```text
doc/review/post-pr38-runtime-fixture-parity-audit.md
```

Include:

- runtime matrix
- fixture identity matrix
- exact files changed
- exact commands run
- any intentional runtime differences
- deferred follow-up list

### Step 6: Final verification

Run at minimum:

```bash
pnpm --filter @narrative-novel/api exec vitest run src/createServer.fixture-integrity.test.ts src/createServer.book-draft-live-assembly.test.ts src/createServer.draft-assembly-regression.test.ts src/createServer.read-surfaces.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts src/app/project-runtime/api-project-runtime.test.ts src/app/project-runtime/fake-api-runtime.test-utils.test.ts src/app/project-runtime/mock-project-runtime.test.ts src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
pnpm --filter @narrative-novel/desktop test
node --test scripts/desktop-dev-utils.test.mjs
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/desktop typecheck
pnpm typecheck
```

If source files changed outside tests/audit, also run the relevant package-level test suite:

```bash
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/desktop test
pnpm test
```

If a full command fails for a pre-existing unrelated timeout/failure, record it in the audit with the exact failing test and do not claim full-suite green.

---

## 8. Acceptance Criteria

PR39 is complete only if all are true:

1. `doc/review/post-pr38-runtime-fixture-parity-audit.md` exists and is filled.
2. API tests prove every book/chapter/scene fixture reference is reachable by id.
3. API tests prove `draft-assembly` does not introduce scene/chapter ids outside canonical structure.
4. API tests prove draft gaps are explicit missing-prose states, not hidden `SCENE_NOT_FOUND` states.
5. API tests prove run events remain lightweight and ref-based.
6. Renderer tests prove desktop-local runtime uses API runtime and does not silently fall back to mock.
7. Renderer tests prove web/mock fallback is intentional and still internally reachable.
8. Desktop tests prove runtime config/local API supervisor/preload bridge stay narrow and contract-safe.
9. Any `desktop:dev` code/doc mismatch is either fixed or explicitly recorded with a follow-up.
10. No Workbench layout, route, or product surface change is introduced.
11. No new page/dashboard UI is added.
12. No real persistence, SSE, Temporal, LLM, RAG, or Spatial/Blender work is introduced.
13. Focused tests and package typechecks pass, or unrelated environment-only failures are explicitly recorded.

---

## 9. Suggested PR Description

Use this as the PR body:

```md
## Summary
PR39 adds runtime and fixture parity guardrails after PR38.

It prevents Web/mock vs Desktop/API drift by testing that:
- book/chapter/scene fixture ids resolve through API read surfaces
- Book Draft live assembly only references canonical chapter/scene ids
- draft gaps mean missing prose, not missing scene fixture
- desktop-local runtime stays API-backed and does not silently fall back to mock
- run events remain lightweight refs

## What changed
- Added a post-PR38 runtime/fixture parity audit.
- Added API fixture integrity coverage.
- Added/extended renderer runtime selection and mock runtime fixture reachability tests.
- Added/extended desktop runtime config / local API supervisor / preload bridge tests where needed.
- Kept Workbench UI and product surfaces unchanged.

## Non-goals
- No real persistence.
- No Temporal / worker runtime.
- No SSE / WebSocket event stream.
- No LLM integration.
- No prompt editor / RAG / policy mutation.
- No Workbench layout changes.
- No new dashboard or page-level surface.

## Validation
- [ ] pnpm --filter @narrative-novel/api exec vitest run src/createServer.fixture-integrity.test.ts src/createServer.book-draft-live-assembly.test.ts src/createServer.draft-assembly-regression.test.ts src/createServer.read-surfaces.test.ts
- [ ] pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts src/app/project-runtime/api-project-runtime.test.ts src/app/project-runtime/fake-api-runtime.test-utils.test.ts src/app/project-runtime/mock-project-runtime.test.ts src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
- [ ] pnpm --filter @narrative-novel/desktop test
- [ ] node --test scripts/desktop-dev-utils.test.mjs
- [ ] pnpm --filter @narrative-novel/api typecheck
- [ ] pnpm --filter @narrative-novel/renderer typecheck
- [ ] pnpm --filter @narrative-novel/desktop typecheck
- [ ] pnpm typecheck
```

---

## 10. Roadmap After PR39

After PR39, continue in this order unless new evidence changes priority.

### PR40: Shared Fixture Seed Extraction

Goal:

```text
Stop hand-maintaining renderer/mock and API fixture data in parallel.
```

Expected focus:

- Extract a small shared canonical fixture seed for book/chapter/scene ids and ordering.
- API fixture and renderer mock fixture derive from that seed.
- Keep renderer Storybook/mock payloads view-model friendly, but ensure identities come from one source.
- Do not add real DB.
- Do not refactor all fixture data at once; start with `book-signal-arc` canonical path.

### PR41: Runtime Polling / Stale-State UX Hardening

Goal:

```text
Make current REST polling/page contract feel reliable before SSE.
```

Expected focus:

- explicit stale / refreshing / failed-poll state
- retry affordance in support surfaces
- cache invalidation after scene run decisions / prose revision / chapter reorder
- no `events/stream` implementation yet
- no fake SSE UI while stream remains 501

### PR42: Repository Persistence Boundary Planning

Goal:

```text
Prepare to replace fixture-only API internals without disturbing renderer contracts.
```

Expected focus:

- repository interfaces
- ownership of books/chapters/scenes/assets/runs/artifacts/trace
- artifact payload vs event metadata boundaries
- no production DB implementation yet

### PR43: Thin Real Persistence Vertical Slice

Goal:

```text
Persist one narrow object path without changing renderer contracts.
```

Recommended first path:

```text
review decision or scene prose revision
```

Do not start with whole-book persistence.

### PR44: Context Builder Seam and Policy-to-Builder Transition

Goal:

```text
Move from read-only Asset Context Policy explanation toward backend-owned context packet construction.
```

Expected focus:

- context packet source ownership
- asset visibility policy boundary
- included/excluded/redacted trace
- no prompt editor
- no full RAG
- no policy mutation UI yet

### PR45: Optional SSE Transport After Polling Is Stable

Goal:

```text
Add stream transport only after polling and stale-state UX are reliable.
```

Expected focus:

- `events/stream` can move from 501 placeholder to real stream
- keep polling fallback
- keep event payload lightweight
- do not make SSE required for core product state

### Parallel Desktop Line

Desktop work can continue, but it must stay behind the API/runtime boundary:

```text
Desktop project picker / local project directory only after API persistence boundaries are clearer.
```

Do not let file-system/project concerns leak into renderer route state or Workbench business state.

---

## 11. Final Rule

PR39 succeeds when the product can answer, with tests:

```text
If a scene is visible in Navigator, can desktop-local API open it?
If Book Draft live assembly references a scene, is that scene canonical and readable?
If Web/mock looks healthy, do we know whether Desktop/API is also healthy?
If Desktop uses API runtime, can it ever silently fall back to mock?
If run events mention prose/context, are they only refs to artifacts/read models?
```

If these answers are not testable, PR39 is not finished.

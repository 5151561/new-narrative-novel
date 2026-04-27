# Post-PR40 Roadmap and PR41 AI Execution Plan

> Source branch: `codex/pr40-book-draft-api-read-slice-regression-closure`  
> Recommended next branch: `codex/pr41-shared-canonical-fixture-seed`  
> Date: 2026-04-27  
> Audience: AI coding agent  
> Status: executable plan

---

## 0. Executive Decision

PR40 restored confidence in the renderer read-slice contract after PR39. The Book Draft API read-slice now treats `GET /api/projects/{projectId}/books/{bookId}/draft-assembly` as the default live Book Draft read model, and the null-state regression has focused coverage.

The next PR should be:

```text
PR41: Shared Canonical Fixture Seed Extraction
```

The purpose of PR41 is narrow:

```text
Create one shared source of truth for the canonical sample book/chapter/scene identity graph, then make API fixture tests, renderer mock fixture tests, and API read-slice fixtures consume that identity seed instead of hand-maintaining duplicate id arrays.
```

PR41 is not a product feature PR. It is not a persistence PR. It is not a UI PR. It is a fixture identity hardening PR.

---

## 1. Why PR41 Comes Next

The current project now has a thick runtime / API / artifact / trace contract surface. README says the repository currently contains three main workspaces: `@narrative-novel/renderer`, `@narrative-novel/api`, and `@narrative-novel/desktop`.

PR39 added parity guardrails for runtime selection and fixture reachability, but its audit still records that the canonical guard set is manually tracked across multiple places. The current canonical set is:

```text
Book:
  book-signal-arc

Chapters:
  chapter-signals-in-rain
  chapter-open-water-signals

Canonical scenes:
  scene-midnight-platform
  scene-concourse-delay
  scene-ticket-window
  scene-departure-bell
  scene-warehouse-bridge
```

The same audit also records two non-canonical renderer/mock extras:

```text
scene-canal-watch
scene-dawn-slip
```

These extras are intentionally retained for broader mock read / chapter draft preview coverage. They must not silently become canonical ids, and they must not be deleted in PR41 unless tests prove they are unreachable and the deletion is explicitly agreed by product intent. The correct PR41 move is to encode their status clearly:

```text
canonical ids      -> shared seed
mock-only extras   -> explicit preview / fallback extras, separate from canonical set
```

PR40 then closed the stale Book Draft API read-slice regression and recorded that shared fixture seed extraction remains deferred to PR41. So the next step is now clear: remove the next drift vector by extracting the id/order seed.

---

## 2. Non-Negotiable Product Constraints

PR41 must preserve the Narrative IDE / Workbench direction.

### This PR must not

- Add or redesign UI.
- Touch `WorkbenchShell`, layout kernel, opened contexts, command palette, status bar, or Storybook workbench surfaces.
- Add a page-like dashboard.
- Add real DB persistence.
- Add Temporal, BullMQ, Inngest, worker orchestration, SSE, WebSocket, real LLM, RAG, prompt editor, or model provider code.
- Implement repository persistence boundaries.
- Implement runtime polling UX.
- Change Book Draft, Chapter, Scene, Asset, or Review user-facing behavior.
- Delete `scene-canal-watch` or `scene-dawn-slip` without an explicit failing reachability test and audit explanation.
- Move localized copy, prose text, review issues, asset details, artifact bodies, or trace payloads into the shared seed.
- Turn the shared seed package into a full domain model package.

### This PR must

- Keep product state under `/api/projects/{projectId}/...` as the product contract path.
- Keep mock runtime as development / test / Storybook fallback only.
- Keep run events lightweight and ref-based.
- Keep `draft-assembly` as the live Book Draft read model.
- Extract only stable identity and order facts into the shared seed.
- Preserve existing fixture view models and localized copy where they currently live.
- Add tests proving API fixtures and renderer mock fixtures consume / match the shared seed.
- Add an audit document recording what was extracted and what remains intentionally duplicated.

---

## 3. Mandatory Reading Before Coding

Read these files first:

```text
README.md
AGENTS.md
doc/frontend-workbench-constitution.md
doc/api-contract.md
doc/review/post-pr38-runtime-fixture-parity-audit.md
doc/review/post-pr39-book-draft-api-read-slice-regression-audit.md
doc/post-pr39-roadmap-and-pr40-ai-execution-plan.md
```

Then inspect these implementation files:

```text
packages/api/src/repositories/fixture-data.ts
packages/api/src/repositories/fixtureRepository.ts
packages/api/src/createServer.fixture-integrity.test.ts
packages/api/src/createServer.book-draft-live-assembly.test.ts
packages/api/src/createServer.draft-assembly-regression.test.ts
packages/renderer/src/features/book/api/mock-book-db.ts
packages/renderer/src/features/chapter/api/mock-chapter-db.ts
packages/renderer/src/mock/scene-fixtures.ts
packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx
packages/renderer/src/app/project-runtime/api-read-slice-contract.test.tsx
packages/renderer/src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
pnpm-workspace.yaml
package.json
packages/api/package.json
packages/renderer/package.json
```

If any path has moved, find the nearest equivalent by grepping the file names and ids.

Suggested inventory commands:

```bash
rg "book-signal-arc|chapter-signals-in-rain|chapter-open-water-signals|scene-midnight-platform|scene-concourse-delay|scene-ticket-window|scene-departure-bell|scene-warehouse-bridge|scene-canal-watch|scene-dawn-slip" \
  packages/api/src packages/renderer/src apps/desktop/src scripts doc \
  -g '*.ts' -g '*.tsx' -g '*.md' -g '*.mjs'
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
- create a second selected-object truth source;
- change scope/lens/opened-context behavior;
- convert run/review/prose into chat transcript UI.

This PR must:

- leave Workbench surfaces unchanged;
- keep Main Stage primary tasks unchanged;
- preserve route restore behavior;
- preserve layout restore behavior;
- avoid Storybook visual churn unless a fixture import requires a narrow story fixture update;
- test fixture identity boundaries rather than merely testing rendered text.

---

## 5. PR41 Deliverables

### Deliverable A — Baseline Inventory and Audit Skeleton

Create:

```text
doc/review/post-pr40-shared-fixture-seed-audit.md
```

Before code changes, add an initial inventory section listing every current occurrence of the canonical ids and mock-only extras found by `rg`.

Minimum audit skeleton:

```md
# Post-PR40 Shared Fixture Seed Audit

- Source branch:
- PR branch:
- Date:
- Verdict:

## Why this PR existed
Explain that PR39/PR40 protected runtime/read-slice behavior, but canonical fixture identity was still hand-maintained across API, renderer mock, fake API helpers, and read-slice tests.

## Canonical seed decision
List the canonical book/chapter/scene ids and mock-only extras.

## Baseline inventory
Paste the files/areas where ids were found before extraction.

## Files changed

## Tests run

## Deferred follow-up
```

Do not over-document unrelated roadmap items.

---

### Deliverable B — Add a Shared Fixture Seed Package

Add a new package:

```text
packages/fixture-seed
```

Recommended package name:

```text
@narrative-novel/fixture-seed
```

Recommended files:

```text
packages/fixture-seed/package.json
packages/fixture-seed/tsconfig.json
packages/fixture-seed/src/index.ts
packages/fixture-seed/src/signal-arc.ts
packages/fixture-seed/src/signal-arc.test.ts
```

Recommended `package.json` shape:

```json
{
  "name": "@narrative-novel/fixture-seed",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vitest": "^3.1.2"
  }
}
```

The seed package should contain stable identity and order facts only. Suggested shape:

```ts
export const signalArcFixtureSeed = {
  bookId: 'book-signal-arc',
  chapters: [
    {
      chapterId: 'chapter-signals-in-rain',
      canonicalSceneIds: [
        'scene-midnight-platform',
        'scene-concourse-delay',
        'scene-ticket-window',
        'scene-departure-bell',
      ],
    },
    {
      chapterId: 'chapter-open-water-signals',
      canonicalSceneIds: ['scene-warehouse-bridge'],
      mockOnlyPreviewSceneIds: ['scene-canal-watch', 'scene-dawn-slip'],
    },
  ],
} as const
```

Also export helper constants/functions, for example:

```ts
export const signalArcBookId
export const signalArcChapterIds
export const signalArcCanonicalSceneIds
export const signalArcSceneIdsByChapter
export const signalArcMockOnlyPreviewSceneIds
export function isSignalArcCanonicalSceneId(sceneId: string): boolean
export function getSignalArcCanonicalSceneIdsForChapter(chapterId: string): readonly string[]
```

Rules:

- Do not include localized titles, summaries, prose, artifact bodies, trace payloads, context packets, review issues, or asset policy details.
- Do not include runtime/client code.
- Do not import from `renderer` or `api`.
- The package must be dependency-free except for dev-only TypeScript/Vitest.

---

### Deliverable C — Add Seed Self Tests

Add tests in:

```text
packages/fixture-seed/src/signal-arc.test.ts
```

Required assertions:

1. `bookId` is `book-signal-arc`.
2. `chapterIds` are exactly:

```text
chapter-signals-in-rain
chapter-open-water-signals
```

3. Canonical scene ids are exactly:

```text
scene-midnight-platform
scene-concourse-delay
scene-ticket-window
scene-departure-bell
scene-warehouse-bridge
```

4. Canonical scene ids are unique.
5. Mock-only preview scene ids are exactly:

```text
scene-canal-watch
scene-dawn-slip
```

6. Mock-only preview scene ids do not overlap canonical scene ids.
7. Every canonical scene id belongs to exactly one canonical chapter.

---

### Deliverable D — Wire API and Renderer Packages to the Seed

Add workspace dependency entries:

```json
"@narrative-novel/fixture-seed": "workspace:*"
```

Likely files:

```text
packages/api/package.json
packages/renderer/package.json
pnpm-lock.yaml
```

Do not add this dependency to `apps/desktop` unless a desktop test imports the seed directly. Desktop should normally stay behind renderer/API contracts and should not care about book/chapter/scene fixture ids.

---

### Deliverable E — Replace Hand-Maintained Identity Arrays in Renderer Mock Fixtures

Update narrow identity spots only.

Likely files:

```text
packages/renderer/src/features/book/api/mock-book-db.ts
packages/renderer/src/features/chapter/api/mock-chapter-db.ts
packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
```

Expected changes:

- `mockBookRecordSeeds['book-signal-arc'].chapterIds` derives from `signalArcChapterIds`.
- Canonical `mockChapterRecordSeeds` scene ids derive from seed constants.
- `scene-canal-watch` and `scene-dawn-slip` remain explicit mock-only preview extras, imported from `signalArcMockOnlyPreviewSceneIds` or a chapter-specific helper.
- `api-read-slice-fixtures.ts` no longer hand-maintains canonical book/chapter/scene ids separately from the seed.
- Legacy fallback expectations can include canonical ids plus mock-only preview extras, but the split must be visible in names.

Suggested naming inside renderer tests:

```ts
const API_READ_SLICE_CANONICAL_SCENE_IDS = signalArcCanonicalSceneIds
const API_READ_SLICE_MOCK_ONLY_PREVIEW_SCENE_IDS = signalArcMockOnlyPreviewSceneIds
const API_READ_SLICE_LEGACY_FALLBACK_SCENE_IDS = [
  ...API_READ_SLICE_CANONICAL_SCENE_IDS,
  ...API_READ_SLICE_MOCK_ONLY_PREVIEW_SCENE_IDS,
]
```

Do not rewrite localized fixture copy. Do not change user-visible labels unless TypeScript requires the import move.

---

### Deliverable F — Replace Hand-Maintained Identity Arrays in API Fixture Tests and Fixtures

Update narrow identity spots only.

Likely files:

```text
packages/api/src/repositories/fixture-data.ts
packages/api/src/createServer.fixture-integrity.test.ts
packages/api/src/createServer.book-draft-live-assembly.test.ts
packages/api/src/createServer.draft-assembly-regression.test.ts
```

Expected changes:

- API book fixture chapter ids should derive from `signalArcChapterIds` where feasible.
- API chapter fixture scene ids should derive from `signalArcSceneIdsByChapter` / canonical constants where feasible.
- API fixture integrity tests should import the shared seed and assert API responses match it.
- `draft-assembly` tests should assert assembly rows use canonical ids from the seed.

Important boundary:

- Do not force API fixture payloads to include mock-only preview extras unless they already do so intentionally.
- Do not broaden API fixture data to mimic renderer mock preview extras.
- Do not change API response semantics.

---

### Deliverable G — Add Cross-Runtime Seed Guard Tests

Add or update tests proving the seed is now the shared source of truth.

Minimum test expectations:

#### API

```text
packages/api/src/createServer.fixture-integrity.test.ts
```

Must assert:

- `GET /books/book-signal-arc/structure` chapter ids equal `signalArcChapterIds`.
- For each canonical chapter, `GET /chapters/{chapterId}/structure` contains the canonical scene ids for that chapter in seed order.
- `GET /books/book-signal-arc/draft-assembly` does not introduce scene ids outside canonical scene ids unless the row is explicitly documented as an intentional gap / preview exception.

#### Renderer mock

```text
packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx
```

Must assert:

- Mock book structure chapter ids equal `signalArcChapterIds`.
- Mock canonical chapter scenes include the seed canonical scene ids in seed order.
- Mock-only preview extras are separately recognized and do not count as canonical parity failures.
- Every canonical scene id resolves through mock scene clients.

#### API read-slice fixture

```text
packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts
packages/renderer/src/app/project-runtime/api-read-slice-contract.test.tsx
```

Must assert:

- Default live Book Draft read slice uses `draft-assembly` and seed-derived book id.
- Legacy fallback test uses seed-derived canonical scene ids plus explicitly named mock-only preview extras if still needed.

---

### Deliverable H — Update the Audit

Complete:

```text
doc/review/post-pr40-shared-fixture-seed-audit.md
```

Minimum final content:

```md
## Seed package
- Package name:
- Exported constants/helpers:
- Why the seed is identity/order only:

## Canonical ids
- Book:
- Chapters:
- Canonical scenes:
- Mock-only preview extras:

## Derivation matrix
| Area | Before | After |
| --- | --- | --- |
| API book structure | hand-maintained ids | seed-derived ids |
| API chapter structures | ... | ... |
| API fixture integrity tests | ... | ... |
| Renderer mock book/chapter fixtures | ... | ... |
| API read-slice fixtures | ... | ... |

## Tests run
List exact commands and pass/fail result.

## Deferred follow-up
Only list items outside PR41 scope.
```

---

## 6. Expected Touch Map

### Expected new files

```text
packages/fixture-seed/package.json
packages/fixture-seed/tsconfig.json
packages/fixture-seed/src/index.ts
packages/fixture-seed/src/signal-arc.ts
packages/fixture-seed/src/signal-arc.test.ts
doc/review/post-pr40-shared-fixture-seed-audit.md
```

### Expected package files

```text
packages/api/package.json
packages/renderer/package.json
pnpm-lock.yaml
```

### Likely API files

```text
packages/api/src/repositories/fixture-data.ts
packages/api/src/createServer.fixture-integrity.test.ts
packages/api/src/createServer.book-draft-live-assembly.test.ts
packages/api/src/createServer.draft-assembly-regression.test.ts
```

### Likely renderer files

```text
packages/renderer/src/features/book/api/mock-book-db.ts
packages/renderer/src/features/chapter/api/mock-chapter-db.ts
packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts
packages/renderer/src/app/project-runtime/api-read-slice-contract.test.tsx
packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
```

### Possible files only if imports/tests require it

```text
packages/renderer/src/mock/scene-fixtures.ts
packages/renderer/src/mock/scene-fixtures.parity.test.ts
packages/api/src/repositories/fixtureRepository.ts
```

### Files that should normally not change

```text
packages/renderer/src/features/workbench/**
packages/renderer/src/features/book/containers/**
packages/renderer/src/features/chapter/containers/**
packages/renderer/src/features/scene/containers/**
packages/renderer/src/features/asset/**
apps/desktop/**
scripts/desktop-dev*.mjs
doc/api-contract.md
README.md
```

If any of these files change, explain exactly why in the audit.

---

## 7. Implementation Order

Follow this order exactly.

### Step 1 — Baseline verification

Run focused tests before changing code:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/createServer.fixture-integrity.test.ts \
  src/createServer.book-draft-live-assembly.test.ts \
  src/createServer.draft-assembly-regression.test.ts

pnpm --filter @narrative-novel/renderer exec vitest run \
  src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx \
  src/app/project-runtime/api-read-slice-contract.test.tsx \
  src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
```

Record results in the audit.

### Step 2 — Inventory ids

Run the `rg` command from Section 3. Paste a concise inventory into the audit.

### Step 3 — Add `packages/fixture-seed`

Create the package and self tests. Do not wire it into API/renderer yet.

Run:

```bash
pnpm --filter @narrative-novel/fixture-seed test
pnpm --filter @narrative-novel/fixture-seed typecheck
```

### Step 4 — Add workspace dependencies

Add `@narrative-novel/fixture-seed` to API and renderer package dependencies. Run `pnpm install` if needed so `pnpm-lock.yaml` reflects the workspace dependency.

### Step 5 — Update renderer identity spots

Replace only book/chapter/scene id arrays and constants. Keep localized copy and UI view models in place.

Run:

```bash
pnpm --filter @narrative-novel/renderer exec vitest run \
  src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx \
  src/app/project-runtime/api-read-slice-contract.test.tsx \
  src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
```

### Step 6 — Update API identity spots

Replace only book/chapter/scene id arrays and test constants. Keep API response semantics unchanged.

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/createServer.fixture-integrity.test.ts \
  src/createServer.book-draft-live-assembly.test.ts \
  src/createServer.draft-assembly-regression.test.ts
```

### Step 7 — Run focused cross-package checks

```bash
pnpm --filter @narrative-novel/fixture-seed test
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/fixture-seed typecheck
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/renderer typecheck
```

### Step 8 — Run root checks

```bash
pnpm test
pnpm typecheck
```

If root checks do not include `@narrative-novel/fixture-seed`, that is acceptable only if the seed package's own `test` and `typecheck` passed and the importing packages passed.

### Step 9 — Final audit update

Update the audit with:

- changed files;
- seed exports;
- derivation matrix;
- test commands and results;
- deferred follow-ups.

---

## 8. Acceptance Criteria

PR41 is complete only when all are true:

- A shared `@narrative-novel/fixture-seed` package exists.
- The package exports canonical `book-signal-arc` identity and order seed.
- The package explicitly separates canonical scene ids from mock-only preview extras.
- The seed package has self tests.
- API fixture integrity tests consume the seed and pass.
- Renderer mock fixture integrity tests consume the seed and pass.
- API read-slice fixture constants no longer independently hand-maintain the canonical id list.
- `scene-canal-watch` and `scene-dawn-slip` are either retained as explicit mock-only preview extras or intentionally removed with audit justification. Silent deletion is not allowed.
- No Workbench UI/layout/scope/lens behavior changes.
- No real persistence, SSE, Temporal, LLM, RAG, or desktop project picker work.
- Focused package tests and typechecks pass.
- The PR41 audit document exists and records commands.

---

## 9. Suggested PR Description

Use this structure:

```md
## Summary
- adds `@narrative-novel/fixture-seed` as the shared canonical identity seed for `book-signal-arc`
- makes API and renderer fixture integrity tests consume the same book/chapter/scene id source
- separates canonical scene ids from renderer/mock-only preview extras
- updates API read-slice fixture constants to avoid duplicate hand-maintained id arrays
- records the post-PR40 shared fixture seed audit

## Why
PR39 and PR40 protected runtime and Book Draft read-slice behavior, but the canonical fixture identity graph was still duplicated across API fixtures, renderer mock fixtures, fake API helpers, and read-slice tests. PR41 removes that drift vector without changing product behavior.

## Non-goals
- no UI changes
- no Workbench layout changes
- no real DB/persistence
- no Temporal/SSE/LLM/RAG
- no fixture payload/prose/localized copy migration

## Tests
- [ ] pnpm --filter @narrative-novel/fixture-seed test
- [ ] pnpm --filter @narrative-novel/fixture-seed typecheck
- [ ] pnpm --filter @narrative-novel/api test
- [ ] pnpm --filter @narrative-novel/api typecheck
- [ ] pnpm --filter @narrative-novel/renderer test
- [ ] pnpm --filter @narrative-novel/renderer typecheck
- [ ] pnpm test
- [ ] pnpm typecheck
```

---

## 10. Roadmap After PR41

After PR41 removes the fixture identity drift vector, continue in this order unless new test evidence changes priority.

### PR42 — Runtime Polling / Stale-State UX Hardening

Purpose:

```text
Make current REST polling/page contract feel reliable before SSE.
```

Focus:

- explicit stale / refreshing / failed-poll state;
- retry affordance in support surfaces;
- invalidation after review decision, prose revision, scene reorder, export artifact build;
- no `events/stream` implementation yet;
- no fake stream UI while stream remains 501.

### PR43 — Repository Persistence Boundary Planning

Purpose:

```text
Define repository interfaces and product state ownership before adding real persistence.
```

Focus:

- repository interfaces;
- ownership of books / chapters / scenes / assets / runs / artifacts / trace;
- fixture repository vs future persistent repository;
- artifact payload vs event metadata boundaries;
- no production DB implementation.

### PR44 — Thin Real Persistence Vertical Slice

Purpose:

```text
Persist one narrow write path while preserving the existing renderer/API contracts.
```

Recommended first target:

```text
scene prose revision
```

Alternative target:

```text
review decision -> canon patch materialization
```

Choose one target only.

### PR45 — Context Builder Seam

Purpose:

```text
Move from fixture context packets toward a backend-owned context builder boundary.
```

Focus:

- typed context packet inputs;
- asset policy application seam;
- included / excluded / redacted activation trace;
- no prompt editor;
- no full RAG/vector database;
- no policy mutation UI yet.

### PR46 — Optional SSE / Event Stream Implementation

Only start this after polling and stale-state behavior are stable.

Purpose:

```text
Implement stream transport without changing product-level run event semantics.
```

Rules:

- product run events remain lightweight refs;
- no raw LLM token stream as product truth;
- polling remains a fallback;
- `events/stream` can replace transport behavior, not the product model.

---

## 11. Final Rule for the AI Agent

Do not make PR41 “more useful” by migrating all fixture data. PR41 exists to extract the canonical identity seed and prove API/renderer fixtures derive from the same id graph. If you discover broader fixture duplication, record it in the audit and defer it.

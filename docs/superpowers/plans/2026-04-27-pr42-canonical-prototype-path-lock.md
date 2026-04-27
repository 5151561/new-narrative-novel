# PR42 Canonical Prototype Path Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock the usable prototype path so `book-signal-arc -> scene-midnight-platform -> run -> proposal -> review decision -> canon patch -> prose draft -> chapter draft -> book draft -> trace` is driven by the same canonical fixture identity and ordering across root scripts, API read models, renderer navigation, and docs.

**Architecture:** Treat `@narrative-novel/fixture-seed` as the single source of stable identity and default canonical order, but keep the product read-heavy and route-first: API chapter/book read models stay authoritative for runtime data, renderer reads chapter structure through the runtime, and Storybook remains a verification surface rather than an alternate truth source. Because PR42 partial work already exists, this plan is verification-first and closure-first; do not re-implement surfaces that are already present.

**Tech Stack:** pnpm workspace, TypeScript, Fastify fixture API, React, TanStack Query, Vitest, Storybook

---

## Scope Guard

- Keep `WorkbenchShell` ownership, scope x lens routing, and route/layout separation unchanged.
- Keep the current read-heavy product boundary: no new write flows, no new shell panes, no new dashboard surfaces.
- Do not widen into SSE, desktop bridge changes, runtime provider redesign, or backend engine work.
- Do not move canonical path truth into renderer-local mock DB state.
- Do not break the existing chapter-structure mutation path where a user reorder should still be reflected by the runtime-backed navigator.

## Current Repo State To Honor

- `package.json` already includes `@narrative-novel/fixture-seed` in root `typecheck` and `test`; PR42 must verify and close this, not "add it for the first time".
- `README.md` and `doc/api-contract.md` already contain partial canonical seed wording and `mockOnlyPreviewSceneIds` boundaries.
- `packages/api/src/createServer.fixture-integrity.test.ts` already checks canonical scene ids, preview-only exclusion, and scene read-surface reachability.
- `packages/api/src/createServer.book-draft-live-assembly.test.ts` already checks canonical book/chapter scene ordering and accept-driven live assembly refresh.
- `packages/renderer/src/App.scene-runtime-smoke.test.tsx` already proves the HTTP runtime path for `scene-midnight-platform` and already excludes preview-only scenes from the navigator.
- `packages/renderer/src/App.tsx` still uses a `getCanonicalSeedChapterId()` fallback; treat this as a narrow verification/closure point, not an automatic rewrite target.

## File Map

- `package.json`
  Purpose: root workspace verification commands; already partially updated.
- `README.md`
  Purpose: top-level product/runtime/verification guidance; already partially updated.
- `doc/api-contract.md`
  Purpose: canonical contract and prototype path wording; already partially updated.
- `packages/api/src/repositories/fixture-data.ts`
  Purpose: fixture-backed API read model source for book/chapter/scene ordering and assembly.
- `packages/api/src/createServer.fixture-integrity.test.ts`
  Purpose: protect canonical identity/order and preview-only exclusions at API level.
- `packages/api/src/createServer.book-draft-live-assembly.test.ts`
  Purpose: protect accepted prose materialization into chapter/book draft assembly.
- `packages/renderer/src/App.tsx`
  Purpose: route-owned workbench shell entry and scene navigator sourcing.
- `packages/renderer/src/App.test.tsx`
  Purpose: renderer-level route/navigation/default-order and reorder-path protection.
- `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
  Purpose: HTTP runtime smoke for the canonical scene route.
- `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`
  Purpose: Storybook coverage for the affected scene workbench route.

### Bundle 1: Verify And Close Root Canonical Seed Coverage

**Files:**
- Verify: `package.json`
- Verify or narrow-edit only if wording is incomplete: `README.md`
- Verify or narrow-edit only if wording is incomplete: `doc/api-contract.md`

**Non-goals:**
- Do not rename root scripts.
- Do not add new workspace packages to the root gate.
- Do not rewrite the README or API contract from scratch.

- [ ] **Step 1: Confirm the root workspace commands already include `@narrative-novel/fixture-seed`**

Run:

```bash
node -e "const p=require('./package.json'); console.log(p.scripts.typecheck); console.log(p.scripts.test)"
```

Expected:

```text
both scripts include --filter @narrative-novel/fixture-seed
```

- [ ] **Step 2: Close documentation wording instead of reopening structure**

Check `README.md` and `doc/api-contract.md` and only patch missing wording so both documents explicitly preserve all of the following:

```text
@narrative-novel/fixture-seed is the canonical prototype seed
canonical scene ids and order are shared across API and renderer
mockOnlyPreviewSceneIds stay preview/story/test-only
pnpm typecheck and pnpm test both cover fixture-seed at the root
```

Do not broaden docs beyond PR42. If those statements are already present and accurate, leave the files unchanged.

- [ ] **Step 3: Re-run the root verification gate**

Run:

```bash
pnpm typecheck
pnpm test
```

Expected:

```text
root verification exercises fixture-seed, api, renderer, and desktop together
```

### Bundle 2: Lock API Canonical Identity And Live Assembly Invariants

**Files:**
- Modify only if a real gap is found: `packages/api/src/repositories/fixture-data.ts`
- Modify: `packages/api/src/createServer.fixture-integrity.test.ts`
- Modify: `packages/api/src/createServer.book-draft-live-assembly.test.ts`

**Non-goals:**
- Do not touch `packages/api/src/routes/*.ts` unless a targeted test proves the route contract is wrong.
- Do not add new API endpoints.
- Do not move preview-only scenes into canonical chapter/book read models.

- [ ] **Step 1: Run the two targeted API tests before editing**

Run:

```bash
pnpm --filter @narrative-novel/api test -- createServer.fixture-integrity.test.ts
pnpm --filter @narrative-novel/api test -- createServer.book-draft-live-assembly.test.ts
```

Expected:

```text
either both pass already, or they pinpoint the remaining PR42 gap
```

- [ ] **Step 2: Make `createServer.fixture-integrity.test.ts` name the exact canonical path invariants**

The file must explicitly assert all of the following, even if some coverage already exists:

```text
bookId === book-signal-arc
book.chapterIds === signalArcChapterIds
chapter-signals-in-rain scenes ===
  scene-midnight-platform
  scene-concourse-delay
  scene-ticket-window
  scene-departure-bell
chapter-open-water-signals scenes === getSignalArcCanonicalSceneIdsForChapter('chapter-open-water-signals')
scene-midnight-platform resolves through workspace/setup/execution/prose/inspector/dock-summary
signalArcMockOnlyPreviewSceneIds never appear in API chapter structure or navigator-visible scene ids
```

Do not weaken existing assertions to generic counts.

- [ ] **Step 3: Make `createServer.book-draft-live-assembly.test.ts` name the downstream draft guarantees**

The file must explicitly assert all of the following:

```text
book draft assembly chapter order === signalArcChapterIds
chapter-signals-in-rain scene order matches the canonical seed order
scene-midnight-platform starts as order 1 draft row
scene-concourse-delay / scene-ticket-window / scene-departure-bell stay explicit gap rows until accepted prose exists
accept or accept-with-edit promotes accepted prose into the live assembly
request-rewrite and reject do not overwrite current live assembly prose
signalArcMockOnlyPreviewSceneIds never appear in book draft assembly
```

If these assertions already exist, keep the implementation and tighten only the missing expectations.

- [ ] **Step 4: Only if a test fails, apply the smallest `fixture-data.ts` fix**

Acceptable fixes in `packages/api/src/repositories/fixture-data.ts`:

```text
remove canonical truncation
restore canonical seed ordering
keep preview-only scenes available only for preview/test-only usage
preserve accepted prose materialization into scene/chapter/book read models
```

Unacceptable fixes:

```text
new route fields
new assembly concepts
title-based identity matching
copying renderer-local mock truth into API state
```

- [ ] **Step 5: Re-run targeted API proof plus the run-flow contract**

Run:

```bash
pnpm --filter @narrative-novel/api test -- createServer.fixture-integrity.test.ts
pnpm --filter @narrative-novel/api test -- createServer.book-draft-live-assembly.test.ts
pnpm --filter @narrative-novel/api test -- createServer.run-flow.test.ts
```

Expected:

```text
canonical ids/order stay aligned
review decisions still drive canon patch and prose materialization
```

### Bundle 3: Close Renderer Navigator Canonical Path Without Breaking Runtime Reorder Reads

**Files:**
- Modify only if tests prove it is necessary: `packages/renderer/src/App.tsx`
- Modify: `packages/renderer/src/App.test.tsx`
- Modify: `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
- Modify only if story state drifts: `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`

**Non-goals:**
- Do not reintroduce renderer-local scene/chapter truth as a product data source.
- Do not sort navigator cards directly from the seed once runtime chapter structure is available.
- Do not touch `WorkbenchShell` layout ownership.
- Do not widen route state.

- [ ] **Step 1: Run the focused renderer tests before editing**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- App.test.tsx
pnpm --filter @narrative-novel/renderer test -- App.scene-runtime-smoke.test.tsx
```

Expected:

```text
the failures, if any, point to navigator identity/order drift rather than unrelated renderer surfaces
```

- [ ] **Step 2: Tighten `App.test.tsx` around both default canonical order and runtime reorder override**

Keep or add exact assertions for these two distinct paths:

```text
Default canonical route:
  /workbench?scope=scene&id=scene-concourse-delay&lens=orchestrate&tab=execution
  navigator shows Midnight Platform -> Concourse Delay -> Ticket Window -> Departure Bell
  navigator excludes Warehouse Bridge and all preview-only scenes

Loading placeholder path:
  the same four canonical scene buttons remain visible while per-scene cards are still loading

Runtime reorder path:
  starting from chapter outliner reorder, opening Scene / Orchestrate preserves the runtime-backed order
  Midnight Platform -> Ticket Window -> Concourse Delay -> Departure Bell
```

The purpose is to prove both truths at once:

```text
default canonical route comes from shared seed/runtime chapter structure
user-visible chapter reorder still wins when the runtime has already changed the chapter structure
```

- [ ] **Step 3: Only if the tests prove it, narrow `App.tsx` to a read-heavy runtime-first source**

Allowed closure in `packages/renderer/src/App.tsx`:

```text
use the active scene read model or seed fallback only to find the chapter id
read navigator scene membership/order from runtime.chapterClient.getChapterStructureWorkspace
keep route-owned scene selection unchanged
```

Do not add any new route fields, local navigator persistence, or renderer-private chapter lookup path.

- [ ] **Step 4: Keep Storybook synchronized with the canonical scene route**

Check `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx` and keep these stories aligned with the final behavior:

```text
Mockups/Scene/Workspace -> Final
Mockups/Scene/Workspace -> Scene / Orchestrate / WaitingReviewMainStageGate
```

Only patch the story if the route or visible canonical navigator state has drifted.

- [ ] **Step 5: Re-run renderer proof and Storybook build**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- App.test.tsx
pnpm --filter @narrative-novel/renderer test -- App.scene-runtime-smoke.test.tsx
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected:

```text
default canonical route is stable
runtime reorder path still works
storybook build remains green for the affected scene workbench surface
```

### Bundle 4: Storybook MCP Verification And Bundle Closeout

**Files:**
- No new source files unless one of the bundles above required a narrow story update

**Non-goals:**
- Do not edit Playwright config.
- Do not rely on screenshot-only verification.

- [ ] **Step 1: Start Storybook and verify the affected stories through MCP**

Run:

```bash
pnpm storybook
```

Then use Storybook MCP structured snapshots plus screenshots on:

```text
Mockups/Scene/Workspace / Final
Mockups/Scene/Workspace / Scene / Orchestrate / WaitingReviewMainStageGate
```

Verify:

```text
scene-midnight-platform route is stable
navigator excludes preview-only scenes
main stage remains the primary scene task surface
```

- [ ] **Step 2: Review and commit the bundle only after verification passes**

Stage only the PR42 files that actually changed and commit after review.

Suggested commit boundary:

```bash
git add package.json README.md doc/api-contract.md \
  packages/api/src/repositories/fixture-data.ts \
  packages/api/src/createServer.fixture-integrity.test.ts \
  packages/api/src/createServer.book-draft-live-assembly.test.ts \
  packages/renderer/src/App.tsx \
  packages/renderer/src/App.test.tsx \
  packages/renderer/src/App.scene-runtime-smoke.test.tsx \
  packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx
```

## Final Verification

- [ ] Run:

```bash
pnpm typecheck
pnpm test
```

- [ ] Confirm the final evidence chain is true without hand-waving:

```text
fixture-seed defines canonical identity/order
API chapter/book read models follow it
renderer default scene navigator follows it
preview-only scenes stay out of the usable prototype path
accepted prose still flows into chapter draft and book draft read surfaces
trace remains reachable through the existing run flow
```

## Expected Outcome

After PR42, the repo should have one defensible answer for the usable prototype lock:

```text
book-signal-arc
-> scene-midnight-platform
-> run
-> proposal
-> review decision
-> canon patch
-> prose draft
-> chapter draft
-> book draft
-> trace
```

The default path is canonical, preview-only scenes remain outside it, and renderer/API/docs/root verification all describe the same thing.

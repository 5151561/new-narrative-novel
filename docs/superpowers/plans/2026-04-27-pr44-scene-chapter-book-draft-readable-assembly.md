# PR44 Scene Chapter Book Draft Readable Assembly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the accepted-prose path read cleanly and consistently from `scene-midnight-platform` through Scene Draft, Chapter Draft, and Book Draft, without widening into editor, publish, or export work.

**Architecture:** Build on the current state instead of replacing it. The API already exposes live draft assembly, `useBookDraftWorkspaceQuery` already prefers that assembly contract, and chapter/book route round-trips already exist. This PR is a read-surface closure pass: tighten copy, explicit gap states, and manuscript readability while preserving route-first ownership and `WorkbenchShell` layout ownership.

**Tech Stack:** React, TanStack Query, TypeScript, Vitest, Storybook, fixture API runtime

---

This PR is part of the usable prototype lock.

It must preserve this exact chain:

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

## Scope Guard

- Keep this PR read-heavy and route-first.
- Do not add manuscript editing, publish flows, export workflows, branch mutation, review redesign, or new runtime surfaces.
- Do not change `WorkbenchShell` ownership of layout, pane sizing, or dock behavior.
- Do not add new route keys for draft readability; reuse the existing `scene/chapter/book` route shapes.
- If an existing route round-trip is already correct, treat it as verification/closure only.

## Current Baseline To Build On

- `packages/api/src/createServer.book-draft-live-assembly.test.ts` already proves live assembly exists, excludes `mockOnlyPreviewSceneIds`, and promotes a gap scene into a draft after review acceptance.
- `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts` already prefers `bookClient.getBookDraftAssembly()` and only falls back to legacy fanout when the contract is explicitly unsupported.
- `packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx` already covers generated prose, source summary dedupe, and no-draft behavior.
- `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx` and `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx` already cover chapter/book route restore behavior.
- The execution work for this PR should therefore focus on readability closure, exact assertions, and Storybook parity, not on inventing a second assembly path.

## File Map

- `packages/api/src/createServer.book-draft-live-assembly.test.ts`
  Purpose: lock the live draft assembly contract that renderer read surfaces depend on.
- `packages/renderer/src/features/scene/containers/SceneProseContainer.tsx`
  Purpose: scene-level prose read surface for accepted run output.
- `packages/renderer/src/features/scene/components/SceneProseTab.tsx`
  Purpose: visible draft/source-summary presentation used by the container.
- `packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx`
  Purpose: scene prose readability assertions for accepted output and missing-draft states.
- `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
  Purpose: Storybook proof for accepted-run and no-draft read states.
- `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts`
  Purpose: chapter draft read model assembly from chapter structure plus per-scene prose reads.
- `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx`
  Purpose: canonical order, explicit gap state, and readiness-summary assertions.
- `packages/renderer/src/features/chapter/components/ChapterDraftReader.tsx`
  Purpose: manuscript-style chapter reader and missing-draft copy.
- `packages/renderer/src/features/chapter/components/ChapterDraftReader.test.tsx`
  Purpose: exact reader output for drafted scenes versus gaps.
- `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx`
  Purpose: route-owned selected scene and book/scene round-trips.
- `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx`
  Purpose: Storybook proof for canonical readable chapter draft states.
- `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx`
  Purpose: verify live assembly stays primary and selected chapter stays route-owned.
- `packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts`
  Purpose: explicit mapping coverage for gap reason, trace summary, and chapter totals if mapper changes are needed.
- `packages/renderer/src/features/book/components/BookDraftReader.tsx`
  Purpose: readable book manuscript surface.
- `packages/renderer/src/features/book/components/BookDraftReader.test.tsx`
  Purpose: exact selected-chapter manuscript and explicit missing-draft rendering.
- `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx`
  Purpose: route restore and chapter handoff closure for the readable manuscript path.
- `packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx`
  Purpose: Storybook proof for canonical book manuscript read state.

## Bundle 1: Lock The Upstream Assembly Contract That Renderer Reads

**Files:**
- Modify: `packages/api/src/createServer.book-draft-live-assembly.test.ts`
- Verify only unless contract mismatch is found: `packages/api/src/repositories/fixture-data.ts`

- [ ] **Step 1: Tighten the existing assembly test around the exact prototype path**

Extend `packages/api/src/createServer.book-draft-live-assembly.test.ts` so it explicitly asserts all of the following in the same happy-path contract:

```text
bookId === book-signal-arc
chapter-signals-in-rain scene order ===
  scene-midnight-platform
  scene-concourse-delay
  scene-ticket-window
  scene-departure-bell
scene-midnight-platform is a draft entry, not a gap
scene-midnight-platform proseDraft contains the accepted platform prose text
scene-concourse-delay remains a gap with explicit gapReason
no mockOnlyPreviewSceneIds appear in any chapter draft assembly
```

This is a contract-tightening step, not a new API feature.

- [ ] **Step 2: Re-run only the assembly contract test before touching renderer code**

Run:

```bash
pnpm --filter @narrative-novel/api test -- createServer.book-draft-live-assembly.test.ts
```

Expected:

```text
the renderer dependency contract is green before read-surface closure work starts
```

- [ ] **Step 3: Review and commit Bundle 1**

Review target:

```text
Only the assembly contract test changed unless a real contract mismatch forced a minimal fixture-data patch.
```

Commit after review passes:

```bash
git add packages/api/src/createServer.book-draft-live-assembly.test.ts packages/api/src/repositories/fixture-data.ts
git commit -m "feat: lock readable draft assembly contract"
```

## Bundle 2: Close Scene Draft And Chapter Draft Readability

**Files:**
- Modify: `packages/renderer/src/features/scene/containers/SceneProseContainer.tsx`
- Modify if needed: `packages/renderer/src/features/scene/components/SceneProseTab.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx`
- Modify if needed: `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
- Modify: `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts`
- Modify: `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx`
- Modify if needed: `packages/renderer/src/features/chapter/components/ChapterDraftReader.tsx`
- Modify if needed: `packages/renderer/src/features/chapter/components/ChapterDraftReader.test.tsx`
- Modify if needed: `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx`
- Modify if needed: `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx`

- [ ] **Step 1: Turn the existing scene prose tests into prototype-path assertions**

In `packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx`, extend the current accepted-run coverage so it proves:

```text
scene-midnight-platform shows readable accepted prose, not placeholder/debug copy
the "Draft Source Summary" stays lightweight and deduplicated
missing-draft scenes such as scene-warehouse-bridge show explicit no-draft language
the no-draft state does not present revise affordances as if prose already exists
```

Use the existing accepted-run and no-draft test seams instead of introducing a second test harness.

- [ ] **Step 2: If the tests expose copy or layout drift, patch only the scene prose presentation**

Allowed changes:

```text
status copy
source-summary heading/copy
explicit no-draft wording
minor manuscript-readability spacing
```

Disallowed changes:

```text
new scene route fields
new trace panel
new prose editor
new dock or inspector responsibilities
```

- [ ] **Step 3: Lock chapter draft order, gap semantics, and reader output**

Update `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx` so it explicitly asserts:

```text
chapter-signals-in-rain scenes stay in canonical order
scene-midnight-platform is drafted and readable
scene-concourse-delay / scene-ticket-window / scene-departure-bell surface explicit missing-draft or waiting-on-prose states
assembledWordCount, draftedSceneCount, and missingDraftCount match the visible sections
```

Update `packages/renderer/src/features/chapter/components/ChapterDraftReader.test.tsx` so it asserts the reader renders:

```text
the drafted prose paragraph for scene-midnight-platform
an explicit gap block for a missing-draft scene
no ambiguous generic placeholder copy in place of missing-draft reasons
```

- [ ] **Step 4: Treat chapter route mechanics as closure, not reimplementation**

Only touch `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx` if needed to tighten the already-existing route assertions:

```text
/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-midnight-platform
-> open scene draft
-> browser back
-> same chapter draft sceneId restored
```

Do not redesign route semantics that are already working.

- [ ] **Step 5: Refresh the narrowest affected Storybook states**

Update only the smallest set of stories needed:

```text
packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx
  - GeneratedFromAcceptedRun
  - EmptyDraft

packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx
  - Default
  - MissingDrafts
  - SelectedMiddleScene
```

The stories must continue to render route-owned workbench surfaces, not isolated marketing mockups.

- [ ] **Step 6: Verify Bundle 2**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- SceneProseContainer.test.tsx
pnpm --filter @narrative-novel/renderer test -- useChapterDraftWorkspaceQuery.test.tsx
pnpm --filter @narrative-novel/renderer test -- ChapterDraftReader.test.tsx
pnpm --filter @narrative-novel/renderer test -- ChapterDraftWorkspace.test.tsx
```

Expected:

```text
scene prose reads like accepted manuscript output
chapter draft preserves canonical order
missing-draft states are explicit and readable
existing route restore behavior still passes
```

- [ ] **Step 7: Storybook/MCP closure for Bundle 2**

Build Storybook:

```bash
pnpm --filter @narrative-novel/renderer build-storybook
```

Then verify later with Storybook MCP structured snapshot plus screenshot for:

```text
Mockups/Scene/Prose/GeneratedFromAcceptedRun
Mockups/Scene/Prose/EmptyDraft
Mockups/Chapter/ChapterDraftWorkspace/Default
Mockups/Chapter/ChapterDraftWorkspace/MissingDrafts
```

- [ ] **Step 8: Review and commit Bundle 2**

Commit after review passes:

```bash
git add packages/renderer/src/features/scene/containers/SceneProseContainer.tsx \
  packages/renderer/src/features/scene/components/SceneProseTab.tsx \
  packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx \
  packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx \
  packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts \
  packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx \
  packages/renderer/src/features/chapter/components/ChapterDraftReader.tsx \
  packages/renderer/src/features/chapter/components/ChapterDraftReader.test.tsx \
  packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx \
  packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx
git commit -m "feat: close scene and chapter draft readability"
```

## Bundle 3: Make Book Draft The Clear Manuscript Read Destination

**Files:**
- Modify: `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx`
- Modify if needed: `packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts`
- Modify if needed: `packages/renderer/src/features/book/components/BookDraftReader.tsx`
- Modify if needed: `packages/renderer/src/features/book/components/BookDraftReader.test.tsx`
- Modify if needed: `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx`
- Modify if needed: `packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx`

- [ ] **Step 1: Tighten live-assembly query tests instead of adding another assembly path**

In `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx`, extend the current live-assembly preference test so it proves:

```text
getBookDraftAssembly remains the first read path
selectedChapterId stays route-owned
scene-midnight-platform visible prose comes from the assembly contract
gap scenes preserve explicit gapReason-derived reader copy
legacy chapter/scene fanout is still skipped when assembly is available
```

- [ ] **Step 2: Close the manuscript reader copy, not the route model**

If the selected chapter in Book Draft still reads like an inspector dump instead of a manuscript:

```text
patch only BookDraftReader.tsx and, if required, mapper output feeding it
preserve current book route shape
preserve current selectedChapterId handoff
preserve compare/export/branch/review boundaries
```

The read surface must clearly show:

```text
chapter title
scene-midnight-platform drafted prose
explicit missing-draft sections for undrafted scenes
lightweight trace/source explanation only where already supported
```

- [ ] **Step 3: Treat book draft route restore as closure**

Use `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx` to lock the existing route path rather than redesign it:

```text
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&selectedChapterId=chapter-signals-in-rain
-> open chapter draft
-> browser back
-> same selectedChapterId restored
```

If a new assertion is needed, add it to the existing round-trip test rather than adding a new navigation system.

- [ ] **Step 4: Refresh only the read-oriented Book Draft stories**

Touch the smallest necessary set inside `packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx`:

```text
ReadDefault
possibly one additional read-state story only if ReadDefault cannot show drafted + gap sections together
```

Do not widen this PR into compare/export/branch/review story churn.

- [ ] **Step 5: Verify Bundle 3**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- useBookDraftWorkspaceQuery.test.tsx
pnpm --filter @narrative-novel/renderer test -- BookDraftReader.test.tsx
pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace.test.tsx
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected:

```text
Book Draft reads as the manuscript destination for the accepted prototype path
live draft assembly remains the primary source
selectedChapterId route behavior still passes
storybook stays aligned for the read surface
```

- [ ] **Step 6: Storybook/MCP closure for Bundle 3**

Verify later with Storybook MCP structured snapshot plus screenshot for:

```text
Mockups/Book/BookDraftWorkspace/ReadDefault
```

If a new read-only story was added, verify that story too and no others unless they were touched.

- [ ] **Step 7: Review and commit Bundle 3**

Commit after review passes:

```bash
git add packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx \
  packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts \
  packages/renderer/src/features/book/components/BookDraftReader.tsx \
  packages/renderer/src/features/book/components/BookDraftReader.test.tsx \
  packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx \
  packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx
git commit -m "feat: make book draft a readable manuscript path"
```

## Final Verification

- [ ] Run:

```bash
pnpm --filter @narrative-novel/api test -- createServer.book-draft-live-assembly.test.ts
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer build-storybook
```

- [ ] Verify later with Storybook MCP using structured snapshots for the affected stories listed above.

- [ ] Sanity-check the route-owned prototype path manually after implementation:

```text
scene:   /workbench?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose
chapter: /workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-midnight-platform
book:    /workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&selectedChapterId=chapter-signals-in-rain
```

## Explicit Non-Goals

- No prose editing surface redesign
- No manuscript compare/export/branch/review expansion
- No route-kernel redesign
- No shell layout changes
- No new trace explorer beyond existing lightweight explanation
- No backend/provider/runtime horizon changes

## Expected Outcome

After PR44, the accepted prototype path should read like this:

```text
accepted scene prose in Scene Draft
-> canonical chapter manuscript sections with explicit gaps
-> book manuscript read surface with the same selected chapter identity
-> lightweight trace/source explanation
```

without creating a second assembly system or drifting toward a generic web page collection.

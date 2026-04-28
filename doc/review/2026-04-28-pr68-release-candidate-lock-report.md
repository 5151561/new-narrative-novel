# PR68 Release-Candidate Lock Report

Branch: `codex/pr68-release-candidate-lock`  
Base commit: `8ea1007`  
Date: `2026-04-28`

## Lock Rules

- Only P0/P1 blockers are admissible.
- Every code change must cite one reproduced blocker id from this report.
- Every admitted blocker must name the smallest possible seam.
- No new feature work is allowed in this wave.

## Baseline Command Results

- `pnpm typecheck`
  - PASS
- `pnpm test`
  - FAIL
  - First failing test: `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx > BookDraftWorkspace > keeps binder reader inspector and dock aligned to route.selectedChapterId and roundtrips through chapter draft`
  - Failure summary: the full workspace test run leaves the app locale in `zh-CN`, so this English assertion cannot find `Chapter 2 Open Water Signals`.
- `pnpm typecheck:desktop`
  - PASS
- `pnpm test:desktop`
  - PASS
- `pnpm verify:prototype`
  - PASS
- `pnpm --filter @narrative-novel/renderer build-storybook`
  - PASS
  - Notes:
    - expected Storybook warning: `No story files found for the specified pattern: src/**/*.mdx`
    - build warning only: large chunks above 500 kB after minification

## Dogfood Environment

Pending.

## Reproduced Blockers

- `RC-B001` Renderer test isolation leak blocks the baseline verification matrix.
  - Command: `pnpm test`
  - Observed result: `BookDraftWorkspace.test.tsx` fails under the full renderer suite because the locale persists as `zh-CN`.
  - Expected result: the full verification matrix passes with the default English route assertions intact.
  - Affected subsystem: `packages/renderer` test isolation around app locale storage.
  - Root-cause evidence:
    - The failing test passes when run alone:
      - `pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/containers/BookDraftWorkspace.test.tsx -t "keeps binder reader inspector and dock aligned to route.selectedChapterId and roundtrips through chapter draft"` -> PASS
    - The whole file also passes alone:
      - `pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/containers/BookDraftWorkspace.test.tsx` -> PASS
    - The full workspace suite fails with the locale visibly set to Chinese in the DOM snapshot.
    - Candidate leak sites found during tracing:
      - `packages/renderer/src/features/book/components/BookDraftInspectorPane.test.tsx`
      - `packages/renderer/src/features/book/hooks/useBookStructureWorkspaceQuery.test.tsx`

## Rejected Non-Blockers

None yet.

## Bugfix Bundles

- `RC-B001` Renderer locale-storage isolation repair
  - Changed files:
    - `packages/renderer/src/features/book/components/BookDraftInspectorPane.test.tsx`
    - `packages/renderer/src/features/book/hooks/useBookStructureWorkspaceQuery.test.tsx`
    - `packages/renderer/src/features/asset/hooks/useAssetKnowledgeWorkspaceQuery.test.tsx`
    - `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.test.tsx`
  - Fix shape:
    - add per-file `afterEach` cleanup for `window.localStorage`
    - add narrow regression tests proving the next test starts from the default English locale
  - Verification:
    - `pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/components/BookDraftInspectorPane.test.tsx src/features/book/hooks/useBookStructureWorkspaceQuery.test.tsx` -> PASS
    - `pnpm --filter @narrative-novel/renderer exec vitest run src/features/asset/hooks/useAssetKnowledgeWorkspaceQuery.test.tsx src/features/chapter/hooks/useChapterStructureWorkspaceQuery.test.tsx` -> PASS
    - worker verification: `pnpm test` -> PASS across workspace after the second leak fix
  - Review outcome:
    - accepted for commit; no product-code scope growth

## Storybook / MCP Evidence

Pending.

## Gate E Verdict

Pending.

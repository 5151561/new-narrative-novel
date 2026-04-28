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
  - PASS after `RC-B001` fix
  - Baseline failure before fix:
    - first failing test: `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx > BookDraftWorkspace > keeps binder reader inspector and dock aligned to route.selectedChapterId and roundtrips through chapter draft`
    - failure summary: the full workspace test run left the app locale in `zh-CN`, so this English assertion could not find `Chapter 2 Open Water Signals`
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

- `pnpm dev:desktop`
  - FAIL
  - Error: `Electron failed to install correctly, please delete node_modules/electron and try installing again`
  - Impact: desktop-local dogfood cannot start, so `Create/open real project -> ... -> continue writing` is currently blocked by local Electron runtime availability rather than app logic.

## Reproduced Blockers

- `RC-B001` Renderer test isolation leak blocks the baseline verification matrix.
- `RC-B001` Renderer test isolation leak blocked the baseline verification matrix and is now resolved.
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
      - `packages/renderer/src/features/asset/hooks/useAssetKnowledgeWorkspaceQuery.test.tsx`
      - `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.test.tsx`
  - Resolution evidence:
    - `pnpm test` -> PASS after restoring cleanup in all identified locale-mutating test files
- `RC-B002` Desktop dogfood launch is blocked by local Electron runtime availability.
  - Command: `pnpm dev:desktop`
  - Observed result: Electron CLI exits before the app launches with `Electron failed to install correctly...`
  - Expected result: Electron launches the desktop-local shell so real-project dogfood can begin.
  - Affected subsystem: local dependency/runtime environment for `apps/desktop`, not yet a confirmed product-code defect.

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

- Storybook build is available, but live MCP verification is currently blocked:
  - `mcp__playwright__*` -> `Transport closed`
  - `mcp__storybook_mcp__*` -> `Transport closed`
  - `mcp__node_repl__*` browser runtime bootstrap -> `Transport closed`

## Gate E Verdict

Pending.

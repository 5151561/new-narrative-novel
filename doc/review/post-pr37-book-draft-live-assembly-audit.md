# Post-PR37 Book Draft Live Assembly Audit

## Branch

- Source branch: `codex/pr37-chapter-book-draft-assembly-regression`
- PR branch: `codex/pr38-book-draft-live-assembly-read-contract`
- Bundle A API commit: already present on this branch before Bundle B renderer work

## Summary

- Bundle B updates the renderer to prefer the live `GET /api/projects/{projectId}/books/{bookId}/draft-assembly` read contract for Book Draft when the runtime provides it.
- `useBookDraftWorkspaceQuery` now maps the live assembly record into the existing `BookDraftWorkspaceViewModel` and keeps `selectedChapterId` route-owned.
- Legacy client-side fanout remains as an explicit fallback for mock/custom clients that do not provide the live assembly contract.
- Compare, export, and review continue to derive from the current draft workspace without route/layout redesign or visible product changes.
- Storybook was not changed. There is no visible UI delta in this bundle, so no new fixed-fixture story was required.

## Current Read Model Boundary

- Live API runtime path:
  - `BookClient.getBookDraftAssembly({ bookId })`
  - `apiRouteContract.bookDraftAssembly(...)`
  - `createApiProjectRuntime(...).bookClient.getBookDraftAssembly(...)`
  - `useBookDraftWorkspaceQuery(...) -> buildBookDraftWorkspaceViewModelFromAssemblyRecord(...)`
- Explicit fallback path:
  - When `getBookDraftAssembly` is absent or explicitly reports unsupported, `useBookDraftWorkspaceQuery(...)` enables the existing `useBookWorkspaceSources(...)` fanout path.
  - Fallback stays query-driven and does not run in parallel with the live assembly read while the assembly capability is still being resolved.
- Downstream read surfaces kept stable:
  - compare: `useBookManuscriptCompareQuery(...)`
  - export: `useBookExportPreviewQuery(...)`
  - review: `useBookReviewInboxQuery(...)`
  - container integration: `BookDraftWorkspace`

## Verification Matrix

| Area | Command | Result |
| --- | --- | --- |
| Bundle A API evidence | `pnpm --filter @narrative-novel/api test -- src/createServer.book-draft-live-assembly.test.ts` | Earlier Bundle A run broadened to 18 files / 81 tests passed |
| Bundle A API evidence | `pnpm --filter @narrative-novel/api test -- src/createServer.draft-assembly-regression.test.ts` | Earlier Bundle A run broadened to 18 files / 81 tests passed |
| Bundle A API evidence | `pnpm --filter @narrative-novel/api test -- src/createServer.read-surfaces.test.ts` | Earlier Bundle A run broadened to 18 files / 80 tests passed before the extra test was added |
| Renderer API route wiring | `pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/api-project-runtime.test.ts` | Passed, 1 file / 15 tests |
| Renderer fake API helper | `pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/fake-api-runtime.test-utils.test.ts` | Passed, 1 file / 11 tests |
| Assembly mapper | `pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/lib/book-draft-workspace-mappers.test.ts` | Passed, 1 file / 3 tests |
| Draft workspace query | `pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx` | Passed, 1 file / 9 tests; includes focused proof that live assembly is preferred, route-owned chapter selection is preserved, and legacy fanout stays suppressed when assembly is available |
| Legacy workspace fanout | `pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/hooks/useBookWorkspaceSources.test.tsx` | Passed, 1 file / 1 test |
| Compare/export downstream | `pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx src/features/book/hooks/useBookExportPreviewQuery.test.tsx` | Passed, 2 files / 13 tests |
| Container integration incl. duplicate-key guard | `pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/containers/BookDraftWorkspace.test.tsx` | Passed, 1 file / 29 tests |
| Chapter reorder invalidation | `pnpm --filter @narrative-novel/renderer exec vitest run src/features/chapter/hooks/useReorderChapterSceneMutation.test.tsx` | Passed, 1 file / 5 tests; proves successful chapter reorder invalidates `bookQueryKeys.all` in addition to chapter workspace cache |
| Chapter patch invalidation | `pnpm --filter @narrative-novel/renderer exec vitest run src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.test.tsx` | Passed, 1 file / 4 tests; proves successful structure patch invalidates `bookQueryKeys.all` in addition to chapter workspace cache |
| Renderer type safety | `pnpm --filter @narrative-novel/renderer typecheck` | Passed |

Additional note on broadened commands:

- Initial focused commands using `pnpm --filter @narrative-novel/renderer test -- <file>` broadened into the full renderer suite on this branch.
- Those broadened runs reproduced unrelated baseline instability already called out for this branch, including:
  - `src/App.chapter-draft-lens.test.tsx` timeout
  - `src/features/chapter/containers/ChapterStructureWorkspace.test.tsx` failures/timeouts
- Those broadened failures were not used as the Bundle B acceptance gate. Exact-file `pnpm ... exec vitest run ...` commands above were used for Bundle B verification.

## Files Changed

- `packages/renderer/src/features/book/api/book-draft-assembly-records.ts`
- `packages/renderer/src/features/book/api/book-client.ts`
- `packages/renderer/src/app/project-runtime/api-route-contract.ts`
- `packages/renderer/src/app/project-runtime/api-project-runtime.ts`
- `packages/renderer/src/app/project-runtime/api-project-runtime.test.ts`
- `packages/renderer/src/features/book/hooks/book-query-keys.ts`
- `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts`
- `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts`
- `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx`
- `packages/renderer/src/features/book/lib/book-draft-workspace-mappers.ts`
- `packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts`
- `packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.ts`
- `packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.test.tsx`
- `packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.ts`
- `packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.test.tsx`
- `packages/renderer/src/app/project-runtime/mock-project-runtime.ts`
- `packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts`

## Commands Run

```bash
pnpm --filter @narrative-novel/renderer test -- src/app/project-runtime/api-project-runtime.test.ts
pnpm --filter @narrative-novel/renderer test -- src/features/book/lib/book-draft-workspace-mappers.test.ts
pnpm --filter @narrative-novel/renderer test -- src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/api-project-runtime.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/lib/book-draft-workspace-mappers.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/hooks/useBookWorkspaceSources.test.tsx src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx src/features/book/hooks/useBookExportPreviewQuery.test.tsx
pnpm --filter @narrative-novel/renderer exec vitest run src/features/book/containers/BookDraftWorkspace.test.tsx
pnpm --filter @narrative-novel/renderer exec vitest run src/features/chapter/hooks/useReorderChapterSceneMutation.test.tsx
pnpm --filter @narrative-novel/renderer exec vitest run src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.test.tsx
pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/fake-api-runtime.test-utils.test.ts
pnpm --filter @narrative-novel/renderer typecheck
```

## Deferred Follow-up

- `fake-api-runtime.test-utils.ts` now synthesizes the new draft-assembly response from mock runtime read surfaces so API-runtime renderer tests can verify the new route without backend coupling.
- No Storybook update was made in this bundle because the live assembly adoption changes the read boundary only, not the visible Book Draft presentation states.

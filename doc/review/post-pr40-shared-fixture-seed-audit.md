# Post-PR40 Shared Fixture Seed Audit

- Source branch: `codex/pr40-book-draft-api-read-slice-regression-closure`
- PR branch: current working branch
- Date: 2026-04-27
- Verdict: pass

## Why this PR existed

PR39 and PR40 closed runtime parity and Book Draft API read-slice regressions, but the canonical sample graph identity was still hand-maintained in multiple API and renderer fixture locations. That duplication made chapter/scene id drift possible even when behavior tests stayed green.

PR41 extracts one shared canonical seed for the stable Signal Arc identity/order graph and makes the affected API and renderer fixture layers derive from that seed instead of duplicating raw arrays.

## Canonical seed decision

Canonical book id:

- `book-signal-arc`

Canonical chapter ids:

- `chapter-signals-in-rain`
- `chapter-open-water-signals`

Canonical scene ids:

- `scene-midnight-platform`
- `scene-concourse-delay`
- `scene-ticket-window`
- `scene-departure-bell`
- `scene-warehouse-bridge`

Renderer mock-only preview extras that stay explicit and non-canonical:

- `scene-canal-watch`
- `scene-dawn-slip`

## Baseline inventory

Before extraction, canonical ids or mixed canonical/mock-only scene arrays were hand-maintained in these hotspots:

- `packages/api/src/repositories/fixture-data.ts`
  API book chapter ids and API chapter scene ids were declared inline.
- `packages/api/src/createServer.fixture-integrity.test.ts`
  Canonical chapter ids and expected chapter/scene assertions were duplicated in test-local constants.
- `packages/api/src/createServer.book-draft-live-assembly.test.ts`
  Draft assembly chapter ids and expected assembly scene ids were hard-coded in assertions.
- `packages/renderer/src/features/book/api/mock-book-db.ts`
  Renderer mock book chapter ids were declared inline.
- `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`
  Canonical chapter scene ids and mock-only preview extras were all embedded directly in chapter fixture lists.
- `packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts`
  Read-slice fixture constants kept chapter ids and a combined canonical-plus-preview scene list inline.
- `packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx`
  Canonical chapter ids and canonical scene ids by chapter were duplicated in the test.

## Files changed

- `packages/fixture-seed/package.json`
- `packages/fixture-seed/tsconfig.json`
- `packages/fixture-seed/src/index.ts`
- `packages/fixture-seed/src/signal-arc.ts`
- `packages/fixture-seed/src/signal-arc.test.ts`
- `packages/api/package.json`
- `packages/api/src/repositories/fixture-data.ts`
- `packages/api/src/createServer.fixture-integrity.test.ts`
- `packages/api/src/createServer.book-draft-live-assembly.test.ts`
- `packages/renderer/package.json`
- `packages/renderer/src/features/book/api/mock-book-db.ts`
- `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`
- `packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts`
- `packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx`
- `pnpm-lock.yaml`

## Seed package

New workspace package:

- `@narrative-novel/fixture-seed`

Package scope:

- stable identity/order facts only
- no localized copy
- no prose bodies
- no artifact payloads
- no review issues
- no asset data
- no runtime dependencies beyond TypeScript/Vitest dev tooling

Exported seed helpers:

- `signalArcBookId`
- `signalArcChapterIds`
- `signalArcCanonicalSceneIds`
- `signalArcSceneIdsByChapter`
- `signalArcMockOnlyPreviewSceneIds`
- `isSignalArcCanonicalSceneId(sceneId)`
- `getSignalArcCanonicalSceneIdsForChapter(chapterId)`

## Canonical ids

The shared seed now defines the canonical Signal Arc graph once. API and renderer layers consume that graph differently without redefining it:

- API book structure derives chapter ids from `signalArcChapterIds`.
- API chapter structures derive their currently exposed canonical scene subsets from the canonical chapter order in the seed.
- Renderer mock book structure derives chapter ids from `signalArcChapterIds`.
- Renderer mock chapter structures derive canonical scene order from `signalArcSceneIdsByChapter`.
- Renderer mock-only preview extras remain explicit through `signalArcMockOnlyPreviewSceneIds` and are not folded into the canonical graph.
- API read-slice fixture constants now separate canonical scene ids from renderer-only preview extras instead of keeping one undifferentiated mixed list.

## Derivation matrix

| Surface | Derived from shared seed | Notes |
| --- | --- | --- |
| API book fixture chapter ids | `signalArcChapterIds` | Canonical order only |
| API chapter fixture scene ids | `getSignalArcCanonicalSceneIdsForChapter(...)` slices/subsets | Keeps current API-visible subset behavior without redefining canon |
| API fixture integrity test expectations | `signalArcChapterIds`, `getSignalArcCanonicalSceneIdsForChapter(...)` | Guards order and identity against drift |
| API draft assembly test expectations | `signalArcBookId`, `signalArcChapterIds`, `getSignalArcCanonicalSceneIdsForChapter(...)` | Guards assembly rows against id drift |
| Renderer mock book chapter ids | `signalArcBookId`, `signalArcChapterIds` | Canonical order only |
| Renderer mock chapter canonical scenes | `signalArcSceneIdsByChapter` | Canonical order stays shared |
| Renderer mock-only preview extras | `signalArcMockOnlyPreviewSceneIds` | `scene-canal-watch` and `scene-dawn-slip` stay explicit, separate, and preserved |
| Renderer read-slice legacy fallback scene list | canonical scene ids + explicit preview extras | Split is explicit in names instead of hidden in one inline array |
| Renderer mock integrity test expectations | `signalArcChapterIds`, `getSignalArcCanonicalSceneIdsForChapter(...)`, `signalArcMockOnlyPreviewSceneIds` | Guards canonical vs mock-only separation |

## Tests run

- `pnpm --filter @narrative-novel/fixture-seed test` -> pass
- `pnpm --filter @narrative-novel/fixture-seed typecheck` -> pass
- `pnpm --filter @narrative-novel/api exec vitest run src/createServer.fixture-integrity.test.ts src/createServer.book-draft-live-assembly.test.ts src/createServer.draft-assembly-regression.test.ts` -> pass
- `pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx src/app/project-runtime/api-read-slice-contract.test.tsx src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx` -> pass
- `pnpm --filter @narrative-novel/api typecheck` -> pass
- `pnpm --filter @narrative-novel/renderer typecheck` -> pass
- `pnpm test` -> pass
- `pnpm typecheck` -> pass

Root scripts still target only `api`, `renderer`, and `desktop`; `@narrative-novel/fixture-seed` remains covered by its package-level commands above.

## Deferred follow-up

- If the workspace wants root-level coverage to include the new package, update root `test` and `typecheck` scripts in a later PR instead of widening PR41 scope.
- If future fixture work needs more shared seeds, keep this package restricted to stable graph identity/order facts and avoid moving content payloads into it.

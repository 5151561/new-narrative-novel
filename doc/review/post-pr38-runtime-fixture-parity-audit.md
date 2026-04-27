# Post PR38 Runtime Fixture Parity Audit

Date: 2026-04-27
Branch: `codex/pr39-runtime-fixture-parity-guard`
Scope: Bundle B runtime boundary guards, desktop/runtime contract parity, and doc closure across `packages/renderer`, `apps/desktop`, `scripts`, `README.md`, and `doc/api-contract.md`
Verdict: pass with recorded drift notes

## Branch Section

- Active branch: `codex/pr39-runtime-fixture-parity-guard`
- Bundle focus: PR39 Bundle B
- Out-of-scope and untouched in this pass: `packages/api/**`, workbench layout/product surfaces, SSE/WebSocket, persistence redesign, prompt/editor flows

## Summary

This pass hardened the renderer/runtime boundary and the desktop-local contract with executable tests instead of assumptions.

- Renderer runtime selection now has explicit coverage for `web/mock`, `web/api`, `desktop-local`, and invalid desktop bridge payloads.
- Fake API runtime helpers now prove that `bookClient.getBookDraftAssembly` is available and that the canonical sample ids are still reachable through the API-shaped test path.
- Mock fallback integrity is now covered by a dedicated test that verifies canonical chapter/scene reachability and a non-crashing draft fallback path with explicit gap rows.
- Desktop runtime contract tests now pin `createDesktopRuntimeConfig()`, `LocalApiSupervisor` readiness exposure, restart freshness, and preload bridge surface area.
- Documentation now matches the settled `pnpm dev:desktop` behavior: default mode rebuilds `packages/renderer/dist`; live renderer dev server mode is opt-in.

## Runtime Matrix

| Runtime mode | Trigger | Renderer runtime result | Contract source | Notes |
| --- | --- | --- | --- | --- |
| `web/mock` | Browser without `VITE_NARRATIVE_API_BASE_URL` | mock runtime | in-memory renderer fixtures | Intentional fallback for Storybook, tests, and static preview |
| `web/api` | Browser with `VITE_NARRATIVE_API_BASE_URL` | API runtime | `/api/projects/{projectId}/...` | Uses env-driven base URL |
| `desktop-local` | Electron preload returns `{ runtimeMode: 'desktop-local', apiBaseUrl }` | API runtime | local fixture API over HTTP | Stricter product contract validation path |
| invalid desktop bridge payload | Electron preload returns malformed runtime config | hard failure | none | Must not silently fall back to mock runtime |

## Fixture Identity Matrix

Canonical parity guard set:

| Object type | Canonical ids | Current status | Notes |
| --- | --- | --- | --- |
| Book | `book-signal-arc` | protected by tests | Shared anchor id for web/api, fake API helper, and mock fallback |
| Chapter | `chapter-signals-in-rain`, `chapter-open-water-signals` | protected by tests | Mock book structure still resolves both chapter ids in order |
| Scene | `scene-midnight-platform`, `scene-concourse-delay`, `scene-ticket-window`, `scene-departure-bell`, `scene-warehouse-bridge` | protected by tests | All canonical scene ids remain reachable through mock chapter + scene clients |

Recorded non-canonical extras and drift:

- `chapter-open-water-signals` still contains `scene-canal-watch` and `scene-dawn-slip` in renderer mock fixtures and fake API helper output.
  Reason: these extra scenes are retained for broader chapter draft/read preview coverage; they are outside the canonical parity guard set, not silent replacements for canonical ids.
- Mock fallback gap copy for `scene-warehouse-bridge` currently resolves to `No prose draft yet.` while live `draft-assembly` style gap copy is `No prose artifact has been materialized for this scene yet.`
  Reason: fallback assembly is still derived from scene mock prose/read models rather than the API `draft-assembly` mapper. This is a wording drift, not an identity drift.

## Desktop/Web Drift Checklist

| Check | Status | Evidence |
| --- | --- | --- |
| `desktop-local` runtime config returns `runtimeMode`, `apiBaseUrl`, `apiHealthUrl`, `port` | pass | `apps/desktop/src/main/runtime-config.test.ts` |
| `LocalApiSupervisor` hides `runtimeConfig` until status is `ready` | pass | `apps/desktop/src/main/local-api-supervisor.test.ts` |
| `restart()` clears stale failed status/error and returns a fresh ready snapshot | pass | `apps/desktop/src/main/local-api-supervisor.test.ts` |
| Preload bridge only exposes `window.narrativeDesktop` v1 API | pass | `apps/desktop/src/preload/desktop-api.test.ts` |
| Renderer creates API runtime from desktop bridge config | pass | existing `AppProviders` / `ProjectRuntimeProvider` tests plus updated runtime-config guard tests |
| Web runtime without `VITE_NARRATIVE_API_BASE_URL` stays mock | pass | existing `AppProviders` default mock-runtime test |
| Web runtime with `VITE_NARRATIVE_API_BASE_URL` creates API runtime | pass | existing `ProjectRuntimeProvider` API-runtime test plus updated runtime-config env resolution test |
| `pnpm dev:desktop` docs match current code | pass | README updated to document rebuild-dist default and explicit live-renderer opt-in |
| `events/stream` contract remains `501`; no SSE introduced in PR39 | pass | documented in `doc/api-contract.md`; no code path changed |

## Verification Matrix

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts src/app/project-runtime/api-project-runtime.test.ts src/app/project-runtime/fake-api-runtime.test-utils.test.ts src/app/project-runtime/mock-project-runtime.test.ts src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx` | pass | 6 files, 64 tests passed |
| `pnpm --filter @narrative-novel/renderer test` | failed | Full renderer suite is not green in this session. Exact failing tests: `src/app/project-runtime/api-read-slice-contract.test.tsx > api read-slice contract > renders the book draft review deep link through the API runtime and keeps the read graph on stable GET-only query keys`; `src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx > BookDraftWorkspace API read-slice review states > shows book not found and stops chapter scene and review reads when book structure resolves to null`. Both files are outside the Bundle B touch set, so this bundle must not claim full renderer-suite green. |
| `pnpm --filter @narrative-novel/desktop test` | pass | 5 files, 22 tests passed |
| `node --test scripts/desktop-dev-utils.test.mjs` | pass | 6 assertions passed |
| `pnpm --filter @narrative-novel/renderer typecheck` | pass | `tsc --noEmit` |
| `pnpm --filter @narrative-novel/desktop typecheck` | pass | `tsc --noEmit` |
| `pnpm --filter @narrative-novel/renderer build-storybook` | pass | Storybook build completed successfully |

## Storybook MCP Evidence

- `App/Project Runtime/Status Badge / All States` was verified with structured snapshot plus screenshot.
- `Mockups/Book/BookDraftWorkspace / Read Default` was verified with structured snapshot plus screenshot.
- Observed console noise on the status badge story was limited to `GET /favicon.svg 404`.

## Files Changed

Edited in this pass:

- `packages/renderer/src/app/runtime/runtime-config.test.ts`
- `packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.test.ts`
- `packages/renderer/src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx`
- `apps/desktop/src/main/runtime-config.test.ts`
- `apps/desktop/src/main/local-api-supervisor.test.ts`
- `apps/desktop/src/preload/desktop-api.test.ts`
- `README.md`
- `doc/api-contract.md`
- `doc/review/post-pr38-runtime-fixture-parity-audit.md`

Reviewed but not edited in this pass:

- `packages/renderer/vite-base.ts`
- `packages/renderer/vite-base.test.ts`
- `packages/renderer/vite.config.ts`
- `scripts/desktop-dev-utils.mjs`
- `scripts/desktop-dev-utils.test.mjs`
- `scripts/desktop-dev.mjs`

## Commands Run

- `pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts src/app/project-runtime/fake-api-runtime.test-utils.test.ts src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx`
- `pnpm --filter @narrative-novel/desktop test -- --run src/main/runtime-config.test.ts src/main/local-api-supervisor.test.ts src/preload/desktop-api.test.ts`
- `pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts src/app/project-runtime/api-project-runtime.test.ts src/app/project-runtime/fake-api-runtime.test-utils.test.ts src/app/project-runtime/mock-project-runtime.test.ts src/app/project-runtime/mock-project-runtime.fixture-integrity.test.tsx src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx`
- `pnpm --filter @narrative-novel/renderer test`
- `pnpm --filter @narrative-novel/desktop test`
- `pnpm --filter @narrative-novel/renderer build-storybook`
- `node --test scripts/desktop-dev-utils.test.mjs`
- `pnpm --filter @narrative-novel/renderer typecheck`
- `pnpm --filter @narrative-novel/desktop typecheck`

## Deferred Follow-up

- Align mock fallback gap wording with live `draft-assembly` gap wording if the team wants book draft fallback and API live assembly to read identically.
- Decide whether `scene-canal-watch` and `scene-dawn-slip` should stay as intentional renderer-only/fake-helper extras or be promoted into the canonical parity contract.
- If future desktop work changes the default `dev:desktop` mode again, update README and `scripts/desktop-dev-utils.test.mjs` in the same PR so code/docs/tests do not drift.

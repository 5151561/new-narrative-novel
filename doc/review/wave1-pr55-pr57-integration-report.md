# Wave 1 PR55-PR57 Integration Report

Date: 2026-04-28
Worktree: `/Users/changlepan/.config/superpowers/worktrees/new-narrative-novel/wave1-integration`
Branch: `codex/wave1-pr55-pr57-integration`
Base before merges: `19f0589`

## Reviewed merged worker commits

- `bf0e494` `codex/pr55-project-lifecycle-v1`
- `a9a4745` `codex/pr56-runtime-boundary-v1`
- `5125774` `codex/pr57-model-binding-credential-store-v1`

## Integration scope

- Reconciled Wave 1 shared desktop glue after PR55/PR56/PR57 merges.
- Closed PR55's deferred main-process reachability gap in `apps/desktop/src/main/main.ts` and `apps/desktop/src/main/app-menu.ts` by wiring:
  - `Create Project...`
  - `Create Backup`
  - `Export Project Archive`
- Left the shared hot files below unchanged after inspection because the merged state already satisfied the Wave 1 integration seam:
  - `packages/api/src/createServer.ts`
  - `packages/renderer/src/App.tsx`
  - `packages/renderer/src/app/providers.tsx`

## TDD evidence

1. Added a failing expectation in `apps/desktop/src/main/main.test.ts` asserting `onCreateProject`, `onCreateProjectBackup`, and `onExportProjectArchive` exist on the real main-entry menu wiring and invoke the correct project-root/store-file actions.
2. Verified the red state:

```bash
pnpm --filter @narrative-novel/desktop test -- main.test.ts
```

Result: `FAIL`

- failure: `expected undefined to be type of 'function'`
- meaning: main-process menu wiring for `Create Project` had not been connected yet

3. Implemented the minimal green code in `apps/desktop/src/main/main.ts` and `apps/desktop/src/main/app-menu.ts`.
4. Re-ran the same test:

```bash
pnpm --filter @narrative-novel/desktop test -- main.test.ts
```

Result: `PASS`

## Verification summary

### Focused verification

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @narrative-novel/api test -- createServer.local-project-store.test.ts createServer.runtime-info.test.ts createServer.local-project-reset.test.ts createServer.local-persistence.test.ts` | PASS | Vitest resolved the package suite; `35` files / `195` tests passed, including all named targets. |
| `pnpm --filter @narrative-novel/renderer test -- runtime-config.test.ts ProjectRuntimeProvider.test.tsx useProjectRuntimeHealthQuery.test.tsx ProjectRuntimeStatusBadge.test.tsx providers.test.tsx` | PASS | Vitest resolved the package suite; `161` files / `978` tests passed, including all named targets. |
| `pnpm --filter @narrative-novel/desktop test -- project-picker.test.ts project-store.test.ts recent-projects.test.ts credential-store.test.ts model-binding-store.test.ts desktop-api.test.ts main.test.ts local-api-supervisor.test.ts` | PASS | `12` files / `51` tests passed. |

### Full Wave 1 verification

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm typecheck` | PASS | workspace typecheck passed for fixture-seed, api, renderer, desktop |
| `pnpm test` | PASS | full workspace tests passed |
| `pnpm verify:prototype` | PASS | API regression subset `52` tests passed; renderer prototype subset `83` tests passed |
| `pnpm typecheck:desktop` | PASS | desktop-only `tsc --noEmit` passed |
| `pnpm test:desktop` | PASS | desktop suite `12` files / `51` tests passed |
| `pnpm --filter @narrative-novel/renderer build-storybook` | PASS | static Storybook build completed; warnings were limited to standard Storybook eval/chunk-size notices |

## Secret scan

Command:

```bash
rg -n "sk-[A-Za-z0-9_-]+|OPENAI_API_KEY|apiKey|credentialSecret|raw secret" packages/api/src apps/desktop/src packages/renderer/src doc
```

Result: review required, no blocker found.

Summary:

- Hits were confined to:
  - tests with fake secrets such as `sk-test` / `sk-secret-value`
  - API config/model-binding implementation seams that are expected to handle provider credentials
  - documentation references describing secret-boundary rules
- No new renderer exposure path was introduced by this integration.
- No new run-event, artifact, trace, or doc surface was added that emits raw credentials.
- `Create Backup` is wired to `createProjectBackup`, which intentionally writes an exact local recovery snapshot of the manifest/store contents and is not a redacted or shareable archive format.
- `Export Project Archive` is wired to `exportProjectArchive`, which is the sanitized/shareable archive path and strips secret-like fields before writing the export artifact.
- Accordingly, the secret-scan conclusion for this integration is:
  - no new raw-secret exposure path was added to renderer, run events, artifacts meant for sharing, trace surfaces, or docs
  - the local backup path remains a recovery-only snapshot path and should not be described as sanitized

## Gate B assessment

Assessment: `PASS_WITH_COORDINATOR_MCP_PENDING`

Evidence coverage against the required flow:

- `Create real project`: covered by the new main-process menu wiring test and existing project picker/store tests.
- `configure model`: covered by desktop credential/model-binding tests and restart-on-binding-change behavior already present in merged `PR57`.
- `create scene -> run/prose/revise`: covered by API/renderer focused tests plus `pnpm verify:prototype`.
- `close app -> reopen -> continue`: covered by project restore/recent-project tests, local persistence/runtime tests, and full workspace regression passes.
- The recovery/share boundary in this flow is now stated explicitly:
  - local backups are exact on-disk recovery snapshots for the same machine/project context
  - manual export archives are the sanitized artifact intended for portability/shareability

Remaining requirement before final coordinator sign-off:

- Storybook MCP verification was intentionally not run in this worker session and remains for the main-thread coordinator.

## Remaining blockers for Wave 2

- No Wave 1 code blocker remains in this worktree for PR58 serial work.
- Coordination blocker still open outside this worker scope: final Storybook MCP review/sign-off by the main-thread coordinator.

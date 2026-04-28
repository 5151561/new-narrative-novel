# Wave 1 PR55-PR57 Parallel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute Wave 1 only by delivering PR55 Project Create/Open/Backup/Migration, PR56 Fixture-to-Real Runtime Boundary, PR57 Model Binding/Credential Store v1, then a short serial integration bundle that proves Gate B readiness.

**Architecture:** Start every worker branch/worktree from `codex/pr54-local-project-store-v1`; keep PR55 on desktop/API project lifecycle safety, PR56 on runtime identity/degraded state, and PR57 on model binding plus secret-safe desktop/API bridge. Shared hot files stay out of worker ownership except where explicitly allowed, and final shared glue is reconciled in a serial integration branch after all worker bundles pass combined spec/code review.

**Tech Stack:** TypeScript, Node fs/promises, Fastify, Electron main/preload IPC, React, TanStack Query, Storybook, Storybook MCP, Playwright MCP structured snapshots, Vitest, pnpm

---

## Coordinator Setup

- Ground-truth branch: `codex/pr54-local-project-store-v1`.
- Do not start from `main`; PR54-complete state is the contract for project identity, manifest, store, desktop-local runtime config, and local project persistence.
- Coordinator creates one worktree per worker branch before dispatching workers. Workers do not share a worktree.
- Each worker must complete both tasks in its unit before review. Run one combined spec/code review per worker unit, fix review findings in that worker branch, re-review, then commit that worker branch once.
- Do not review half-finished worker units. Do not commit before review passes.
- Use implementation workers with `gpt5.4-medium`; each worker unit contains 2 tasks as required.
- Coordinator must not implement inside a worker worktree while that worker is running.

Suggested coordinator worktree commands:

```bash
git worktree add -b codex/pr55-project-lifecycle-v1 ../new-narrative-novel-pr55 codex/pr54-local-project-store-v1
git worktree add -b codex/pr56-runtime-boundary-v1 ../new-narrative-novel-pr56 codex/pr54-local-project-store-v1
git worktree add -b codex/pr57-model-binding-credential-store-v1 ../new-narrative-novel-pr57 codex/pr54-local-project-store-v1
```

Suggested serial integration branch after Worker A/B/C pass review:

```bash
git switch codex/pr54-local-project-store-v1
git switch -c codex/wave1-pr55-pr57-integration
git merge --no-ff codex/pr55-project-lifecycle-v1
git merge --no-ff codex/pr56-runtime-boundary-v1
git merge --no-ff codex/pr57-model-binding-credential-store-v1
```

## Scope Guard And Non-Goals

- Scope is only Wave 1 from `doc/post-phase1-pr54-pr68-parallel-roadmap.md`: PR55, PR56, PR57, and the short serial integration bundle.
- Do not implement PR58 chapter backlog, PR59 chapter orchestration, PR60 chapter assembly, PR61 book manuscript assembly, PR62-PR68 quality/release work, cloud sync, auth, collaboration, marketplace, Temporal, durable workflow engines, or publishing/export ecosystems.
- Do not invent a second project identity. `narrative.project.json` and PR54 `SelectedProjectSession.projectId` remain the selected project identity; `bookId`, `chapterId`, `sceneId`, and `assetId` remain narrative object identity.
- Do not let PR56 mix shell/layout logic into runtime status UI. Runtime badges and degraded states can report runtime identity, but cannot own pane sizing, route changes, dock state, or WorkbenchShell layout persistence.
- Do not leak raw secrets into renderer state, run events, run artifacts, trace records, logs, local project store snapshots, Storybook fixtures, or error messages.
- Do not remove fixture demo, mock runtime, or Storybook runtime. PR56 separates them from real local project mode; it does not delete them.
- Do not add a dashboard, chat-first page, prompt playground, or settings page outside the Workbench/product constitution. A desktop/global settings entry may be modal/bridge-owned, but renderer workbench surfaces must remain Scope x Lens compliant.
- Do not edit Playwright or Storybook config for verification convenience. Use the configured Storybook and MCP tools.

## Current Baseline From Code Inspection

- `apps/desktop/src/main/project-picker.ts` already reads or initializes `narrative.project.json` with `schemaVersion: 1`, stable local project id/title, `.narrative/project-store.json`, `.narrative/artifacts`, and `bootstrap.source: "signal-arc-demo-template-v1"`.
- `apps/desktop/src/main/project-store.ts` owns current project selection, recent-project restore, picker delegation, and forgetting invalid recent roots.
- `apps/desktop/src/main/recent-projects.ts` persists recent projects to Electron user data with newest-first deduping and malformed-file recovery.
- `packages/api/src/repositories/project-state-persistence.ts` already owns `LOCAL_PROJECT_STORE_SCHEMA_VERSION`, full local project data persistence, run store persistence, atomic JSON writes, reset, and project-id mismatch rejection.
- `packages/renderer/src/app/runtime/runtime-config.ts` currently has runtime modes `web` and `desktop-local`; desktop-local requires `projectId`, while web falls back to `/api`.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx` currently uses API runtime for desktop-local and for web with `VITE_NARRATIVE_API_BASE_URL`; generic web without API env still uses mock runtime.
- `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts` classifies API runtime errors into `unavailable`, `unauthorized`, `forbidden`, `not_found`, and `unknown`, but current copy still calls all API-backed failures "API demo runtime".
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx` already has healthy mock, desktop-local healthy, local project store, limited, unavailable, and unauthorized states.
- `packages/api/src/routes/project-runtime.ts` exposes `/api/current-project`, `/api/projects/:projectId/runtime-info`, and `/api/projects/:projectId/runtime/reset`.
- `packages/api/src/orchestration/modelGateway/*Gateway.ts` currently accepts only one `openAiModel`/`openAiApiKey` pair and falls back to fixture on missing config/provider error/invalid output.
- `apps/desktop/src/shared/desktop-bridge-types.ts`, `apps/desktop/src/preload/desktop-api.ts`, and `apps/desktop/src/preload/index.ts` expose a narrow bridge without raw Electron/Node access.
- `apps/desktop/src/main/main.ts` is a shared hot file but currently owns IPC handler registration, current project bridge, runtime config bridge, local API supervisor controls, worker controls, and project menu actions.
- Shared hot files for this wave are `packages/api/src/createServer.ts`, `packages/renderer/src/App.tsx`, `packages/renderer/src/app/providers.tsx`, and `apps/desktop/src/main/main.ts`.

## File Map

Worker A / PR55 owns:

- Modify: `apps/desktop/src/main/project-picker.ts`
  Purpose: add explicit create/open/migration/backup/archive behaviors on top of the existing manifest contract without changing project identity semantics.
- Modify: `apps/desktop/src/main/project-picker.test.ts`
  Purpose: cover create/open dialog paths, schema-version checks, automatic migration backup, failed migration preservation, and manual archive export.
- Modify: `apps/desktop/src/main/project-store.ts`
  Purpose: expose project lifecycle methods through the existing selected-project/recent-project boundary.
- Modify: `apps/desktop/src/main/project-store.test.ts`
  Purpose: cover create/open/recent behavior, backup/export delegation, and invalid recent-root cleanup.
- Modify: `apps/desktop/src/main/recent-projects.ts`
  Purpose: keep recent project list resilient after migration or open failure without changing the record identity shape.
- Modify: `apps/desktop/src/main/recent-projects.test.ts`
  Purpose: cover recent list retention/removal around migrated and missing projects.
- Modify: `packages/api/src/repositories/project-state-persistence.ts`
  Purpose: add local-store migration guard, pre-migration backup, backup archive/export helpers, and rollback-safe failure behavior.
- Modify: `packages/api/src/repositories/project-state-persistence.test.ts`
  Purpose: cover unsupported schema handling, successful migration with backup, failed migration preserving the original file, manual archive export, and project-id mismatch safety.
- Add: `packages/api/src/repositories/project-backup.ts`
  Purpose: focused helper for timestamped `.narrative/backups/*.json` snapshots and `.narrative/exports/*.narrative-project.json` archive writes.
- Add: `packages/api/src/repositories/project-backup.test.ts`
  Purpose: cover backup file naming, archive contents, atomic write failure, and no mutation of source store files.

Worker B / PR56 owns:

- Modify: `packages/renderer/src/app/runtime/runtime-config.ts`
  Purpose: add explicit runtime identity values for `fixture-demo`, `mock-storybook`, and `real-local-project` while preserving desktop bridge compatibility.
- Modify: `packages/renderer/src/app/runtime/useRuntimeConfig.ts`
  Purpose: resolve runtime config without silent mock fallback for real local project mode.
- Modify: `packages/renderer/src/app/runtime/runtime-config.test.ts`
  Purpose: cover mode parsing, invalid desktop-local config failure, web mock/storybook behavior, fixture demo behavior, and real-local-project requirements.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
  Purpose: choose mock/API runtime based on explicit runtime mode, not incidental env truth.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx`
  Purpose: cover no silent mock in real local project mode, preserved mock/storybook runtime, and fixture demo API behavior.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBoundary.tsx`
  Purpose: display degraded status guidance through the existing status boundary only.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
  Purpose: show runtime mode/source/project identity without owning layout or shell state.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
  Purpose: add Storybook states for fixture demo, mock/storybook, real local project healthy, real local project degraded, and no silent mock fallback.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
  Purpose: lock visible status/capability/runtime-mode labels and retry behavior.
- Modify: `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts`
  Purpose: classify real-local-project failures with real-project wording and keep mock/storybook health distinct.
- Modify: `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx`
  Purpose: cover real local project unavailable/not-found/unauthorized wording and stable query key.
- Modify: `packages/api/src/routes/project-runtime.ts`
  Purpose: include runtime identity metadata in runtime-info/current-project responses without changing route shapes.
- Modify: `packages/api/src/createServer.runtime-info.test.ts`
  Purpose: cover fixture project vs selected local project runtime identity at API boundary.

Worker C / PR57 owns:

- Add: `packages/api/src/orchestration/modelGateway/model-binding.ts`
  Purpose: define provider/model binding records for planner, prose writer, revision, continuity reviewer, and summary/cheap reviewer without storing raw secrets.
- Add: `packages/api/src/orchestration/modelGateway/model-binding.test.ts`
  Purpose: cover default fixture bindings, OpenAI binding validation, redacted serialization, and role-specific model resolution.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
  Purpose: consume planner binding instead of global `openAiModel`, while preserving fixture fallback provenance.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts`
  Purpose: cover planner binding selection and prove raw secret is not included in provenance/output/error paths.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts`
  Purpose: accept a resolved provider credential at construction while keeping request payload free of secrets.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts`
  Purpose: cover OpenAI request shape without asserting or leaking the raw API key.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
  Purpose: consume prose-writer and revision bindings based on request task.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts`
  Purpose: cover draft and revision binding selection plus secret-redaction behavior.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.ts`
  Purpose: accept a resolved provider credential at construction while keeping request payload free of secrets.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts`
  Purpose: cover OpenAI prose/revision request shape and no raw secret leakage.
- Modify: `packages/api/src/config.ts`
  Purpose: read role-specific env model bindings and optional dev env credential fallback.
- Modify: `packages/api/src/config.test.ts`
  Purpose: cover role-specific model env parsing and no raw secret in public config serialization.
- Add: `apps/desktop/src/main/credential-store.ts`
  Purpose: desktop-main-only credential persistence facade with `get`, `set`, `delete`, and redacted status; v1 may use Electron safeStorage when available and a restricted local fallback when not.
- Add: `apps/desktop/src/main/credential-store.test.ts`
  Purpose: cover save/read/delete, safeStorage unavailability fallback, and no raw secret in status snapshots.
- Add: `apps/desktop/src/main/model-binding-store.ts`
  Purpose: desktop-main-only model binding persistence without raw provider secrets.
- Add: `apps/desktop/src/main/model-binding-store.test.ts`
  Purpose: cover role-specific binding persistence, validation, and redacted snapshots.
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
  Purpose: add narrow credential/model-binding IPC contract with redacted values only.
- Modify: `apps/desktop/src/preload/desktop-api.ts`
  Purpose: expose narrow model binding methods without exposing ipcRenderer, fs, process, or raw secret read APIs.
- Modify: `apps/desktop/src/preload/index.ts`
  Purpose: keep contextBridge exposure unchanged except for the expanded narrow API object.
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
  Purpose: cover bridge shape and prove no raw secret read/list API is exposed.
- Modify: `apps/desktop/src/main/main.ts`
  Purpose: register PR57 credential/model-binding handlers only; do not edit project selection, menu recovery, or local API restart behavior.
- Modify: `apps/desktop/src/main/main.test.ts`
  Purpose: cover PR57 handler registration and redacted return values.

Serial integration bundle owns:

- Modify: `packages/api/src/createServer.ts`
  Purpose: reconcile PR55 lifecycle persistence and PR57 model binding dependencies at server creation time.
- Modify: `packages/renderer/src/App.tsx`
  Purpose: add only the minimal settings/runtime entry point required by merged PR56/PR57 if the worker branches need a visible Workbench-compliant entry.
- Modify: `packages/renderer/src/app/providers.tsx`
  Purpose: reconcile runtime config provider behavior and query invalidation after PR56.
- Modify: `apps/desktop/src/main/main.ts`
  Purpose: resolve PR55/PR57 handler/menu merge conflicts only; keep each worker's boundaries intact.
- Add: `doc/review/wave1-pr55-pr57-integration-report.md`
  Purpose: record Gate B verification commands, Storybook/MCP evidence, secret-leak scan, and coordinator concerns.

## Worker A / PR55 Project Create, Open, Backup, Migration

Suggested branch/worktree:

```bash
branch: codex/pr55-project-lifecycle-v1
worktree: ../new-narrative-novel-pr55
```

Explicit file ownership:

- Worker A may edit only the Worker A files listed in the File Map.
- Worker A owns project lifecycle safety: create, open, recent, schema check, migration backup, manual backup/export.
- Worker A must keep `projectId` from `narrative.project.json` / selected project session as the only project identity.

Must-not-touch hot files:

- Do not edit `apps/desktop/src/main/main.ts`.
- Do not edit `packages/api/src/createServer.ts`.
- Do not edit `packages/renderer/src/App.tsx`.
- Do not edit `packages/renderer/src/app/providers.tsx`.
- Do not edit renderer runtime badge/status UI.
- Do not edit PR57 credential/model binding files.

### Task A1: Project Create/Open/Recent Lifecycle

**Files:**

- Modify: `apps/desktop/src/main/project-picker.ts`
- Modify: `apps/desktop/src/main/project-picker.test.ts`
- Modify: `apps/desktop/src/main/project-store.ts`
- Modify: `apps/desktop/src/main/project-store.test.ts`
- Modify: `apps/desktop/src/main/recent-projects.ts`
- Modify: `apps/desktop/src/main/recent-projects.test.ts`

- [ ] **Step A1.1: Write failing project-picker lifecycle tests**

Add tests that assert:

```ts
await expect(readOrInitializeProjectSession(projectRoot, {
  createProjectId: () => 'local-project-alpha',
  now: () => '2026-04-28T00:00:00.000Z',
})).resolves.toEqual({
  projectId: 'local-project-alpha',
  projectRoot,
  projectTitle: path.basename(projectRoot),
})
```

Also assert `openProjectWithDialog()` keeps the selected directory identity and that a new create-project helper writes `narrative.project.json` with `schemaVersion: 1`, `.narrative/project-store.json`, `.narrative/artifacts`, and `bootstrap.source: "signal-arc-demo-template-v1"`.

- [ ] **Step A1.2: Run the focused failing desktop tests**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- project-picker.test.ts project-store.test.ts recent-projects.test.ts
```

Expected before implementation: FAIL on missing create-project helper and lifecycle assertions.

- [ ] **Step A1.3: Implement lifecycle methods without changing identity shape**

Implement only these behaviors:

- Create project writes the same v1 manifest shape PR54 already reads.
- Open project uses existing `readOrInitializeProjectSession`.
- Recent projects remain `SelectedProjectSession` records with `projectId`, `projectRoot`, `projectTitle`.
- Missing recent roots are removed; valid roots are re-added newest-first.

- [ ] **Step A1.4: Run focused desktop lifecycle tests**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- project-picker.test.ts project-store.test.ts recent-projects.test.ts
```

Expected after implementation: PASS.

### Task A2: Migration Guard, Automatic Backup, Manual Archive

**Files:**

- Add: `packages/api/src/repositories/project-backup.ts`
- Add: `packages/api/src/repositories/project-backup.test.ts`
- Modify: `packages/api/src/repositories/project-state-persistence.ts`
- Modify: `packages/api/src/repositories/project-state-persistence.test.ts`
- Modify: `apps/desktop/src/main/project-picker.ts`
- Modify: `apps/desktop/src/main/project-picker.test.ts`
- Modify: `apps/desktop/src/main/project-store.ts`
- Modify: `apps/desktop/src/main/project-store.test.ts`

- [ ] **Step A2.1: Write failing backup and migration tests**

Add tests that assert:

```ts
await expect(persistence.load()).rejects.toThrow('Unsupported local project store schemaVersion')
await expect(access(originalStoreFilePath)).resolves.toBeUndefined()
await expect(access(expectedBackupFilePath)).resolves.toBeUndefined()
```

Required cases:

- Unsupported future schema refuses migration and leaves the original file intact.
- Supported older schema writes an automatic backup before writing the migrated v1 store.
- Simulated write/rename failure keeps the original store file byte-for-byte unchanged.
- Manual archive writes a redaction-free project archive that includes manifest, store metadata, and project data but no provider raw secret fields.

- [ ] **Step A2.2: Run focused failing API tests**

Run:

```bash
pnpm --filter @narrative-novel/api test -- project-backup.test.ts project-state-persistence.test.ts
```

Expected before implementation: FAIL on missing backup helper and migration/archive methods.

- [ ] **Step A2.3: Implement backup/archive as a repository concern**

Implement:

- `createProjectBackup({ projectRoot, storeFilePath, now })` writes under `.narrative/backups/`.
- `exportProjectArchive({ projectRoot, storeFilePath, now })` writes under `.narrative/exports/`.
- Local-store load performs automatic backup before any supported migration write.
- Migration failure throws a stable error and leaves the original project store file unchanged.

- [ ] **Step A2.4: Run Worker A verification**

Run:

```bash
pnpm --filter @narrative-novel/api test -- project-backup.test.ts project-state-persistence.test.ts
pnpm --filter @narrative-novel/desktop test -- project-picker.test.ts project-store.test.ts recent-projects.test.ts
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/desktop typecheck
```

Expected: all commands PASS.

## Worker B / PR56 Fixture-to-Real Runtime Boundary

Suggested branch/worktree:

```bash
branch: codex/pr56-runtime-boundary-v1
worktree: ../new-narrative-novel-pr56
```

Explicit file ownership:

- Worker B may edit only the Worker B files listed in the File Map.
- Worker B owns runtime identity separation for fixture demo, mock/storybook, and real local project.
- Worker B owns degraded-state display in existing runtime status surfaces.

Must-not-touch hot files:

- Do not edit `packages/renderer/src/App.tsx`.
- Do not edit `packages/renderer/src/app/providers.tsx`.
- Do not edit `apps/desktop/src/main/main.ts`.
- Do not edit `packages/api/src/createServer.ts`.
- Do not edit WorkbenchShell, route-state hooks, pane layout state, or shell layout persistence.
- Do not edit PR55 project lifecycle files or PR57 credential/model binding files.

## Workbench Constitution Compliance

- Runtime identity is supporting state, not a new page or dashboard.
- WorkbenchShell remains the layout owner; PR56 cannot add splitters, local pane widths, dock maximization, or pane visibility state.
- Route state remains object/lens identity only. Runtime mode, API base URL, project root, degraded status, and layout preferences must not enter the route.
- Main Stage continues to serve the active scope/lens task. Runtime warnings stay in the existing top command/status boundary or supporting surfaces.
- Navigator remains object navigation. It must not become a runtime picker.
- Inspector and Bottom Dock remain supporting judgment/activity surfaces. PR56 degraded-state UI must not become a debugger console.
- Storybook states are required for affected runtime status surfaces.
- MCP verification must use Storybook structured component discovery plus Playwright MCP structured snapshot and screenshot.

### Task B1: Runtime Mode Contract

**Files:**

- Modify: `packages/renderer/src/app/runtime/runtime-config.ts`
- Modify: `packages/renderer/src/app/runtime/useRuntimeConfig.ts`
- Modify: `packages/renderer/src/app/runtime/runtime-config.test.ts`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx`
- Modify: `packages/api/src/routes/project-runtime.ts`
- Modify: `packages/api/src/createServer.runtime-info.test.ts`

- [ ] **Step B1.1: Write failing runtime config tests**

Add tests that assert these exact modes are distinguishable:

```ts
expect(resolveRuntimeKind({ runtimeMode: 'web', apiBaseUrl: '/api' })).toBe('fixture-demo')
expect(resolveRuntimeKind({ runtimeMode: 'mock-storybook', apiBaseUrl: '/api' })).toBe('mock-storybook')
expect(resolveRuntimeKind({
  runtimeMode: 'desktop-local',
  apiBaseUrl: 'http://127.0.0.1:4888/api',
  projectId: 'local-project-alpha',
  projectTitle: 'Local Alpha',
})).toBe('real-local-project')
```

Also assert invalid desktop-local config still throws `Desktop runtime config response is invalid.`

- [ ] **Step B1.2: Run focused failing renderer/API tests**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- runtime-config.test.ts ProjectRuntimeProvider.test.tsx
pnpm --filter @narrative-novel/api test -- createServer.runtime-info.test.ts
```

Expected before implementation: FAIL on missing explicit runtime kind fields/helpers.

- [ ] **Step B1.3: Implement explicit runtime kind without changing route shape**

Implement:

- `RuntimeKind = 'fixture-demo' | 'mock-storybook' | 'real-local-project'`.
- Desktop bridge runtime remains `runtimeMode: 'desktop-local'` at IPC boundary, and renderer maps it to `real-local-project`.
- Story/test injected runtime can use `mock-storybook`.
- Web with explicit API env remains fixture/API-backed demo; web without API env remains mock only when not real-local-project.
- API runtime-info/current-project can include runtime identity metadata without changing URL paths.

- [ ] **Step B1.4: Run focused mode-contract tests**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- runtime-config.test.ts ProjectRuntimeProvider.test.tsx
pnpm --filter @narrative-novel/api test -- createServer.runtime-info.test.ts
```

Expected after implementation: PASS.

### Task B2: Degraded Real-Project State And Storybook Coverage

**Files:**

- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBoundary.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
- Modify: `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts`
- Modify: `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx`

- [ ] **Step B2.1: Write failing degraded-state tests**

Add tests that assert real-local-project failure copy does not say "fixture API" or "API demo runtime":

```ts
expect(hook.result.current.info).toMatchObject({
  projectId: 'local-project-alpha',
  projectTitle: 'Local Alpha',
  source: 'api',
  status: 'unavailable',
})
expect(hook.result.current.info.summary).toContain('real local project runtime')
expect(hook.result.current.info.summary).not.toContain('fixture')
expect(hook.result.current.info.summary).not.toContain('API demo')
```

Add badge tests that assert real-local-project degraded state shows project title, API source, degraded status, and retry.

- [ ] **Step B2.2: Run focused failing renderer tests**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- useProjectRuntimeHealthQuery.test.tsx ProjectRuntimeStatusBadge.test.tsx
```

Expected before implementation: FAIL on real-project wording and missing story/test states.

- [ ] **Step B2.3: Implement degraded-state UI in existing status surfaces**

Implement:

- Runtime-health summary wording branches by runtime kind/source.
- Real-local-project API failures show degraded guidance and retry.
- Mock/storybook runtime remains healthy and never pretends to be a real local project.
- Fixture demo keeps verify-prototype compatibility.
- Status badge remains a compact supporting status component and does not add layout controls.

- [ ] **Step B2.4: Add required Storybook states**

In `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`, add or update named stories:

- `FixtureDemoHealthy`
- `MockStorybookHealthy`
- `RealLocalProjectHealthy`
- `RealLocalProjectUnavailable`
- `RealLocalProjectUnauthorized`
- `NoSilentMockFallback`

- [ ] **Step B2.5: Run Worker B verification**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- runtime-config.test.ts ProjectRuntimeProvider.test.tsx useProjectRuntimeHealthQuery.test.tsx ProjectRuntimeStatusBadge.test.tsx
pnpm --filter @narrative-novel/api test -- createServer.runtime-info.test.ts
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected: all commands PASS.

- [ ] **Step B2.6: Run Storybook MCP verification**

Start Storybook in the Worker B worktree:

```bash
pnpm --filter @narrative-novel/renderer storybook
```

Then use MCP, not scripts:

1. `mcp__storybook_mcp__getComponentList` and confirm `ProjectRuntimeStatusBadge` appears.
2. `mcp__storybook_mcp__getComponentsProps` for `ProjectRuntimeStatusBadge`.
3. `mcp__playwright__browser_navigate` to the Storybook URL for `App/Project Runtime/Status Badge`.
4. `mcp__playwright__browser_snapshot` with boxes enabled for `RealLocalProjectUnavailable` or `AllStates`.
5. `mcp__playwright__browser_take_screenshot` for the same story.

Expected: structured snapshot contains the real local project title, degraded/unavailable status, and retry control; screenshot is captured from the same story.

## Worker C / PR57 Model Binding / Credential Store v1

Suggested branch/worktree:

```bash
branch: codex/pr57-model-binding-credential-store-v1
worktree: ../new-narrative-novel-pr57
```

Explicit file ownership:

- Worker C may edit only the Worker C files listed in the File Map.
- Worker C owns desktop-main credential storage, redacted bridge contract, role-specific model binding, and gateway binding consumption.
- Worker C may edit `apps/desktop/src/main/main.ts` only to register credential/model-binding IPC handlers.

Must-not-touch hot files:

- Do not edit `packages/api/src/createServer.ts`.
- Do not edit `packages/renderer/src/App.tsx`.
- Do not edit `packages/renderer/src/app/providers.tsx`.
- Do not edit PR55 project create/open/migration/backup files except shared bridge type imports.
- Do not edit PR56 runtime badge/status UI.
- In `apps/desktop/src/main/main.ts`, do not change startup flow, project menu actions, local API restart, current-project bridge, worker bridge, or app lifecycle handlers.

### Task C1: Desktop Credential Bridge With Secret Redaction

**Files:**

- Add: `apps/desktop/src/main/credential-store.ts`
- Add: `apps/desktop/src/main/credential-store.test.ts`
- Add: `apps/desktop/src/main/model-binding-store.ts`
- Add: `apps/desktop/src/main/model-binding-store.test.ts`
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
- Modify: `apps/desktop/src/preload/desktop-api.ts`
- Modify: `apps/desktop/src/preload/index.ts`
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
- Modify: `apps/desktop/src/main/main.ts`
- Modify: `apps/desktop/src/main/main.test.ts`

- [ ] **Step C1.1: Write failing credential-store and bridge tests**

Add tests that assert:

```ts
await credentialStore.setProviderCredential({
  provider: 'openai',
  secret: 'sk-live-secret-value',
})
await expect(credentialStore.getProviderCredential('openai')).resolves.toBe('sk-live-secret-value')
await expect(credentialStore.getProviderCredentialStatus('openai')).resolves.toEqual({
  configured: true,
  provider: 'openai',
  redactedLabel: 'sk-...alue',
})
```

Also assert `Object.keys(window.narrativeDesktop).sort()` includes write-only/update methods and redacted status methods, but does not include `getRawCredential`, `listSecrets`, `fs`, `process`, `ipcRenderer`, or `child_process`.

- [ ] **Step C1.2: Run focused failing desktop tests**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- credential-store.test.ts model-binding-store.test.ts desktop-api.test.ts main.test.ts
```

Expected before implementation: FAIL on missing stores and bridge channels.

- [ ] **Step C1.3: Implement desktop-main-only credential/model stores**

Implement:

- Provider credential storage in Electron main only.
- `setProviderCredential`, `deleteProviderCredential`, and redacted status reads.
- Model binding persistence for planner, scene prose writer, revision, continuity reviewer, and summary/cheap reviewer.
- Preload bridge methods that never return raw secret values.
- `main.ts` IPC handlers that return redacted snapshots only.

- [ ] **Step C1.4: Run focused desktop bridge tests**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- credential-store.test.ts model-binding-store.test.ts desktop-api.test.ts main.test.ts
```

Expected after implementation: PASS.

### Task C2: Role-Specific Model Binding In API Gateways

**Files:**

- Add: `packages/api/src/orchestration/modelGateway/model-binding.ts`
- Add: `packages/api/src/orchestration/modelGateway/model-binding.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts`
- Modify: `packages/api/src/config.ts`
- Modify: `packages/api/src/config.test.ts`

- [ ] **Step C2.1: Write failing model binding tests**

Add tests that assert:

```ts
expect(resolveModelBinding(bindings, 'planner')).toMatchObject({
  provider: 'openai',
  modelId: 'gpt-5.4',
})
expect(redactModelBindingForRenderer(resolveModelBinding(bindings, 'planner'))).toEqual({
  provider: 'openai',
  modelId: 'gpt-5.4',
  credentialConfigured: true,
})
expect(JSON.stringify(redactModelBindingForRenderer(resolveModelBinding(bindings, 'planner')))).not.toContain('sk-live-secret-value')
```

Add gateway tests that assert planner uses planner binding, prose draft uses scene prose writer binding, prose revision uses revision binding, and fallback provenance never contains raw secret values.

- [ ] **Step C2.2: Run focused failing API tests**

Run:

```bash
pnpm --filter @narrative-novel/api test -- model-binding.test.ts scenePlannerGateway.test.ts sceneProseWriterGateway.test.ts config.test.ts
```

Expected before implementation: FAIL on missing binding resolver and role-specific config.

- [ ] **Step C2.3: Implement model binding resolver and gateway consumption**

Implement:

- `ModelBindingRole = 'planner' | 'scene-prose-writer' | 'revision' | 'continuity-reviewer' | 'summary-cheap'`.
- Fixture default bindings remain valid.
- OpenAI bindings require `modelId` and a credential source.
- Gateway provenance includes provider/model id/fallback reason only.
- Gateway errors and fallback artifacts never include raw provider secrets.
- Env fallback supports existing `NARRATIVE_OPENAI_MODEL`/`OPENAI_API_KEY` while adding role-specific env names.

- [ ] **Step C2.4: Run secret-leak scan**

Run:

```bash
rg -n "sk-live-secret-value|OPENAI_API_KEY|apiKey|raw secret|credentialSecret" packages/api/src apps/desktop/src packages/renderer/src
```

Expected: matches are limited to tests/config/store internals that intentionally name env/config fields; no renderer files, run event files, artifact detail files, or Storybook files contain raw secret literals.

- [ ] **Step C2.5: Run Worker C verification**

Run:

```bash
pnpm --filter @narrative-novel/api test -- model-binding.test.ts scenePlannerGateway.test.ts scenePlannerOpenAiResponsesProvider.test.ts sceneProseWriterGateway.test.ts sceneProseWriterOpenAiResponsesProvider.test.ts config.test.ts
pnpm --filter @narrative-novel/desktop test -- credential-store.test.ts model-binding-store.test.ts desktop-api.test.ts main.test.ts
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/desktop typecheck
```

Expected: all commands PASS.

## Serial Integration Bundle

Suggested branch/worktree:

```bash
branch: codex/wave1-pr55-pr57-integration
worktree: current coordinator checkout or ../new-narrative-novel-wave1-integration
```

Explicit file ownership:

- Serial integration owns only the Serial integration files listed in the File Map.
- Serial integration reconciles worker outputs after Worker A, Worker B, and Worker C all pass combined spec/code review and have commits.
- Serial integration may edit worker-owned files only to resolve merge conflicts introduced by the three accepted branches. The coordinator must record every such edit in `doc/review/wave1-pr55-pr57-integration-report.md`.

Must-not-touch files:

- Do not expand into PR58+ files.
- Do not refactor WorkbenchShell, route-state hooks, or pane layout state.
- Do not convert fixture demo or Storybook mock runtime into real project mode.
- Do not add raw secret reads to renderer.

## Workbench Constitution Compliance

- Integration must preserve WorkbenchShell ownership of layout.
- Integration must preserve Scope x Lens route semantics and not add runtime mode or model settings into pane layout state.
- If a visible model-binding entry is required, it must be a supporting settings/status entry, not a Main Stage dashboard.
- Runtime/degraded/model status must remain supporting context. It cannot compete with scene/chapter/book/asset primary tasks.
- Affected renderer surfaces must have Storybook states and MCP structured snapshot plus screenshot evidence.

### Task I1: Merge And Reconcile Shared Glue

**Files:**

- Modify: `packages/api/src/createServer.ts`
- Modify: `packages/renderer/src/App.tsx`
- Modify: `packages/renderer/src/app/providers.tsx`
- Modify: `apps/desktop/src/main/main.ts`
- Add: `doc/review/wave1-pr55-pr57-integration-report.md`

- [ ] **Step I1.1: Merge accepted worker branches**

Run:

```bash
git switch codex/wave1-pr55-pr57-integration
git merge --no-ff codex/pr55-project-lifecycle-v1
git merge --no-ff codex/pr56-runtime-boundary-v1
git merge --no-ff codex/pr57-model-binding-credential-store-v1
```

Expected: merge completes or reports conflicts only in listed serial integration files.

- [ ] **Step I1.2: Resolve integration conflicts without widening ownership**

Allowed resolutions:

- `packages/api/src/createServer.ts` passes model binding dependencies into gateways and local project lifecycle dependencies into repositories.
- `packages/renderer/src/app/providers.tsx` passes the resolved runtime config into `ProjectRuntimeProvider` and keeps query invalidation scoped to locale/project runtime changes.
- `packages/renderer/src/App.tsx` exposes only constitution-compliant runtime/model status entry points already built by workers.
- `apps/desktop/src/main/main.ts` registers PR57 credential/model handlers while preserving PR55 project menu/open/recent behavior and existing local API supervisor handlers.

- [ ] **Step I1.3: Run integration focused tests**

Run:

```bash
pnpm --filter @narrative-novel/api test -- createServer.local-project-store.test.ts createServer.runtime-info.test.ts createServer.local-project-reset.test.ts createServer.local-persistence.test.ts
pnpm --filter @narrative-novel/renderer test -- runtime-config.test.ts ProjectRuntimeProvider.test.tsx useProjectRuntimeHealthQuery.test.tsx ProjectRuntimeStatusBadge.test.tsx providers.test.tsx
pnpm --filter @narrative-novel/desktop test -- project-picker.test.ts project-store.test.ts recent-projects.test.ts credential-store.test.ts model-binding-store.test.ts desktop-api.test.ts main.test.ts local-api-supervisor.test.ts
```

Expected: all commands PASS.

### Task I2: Gate B Verification, Storybook/MCP, Secret Scan

**Files:**

- Modify: `doc/review/wave1-pr55-pr57-integration-report.md`

- [ ] **Step I2.1: Run full wave verification**

Run:

```bash
pnpm typecheck
pnpm test
pnpm verify:prototype
pnpm typecheck:desktop
pnpm test:desktop
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected: all commands PASS.

- [ ] **Step I2.2: Run final secret-leak scan**

Run:

```bash
rg -n "sk-[A-Za-z0-9_-]+|OPENAI_API_KEY|apiKey|credentialSecret|raw secret" packages/api/src apps/desktop/src packages/renderer/src doc
```

Expected:

- API config/tests and desktop credential-store internals may contain field names such as `OPENAI_API_KEY` or `apiKey`.
- No renderer file contains a raw provider secret.
- No run event, artifact, trace, Storybook, or review doc contains a raw provider secret value.

- [ ] **Step I2.3: Run final Storybook MCP verification**

Start Storybook:

```bash
pnpm --filter @narrative-novel/renderer storybook
```

Use MCP:

1. `mcp__storybook_mcp__getComponentList` to confirm runtime status components are discoverable.
2. `mcp__storybook_mcp__getComponentsProps` for `ProjectRuntimeStatusBadge`.
3. `mcp__playwright__browser_navigate` to `http://127.0.0.1:6006/`.
4. Navigate to the `App/Project Runtime/Status Badge` story through Storybook UI or direct story URL.
5. `mcp__playwright__browser_snapshot` with boxes enabled.
6. `mcp__playwright__browser_take_screenshot` of the same story.

Expected: snapshot and screenshot prove fixture demo, mock/storybook, real-local-project healthy, and real-local-project degraded states are visible.

- [ ] **Step I2.4: Write integration report**

In `doc/review/wave1-pr55-pr57-integration-report.md`, record:

- Worker branch commits reviewed and merged.
- Exact verification commands and pass/fail result.
- Storybook MCP component list/props/snapshot/screenshot evidence summary.
- Secret-leak scan command and result.
- Gate B status against this flow:

```text
Create real project
-> configure model
-> create scene
-> run/prose/revise
-> close app
-> reopen
-> continue
```

- Any remaining coordinator concern that blocks Wave 2.

- [ ] **Step I2.5: Commit the serial integration bundle after review passes**

Run after combined spec/code review passes:

```bash
git add packages/api/src/createServer.ts packages/renderer/src/App.tsx packages/renderer/src/app/providers.tsx apps/desktop/src/main/main.ts doc/review/wave1-pr55-pr57-integration-report.md
git commit -m "2026-04-28，集成 Wave 1 项目持久化与模型配置"
```

Expected: one integration commit on `codex/wave1-pr55-pr57-integration`.

## Review Gates

Worker A review must verify:

- Project lifecycle uses one project identity from manifest/session.
- Migration backup happens before migration write.
- Failed migration or failed archive write does not corrupt the existing store.
- Recent projects do not resurrect invalid roots.
- Worker A did not touch shared hot files or renderer runtime/status UI.

Worker B review must verify:

- Real-local-project runtime cannot silently fall back to mock truth.
- Fixture demo and Storybook mock still work.
- Runtime status UI does not own layout/shell state.
- Storybook states exist and MCP structured snapshot plus screenshot evidence was captured.
- Worker B did not touch shared hot files.

Worker C review must verify:

- Raw secrets stay in desktop main/API internals only and never return to renderer.
- Model bindings are role-specific for planner, scene prose writer, revision, continuity reviewer, and summary/cheap reviewer.
- Gateway provenance includes provider/model/fallback only.
- Preload bridge remains narrow and exposes no raw Electron/Node surface.
- Worker C touched `apps/desktop/src/main/main.ts` only for credential/model IPC handlers.

Serial integration review must verify:

- All three workers merged without widening scope.
- Shared hot files reconcile dependencies without changing Workbench route/layout model.
- Gate B verification commands were run and recorded.
- Secret scan result is recorded and acceptable.
- Storybook/MCP evidence is recorded for PR56 renderer-facing changes.

## Self-Review

- Spec coverage: This plan covers Wave 1 only, maps Worker A to PR55, Worker B to PR56, Worker C to PR57, and adds the required short serial integration bundle. It includes scope guard, file map, worker ownership, must-not-touch hot files, reviewed bundles, commands, Storybook/MCP requirements, and research constraints.
- Banned marker scan: clean. Every task has named files, explicit assertions or behavior, and exact commands.
- Consistency check: Branch/worktree names are consistent across setup and worker sections. Runtime identity terms stay consistent: `fixture-demo`, `mock-storybook`, `real-local-project`. Model binding roles stay consistent across Worker C and integration.

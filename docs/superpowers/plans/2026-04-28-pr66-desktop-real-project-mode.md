# PR66 Desktop Real Project Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop shell a real-project entrypoint that can create/open/restore local projects, own the selected-project local API lifecycle, and expose stable desktop supervisor status/restart seams without pushing business truth into Electron main.

**Architecture:** Keep renderer business flows API-first and leave Workbench route/layout semantics untouched. Close PR66 inside the desktop shell by hardening the existing `project-picker -> project-store -> main/app-menu -> local-api-supervisor/worker-supervisor -> preload bridge` spine, using Electron menu and typed IPC as the product surface instead of inventing a new renderer panel in this PR.

**Tech Stack:** TypeScript, Electron main/preload, Node fs/promises, Vitest, pnpm

---

## Coordinator Handoff

- Execute this as a single PR on a new branch, for example `codex/pr66-desktop-real-project-mode`.
- Do not create a worktree for this plan. The repo policy here is serial branch work unless the wave is being implemented in parallel by separate workers.
- Use one implementation worker with `gpt5.4-medium`.
- The worker should complete both bundles below before review.
- After the worker returns, run one combined spec/code review, fix findings on the same branch, re-review, then commit once.
- Main-thread coordinator must not take over implementation while the worker is still running.

## Scope Guard And Explicit Non-Goals

- Scope is only PR66 from `doc/post-phase1-pr54-pr68-parallel-roadmap.md` and `doc/real-project-long-term-roadmap-pr51-pr68.md`.
- Keep ownership narrow to the current desktop shell seams:
  - `apps/desktop/src/main/project-store.ts`
  - `apps/desktop/src/main/recent-projects.ts`
  - `apps/desktop/src/main/project-picker.ts`
  - `apps/desktop/src/main/local-api-supervisor.ts`
  - `apps/desktop/src/main/worker-supervisor.ts`
  - `apps/desktop/src/main/runtime-config.ts`
  - `apps/desktop/src/main/app-menu.ts`
  - `apps/desktop/src/main/main.ts`
  - related preload/shared bridge files and tests
- Do not plan PR67 durable workflow persistence, resume state machines, run repository changes, or API durable-run contracts.
- Do not move business truth, run state, review state, or project data writes into Electron main. Electron main may own selected project session, child-process lifecycle, menu actions, and typed bridge handlers only.
- Do not add a new renderer diagnostics panel, workbench dock, route param, or settings page in PR66. The current repo has no existing global renderer settings host for this, and introducing one would widen scope into hot renderer files.
- Do not edit Storybook or Playwright config. This PR should not require Storybook or MCP verification unless implementation unexpectedly touches renderer-visible surfaces.
- Do not redesign `WorkerSupervisor` into a real durable execution engine. Placeholder worker ownership is acceptable in PR66 as long as lifecycle/status semantics are stable.
- Do not add cloud sync, plugin runtime, native file explorer features, or packaged-app release work.

## Current Baseline From Code Inspection

- `apps/desktop/src/main/project-picker.ts` already creates or normalizes `narrative.project.json`, `.narrative/project-store.json`, and `.narrative/artifacts` for a selected directory.
- `apps/desktop/src/main/project-store.ts` already owns current-project state, create/open actions, recent-project restore, and invalid recent-root cleanup.
- `apps/desktop/src/main/recent-projects.ts` persists sanitized recent-project records under Electron `userData`.
- `apps/desktop/src/main/runtime-config.ts` already creates `desktop-local` runtime config and child-process env for the selected project root.
- `apps/desktop/src/main/local-api-supervisor.ts` already starts the local API on demand, waits for `/api/health`, exposes logs separately, and restarts against the current selected project.
- `apps/desktop/src/main/worker-supervisor.ts` already provides `disabled | starting | ready | failed | stopped` placeholder lifecycle semantics.
- `apps/desktop/src/main/main.ts` already wires IPC handlers, restores a last project on startup, falls back to `resolveWorkspaceRoot()` when nothing is selected, starts the local API automatically, and refreshes the application menu after project actions.
- `apps/desktop/src/shared/desktop-bridge-types.ts` and `apps/desktop/src/preload/desktop-api.ts` already expose typed bridge methods for runtime config, local API status/logs, worker status/restart, credentials, and model bindings.
- `packages/renderer/src/app/runtime/runtime-config.ts` already consumes `window.narrativeDesktop.getRuntimeConfig()` for desktop-local mode. Because that renderer seam already exists and this PR plan does not add a new renderer surface, Storybook and MCP are not part of the planned verification floor.

## File Map

- Modify: `apps/desktop/src/main/project-picker.ts`
  Purpose: keep create/open semantics aligned with real local project directories and avoid regressions around manifest normalization.
- Modify: `apps/desktop/src/main/project-picker.test.ts`
  Purpose: lock real-project directory initialization and existing-manifest restore behavior.
- Modify: `apps/desktop/src/main/project-store.ts`
  Purpose: keep selection and recent-project bookkeeping deterministic across create/open/restore flows.
- Modify: `apps/desktop/src/main/project-store.test.ts`
  Purpose: cover create/open/restore/forget semantics that PR66 depends on.
- Modify: `apps/desktop/src/main/recent-projects.ts`
  Purpose: only if needed for deterministic recent-project ordering or malformed-entry cleanup.
- Modify: `apps/desktop/src/main/recent-projects.test.ts`
  Purpose: cover any recent-project hardening done for PR66.
- Modify: `apps/desktop/src/main/app-menu.ts`
  Purpose: add an explicit desktop runtime/project control surface in the native application menu without creating a renderer page.
- Modify: `apps/desktop/src/main/main.ts`
  Purpose: keep startup, menu actions, and typed IPC handlers consistent with PR66 acceptance.
- Modify: `apps/desktop/src/main/main.test.ts`
  Purpose: prove startup/menu/runtime handler behavior from the real main entry path.
- Modify: `apps/desktop/src/main/runtime-config.ts`
  Purpose: only if needed to tighten selected-project env invariants for local API startup.
- Modify: `apps/desktop/src/main/runtime-config.test.ts`
  Purpose: lock any env/config changes.
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
  Purpose: only if needed to harden restart/status behavior around the selected project.
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
  Purpose: cover automatic startup, restart, health failure, and per-project runtime config behavior.
- Modify: `apps/desktop/src/main/worker-supervisor.ts`
  Purpose: only if needed to tighten placeholder lifecycle snapshots.
- Modify: `apps/desktop/src/main/worker-supervisor.test.ts`
  Purpose: cover restart/status stability.
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
  Purpose: only if menu/runtime control additions require one more typed channel.
- Modify: `apps/desktop/src/preload/desktop-api.ts`
  Purpose: expose any newly-added typed channel and keep the bridge narrow.
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
  Purpose: lock the exact preload surface and forbid raw Node/Electron leakage.

## Renderer / Storybook Decision

- Planned PR66 work is desktop-shell-only.
- No `packages/renderer/**` file is planned.
- No Storybook update is planned.
- No MCP structured snapshot run is planned.
- If implementation discovers that PR66 cannot be closed without a renderer-visible settings or diagnostics surface, stop and rewrite the plan instead of widening this PR informally.

## Bundle 1: Real Project Entry And Desktop Startup Ownership

**Files:**
- Modify: `apps/desktop/src/main/project-picker.ts`
- Modify: `apps/desktop/src/main/project-picker.test.ts`
- Modify: `apps/desktop/src/main/project-store.ts`
- Modify: `apps/desktop/src/main/project-store.test.ts`
- Modify: `apps/desktop/src/main/recent-projects.ts`
- Modify: `apps/desktop/src/main/recent-projects.test.ts`
- Modify: `apps/desktop/src/main/main.ts`
- Modify: `apps/desktop/src/main/main.test.ts`

### Task 1.1: Lock Real Project Create/Open/Restore Behavior With Focused Tests

- [ ] **Step 1: Extend `project-picker.test.ts` with create/open/restore expectations**

Add or keep equivalent coverage for these exact cases:

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

And for existing manifests:

```ts
await expect(readExistingProjectSession(projectRoot)).resolves.toEqual({
  projectId: 'local-existing-project',
  projectRoot,
  projectTitle: 'Existing Local Project',
})
```

Also assert the real-project directory contract remains intact:

```ts
expect(existsSync(path.join(projectRoot, '.narrative', 'artifacts'))).toBe(true)
expect(readFileSync(path.join(projectRoot, 'narrative.project.json'), 'utf8')).toContain('"schemaVersion": 1')
```

- [ ] **Step 2: Extend `project-store.test.ts` for create/open/restore and invalid recent cleanup**

Use test doubles that make the acceptance flow explicit:

```ts
const picker = {
  createProjectWithDialog: vi.fn(async () => createdProject),
  openProjectWithDialog: vi.fn(async () => openedProject),
  readExistingProjectSession: vi.fn(async (projectRoot: string) => {
    if (projectRoot === '/tmp/missing-project') {
      throw new Error('Narrative project root does not exist: /tmp/missing-project')
    }
    return restoredProject
  }),
  readOrInitializeProjectSession: vi.fn(async () => restoredProject),
}
```

Assert:

```ts
await expect(store.createProject()).resolves.toEqual(createdProject)
await expect(store.openProject()).resolves.toEqual(openedProject)
await expect(store.restoreLastProject()).resolves.toEqual(restoredProject)
expect(recentProjects.remove).toHaveBeenCalledWith('/tmp/missing-project')
```

- [ ] **Step 3: Extend `main.test.ts` so the real main entry proves desktop startup ownership**

Add assertions from the actual `main.ts` import path that the app:

```ts
await import('./main.js')

expect(projectStore.restoreLastProject).toHaveBeenCalledTimes(1)
expect(localApiSupervisor.start).toHaveBeenCalledTimes(1)
expect(createMainWindow).toHaveBeenCalledTimes(1)
```

For the no-recent-project fallback path:

```ts
expect(projectStore.selectProjectRoot).toHaveBeenCalledWith('/tmp/local-project')
```

For menu actions:

```ts
await initialMenuOptions?.onCreateProject?.()
expect(projectStore.createProject).toHaveBeenCalledTimes(1)
expect(localApiSupervisor.restart).toHaveBeenCalledTimes(1)
```

- [ ] **Step 4: Run the focused desktop tests and confirm they fail for the missing or stale acceptance cases**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- project-picker.test.ts project-store.test.ts main.test.ts
```

Expected before implementation: at least one failure around startup/menu acceptance or recent-project restore behavior if the repo is still missing PR66 closure.

### Task 1.2: Implement Only The Missing Real-Project Entry Hardening

- [ ] **Step 1: Keep `project-picker.ts` minimal and manifest-driven**

Implementation constraints:

```ts
// Keep create/open bound to directory selection and manifest normalization.
// Do not introduce a second project identity source.
// Do not write business data here; this file owns session metadata only.
```

If code changes are needed, they should stay in this shape:

```ts
return {
  projectId,
  projectRoot,
  projectTitle: title,
}
```

- [ ] **Step 2: Keep `project-store.ts` as the single selected-project coordinator**

Implementation constraints:

```ts
private async rememberProjectSelection(selectedProject: SelectedProjectSession): Promise<SelectedProjectSession> {
  this.currentProject = selectedProject
  this.recentProjectsSnapshot = await this.recentProjects.add(selectedProject)
  return selectedProject
}
```

Preserve current behavior that selection stays active even if recent-project persistence fails:

```ts
try {
  this.recentProjectsSnapshot = await this.recentProjects.add(selectedProject)
} catch {
  // Keep selected project active.
}
```

- [ ] **Step 3: Keep `main.ts` startup/menu behavior aligned with PR66 acceptance**

Required behavior:

```ts
await activeProjectStore.restoreLastProject()
if (!activeProjectStore.getCurrentProject()) {
  await activeProjectStore.selectProjectRoot(resolveWorkspaceRoot())
}
await localApiSupervisor.start()
await createMainWindow()
```

And menu actions must remain restart-aware:

```ts
const selectedProject = await activeProjectStore.createProject()
if (selectedProject) {
  await restartLocalApiForProjectSelection()
}
```

- [ ] **Step 4: Re-run focused tests**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- project-picker.test.ts project-store.test.ts recent-projects.test.ts main.test.ts
```

Expected: PASS.

## Bundle 2: Local API / Worker Supervisor And Native Desktop Runtime Controls

**Files:**
- Modify: `apps/desktop/src/main/app-menu.ts`
- Modify: `apps/desktop/src/main/main.ts`
- Modify: `apps/desktop/src/main/main.test.ts`
- Modify: `apps/desktop/src/main/runtime-config.ts`
- Modify: `apps/desktop/src/main/runtime-config.test.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
- Modify: `apps/desktop/src/main/worker-supervisor.ts`
- Modify: `apps/desktop/src/main/worker-supervisor.test.ts`
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
- Modify: `apps/desktop/src/preload/desktop-api.ts`
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`

### Task 2.1: Lock Supervisor Status / Restart / Log Semantics With Tests

- [ ] **Step 1: Extend `local-api-supervisor.test.ts` for selected-project startup and restart**

Keep or add coverage using a fake child process:

```ts
const supervisor = new LocalApiSupervisor({
  fetch: vi.fn(async () => ({ ok: true, status: 200 }) as Response),
  findAvailablePort: async () => 4888,
  getCurrentProject: () => ({
    projectId: 'local-project-alpha',
    projectRoot: '/tmp/local-project',
    projectTitle: 'Desktop Local Project',
  }),
  sleep: async () => {},
  spawnLocalApi: (config) => {
    spawnConfigs.push(config)
    return child
  },
})
```

Assert:

```ts
expect(snapshot.status).toBe('ready')
expect(snapshot.runtimeConfig?.projectId).toBe('local-project-alpha')
expect(spawnConfigs[0]?.env.NARRATIVE_PROJECT_STORE_FILE).toBe('/tmp/local-project/.narrative/project-store.json')
expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:4888/api/health', { signal: expect.any(AbortSignal) })
```

Also add a restart assertion:

```ts
await expect(supervisor.restart()).resolves.toMatchObject({
  status: 'ready',
})
```

- [ ] **Step 2: Extend `worker-supervisor.test.ts` for stable placeholder lifecycle**

Lock the intended PR66 contract, not a real workflow engine:

```ts
expect(new WorkerSupervisor().getSnapshot()).toEqual({
  implementation: 'placeholder',
  lastError: undefined,
  processId: undefined,
  status: 'disabled',
})
```

And:

```ts
await expect(supervisor.restart()).resolves.toEqual({
  implementation: 'placeholder',
  lastError: undefined,
  processId: 4002,
  status: 'ready',
})
```

- [ ] **Step 3: Extend `preload/desktop-api.test.ts` and `main.test.ts` for the exact narrow desktop contract**

The preload surface must continue to expose only typed runtime controls:

```ts
expect(Object.keys(api).sort()).toEqual([
  'deleteProviderCredential',
  'getAppVersion',
  'getCurrentProject',
  'getLocalApiLogs',
  'getLocalApiStatus',
  'getModelBindings',
  'getPlatform',
  'getProviderCredentialStatus',
  'getRuntimeConfig',
  'getRuntimeMode',
  'getWorkerStatus',
  'restartLocalApi',
  'restartWorker',
  'saveProviderCredential',
  'updateModelBinding',
])
expect('ipcRenderer' in api).toBe(false)
expect('child_process' in api).toBe(false)
expect('fs' in api).toBe(false)
```

From `main.test.ts`, assert the real main entry registers:

```ts
expect(registrations.has(DESKTOP_API_CHANNELS.getLocalApiStatus)).toBe(true)
expect(registrations.has(DESKTOP_API_CHANNELS.restartLocalApi)).toBe(true)
expect(registrations.has(DESKTOP_API_CHANNELS.getLocalApiLogs)).toBe(true)
expect(registrations.has(DESKTOP_API_CHANNELS.getWorkerStatus)).toBe(true)
expect(registrations.has(DESKTOP_API_CHANNELS.restartWorker)).toBe(true)
```

- [ ] **Step 4: Add or tighten native menu tests for runtime controls**

In `main.test.ts` or a dedicated `app-menu` test if one already exists, assert the menu callbacks include explicit runtime controls rather than hiding everything behind renderer UI:

```ts
const runtimeMenu = buildApplicationMenuTemplate({
  isDev: false,
  onOpenProject: vi.fn(),
  onCreateProject: vi.fn(),
  onOpenRecentProject: vi.fn(),
  onCreateProjectBackup: vi.fn(),
  onExportProjectArchive: vi.fn(),
  onRestartLocalApi: vi.fn(),
  onRestartWorker: vi.fn(),
})
```

Expected labels should include native desktop control affordances such as:

```ts
'Restart Local API'
'Restart Worker'
```

- [ ] **Step 5: Run the focused supervisor/bridge tests and confirm failures before implementation**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- runtime-config.test.ts local-api-supervisor.test.ts worker-supervisor.test.ts preload/desktop-api.test.ts main.test.ts
```

Expected before implementation: FAIL where the runtime menu or bridge contract is still incomplete.

### Task 2.2: Implement The Missing Native Desktop Runtime Controls Without Adding Renderer Scope

- [ ] **Step 1: Extend `app-menu.ts` with native runtime controls**

Keep the menu shape native and shell-owned. A minimal acceptable addition is:

```ts
export interface ApplicationMenuOptions {
  isDev: boolean
  onCreateProject?: () => Promise<void> | void
  onOpenProject?: () => Promise<void> | void
  onOpenRecentProject?: (projectRoot: string) => Promise<void> | void
  onCreateProjectBackup?: () => Promise<void> | void
  onExportProjectArchive?: () => Promise<void> | void
  onRestartLocalApi?: () => Promise<void> | void
  onRestartWorker?: () => Promise<void> | void
  platform?: NodeJS.Platform
  recentProjects?: RecentProjectRecord[]
}
```

And add menu items that call those callbacks directly:

```ts
{
  label: 'Runtime',
  submenu: [
    { label: 'Restart Local API', click: () => { void onRestartLocalApi?.() } },
    { label: 'Restart Worker', click: () => { void onRestartWorker?.() } },
  ],
}
```

- [ ] **Step 2: Keep `main.ts` as the single owner of runtime menu actions and typed bridge handlers**

Wire the new menu callbacks through existing supervisors:

```ts
onRestartLocalApi: () => runProjectMenuAction(async () => {
  await localApiSupervisor.restart()
}),
onRestartWorker: () => runProjectMenuAction(async () => {
  await workerSupervisor.restart()
}),
```

Do not add renderer event buses or raw process access here.

- [ ] **Step 3: Tighten `runtime-config.ts` and `local-api-supervisor.ts` only if tests prove drift**

Any code changes here must preserve the selected-project env contract:

```ts
env: {
  ...inheritedEnv,
  NARRATIVE_PROJECT_ARTIFACT_DIR: projectArtifactDirPath,
  NARRATIVE_PROJECT_ID: currentProject.projectId,
  NARRATIVE_PROJECT_ROOT: currentProject.projectRoot,
  NARRATIVE_PROJECT_STORE_FILE: projectStoreFilePath,
  NARRATIVE_PROJECT_TITLE: currentProject.projectTitle,
  NARRATIVE_RUNTIME: 'desktop-local',
  PORT: String(port),
}
```

And supervisor snapshots must keep logs out of the status response:

```ts
const { logs: _logs, ...snapshot } = supervisor.getSnapshot()
return snapshot
```

- [ ] **Step 4: Keep the preload bridge narrow**

If new typed channels are added, expose them exactly once in `desktop-bridge-types.ts` and `desktop-api.ts`, and keep this invariant:

```ts
expect('process' in api).toBe(false)
expect('ipcRenderer' in api).toBe(false)
expect('getRawCredential' in api).toBe(false)
```

- [ ] **Step 5: Re-run the focused desktop tests**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- runtime-config.test.ts local-api-supervisor.test.ts worker-supervisor.test.ts preload/desktop-api.test.ts main.test.ts
```

Expected: PASS.

## Final Verification

- [ ] **Step 1: Run desktop package typecheck**

```bash
pnpm typecheck:desktop
```

Expected: PASS.

- [ ] **Step 2: Run the full desktop test suite**

```bash
pnpm test:desktop
```

Expected: PASS.

- [ ] **Step 3: Run root cross-package guards because `main.ts` and preload bridge are shared startup seams**

```bash
pnpm typecheck
pnpm test
```

Expected: PASS. If root `pnpm test` is too slow in the worker session, the minimum acceptable evidence is `pnpm typecheck:desktop` plus `pnpm test:desktop`, but the coordinator should still note the skipped root run in review.

## Acceptance Checklist

- Desktop app startup restores the most recent valid project when available.
- When no recent project is restorable, startup selects the repo workspace root once and starts the local API automatically.
- `Create Project...`, `Open Project...`, and `Recent Projects` update the selected project and restart the local API when selection changes.
- Native desktop menu exposes runtime restart controls without introducing a renderer diagnostics page.
- `getRuntimeConfig`, `getLocalApiStatus`, `restartLocalApi`, `getLocalApiLogs`, `getWorkerStatus`, and `restartWorker` remain typed preload APIs only.
- `WorkerSupervisor` remains placeholder-capable but restartable; PR66 does not attempt durable workflow execution.
- No `packages/renderer/**` file is touched. If that changes, this plan is no longer the right plan.

## Out-Of-Scope Reminder For Review

- No Storybook changes.
- No MCP/browser verification.
- No renderer modal, panel, or route work.
- No durable run persistence or review resume logic from PR67.
- No credential editor UX beyond preserving the existing narrow typed bridge contract.

# PR54 Local Project Store v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make desktop-local projects use a durable non-fixture local project store that can bootstrap a book/chapter/scene, persist scene run/prose state, and restore the same state after API or desktop restart.

**Architecture:** Keep the current Fastify API contract and Workbench route model unchanged, but stop treating `book-signal-arc` fixture overlays as product truth for desktop-local projects. A selected project directory owns `narrative.project.json`, `.narrative/project-store.json`, and `.narrative/artifacts/`; the API loads or initializes exactly one project for the selected desktop project id, writes the existing mutable repository state back to that store after mutations, and leaves web/no-current-project mode fixture-only.

**Tech Stack:** TypeScript, Node fs/promises, Fastify, Electron main process, React Storybook, Vitest, pnpm, Storybook MCP structured snapshots

---

## Coordinator Handoff

- Execute this plan serially from the current `codex/phase1-pr51-pr53` state.
- Implementation should happen on a new branch, for example `codex/pr54-local-project-store-v1`; do not implement directly on `main` or `master`.
- Do not create a worktree for this serial wave.
- Dispatch implementation subagents with `gpt5.4-high`.
- Each bundle below is designed as one reviewed unit with multiple tasks. Dispatch one bundle at a time, wait for the worker result, run combined spec/code review, then commit the accepted bundle before dispatching the next bundle.
- Main-thread coordinator must not take over implementation while a worker is still running.

## Scope Guard And Non-Goals

- Scope is only PR54 `Local Project Store v1`.
- Do not plan or implement PR55 create/open/backup/migration UX beyond the minimal project-directory initialization needed for PR54.
- Do not plan or implement PR56 fixture-to-real runtime boundary UI beyond the runtime-status story/test listed in Bundle 4.
- Do not plan or implement PR57 model binding, credentials, cloud sync, auth, collaboration, marketplace, backup archives, import/export ecosystems, Temporal, worker queues, or database engines.
- Do not add generic book/chapter/scene CRUD routes. PR54 "create book/chapter/scene" means initializing a real local project store from the existing Signal Arc project template, not adding authoring UI or arbitrary object creation.
- Do not change Workbench route semantics. `projectId` stays runtime/session identity; `bookId`, `chapterId`, `sceneId`, and `assetId` stay object route identity.
- Do not write layout preference into route. Do not put current object identity into shell layout storage.
- Do not rewrite renderer data clients or Workbench surfaces. Renderer changes are limited to runtime-status story/test coverage for the visible desktop-local project identity.
- Do not silently fall back to fixture truth when a selected local project store exists but is malformed. Missing store file initializes; invalid JSON or wrong schema fails startup with a clear local-store error.

## Current Baseline From Code Inspection

- `apps/desktop/src/main/project-picker.ts` currently normalizes every project id to `book-signal-arc`, even when `narrative.project.json` contains another id.
- `apps/desktop/src/main/runtime-config.ts` starts the local API with `NARRATIVE_PROJECT_STATE_FILE=<projectRoot>/.narrative/prototype-state.json`; this is still a prototype overlay path.
- `packages/api/src/repositories/project-state-persistence.ts` persists only mutable overlays with `seedVersion: "prototype-fixture-seed-v1"` and strips seed-only data such as `books`.
- `packages/api/src/repositories/fixtureRepository.ts` starts from `createFixtureDataSnapshot(apiBaseUrl)` and only applies overlays to projects already present in the fixture snapshot, so an arbitrary non-fixture project id currently fails `PROJECT_NOT_FOUND`.
- `packages/api/src/repositories/runFixtureStore.ts` already exports/hydrates run records, events, artifacts, selected variants, and scene sequence counters through `PersistedRunStore`.
- `packages/api/src/routes/project-runtime.ts`, `book.ts`, `chapter.ts`, `scene.ts`, `run.ts`, and `runArtifacts.ts` already expose the read/write routes PR54 should preserve.
- `packages/renderer/src/app/project-runtime/project-persistence.ts` and `local-storage-project-persistence.ts` are renderer/mock persistence boundaries. They are not the PR54 product store and should not become the desktop-local source of truth.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx` already has desktop-local API status stories and is the right Storybook surface for visible project identity proof.

## Store Contract

The PR54 local project directory must contain:

```text
<projectRoot>/narrative.project.json
<projectRoot>/.narrative/project-store.json
<projectRoot>/.narrative/artifacts/
```

`narrative.project.json` v1:

```json
{
  "schemaVersion": 1,
  "projectId": "local-project-alpha",
  "title": "Local Alpha",
  "createdAt": "2026-04-28T00:00:00.000Z",
  "updatedAt": "2026-04-28T00:00:00.000Z",
  "store": {
    "schemaVersion": 1,
    "dataFile": ".narrative/project-store.json",
    "artifactDir": ".narrative/artifacts"
  },
  "bootstrap": {
    "source": "signal-arc-demo-template-v1"
  }
}
```

`.narrative/project-store.json` v1:

```json
{
  "schemaVersion": 1,
  "storeKind": "local-project-store-v1",
  "templateVersion": "signal-arc-demo-template-v1",
  "project": {
    "projectId": "local-project-alpha",
    "projectTitle": "Local Alpha",
    "createdAt": "2026-04-28T00:00:00.000Z",
    "updatedAt": "2026-04-28T00:00:00.000Z"
  },
  "data": {
    "runtimeInfo": {},
    "books": {},
    "manuscriptCheckpoints": {},
    "exportProfiles": {},
    "exportArtifacts": {},
    "experimentBranches": {},
    "chapters": {},
    "assets": {},
    "reviewDecisions": {},
    "reviewFixActions": {},
    "scenes": {}
  },
  "runStore": {
    "runStates": [],
    "sceneSequences": {}
  },
  "artifactStore": {
    "kind": "inline-run-artifacts-v1",
    "artifactDir": ".narrative/artifacts"
  }
}
```

V1 artifact truth is the serialized run/artifact section in `project-store.json`; `.narrative/artifacts/` is created and recorded as the artifact-store boundary for PR55+ without moving blobs out of JSON in PR54.

## File Map

- Create: `docs/superpowers/plans/2026-04-28-pr54-local-project-store-v1.md`
  Purpose: this plan only.
- Modify: `apps/desktop/src/main/project-picker.ts`
  Purpose: create/read v1 project manifests with stable non-fixture project ids and `.narrative` directories.
- Modify: `apps/desktop/src/main/project-picker.test.ts`
  Purpose: lock manifest initialization, existing-id preservation, legacy backfill, and dialog behavior.
- Modify: `apps/desktop/src/main/project-store.ts`
  Purpose: preserve selected project sessions and recent-project behavior with non-fixture ids.
- Modify: `apps/desktop/src/main/project-store.test.ts`
  Purpose: update project-store expectations to non-fixture ids.
- Modify: `apps/desktop/src/main/recent-projects.ts`
  Purpose: keep recent project validation compatible with v1 project ids and titles.
- Modify: `apps/desktop/src/main/recent-projects.test.ts`
  Purpose: verify recent projects keep non-fixture ids.
- Modify: `apps/desktop/src/main/runtime-config.ts`
  Purpose: pass `NARRATIVE_PROJECT_STORE_FILE`, `NARRATIVE_PROJECT_ARTIFACT_DIR`, and current project identity into the API child process.
- Modify: `apps/desktop/src/main/runtime-config.test.ts`
  Purpose: lock desktop-local env and runtime config for a non-fixture project.
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
  Purpose: no behavior redesign; keep selected-project startup using the updated runtime config.
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
  Purpose: update readiness/env assertions to the local project store contract.
- Modify: `apps/desktop/src/main/main.ts`
  Purpose: preserve startup/open-recent flow while selected project ids are no longer pinned to the fixture id.
- Modify: `apps/desktop/src/main/main.test.ts`
  Purpose: update bridge/menu assertions for non-fixture ids and runtime config.
- Modify: `packages/api/src/config.ts`
  Purpose: expose `projectStoreFilePath` and `projectArtifactDirPath` from env/config.
- Create or replace: `packages/api/src/config.test.ts`
  Purpose: lock env parsing for store/artifact paths and preserve host/port/base path behavior.
- Modify: `packages/api/src/createServer.ts`
  Purpose: wire the local store only when `config.currentProject` exists; keep no-current-project web mode fixture-only.
- Modify: `packages/api/src/test/support/test-server.ts`
  Purpose: let tests launch fresh servers against the same temp local store and explicit current project.
- Modify: `packages/api/src/repositories/project-state-persistence.ts`
  Purpose: replace prototype overlay persistence with the PR54 local project store v1 file contract.
- Modify: `packages/api/src/repositories/project-state-persistence.test.ts`
  Purpose: lock missing-store initialization, invalid-store failure, atomic writes, full project data persistence, and reset behavior.
- Modify: `packages/api/src/repositories/fixture-data.ts`
  Purpose: export a project template builder that can create `FixtureProjectData` for a selected local project id/title while keeping object ids stable.
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
  Purpose: hydrate/initialize the selected local project, persist full project data and run store after mutations, and reset the selected project to the template.
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
  Purpose: keep existing run export/hydrate semantics and ensure PR54 persists selected variants/artifacts/trace-readable data.
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
  Purpose: add non-fixture project id export/hydrate coverage.
- Create: `packages/api/src/createServer.local-project-store.test.ts`
  Purpose: prove PR54 end-to-end restart persistence and non-fixture project bootstrap.
- Modify: `packages/api/src/createServer.run-flow.test.ts`
  Purpose: keep current run flow green under local-store-backed current project.
- Modify: `packages/api/src/createServer.write-surfaces.test.ts`
  Purpose: keep write routes and reset route green under local-store-backed current project.
- Modify: `packages/api/src/createServer.read-surfaces.test.ts`
  Purpose: prove bootstrapped local project exposes book/chapter/scene read surfaces.
- Modify: `packages/api/src/createServer.runtime-info.test.ts`
  Purpose: prove runtime-info reflects selected local project id/title.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
  Purpose: add a local project store v1 visible runtime-status state.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
  Purpose: lock visible non-fixture project title/id fallback behavior.
- Modify: `doc/api-contract.md`
  Purpose: document the PR54 local project store contract and the fixture/no-current-project separation.

## Workbench Constitution Compliance

PR54 is mostly API/desktop persistence work, but desktop-local project identity is visible through the existing Workbench header runtime status. Therefore this plan includes the required compliance section.

- WorkbenchShell remains the only layout owner. PR54 does not add a page shell, dashboard, picker-in-workbench, custom splitter, dock toggle, or local pane persistence.
- Scope x lens stays unchanged. `projectId` is runtime/session identity; it must not replace route object ids such as `book-signal-arc`, `chapter-signals-in-rain`, or `scene-midnight-platform`.
- Route/layout separation stays unchanged. No project store path, project root, project title, pane size, or layout preference is written into URL query params.
- Main Stage keeps one primary task. The local store only changes where state is loaded/saved; it does not move scene run/review/prose tasks into Inspector or Bottom Dock.
- Navigator remains object navigation. The bootstrapped project may use a non-fixture `projectId`, but navigator scene ids remain the canonical scene object ids from the project template.
- Inspector and Bottom Dock remain supporting read surfaces. Persisted run/prose state may appear there after restart, but PR54 must not introduce a debugger-style local-store panel.
- Storybook coverage is required only for the runtime-status surface affected by visible project identity: `App/Project Runtime/Status Badge`.
- MCP verification must use both structured snapshot and screenshot for the updated Storybook story; do not rely on visual screenshot only.

## Bundle 1: Desktop Project Manifest And Runtime Env

**Files:**
- Modify: `apps/desktop/src/main/project-picker.ts`
- Modify: `apps/desktop/src/main/project-picker.test.ts`
- Modify: `apps/desktop/src/main/project-store.ts`
- Modify: `apps/desktop/src/main/project-store.test.ts`
- Modify: `apps/desktop/src/main/recent-projects.ts`
- Modify: `apps/desktop/src/main/recent-projects.test.ts`
- Modify: `apps/desktop/src/main/runtime-config.ts`
- Modify: `apps/desktop/src/main/runtime-config.test.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
- Modify: `apps/desktop/src/main/main.test.ts`

- [ ] **Step 1: Write failing project-picker tests for v1 manifests**

Add or update tests in `apps/desktop/src/main/project-picker.test.ts` for these exact cases:

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

Expected initialized `narrative.project.json`:

```json
{
  "schemaVersion": 1,
  "projectId": "local-project-alpha",
  "title": "<temp-folder-basename>",
  "createdAt": "2026-04-28T00:00:00.000Z",
  "updatedAt": "2026-04-28T00:00:00.000Z",
  "store": {
    "schemaVersion": 1,
    "dataFile": ".narrative/project-store.json",
    "artifactDir": ".narrative/artifacts"
  },
  "bootstrap": {
    "source": "signal-arc-demo-template-v1"
  }
}
```

Also assert:

```ts
expect(existsSync(path.join(projectRoot, '.narrative'))).toBe(true)
expect(existsSync(path.join(projectRoot, '.narrative', 'artifacts'))).toBe(true)
```

- [ ] **Step 2: Write failing tests that preserve existing non-fixture ids**

In `project-picker.test.ts`, write an existing manifest with:

```json
{
  "schemaVersion": 1,
  "projectId": "local-existing-project",
  "title": "Existing Local Project",
  "createdAt": "2026-04-27T00:00:00.000Z",
  "updatedAt": "2026-04-27T00:00:00.000Z",
  "store": {
    "schemaVersion": 1,
    "dataFile": ".narrative/project-store.json",
    "artifactDir": ".narrative/artifacts"
  },
  "bootstrap": {
    "source": "signal-arc-demo-template-v1"
  }
}
```

Expected result:

```ts
{
  projectId: 'local-existing-project',
  projectRoot,
  projectTitle: 'Existing Local Project',
}
```

The implementation must not rewrite that id to `book-signal-arc`.

- [ ] **Step 3: Implement the manifest reader/initializer**

Modify `readOrInitializeProjectSession` to accept:

```ts
export interface ReadProjectSessionOptions {
  createProjectId?: () => string
  now?: () => string
}
```

Implementation rules:

```text
default createProjectId = () => `local-project-${randomUUID()}`
default now = () => new Date().toISOString()
valid existing projectId = non-empty string
valid existing title = non-empty string
missing projectId = createProjectId()
missing title = path.basename(projectRoot)
missing createdAt = now()
updatedAt = now() only when the manifest is created or normalized
store.dataFile = ".narrative/project-store.json"
store.artifactDir = ".narrative/artifacts"
bootstrap.source = "signal-arc-demo-template-v1"
```

Use `mkdir(path.join(projectRoot, '.narrative', 'artifacts'), { recursive: true })` before writing the manifest.

- [ ] **Step 4: Update desktop runtime config tests for store env**

In `apps/desktop/src/main/runtime-config.test.ts`, update the spawn-config expected env to:

```ts
expect(config.env).toMatchObject({
  HOST: '127.0.0.1',
  NARRATIVE_PROJECT_ID: 'local-project-alpha',
  NARRATIVE_PROJECT_ROOT: '/repo/projects/local-alpha',
  NARRATIVE_PROJECT_STORE_FILE: path.resolve('/repo/projects/local-alpha/.narrative/project-store.json'),
  NARRATIVE_PROJECT_ARTIFACT_DIR: path.resolve('/repo/projects/local-alpha/.narrative/artifacts'),
  NARRATIVE_PROJECT_TITLE: 'Local Alpha',
  NARRATIVE_RUNTIME: 'desktop-local',
  PATH: '/usr/bin',
  PORT: '4888',
})
```

Also assert `createDesktopRuntimeConfig(4888, { currentProject })` returns `projectId: 'local-project-alpha'` and `projectTitle: 'Local Alpha'`.

- [ ] **Step 5: Implement runtime env wiring**

In `apps/desktop/src/main/runtime-config.ts`:

```text
projectStoreFilePath = path.resolve(currentProject.projectRoot, '.narrative', 'project-store.json')
projectArtifactDirPath = path.resolve(currentProject.projectRoot, '.narrative', 'artifacts')
```

Set env:

```text
NARRATIVE_PROJECT_STORE_FILE
NARRATIVE_PROJECT_ARTIFACT_DIR
```

Stop setting `NARRATIVE_PROJECT_STATE_FILE` from desktop. The API may still accept it as a legacy fallback in Bundle 2, but desktop-local v1 must use the new store env.

- [ ] **Step 6: Update desktop store/supervisor/main tests to non-fixture ids**

Replace helper sessions in desktop tests with:

```ts
{
  projectId: 'local-project-alpha',
  projectRoot: '/tmp/local-alpha',
  projectTitle: 'Local Alpha',
}
```

Keep behavior assertions unchanged:

```text
restoreLastProject removes invalid recents
openProject remembers selected project
recent persistence failure does not clear current project
local API starts only with selected project
menu failures do not restart local API
```

- [ ] **Step 7: Run Bundle 1 verification**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- project-picker.test.ts project-store.test.ts recent-projects.test.ts runtime-config.test.ts local-api-supervisor.test.ts main.test.ts
pnpm typecheck:desktop
```

Expected: both commands pass.

- [ ] **Step 8: Review and commit Bundle 1**

After combined spec/code review passes:

```bash
git add apps/desktop/src/main/project-picker.ts apps/desktop/src/main/project-picker.test.ts apps/desktop/src/main/project-store.ts apps/desktop/src/main/project-store.test.ts apps/desktop/src/main/recent-projects.ts apps/desktop/src/main/recent-projects.test.ts apps/desktop/src/main/runtime-config.ts apps/desktop/src/main/runtime-config.test.ts apps/desktop/src/main/local-api-supervisor.test.ts apps/desktop/src/main/main.test.ts
git commit -m "2026-04-28，PR54 desktop project manifest and local store env"
```

## Bundle 2: API Local Project Store Foundation

**Files:**
- Modify: `packages/api/src/config.ts`
- Create or replace: `packages/api/src/config.test.ts`
- Modify: `packages/api/src/createServer.ts`
- Modify: `packages/api/src/test/support/test-server.ts`
- Modify: `packages/api/src/repositories/project-state-persistence.ts`
- Modify: `packages/api/src/repositories/project-state-persistence.test.ts`
- Modify: `packages/api/src/repositories/fixture-data.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`

- [ ] **Step 1: Write failing config tests for store paths**

Create or update `packages/api/src/config.test.ts` with these assertions:

```ts
expect(getApiServerConfig()).toMatchObject({
  projectStoreFilePath: expect.stringContaining(path.join('.narrative', 'project-store.json')),
  projectArtifactDirPath: expect.stringContaining(path.join('.narrative', 'artifacts')),
})
```

With env:

```ts
process.env.NARRATIVE_PROJECT_STORE_FILE = '/tmp/local-alpha/.narrative/project-store.json'
process.env.NARRATIVE_PROJECT_ARTIFACT_DIR = '/tmp/local-alpha/.narrative/artifacts'
```

Expected:

```ts
expect(getApiServerConfig()).toMatchObject({
  projectStoreFilePath: '/tmp/local-alpha/.narrative/project-store.json',
  projectArtifactDirPath: '/tmp/local-alpha/.narrative/artifacts',
})
```

Also assert legacy fallback:

```ts
process.env.NARRATIVE_PROJECT_STATE_FILE = '/tmp/legacy/prototype-state.json'
expect(getApiServerConfig().projectStoreFilePath).toBe('/tmp/legacy/prototype-state.json')
```

- [ ] **Step 2: Implement API config fields**

In `packages/api/src/config.ts`, replace `projectStateFilePath` with:

```ts
projectStoreFilePath: string
projectArtifactDirPath: string
```

Resolution order:

```text
projectStoreFilePath = NARRATIVE_PROJECT_STORE_FILE || NARRATIVE_PROJECT_STATE_FILE || resolveDefaultProjectStoreFilePath()
projectArtifactDirPath = NARRATIVE_PROJECT_ARTIFACT_DIR || path.join(path.dirname(projectStoreFilePath), 'artifacts')
```

Preserve current parsing for `HOST`, `PORT`, `API_BASE_PATH`, `API_BASE_URL`, `CORS_ORIGIN`, `NARRATIVE_PROJECT_ID`, `NARRATIVE_PROJECT_ROOT`, `NARRATIVE_PROJECT_TITLE`, and model env.

- [ ] **Step 3: Write failing local-store persistence tests**

Replace overlay-focused tests in `packages/api/src/repositories/project-state-persistence.test.ts` with v1 local-store tests:

```text
missing project-store file initializes from the supplied local project template
saved data includes books, chapters, scenes, assets, review state, export artifacts, and runStore
invalid JSON rejects with "Local project store is invalid"
wrong schemaVersion rejects with "Unsupported local project store schemaVersion"
wrong project.projectId rejects with "does not match selected project"
atomic rename failure leaves the previous project-store file unchanged
resetProjectStore rewrites the file from the supplied template and clears runStore back to template run state
```

Use deterministic test input:

```ts
const currentProject = {
  projectId: 'local-project-alpha',
  projectRoot: tempProjectRoot,
  projectTitle: 'Local Alpha',
}
```

- [ ] **Step 4: Implement the local project store in `project-state-persistence.ts`**

Export these constants and interfaces:

```ts
export const LOCAL_PROJECT_STORE_SCHEMA_VERSION = 1 as const
export const LOCAL_PROJECT_STORE_KIND = 'local-project-store-v1' as const
export const LOCAL_PROJECT_TEMPLATE_VERSION = 'signal-arc-demo-template-v1' as const
```

Export:

```ts
export interface LocalProjectStoreRecord {
  schemaVersion: typeof LOCAL_PROJECT_STORE_SCHEMA_VERSION
  storeKind: typeof LOCAL_PROJECT_STORE_KIND
  templateVersion: typeof LOCAL_PROJECT_TEMPLATE_VERSION
  project: {
    projectId: string
    projectTitle: string
    createdAt: string
    updatedAt: string
  }
  data: FixtureProjectData
  runStore?: PersistedRunStore
  artifactStore: {
    kind: 'inline-run-artifacts-v1'
    artifactDir: string
  }
}
```

Export a factory:

```ts
export function createLocalProjectStorePersistence(options: {
  filePath: string
  artifactDirPath: string
  currentProject: { projectId: string; projectTitle: string }
  createTemplate: () => { data: FixtureProjectData; runStore?: PersistedRunStore }
  fileSystem?: ProjectStateFileSystem
  now?: () => string
})
```

Returned methods:

```ts
load(): Promise<LocalProjectStoreRecord>
save(input: { data: FixtureProjectData; runStore?: PersistedRunStore }): Promise<void>
reset(): Promise<LocalProjectStoreRecord>
```

Implementation rules:

```text
missing file -> create template record, mkdir artifact dir, atomic write, return record
invalid JSON -> throw Error("Local project store is invalid: <filePath>")
wrong schemaVersion -> throw Error("Unsupported local project store schemaVersion")
wrong storeKind -> throw Error("Unsupported local project store kind")
wrong project.projectId -> throw Error("Local project store projectId <stored> does not match selected project <current>")
save -> deep-clone JSON-safe data, update project.updatedAt, atomic write
reset -> recreate template record with same projectId/projectTitle, write it, return it
```

- [ ] **Step 5: Export a reusable local project template**

In `packages/api/src/repositories/fixture-data.ts`, export:

```ts
export function createSignalArcProjectTemplate(input: {
  projectId: string
  projectTitle: string
  apiBaseUrl: string
  runtimeSummary?: string
  versionLabel?: string
}): FixtureProjectData
```

Rules:

```text
runtimeInfo.projectId = input.projectId
runtimeInfo.projectTitle = input.projectTitle
runtimeInfo.source = "api"
runtimeInfo.status = "healthy"
runtimeInfo.summary = input.runtimeSummary ?? "Connected to local project store v1."
runtimeInfo.versionLabel = input.versionLabel ?? "local-project-store-v1"
book/chapter/scene/asset object ids stay the existing Signal Arc ids
```

Keep `createFixtureDataSnapshot(apiBaseUrl)` behavior for fixture demo projects unchanged.

- [ ] **Step 6: Wire the local store into `createServer` and test helper**

In `packages/api/src/createServer.ts`:

```text
if config.currentProject exists:
  createLocalProjectStorePersistence({
    filePath: config.projectStoreFilePath,
    artifactDirPath: config.projectArtifactDirPath,
    currentProject: config.currentProject,
    createTemplate: () => create template data/run state for config.currentProject
  })
  pass it to createFixtureRepository as localProjectStore
else:
  pass no localProjectStore and keep fixture demo mode
```

In `packages/api/src/test/support/test-server.ts`, replace `projectStateFilePath` with:

```ts
projectStoreFilePath?: string
projectArtifactDirPath?: string
currentProject?: {
  projectId: string
  projectRoot: string
  projectTitle: string
}
```

Default test current project should remain absent unless a test opts in, so existing fixture tests stay fixture-only.

- [ ] **Step 7: Wire `fixtureRepository` to selected local project data**

Modify `createFixtureRepository` options to accept:

```ts
localProjectStore?: {
  load(): Promise<LocalProjectStoreRecord>
  save(input: { data: FixtureProjectData; runStore?: PersistedRunStore }): Promise<void>
  reset(): Promise<LocalProjectStoreRecord>
}
currentProject?: {
  projectId: string
  projectTitle: string
}
```

Repository startup rules:

```text
without localProjectStore -> current fixture snapshot behavior
with localProjectStore -> await store.load(), then set snapshot.projects[currentProject.projectId] = record.data
with localProjectStore and record.runStore -> runStore.hydrateProjectState(currentProject.projectId, record.runStore)
```

Persistence rules:

```text
persist after existing mutation points that already call persistProjectOverlay
save full FixtureProjectData for the selected project
save runStore.exportProjectState(projectId)
do not persist or mutate fixture demo projects when no localProjectStore exists
```

Reset rules:

```text
resetProject(projectId) with localProjectStore and matching current project -> store.reset(), reload data/runStore into memory
resetProject(projectId) without localProjectStore -> existing seed reset behavior
resetProject(other projectId) under localProjectStore -> throw PROJECT_NOT_FOUND through getProject
```

- [ ] **Step 8: Run Bundle 2 verification**

Run:

```bash
pnpm --filter @narrative-novel/api test -- config.test.ts project-state-persistence.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected: both commands pass.

- [ ] **Step 9: Review and commit Bundle 2**

After combined spec/code review passes:

```bash
git add packages/api/src/config.ts packages/api/src/config.test.ts packages/api/src/createServer.ts packages/api/src/test/support/test-server.ts packages/api/src/repositories/project-state-persistence.ts packages/api/src/repositories/project-state-persistence.test.ts packages/api/src/repositories/fixture-data.ts packages/api/src/repositories/fixtureRepository.ts
git commit -m "2026-04-28，PR54 API local project store foundation"
```

## Bundle 3: Restart Persistence For Project, Runs, Prose, And Read Surfaces

**Files:**
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Create: `packages/api/src/createServer.local-project-store.test.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/api/src/createServer.write-surfaces.test.ts`
- Modify: `packages/api/src/createServer.read-surfaces.test.ts`
- Modify: `packages/api/src/createServer.runtime-info.test.ts`

- [ ] **Step 1: Add run store tests for non-fixture project ids**

In `packages/api/src/repositories/runFixtureStore.test.ts`, add a test that:

```ts
const store = createRunFixtureStore()
const run = await store.startSceneRun('local-project-alpha', {
  sceneId: 'scene-midnight-platform',
  mode: 'rewrite',
  note: 'Persist local project run.',
})
const snapshot = store.exportProjectState('local-project-alpha')
const reloaded = createRunFixtureStore()
reloaded.hydrateProjectState('local-project-alpha', snapshot!)
expect(reloaded.getRun('local-project-alpha', run.id)).toMatchObject({
  id: run.id,
  status: 'waiting_review',
})
expect(reloaded.getRunEvents('local-project-alpha', { runId: run.id }).events.length).toBeGreaterThan(0)
expect(reloaded.listRunArtifacts('local-project-alpha', run.id)?.map((item) => item.kind)).toEqual(
  expect.arrayContaining(['context-packet', 'agent-invocation', 'proposal-set']),
)
```

- [ ] **Step 2: Keep run hydration strict but non-destructive**

If the test exposes gaps, update `hydrateProjectState` so it:

```text
validates every serialized run before clearing the existing project bucket
keeps current bucket unchanged when a serialized run is malformed
restores sceneSequences for the selected project id
rebuilds artifact detail indexes and trace maps through createRunState
completes terminal run streams after hydration
```

- [ ] **Step 3: Add the end-to-end local project store restart test**

Create `packages/api/src/createServer.local-project-store.test.ts`.

Test `bootstraps a non-fixture local project with book chapter scene read surfaces`:

```text
currentProject.projectId = "local-project-alpha"
GET /api/current-project -> { projectId: "local-project-alpha", projectTitle: "Local Alpha" }
GET /api/projects/local-project-alpha/runtime-info -> projectId "local-project-alpha", projectTitle "Local Alpha", versionLabel "local-project-store-v1"
GET /api/projects/local-project-alpha/books/book-signal-arc/structure -> 200, chapterIds include "chapter-signals-in-rain"
GET /api/projects/local-project-alpha/chapters/chapter-signals-in-rain/structure -> scenes include "scene-midnight-platform"
GET /api/projects/local-project-alpha/scenes/scene-midnight-platform/workspace -> id "scene-midnight-platform"
```

Test `persists accepted run prose across fresh server instances`:

```text
server A with temp project-store path
POST /api/projects/local-project-alpha/scenes/scene-midnight-platform/runs
POST /api/projects/local-project-alpha/runs/<runId>/review-decisions with decision "accept"
close server A
server B with the same project-store path and same currentProject
GET /api/projects/local-project-alpha/runs/<runId> -> status "completed"
GET /api/projects/local-project-alpha/runs/<runId>/events -> includes "run_completed"
GET /api/projects/local-project-alpha/scenes/scene-midnight-platform/prose -> proseDraft contains "Midnight Platform opens from the accepted run artifact"
GET /api/projects/local-project-alpha/chapters/chapter-signals-in-rain/structure -> first scene proseStatusLabel.en is "Generated" or "Updated"
GET /api/projects/local-project-alpha/books/book-signal-arc/draft-assembly -> scene-midnight-platform is kind "draft"
```

Test `reset route rewrites selected local project back to template`:

```text
mutate scene setup title to "Midnight Platform Local Edit"
POST /api/projects/local-project-alpha/runtime/reset
GET scene workspace -> title is "Midnight Platform"
fresh server with same store -> title remains "Midnight Platform"
```

Test `fixture mode does not write a local project store when currentProject is absent`:

```text
withTestServer({ projectStoreFilePath: tempFilePath, currentProject: undefined })
POST fixture run on /api/projects/book-signal-arc/scenes/scene-midnight-platform/runs
expect fs access to tempFilePath to reject with ENOENT
```

- [ ] **Step 4: Update existing API tests that assumed fixture-only runtime-info**

In `createServer.runtime-info.test.ts`, keep the existing fixture assertions and add a local-store-backed assertion:

```ts
expect(response.json()).toMatchObject({
  projectId: 'local-project-alpha',
  projectTitle: 'Local Alpha',
  source: 'api',
  status: 'healthy',
  summary: 'Connected to local project store v1.',
  versionLabel: 'local-project-store-v1',
})
```

- [ ] **Step 5: Keep write/read/run tests on existing object ids**

In `createServer.run-flow.test.ts`, `createServer.write-surfaces.test.ts`, and `createServer.read-surfaces.test.ts`, do not replace object ids with project ids.

Keep these ids unchanged:

```text
bookId = book-signal-arc
chapterId = chapter-signals-in-rain
sceneId = scene-midnight-platform
assetId = asset-ren-voss
```

Only add local-store-backed coverage where the route project id is `local-project-alpha`.

- [ ] **Step 6: Run Bundle 3 verification**

Run:

```bash
pnpm --filter @narrative-novel/api test -- runFixtureStore.test.ts createServer.local-project-store.test.ts createServer.runtime-info.test.ts createServer.read-surfaces.test.ts createServer.write-surfaces.test.ts createServer.run-flow.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected: both commands pass.

- [ ] **Step 7: Review and commit Bundle 3**

After combined spec/code review passes:

```bash
git add packages/api/src/repositories/runFixtureStore.ts packages/api/src/repositories/runFixtureStore.test.ts packages/api/src/repositories/fixtureRepository.ts packages/api/src/createServer.local-project-store.test.ts packages/api/src/createServer.run-flow.test.ts packages/api/src/createServer.write-surfaces.test.ts packages/api/src/createServer.read-surfaces.test.ts packages/api/src/createServer.runtime-info.test.ts
git commit -m "2026-04-28，PR54 persist local project runs and read surfaces"
```

## Bundle 4: Runtime Status Storybook, Docs, And Final Gates

**Files:**
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Add a visible local project store story**

In `ProjectRuntimeStatusBadge.stories.tsx`, add:

```ts
export const LocalProjectStoreHealthy: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'local-project-alpha',
      projectTitle: 'Local Alpha',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to local project store v1.',
      versionLabel: 'local-project-store-v1',
      capabilities: {
        contextPacketRefs: true,
        read: true,
        proposalSetRefs: true,
        reviewDecisions: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: false,
        write: true,
      },
    }),
  },
}
```

Also add this story entry to the `AllStates` render list with title `Local project store`.

- [ ] **Step 2: Add runtime-status test coverage for local project identity**

In `ProjectRuntimeStatusBadge.test.tsx`, add:

```ts
it('renders local project store identity without replacing object route ids', () => {
  renderBadge({
    info: createProjectRuntimeInfoRecord({
      projectId: 'local-project-alpha',
      projectTitle: 'Local Alpha',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to local project store v1.',
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
        reviewDecisions: true,
      },
    }),
  })

  const status = screen.getByRole('status', { name: 'Project runtime status' })
  expect(status).toHaveTextContent('Local Alpha')
  expect(status).toHaveTextContent('API')
  expect(status).toHaveTextContent('Healthy')
  expect(status).toHaveTextContent('Connected to local project store v1.')
})
```

- [ ] **Step 3: Document the PR54 API/store contract**

In `doc/api-contract.md`, add a `Local Project Store v1` section stating:

```text
Desktop-local selected projects are backed by <projectRoot>/narrative.project.json and <projectRoot>/.narrative/project-store.json.
The selected project id is runtime/session identity and appears in /api/current-project and /api/projects/{projectId}/runtime-info.
Book/chapter/scene/asset ids remain route object identity and are not replaced by projectId.
When no current desktop project is configured, the API remains fixture demo mode and must not write a local project store.
Missing project-store files initialize from signal-arc-demo-template-v1.
Malformed or schema-incompatible project-store files fail startup instead of silently falling back to fixture data.
PR54 does not add cloud sync, login, backup, migration UI, arbitrary object CRUD, or external artifact blob storage.
```

- [ ] **Step 4: Run focused renderer and docs verification**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- ProjectRuntimeStatusBadge.test.tsx
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer build-storybook
git diff --check -- packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx doc/api-contract.md
```

Expected: all commands pass.

- [ ] **Step 5: Run Storybook MCP structured snapshot verification**

Start Storybook:

```bash
pnpm --filter @narrative-novel/renderer storybook
```

Using Storybook MCP, inspect both structured snapshot and screenshot for:

```text
http://127.0.0.1:6006/?path=/story/app-project-runtime-status-badge--local-project-store-healthy
```

Required structured snapshot assertions:

```text
role="status" exists with accessible name "Project runtime status"
visible text includes "Local Alpha"
visible text includes "API"
visible text includes "Healthy"
visible text includes "Connected to local project store v1."
visible text does not include "book-signal-arc" as the project identity label
```

Required screenshot check:

```text
the badge renders inside the existing story container
the story does not introduce a dashboard/page shell
the status row remains compact and compatible with the existing Workbench header visual language
```

Stop the Storybook server after verification.

- [ ] **Step 6: Run full PR54 verification floor**

Run:

```bash
pnpm typecheck
pnpm test
pnpm verify:prototype
pnpm typecheck:desktop
pnpm test:desktop
```

Expected: all commands pass.

- [ ] **Step 7: Review and commit Bundle 4**

After combined spec/code review passes:

```bash
git add packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx doc/api-contract.md
git commit -m "2026-04-28，PR54 document and verify local project runtime identity"
```

## Final Acceptance Checklist

- [ ] A new empty desktop project directory gets a non-fixture `projectId` in `narrative.project.json`.
- [ ] The desktop local API process receives `NARRATIVE_PROJECT_STORE_FILE` and `NARRATIVE_PROJECT_ARTIFACT_DIR`.
- [ ] `GET /api/current-project` returns the selected local project id/title.
- [ ] `GET /api/projects/local-project-alpha/runtime-info` returns local-store runtime info.
- [ ] `GET /api/projects/local-project-alpha/books/book-signal-arc/structure` works.
- [ ] `GET /api/projects/local-project-alpha/chapters/chapter-signals-in-rain/structure` works.
- [ ] `GET /api/projects/local-project-alpha/scenes/scene-midnight-platform/workspace` works.
- [ ] Starting a scene run and accepting review writes to `.narrative/project-store.json`.
- [ ] Fresh API server instance with the same project store restores the completed run, events, scene prose, chapter status, and book draft assembly.
- [ ] Fixture/no-current-project mode does not write a local project store.
- [ ] Storybook has `LocalProjectStoreHealthy` runtime-status coverage and MCP structured snapshot plus screenshot verification.
- [ ] Full verification floor passes: `pnpm typecheck`, `pnpm test`, `pnpm verify:prototype`, `pnpm typecheck:desktop`, `pnpm test:desktop`.

## Self-Review Summary

- Spec coverage: This plan covers the required roadmap seams: API repository persistence, API routes, desktop project store/picker/recent/runtime supervisor wiring, renderer runtime-status visibility, Storybook proof, and exact verification commands. PR55+ lifecycle/backup/migration/model-binding work is explicitly excluded.
- Red-flag scan: The implementation steps use concrete file paths, expected records, commands, and pass criteria rather than deferred or unspecified work.
- Consistency: Project identity is consistently `local-project-alpha` in tests while route object ids remain `book-signal-arc`, `chapter-signals-in-rain`, and `scene-midnight-platform`. The local store env names are consistently `NARRATIVE_PROJECT_STORE_FILE` and `NARRATIVE_PROJECT_ARTIFACT_DIR`.

# PR69-PR72 Real First-Run Generation Rescue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the desktop app from a thick fixture demo into a real first-run generation path where a new user can choose demo vs real project, configure OpenAI bindings, test the connection, run a real scene, survive failures without silent fixture fallback, and continue after restart.

**Architecture:** Keep the Narrative IDE / Workbench shell intact. Add one desktop-owned model-settings control plane, one launcher screen outside the workbench for startup-only project selection, and one API-side strict generation gate that distinguishes explicit fixture mode from accidental fallback. Demo mode may still run fixture generation, but real-project + OpenAI mode must fail loudly instead of silently drifting back to fixture output.

**Tech Stack:** TypeScript, React, Electron main/preload, Fastify, OpenAI Responses API, Vitest, Storybook, pnpm

---

## Coordinator Handoff

- This implementation must follow the user-facing rule from `doc/pr_69_api_settings_and_real_generation_rescue_plan.md`:

```text
This PR must make the app closer to real first-run generation, not a better fixture demo.
```

- Execute on a single new branch, for example `codex/pr69-real-first-run-generation-rescue`.
- Do not create a worktree. Repo policy here is serial branch work unless the user explicitly asks for parallel git worktrees.
- Use fresh implementation workers with `gpt-5.4` medium reasoning.
- Keep the main thread in coordinator/reviewer mode. Do not take over implementation while a worker is still running.
- Because this plan has 4 bundles, each implementation worker must own one full bundle with at least 2 concrete tasks before review starts.
- After each bundle finishes, run one combined spec + code review on the same bundle, fix findings on the same branch, re-review, then commit once.
- Do not collapse all 4 bundles into a single “mega commit”.

## Scope Guard

- This plan executes the full rescue line described in `doc/pr_69_api_settings_and_real_generation_rescue_plan.md`, not only the PR69 subsection.
- Preserve the frontend constitution in `doc/frontend-workbench-constitution.md`.
- Settings must stay a shell-level modal or shell-owned opened context. Do not create a standalone dashboard page for settings.
- The startup launcher is the only allowed pre-workbench full-screen surface in this plan.
- Do not push layout state, settings modal state, or launcher state into the workbench route query.
- Do not introduce chat-first onboarding, dashboard chrome, or a second shell outside `WorkbenchShell`.
- Do not store raw API keys in git-tracked files, project state JSON, route params, renderer localStorage, or API artifacts.
- Do not remove explicit fixture mode. The product must still support:

```text
Fixture Demo
Real Project + Fixture Model
Real Project + Real Model
```

- Do not keep silent fallback from OpenAI bindings to fixture output in `real-project + openai` mode.
- Keep renderer Storybook coverage in sync for every affected shell/global surface.
- Use MCP structured snapshots during frontend verification; do not rely on screenshots alone.

## Current Baseline From Code Inspection

- Desktop already has secure-ish local credential storage in `apps/desktop/src/main/credential-store.ts`.
- Desktop already persists per-project non-secret model bindings in `apps/desktop/src/main/model-binding-store.ts`.
- Electron preload already exposes `getProviderCredentialStatus`, `saveProviderCredential`, `deleteProviderCredential`, `getModelBindings`, and `updateModelBinding`.
- `LocalApiSupervisor` already injects role-specific OpenAI env vars into the API child process from desktop credentials + model bindings.
- API config already supports per-role model bindings through `packages/api/src/config.ts` and `packages/api/src/orchestration/modelGateway/model-binding.ts`.
- Planner and prose writer gateways already support real OpenAI calls, but they still fall back to fixture output on missing config, provider errors, and invalid output.
- Desktop startup still auto-selects `resolveWorkspaceRoot()` when no recent project exists, so the app never shows a true first-run choice surface.
- Renderer currently boots straight into the workbench from `packages/renderer/src/main.tsx -> AppProviders -> App`.
- `WorkbenchShell` already owns layout and runtime status chrome, so settings entry and runtime-mode labeling belong there rather than inside scope-specific business panes.

## Shared Design Decisions

### 1. Keep ownership split by responsibility

- Desktop main owns:
  - project selection mode
  - credential persistence
  - binding persistence
  - connection-test persistence metadata
  - API child-process restarts
- API owns:
  - real provider connectivity test semantics
  - run preflight and failure semantics
  - explicit fixture vs OpenAI generation behavior
- Renderer owns:
  - launcher UI
  - settings modal UI
  - runtime/mode badge presentation
  - run CTA gating and error affordances

### 2. Add an explicit desktop project mode seam

The selected desktop project session should gain a mode field:

```ts
type DesktopProjectMode = 'demo-fixture' | 'real-project'
```

This must flow through:

- desktop current-project snapshot
- desktop runtime config
- local API env
- API current-project config
- renderer runtime-kind derivation

### 3. Distinguish explicit fixture usage from silent fallback

- `demo-fixture` mode may always use fixture generation.
- `real-project` mode may use fixture generation only when the role binding explicitly says `provider: 'fixture'`.
- `real-project + openai binding` must never silently fall back to fixture on:
  - missing key
  - missing model id
  - provider error
  - invalid structured output

### 4. Add a dedicated demo-project session instead of hijacking the repo root

- Create a desktop-local demo project under Electron `userData`.
- Give it a stable project id and title, for example:

```ts
{
  projectId: 'book-signal-arc',
  projectMode: 'demo-fixture',
  projectTitle: 'Signal Arc Demo',
}
```

- Do not treat the repo workspace root as the demo project anymore.

### 5. Keep settings shell-owned and globally reachable

- Settings entry should be rendered from shell-level chrome, not duplicated in every scope container.
- Use a renderer-side optional settings controller/context so `WorkbenchShell` and run-gate CTAs can open the same modal without prop drilling.

## File Map

### Desktop main / preload

- Create: `apps/desktop/src/main/demo-project.ts`
  Purpose: create/open the stable desktop demo project session under Electron userData.
- Create: `apps/desktop/src/main/demo-project.test.ts`
  Purpose: lock demo project root, stable id/title, and demo mode metadata.
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
  Purpose: add project-mode, launcher actions, model-settings snapshot, and connection-test bridge contracts.
- Modify: `apps/desktop/src/preload/desktop-api.ts`
  Purpose: expose the new bridge methods to renderer.
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
  Purpose: lock exact channel wiring and payload shape.
- Modify: `apps/desktop/src/main/model-binding-store.ts`
  Purpose: persist/clear last connection-test metadata next to non-secret bindings.
- Modify: `apps/desktop/src/main/model-binding-store.test.ts`
  Purpose: cover binding persistence, test-status persistence, and reset-on-update behavior.
- Modify: `apps/desktop/src/main/project-picker.ts`
  Purpose: keep real-project session normalization separate from demo-project construction.
- Modify: `apps/desktop/src/main/project-store.ts`
  Purpose: add explicit `openDemoProject`, stop auto-fallback-to-workspace-root behavior, and preserve project-mode on current session.
- Modify: `apps/desktop/src/main/project-store.test.ts`
  Purpose: lock launcher actions and no-auto-selection behavior.
- Modify: `apps/desktop/src/main/recent-projects.ts`
  Purpose: persist real-project recents without corrupting demo mode semantics.
- Modify: `apps/desktop/src/main/recent-projects.test.ts`
  Purpose: cover any schema changes around stored recents.
- Modify: `apps/desktop/src/main/runtime-config.ts`
  Purpose: pass `projectMode` into desktop runtime config and local API child env.
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
  Purpose: pass new project mode and connection-test requests through the local API lifecycle.
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
  Purpose: prove the spawned env contains project mode and role binding env as expected.
- Modify: `apps/desktop/src/main/app-menu.ts`
  Purpose: add `Open Demo Project...` and keep file/runtime menus aligned with launcher semantics.
- Modify: `apps/desktop/src/main/main.ts`
  Purpose: register launcher bridge handlers, remove workspace-root auto-selection, proxy model-connection tests through the local API, and restart the API after settings changes.
- Modify: `apps/desktop/src/main/main.test.ts`
  Purpose: lock startup-without-project, bridge registration, demo action, and connection-test restart flow.

### API

- Modify: `packages/api/src/config.ts`
  Purpose: read `NARRATIVE_PROJECT_MODE` and expose it on current-project config.
- Modify: `packages/api/src/config.test.ts`
  Purpose: cover project-mode parsing plus current role-binding env behavior.
- Create: `packages/api/src/orchestration/modelGateway/modelConnectionTest.ts`
  Purpose: run a tiny structured-output connectivity test against configured OpenAI models without reusing scene-run prompts.
- Create: `packages/api/src/orchestration/modelGateway/modelConnectionTest.test.ts`
  Purpose: prove success, invalid key, model not found, network error, and malformed output classification.
- Create: `packages/api/src/routes/model-settings.ts`
  Purpose: expose a narrow local API endpoint for connection tests only.
- Modify: `packages/api/src/routes/project-runtime.ts`
  Purpose: return current-project mode alongside the current-project identity response if needed by renderer/API clients.
- Modify: `packages/api/src/createServer.ts`
  Purpose: register the model-settings route and inject the current project mode into repository/gateway seams.
- Modify: `packages/api/src/createServer.current-project.test.ts`
  Purpose: lock current-project response shape for null, demo-fixture, and real-project modes.
- Modify: `packages/api/src/createServer.runtime-info.test.ts`
  Purpose: preserve runtime-info contract while keeping demo-fixture vs real-project labels correct.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
  Purpose: keep explicit fixture mode working but remove silent fallback in real-project OpenAI mode.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts`
  Purpose: assert explicit fixture is allowed, but real-project OpenAI missing-config/provider-error/invalid-output do not degrade to fake success.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
  Purpose: apply the same strict-real-mode rule to prose writer and revision roles.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts`
  Purpose: lock explicit fixture vs strict OpenAI failure behavior.
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
  Purpose: thread current project mode into runtime identity and scene-run entry points.
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
  Purpose: block run start on missing real-model config, surface run failures on provider/model errors, and keep explicit fixture mode intact.
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
  Purpose: prove run start blocking, failed-run persistence, retryability, and persistence across restart.
- Modify: `packages/api/src/createServer.run-flow.test.ts`
  Purpose: cover `real-project + fixture`, `real-project + openai success`, and `real-project + openai failure` happy/sad paths.

### Renderer

- Modify: `packages/renderer/src/main.tsx`
  Purpose: render a desktop bootstrap root instead of always mounting the workbench directly.
- Modify: `packages/renderer/src/app/runtime/runtime-config.ts`
  Purpose: add `projectMode` to desktop runtime config and derive runtime kind from it.
- Modify: `packages/renderer/src/app/runtime/runtime-config.test.ts`
  Purpose: lock runtime-config validation and runtime-kind derivation.
- Create: `packages/renderer/src/app/desktop/DesktopAppRoot.tsx`
  Purpose: show launcher before workbench when desktop has no selected project, otherwise mount the normal app providers and workbench.
- Create: `packages/renderer/src/app/desktop/DesktopAppRoot.test.tsx`
  Purpose: prove launcher/workbench branching, demo/open/create flows, and no broken blank screen when no project is selected.
- Create: `packages/renderer/src/features/launcher/components/ProjectLauncherScreen.tsx`
  Purpose: startup-only launcher with `Open Demo Project`, `Create Real Project`, and `Open Existing Project`.
- Create: `packages/renderer/src/features/launcher/components/ProjectLauncherScreen.test.tsx`
  Purpose: lock CTA copy, action wiring, and loading/error states.
- Create: `packages/renderer/src/features/launcher/components/ProjectLauncherScreen.stories.tsx`
  Purpose: Storybook coverage for desktop first-run launcher states.
- Create: `packages/renderer/src/features/settings/ModelSettingsProvider.tsx`
  Purpose: optional shell-level settings controller/context for opening the same modal from shell chrome and run-block states.
- Create: `packages/renderer/src/features/settings/ModelSettingsProvider.test.tsx`
  Purpose: cover optional-provider behavior and open/close state.
- Create: `packages/renderer/src/features/settings/ModelSettingsDialog.tsx`
  Purpose: shell-owned modal with provider selection, API-key status, per-role model fields, and test-connection CTA.
- Create: `packages/renderer/src/features/settings/ModelSettingsDialog.test.tsx`
  Purpose: prove desktop bridge calls, validation, dev-mode messaging, and test-connection result states.
- Create: `packages/renderer/src/features/settings/ModelSettingsDialog.stories.tsx`
  Purpose: Storybook coverage for missing-key, configured, test-failed, and fixture-only settings states.
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`
  Purpose: add the shell-level settings entry without moving layout ownership out of the shell.
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx`
  Purpose: keep shell stories aligned with the new global shell action.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
  Purpose: render project mode plus model configuration badges such as `Demo Fixture Project`, `Model OpenAI`, `Key Missing`, or `Test Failed`.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
  Purpose: lock new badge combinations and real-project degraded behavior.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
  Purpose: Storybook coverage for demo, real-project fixture, configured OpenAI, and failed connection states.
- Modify: `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
  Purpose: replace silent run starts with explicit block/repair CTA when real-model config is missing and surface retryable failures without fake success.
- Modify: `packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx`
  Purpose: cover run-block CTA, failure copy, retry affordance, and unchanged explicit fixture path.
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx`
  Purpose: bind scene execution UI to the settings controller and the stricter run-error state.
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx`
  Purpose: lock orchestration surface behavior around missing config and failed runs.
- Modify: `packages/renderer/src/App.test.tsx`
  Purpose: preserve shell/runtime behavior while adding end-to-end renderer coverage for desktop-local status and blocked run states.
- Modify: `packages/renderer/src/app/i18n/index.tsx`
  Purpose: add all new launcher, settings, badge, and strict-real-mode copy in both English and zh-CN.

### Docs / acceptance artifacts

- Modify: `README.md`
  Purpose: replace “release candidate” drift with explicit fixture-demo path, real-model dogfood path, and known limitations.
- Modify: `doc/usable-prototype-demo-script.md`
  Purpose: rewrite the script around a real user flow instead of a developer fixture demo.
- Create: `doc/review/2026-04-28-real-first-run-generation-dogfood-report.md`
  Purpose: capture the final P0 acceptance evidence, known gaps, and exact verification commands.

## Bundle 1: PR69 Model Settings And Runtime Badge

**Files:**
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
- Modify: `apps/desktop/src/preload/desktop-api.ts`
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
- Modify: `apps/desktop/src/main/model-binding-store.ts`
- Modify: `apps/desktop/src/main/model-binding-store.test.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
- Modify: `apps/desktop/src/main/main.ts`
- Modify: `apps/desktop/src/main/main.test.ts`
- Modify: `packages/api/src/config.ts`
- Modify: `packages/api/src/config.test.ts`
- Create: `packages/api/src/orchestration/modelGateway/modelConnectionTest.ts`
- Create: `packages/api/src/orchestration/modelGateway/modelConnectionTest.test.ts`
- Create: `packages/api/src/routes/model-settings.ts`
- Modify: `packages/api/src/createServer.ts`
- Create: `packages/renderer/src/features/settings/ModelSettingsProvider.tsx`
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
- Modify: `packages/renderer/src/app/i18n/index.tsx`
- Create: `packages/renderer/src/features/settings/ModelSettingsDialog.tsx`
- Create: `packages/renderer/src/features/settings/ModelSettingsDialog.test.tsx`
- Create: `packages/renderer/src/features/settings/ModelSettingsDialog.stories.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx`

### Task 1.1: Lock the desktop-to-API model-settings contract with tests

- [ ] **Step 1: Add failing desktop tests for the new shell-level model-settings snapshot and connection-test bridge**

Lock these bridge additions in `desktop-bridge-types.ts`, preload tests, and `main.test.ts`:

```ts
type DesktopProjectMode = 'demo-fixture' | 'real-project'

interface DesktopModelConnectionTestRecord {
  status: 'never' | 'passed' | 'failed'
  checkedAtLabel?: string
  summary?: string
  errorCode?: 'missing_key' | 'invalid_key' | 'model_not_found' | 'network_error' | 'invalid_output'
}

interface DesktopModelSettingsSnapshot {
  bindings: DesktopModelBindings
  credentialStatus: ProviderCredentialStatus
  connectionTest: DesktopModelConnectionTestRecord
}
```

And require new bridge methods equivalent to:

```ts
getModelSettingsSnapshot(): Promise<DesktopModelSettingsSnapshot>
testModelSettings(): Promise<DesktopModelConnectionTestRecord>
```

- [ ] **Step 2: Add failing API tests for a narrow model-settings connection-test route**

Create or extend API tests so `POST /api/model-settings/test-connection` covers:

```ts
expect(successResponse).toMatchObject({
  status: 'passed',
  summary: expect.stringContaining('Planner model responded'),
})

expect(failureResponse).toMatchObject({
  status: 'failed',
  errorCode: 'invalid_key',
})
```

Also assert the route does not leak raw secrets:

```ts
expect(JSON.stringify(responseBody)).not.toContain('sk-')
```

- [ ] **Step 3: Add failing renderer tests for the shell settings entry and badge labels**

Lock:

```ts
expect(screen.getByRole('button', { name: 'Open model settings' })).toBeInTheDocument()
expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Model OpenAI')
expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Key Missing')
```

Add the failed-test state too:

```ts
expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Test Failed')
```

- [ ] **Step 4: Run the focused tests to confirm the contract is not already implemented**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- preload/desktop-api.test.ts main.test.ts model-binding-store.test.ts local-api-supervisor.test.ts
pnpm --filter @narrative-novel/api exec vitest run src/config.test.ts src/createServer.runtime-info.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx
```

Expected before implementation: failures around unknown bridge channels, missing connection-test route, or missing status-badge labels.

### Task 1.2: Implement the desktop-owned settings control plane

- [ ] **Step 1: Extend the desktop stores so model bindings and the last connection-test result live together without storing secrets in renderer state**

Keep the persisted record shape narrow:

```ts
interface PersistedModelBindingStoreRecord {
  bindings: Partial<Record<DesktopModelBindingRole, DesktopModelBinding>>
  connectionTest?: DesktopModelConnectionTestRecord
}
```

Reset the connection test whenever bindings or credentials change:

```ts
const resetConnectionTest: DesktopModelConnectionTestRecord = { status: 'never' }
```

- [ ] **Step 2: Implement main-process bridge handlers that proxy connection tests through the running local API**

The `testModelSettings` handler should:

```ts
const snapshot = await supervisor.restart()
if (!snapshot.runtimeConfig) {
  return {
    status: 'failed',
    errorCode: 'network_error',
    summary: snapshot.lastError ?? 'Local API runtime is unavailable.',
  }
}

const response = await fetch(`${snapshot.runtimeConfig.apiBaseUrl}/model-settings/test-connection`, {
  method: 'POST',
})
```

Then persist the sanitized result back into the desktop store and return it to renderer.

- [ ] **Step 3: Implement a generic API-side OpenAI connection tester instead of reusing scene-run prompts**

The route implementation should exercise a tiny strict structured output call like:

```ts
{
  model: binding.modelId,
  instructions: 'Return only the requested healthcheck payload.',
  input: 'Confirm the configured model can answer a tiny structured test.',
  text: {
    format: {
      type: 'json_schema',
      name: 'model_connection_test',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean' },
          modelEcho: { type: 'string' },
        },
        required: ['ok', 'modelEcho'],
      },
    },
  },
}
```

Only test roles whose bindings are `provider: 'openai'`. If all bindings are `fixture`, return:

```ts
{
  status: 'passed',
  summary: 'All configured roles stay on explicit fixture models.',
}
```

- [ ] **Step 4: Keep route scope narrow**

The route must not write project data, start runs, or mutate review/prose state. It only returns sanitized connectivity status for the current desktop-local configuration.

### Task 1.3: Implement the shell modal and badge states with Storybook coverage

- [ ] **Step 1: Add a shell-owned settings controller and modal**

The settings controller should be optional so existing non-desktop tests do not crash:

```ts
const ModelSettingsContext = createContext<ModelSettingsController | null>(null)
```

`WorkbenchShell` should render the gear button only when the controller exists:

```tsx
{modelSettings ? (
  <button type="button" onClick={modelSettings.open} aria-label={dictionary.shell.openModelSettings}>
    {dictionary.shell.modelSettings}
  </button>
) : null}
```

- [ ] **Step 2: Implement the modal fields around existing desktop bindings instead of inventing a second config source**

The renderer fields should map 1:1 to:

```text
Provider: fixture | openai
OpenAI API Key status
Planner model
Scene prose writer model
Scene revision model
Continuity reviewer model
Summary model
```

The desktop bridge remains the source of truth for the key status and bindings.

- [ ] **Step 3: Upgrade the runtime badge to show project mode + model mode + connection status**

Render combinations such as:

```text
Demo Fixture Project
Real Project
Model Fixture
Model OpenAI
Key Missing
Key Configured
Test Failed
```

Keep the existing runtime health badge behavior and retry button intact.

- [ ] **Step 4: Add Storybook states for the new shell/global surfaces**

At minimum add:

```text
ModelSettingsDialog / Fixture Only
ModelSettingsDialog / OpenAI Missing Key
ModelSettingsDialog / Test Failed
ProjectRuntimeStatusBadge / Demo Fixture Project
ProjectRuntimeStatusBadge / Real Project + Fixture Model
ProjectRuntimeStatusBadge / Real Project + OpenAI + Test Failed
```

- [ ] **Step 5: Run bundle-local verification**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- preload/desktop-api.test.ts main.test.ts model-binding-store.test.ts local-api-supervisor.test.ts
pnpm --filter @narrative-novel/api exec vitest run src/config.test.ts src/orchestration/modelGateway/modelConnectionTest.test.ts src/createServer.runtime-info.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/features/settings/ModelSettingsDialog.test.tsx src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected after implementation: all commands pass and the new stories are present in the built Storybook index.

## Bundle 2: PR70 Launcher And Explicit Demo vs Real Project Mode

**Files:**
- Create: `apps/desktop/src/main/demo-project.ts`
- Create: `apps/desktop/src/main/demo-project.test.ts`
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
- Modify: `apps/desktop/src/preload/desktop-api.ts`
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
- Modify: `apps/desktop/src/main/project-picker.ts`
- Modify: `apps/desktop/src/main/project-store.ts`
- Modify: `apps/desktop/src/main/project-store.test.ts`
- Modify: `apps/desktop/src/main/recent-projects.ts`
- Modify: `apps/desktop/src/main/recent-projects.test.ts`
- Modify: `apps/desktop/src/main/runtime-config.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
- Modify: `apps/desktop/src/main/app-menu.ts`
- Modify: `apps/desktop/src/main/main.ts`
- Modify: `apps/desktop/src/main/main.test.ts`
- Modify: `packages/api/src/config.ts`
- Modify: `packages/api/src/config.test.ts`
- Modify: `packages/api/src/routes/project-runtime.ts`
- Modify: `packages/api/src/createServer.current-project.test.ts`
- Modify: `packages/renderer/src/main.tsx`
- Modify: `packages/renderer/src/app/runtime/runtime-config.ts`
- Modify: `packages/renderer/src/app/runtime/runtime-config.test.ts`
- Create: `packages/renderer/src/app/desktop/DesktopAppRoot.tsx`
- Create: `packages/renderer/src/app/desktop/DesktopAppRoot.test.tsx`
- Create: `packages/renderer/src/features/launcher/components/ProjectLauncherScreen.tsx`
- Create: `packages/renderer/src/features/launcher/components/ProjectLauncherScreen.test.tsx`
- Create: `packages/renderer/src/features/launcher/components/ProjectLauncherScreen.stories.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
- Modify: `packages/renderer/src/app/i18n/index.tsx`

### Task 2.1: Lock the startup/launcher contract with tests

- [ ] **Step 1: Add failing desktop tests proving the app can start with no selected project**

Lock startup semantics like:

```ts
expect(projectStore.restoreLastProject).toHaveBeenCalledTimes(1)
expect(projectStore.selectProjectRoot).not.toHaveBeenCalled()
expect(localApiSupervisor.start).not.toHaveBeenCalled()
expect(createMainWindow).toHaveBeenCalledTimes(1)
```

Also add the new menu action:

```ts
expect(buildApplicationMenuTemplate(...)).toContainEqual(
  expect.objectContaining({ label: 'Open Demo Project...' }),
)
```

- [ ] **Step 2: Add failing renderer tests for launcher branching**

`DesktopAppRoot` should initially render:

```ts
expect(screen.getByRole('heading', { name: 'Choose how to start' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Open Demo Project' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Create Real Project' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Open Existing Project' })).toBeInTheDocument()
```

And once a desktop project snapshot exists, it should mount the normal workbench path instead.

- [ ] **Step 3: Add failing runtime-config tests for project mode**

Lock the desktop runtime config shape:

```ts
{
  runtimeMode: 'desktop-local',
  projectId: 'book-signal-arc',
  projectTitle: 'Signal Arc Demo',
  projectMode: 'demo-fixture',
}
```

And make sure runtime-kind derivation changes accordingly:

```ts
expect(getRuntimeKindFromRuntimeConfig(demoRuntimeConfig)).toBe('fixture-demo')
expect(getRuntimeKindFromRuntimeConfig(realRuntimeConfig)).toBe('real-local-project')
```

- [ ] **Step 4: Run the focused failing tests**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- main.test.ts project-store.test.ts recent-projects.test.ts local-api-supervisor.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts src/app/desktop/DesktopAppRoot.test.tsx src/features/launcher/components/ProjectLauncherScreen.test.tsx
```

Expected before implementation: failures because startup still auto-selects the workspace root and renderer has no launcher root.

### Task 2.2: Implement an explicit desktop demo project and stop auto-entering the workbench

- [ ] **Step 1: Add a dedicated desktop demo-project helper**

The demo helper should create/read a stable directory under userData, for example:

```ts
const demoRoot = path.join(app.getPath('userData'), 'demo-project')
```

It should normalize a stable session like:

```ts
{
  projectId: 'book-signal-arc',
  projectRoot: demoRoot,
  projectTitle: 'Signal Arc Demo',
  projectMode: 'demo-fixture',
}
```

- [ ] **Step 2: Teach `ProjectStore` about explicit demo vs real project actions**

Add:

```ts
openDemoProject(): Promise<SelectedProjectSession>
```

Keep real-project actions on the current dialog-backed picker path. Do not reuse demo mode for create/open.

- [ ] **Step 3: Remove the implicit workspace-root fallback from `main.ts`**

Startup should become:

```ts
await activeProjectStore.restoreLastProject()
refreshApplicationMenu()
await createMainWindow()
```

Only start/restart the local API after a project is explicitly selected or restored:

```ts
if (activeProjectStore.getCurrentProject()) {
  await localApiSupervisor.start()
}
```

### Task 2.3: Implement the renderer launcher without violating the workbench constitution

- [ ] **Step 1: Keep the launcher outside the workbench**

`DesktopAppRoot` should branch before `AppProviders` mounts the workbench:

```tsx
return currentProject
  ? <AppProviders><App /></AppProviders>
  : <ProjectLauncherScreen ... />
```

Do not mount `WorkbenchShell` with empty panes just to fake a launcher.

- [ ] **Step 2: Keep the launcher copy mode-explicit**

The launcher must communicate the three entry paths clearly:

```text
Open Demo Project
Create Real Project
Open Existing Project
```

And explain their meaning:

```text
Demo uses fixture generation.
Real projects can run with fixture or real models.
```

- [ ] **Step 3: Thread `projectMode` through runtime config and runtime labels**

Desktop runtime config validation should accept:

```ts
projectMode: 'demo-fixture' | 'real-project'
```

And the runtime badge should reflect:

```text
Demo Fixture Project
Real Project
```

- [ ] **Step 4: Add Storybook states for the launcher**

At minimum:

```text
ProjectLauncherScreen / Idle
ProjectLauncherScreen / Loading Demo
ProjectLauncherScreen / Action Failed
```

- [ ] **Step 5: Run bundle-local verification**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- main.test.ts demo-project.test.ts project-store.test.ts recent-projects.test.ts local-api-supervisor.test.ts
pnpm --filter @narrative-novel/api exec vitest run src/config.test.ts src/createServer.current-project.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts src/app/desktop/DesktopAppRoot.test.tsx src/features/launcher/components/ProjectLauncherScreen.test.tsx src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx
pnpm --filter @narrative-novel/renderer build-storybook
```

## Bundle 3: PR71 Strict Real Generation Happy Path

**Files:**
- Modify: `packages/api/src/config.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
- Modify: `packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
- Modify: `packages/renderer/src/app/i18n/index.tsx`
- Modify: `packages/renderer/src/App.test.tsx`

### Task 3.1: Lock the run-gating and no-silent-fallback contract with tests

- [ ] **Step 1: Add failing API tests for explicit fixture vs strict OpenAI behavior**

Cover these cases:

```text
demo-fixture + fixture bindings -> run succeeds with fixture provenance
real-project + fixture bindings -> run succeeds with fixture provenance
real-project + openai binding + missing key -> start blocked with explicit error
real-project + openai binding + provider error -> run failed, retryable
real-project + openai binding + invalid output -> run failed, not silently fixture
real-project + openai binding + success -> proposal/prose provenance = openai
```

Assert failed runs look like:

```ts
expect(run).toMatchObject({
  status: 'failed',
  failureClass: 'provider_error',
  runtimeSummary: {
    health: 'failed',
  },
  usage: {
    provider: 'openai',
  },
})
```

- [ ] **Step 2: Add failing renderer tests for blocked run CTA and retry affordance**

Lock the scene execution UX:

```ts
expect(screen.getByRole('button', { name: 'Run Scene' })).toBeDisabled()
expect(screen.getByRole('button', { name: 'Configure models' })).toBeInTheDocument()
expect(screen.getByText('Real-model generation is blocked until the planner binding has a usable OpenAI key.')).toBeInTheDocument()
```

And for failure:

```ts
expect(screen.getByText('provider_error')).toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Retry Run' })).toBeEnabled()
```

- [ ] **Step 3: Run the focused failing tests**

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run src/orchestration/modelGateway/scenePlannerGateway.test.ts src/orchestration/modelGateway/sceneProseWriterGateway.test.ts src/repositories/runFixtureStore.test.ts src/createServer.run-flow.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/features/scene/components/SceneExecutionTab.test.tsx src/features/scene/containers/SceneExecutionContainer.test.tsx src/App.test.tsx
```

### Task 3.2: Implement strict real-project OpenAI semantics without breaking explicit fixture mode

- [ ] **Step 1: Teach the gateways the difference between explicit fixture and forbidden fallback**

The gateway contract should become conceptually:

```ts
if (binding.provider === 'fixture') {
  return renderFixtureResult(request)
}

if (!binding.modelId || !binding.apiKey) {
  if (projectMode === 'real-project') {
    throw new MissingRealModelConfigError(...)
  }
  return renderFixtureResult(request, 'missing-config')
}
```

Likewise for provider errors and invalid output:

```ts
if (projectMode === 'real-project') {
  throw new RealGenerationFailureError(...)
}
return renderFixtureResult(request, 'provider-error')
```

- [ ] **Step 2: Keep run-store behavior product-visible**

`RunFixtureStore.startSceneRun(...)` should translate strict errors into:

```ts
{
  status: 'failed',
  failureClass: 'provider_error' | 'invalid_output',
  summary: 'Scene run failed before review because the configured OpenAI model could not complete.',
}
```

Do not synthesize a fake waiting-review run when the real-model call failed.

- [ ] **Step 3: Preserve provenance and retryability**

When the real model succeeds:

```ts
usage.provider = 'openai'
usage.modelId = binding.modelId
```

When it fails after an OpenAI attempt:

```ts
usage.provider = 'openai'
```

The failure should remain inspectable and retryable where appropriate.

### Task 3.3: Surface run gating and real-provider provenance in the main stage

- [ ] **Step 1: Drive the blocked-run CTA from real-project + openai-misconfigured state**

The run support panel should keep one primary CTA, but when blocked it becomes a repair action instead of a fake run start:

```tsx
<button type="button" onClick={modelSettings.open}>
  {dictionary.scene.configureModels}
</button>
```

Keep explicit fixture mode runnable.

- [ ] **Step 2: Show provider provenance clearly**

Update the execution surface and badge/support text so the user can tell whether the current session is:

```text
Real Project + Fixture Model
Real Project + OpenAI
Demo Fixture Project
```

And ensure failed OpenAI attempts never show the happy fixture summary strings.

- [ ] **Step 3: Run bundle-local verification**

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run src/orchestration/modelGateway/scenePlannerGateway.test.ts src/orchestration/modelGateway/sceneProseWriterGateway.test.ts src/repositories/runFixtureStore.test.ts src/createServer.run-flow.test.ts
pnpm --filter @narrative-novel/renderer exec vitest run src/features/scene/components/SceneExecutionTab.test.tsx src/features/scene/containers/SceneExecutionContainer.test.tsx src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx src/App.test.tsx
```

## Bundle 4: PR72 Dogfood Lock, README, And Acceptance Evidence

**Files:**
- Modify: `README.md`
- Modify: `doc/usable-prototype-demo-script.md`
- Create: `doc/review/2026-04-28-real-first-run-generation-dogfood-report.md`
- Modify: `packages/renderer/src/features/launcher/components/ProjectLauncherScreen.stories.tsx`
- Modify: `packages/renderer/src/features/settings/ModelSettingsDialog.stories.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`

### Task 4.1: Rewrite user-facing docs around real dogfood instead of fixture drift

- [ ] **Step 1: Update `README.md` with explicit path separation**

The README must clearly separate:

```text
Fixture demo path
Real model dogfood path
Known limitations
```

And remove any wording that implies the app is already a release candidate without the new flow.

- [ ] **Step 2: Rewrite `doc/usable-prototype-demo-script.md` around the real user flow**

The script must follow:

```text
launch desktop
choose create/open/demo
configure model settings
test connection
enter scene workbench
run scene
review
generate prose
open chapter/book draft
restart
continue
```

### Task 4.2: Produce an in-repo acceptance artifact with exact evidence

- [ ] **Step 1: Run the final verification matrix**

Required commands:

```bash
pnpm typecheck
pnpm test
pnpm typecheck:desktop
pnpm test:desktop
pnpm --filter @narrative-novel/renderer build-storybook
```

If `pnpm dev:desktop` is available in the environment, also run it for the final dogfood pass. If Electron install/runtime remains broken, say so explicitly in the report and fall back to the strongest verified evidence available.

- [ ] **Step 2: Verify the affected frontend surfaces through Storybook + MCP**

Required Storybook targets:

```text
ProjectLauncherScreen
ModelSettingsDialog
ProjectRuntimeStatusBadge
one run-gated scene execution state
```

Use structured DOM snapshots plus screenshots through MCP/in-app browser. Do not rely on screenshots alone.

- [ ] **Step 3: Write `doc/review/2026-04-28-real-first-run-generation-dogfood-report.md`**

The report must include:

```text
branch
commit SHAs per bundle
verification command results
storybook/mcp evidence
desktop dogfood verdict
P0 blocker checklist
remaining known limitations
```

## Verification Matrix

### Bundle-local test commands

- Desktop:

```bash
pnpm --filter @narrative-novel/desktop test -- main.test.ts project-store.test.ts recent-projects.test.ts preload/desktop-api.test.ts local-api-supervisor.test.ts model-binding-store.test.ts demo-project.test.ts
```

- API:

```bash
pnpm --filter @narrative-novel/api exec vitest run src/config.test.ts src/createServer.current-project.test.ts src/createServer.runtime-info.test.ts src/createServer.run-flow.test.ts src/orchestration/modelGateway/modelConnectionTest.test.ts src/orchestration/modelGateway/scenePlannerGateway.test.ts src/orchestration/modelGateway/sceneProseWriterGateway.test.ts src/repositories/runFixtureStore.test.ts
```

- Renderer:

```bash
pnpm --filter @narrative-novel/renderer exec vitest run src/app/runtime/runtime-config.test.ts src/app/desktop/DesktopAppRoot.test.tsx src/features/launcher/components/ProjectLauncherScreen.test.tsx src/features/settings/ModelSettingsDialog.test.tsx src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx src/features/scene/components/SceneExecutionTab.test.tsx src/features/scene/containers/SceneExecutionContainer.test.tsx src/App.test.tsx
```

### Final cross-workspace commands

```bash
pnpm typecheck
pnpm test
pnpm typecheck:desktop
pnpm test:desktop
pnpm --filter @narrative-novel/renderer build-storybook
```

### Storybook / MCP checks

- Launcher renders the three explicit start choices.
- Settings modal shows fixture-only, missing-key, and test-failed states.
- Runtime badge shows demo vs real-project and model-status combinations.
- Scene execution state shows blocked-run repair CTA instead of fake success when real OpenAI config is missing.

## Reject Conditions

- The desktop app still auto-selects the repo root or any implicit project when no project was chosen.
- The launcher is implemented as a fake empty workbench instead of a pre-workbench startup surface.
- API keys appear in any git-tracked file, project-state store, renderer localStorage, query string, or artifact detail.
- `real-project + openai` missing-config/provider-error/invalid-output still produces fixture proposal/prose success.
- `real-project + fixture` stops working even though fixture was selected explicitly.
- Runtime badge cannot distinguish demo fixture vs real project, or cannot show model configuration failure.
- Settings entry exists only on one scope instead of shell-global chrome.
- Affected shell/global surfaces have no Storybook states.
- Any route starts carrying settings, launcher, layout widths, or shell visibility state.

## Spec Coverage Self-Review

- PR69 settings entry, model bindings, API-key status, connection test, and upgraded runtime badge are covered by Bundle 1.
- PR70 launcher, explicit demo vs real-project mode, and no implicit startup selection are covered by Bundle 2.
- PR71 real OpenAI happy path plus no silent fallback in `real-project + openai` mode are covered by Bundle 3.
- PR72 README/demo-script rewrite, dogfood report, and P0 acceptance evidence are covered by Bundle 4.
- Frontend constitution constraints are preserved because:
  - launcher is the only pre-workbench full-screen surface
  - settings stay shell-owned
  - workbench route/layout separation is unchanged
  - main-stage run gating remains a single scene task, not a dashboard
  - Storybook surfaces are required for launcher/settings/runtime badge/run gate

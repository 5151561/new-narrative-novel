# OpenAI-Compatible Custom Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current hard-coded `fixture | openai` model-settings path with a user-defined OpenAI-compatible provider flow where users configure provider name, base URL, API key, and per-role model bindings from the existing shell-owned settings surface.

**Architecture:** Keep the existing desktop-owned credential/control-plane split and the existing Workbench shell. The new seam is a named provider profile registry plus per-role bindings that reference `fixture` or a saved OpenAI-compatible provider profile. The desktop app persists non-secret provider metadata and role bindings per project, stores secrets outside the renderer, injects one normalized model-settings JSON payload into the local API child process, and the API uses that payload to drive OpenAI-compatible chat-completions calls plus existing local schema validation.

**Tech Stack:** TypeScript, React, Electron main/preload, Fastify, OpenAI SDK with `baseURL`, Vitest, Storybook, pnpm

---

## Coordinator Handoff

- This is one PR, not a roadmap batch. Do not widen into Anthropic-compatible providers, provider marketplaces, cloud sync, or prompt editing.
- Do not create a worktree. Use one new branch in this checkout.
- Preserve `WorkbenchShell` ownership of layout. Model settings stays a shell-owned modal, not a dashboard page.
- Follow the user’s subagent rule instead of the stock subagent skill default:
  - Bundle A: Task 1 + Task 2
  - Bundle B: Task 3 + Task 4 + Task 5
  - Review once per bundle, then commit once per bundle.
- Keep Storybook in sync for every renderer change.
- Frontend verification must use MCP structured snapshots, not screenshots-only proof.

## Scope Guard

- Keep `fixture` as a first-class provider path. Do not remove fixture demo or explicit fixture role bindings.
- OpenAI-compatible only for this PR:
  - in scope: `baseURL`, API key, per-role `modelId`, provider display name
  - out of scope: Anthropic-compatible, Gemini, Bedrock, OAuth, multi-account switching
- Do not store raw secrets in git-tracked files, project state, renderer localStorage, route params, or run artifacts.
- Do not add a standalone settings page, provider dashboard, or workbench route for settings.
- Do not leak raw provider responses, prompts, headers, or secrets into run events, artifact detail, or trace records.
- Keep the real-project run guard strict:
  - missing provider binding
  - missing provider secret
  - invalid provider URL
  - provider execution failure
  - invalid JSON output
  must all fail honestly instead of silently falling back to fixture.

## Current Baseline From Code Inspection

- Desktop already stores provider secrets in `apps/desktop/src/main/credential-store.ts`, but only for the single literal provider key `openai`.
- Desktop already stores per-project role bindings plus last connection-test state in `apps/desktop/src/main/model-binding-store.ts`, but bindings only support `fixture | openai`.
- Desktop local API startup already injects role-specific OpenAI env vars from `apps/desktop/src/main/runtime-config.ts`, so there is already one stable seam for turning UI settings into API runtime config.
- Renderer already has a shell-owned `Model Settings` dialog in `packages/renderer/src/features/settings/ModelSettingsDialog.tsx`, but the dialog is hard-wired to one OpenAI API key plus per-role `fixture | openai` selects.
- API config already resolves per-role model bindings in `packages/api/src/orchestration/modelGateway/model-binding.ts`, but it assumes one global OpenAI credential/base endpoint.
- Planner, prose writer, and connection test already use the official `openai` SDK, but they are still coded like one fixed OpenAI provider instead of a user-supplied OpenAI-compatible provider.

## Target Data Model

Use one normalized persisted model-settings shape across desktop main, preload bridge, and renderer state:

```ts
export type ModelBindingProvider = 'fixture' | 'openai-compatible'

export interface OpenAiCompatibleProviderProfile {
  id: string
  label: string
  baseUrl: string
}

export type ModelBinding =
  | {
      provider: 'fixture'
    }
  | {
      provider: 'openai-compatible'
      providerId: string
      modelId: string
    }

export interface PersistedModelSettingsPayload {
  providers: OpenAiCompatibleProviderProfile[]
  bindings: Record<ModelBindingRole, ModelBinding>
}
```

Secrets stay outside this persisted payload. The desktop process injects a second API-runtime payload when spawning the local API child process:

```ts
export interface ApiRuntimeOpenAiCompatibleProviderProfile extends OpenAiCompatibleProviderProfile {
  apiKey?: string
}

export interface ApiRuntimeModelSettingsPayload {
  providers: ApiRuntimeOpenAiCompatibleProviderProfile[]
  bindings: Record<ModelBindingRole, ModelBinding>
}

export interface ResolvedOpenAiCompatibleBinding {
  provider: 'openai-compatible'
  providerId: string
  providerLabel: string
  baseUrl: string
  apiKey?: string
  modelId?: string
}
```

## File Map

### Desktop main / preload / shared

- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
  Purpose: widen bridge contracts from one `openai` provider to named OpenAI-compatible provider profiles and bindings.
- Modify: `apps/desktop/src/preload/desktop-api.ts`
  Purpose: expose provider-profile CRUD and provider-scoped credential calls to the renderer.
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
  Purpose: lock channel names and payload shapes for provider-profile operations.
- Modify: `apps/desktop/src/main/credential-store.ts`
  Purpose: store secrets by provider profile id instead of a single literal provider key.
- Modify: `apps/desktop/src/main/credential-store.test.ts`
  Purpose: cover provider-id-scoped save, read, redact, and delete behavior.
- Modify: `apps/desktop/src/main/model-binding-store.ts`
  Purpose: persist provider profiles, role bindings, and last connection-test record per project.
- Modify: `apps/desktop/src/main/model-binding-store.test.ts`
  Purpose: cover provider-profile persistence, seeded defaults, and connection-test reset behavior.
- Modify: `apps/desktop/src/main/runtime-config.ts`
  Purpose: inject one normalized model-settings JSON blob into the API child process instead of role-specific OpenAI env fragments.
- Modify: `apps/desktop/src/main/runtime-config.test.ts`
  Purpose: prove the local API env contains the new JSON payload and does not leak legacy raw env vars.
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
  Purpose: load provider profiles + secrets together before spawning/restarting the local API.
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
  Purpose: lock secret injection and restart behavior around provider changes.
- Modify: `apps/desktop/src/main/main.ts`
  Purpose: register provider-profile bridge handlers, reset connection-test state on provider changes, and keep model-settings snapshots shell-owned.
- Modify: `apps/desktop/src/main/main.test.ts`
  Purpose: verify IPC registration, provider-profile flows, and local API restart behavior.

### API

- Modify: `packages/api/src/config.ts`
  Purpose: parse normalized `NARRATIVE_MODEL_SETTINGS_JSON`, preserve legacy OpenAI env fallback, and expose resolved provider profiles to the gateways.
- Modify: `packages/api/src/config.test.ts`
  Purpose: cover JSON payload parsing, legacy migration, and real-project defaults.
- Modify: `packages/api/src/orchestration/modelGateway/model-binding.ts`
  Purpose: resolve fixture vs OpenAI-compatible provider bindings, including provider label/base URL/apiKey lookup.
- Modify: `packages/api/src/orchestration/modelGateway/model-binding.test.ts`
  Purpose: prove provider resolution, base-URL validation, and legacy `openai` migration.
- Modify: `packages/api/src/orchestration/modelGateway/modelGatewayErrors.ts`
  Purpose: widen provider labels from `openai` to `openai-compatible`.
- Create: `packages/api/src/orchestration/modelGateway/openai-compatible-json-client.ts`
  Purpose: centralize OpenAI-compatible chat-completions calls, JSON-only prompting, and assistant-text extraction.
- Create: `packages/api/src/orchestration/modelGateway/openai-compatible-json-client.test.ts`
  Purpose: prove `baseURL` wiring, assistant-text extraction, JSON-only failure behavior, and no secret leakage.
- Modify: `packages/api/src/orchestration/modelGateway/modelConnectionTest.ts`
  Purpose: run the connection test through the shared OpenAI-compatible client, dedupe repeated provider/model pairs, and report sanitized failures.
- Modify: `packages/api/src/orchestration/modelGateway/modelConnectionTest.test.ts`
  Purpose: cover missing key, invalid URL, provider error, model not found, and invalid JSON.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts`
  Purpose: switch the planner provider from OpenAI Responses-only assumptions to OpenAI-compatible chat-completions using `baseURL`.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts`
  Purpose: cover `baseURL`, message mapping, and parsed JSON extraction.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.ts`
  Purpose: switch the prose writer provider to the same OpenAI-compatible client path.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts`
  Purpose: cover `baseURL`, JSON parsing, and invalid-output failure behavior.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
  Purpose: use resolved OpenAI-compatible provider bindings and expose compact provider provenance.
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts`
  Purpose: lock provider-id/base-url-aware missing-config and failure behavior.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
  Purpose: use the same provider resolution and provenance for draft + revision roles.
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts`
  Purpose: lock custom-provider success/failure coverage.
- Modify: `packages/api/src/routes/model-settings.ts`
  Purpose: keep the route narrow while returning the new sanitized connection-test semantics.
- Modify: `packages/api/src/routes/model-settings.test.ts`
  Purpose: preserve the narrow route contract.

### Renderer

- Modify: `packages/renderer/src/features/settings/ModelSettingsProvider.tsx`
  Purpose: expose provider-profile CRUD, provider-scoped credential saves, and the richer settings snapshot.
- Modify: `packages/renderer/src/features/settings/ModelSettingsDialog.tsx`
  Purpose: replace the single OpenAI key section with a provider-profile editor plus per-role binding controls.
- Modify: `packages/renderer/src/features/settings/ModelSettingsDialog.test.tsx`
  Purpose: cover provider create/edit/delete, credential save, binding changes, and test-connection flows.
- Modify: `packages/renderer/src/features/settings/ModelSettingsDialog.stories.tsx`
  Purpose: keep Storybook coverage for empty provider, configured provider, and failed-test states.
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx`
  Purpose: keep shell stories aligned with the widened model-settings snapshot.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
  Purpose: surface `Fixture` vs provider label rather than hard-coded `OpenAI`.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
  Purpose: cover custom provider labels, missing secret state, and failed connection-test state.
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
  Purpose: keep Storybook proof for real-project custom provider states.
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx`
  Purpose: gate real-project runs on custom-provider completeness instead of `openai` literals.
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx`
  Purpose: cover the run-start guard and model-settings repair CTA with named custom providers.
- Modify: `packages/renderer/src/app/i18n/index.tsx`
  Purpose: replace hard-coded OpenAI copy with provider-generic copy in English and zh-CN.

### Provenance / contracts / docs

- Modify: `packages/api/src/contracts/api-records.ts`
  Purpose: widen provider provenance records from `openai` to `openai-compatible` plus provider id/label.
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts`
  Purpose: persist compact provider provenance without raw provider payloads.
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts`
  Purpose: render provider label/id in artifact detail instead of only `OpenAI`.
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts`
  Purpose: lock compact provider provenance rendering.
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts`
  Purpose: preserve start-workflow provenance wiring.
- Modify: `packages/api/src/createServer.run-flow.test.ts`
  Purpose: prove real-project runs succeed/fail against a custom base URL provider without silent fallback.
- Modify: `packages/renderer/src/features/scene/types/scene-view-models.ts`
  Purpose: keep renderer view models in sync with the new provider provenance shape.
- Modify: `doc/api-contract.md`
  Purpose: document the normalized model-settings JSON payload, provider profile shape, and no-secret/no-raw-payload rules.

## Bundle A

### Task 1: Normalize Provider Contracts And Legacy Migration

**Files:**
- Modify: `packages/api/src/orchestration/modelGateway/model-binding.ts`
- Modify: `packages/api/src/orchestration/modelGateway/model-binding.test.ts`
- Modify: `packages/api/src/config.ts`
- Modify: `packages/api/src/config.test.ts`
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`

- [ ] **Step 1: Write the failing API contract tests**

Add targeted tests that lock the new provider shape before implementation:

```ts
it('resolves openai-compatible provider bindings from normalized model settings json', () => {
  process.env.NARRATIVE_MODEL_SETTINGS_JSON = JSON.stringify({
    providers: [
      {
        id: 'deepseek',
        label: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com',
        apiKey: 'sk-deepseek',
      },
    ],
    bindings: {
      continuityReviewer: { provider: 'fixture' },
      planner: {
        provider: 'openai-compatible',
        providerId: 'deepseek',
        modelId: 'deepseek-chat',
      },
      sceneProseWriter: {
        provider: 'openai-compatible',
        providerId: 'deepseek',
        modelId: 'deepseek-chat',
      },
      sceneRevision: { provider: 'fixture' },
      summary: { provider: 'fixture' },
    },
  })

  expect(resolveModelBindingForRole(getApiServerConfig(), 'planner')).toEqual({
    apiKey: 'sk-deepseek',
    baseUrl: 'https://api.deepseek.com',
    modelId: 'deepseek-chat',
    provider: 'openai-compatible',
    providerId: 'deepseek',
    providerLabel: 'DeepSeek',
  })
})

it('synthesizes a default openai-compatible provider from the legacy env contract', () => {
  process.env.NARRATIVE_MODEL_PROVIDER = 'openai'
  process.env.NARRATIVE_OPENAI_MODEL = 'gpt-5.4'
  process.env.OPENAI_API_KEY = 'sk-openai'

  expect(resolveModelBindingForRole(getApiServerConfig(), 'planner')).toEqual({
    apiKey: 'sk-openai',
    baseUrl: 'https://api.openai.com/v1',
    modelId: 'gpt-5.4',
    provider: 'openai-compatible',
    providerId: 'openai-default',
    providerLabel: 'OpenAI',
  })
})
```

- [ ] **Step 2: Run the targeted API tests and verify they fail**

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/orchestration/modelGateway/model-binding.test.ts \
  src/config.test.ts
```

Expected: FAIL with unknown `openai-compatible` provider fields or missing normalized JSON parsing.

- [ ] **Step 3: Implement the normalized provider types and legacy fallback**

Update the shared bridge and API resolver types to stop treating `openai` as a single hard-coded provider:

```ts
export type DesktopModelBindingProvider = 'fixture' | 'openai-compatible'

export interface DesktopOpenAiCompatibleProviderProfile {
  id: string
  label: string
  baseUrl: string
}

export type DesktopModelBinding =
  | {
      provider: 'fixture'
    }
  | {
      provider: 'openai-compatible'
      providerId: string
      modelId: string
    }
```

Inside `model-binding.ts`, add one normalized parse path plus one legacy migration path:

```ts
const DEFAULT_OPENAI_PROVIDER_ID = 'openai-default'
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'

function createLegacyOpenAiProvider(openAiApiKey?: string) {
  return {
    id: DEFAULT_OPENAI_PROVIDER_ID,
    label: 'OpenAI',
    baseUrl: DEFAULT_OPENAI_BASE_URL,
    ...(openAiApiKey ? { apiKey: openAiApiKey } : {}),
  }
}

export function resolveModelBindingForRole(config: ModelSettingsConfigLike, role: ModelBindingRole): ResolvedModelBinding {
  const binding = config.modelSettings.bindings[role]
  if (!binding || binding.provider === 'fixture') {
    return { provider: 'fixture' }
  }

  const provider = config.modelSettings.providers.find((candidate) => candidate.id === binding.providerId)
  if (!provider) {
    return {
      provider: 'openai-compatible',
      providerId: binding.providerId,
      providerLabel: binding.providerId,
      baseUrl: '',
      modelId: binding.modelId,
    }
  }

  return {
    provider: 'openai-compatible',
    providerId: provider.id,
    providerLabel: provider.label,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    modelId: binding.modelId,
  }
}
```

In `config.ts`, parse `NARRATIVE_MODEL_SETTINGS_JSON` first, then fall back to the current env contract by synthesizing `openai-default`.

- [ ] **Step 4: Run the targeted API tests and verify they pass**

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/orchestration/modelGateway/model-binding.test.ts \
  src/config.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add \
  apps/desktop/src/shared/desktop-bridge-types.ts \
  packages/api/src/orchestration/modelGateway/model-binding.ts \
  packages/api/src/orchestration/modelGateway/model-binding.test.ts \
  packages/api/src/config.ts \
  packages/api/src/config.test.ts
git commit -m "2026-04-28, normalize openai-compatible provider contracts"
```

### Task 2: Persist Provider Profiles In Desktop Control Plane

**Files:**
- Modify: `apps/desktop/src/main/credential-store.ts`
- Modify: `apps/desktop/src/main/credential-store.test.ts`
- Modify: `apps/desktop/src/main/model-binding-store.ts`
- Modify: `apps/desktop/src/main/model-binding-store.test.ts`
- Modify: `apps/desktop/src/main/runtime-config.ts`
- Modify: `apps/desktop/src/main/runtime-config.test.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.test.ts`
- Modify: `apps/desktop/src/main/main.ts`
- Modify: `apps/desktop/src/main/main.test.ts`
- Modify: `apps/desktop/src/preload/desktop-api.ts`
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`

- [ ] **Step 1: Write the failing desktop persistence and bridge tests**

Add tests that lock provider-profile persistence, provider-id-scoped credentials, and JSON env injection:

```ts
it('stores credentials by provider profile id', async () => {
  const store = new CredentialStore({ encryption: fakeEncryption, userDataPath })

  await store.saveCredential('deepseek', 'sk-deepseek')

  await expect(store.getCredentialStatus('deepseek')).resolves.toEqual({
    configured: true,
    providerId: 'deepseek',
    redactedValue: 'sk-...seek',
  })
})

it('persists provider profiles and bindings in the project narrative directory', async () => {
  await store.upsertProvider(projectRoot, {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
  })

  await store.updateBinding(projectRoot, {
    role: 'planner',
    binding: {
      provider: 'openai-compatible',
      providerId: 'deepseek',
      modelId: 'deepseek-chat',
    },
  })

  await expect(store.readModelSettingsRecord(projectRoot)).resolves.toMatchObject({
    providers: [
      {
        id: 'deepseek',
        label: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com',
      },
    ],
    bindings: {
      planner: {
        provider: 'openai-compatible',
        providerId: 'deepseek',
        modelId: 'deepseek-chat',
      },
    },
  })
})

it('injects normalized model settings json into the local api env', () => {
  expect(config.env.NARRATIVE_MODEL_SETTINGS_JSON).toContain('"providerId":"deepseek"')
  expect(config.env.OPENAI_API_KEY).toBeUndefined()
  expect(config.env.NARRATIVE_PLANNER_OPENAI_MODEL).toBeUndefined()
})
```

- [ ] **Step 2: Run the targeted desktop tests and verify they fail**

Run:

```bash
pnpm --filter @narrative-novel/desktop exec vitest run \
  src/main/credential-store.test.ts \
  src/main/model-binding-store.test.ts \
  src/main/runtime-config.test.ts \
  src/main/local-api-supervisor.test.ts \
  src/main/main.test.ts \
  src/preload/desktop-api.test.ts
```

Expected: FAIL because the desktop layer still expects the literal provider key `openai` and still emits role-specific OpenAI env vars.

- [ ] **Step 3: Implement provider-profile persistence, secret scoping, and JSON env injection**

Widen the desktop bridge types and stores to use provider ids rather than one fixed provider key:

```ts
export interface ProviderCredentialStatus {
  providerId: string
  configured: boolean
  redactedValue?: string
}

export interface DesktopModelSettingsSnapshot {
  providers: DesktopOpenAiCompatibleProviderProfile[]
  credentialStatuses: Record<string, ProviderCredentialStatus>
  bindings: DesktopModelBindings
  connectionTest: DesktopModelConnectionTestRecord
}
```

Keep secrets outside the per-project JSON file:

```ts
export class CredentialStore {
  private readonly sessionCredentials = new Map<string, string>()

  async saveCredential(providerId: string, secret: string) {
    this.sessionCredentials.set(providerId, secret.trim())
    // persisted safeStorage write stays the same, but keyed by providerId
  }
}
```

Persist provider profiles and bindings together:

```ts
interface PersistedModelSettingsRecord {
  providers: DesktopOpenAiCompatibleProviderProfile[]
  bindings: Partial<Record<DesktopModelBindingRole, DesktopModelBinding>>
  connectionTest?: DesktopModelConnectionTestRecord
}

await this.writeRecord(projectRoot, {
  providers: normalizedProviders,
  bindings: nextBindings,
  connectionTest: { status: 'never' },
})
```

Replace role-specific OpenAI env fragments with one normalized payload:

```ts
const serializedModelSettings = JSON.stringify({
  providers: modelSettings.providers.map((profile) => ({
    ...profile,
    ...(providerCredentials[profile.id] ? { apiKey: providerCredentials[profile.id] } : {}),
  })),
  bindings: modelSettings.bindings,
})

env.NARRATIVE_MODEL_SETTINGS_JSON = serializedModelSettings
```

Expose IPC methods for provider profiles without moving settings ownership out of desktop main:

```ts
upsertModelProvider(input: UpsertModelProviderInput): Promise<DesktopModelSettingsSnapshot>
deleteModelProvider(providerId: string): Promise<DesktopModelSettingsSnapshot>
saveProviderCredential(input: { providerId: string; secret: string }): Promise<ProviderCredentialStatus>
```

- [ ] **Step 4: Run the targeted desktop tests and verify they pass**

Run:

```bash
pnpm --filter @narrative-novel/desktop exec vitest run \
  src/main/credential-store.test.ts \
  src/main/model-binding-store.test.ts \
  src/main/runtime-config.test.ts \
  src/main/local-api-supervisor.test.ts \
  src/main/main.test.ts \
  src/preload/desktop-api.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add \
  apps/desktop/src/main/credential-store.ts \
  apps/desktop/src/main/credential-store.test.ts \
  apps/desktop/src/main/model-binding-store.ts \
  apps/desktop/src/main/model-binding-store.test.ts \
  apps/desktop/src/main/runtime-config.ts \
  apps/desktop/src/main/runtime-config.test.ts \
  apps/desktop/src/main/local-api-supervisor.ts \
  apps/desktop/src/main/local-api-supervisor.test.ts \
  apps/desktop/src/main/main.ts \
  apps/desktop/src/main/main.test.ts \
  apps/desktop/src/preload/desktop-api.ts \
  apps/desktop/src/preload/desktop-api.test.ts
git commit -m "2026-04-28, persist custom provider settings in desktop control plane"
```

## Bundle B

### Task 3: Route Model Calls Through OpenAI-Compatible Providers

**Files:**
- Modify: `packages/api/src/orchestration/modelGateway/modelGatewayErrors.ts`
- Create: `packages/api/src/orchestration/modelGateway/openai-compatible-json-client.ts`
- Create: `packages/api/src/orchestration/modelGateway/openai-compatible-json-client.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/modelConnectionTest.ts`
- Modify: `packages/api/src/orchestration/modelGateway/modelConnectionTest.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
- Modify: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts`
- Modify: `packages/api/src/routes/model-settings.ts`
- Modify: `packages/api/src/routes/model-settings.test.ts`

- [ ] **Step 1: Write the failing OpenAI-compatible transport tests**

Add transport tests that lock `baseURL` support and JSON-only extraction:

```ts
it('passes the provider baseUrl into the openai sdk client', async () => {
  const create = vi.fn(async () => ({
    choices: [{ message: { content: '{"ok":"yes"}' } }],
  }))

  await callOpenAiCompatibleJson({
    apiKey: 'sk-test',
    baseUrl: 'https://api.deepseek.com',
    client: {
      chat: {
        completions: {
          create,
        },
      },
    },
    input: 'Connectivity check.',
    instructions: 'Return {"ok":"yes"} only.',
    modelId: 'deepseek-chat',
  })

  expect(create).toHaveBeenCalledWith(expect.objectContaining({
    model: 'deepseek-chat',
  }))
})

it('classifies invalid json output from a custom provider as invalid_output', async () => {
  const record = await runModelConnectionTest({
    modelSettings: {
      providers: [
        {
          id: 'deepseek',
          label: 'DeepSeek',
          baseUrl: 'https://api.deepseek.com',
          apiKey: 'sk-test',
        },
      ],
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          provider: 'openai-compatible',
          providerId: 'deepseek',
          modelId: 'deepseek-chat',
        },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    },
    client: {
      chat: {
        completions: {
          create: vi.fn(async () => ({
            choices: [{ message: { content: 'not-json' } }],
          })),
        },
      },
    },
  })

  expect(record).toEqual({
    errorCode: 'invalid_output',
    status: 'failed',
    summary: 'The configured provider returned an invalid JSON response.',
  })
})
```

- [ ] **Step 2: Run the targeted API gateway tests and verify they fail**

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/orchestration/modelGateway/openai-compatible-json-client.test.ts \
  src/orchestration/modelGateway/modelConnectionTest.test.ts \
  src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts \
  src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts \
  src/orchestration/modelGateway/scenePlannerGateway.test.ts \
  src/orchestration/modelGateway/sceneProseWriterGateway.test.ts \
  src/routes/model-settings.test.ts
```

Expected: FAIL because the current providers still assume the fixed OpenAI Responses path and do not know about `baseURL` or provider ids.

- [ ] **Step 3: Implement the shared OpenAI-compatible JSON client**

Create one helper that all provider calls and the connection test can share:

```ts
import OpenAI from 'openai'

export async function callOpenAiCompatibleJson({
  apiKey,
  baseUrl,
  client,
  instructions,
  input,
  modelId,
}: OpenAiCompatibleJsonRequest): Promise<string> {
  const resolvedClient = client ?? new OpenAI({
    apiKey,
    baseURL: baseUrl,
  })

  const response = await resolvedClient.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: `${instructions}\nReturn JSON only.` },
      { role: 'user', content: input },
    ],
    temperature: 0,
    stream: false,
  })

  const content = response.choices[0]?.message?.content
  return typeof content === 'string' ? content.trim() : ''
}
```

Then route the current planner/prose providers through that helper while keeping the local schema validators as the only source of truth:

```ts
const outputText = await callOpenAiCompatibleJson({
  apiKey: options.apiKey,
  baseUrl: options.baseUrl,
  instructions: request.instructions,
  input: request.input,
  modelId: options.modelId,
})

return normalizeScenePlannerOpenAiOutput(JSON.parse(outputText) as unknown)
```

Update the gateway provenance and error labels:

```ts
throw new ModelGatewayMissingConfigError({
  provider: 'openai-compatible',
  role: 'planner',
})
```

- [ ] **Step 4: Run the targeted API gateway tests and verify they pass**

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/orchestration/modelGateway/openai-compatible-json-client.test.ts \
  src/orchestration/modelGateway/modelConnectionTest.test.ts \
  src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts \
  src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts \
  src/orchestration/modelGateway/scenePlannerGateway.test.ts \
  src/orchestration/modelGateway/sceneProseWriterGateway.test.ts \
  src/routes/model-settings.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add \
  packages/api/src/orchestration/modelGateway/modelGatewayErrors.ts \
  packages/api/src/orchestration/modelGateway/openai-compatible-json-client.ts \
  packages/api/src/orchestration/modelGateway/openai-compatible-json-client.test.ts \
  packages/api/src/orchestration/modelGateway/modelConnectionTest.ts \
  packages/api/src/orchestration/modelGateway/modelConnectionTest.test.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts \
  packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.ts \
  packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts \
  packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts \
  packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts \
  packages/api/src/routes/model-settings.ts \
  packages/api/src/routes/model-settings.test.ts
git commit -m "2026-04-28, route generation through openai-compatible providers"
```

### Task 4: Replace OpenAI-Only Settings UI With Provider Profiles

**Files:**
- Modify: `packages/renderer/src/features/settings/ModelSettingsProvider.tsx`
- Modify: `packages/renderer/src/features/settings/ModelSettingsDialog.tsx`
- Modify: `packages/renderer/src/features/settings/ModelSettingsDialog.test.tsx`
- Modify: `packages/renderer/src/features/settings/ModelSettingsDialog.stories.tsx`
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx`
- Modify: `packages/renderer/src/app/i18n/index.tsx`

- [ ] **Step 1: Write the failing renderer tests and story fixtures**

Add tests that prove the settings dialog is no longer OpenAI-only:

```tsx
it('renders provider profiles and lets the user bind planner to a named custom provider', async () => {
  render(
    <ModelSettingsProvider>
      <ModelSettingsDialog open onOpenChange={() => {}} />
    </ModelSettingsProvider>,
  )

  expect(await screen.findByDisplayValue('DeepSeek')).toBeInTheDocument()

  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Planner provider' }),
    'deepseek',
  )
  await user.type(
    screen.getByRole('textbox', { name: 'Planner model' }),
    'deepseek-chat',
  )
  await user.click(screen.getByRole('button', { name: 'Save Planner binding' }))

  expect(bridge.updateBinding).toHaveBeenCalledWith({
    role: 'planner',
    binding: {
      provider: 'openai-compatible',
      providerId: 'deepseek',
      modelId: 'deepseek-chat',
    },
  })
})

it('shows the selected provider label instead of hard-coded OpenAI copy', async () => {
  render(<ProjectRuntimeStatusBadge info={info} />)
  expect(await screen.findByText('Model DeepSeek')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the targeted renderer tests and verify they fail**

Run:

```bash
pnpm --filter @narrative-novel/renderer exec vitest run \
  src/features/settings/ModelSettingsDialog.test.tsx \
  src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx \
  src/features/scene/containers/SceneExecutionContainer.test.tsx
```

Expected: FAIL because the snapshot, controller, dialog, and badge still assume one OpenAI API key and the literal `openai` provider string.

- [ ] **Step 3: Implement the provider-profile editor and binding UI**

Widen the renderer snapshot/controller first:

```ts
export interface DesktopModelSettingsSnapshot {
  providers: DesktopOpenAiCompatibleProviderProfile[]
  credentialStatuses: Record<string, ProviderCredentialStatus>
  bindings: DesktopModelBindings
  connectionTest: DesktopModelConnectionTestRecord
}

export interface ModelSettingsController {
  upsertProvider: (profile: DesktopOpenAiCompatibleProviderProfile) => Promise<void>
  deleteProvider: (providerId: string) => Promise<void>
  saveProviderCredential: (providerId: string, secret: string) => Promise<void>
}
```

Then replace the single OpenAI section with a provider list and binding rows:

```tsx
{snapshot.providers.map((profile) => (
  <section key={profile.id} className="rounded-md border border-line-soft bg-surface-2 px-4 py-4">
    <label>
      <span>{dictionary.shell.providerNameLabel}</span>
      <input value={profile.label} onChange={...} />
    </label>
    <label>
      <span>{dictionary.shell.providerBaseUrlLabel}</span>
      <input value={profile.baseUrl} onChange={...} />
    </label>
    <label>
      <span>{dictionary.shell.providerApiKeyLabel}</span>
      <input type="password" value={secretDrafts[profile.id] ?? ''} onChange={...} />
    </label>
    <button onClick={() => void controller.saveProviderCredential(profile.id, secretDrafts[profile.id] ?? '')}>
      {dictionary.shell.saveProviderSecret}
    </button>
  </section>
))}
```

Per-role binding rows should use `fixture` or a provider id:

```tsx
<select
  value={draft.provider === 'fixture' ? 'fixture' : draft.providerId}
  onChange={(event) => {
    const nextValue = event.target.value
    setBindingsDraft((currentDraft) => ({
      ...currentDraft,
      [role]: nextValue === 'fixture'
        ? { provider: 'fixture' }
        : {
            provider: 'openai-compatible',
            providerId: nextValue,
            modelId: currentDraft[role].provider === 'openai-compatible'
              ? currentDraft[role].modelId
              : '',
          },
    }))
  }}
>
  <option value="fixture">{getModelBindingProviderLabel(locale, 'fixture')}</option>
  {snapshot.providers.map((profile) => (
    <option key={profile.id} value={profile.id}>{profile.label}</option>
  ))}
</select>
```

- [ ] **Step 4: Run the targeted renderer tests and Storybook build**

Run:

```bash
pnpm --filter @narrative-novel/renderer exec vitest run \
  src/features/settings/ModelSettingsDialog.test.tsx \
  src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx \
  src/features/scene/containers/SceneExecutionContainer.test.tsx
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected:

```text
Vitest: PASS
Storybook build: PASS
```

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add \
  packages/renderer/src/features/settings/ModelSettingsProvider.tsx \
  packages/renderer/src/features/settings/ModelSettingsDialog.tsx \
  packages/renderer/src/features/settings/ModelSettingsDialog.test.tsx \
  packages/renderer/src/features/settings/ModelSettingsDialog.stories.tsx \
  packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx \
  packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx \
  packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx \
  packages/renderer/src/app/i18n/index.tsx
git commit -m "2026-04-28, add shell-owned custom provider model settings ui"
```

### Task 5: Surface Compact Custom-Provider Provenance And Close Verification

**Files:**
- Modify: `packages/api/src/contracts/api-records.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/renderer/src/features/scene/types/scene-view-models.ts`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Write the failing provenance and integration tests**

Add tests that prove custom-provider provenance stays compact and user-visible:

```ts
it('stores compact custom-provider provenance without raw provider payloads', () => {
  expect(detail.provenance).toEqual({
    provider: 'openai-compatible',
    providerId: 'deepseek',
    providerLabel: 'DeepSeek',
    modelId: 'deepseek-chat',
  })
  expect(JSON.stringify(detail)).not.toContain('https://api.deepseek.com')
  expect(JSON.stringify(detail)).not.toContain('sk-')
})

it('starts a real-project run against a custom base-url provider without silent fixture fallback', async () => {
  // inject model settings with baseUrl https://api.deepseek.com
  expect(startResponse.statusCode).toBe(201)
  expect(startedRun.latestEventSummary.en).not.toContain('fixture fallback')
})
```

- [ ] **Step 2: Run the targeted integration tests and verify they fail**

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts \
  src/orchestration/sceneRun/sceneRunWorkflow.test.ts \
  src/createServer.run-flow.test.ts
```

Expected: FAIL because the current provenance shape still says `openai` and does not carry provider id/label.

- [ ] **Step 3: Implement compact provider provenance and contract docs**

Persist compact provider provenance only:

```ts
provenance: {
  provider: 'openai-compatible',
  providerId: input.provenance.providerId,
  providerLabel: input.provenance.providerLabel,
  modelId: input.provenance.modelId,
  ...(input.provenance.fallbackReason ? { fallbackReason: input.provenance.fallbackReason } : {}),
}
```

Update the public contract docs with the new JSON payload shape:

```md
{
  "providers": [
    {
      "id": "deepseek",
      "label": "DeepSeek",
      "baseUrl": "https://api.deepseek.com"
    }
  ],
  "bindings": {
    "planner": {
      "provider": "openai-compatible",
      "providerId": "deepseek",
      "modelId": "deepseek-chat"
    }
  }
}
```

Document explicitly:

```text
Secrets never appear in project files.
baseUrl never appears in run artifacts.
raw provider responses never appear in run events or trace detail.
```

- [ ] **Step 4: Run targeted tests plus broad repo verification**

Run:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts \
  src/orchestration/sceneRun/sceneRunWorkflow.test.ts \
  src/createServer.run-flow.test.ts
pnpm typecheck
pnpm test
pnpm test:desktop
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected:

```text
All targeted Vitest files: PASS
pnpm typecheck: PASS
pnpm test: PASS
pnpm test:desktop: PASS
build-storybook: PASS
```

- [ ] **Step 5: Perform structured Storybook verification through MCP**

Run the local Storybook dev server:

```bash
pnpm storybook
```

Then use MCP structured snapshots on the updated shell surfaces:

```text
settings-model-settings-dialog--default
app-project-runtime-status-badge--real-local-project-open-ai-key-missing
mockups-scene-executiontab--run-start-guard
```

Acceptance evidence to capture:

```text
Model Settings shows provider name + base URL + API key status + role bindings
Runtime badge shows provider label instead of hard-coded OpenAI
Run-start guard offers Model Settings repair CTA when provider binding is incomplete
```

- [ ] **Step 6: Commit Task 5**

Run:

```bash
git add \
  packages/api/src/contracts/api-records.ts \
  packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts \
  packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts \
  packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts \
  packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts \
  packages/api/src/createServer.run-flow.test.ts \
  packages/renderer/src/features/scene/types/scene-view-models.ts \
  doc/api-contract.md
git commit -m "2026-04-28, surface compact custom-provider provenance"
```

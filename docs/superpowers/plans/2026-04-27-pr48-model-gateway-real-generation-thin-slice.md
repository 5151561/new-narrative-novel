# PR48 Model Gateway Real Generation Thin Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace exactly one narrow fixture node in the current scene-run start flow with a real OpenAI-backed model gateway plus fixture fallback, while keeping routes provider-agnostic and preserving the existing artifact-first review/canon/prose discipline.

**Architecture:** Build on the PR46 and PR47 prototype chain instead of redesigning runtime ownership. PR48 adds an API-side `ModelGateway` seam under `packages/api`, uses one structured-output contract for planner proposal generation, keeps writer/canon/prose flows on their current deterministic path, and stores only validated structured proposal data plus provider provenance in run-state surfaces. When provider config is missing, the provider call fails, or structured output is invalid, the gateway must fall back to the existing fixture proposal path so product continuity remains intact.

**Tech Stack:** TypeScript, Fastify fixture API, OpenAI Responses API via official `openai` SDK, AJV JSON-schema validation, Vitest, pnpm

---

This PR is limited to one thin-slice replacement in the current start-run chain:

```text
scene start
-> context packet artifact/event
-> planner invocation artifact/detail
-> proposal-set artifact/detail
-> review gate
-> canon patch + prose draft after acceptance
```

The only node that becomes real-generation-aware in PR48 is the planner -> proposal-set step. The writer invocation, accept/reject/rewrite transitions, prose materialization, trace graph shape, draft assembly reads, polling transport, and desktop-local usability all stay on the PR46/PR47 path.

## Scope Guard

- Stay on `codex/pr46-prototype-regression-gate-demo-hardening`; do not create a worktree for this plan or its implementation.
- Keep PR48 API-side and provider-agnostic at the route layer. Do not add renderer route state, provider toggles in UI, shell changes, or desktop project-picker work.
- Do not widen into PR49 streaming / worker runtime / async background orchestration. `GET /runs/{runId}/events/stream` must remain `501`.
- Do not widen into PR50 desktop-local recent-project or project usability work.
- Replace only one narrow start-run node: planner proposal generation feeding `proposal-set` read surfaces. Writer invocation remains fixture-backed in this PR.
- Keep run events lightweight and product-level. Do not put raw prompts, raw transcripts, raw Responses payloads, or large prose bodies into event payloads.
- Keep route handlers unaware of provider choice. Any provider selection, OpenAI model selection, fallback, and schema validation must stay behind API config + gateway seams.
- Preserve current review/canon/prose discipline: real model output may shape proposal-set artifact detail, but it must not directly become accepted canon or persisted prose truth without the existing review decision path.

## Current Baseline To Build On

- PR46 is already complete on this branch and locks the current prototype contract through:

```text
pnpm verify:prototype
-> API run-flow regression coverage
-> canonical renderer smoke
-> rewrite-request terminal semantics
```

- PR47 is already complete on this branch and persists the current prototype run chain through workspace-root:

```text
.narrative/prototype-state.json
```

  The PR48 run-state additions must fit inside that existing overlay contract rather than inventing a second persistence path.

- `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts` currently creates the entire start-run state synchronously and deterministically:

```text
context-packet artifact
planner invocation artifact
writer invocation artifact
proposal-set artifact
ordered events
waiting_review run record
```

- `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.parity.test.ts` currently guards the exact fixture start contract for ids, labels, summaries, refs, and artifacts. PR48 must preserve that parity when fixture generation is the selected or fallback path.

- `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts` currently derives planner invocation detail and proposal-set detail entirely from deterministic artifact ids and current selected variants. There is not yet a stored payload seam for real planner output.

- `packages/api/src/repositories/runFixtureStore.ts` is the only place that actually starts scene runs, indexes artifact read surfaces, and exports/hydrates persisted run state. It currently calls `startSceneRunWorkflow(...)` synchronously.

- `packages/api/src/repositories/fixtureRepository.ts` currently treats accepted run artifacts as the only source for canon/prose materialization. That discipline must stay unchanged.

- `packages/api/src/config.ts` currently exposes API host/port/base URL plus `NARRATIVE_PROJECT_STATE_FILE`, but it has no model-provider or model-id config seam yet.

- `packages/api/package.json` currently has no direct `openai` dependency and no explicit runtime JSON-schema validator dependency.

## Thin Slice Decision

PR48 replaces planner proposal generation only.

Why planner instead of writer:

- The proposal set is the first product review surface in the scene-run chain.
- Swapping planner output lets real generation enter artifact/proposal surfaces before any canon or prose mutation.
- The current accept / accept-with-edit / request-rewrite / reject transitions can stay exactly as they are.
- This avoids widening PR48 into prose rendering, streaming, or background orchestration.

The structured-output contract for PR48 should therefore be one strict planner proposal schema, validated twice:

```text
1. Responses API request uses strict JSON-schema structured output.
2. API-side gateway re-validates the returned payload before it can touch run state.
```

When the OpenAI call is unavailable or invalid, the gateway must return the existing fixture proposal shape instead of corrupting run state or blocking the product path.

## File Map

- `docs/superpowers/plans/2026-04-27-pr48-model-gateway-real-generation-thin-slice.md`
  Purpose: this implementation plan only.
- `packages/api/package.json`
  Purpose: add explicit runtime dependencies for the OpenAI Responses client and JSON-schema validation.
- `pnpm-lock.yaml`
  Purpose: record the new API package dependency graph.
- `packages/api/src/config.ts`
  Purpose: add provider/model env parsing for the scene planner gateway while preserving current server config behavior.
- `packages/api/src/config.test.ts`
  Purpose: lock provider defaulting, OpenAI selection, and safe fallback config parsing.
- `packages/api/src/orchestration/modelGateway/scenePlannerOutputSchema.ts`
  Purpose: define the strict planner structured-output contract, exported JSON schema, runtime validator, and normalized TypeScript types.
- `packages/api/src/orchestration/modelGateway/scenePlannerOutputSchema.test.ts`
  Purpose: prove valid fixture/openai-shaped planner payloads are accepted and malformed payloads are rejected before run-state mutation.
- `packages/api/src/orchestration/modelGateway/scenePlannerFixtureProvider.ts`
  Purpose: convert the current deterministic proposal-set baseline into a gateway-compatible fixture provider that remains the default and fallback path.
- `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts`
  Purpose: call the Responses API through the official `openai` SDK using top-level `instructions`, `input`, and strict `text.format` JSON schema, then normalize the result into planner output.
- `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts`
  Purpose: verify request shape, provider provenance, and invalid-response handling without making live network calls.
- `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
  Purpose: own provider selection, safe fallback sequencing, provider provenance, and the no-raw-payload persistence rule.
- `packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts`
  Purpose: prove missing env, provider failure, and invalid structured output all fall back to fixture output without throwing product-breaking errors.
- `packages/api/src/createServer.ts`
  Purpose: construct the planner gateway from config and inject it into the repository without exposing provider choice at the route layer.
- `packages/api/src/test/support/test-server.ts`
  Purpose: let API integration tests inject a deterministic planner gateway while preserving isolated project-state files.
- `packages/api/src/orchestration/sceneRun/sceneRunRecords.ts`
  Purpose: add typed start-workflow input for planner output/provenance without broadening later-PR runtime responsibilities.
- `packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts`
  Purpose: add planner artifact meta for provider/model/fallback provenance while keeping event payloads lightweight.
- `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts`
  Purpose: accept validated planner output as input, keep fixture parity when requested, and continue producing the same run/event/artifact envelope shape.
- `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts`
  Purpose: verify workflow creation with explicit planner output and provider provenance.
- `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.parity.test.ts`
  Purpose: ensure the fixture path still preserves the exact deterministic PR46 start contract.
- `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts`
  Purpose: build planner invocation detail and proposal-set detail from stored planner output overrides instead of id-only fixture derivation when real output is present.
- `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts`
  Purpose: prove planner output override mapping, canonical id assignment, fallback localization behavior, and unchanged canon/prose builders.
- `packages/api/src/repositories/runFixtureStore.ts`
  Purpose: make start-run generation async, call the planner gateway, persist validated proposal payloads/provenance, and export/hydrate them through PR47 state-file overlays.
- `packages/api/src/repositories/runFixtureStore.test.ts`
  Purpose: prove fixture fallback continuity, persisted planner output hydration, invalid provider-output protection, and unchanged accept/rewrite behavior.
- `packages/api/src/repositories/fixtureRepository.ts`
  Purpose: await the async run-store start path and keep accepted canon/prose materialization unchanged.
- `packages/api/src/createServer.run-flow.test.ts`
  Purpose: protect HTTP start-run behavior, lightweight paged events, and safe fallback continuity when the planner provider is real or degraded.
- `packages/api/src/createServer.run-artifacts.test.ts`
  Purpose: prove planner invocation detail + proposal-set detail expose validated real output first, while canon/prose/trace reads remain unchanged after acceptance.
- `packages/api/src/createServer.local-persistence.test.ts`
  Purpose: prove validated planner output survives server restart through the PR47 project-state file contract.
- `packages/api/src/createServer.draft-assembly-regression.test.ts`
  Purpose: confirm accepted canon/prose path discipline is preserved and rewrite/reject still do not corrupt downstream assembly.
- `doc/api-contract.md`
  Purpose: document the planner gateway env seam, fixture fallback guarantees, and the rule that route-level contracts remain provider-agnostic.

## Bundle 1: Lock The Config And Structured-Output Contract

**Files:**
- Modify: `packages/api/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/api/src/config.ts`
- Modify: `packages/api/src/config.test.ts`
- Create: `packages/api/src/orchestration/modelGateway/scenePlannerOutputSchema.ts`
- Create: `packages/api/src/orchestration/modelGateway/scenePlannerOutputSchema.test.ts`

- [ ] **Step 1: Add failing tests for the planner config seam and strict output contract**

Add tests that lock these exact PR48 decisions before implementation:

```text
provider env = NARRATIVE_MODEL_PROVIDER with allowed values fixture | openai
default provider = fixture
real provider model env = NARRATIVE_OPENAI_MODEL
OpenAI auth env = OPENAI_API_KEY
if provider=openai but key/model is missing, config does not crash the server and the runtime path remains eligible for fixture fallback
structured planner output uses a strict object schema with no extra top-level fields
proposal and variant arrays must validate shape before any run-state mutation happens
```

The planner output schema for PR48 should be narrow and canonical-id-free:

```json
{
  "proposals": [
    {
      "title": "Anchor the arrival beat",
      "summary": "Open on Midnight Platform before introducing any new reveal.",
      "changeKind": "action",
      "riskLabel": "Low continuity risk",
      "variants": [
        {
          "label": "Arrival-first",
          "summary": "Keep Midnight Platform grounded before the reveal escalates.",
          "rationale": "Preserves continuity while still moving the scene forward.",
          "tradeoffLabel": "Slower escalation",
          "riskLabel": "Low continuity risk"
        }
      ]
    }
  ]
}
```

Implementation rules for this schema:

```text
the model does not choose run ids, proposal ids, review ids, or trace ids
the model does not emit localized zh-CN strings in PR48
the model does not emit raw prompt/transcript fields
```

- [ ] **Step 2: Add explicit runtime dependencies and config fields**

Update the API package to add:

```text
openai
ajv
```

Then extend `packages/api/src/config.ts` with a narrow planner gateway config:

```text
modelProvider: 'fixture' | 'openai'
openAiModel?: string
openAiApiKey?: string
```

Parsing rules:

```text
NARRATIVE_MODEL_PROVIDER defaults to fixture
NARRATIVE_OPENAI_MODEL is only read when provider=openai
OPENAI_API_KEY is only read when provider=openai
missing model or key must not throw during config parsing
existing HOST / PORT / API_BASE_PATH / API_BASE_URL / NARRATIVE_PROJECT_STATE_FILE behavior stays unchanged
```

- [ ] **Step 3: Implement the strict planner output schema and runtime validator**

Create `scenePlannerOutputSchema.ts` to export:

```text
ScenePlannerOutput type
scenePlannerOutputJsonSchema constant
validateScenePlannerOutput(value) helper
normalizeScenePlannerOutput(value) helper that returns a typed payload or throws
```

Validation rules:

```text
proposal count must be >= 1
changeKind must stay inside the existing ProposalChangeKind contract
variant arrays remain optional
extra properties are rejected
empty strings are treated as invalid after trimming
```

PR48-specific normalization rule:

```text
localized product records are still built later
schema stores plain planner text only, with no direct renderer-facing localization work in this bundle
```

- [ ] **Step 4: Verify Bundle 1**

Run:

```bash
pnpm --filter @narrative-novel/api test -- config.test.ts scenePlannerOutputSchema.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected:

```text
config tests prove fixture defaulting and non-crashing openai config parsing
schema tests prove strict acceptance/rejection behavior
API typecheck stays green after adding planner config and schema exports
```

- [ ] **Step 5: Review and commit Bundle 1**

Commit after review passes:

```bash
git add packages/api/package.json \
  pnpm-lock.yaml \
  packages/api/src/config.ts \
  packages/api/src/config.test.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerOutputSchema.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerOutputSchema.test.ts
git commit -m "2026-04-27, define planner gateway config and schema"
```

## Bundle 2: Add The OpenAI Responses Adapter And Safe Fallback Gateway

**Files:**
- Create: `packages/api/src/orchestration/modelGateway/scenePlannerFixtureProvider.ts`
- Create: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts`
- Create: `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts`
- Create: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
- Create: `packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts`

- [ ] **Step 1: Write failing unit tests for provider request shape, provenance, and fallback**

Add tests that lock these exact PR48 gateway behaviors:

```text
fixture provider reproduces the current deterministic proposal-set content for the canonical prototype path
OpenAI provider calls Responses with top-level instructions and input
OpenAI provider sends strict structured-output schema through text.format instead of chat response_format
gateway returns provider provenance = openai when a validated structured output succeeds
gateway returns provider provenance = fixture with fallbackReason when config is missing, call fails, or output is invalid
gateway never returns raw Responses payloads or raw prompt text
```

The OpenAI adapter test should assert a request shape equivalent to:

```json
{
  "model": "env-configured-model-id",
  "instructions": "You are the scene planner for the Narrative IDE prototype...",
  "input": "Scene id, note, and packed context summary for the current run...",
  "text": {
    "format": {
      "type": "json_schema",
      "name": "scene_planner_output",
      "strict": true
    }
  }
}
```

Do not test live network calls in this bundle. Use a fake OpenAI client and fake Responses result objects only.

- [ ] **Step 2: Implement the fixture provider as the canonical fallback path**

Create `scenePlannerFixtureProvider.ts` by extracting the current deterministic proposal semantics into a provider-shaped function that returns:

```text
validated planner output payload
provider = fixture
modelId = fixture-scene-planner
fallbackReason = undefined
```

Design rule:

```text
this provider must reproduce the same proposal ordering and wording already protected by sceneRunArtifactDetails.test.ts and sceneRunWorkflow.parity.test.ts
```

- [ ] **Step 3: Implement the OpenAI Responses adapter and gateway wrapper**

Create `scenePlannerOpenAiResponsesProvider.ts` and `scenePlannerGateway.ts` with these explicit responsibilities:

```text
OpenAI provider:
- build one planner-specific instructions string
- build one compact textual input from scene id + run mode + note + context summary
- call the Responses API through the official SDK
- read structured output from the Responses result
- validate again with scenePlannerOutputSchema before returning

Gateway wrapper:
- choose provider based on config
- if provider=openai and config is incomplete, return fixture output with fallbackReason=missing-config
- if provider call throws, return fixture output with fallbackReason=provider-error
- if provider returns invalid structured output, return fixture output with fallbackReason=invalid-output
- only persist validated structured planner output plus provider/model/fallback provenance
```

Keep provider-aware behavior inside the gateway only. No route or repository method should branch on raw env names.

- [ ] **Step 4: Verify Bundle 2**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  scenePlannerOpenAiResponsesProvider.test.ts \
  scenePlannerGateway.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected:

```text
Responses request-shape tests pass without network access
gateway tests prove fixture continuity under missing config, thrown provider errors, and invalid structured output
API typecheck stays green with the new provider layer
```

- [ ] **Step 5: Review and commit Bundle 2**

Commit after review passes:

```bash
git add packages/api/src/orchestration/modelGateway/scenePlannerFixtureProvider.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.test.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts \
  packages/api/src/orchestration/modelGateway/scenePlannerGateway.test.ts
git commit -m "2026-04-27, add planner gateway openai adapter"
```

## Bundle 3: Integrate The Gateway Into Scene-Run Start And Persist Validated Proposal Output

**Files:**
- Modify: `packages/api/src/createServer.ts`
- Modify: `packages/api/src/test/support/test-server.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunRecords.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.parity.test.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/api/src/createServer.run-artifacts.test.ts`
- Modify: `packages/api/src/createServer.local-persistence.test.ts`
- Modify: `packages/api/src/createServer.draft-assembly-regression.test.ts`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Add failing workflow/store/route tests before wiring the gateway**

Extend the existing tests to lock these exact PR48 integration outcomes:

```text
fixture path still preserves the legacy PR46 start-run parity contract exactly
startSceneRun becomes async internally but HTTP contract still returns the same run shape
planner invocation detail shows provider/model provenance without exposing raw payloads
proposal-set detail uses validated planner output when openai succeeds
proposal-set detail falls back to the deterministic fixture content when the openai path is unavailable or invalid
accepted canon/prose path stays derived from accepted proposal ids through the existing review transition
rewrite-request and reject still do not overwrite downstream draft assembly
validated planner output survives export/hydrate and fresh-server restart through the PR47 state file
```

Add one explicit integration case with an injected fake real-provider gateway that returns planner output different from the fixture baseline, and assert that:

```text
GET /runs/{runId}/artifacts/{proposalSetId}
-> shows the injected planner titles/summaries/changeKinds/variants

GET /runs/{runId}/artifacts/{plannerInvocationId}
-> shows the injected provider/model provenance

GET /runs/{runId}/events
-> still does not contain raw proposal copy, raw prompts, or raw transcript payloads
```

- [ ] **Step 2: Thread validated planner output through workflow creation without changing the route contract**

Update the scene-run start path so that:

```text
createServer constructs the scenePlannerGateway from config
test-server can inject a fake scenePlannerGateway for deterministic tests
runFixtureStore.startSceneRun(...) becomes async and asks the gateway for planner output first
startSceneRunWorkflow(...) receives validated planner output + provider provenance as explicit input
sceneRunArtifacts.ts stores only compact provenance in planner artifact meta
sceneRunWorkflow.parity.test.ts still passes through the fixture provider path
```

Provider provenance to persist on the planner invocation artifact should stay compact:

```text
provider = fixture | openai
modelId = fixture-scene-planner | env-configured OpenAI model id
fallbackReason = missing-config | provider-error | invalid-output | undefined
```

Do not add raw prompt text or raw Responses objects to artifact meta.

- [ ] **Step 3: Persist planner output in run-state read surfaces and keep canon/prose discipline unchanged**

Update `runFixtureStore.ts` and `sceneRunArtifactDetails.ts` so that:

```text
planner output is stored in run state as validated JSON-like data
exportProjectState()/hydrateProjectState() include that validated planner payload
buildProposalSetDetail(...) can use stored planner proposals to override the fixture default
buildAgentInvocationDetail(...) can show openai-vs-fixture model labels from compact provenance
proposal ids and variant ids remain canonical store-owned ids derived from run id + proposal order
canon patch, prose draft, trace links, and downstream scene/chapter/book reads stay on the existing accepted-run logic
```

Canonical-id rule:

```text
the model never controls final proposal ids or variant ids
the store assigns ids by run + ordinal position so selectedVariants, persistence, and trace stay stable
```

Localization rule for this thin slice:

```text
real planner copy may be localized with localize(en, en) for PR48
do not add translation runtime or renderer i18n work in this PR
```

- [ ] **Step 4: Update the API contract doc**

Refresh `doc/api-contract.md` with one PR48 section that states:

```text
scene-run start now passes through an API-side planner gateway
route contracts remain provider-agnostic
provider env = NARRATIVE_MODEL_PROVIDER
openai model env = NARRATIVE_OPENAI_MODEL
OPENAI_API_KEY enables the real provider path
missing config / provider failure / invalid structured output fall back to fixture proposal generation
events remain lightweight and never carry raw prompt/transcript/prose payloads
accepted canon/prose still come only from review-approved artifact flow
events/stream remains 501 and worker/streaming work is deferred to PR49+
```

- [ ] **Step 5: Run final verification**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  config.test.ts \
  scenePlannerOutputSchema.test.ts \
  scenePlannerOpenAiResponsesProvider.test.ts \
  scenePlannerGateway.test.ts \
  sceneRunWorkflow.test.ts \
  sceneRunWorkflow.parity.test.ts \
  sceneRunArtifactDetails.test.ts \
  runFixtureStore.test.ts \
  createServer.run-flow.test.ts \
  createServer.run-artifacts.test.ts \
  createServer.local-persistence.test.ts \
  createServer.draft-assembly-regression.test.ts
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/api typecheck
pnpm verify:prototype
```

Expected:

```text
targeted gateway + scene-run tests prove real-generation thin-slice behavior
full API test suite stays green
typecheck passes with the async gateway seam
PR46 regression gate still passes, proving renderer and existing prototype contract were not widened
```

- [ ] **Step 6: Storybook / MCP decision**

No Storybook or MCP verification is required for the intended PR48 path because this plan stays inside `packages/api`, route contracts, and persisted API state only.

Hard stop rule:

```text
if implementation starts changing renderer files, route-owned UI state, or workbench copy, stop and request a follow-up plan because frontend constitution, Storybook updates, and MCP verification would then become mandatory
```

- [ ] **Step 7: Review and commit Bundle 3**

Commit after review passes:

```bash
git add packages/api/src/createServer.ts \
  packages/api/src/test/support/test-server.ts \
  packages/api/src/orchestration/sceneRun/sceneRunRecords.ts \
  packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts \
  packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts \
  packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts \
  packages/api/src/orchestration/sceneRun/sceneRunWorkflow.parity.test.ts \
  packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts \
  packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts \
  packages/api/src/repositories/runFixtureStore.ts \
  packages/api/src/repositories/runFixtureStore.test.ts \
  packages/api/src/repositories/fixtureRepository.ts \
  packages/api/src/createServer.run-flow.test.ts \
  packages/api/src/createServer.run-artifacts.test.ts \
  packages/api/src/createServer.local-persistence.test.ts \
  packages/api/src/createServer.draft-assembly-regression.test.ts \
  doc/api-contract.md
git commit -m "2026-04-27, integrate planner gateway into scene runs"
```

## Execution Notes

- Review each bundle only after every task in that bundle is complete, then commit once per reviewed bundle.
- Keep the slice narrow: planner proposal generation becomes real-provider-aware, but writer invocation, streaming transport, worker runtime, desktop-local UX, and renderer surfaces do not.
- Preserve the PR46 event-weight rule. The gateway may store validated planner proposal data for artifact detail reads, but events must continue to expose only summary + refs.
- Preserve the PR47 persistence discipline. Persist validated planner output and compact provider provenance inside the existing project-state overlay; do not add a second cache file, background queue, or raw-response archive.
- If implementation discovers that the writer path must also become real-provider-aware to make this slice coherent, stop and ask for a new PR plan instead of silently widening PR48 into PR49 territory.

## Self-Review

### Spec Coverage

- One real provider plus one fixture fallback is covered by Bundle 2 gateway/provider work and Bundle 3 integration tests.
- Replacing only one narrow node in the scene-run chain is covered by the Thin Slice Decision, Scope Guard, and Bundle 3 workflow/store integration limited to planner -> proposal-set.
- Route-level provider agnosticism is covered by Bundle 3 `createServer` injection and `doc/api-contract.md` refresh.
- Schema-validated structured output using the Responses API is covered by Bundle 1 schema/validator work and Bundle 2 OpenAI adapter request-shape tests.
- Failure continuity is covered by Bundle 2 gateway fallback tests and Bundle 3 run-flow integration assertions.
- Accepted canon/prose discipline staying unchanged is covered by Bundle 3 `createServer.draft-assembly-regression.test.ts`, unchanged review transitions, and the explicit canon-id rule.
- PR47 restart persistence for the new planner payload is covered by Bundle 3 run-store hydration work and `createServer.local-persistence.test.ts`.
- Renderer / Storybook / MCP non-involvement is covered by Scope Guard and the explicit Storybook / MCP decision.

### Assumptions To Check Before Execution

- This plan assumes PR48 should use the official `openai` SDK rather than raw `fetch`, because the thin slice benefits from SDK-level Responses API shape alignment while still re-validating structured output locally with AJV.
- This plan assumes the provider env names should be `NARRATIVE_MODEL_PROVIDER`, `NARRATIVE_OPENAI_MODEL`, and `OPENAI_API_KEY`. If the controller wants planner-specific env names instead, decide that before implementation starts.
- This plan assumes the model-generated planner text may temporarily use `zh-CN = en` when converted into localized product records. If localized generated copy is required immediately, that needs an explicit follow-up scope decision before execution.
- This plan assumes the gateway will persist only validated structured planner output and compact provider provenance, not raw Responses JSON. If auditing raw provider payloads is later required, that should be a separate artifact/trace PR rather than silent PR48 scope growth.

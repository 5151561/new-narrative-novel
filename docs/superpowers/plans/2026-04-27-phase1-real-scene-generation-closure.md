# Phase 1 Real Scene Generation Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Gate A by making one scene truly writable end-to-end: real prose generation after accepted review, real explainable context packets, and a review-gated prose revision loop that updates chapter/book reads only after acceptance.

**Architecture:** Build directly on PR43 and PR48 instead of redesigning runtime ownership. Keep the existing scene run -> review -> canon patch -> prose artifact -> chapter/book draft chain, add a dedicated real Scene Prose Writer seam beside the existing planner gateway, add a backend-owned Context Builder v1 that feeds both planner and writer, and extend Scene / Draft / Prose so revision stays inside WorkbenchShell as a main-stage task without letting raw model output directly overwrite current prose truth.

**Tech Stack:** TypeScript, Fastify fixture API, OpenAI Responses API via official `openai` SDK, React, TanStack Query, Storybook, Vitest, pnpm

---

## Phase Scope

This plan covers Phase 1 only:

- PR51 `Real Scene Prose Writer Gateway`
- PR52 `Real Context Builder v1`
- PR53 `Scene Prose Revision Loop`

Phase 1 ends at Gate A:

```text
real planner + real prose writer path
-> review
-> canon patch
-> prose draft
-> prose revision candidate
-> accept revision
-> chapter/book read surfaces reflect accepted prose
-> trace/explanation remains readable
```

## Scope Guard

- Stay on the current branch. Do not create a worktree for execution.
- Do not widen into Phase 2 local project store, recent projects, model settings UI, migration, backup, or desktop picker work.
- Do not add prompt editors, RAG, vector retrieval, Temporal, streaming, background worker runtime, project store, or shell redesign.
- Do not let raw model output become canon or current prose without the existing review gate or the new revision accept step.
- Do not put full context packets, prompts, raw Responses payloads, or generated prose bodies into run event payloads.
- Do not move prose revision into Inspector or Bottom Dock. Scene / Draft / Prose remains the primary main-stage task.
- Do not change `GET /api/projects/:projectId/runs/:runId/events/stream`; it stays on the current contract.

## Current Baseline To Honor

- `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts` already supports real OpenAI planner output with fixture fallback.
- `packages/api/src/repositories/runFixtureStore.ts` still only makes the planner step real; accepted prose generation is still effectively fixture-backed.
- `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts` still synthesizes context packet and prose bodies from deterministic fixture builders.
- `packages/api/src/repositories/fixtureRepository.ts` still materializes `scene.prose` from accepted `prose-draft` artifact detail, and current prose revision only mutates queue/status state in place.
- `packages/api/src/createServer.prose-revision.test.ts` proves the current revision endpoint is queue-only and keeps the prose body unchanged.
- `packages/renderer/src/features/scene/components/SceneProseTab.tsx` already owns the Scene / Draft / Prose main-stage surface, but only exposes preset revision modes plus a queue action.
- `packages/renderer/src/features/run/api/run-artifact-records.ts` and the existing artifact inspector surfaces already cover context packet, proposal set, canon patch, prose draft, and trace read models.
- Storybook and tests already exist for `SceneProseContainer`, `RunArtifactInspectorPanel`, and the app-level scene runtime smoke path. They must stay in sync.

## Workbench Constitution Compliance

This Phase 1 work must not:

- bypass `WorkbenchShell`
- add page-like dashboards
- implement local pane layout inside business components
- duplicate shell state
- put the primary prose task in Inspector or Bottom Dock
- mix route state with layout preference
- create a second selected-object truth source

This Phase 1 work must:

- keep `Scene` as the object scope
- keep `Orchestrate` as the run/review lens and `Draft` as the prose/revision lens
- keep one main-stage task at a time:
  - `Scene / Orchestrate`: review proposals and accept/reject
  - `Scene / Draft / Prose`: read current prose, request revision, review candidate, accept revision
- preserve route restore via the existing scene route/search contract
- preserve layout restore under `WorkbenchShell`
- add Storybook states for every changed prose/artifact surface
- add tests for route/layout/selection boundaries where the prose UI changes

## Preflight And Anti-Drift

- [ ] Confirm the branch already contains PR43 and PR48 baselines before starting implementation.
- [ ] Run the focused baseline suite before editing:

```bash
pnpm --filter @narrative-novel/api test -- sceneRunWorkflow.test.ts sceneRunWorkflow.parity.test.ts runFixtureStore.test.ts createServer.run-flow.test.ts createServer.run-artifacts.test.ts createServer.prose-revision.test.ts
pnpm --filter @narrative-novel/renderer test -- App.scene-runtime-smoke.test.tsx SceneProseContainer.test.tsx RunArtifactInspectorPanel.test.tsx
```

- [ ] Keep automated tests provider-stubbed. Live OpenAI calls are only for optional manual smoke after the suite passes.
- [ ] If manual live smoke is needed, use env only; do not add UI:

```bash
NARRATIVE_MODEL_PROVIDER=openai \
OPENAI_API_KEY=... \
NARRATIVE_OPENAI_MODEL=... \
pnpm --filter @narrative-novel/api test -- createServer.run-flow.test.ts
```

- [ ] Preserve the artifact-first contract throughout:

```text
proposal != canon
canon patch = accepted story truth
prose = rendered artifact/read model
revision candidate != current prose truth until accept
trace/explanation must remain readable without raw payload leakage
```

## Bundle Map

Each bundle below should be implemented, reviewed, and committed separately.

### Bundle 1 Files: PR51 Real Scene Prose Writer Gateway

- Create: `packages/api/src/orchestration/modelGateway/sceneProseWriterOutputSchema.ts`
- Create: `packages/api/src/orchestration/modelGateway/sceneProseWriterOutputSchema.test.ts`
- Create: `packages/api/src/orchestration/modelGateway/sceneProseWriterFixtureProvider.ts`
- Create: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.ts`
- Create: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts`
- Create: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
- Create: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts`
- Modify: `packages/api/src/createServer.ts`
- Modify: `packages/api/src/test/support/test-server.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunRecords.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/api/src/createServer.run-artifacts.test.ts`
- Modify: `packages/api/src/createServer.write-surfaces.test.ts`
- Modify: `packages/api/src/createServer.local-persistence.test.ts`
- Modify only if shared config needs a narrow extension: `packages/api/src/config.ts`, `packages/api/src/config.test.ts`

### Bundle 2 Files: PR52 Real Context Builder v1

- Create: `packages/api/src/orchestration/contextBuilder/sceneContextBuilder.ts`
- Create: `packages/api/src/orchestration/contextBuilder/sceneContextBuilder.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunRecords.ts`
- Modify: `packages/api/src/createServer.run-artifacts.test.ts`
- Modify: `packages/api/src/createServer.write-surfaces.test.ts`
- Modify: `packages/api/src/createServer.local-persistence.test.ts`
- Modify: `packages/renderer/src/features/run/api/run-artifact-records.ts`
- Modify: `packages/renderer/src/features/run/api/mock-run-db.ts`
- Modify: `packages/renderer/src/features/run/components/RunArtifactDetailSections.tsx`
- Modify: `packages/renderer/src/features/run/components/RunArtifactInspectorPanel.test.tsx`
- Modify: `packages/renderer/src/features/run/components/RunArtifactInspectorPanel.stories.tsx`

### Bundle 3 Files: PR53 Scene Prose Revision Loop Backend

- Modify: `packages/api/src/contracts/api-records.ts`
- Modify: `packages/api/src/routes/scene.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.test.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterFixtureProvider.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOutputSchema.ts`
- Modify: `packages/api/src/orchestration/modelGateway/sceneProseWriterOutputSchema.test.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunProseRevision.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Modify: `packages/api/src/createServer.prose-revision.test.ts`
- Modify: `packages/api/src/createServer.write-surfaces.test.ts`
- Modify: `packages/api/src/createServer.read-surfaces.test.ts`
- Modify: `packages/api/src/createServer.draft-assembly-regression.test.ts`
- Modify: `packages/api/src/createServer.local-persistence.test.ts`

### Bundle 4 Files: PR53 Scene Prose Revision Loop Renderer And Storybook

- Modify: `packages/renderer/src/features/scene/types/scene-view-models.ts`
- Modify: `packages/renderer/src/features/scene/api/scene-runtime.ts`
- Modify: `packages/renderer/src/features/scene/api/scene-client.ts`
- Modify: `packages/renderer/src/app/project-runtime/api-route-contract.ts`
- Modify: `packages/renderer/src/app/project-runtime/api-project-runtime.ts`
- Modify: `packages/renderer/src/app/project-runtime/api-project-runtime.test.ts`
- Modify: `packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts`
- Modify only if fixture runtime tests drift: `packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.test.ts`
- Modify: `packages/renderer/src/features/scene/components/SceneProseTab.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneProseContainer.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
- Modify: `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
- Modify only if artifact stories need Phase 1 revision parity: `packages/renderer/src/features/run/components/RunArtifactInspectorPanel.stories.tsx`

## Bundle 1: PR51 Real Scene Prose Writer Gateway

**Non-goals:**

- Do not redesign the planner gateway.
- Do not add model settings UI or second model-selection surface.
- Do not stream tokens into the UI.
- Do not change the review decision contract for reject or request-rewrite.

**Acceptance focus:**

- Structure: a dedicated writer gateway exists behind the API config seam, separate from the planner gateway.
- Behavior: `accept` and `accept-with-edit` produce a prose artifact body from the writer gateway; fixture fallback stays available and visible.
- Boundary: route handlers remain provider-agnostic and run events remain lightweight.

- [ ] Add a dedicated writer structured-output contract that returns typed prose draft data suitable for `ProseDraftArtifactDetailRecord`, and validate it before any read-model mutation.
- [ ] Keep provider choice behind the API seam by wiring a new `sceneProseWriterGateway` through `createServer.ts`, `test/support/test-server.ts`, and repository injection without exposing provider details to routes.
- [ ] Change the accepted-review path so prose generation happens after review acceptance through the writer gateway instead of the current fixture-only artifact builder. `request-rewrite` and `reject` stay on the existing terminal path.
- [ ] Persist writer output and provenance on writer/prose artifacts, and materialize `scene.prose` from stored artifact detail instead of deterministic fixture body synthesis.
- [ ] Add focused regressions proving:
  - fixture provider remains default
  - missing or failing OpenAI config falls back safely
  - accepted prose survives local persistence restart
  - chapter/book read surfaces still consume accepted prose through the current materialization path
- [ ] Review this bundle, then commit it alone.

**Verification commands:**

```bash
pnpm --filter @narrative-novel/api test -- sceneProseWriterGateway.test.ts sceneProseWriterOpenAiResponsesProvider.test.ts runFixtureStore.test.ts sceneRunArtifactDetails.test.ts createServer.run-flow.test.ts createServer.run-artifacts.test.ts createServer.write-surfaces.test.ts createServer.local-persistence.test.ts
```

## Bundle 2: PR52 Real Context Builder v1

**Non-goals:**

- Do not introduce vector retrieval, prompt-manager UI, or policy editing.
- Do not move context packet ownership into the renderer.
- Do not let context packet details leak into run event payloads.

**Acceptance focus:**

- Structure: one backend-owned context builder assembles typed packet data from current project truth.
- Behavior: planner and writer both consume the same persisted context packet, and prose artifacts can point back to it.
- Boundary: redaction and exclusion stay explainable without exposing hidden facts in included context.

- [ ] Introduce `sceneContextBuilder.ts` to build a first-class context packet from repository truth, covering:

```text
book premise
chapter goal
scene objective
scene setup / current state
accepted canon facts
cast summary
location summary
relevant asset facts
style instruction
visibility / redaction explanation
context budget summary
```

- [ ] Replace the current default-only context packet detail builders with persisted packet content and persisted activation summaries, while keeping event metadata limited to counts and refs.
- [ ] Feed the same context packet into planner and writer request construction, and persist stable context packet identifiers so artifact detail/read surfaces can explain what was included, excluded, and redacted.
- [ ] Extend `ProseDraftArtifactDetailRecord` with a `contextPacketId` reference and update run artifact inspector UI/stories so the prose artifact can point back to the context packet.
- [ ] Add regressions proving:
  - context packet detail is built from project data, not deterministic placeholder text
  - redacted assets are absent from included facts but present in explanation/activation summaries
  - prose artifacts and writer invocation detail reference the same context packet id
  - persisted state survives restart without losing packet/prose linkage
- [ ] Review this bundle, then commit it alone.

**Verification commands:**

```bash
pnpm --filter @narrative-novel/api test -- sceneContextBuilder.test.ts runFixtureStore.test.ts sceneRunArtifactDetails.test.ts createServer.run-artifacts.test.ts createServer.write-surfaces.test.ts createServer.local-persistence.test.ts
pnpm --filter @narrative-novel/renderer test -- RunArtifactInspectorPanel.test.tsx
```

## Bundle 3: PR53 Scene Prose Revision Loop Backend

**Non-goals:**

- Do not add a rich-text editor or paragraph-merge system.
- Do not add collaboration/comments.
- Do not let revision requests mutate canon facts.
- Do not overwrite `scene.prose.proseDraft` when a revision candidate is merely requested.

**Acceptance focus:**

- Structure: revision generation is model-backed, source-chained, and separate from current prose truth until acceptance.
- Behavior: a revision request produces a candidate plus diff summary; accepting that candidate updates scene/chapter/book reads.
- Boundary: revision raw output stays out of run event payloads and does not bypass acceptance.

- [ ] Extend the scene prose API contract so `POST /api/projects/:projectId/scenes/:sceneId/prose/revision` accepts `revisionMode` plus a short optional `instruction`, and add a narrow accept endpoint:

```text
POST /api/projects/:projectId/scenes/:sceneId/prose/revision/accept
body: { revisionId }
```

- [ ] Rework `sceneRunProseRevision.ts` and the writer gateway so revision generation becomes real instead of queue-only. The candidate must carry:

```text
revision id
revision mode
instruction echo
candidate prose body
diff summary
source prose draft id
source canon patch id
context packet id
fallback provenance if fixture was used
```

- [ ] Persist revision candidate state separately from current prose, and only promote the candidate into `scene.prose.proseDraft` after the new accept endpoint succeeds.
- [ ] Keep traceability readable by storing enough source-chain information for Scene / Draft / Prose, chapter draft assembly, and the dock/trace read models, without inventing a new run system.
- [ ] Add regressions proving:
  - no-draft scenes still return `SCENE_PROSE_REVISION_DRAFT_REQUIRED`
  - a revision request no longer behaves as queue-only
  - current prose remains stable until accept
  - accept updates chapter/book assembly and persists across restart
  - serialized run events still do not contain full revision body or diff payloads
- [ ] Review this bundle, then commit it alone.

**Verification commands:**

```bash
pnpm --filter @narrative-novel/api test -- sceneProseWriterGateway.test.ts sceneProseWriterOutputSchema.test.ts createServer.prose-revision.test.ts createServer.read-surfaces.test.ts createServer.write-surfaces.test.ts createServer.draft-assembly-regression.test.ts createServer.local-persistence.test.ts
```

## Bundle 4: PR53 Scene Prose Revision Loop Renderer And Storybook

**Non-goals:**

- Do not add a new page or alternate shell.
- Do not store revision brief, selected mode, or candidate visibility in route or shell layout state.
- Do not move candidate review into Inspector or Bottom Dock.
- Do not turn Scene / Draft / Prose into a chat transcript.

**Acceptance focus:**

- Structure: all prose revision interactions stay inside the existing `SceneProseContainer` main-stage surface.
- Behavior: users can request a revision brief, inspect the candidate/diff summary, and accept it without leaving the scene workbench.
- Boundary: route/layout separation remains intact and Storybook becomes the behavior sign-off for changed states.

- [ ] Mirror the new scene prose contract in the renderer runtime/client layer, including the new accept endpoint and any new view-model fields needed for pending revision candidate display.
- [ ] Extend `SceneProseTab.tsx` and `SceneProseContainer.tsx` so Scene / Draft / Prose now supports:

```text
current prose draft reader
existing revision mode chooser
short revision brief input
pending revision candidate card
diff summary
accept revision action
stable footer/status summary
```

- [ ] Keep the main-stage task clear and local:
  - revision mode and brief input stay component-local
  - route remains `scope=scene&id=...&lens=draft&tab=prose`
  - no new pane-state ownership moves into the feature layer
- [ ] Add tests proving:
  - requesting or accepting a revision refetches the prose read model through the runtime client
  - `window.location.search` does not change while selecting mode, typing a brief, or accepting a revision
  - current prose stays visible until acceptance swaps in the accepted candidate
  - app-level smoke now covers `run -> accept review -> open prose -> request revision -> accept revision -> chapter/book update`
- [ ] Update Storybook for the changed workbench surfaces, at minimum:
  - `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
  - `packages/renderer/src/features/run/components/RunArtifactInspectorPanel.stories.tsx`
- [ ] Add or rename stories so MCP acceptance can inspect:

```text
Mockups/Scene/Prose -> GeneratedFromAcceptedRun
Mockups/Scene/Prose -> RevisionCandidatePendingReview
Mockups/Scene/Prose -> AcceptedRevisionCurrentDraft
Business/Run/Artifact Inspector -> ProseDraftWithContextRef
```

- [ ] Review this bundle, then commit it alone.

**Verification commands:**

```bash
pnpm --filter @narrative-novel/renderer test -- api-project-runtime.test.ts App.scene-runtime-smoke.test.tsx SceneProseContainer.test.tsx RunArtifactInspectorPanel.test.tsx
pnpm --filter @narrative-novel/renderer build-storybook
```

## Storybook And MCP Acceptance

After Bundles 2 and 4 pass locally:

- [ ] Start Storybook for renderer:

```bash
pnpm --filter @narrative-novel/renderer storybook
```

- [ ] Use Storybook MCP structured snapshots, not screenshot-only checks, on:

```text
Mockups/Scene/Prose -> GeneratedFromAcceptedRun
Mockups/Scene/Prose -> RevisionCandidatePendingReview
Mockups/Scene/Prose -> AcceptedRevisionCurrentDraft
Business/Run/Artifact Inspector -> ProseDraftWithContextRef
```

- [ ] Confirm from the structured snapshot that:
  - Scene / Draft / Prose remains inside the workbench surface
  - the revision candidate is presented as a reviewable artifact/candidate, not as already-accepted truth
  - the prose artifact exposes its linked context packet
  - no new page shell, dashboard layout, or pane ownership drift was introduced

## Phase Gate A Acceptance

### Structure Acceptance

- `scenePlannerGateway` remains intact and provider-agnostic at the route layer.
- A dedicated `sceneProseWriterGateway` exists and is the only real-generation seam for prose drafting/revision in Phase 1.
- A backend-owned `sceneContextBuilder` persists explainable context packet truth.
- Revision candidate state is separate from current prose truth until accept.

### Behavior Acceptance

- `Run Scene -> Accept / Accept With Edit -> Open Prose` shows model-backed prose or explicit fixture fallback, not deterministic fixture body only.
- The prose artifact can identify its source canon patch, source proposal ids, and source context packet id.
- A user can request a prose revision with a short instruction, inspect the candidate and diff summary, then accept it.
- After accept revision, Scene / Draft / Prose, chapter draft assembly, and book draft assembly all read the accepted prose.

### Boundary Acceptance

- No prompt editor, no RAG, no streaming, no Temporal, no project store, no model settings UI.
- No route/layout boundary drift in renderer.
- No raw model payloads, prompts, full context packets, or prose bodies are embedded in run event payloads.
- Canon truth still comes only from accepted canon patch; prose remains a rendered artifact/read model.

## Final Verification

- [ ] Run focused package verification:

```bash
pnpm --filter @narrative-novel/api test -- sceneRunWorkflow.test.ts sceneRunWorkflow.parity.test.ts runFixtureStore.test.ts createServer.run-flow.test.ts createServer.run-artifacts.test.ts createServer.write-surfaces.test.ts createServer.prose-revision.test.ts createServer.read-surfaces.test.ts createServer.draft-assembly-regression.test.ts createServer.local-persistence.test.ts
pnpm --filter @narrative-novel/renderer test -- api-project-runtime.test.ts App.scene-runtime-smoke.test.tsx SceneProseContainer.test.tsx RunArtifactInspectorPanel.test.tsx
pnpm --filter @narrative-novel/renderer build-storybook
```

- [ ] Run repo-wide regression gates before claiming Gate A complete:

```bash
pnpm typecheck
pnpm test
pnpm verify:prototype
```

- [ ] If a manual live-provider smoke is requested, run it only after the stubbed suite passes, and record whether the result was:
  - real model success
  - explicit fixture fallback with reason
  - blocked by missing provider config


# PR29 Scene Prose Generation Vertical Slice Execution Plan

## Goal

Deliver the API-side vertical slice where an existing scene run can flow through:

```text
selected proposal variant -> accept / accept-with-edit -> canon patch artifact -> prose draft artifact -> scene prose read model
```

This bundle is API/doc scoped. Renderer implementation is out of scope unless a shared API contract file is clearly required.

## Bundle A Scope

### 1. Prose-draft artifact body contract

- Add `body?: LocalizedTextRecord` to `ProseDraftArtifactDetailRecord`.
- Generate deterministic fixture `body` in `buildProseDraftDetail(...)`.
- Body content must reflect:
  - scene name
  - accepted proposal id
  - selected variant effect / rationale when `selectedVariants` exists
  - fallback/default path when selected variants are absent
- Keep `excerpt` for list / summary / dock use.
- Never place prose body, prompt, context packet, or LLM output into run event metadata.

### 2. Pure materialization mapper

- Add `packages/api/src/orchestration/sceneRun/sceneRunProseMaterialization.ts`.
- Export `buildSceneProseFromProseDraftArtifact(input)`.
- Map `ProseDraftArtifactDetailRecord` plus optional `CanonPatchArtifactDetailRecord` and optional `ProposalSetArtifactDetailRecord` to:
  - `proseDraft`
  - `draftWordCount`
  - `statusLabel`
  - `latestDiffSummary`
  - `traceSummary`
- Export `buildAcceptedFactsFromCanonPatch(canonPatch)`.

Mapping rules:

- `proseDraft <- body?.en ?? excerpt.en`
- `draftWordCount <- wordCount`
- `statusLabel <- statusLabel.en or Generated from id`
- `latestDiffSummary <- summary.en`
- `traceSummary.sourcePatchId <- sourceCanonPatchId`
- `traceSummary.sourceProposals <- sourceProposalIds plus selected variant summary`
- `traceSummary.acceptedFactIds <- canonPatch.acceptedFacts[].id`
- `traceSummary.relatedAssets <- proseDraft.relatedAssets`
- `missingLinks <- []`
- `SceneProseViewModel` remains a string view-model; do not put `LocalizedTextRecord` directly into it.

### 3. Fixture repository sync

- After accepted review transitions, find latest `prose-draft`, `canon-patch`, and `proposal-set` details through existing run artifact listing/detail access.
- Only `accept` / `accept-with-edit` with a `prose-draft` artifact may update `scene.prose`.
- `request-rewrite` and `reject` must not generate or overwrite prose.
- Completed reject without prose-draft must not overwrite current scene prose.
- A second accepted run may overwrite scene prose as the latest accepted run.
- Sync accepted facts into:
  - `scene.execution.acceptedSummary.acceptedFacts`
  - `scene.inspector.context.acceptedFacts`
- Sync chapter structure scene row `proseStatusLabel` to generated/updated when materialization occurs.

### 4. API tests

- Mapper tests:
  - body mapping
  - excerpt fallback
  - source patch
  - source proposals / selected variants
  - related assets
  - accepted facts
  - no run event payload dependency
- Run flow tests:
  - accept materializes prose
  - accept-with-edit materializes prose
  - reject/request-rewrite do not materialize
  - events stay lightweight
  - chapter metadata updates
- Run artifact tests:
  - prose-draft has body and excerpt
  - selected variants retained
  - canon-patch/prose-draft source relation retained
  - PR28 context-packet activation trace remains artifact-detail only

### 5. Docs

- Add this PR29 execution plan document.
- Update `doc/api-contract.md` minimally for `ProseDraftArtifactDetailRecord.body`.
- Update `README.md` current status only if there is already a relevant API-side status section.

## Acceptance Constraints

- Existing endpoints are enough:
  - `POST /api/projects/{projectId}/runs/{runId}/review-decisions`
  - `GET /api/projects/{projectId}/runs/{runId}/artifacts`
  - `GET /api/projects/{projectId}/runs/{runId}/artifacts/{artifactId}`
  - `GET /api/projects/{projectId}/runs/{runId}/trace`
  - `GET /api/projects/{projectId}/scenes/{sceneId}/prose`
- Do not add endpoints.
- Do not add route params.
- Do not add true LLM integration.
- Do not add Temporal, SSE, prompt editor, policy mutation, RAG, branch, publish, or spatial blackboard scope.
- Run events must stay lightweight: no prose body, prompt, context packet, or LLM output in event metadata.
- Prose must be materialized from prose-draft artifact detail into the scene prose read model.
- Do not hard-code `scene.prose` directly without source artifact relation.
- Preserve selected variant provenance through proposal-set, canon-patch, prose-draft, scene prose trace, and source summary.

## Verification

Run:

```bash
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/api test
```

Prefer targeted Vitest commands for changed API tests first when local dependencies are available.

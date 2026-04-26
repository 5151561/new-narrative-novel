# Post-PR34 Roadmap + PR35 AI Execution Plan

> Source branch: `codex/pr34-workbench-experience-contract-hardening`
>
> Recommended new branch: `codex/pr35-scene-review-gate-main-stage-correction`
>
> Purpose: close the most important deferred Workbench Constitution issue after PR34 before adding more VS Code-like features. Specifically: waiting-review `accept / accept-with-edit / request-rewrite / reject` decisions must live in the Scene / Orchestrate Main Stage, not in the Bottom Dock.

---

## 0. Final instruction to the AI coding agent

You are not building a new product feature in this PR.

Do **not** implement Status Bar, Quick Open, Split Editor, command palette, new backend, SSE, Temporal, worker process, prompt editor, context policy mutation, RAG, desktop packaging, or a new scope/lens.

Your only job is to correct Scene runtime review ownership:

1. The Bottom Dock may show run status, events, artifacts, trace, problems, cost, and diagnostics.
2. The Bottom Dock must not contain primary review decision buttons.
3. `RunReviewGate` / `accept / accept-with-edit / request-rewrite / reject` must be owned by Scene / Orchestrate Main Stage.
4. Proposal variant selections may still be inspected/selected through artifact support surfaces, but the final review decision must be submitted from Main Stage.
5. Preserve existing API contracts and fixture backend behavior.
6. Preserve route/layout/editor boundaries from PR34.
7. Add tests and Storybook coverage that fail if review decisions drift back into the dock.

If you find broader scene runtime UX issues, record them in the audit doc or a small follow-up note. Do not broaden this PR.

---

## 1. Mandatory reading before coding

Read these files first, in this order:

```text
doc/frontend-workbench-constitution.md
doc/review/post-pr33-workbench-surface-audit.md
doc/post-pr33-workbench-correction-ai-execution-plan.md
packages/renderer/src/features/scene/components/SceneExecutionTab.tsx
packages/renderer/src/features/scene/components/SceneBottomDock.tsx
packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
packages/renderer/src/features/scene/containers/scene-run-session-context.tsx
packages/renderer/src/features/run/components/RunReviewGate.tsx
packages/renderer/src/features/run/hooks/useRunProposalVariantDraft.ts
packages/renderer/src/features/run/hooks/useSceneRunSession.ts
packages/renderer/src/features/run/api/run-records.ts
```

Then run this diagnostic grep:

```bash
grep -R "RunReviewGate\|onSubmitReviewDecision\|submitDecision\|accept-with-edit\|request-rewrite" \
  packages/renderer/src/features/scene \
  packages/renderer/src/features/run \
  --exclude-dir=node_modules \
  --exclude='*.test.tsx' \
  --exclude='*.stories.tsx' \
  || true
```

The grep is diagnostic. Do not blindly delete matches.

---

## 2. Current diagnosis after PR34

PR34 successfully hardened the shared Workbench shell, editor context tabs, bottom dock frame, Storybook contract states, and route/layout/editor boundaries.

However, its audit explicitly deferred one product-boundary issue:

```text
SceneBottomDock embeds RunReviewGate in active run support.
This may be a primary run-review decision action in the dock.
Move only in a dedicated scene runtime UX slice.
```

Current code shape to verify:

1. `SceneExecutionTab.tsx` already imports and renders `RunReviewGate` inside Main Stage when the run is `waiting_review`.
2. `SceneBottomDock.tsx` also imports and renders `RunReviewGate` inside the events/support dock when the run is `waiting_review`.
3. `SceneDockContainer.tsx` currently owns proposal-set artifact lookup and `useRunProposalVariantDraft(...)` so selected proposal variants are available in the dock path.
4. `SceneExecutionContainer.tsx` currently submits review decisions through `runSession.submitDecision`, but does not receive the dock-owned selected variant draft.

The PR35 problem is therefore not simply “delete a component.” It is:

```text
Move the final review decision authority to Main Stage
while preserving proposal variant selection context.
```

---

## 3. Product invariants

These are non-negotiable.

### 3.1 Bottom Dock is support only

Allowed in Bottom Dock:

```text
run status
recent run milestones
events
artifact list / artifact detail
proposal variant support selector
trace
problems
cost / diagnostics
links or hints back to Main Stage
```

Forbidden in Bottom Dock:

```text
Accept
Accept With Edit
Request Rewrite
Reject
primary canon-writing decision forms
primary prose-writing decisions
```

### 3.2 Main Stage owns waiting-review decisions

When a scene run is `waiting_review`, Scene / Orchestrate Main Stage must present the review decision gate.

The user should not need to open or maximize the Bottom Dock to accept, edit-accept, request rewrite, or reject.

### 3.3 Proposal variant choices are not canon

Variant selection remains a draft/support state until the Main Stage review decision is submitted.

The UI must continue to communicate:

```text
proposal variant choice -> review decision -> canon patch -> prose draft
```

### 3.4 No route/layout/editor state regression

Do not write selected variants, pending review form state, pane visibility, pane sizes, opened tabs, or dock state into URL.

Do not create a second active scene / active run / active lens truth source.

---

## 4. Explicit non-goals

Do not do any of these in PR35:

```text
Status Bar
Quick Open
Command Palette
Split editor groups
Tab drag/drop
Dirty editor state
New route schema
New API endpoint
Fixture API behavior rewrite
Real SSE
Temporal
Worker process
Persistent DB
Prompt editor
Context policy mutation
RAG/vector search
Spatial Blackboard / Blender
Desktop packaging
Book/Chapter/Asset feature work
```

Do not restyle the whole scene workspace.

---

## 5. Required deliverables

### Deliverable A — Main-stage review gate owns selected variants

Update Scene / Orchestrate so that the Main Stage `RunReviewGate` receives the same selected proposal variants that are currently submitted from the dock path.

Recommended implementation approach:

1. Lift proposal variant draft state out of `SceneDockContainer` and into a shared scene run review state.
2. The most natural place is `scene-run-session-context.tsx`, either by extending the existing `SceneRunSessionProvider` value or by adding a sibling provider exported from the same module.
3. Keep the state local UI support state. It must not become route state.
4. Use existing hooks:

```text
useRunArtifactsQuery(activeRunId)
useRunArtifactDetailQuery({ runId: activeRunId, artifactId: proposalSetArtifactId })
useRunProposalVariantDraft({ runId: activeRunId, proposalSetArtifact })
```

5. Expose a small review/variant object to both Main Stage and Bottom Dock, for example:

```ts
interface SceneRunReviewVariantDraft {
  proposalSetArtifactId: string | null
  selectedVariantsByProposalId: Record<string, string>
  selectedVariantsForSubmit: RunSelectedProposalVariantRecord[]
  selectVariant: (proposalId: string, variantId: string) => void
  resetVariants: () => void
  isLoadingProposalSet: boolean
  proposalSetError: Error | null
}
```

Do not overfit this exact shape if the current code suggests a smaller shape, but keep the ownership shared and local.

### Deliverable B — remove primary decisions from `SceneBottomDock`

Update `SceneBottomDock.tsx` so that it no longer imports or renders `RunReviewGate`.

The dock may still show a waiting-review summary, for example:

```text
Waiting review
This run has proposals awaiting a Main Stage review decision.
Selected variants: N
Open Scene / Orchestrate to submit the decision.
```

Do not include `Accept`, `Accept With Edit`, `Request Rewrite`, or `Reject` buttons in the dock.

Remove these from dock props if no longer needed there:

```text
isSubmittingReviewDecision
onSubmitReviewDecision
selectedVariantsForSubmit if only used by RunReviewGate
```

Keep these if still needed for artifact/variant support:

```text
selectedVariants
onSelectProposalVariant
onSelectArtifact
onOpenAssetContext
```

### Deliverable C — update `SceneExecutionTab` / `SceneExecutionContainer`

Update `SceneExecutionRunSessionViewModel` so that Main Stage review gate can submit selected variants.

Suggested fields:

```ts
selectedVariantsForSubmit?: RunSelectedProposalVariantRecord[]
variantSelectionSummary?: string
```

Then pass them into `RunReviewGate`:

```tsx
<RunReviewGate
  runTitle={activeRun.title}
  pendingReviewId={runSession.pendingReviewId}
  isSubmitting={runSession.isSubmittingDecision}
  selectedVariants={runSession.selectedVariantsForSubmit ?? []}
  variantSelectionSummary={runSession.variantSelectionSummary}
  onSubmitDecision={runSession.onSubmitDecision}
/>
```

The exact prop path may differ after provider refactor. Preserve the existing `RunReviewGate` component unless a tiny prop typing change is required.

### Deliverable D — keep dock variant selection support intact

If proposal variant selection currently happens from artifact detail support in the Bottom Dock, keep that support.

But make the language clear:

```text
Selecting variants here prepares the Main Stage review decision.
It does not write canon.
```

Variant support may live in dock/artifact support because it is inspection/diagnostic context. The canon-writing decision must live in Main Stage.

### Deliverable E — tests

Update or add tests in the smallest suitable files.

Expected files:

```text
packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx
packages/renderer/src/features/scene/components/SceneBottomDock.test.tsx
packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.test.tsx
packages/renderer/src/features/scene/containers/scene-run-session-context.test.tsx
packages/renderer/src/features/run/components/RunReviewGate.test.tsx
```

Do not force all of these files if smaller coverage is sufficient, but cover the behavior.

Required test cases:

1. `SceneBottomDock` with a `waiting_review` run does **not** render `Accept`, `Accept With Edit`, `Request Rewrite`, or `Reject` decision controls.
2. `SceneBottomDock` still renders support status / events / artifact / trace content.
3. `SceneExecutionTab` with a `waiting_review` run renders the review gate in Main Stage.
4. Main Stage `RunReviewGate` submits selected variants when decision is `accept` or `accept-with-edit`.
5. Main Stage `RunReviewGate` does not submit selected variants for `reject` or `request-rewrite` unless current API rules intentionally require otherwise.
6. Selecting a variant in the shared draft state is reflected in the Main Stage review gate summary.
7. Route state does not change when variant selections change.
8. Bottom dock tab navigation/a11y from PR34 remains passing.

### Deliverable F — Storybook states

Add or update a small Storybook state proving the corrected ownership.

Preferred options:

```text
Scene / Orchestrate / WaitingReviewMainStageGate
Scene / Dock / WaitingReviewSupportOnly
```

or equivalent existing story names.

Acceptance for the story:

1. Main Stage shows review decision controls.
2. Bottom Dock shows waiting-review support only.
3. Variant selection support, if visible, is described as draft/support context.
4. No real API dependency.
5. No new product page.

### Deliverable G — audit doc update

Update:

```text
doc/review/post-pr33-workbench-surface-audit.md
```

Add a short PR35 follow-up section:

```md
## PR35 follow-up: Scene run review gate ownership

- Moved primary waiting-review decision controls out of SceneBottomDock.
- Main Stage now owns accept / accept-with-edit / request-rewrite / reject for active scene runs.
- Bottom Dock remains support-only for events / artifacts / trace / problems.
- Selected proposal variants remain draft context and travel with Main Stage accept decisions.
- Tests / Storybook states added: ...
```

Do not rewrite the whole audit document.

---

## 6. File touch map

### Expected

```text
packages/renderer/src/features/scene/components/SceneExecutionTab.tsx
packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx
packages/renderer/src/features/scene/components/SceneBottomDock.tsx
packages/renderer/src/features/scene/components/SceneBottomDock.test.tsx
packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx
packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.test.tsx
packages/renderer/src/features/scene/containers/scene-run-session-context.tsx
packages/renderer/src/features/scene/containers/scene-run-session-context.test.tsx
packages/renderer/src/features/run/components/RunReviewGate.tsx
packages/renderer/src/features/run/components/RunReviewGate.test.tsx
doc/review/post-pr33-workbench-surface-audit.md
```

### Allowed only if necessary

```text
packages/renderer/src/features/scene/containers/SceneWorkspace.tsx
packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.stories.tsx
packages/renderer/src/features/run/hooks/useRunProposalVariantDraft.ts
packages/renderer/src/features/run/hooks/useSceneRunSession.ts
packages/renderer/src/app/i18n/index.tsx
```

Only touch these if required by typing, story coverage, or language copy.

### Do not touch

```text
packages/api/**
packages/desktop/**
API route contracts
fixture backend behavior
pnpm-lock.yaml
Workbench layout/editor shell files unless a failing test proves this slice needs them
```

---

## 7. Implementation order

### Step 1 — baseline checks

Run:

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
```

If baseline fails before changes, record the failure in the final response and continue only if the failure is unrelated to this PR. Do not hide unrelated failures.

### Step 2 — map the current decision path

Inspect:

```text
SceneExecutionContainer -> SceneExecutionTab -> RunReviewGate
SceneDockContainer -> SceneBottomDock -> RunReviewGate
```

Write down which props currently only exist in the dock path, especially selected proposal variants.

### Step 3 — lift or share proposal variant draft state

Move proposal variant draft state to a shared scene run state layer so both the dock support surface and main-stage review gate can read it.

Keep this state local and route-free.

### Step 4 — wire Main Stage gate

Update Scene / Orchestrate Main Stage so the review gate receives:

```text
selectedVariantsForSubmit
variantSelectionSummary
isSubmittingReviewDecision
onSubmitReviewDecision
```

Make sure `accept` and `accept-with-edit` carry selected variants.

### Step 5 — remove dock decision gate

Remove `RunReviewGate` from `SceneBottomDock` and replace it with support-only waiting-review messaging.

### Step 6 — update tests

Add tests for the ownership rule, not just text rendering.

### Step 7 — update Storybook

Add or update the waiting-review corrected-state story.

### Step 8 — update audit note

Add the PR35 follow-up entry to `doc/review/post-pr33-workbench-surface-audit.md`.

### Step 9 — final checks

Run:

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer build-storybook
pnpm typecheck
pnpm test
```

If `build-storybook` is too slow or unsupported in the environment, run it if feasible and record honestly if not run. Do not claim it passed without running it.

---

## 8. Manual review checklist

### 8.1 Scene / Orchestrate waiting review

Open a scene with an active run in `waiting_review`.

Expected:

```text
Main Stage shows Pending Review decision controls.
Accept / Accept With Edit / Request Rewrite / Reject are visible in Main Stage.
Variant selection summary is visible in or near the Main Stage review gate when variants exist.
Submitting Accept sends selectedVariants.
```

### 8.2 Bottom Dock support-only behavior

Open Bottom Dock events/support tab for the same waiting-review run.

Expected:

```text
Dock shows run status / events / artifacts / trace support.
Dock does not show Accept / Accept With Edit / Request Rewrite / Reject controls.
Dock may show selected variant support summary or artifact selector.
Dock language says final review decision happens in Main Stage.
```

### 8.3 Route/layout/editor boundaries

While changing variant selections and opening/hiding dock:

Expected:

```text
URL does not gain variant/dock/layout params.
Editor tabs do not multiply by proposal/artifact/review issue.
Navigator/Inspector/Dock visibility preferences remain local layout state.
```

---

## 9. Acceptance criteria

PR35 is complete only if all are true:

1. `SceneBottomDock` no longer imports or renders `RunReviewGate`.
2. Bottom Dock contains no primary review decision buttons for waiting-review runs.
3. Scene / Orchestrate Main Stage owns `accept / accept-with-edit / request-rewrite / reject` decisions.
4. Selected proposal variants still travel with Main Stage accept decisions.
5. Existing run/review API contract is unchanged.
6. Existing fixture backend behavior is unchanged.
7. Route/layout/editor boundaries remain intact.
8. Tests cover Main Stage ownership and Bottom Dock support-only behavior.
9. Storybook includes a corrected waiting-review state or equivalent story coverage.
10. `doc/review/post-pr33-workbench-surface-audit.md` records the PR35 closure.
11. Final checks are run or honestly reported.

---

## 10. Automatic failure conditions

Fail the PR if any of these happen:

1. `RunReviewGate` remains rendered inside `SceneBottomDock`.
2. Bottom Dock still contains primary accept/rewrite/reject actions.
3. Main Stage review gate loses selected proposal variants.
4. Variant selection is written into the URL.
5. A new route schema is introduced for this correction.
6. A new API endpoint is introduced.
7. Fixture backend behavior changes.
8. The PR adds Status Bar, Quick Open, Split Editor, backend, SSE, Temporal, worker, or prompt editor work.
9. The PR bypasses `WorkbenchShell` or creates a new page-like review surface.
10. Tests only assert text presence and do not lock the surface ownership boundary.

---

## 11. Follow-up roadmap after PR35

Only after PR35 passes, continue with this order.

### PR36 — Workbench Status Bar + Runtime / Project Signals

Goal: add a low-noise VS Code-style status strip for environment awareness.

Do:

```text
project id
runtime mode: mock / api / desktop-local
API health summary
active scope / lens
active run status summary
open review count / warning count if already available
last update / save-like label if already available
```

Do not make it an action wall. Status Bar is signals first, not workflow.

### PR37 — Quick Open / Object Jump Foundation

Goal: add `Cmd/Ctrl+P`-style object jump.

Do:

```text
fixture index for Book / Chapter / Scene / Asset / Review issue
Quick Open overlay
keyboard open/close
select item -> replaceRoute + open editor context
```

Do not build full-text search, vector search, or global command palette in this PR.

### PR38 — Editor Split / Two-column Compare Foundation

Goal: introduce minimal two-group editor split after tabs and quick navigation are stable.

Do:

```text
single group -> two groups
open to side
active group id local state
compare-ready layout for Book Draft / Scene Draft
```

Do not add drag/drop, arbitrary split grids, dirty state, or full compare workflow.

### PR39 — Runtime Persistence / SSE Preparation Slice

Goal: start reducing fixture limitations without jumping to Temporal.

Do:

```text
small product event-store boundary
artifact-store interface
optionally wire /events/stream behind fixture-safe behavior
keep REST polling as fallback
```

Do not replace the whole backend. Do not make Temporal the first backend follow-up unless explicitly requested.

### PR40 — Chapter / Book Draft Assembly Regression

Goal: return to business workflow after workbench UX foundations are stable.

Do:

```text
scene prose -> chapter draft assembly
chapter draft -> book read/compare/export readiness
trace links remain visible
missing prose gaps are explicit
```

---

## 12. Final response template for the AI agent

When done, respond with:

```md
## Summary
- ...

## Fixed Workbench constitution issue
- Moved waiting-review primary decisions from Bottom Dock to Main Stage.
- ...

## Behavior preserved
- Variant selection remains draft/support state.
- Existing API contracts unchanged.
- Route/layout/editor boundaries preserved.

## Tests / checks run
- `pnpm --filter @narrative-novel/renderer typecheck` — pass/fail
- `pnpm --filter @narrative-novel/renderer test` — pass/fail
- `pnpm --filter @narrative-novel/renderer build-storybook` — pass/fail/not run with reason
- `pnpm typecheck` — pass/fail
- `pnpm test` — pass/fail

## Deferred issues
- ...

## Constitution compliance
- Bottom Dock support-only: yes/no
- Main Stage primary task preserved: yes/no
- No new business feature added: yes/no
- No API/backend/desktop change: yes/no
```

Do not claim success if checks were not run.

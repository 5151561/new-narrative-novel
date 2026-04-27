# Post-Phase1 Parallel Roadmap for PR54-PR68

> Source roadmap: `doc/real-project-long-term-roadmap-pr51-pr68.md`  
> Research basis: `doc/pr51-pr68-parallel-development-research-report.md`  
> Date: 2026-04-27  
> Audience: Codex / Sub-Agent coordinators  
> Status: executable roadmap  
> Parallel policy: high-confidence parallel only; no conditional parallel

---

## 0. Executive Decision

This roadmap starts **after Phase 1**.

`PR51-PR53` are treated as a prerequisite serial foundation. They are not rescheduled here, and they are not candidates for parallel execution in this document.

From `PR54` onward, the roadmap is:

```text
PR54           -> serial foundation
PR55-PR57      -> first parallel wave
PR58-PR61      -> serial writing spine
PR62-PR65      -> second parallel wave
PR66-PR67      -> third parallel wave
PR68           -> serial release-candidate lock
```

This is intentionally more conservative than the research report:

- `PR59` and `PR60` are no longer treated as a conditional-parallel pair.
- every parallel wave gets a short serial integration bundle for shared hot files.
- file-conflict avoidance wins over theoretical throughput.

## 1. Non-Negotiable Scheduling Rules

### 1.1 Phase 1 is out of scope

This document assumes:

```text
Gate A passed
```

Do not start `PR54+` mainline execution until the real scene loop is already accepted.

### 1.2 Parallel only happens inside approved waves

Allowed parallel windows:

- Wave 1: `PR55 + PR56 + PR57`
- Wave 6: `PR62 + PR63 + PR64 + PR65`
- Wave 7: `PR66 + PR67`

Everything else is serial.

### 1.3 No conditional parallel

The following are explicitly serial even if they look splittable:

- `PR54`
- `PR58`
- `PR59`
- `PR60`
- `PR61`
- `PR68`

### 1.4 Reviewed-bundle cadence is mandatory

For every bundle:

```text
implement all tasks in the bundle
-> one combined spec/code review
-> fix if needed
-> re-review
-> commit
```

Do not review half-finished bundles.  
Do not commit before review passes.

### 1.5 Worktree policy

- serial waves: open a new branch and work inline
- parallel waves: one worktree per worker branch
- do not keep old worktrees alive across waves unless the next wave explicitly reuses them

### 1.6 Frontend verification policy

Any renderer-facing bundle that changes workbench surfaces, run flow, review flow, route state, layout-visible runtime state, or draft surfaces must:

- update Storybook states
- use MCP structured snapshot plus screenshot evidence
- keep `WorkbenchShell` ownership, `scope x lens`, and route/layout boundaries intact

### 1.7 Shared hot files are not worker-owned by default

These files are treated as integration hot spots:

- `packages/api/src/createServer.ts`
- `packages/renderer/src/App.tsx`
- `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts`
- `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`
- `apps/desktop/src/main/main.ts`

In parallel waves, workers should avoid touching them unless the roadmap assigns ownership explicitly.  
If multiple bundles need them, a short serial integration bundle closes the wave.

## 2. Delivery Map

| Wave | PRs | Mode | Unlocks |
| --- | --- | --- | --- |
| Wave 0 | `PR54` | serial | real project truth baseline |
| Wave 1 | `PR55 + PR56 + PR57` | parallel | `Gate B` |
| Wave 2 | `PR58` | serial | chapter backlog truth |
| Wave 3 | `PR59` | serial | chapter run orchestration |
| Wave 4 | `PR60` | serial | chapter draft assembly |
| Wave 5 | `PR61` | serial | `Gate C` |
| Wave 6 | `PR62 + PR63 + PR64 + PR65` | parallel | `Gate D` |
| Wave 7 | `PR66 + PR67` | parallel | desktop + durable execution closure |
| Wave 8 | `PR68` | serial | `Gate E` |

## 3. Wave 0: PR54 Serial Foundation

### Goal

Finish `PR54 Local Project Store v1` as the one allowed truth foundation for all later waves.

### Why serial

`PR55/56/57` all depend on a stable answer to:

```text
where project identity lives
where artifact truth lives
how schema versioning and persistence work
what is fixture/demo vs real project truth
```

### Primary seams

- `packages/api/src/repositories/project-state-persistence.ts`
- `packages/api/src/repositories/**`
- `packages/api/src/routes/**`
- `apps/desktop/src/main/project-store.ts`
- `apps/desktop/src/main/project-store.test.ts`
- `apps/desktop/src/main/project-picker.ts`
- `packages/renderer/src/app/project-runtime/project-persistence.ts`

### Exit criteria

- create non-fixture project
- create book/chapter/scene
- run and save real scene state
- restart API/desktop and read the same state back

### Verification floor

```bash
pnpm typecheck
pnpm test
pnpm verify:prototype
pnpm typecheck:desktop
pnpm test:desktop
```

## 4. Wave 1: PR55-PR57 Parallel

### Goal

Use the `PR54` foundation to close:

- project lifecycle
- runtime identity separation
- model binding and credential storage

### Worker A — PR55 Project Create / Open / Backup / Migration

**Tasks**

- task 1: create/open/recent project flow
- task 2: migration check + automatic backup + manual backup/export path

**Primary ownership**

- `apps/desktop/src/main/project-store.ts`
- `apps/desktop/src/main/project-picker.ts`
- `apps/desktop/src/main/recent-projects.ts`
- `apps/desktop/src/main/recent-projects.test.ts`
- `packages/api/src/repositories/project-state-persistence.ts`
- migration/backup tests near the same persistence seam

**Must not own**

- `apps/desktop/src/main/main.ts`
- renderer runtime badge/status UI

### Worker B — PR56 Fixture-to-Real Runtime Boundary

**Tasks**

- task 1: runtime mode contract for fixture/mock/real project
- task 2: degraded-state behavior and no-silent-mock fallback in real project mode

**Primary ownership**

- `packages/renderer/src/app/runtime/runtime-config.ts`
- `packages/renderer/src/app/runtime/useRuntimeConfig.ts`
- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBoundary.tsx`
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
- `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts`
- `packages/api/src/routes/project-runtime.ts`

**Must not own**

- `packages/renderer/src/App.tsx`
- desktop credential bridge

### Worker C — PR57 Model Binding / Credential Store v1

**Tasks**

- task 1: desktop credential bridge and safe secret handling
- task 2: model binding for planner/prose/revision/cheap-review paths

**Primary ownership**

- `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
- `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts`
- `packages/api/src/orchestration/modelGateway/sceneProseWriterGateway.ts`
- `packages/api/src/orchestration/modelGateway/sceneProseWriterOpenAiResponsesProvider.ts`
- `apps/desktop/src/shared/desktop-bridge-types.ts`
- `apps/desktop/src/preload/desktop-api.ts`
- `apps/desktop/src/preload/index.ts`
- `apps/desktop/src/main/main.ts`
- credential/model-binding tests adjacent to those files

**Must not own**

- project migration flow
- renderer degraded/runtime-mode presentation beyond model-config entry points

### Integration bundle

After all three workers pass review, run one short integration bundle to touch shared glue only if needed:

- `packages/api/src/createServer.ts`
- `packages/renderer/src/App.tsx`
- `packages/renderer/src/app/providers.tsx`

### Exit gate

```text
Gate B passed
```

The real-user flow must work:

```text
Create real project
-> configure model
-> create scene
-> run / prose / revise
-> close app
-> reopen
-> continue
```

## 5. Wave 2: PR58 Serial Chapter Backlog

### Goal

Finish `PR58 Chapter Planning and Scene Backlog` before any chapter-scale orchestration starts.

### Why serial

This wave defines the accepted chapter scene order and scene status truth that `PR59-PR61` all consume.

### Primary seams

- `packages/api/src/routes/chapter.ts`
- `packages/renderer/src/features/chapter/api/**`
- `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts`
- `packages/renderer/src/features/chapter/components/ChapterStructureStage.tsx`
- `packages/renderer/src/features/chapter/components/ChapterBinderPane.tsx`
- `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
- affected Storybook/test files under `packages/renderer/src/features/chapter/**`

### Exit criteria

- chapter goal/constraints become real backlog input
- accepted scene plan becomes runnable scene order
- scene status is visible and stable

## 6. Wave 3: PR59 Serial Chapter Run Orchestration

### Goal

Finish `PR59 Chapter Run Orchestration v1` on top of the accepted backlog truth.

### Why serial

Without conditional parallel, this wave owns chapter-level execution semantics alone:

```text
prepare scene context
-> run planner/proposal
-> wait review
-> generate prose after accepted canon
-> update chapter draft status
```

### Primary seams

- `packages/api/src/orchestration/sceneRun/**`
- `packages/api/src/routes/chapter.ts`
- `packages/api/src/routes/run.ts`
- `packages/renderer/src/features/run/**`
- `packages/renderer/src/features/chapter/hooks/useChapterDraftActivity.ts`
- `packages/renderer/src/features/chapter/hooks/useChapterWorkbenchActivity.ts`
- `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.tsx`

### Exit criteria

- user can launch the next unfinished scene from chapter flow
- review gate is never skipped
- chapter drafted/missing/waiting-review states are coherent

## 7. Wave 4: PR60 Serial Chapter Draft Assembly

### Goal

Finish `PR60 Chapter Draft Assembly v2` only after `PR59` stabilizes chapter execution and status truth.

### Why serial

The chapter assembled read model must consume settled scene/prose status instead of co-evolving with orchestration.

### Primary seams

- `packages/renderer/src/features/chapter/components/ChapterAssemblyView.tsx`
- `packages/renderer/src/features/chapter/components/ChapterDraftReader.tsx`
- `packages/renderer/src/features/chapter/components/ChapterDraftInspectorPane.tsx`
- `packages/renderer/src/features/chapter/components/ChapterDraftBottomDock.tsx`
- `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts`
- `packages/renderer/src/features/traceability/hooks/useChapterDraftTraceabilityQuery.ts`
- related API read-model support in `packages/api/src/routes/chapter.ts`

### Exit criteria

- multi-scene prose reads as a real chapter draft
- missing scenes stay visibly missing
- transition prose is artifact-backed and traceable

## 8. Wave 5: PR61 Serial Book Assembly

### Goal

Finish `PR61 Book Draft / Manuscript Assembly v1` only after chapter draft truth is stable.

### Why serial

Book assembly must consume finished chapter draft truth, not redefine it.

### Primary seams

- `packages/api/src/routes/book.ts`
- `packages/api/src/createServer.draft-assembly-regression.test.ts`
- `packages/api/src/createServer.book-draft-live-assembly.test.ts`
- `packages/renderer/src/features/book/api/book-draft-assembly-records.ts`
- `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts`
- `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts`
- `packages/renderer/src/features/book/components/BookDraftReader.tsx`
- `packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx`

### Exit gate

```text
Gate C passed
```

The real-user flow must work:

```text
real project
-> chapter backlog
-> multi-scene run/review/prose
-> chapter assembly
-> book assembly
-> export readable manuscript
```

## 9. Wave 6: PR62-PR65 Parallel

### Goal

Close long-project quality control, asset truth, branch safety, and failure observability on top of the now-stable chapter/book spine.

### Worker A — PR62 Review Inbox / Continuity QA v1

**Tasks**

- task 1: review issue model for continuity/stale/missing-trace/export-readiness signals
- task 2: fix / dismiss / rewrite-request actions through the review flow

**Primary ownership**

- `packages/renderer/src/features/review/**`
- `packages/api/src/routes/review.ts`
- review-oriented tests and Storybook states

### Worker B — PR63 Asset Story Bible MVP

**Tasks**

- task 1: typed asset truth for character/location/organization/object/lore
- task 2: mentions/relations/state-timeline/visibility/context participation

**Primary ownership**

- `packages/renderer/src/features/asset/**`
- `packages/renderer/src/features/traceability/**`
- `packages/api/src/routes/asset.ts`
- asset/context/visibility test coverage

### Worker C — PR64 Checkpoint / Experiment Branch v1

**Tasks**

- task 1: checkpoint persistence and branch creation
- task 2: compare main vs branch and selectively adopt accepted changes

**Primary ownership**

- `packages/renderer/src/features/book/api/book-manuscript-checkpoints.ts`
- `packages/renderer/src/features/book/api/book-experiment-branches.ts`
- `packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.ts`
- `packages/renderer/src/features/book/components/BookDraftBranchView.tsx`
- `packages/renderer/src/features/book/components/BookExperimentBranchPicker.tsx`
- book-branch read-model support in `packages/api/src/routes/book.ts`

### Worker D — PR65 Failure Recovery / Cost / Observability v1

**Tasks**

- task 1: retry / error classification / cancel / partial-resume semantics
- task 2: cost usage and runtime summary visibility in supporting surfaces

**Primary ownership**

- `packages/api/src/orchestration/sceneRun/**`
- `packages/api/src/repositories/run-event-stream-broker.ts`
- `packages/api/src/routes/run.ts`
- `packages/api/src/routes/runArtifacts.ts`
- `packages/renderer/src/features/run/**`

### Integration bundle

After all four workers pass review, run one short integration bundle to close shared cross-lane glue only if needed:

- `packages/api/src/createServer.ts`
- `packages/renderer/src/App.tsx`
- shared route/state registration files touched by more than one worker

### Exit gate

```text
Gate D passed
```

The project must support:

```text
write multiple chapters
-> use assets as context truth
-> review inbox surfaces quality problems
-> branch/checkpoint for safe experiments
-> retry and cancellation without truth corruption
-> visible runtime/cost signals
```

## 10. Wave 7: PR66-PR67 Parallel

### Goal

Close the last two system-level gaps before dogfood lock:

- desktop real-project mode
- durable workflow execution and resume

### Worker A — PR66 Desktop Real Project Mode

**Tasks**

- task 1: real project open/create/recent project entry
- task 2: API/worker supervisor, health, restart, and runtime settings entry

**Primary ownership**

- `apps/desktop/src/main/project-store.ts`
- `apps/desktop/src/main/recent-projects.ts`
- `apps/desktop/src/main/project-picker.ts`
- `apps/desktop/src/main/local-api-supervisor.ts`
- `apps/desktop/src/main/worker-supervisor.ts`
- `apps/desktop/src/main/runtime-config.ts`
- desktop bridge/preload files needed for that surface

### Worker B — PR67 Durable Workflow Adapter v1

**Tasks**

- task 1: durable run state machine with persisted waiting-review / failed state
- task 2: review resume / retry / cancel contract without promoting workflow history to product truth

**Primary ownership**

- `packages/api/src/orchestration/**`
- `packages/api/src/repositories/**`
- `packages/api/src/routes/run.ts`
- `packages/api/src/routes/runArtifacts.ts`
- minimal renderer run-status hooks under `packages/renderer/src/features/run/**`

### Integration bundle

After both workers pass review, run one short integration bundle to close shared app wiring only if needed:

- `apps/desktop/src/main/main.ts`
- `packages/api/src/createServer.ts`
- `packages/renderer/src/App.tsx`

### Exit criteria

- desktop app can create/open real project without manual API startup
- app restart preserves waiting-review and failed-run state
- review can resume a durable run

## 11. Wave 8: PR68 Serial Release-Candidate Lock

### Goal

Freeze feature growth and validate one real dogfood project end-to-end.

### Why serial

This is a lock-and-fix wave, not a feature wave.  
Only P0/P1 blockers found by dogfood are allowed in scope.

### Primary seams

- real dogfood project data and verification docs
- bugfixes only in the exact subsystems proven broken
- no new horizons

### Exit gate

```text
Gate E passed
```

The release-candidate flow must work:

```text
Create/open real project
-> configure model
-> write 3 chapters / 10 scenes
-> revise prose
-> use assets
-> run branch experiment
-> export manuscript
-> backup
-> close/reopen
-> continue writing
```

## 12. What This Roadmap Explicitly Rejects

- no parallel `PR59 + PR60`
- no parallel wave that crosses a gate boundary
- no worker-owned reimplementation of `WorkbenchShell` or local layout state
- no fixture truth sneaking back into real-project flows
- no main-thread抢工 during active worker execution
- no commit before reviewed-bundle acceptance

## 13. Final Recommendation

If execution starts from this roadmap, the safest order is:

```text
finish Gate A outside this document
-> PR54
-> parallel Wave 1
-> PR58
-> PR59
-> PR60
-> PR61
-> parallel Wave 6
-> parallel Wave 7
-> PR68
```

This is slower than maximum-theoretical throughput, but it is the highest-confidence route that still gets meaningful parallelism where the repo already has the right seams.


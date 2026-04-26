# Post-PR36 Roadmap and PR37 AI Execution Plan

> Date: 2026-04-26  
> Source branch: `codex/pr36-book-draft-stability-regression-cleanup`  
> Recommended next branch: `codex/pr37-chapter-book-draft-assembly-regression`  
> Audience: AI coding agent / implementation agent  
> Scope: regression closure and minimal contract hardening after PR36

---

## 0. Executive Decision

PR36 has closed the immediate Book Draft duplicate React key stability issue. The next PR should **not** start a new backend, desktop feature, layout kernel, prompt editor, Temporal integration, SSE stream, or new product surface.

The next PR should be:

```text
PR37: Chapter / Book Draft Assembly Regression Closure
```

The purpose is to prove and, if needed, minimally repair this chain:

```text
selected proposal variant
  -> review accept / accept-with-edit
  -> canon patch
  -> prose draft artifact
  -> scene prose read model
  -> chapter draft assembly
  -> book draft read / compare / review / export-readiness trace
```

This is a regression and contract-closure PR. It should make the already-landed prose/review/artifact work feel coherent across Scene, Chapter, and Book draft surfaces.

---

## 1. AI Agent Implementation Instruction

Start from:

```bash
git checkout codex/pr36-book-draft-stability-regression-cleanup
git checkout -b codex/pr37-chapter-book-draft-assembly-regression
```

Then execute this plan without broadening the PR.

### Main Goal

Verify and harden the manuscript assembly path after prose generation / prose revision:

```text
Scene review decision accepted
  -> selected variant / edited proposal becomes canon patch
  -> prose-draft artifact is available
  -> Scene Draft / Prose surface reads it
  -> Chapter Draft assembly reads it
  -> Book Draft read / compare / review surfaces read it
  -> trace links still explain where the prose came from
```

### Do Not Do

This PR must not add or implement:

- real persistence / production database
- Temporal / durable workflow engine
- real SSE / WebSocket event streaming
- real LLM integration
- prompt editor
- RAG / vector search
- Asset Context Policy mutation
- domain-safe recipes
- desktop project picker / local file integration
- Workbench layout kernel changes
- editor tabs / command palette / status bar
- new dashboard-like UI
- new page-level route outside WorkbenchShell
- broad visual redesign

If a test exposes a missing contract that cannot be fixed without a new endpoint or major contract change, document the gap in the audit file and keep the implementation narrow.

---

## 2. Why PR37 Comes Next

The repository already has a substantial product/API scaffold: renderer, API runtime, scene run flows, artifact / trace read surfaces, Asset Context Policy read surfaces, and scene prose generation / revision surfaces. PR36 was a stability cleanup around duplicate Book Draft keys.

After PR36, the highest-value next step is not another new surface. It is to prove that prose and trace propagate consistently across the manuscript hierarchy:

```text
Scene -> Chapter -> Book
```

This PR should convert the current prose-generation vertical slice into a reliable cross-scope regression suite.

---

## 3. Mandatory Reading Before Coding

Read these files before making changes:

```text
README.md
AGENTS.md
doc/api-contract.md
doc/frontend-workbench-constitution.md
```

Also inspect the PR36 stability audit. Expected path:

```text
doc/review/post-pr35-book-draft-stability-audit.md
```

If that exact file path differs, search for:

```text
Book Draft Stability Audit
duplicate React key
export-readiness
review-blocker
stable identity
```

Then inspect the current tests and implementation around:

```text
packages/api/src/createServer.run-flow.test.ts
packages/api/src/createServer.prose-revision.test.ts
packages/api/src/createServer.read-surfaces.test.ts
packages/api/src/orchestration/sceneRun/**
packages/api/src/repositories/**

packages/renderer/src/features/scene/containers/SceneProseContainer.tsx
packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx

packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.tsx
packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx
packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx
packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts
packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx

packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.ts
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts

packages/renderer/src/features/traceability/**
```

If a listed file does not exist, find the nearest current equivalent by grepping for the feature name.

---

## 4. Workbench Constitution Compliance

This PR must not:

- bypass `WorkbenchShell`
- add page-like dashboards
- implement local pane layout
- duplicate shell state
- put primary work in Inspector or Bottom Dock
- mix route state with layout preference
- create a second selected-object truth source
- convert prose generation or review into a chat transcript
- inline large prompt / prose / raw LLM payload in run events

This PR must:

- preserve the Scope × Lens model
- preserve route as the business-state source of truth
- preserve layout as shell-owned local preference
- keep Main Stage ownership clear
- use existing Workbench surfaces
- preserve Scene / Chapter / Book handoff routes
- keep run events lightweight and ref-based
- keep prose as artifact/read model, not raw event metadata
- add tests for propagation and identity boundaries
- preserve or extend Storybook only when it documents the regression state

If implementation makes the product feel more like a generic web app than a Narrative IDE, the PR fails.

---

## 5. PR37 Deliverables

### 5.1 Add Audit Document

Create:

```text
doc/review/post-pr36-chapter-book-draft-assembly-regression-audit.md
```

Use this structure:

```md
# Post-PR36 Chapter / Book Draft Assembly Regression Audit

## Branch

- Source branch:
- PR branch:

## Summary

- What was verified
- What was fixed
- What was intentionally left unchanged

## Regression Chain

\`\`\`text
selected proposal variant
  -> review decision
  -> canon patch
  -> prose draft artifact
  -> scene prose read model
  -> chapter draft assembly
  -> book draft read / compare / review / export-readiness trace
\`\`\`

## Verification Matrix

| Flow | Expected propagation | Test / story | Result |
|---|---|---|---|
| Accept selected variant | Prose artifact and canon patch visible downstream |  |  |
| Accept with edit | Edited prose/canon source visible downstream |  |  |
| Reject / request rewrite | Does not overwrite existing prose |  |  |
| Scene prose surface | Reads current prose artifact/read model |  |  |
| Chapter draft assembly | Includes current scene prose and missing states |  |  |
| Book draft read | Includes chapter/scene prose in manuscript assembly |  |  |
| Book compare | Reports changed/missing prose without duplicate identities |  |  |
| Book review/export readiness | Issues point to stable scene/chapter/artifact identities |  |  |
| Trace | Links prose to proposal/canon/context/artifact refs |  |  |
| Duplicate key regression | No duplicate React key warnings in Book Draft |  |  |

## Files Changed

- 

## Commands Run

- 

## Deferred Follow-up

- Only list items that are outside PR37 scope.
```

### 5.2 API Regression Tests

Add or extend API tests so the contract proves:

1. `accept` review decision creates or exposes:
   - review decision result
   - canon patch ref
   - prose draft artifact ref
   - `canon_patch_applied` / `prose_generated` event refs, if those events exist in the current fixture contract
2. `accept-with-edit` preserves edited source / prose source semantics.
3. `reject` and `request-rewrite` do not overwrite existing prose draft state.
4. Scene prose read model can read the generated/revised prose.
5. Chapter/Book read surfaces receive the updated prose state through existing repository/read contracts.
6. Run events remain lightweight and ref-based.

Prefer extending existing tests:

```text
packages/api/src/createServer.run-flow.test.ts
packages/api/src/createServer.prose-revision.test.ts
packages/api/src/createServer.read-surfaces.test.ts
```

If needed, add a narrow new file:

```text
packages/api/src/createServer.draft-assembly-regression.test.ts
```

Do not add a new endpoint unless the existing contract cannot express the propagation. If that happens, document it as a gap instead of expanding the PR.

### 5.3 Renderer Mapper / Query Regression Tests

Add or extend renderer tests for:

#### Chapter Draft

- Scene prose generated from accepted review appears in chapter draft assembly.
- Revised prose appears after prose revision / accept-with-edit fixture state.
- Missing prose states are still represented as gaps, not empty successful prose.
- Scene IDs / chapter IDs remain stable.

Likely files:

```text
packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx
packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx
```

#### Book Draft Read

- Book draft manuscript assembly includes the current scene prose.
- Word counts / readiness / scene count do not regress.
- Missing scene draft states are represented clearly.
- No duplicate key warnings are reintroduced.

Likely files:

```text
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
```

#### Book Compare

- Modified scene prose appears as changed content.
- Missing prose appears as missing/gap, not as a false unchanged state.
- Compare rows use stable canonical IDs, not display labels.

Likely files:

```text
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts
```

#### Book Review / Export Readiness

- Review/export-readiness issue identities are stable.
- Mirrored blockers do not produce duplicate React keys.
- Issue source refs can hand off back to scene/chapter/book context.

Likely files:

```text
packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
```

### 5.4 Container-Level Regression

Add one high-level container test if current test utilities allow it:

```text
BookDraftWorkspace renders a fixture where a scene has generated/revised prose,
shows that prose in the manuscript/read surface,
and does not emit duplicate key warnings.
```

Do not create broad integration infrastructure for this. If existing utilities are insufficient, keep it at mapper/query level and document the limitation in the audit.

### 5.5 Storybook Preservation

Do not rewrite Storybook.

Only add a narrow story if it helps document the regression:

```text
BookDraftWorkspace / AssemblyRegression
ChapterDraftWorkspace / SceneProsePropagated
```

The story should use existing fixtures. Do not invent a new visual system.

---

## 6. Expected File Touch Map

Expected new file:

```text
doc/review/post-pr36-chapter-book-draft-assembly-regression-audit.md
```

Expected test files to touch:

```text
packages/api/src/createServer.run-flow.test.ts
packages/api/src/createServer.prose-revision.test.ts
packages/api/src/createServer.read-surfaces.test.ts
packages/api/src/createServer.draft-assembly-regression.test.ts   # optional

packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx
packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.test.tsx
packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.test.tsx
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.test.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
```

Source files may be touched only if a regression test fails and the fix is minimal:

```text
packages/api/src/orchestration/sceneRun/**
packages/api/src/repositories/**
packages/renderer/src/features/scene/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/book/**
packages/renderer/src/features/traceability/**
```

Do not touch:

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
packages/renderer/src/features/workbench/** layout kernel files
apps/desktop/**
package manager / lockfile files, unless unavoidable and explicitly justified
```

---

## 7. Implementation Order

Follow this order exactly:

### Step 1: Baseline

Run focused tests before changing code:

```bash
pnpm --filter @narrative-novel/api test -- createServer.run-flow
pnpm --filter @narrative-novel/api test -- createServer.prose-revision
pnpm --filter @narrative-novel/api test -- createServer.read-surfaces
pnpm --filter @narrative-novel/renderer test -- ChapterDraftWorkspace
pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace
pnpm --filter @narrative-novel/renderer test -- book-draft-workspace-mappers
pnpm --filter @narrative-novel/renderer test -- book-manuscript-compare-mappers
```

If a command pattern does not match the local test runner behavior, use the nearest focused Vitest command that runs the intended file.

### Step 2: Inventory the Current Chain

Use grep/search to identify:

```text
review decision accept
accept-with-edit
canon patch
prose draft artifact
scene prose read model
chapter draft assembly
book draft assembly
book manuscript compare
export readiness / review blockers
trace summary source refs
```

Record the discovered path in the audit doc.

### Step 3: Write Failing or Protective Tests First

Add regression tests before source changes whenever possible.

The preferred pattern is:

```text
fixture / API response -> mapper/query -> container render
```

Do not begin with UI changes.

### Step 4: Apply Minimal Fixes

Only fix what the tests prove is broken:

- missing propagation field
- wrong mapper source
- unstable React key
- stale derived status
- missing trace/source ref
- incorrect missing/prose distinction
- inconsistent accept-with-edit read model

Avoid refactors.

### Step 5: Update Audit

Fill the audit verification matrix with tests and commands run.

### Step 6: Run Final Commands

Run at minimum:

```bash
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/renderer typecheck
pnpm typecheck
pnpm test
```

If Storybook files changed, also run:

```bash
pnpm --filter @narrative-novel/renderer build-storybook
```

If full test suites are too slow in the agent environment, run all focused tests plus package-level typecheck, and document any skipped full command in the audit.

---

## 8. Acceptance Criteria

PR37 is complete only if all of the following are true:

1. The regression audit document exists and is filled.
2. The selected proposal variant / review decision path is covered by tests.
3. Accept and accept-with-edit materialize or expose prose draft state through current contracts.
4. Reject and request-rewrite do not overwrite existing prose.
5. Scene prose read model can read current generated/revised prose.
6. Chapter draft assembly reflects current scene prose and missing prose states.
7. Book draft read reflects current chapter/scene prose.
8. Book manuscript compare reflects changed/missing prose with stable identities.
9. Book review/export-readiness issue identities remain stable and do not duplicate React keys.
10. Trace/source refs still explain proposal/canon/prose linkage.
11. Run events remain lightweight and ref-based.
12. No new dashboard/page-like UI is added.
13. No Workbench layout ownership is moved into business components.
14. Existing PR36 duplicate key fix is preserved.
15. Typecheck and relevant tests pass, or any environment-only limitation is explicitly recorded.

---

## 9. Suggested PR Description

Use this as the PR body:

```md
## Summary

PR37 closes the post-PR36 Chapter / Book draft assembly regression path.

It verifies and minimally hardens the chain:

selected proposal variant -> review decision -> canon patch -> prose draft artifact -> scene prose read model -> chapter draft assembly -> book draft read / compare / review / export-readiness trace

## What changed

- Added a post-PR36 regression audit document.
- Added/extended API regression coverage for prose/canon/review propagation.
- Added/extended renderer mapper/query/container tests for Chapter Draft and Book Draft assembly.
- Preserved the PR36 duplicate key stability fix.
- Kept run events ref-based and did not add new backend infrastructure.

## Non-goals

- No Temporal / durable workflow engine.
- No production database.
- No real SSE / WebSocket stream.
- No real LLM integration.
- No prompt editor / RAG / policy mutation.
- No Workbench layout changes.
- No new dashboard or page-level surface.

## Validation

- [ ] pnpm --filter @narrative-novel/api test
- [ ] pnpm --filter @narrative-novel/renderer test
- [ ] pnpm --filter @narrative-novel/api typecheck
- [ ] pnpm --filter @narrative-novel/renderer typecheck
- [ ] pnpm typecheck
- [ ] pnpm test
```

---

## 10. Roadmap After PR37

After PR37, continue in this order unless new evidence changes the priority:

```text
PR38: Runtime Polling / Stale-State UX Hardening
PR39: Repository Persistence Boundary Planning
PR40: Context Builder Seam and Policy-to-Builder Transition
PR41: Thin Real Persistence Vertical Slice
PR42: Optional SSE Transport After Polling Is Stable
```

Desktop work can continue in parallel only as a thin shell / local API supervisor line. It should not replace the main runtime and prose assembly hardening path.

Do not move to Spatial Blackboard / Blender / visual generation until the text manuscript chain is reliable.

---

## 11. Final Rule

This PR succeeds when the product can answer, with tests:

```text
Where did this Book Draft prose come from?
Which Scene proposal / review decision / canon patch produced it?
Why does Chapter Draft show this scene prose?
Why does Book Compare mark this text changed or missing?
Can the user navigate the source without duplicate identity bugs?
```

If the answer is not testable, PR37 is not finished.

# Post-PR35 Roadmap and PR36 AI Execution Plan

> Source branch: `codex/pr35-scene-review-gate-main-stage-correction`
>
> Recommended next branch: `codex/pr36-book-draft-stability-regression-cleanup`
>
> Purpose: after PR35 moved Scene waiting-review decisions back into the Main Stage, do one narrow stability PR before adding more product surface. The immediate target is the known baseline `BookDraftWorkspace` duplicate React key warnings and the fragile list identity around Book Draft / manuscript assembly surfaces.

---

## 0. Final instruction to the AI coding agent

You are **not** building a new feature in this PR.

Your job is to remove the known Book Draft duplicate React key warning class, lock stable list identity in tests, and leave a clear audit trail for the next manuscript-assembly PR.

Do not implement real backend persistence, Temporal, SSE, new export workflow, new branch workflow, command palette, status bar, new scope, new lens, prompt editor, context policy mutation, RAG, Spatial Blackboard, Blender, or desktop project picker.

Concretely:

1. Start from `codex/pr35-scene-review-gate-main-stage-correction`.
2. Treat `doc/frontend-workbench-constitution.md` as binding.
3. Keep route as the only active business-state truth.
4. Keep layout/editor state local and shell-owned.
5. Do not touch Scene review gate ownership except to avoid regressions.
6. Find the duplicate React key warnings in `BookDraftWorkspace` tests and fix their underlying key identity.
7. Add tests that fail if the duplicate key warning returns.
8. Record the diagnosis and fixed locations in `doc/review/post-pr35-book-draft-stability-audit.md`.

If you find broader Book Draft product problems, write them into the audit doc follow-up backlog. Do not broaden PR36.

---

## 1. Current diagnosis after PR35

PR35 successfully corrected a Workbench constitution violation: waiting-review decisions for active Scene runs moved out of the Bottom Dock and back into the Scene / Orchestrate Main Stage. Bottom Dock now keeps events, artifacts, trace, problems, diagnostics, and proposal-variant support context only.

The next visible debt is not another Workbench shell feature. The next debt is the known baseline `BookDraftWorkspace` duplicate React key warnings that have been carried through PR33, PR34, and PR35.

Why this matters now:

- Book Draft is the place where Scene prose, Chapter draft, manuscript compare, review inbox, export readiness, and branch readiness converge.
- Duplicate keys usually mean list identity is underspecified. That is risky before the next manuscript assembly regression work.
- React key warnings are not cosmetic here: they can mask unstable row reuse in compare/review/export/trace lists.
- The project should not keep accumulating “known warnings” while moving into deeper Chapter / Book draft assembly.

PR36 should therefore be a narrow **Book Draft stability / list identity cleanup** PR.

---

## 2. Recommended roadmap after PR35

### PR36 — Book Draft stability and duplicate-key cleanup

Goal:

```text
Fix BookDraftWorkspace duplicate React key warnings,
lock stable list identity,
and document the exact fix in an audit note.
```

This PR should not change product behavior except making list identity deterministic and tests quieter.

### PR37 — Chapter / Book draft assembly regression closure

Goal:

```text
Verify accepted scene prose and revised scene prose propagate through:
scene prose -> chapter draft -> book draft read / compare / review surfaces
```

Expected focus:

- Chapter Draft shows scene prose/readiness consistently.
- Book Draft Read reflects materialized scene prose.
- Book Draft Compare has stable source rows.
- Book Review / trace gap surfaces can point back to scene/canon/prose artifacts.
- No new backend; stay fixture/API-contract level unless a missing endpoint is already present.

### PR38 — Runtime polling and stale-state UX hardening

Goal:

```text
Make current REST polling/page contract feel reliable before SSE.
```

Expected focus:

- Explicit stale / refreshing / failed-poll states.
- Retry affordance in support surfaces.
- No `events/stream` implementation yet unless separately planned.
- Do not pretend SSE exists while it remains `501`.

### PR39 — Real persistence boundary planning / repository seam

Goal:

```text
Prepare to replace fixture-only API internals without disturbing renderer contracts.
```

Expected focus:

- Repository interfaces and data ownership notes.
- No Temporal-first rewrite.
- Keep product API shape stable.
- Keep artifacts/trace/run-events as product read surfaces, not raw workflow history.

### PR40 — Context builder transition plan

Goal:

```text
Move from read-only context activation explanation toward a backend-owned context builder seam.
```

Expected focus:

- Context packet source ownership.
- Asset visibility policy boundaries.
- No prompt editor, no full RAG, no policy mutation UI yet.

### Later / parallel desktop line

Desktop work can continue, but should stay behind the API/runtime boundary:

```text
Desktop project picker and local project directory only after API persistence boundaries are clearer.
```

Do not let desktop file-system concerns leak into renderer or Workbench business state.

---

## 3. Mandatory reading before coding PR36

Read these files first, in this order:

```text
doc/frontend-workbench-constitution.md
doc/project-positioning-and-design-principles.md
doc/review/post-pr33-workbench-surface-audit.md
.ai/runs/2026-04-26-pr35-scene-review-gate-run.md
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx
packages/renderer/src/features/book/types/*
packages/renderer/src/features/book/api/*
packages/renderer/src/features/book/components/*
```

Then run a focused inventory:

```bash
find packages/renderer/src/features/book -maxdepth 4 -type f | sort
```

Search for suspicious key sources:

```bash
grep -R "key={.*kind\|key={.*type\|key={.*status\|key={.*tone\|key={.*label\|key={.*title\|key={index\|map((.*index" \
  packages/renderer/src/features/book \
  --include='*.tsx' \
  --include='*.ts' \
  || true
```

Also search the known warning words from previous audit history:

```bash
grep -R "trace-gap\|warnings\|compare\|readiness\|branch\|export" \
  packages/renderer/src/features/book \
  --include='*.tsx' \
  --include='*.ts' \
  || true
```

These grep commands are diagnostic. Do not blindly rewrite everything.

---

## 4. Workbench Constitution Compliance

This PR must not:

- bypass `WorkbenchShell`
- add a page-like dashboard
- implement local pane layout
- duplicate shell state
- put primary work in Inspector or Bottom Dock
- mix route state with layout preference
- create a second selected-object truth source
- move Scene review decisions back into the Bottom Dock
- change API contracts or fixture server behavior unless a Book Draft key actually lacks a stable id

This PR must:

- keep Book Draft inside existing Book / Draft Workbench surfaces
- keep Main Stage primary task clear
- preserve route restore
- preserve layout/editor restore
- preserve existing Storybook states
- add tests that lock stable key identity
- update an audit note with exact fixed warning sources

---

## 5. Explicit non-goals for PR36

Do not do any of the following:

```text
New Book Draft UI
New Chapter / Book assembly feature
New review workflow
New export feature
New branch feature
New API endpoint
Real persistence
SSE
Temporal
Worker process
Desktop file/project picker
Prompt editor
Context policy mutation
RAG/vector search
Spatial Blackboard / Blender
Status Bar
Command Palette
Split editor groups
```

If a fix appears to require one of these, stop broadening and record it as follow-up in the audit doc.

---

## 6. Required deliverables

### Deliverable A — audit doc

Create:

```text
doc/review/post-pr35-book-draft-stability-audit.md
```

It must contain:

```md
# Post-PR35 Book Draft Stability Audit

## Audited branch
codex/pr35-scene-review-gate-main-stage-correction

## Summary
- Which BookDraftWorkspace warning class was present before PR36.
- Which files caused it.
- Which files PR36 changed.
- Which issues remain deferred.

## Duplicate key findings
| Warning / key candidate | Location | Cause | Fixed in PR36? | Notes |
|---|---|---|---:|---|

## Stable identity rules introduced
- Rule 1
- Rule 2

## Tests added or changed
- Test file and assertion

## Verification commands
- Command and result

## Follow-up backlog
- Item 1
```

### Deliverable B — stable Book Draft list identity

Fix the underlying duplicate key source, not only the test warning.

Likely patterns to review:

```text
key={item.kind}
key={item.type}
key={item.status}
key={warning.kind}
key={section.label}
key={row.title}
key={index}
```

Preferred approaches:

1. Use stable ids already present in the read model.
2. If the data model has stable `id`, use it directly.
3. If a UI-only section is derived from multiple fields, create a deterministic compound key:

```ts
const key = `${scope}:${category}:${record.id}`
```

4. If no id exists and the item is static UI chrome, define explicit section ids in code rather than deriving from labels.
5. Avoid plain array index keys for dynamic manuscript, compare, review, export readiness, trace gap, or warning rows.

Optional helper if useful:

```text
packages/renderer/src/features/book/containers/book-draft-keys.ts
```

Only add this helper if it reduces duplication. Do not over-engineer.

### Deliverable C — warning regression test

Add a targeted test that fails if React duplicate-key warnings return.

Suggested test shape:

```ts
it('renders book draft workspace without duplicate React key warnings', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(<BookDraftWorkspace ... />)

  expect(
    consoleError.mock.calls.some((call) =>
      call.some((part) => String(part).includes('Encountered two children with the same key')),
    ),
  ).toBe(false)

  consoleError.mockRestore()
})
```

If the existing test environment already has a console-error helper, reuse it. Do not introduce a global console mock that hides real errors in unrelated tests.

Also add deterministic assertions where possible:

- compare rows render correct count
- trace-gap rows render correct count
- export/readiness warnings render correct count
- review issue rows render correct count
- duplicate labels can coexist without key warnings

### Deliverable D — Storybook preservation

If PR36 changes rendering structure in `BookDraftWorkspace`, update or verify the relevant story/stories.

Do not add a large new product story unless needed. Prefer keeping existing stories passing.

If adding one story, keep it narrow:

```text
Book / Draft / DuplicateLabelStableKeys
```

This story should show repeated labels/kinds in different sections without new layout or product behavior.

### Deliverable E — audit handoff update

Update the new PR36 audit doc after tests pass.

Do not rewrite the PR33/PR34 audit except if you need to add one short cross-reference line.

---

## 7. File touch map

### Allowed and expected

```text
doc/review/post-pr35-book-draft-stability-audit.md
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx
```

### Allowed only if necessary

```text
packages/renderer/src/features/book/containers/book-draft-keys.ts
packages/renderer/src/features/book/components/**
packages/renderer/src/features/book/types/**
packages/renderer/src/features/book/api/**
packages/renderer/src/features/book/mock/**
packages/renderer/src/app/i18n/index.tsx
```

Only touch these if the duplicate key source lives there or a stable id must be added to fixture/read-model records.

### Do not touch

```text
packages/api/**
packages/desktop/**
packages/renderer/src/features/scene/**
packages/renderer/src/features/workbench/**
packages/renderer/src/features/run/**
pnpm-lock.yaml
package.json
API route contracts
Workbench route types
Temporal / worker / SSE placeholders
```

Exception: if a test import path needs a tiny type-only change, keep it local and explain it in the audit.

---

## 8. Implementation order

### Step 1 — baseline verification

Run:

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace
```

If baseline already fails for unrelated reasons, record it in the audit doc and continue only if the failure is unrelated to this PR.

### Step 2 — reproduce and isolate the warning

Run the focused tests and watch stderr:

```bash
pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace --runInBand
```

If the runner does not support `--runInBand`, use the closest Vitest equivalent already used in the repo. Do not change test runner config.

Search the warning text in output:

```text
Encountered two children with the same key
```

Record the likely key value in the audit doc.

### Step 3 — inspect `BookDraftWorkspace` maps

Review every `.map(...)` inside `BookDraftWorkspace.tsx` and nearby Book Draft components.

For each list, classify the key as:

```text
Stable id: OK
Static explicit section id: OK
Compound key from stable ids: OK
Label/type/status-only key: risky
Index key for dynamic data: risky
```

Fix only risky keys that plausibly cause current warnings.

### Step 4 — implement stable keys

Patch the smallest surface.

Good examples:

```ts
key={warning.id}
key={`trace-gap:${gap.id}`}
key={`compare:${checkpoint.id}:${row.sceneId}`}
key={`readiness:${section.id}:${item.id}`}
```

Bad examples:

```ts
key={warning.kind}
key={row.label}
key={index}
key={`${row.label}-${index}`}
```

Index may be acceptable only for static hard-coded arrays that never reorder and never represent product records. If using index, document why in a comment or avoid it.

### Step 5 — add warning regression test

Add a focused test in `BookDraftWorkspace.test.tsx`.

The test should render the state that previously emitted warnings. It should fail if React logs the duplicate key warning.

Do not globally suppress console errors.

### Step 6 — run focused verification

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace
pnpm --filter @narrative-novel/renderer typecheck
```

### Step 7 — run broader verification

Run:

```bash
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer build-storybook
pnpm typecheck
pnpm test
```

If `build-storybook` is slow but available, run it. If it fails due to existing Storybook warnings only, do not call it pass unless the command exits successfully.

### Step 8 — update audit doc

Fill in:

- exact warning source
- files changed
- tests added
- commands run
- remaining follow-ups

---

## 9. Acceptance criteria

PR36 is complete only if all of these are true:

1. The known `BookDraftWorkspace` duplicate React key warning is gone from focused tests.
2. A regression test would fail if the duplicate key warning returns.
3. Key fixes use stable product identity or explicit UI section ids, not label/status-only keys.
4. No Scene review gate decision controls return to Bottom Dock.
5. No Workbench layout, route, or editor state ownership changes are introduced.
6. No API, desktop, or lockfile changes are introduced.
7. `pnpm --filter @narrative-novel/renderer typecheck` passes.
8. `pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace` passes.
9. `pnpm --filter @narrative-novel/renderer test` passes.
10. `pnpm typecheck` and `pnpm test` pass, unless a pre-existing unrelated failure is clearly recorded and approved by the controller.
11. `doc/review/post-pr35-book-draft-stability-audit.md` exists and explains the fix.

---

## 10. Suggested PR36 body

```md
## Summary

- Remove the known BookDraftWorkspace duplicate React key warning by giving repeated Book Draft rows stable identity.
- Add a regression test that fails if React duplicate-key warnings return.
- Add a PR36 Book Draft stability audit note and keep Workbench / Scene runtime ownership unchanged.

## Test Plan

- `pnpm --filter @narrative-novel/renderer typecheck`
- `pnpm --filter @narrative-novel/renderer test -- BookDraftWorkspace`
- `pnpm --filter @narrative-novel/renderer test`
- `pnpm --filter @narrative-novel/renderer build-storybook`
- `pnpm typecheck`
- `pnpm test`

## Notes

- No API, desktop, route, Workbench layout, or Scene runtime ownership changes.
- Scene waiting-review decisions remain owned by the Scene / Orchestrate Main Stage.
```

---

## 11. Follow-up backlog after PR36

After PR36, the next PR should return to product value, not more abstract polish.

Recommended next branch:

```text
codex/pr37-chapter-book-draft-assembly-regression
```

PR37 should verify the manuscript path end-to-end:

```text
accepted selected variant
-> canon patch
-> prose draft artifact
-> scene prose read model
-> chapter draft assembly
-> book draft read / compare / review trace
```

PR37 should still avoid real backend persistence, SSE, Temporal, RAG, Spatial Blackboard, and desktop project picker unless separately planned.


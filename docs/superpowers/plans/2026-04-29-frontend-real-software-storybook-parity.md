# Frontend Real-Software To Storybook Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the real renderer and desktop-visible frontend back in line with the Storybook workbench contract, so the actual software looks and behaves like the reviewed Storybook surfaces instead of lagging behind them.

**Architecture:** Treat Storybook as the visual and interaction contract for shell, layout, chrome, and controlled surface states, while keeping the real `App` / runtime / route / project path as the execution truth. Fix this in serial bundles: first clamp the shell to a real workbench viewport, then align scene chrome and localization, then remove API/runtime-path drift that makes real surfaces degrade into unavailable states, and finally add a durable parity gate that checks Storybook and real software side by side instead of trusting Storybook alone.

**Tech Stack:** TypeScript, React, Vite, Tailwind CSS, Electron desktop shell, Fastify API runtime, TanStack Query, Storybook, Vitest, Codex MCP/browser snapshots

---

## Why This Plan Exists

The repo now has an explicit dual-gate delivery rule:

- `Storybook Sync Gate`
- `Real Software Acceptance Gate`

But the current real frontend still materially lags behind the Storybook workbench.

Recorded evidence already shows two different failure families:

1. **Workbench shell / layout drift**
   - real shell behaves like a long web page instead of a fixed IDE viewport
   - bottom dock can be pushed below the viewport
   - narrow navigator content clips badly
   - source: `doc/review/2026-04-26-workbench-layout-comment-summary.md`

2. **Real runtime / renderer path drift**
   - scene navigator exposes scenes the API runtime cannot actually serve
   - book scope collapses into unavailable because one scene read fails
   - scene header chrome and zh-CN user-facing copy drift from expected product presentation
   - source: `doc/review/2026-04-25-real-frontend-interaction-smoke.md`

This plan is specifically for fixing those frontend parity failures.

## Scope Assumption

Assume the controller wants this narrow direction:

- **Yes:** make the real frontend visually and behaviorally converge toward Storybook on shell/layout/chrome/surface states
- **Yes:** fix renderer-side runtime/read-path drift that makes the real frontend fall into obviously broken or unavailable states
- **No:** redesign the product
- **No:** widen into backend feature work, shell architecture rewrite, or new dashboard/page flows
- **No:** copy Storybook-only fixture data into the real runtime path just to make screenshots match

If later execution finds a blocker that requires backend contract changes, stop and open a narrow follow-up plan instead of widening this slice.

## Workbench Constitution Constraints

All bundles in this plan must preserve:

- `WorkbenchShell` owns layout
- route and layout stay separate
- one primary Main Stage task
- Navigator stays object navigation
- Inspector stays supporting judgment
- Bottom Dock stays support / problems / activity / runtime / trace
- Storybook states stay in sync for affected surfaces
- tests cover route / layout / selection / restore boundaries

If a “parity fix” makes the real app feel more like a generic long web page or dashboard, it fails even if it looks closer to Storybook screenshots.

## Borrowed Reference Direction

For shell behavior, use the existing VS Code reference already audited in this repo:

- `refer/vscode/src/vs/workbench/browser/layout.ts`
- `refer/vscode/src/vs/workbench/services/layout/browser/layoutService.ts`
- `refer/vscode/src/vs/base/browser/ui/sash/sash.ts`

Borrow only these ideas:

- the workbench occupies a fixed viewport
- panes scroll internally instead of growing the page
- layout visibility and sizing are shell-owned concerns
- resize handles are first-class shell behavior

Do not import VS Code complexity that the project has not already chosen.

## Execution Model

- Stay serial.
- One remediation PR at a time.
- Review once per bundle, combining spec and code review in one pass.
- One commit after each accepted bundle.
- No worktrees unless the roadmap is explicitly reopened for parallelism later.

## Preflight

- [ ] Re-read `doc/frontend-workbench-constitution.md`
- [ ] Re-read `doc/review/2026-04-25-real-frontend-interaction-smoke.md`
- [ ] Re-read `doc/review/2026-04-26-workbench-layout-comment-summary.md`
- [ ] Re-read `doc/review/post-pr33-workbench-surface-audit.md`
- [ ] Treat Storybook as the target contract for visual parity, but treat `packages/renderer/src/App.tsx` and real runtime routes as the product truth for execution
- [ ] Do not start implementation until the controller agrees with the PR sequence below

## Parity Definition

“Real frontend matches Storybook” means:

- the real shell uses the same fixed-viewport workbench behavior the Storybook shell advertises
- the real chrome, spacing, labels, and support surfaces are visually consistent with the reviewed stories
- the real runtime path does not expose broken routes or unavailable states that Storybook hides with story-only fixtures
- the same object/lens/task feels like the same product surface in Storybook and in real software

It does **not** mean:

- forcing the real runtime to use story-only fixture ids or fake content
- ignoring runtime-specific states such as launcher, current project, runtime badge, or API health
- accepting Storybook-only polish while the real route remains broken

## Bundle Map

1. `PR-A` Shell viewport and dock parity
2. `PR-B` Scene chrome, header, and localization parity
3. `PR-C` API-backed navigator and book/chapter real-path parity
4. `PR-D` Cross-scope visual convergence and responsive cleanup
5. `PR-E` Durable real-frontend parity gate

Sections below are grouped by remediation topic. The recommended execution order is listed at the end of this document.

---

## PR-A: Shell Viewport And Dock Parity

**Outcome:** The real workbench behaves like the Storybook workbench shell at a normal desktop viewport instead of like a long scroll page.

**Primary evidence to close:**

- `doc/review/2026-04-26-workbench-layout-comment-summary.md`

**Files:**

- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`
- Modify: `packages/renderer/src/features/workbench/types/workbench-layout.ts`
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchBottomDockFrame.tsx`
- Modify: `packages/renderer/src/features/scene/components/SceneBottomDock.tsx`
- Modify: `packages/renderer/src/App.tsx`
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx`
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneDockContainer.stories.tsx`
- Modify only if needed for bounded stage behavior: `packages/renderer/src/features/scene/containers/SceneWorkspace.tsx`

- [ ] Make the shell root strictly viewport-bounded in the real app and keep overflow inside shell-owned panes instead of the browser page.
- [ ] Keep the bottom dock visible in the default layout without requiring page scroll.
- [ ] Ensure the dock content viewport shows meaningful tab content at the default dock height.
- [ ] Make navigator cards survive the default narrow pane width without clipped badges or broken wrapping.
- [ ] Keep Storybook shell stories visually aligned with the real shell after the layout changes.
- [ ] Preserve route/layout separation and shell-owned resize behavior while making the shell tighter.

**Verification:**

- `pnpm --filter @narrative-novel/renderer test -- WorkbenchShell`
- `pnpm --filter @narrative-novel/renderer build-storybook`
- Real software gate at `1117x796` equivalent viewport:
  - no page-level vertical scroll for normal scene workbench use
  - bottom dock visible without scrolling the entire page
  - dock tab body visible in default layout
  - navigator badge/content does not clip

**Exit criteria:**

- real scene workbench fits inside the viewport like the shell stories imply
- shell no longer reads as a generic long page

**Non-goals:**

- no new shell features
- no command palette / status bar / split editor work

---

## PR-B: Scene Chrome, Header, And Localization Parity

**Outcome:** The real scene surface uses the same product chrome discipline and user-facing labels that Storybook implies, instead of mixed or hard-coded fallback presentation.

**Primary evidence to close:**

- `doc/review/2026-04-25-real-frontend-interaction-smoke.md`
  - hard-coded scene header lens label
  - mixed zh-CN / English chrome
  - misleading prose focus-mode presentation

**Files:**

- Modify: `packages/renderer/src/features/scene/components/SceneHeader.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneWorkspace.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneProseContainer.tsx`
- Modify: `packages/renderer/src/features/scene/components/SceneProseTab.tsx`
- Modify: `packages/renderer/src/app/i18n/index.tsx`
- Modify only if title/objective localization must come from read-model helpers: `packages/renderer/src/App.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx`
- Modify: `packages/renderer/src/App.scene-runtime-smoke.test.tsx`

- [ ] Derive the scene header lens label from the active route/lens instead of hard-coding `编排 / Orchestrate`.
- [ ] Align top-of-stage scene chrome with the same state the real route is actually in.
- [ ] Reduce mixed-language leakage in shell-level and control-level copy for zh-CN mode.
- [ ] Reconcile the prose focus-mode label with the actual UI behavior: either strengthen the behavior or narrow the copy.
- [ ] Keep Storybook scene workspace stories in sync with the corrected header and prose chrome.

**Verification:**

- `pnpm --filter @narrative-novel/renderer exec vitest run src/App.scene-runtime-smoke.test.tsx src/features/scene/containers/SceneProseContainer.test.tsx`
- `pnpm --filter @narrative-novel/renderer build-storybook`
- Real software gate:
  - `结构 / 编排 / 成稿` reflect correctly in stage chrome
  - zh-CN shell/control copy is not visibly half-English in the core surface
  - focus-mode copy matches the real behavior

**Exit criteria:**

- scene workbench chrome feels like the reviewed product surface, not like a dev fallback

**Non-goals:**

- no prose-generation feature expansion
- no broader content-localization overhaul beyond visible chrome/support strings

---

## PR-C: API-Backed Navigator And Book/Chapter Real-Path Parity

**Outcome:** The real API or desktop-local path stops exposing routes and surface states that Storybook can render but the runtime cannot actually serve.

**Primary evidence to close:**

- `doc/review/2026-04-25-real-frontend-interaction-smoke.md`
  - scene navigator shows API-missing scenes
  - book scope becomes unavailable when one scene prose query fails

**Files:**

- Modify: `packages/renderer/src/App.tsx`
- Modify: `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts`
- Modify only if query-key or runtime-read wiring needs a narrow change: `packages/renderer/src/features/book/hooks/useBookStructureWorkspaceQuery.ts`
- Modify only if chapter scene sourcing must be narrowed in renderer read models: `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts`
- Modify: `packages/renderer/src/App.test.tsx`
- Modify: `packages/renderer/src/features/book/containers/BookStructureWorkspace.test.tsx`
- Modify only if smoke coverage is better at the app level: `packages/renderer/src/App.scene-runtime-smoke.test.tsx`

- [ ] Stop deriving real navigator visibility from mock-only chapter records when the runtime is API-backed or desktop-local.
- [ ] Ensure real scene lists only expose scenes the active runtime can actually open, or degrade them explicitly instead of routing into full-surface failure.
- [ ] Prevent one missing scene prose read from collapsing the entire book workspace when a narrower renderer behavior is more appropriate.
- [ ] Keep Storybook fixture richness intact without letting those story-only expectations leak into the real runtime path.
- [ ] Add regression tests for real-path scene clicks and book workspace resilience.

**Verification:**

- `pnpm --filter @narrative-novel/renderer exec vitest run src/App.test.tsx src/features/book/containers/BookStructureWorkspace.test.tsx`
- Real software gate with API runtime:
  - every scene visible in the navigator is either openable or explicitly disabled/guarded
  - book structure workspace does not collapse because of one missing downstream scene read

**Exit criteria:**

- real scene/book surfaces stop failing in obvious ways that Storybook masks

**Non-goals:**

- no backend canonical-fixture redesign inside this PR
- no expansion into API contract redesign unless the frontend fix proves impossible without it

---

## PR-D: Cross-Scope Visual Convergence And Responsive Cleanup

**Outcome:** After shell and scene-path fixes land, chapter / asset / book surfaces visually converge toward the same reviewed workbench language instead of each drifting with different spacing, pane density, and support-surface composition.

**Primary evidence to close:**

- the shell/layout comment family
- the user-reported “real frontend vs Storybook difference is large”
- any remaining visible drift after `PR-A` to `PR-C`

**Files:**

- Modify: `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
- Modify: `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.tsx`
- Modify: `packages/renderer/src/features/asset/containers/AssetKnowledgeWorkspace.tsx`
- Modify: `packages/renderer/src/features/book/containers/BookStructureWorkspace.tsx`
- Modify: `packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx`
- Modify: related Storybook stories under:
  - `packages/renderer/src/features/chapter/**/*.stories.tsx`
  - `packages/renderer/src/features/asset/**/*.stories.tsx`
  - `packages/renderer/src/features/book/**/*.stories.tsx`
- Modify tests only where layout/chrome assertions exist

- [ ] Audit chapter, asset, and book shells against the corrected Storybook shell and normalize obvious spacing, overflow, panel-density, and badge-wrapping drift.
- [ ] Keep each scope inside the same five-surface workbench language instead of letting one scope read like a separate web page.
- [ ] Prefer fixing shared shell/surface components before local one-off styling.
- [ ] Synchronize the affected stories so reviewed mockups and real surfaces stay visually aligned.

**Verification:**

- `pnpm --filter @narrative-novel/renderer build-storybook`
- focused renderer tests for touched workspaces
- real software gate across `scene`, `chapter`, `asset`, `book` representative routes

**Exit criteria:**

- cross-scope visual drift is materially smaller
- the real frontend reads as one workbench, not multiple partially divergent pages

**Non-goals:**

- no redesign of feature information architecture
- no new scope/lens surfaces

---

## PR-E: Durable Real-Frontend Parity Gate

**Outcome:** The repo gains a repeatable parity gate so future frontend work cannot pass by Storybook-only confidence again.

**Primary evidence to close:**

- the long-term acceptance bias described by the controller
- the new dual-gate policy in `doc/frontend-delivery-acceptance-flow.md`

**Files:**

- Modify: `doc/frontend-delivery-acceptance-flow.md`
- Create: `doc/review/2026-04-29-real-frontend-storybook-parity-checklist.md`
- Create or modify a narrow smoke artifact path only if needed:
  - `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
  - `packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx`
- Modify only if a repo script is justified:
  - `package.json`
  - `scripts/verify-prototype.mjs`

- [ ] Define a stable “parity checklist” that pairs Storybook stories with real routes and required real-software checks.
- [ ] Make future acceptance output explicitly record both Storybook and real-software evidence for the same surface family.
- [ ] Extend smoke coverage only where it directly prevents this class of false confidence.
- [ ] Keep this gate narrow: it should enforce parity discipline, not become a giant end-to-end framework project.

**Verification:**

- documentation review
- any added focused tests/scripts pass
- one full parity report can be produced from the new checklist

**Exit criteria:**

- future frontend work has a repo-local procedure that makes Storybook-only sign-off insufficient by default

**Non-goals:**

- no broad Playwright framework rewrite
- no desktop automation rebuild in this slice

---

## Review Focus For Every Bundle

For each bundle, review against these questions:

- Did the real frontend get closer to the Storybook contract?
- Did the fix preserve WorkbenchShell ownership and route/layout boundaries?
- Did the fix stay inside the smallest renderer seam?
- Did Storybook stay synced after the real-surface fix?
- Did the bundle add real-software proof, not just Storybook proof?

If any bundle answers “no”, do not commit it yet.

## Final Acceptance For The Whole Plan

The plan is complete only when:

- Storybook and real software look like the same product family on the main workbench surfaces
- the real app no longer degrades into obvious broken states hidden by stories
- viewport, dock, navigator, and stage behavior match the workbench contract
- acceptance reports can no longer substitute Storybook success for real-software success

## Recommended First Execution Order

If execution starts immediately, do this:

1. `PR-A` Shell viewport and dock parity
2. `PR-C` API-backed navigator and book/chapter real-path parity
3. `PR-B` Scene chrome, header, and localization parity
4. `PR-D` Cross-scope visual convergence and responsive cleanup
5. `PR-E` Durable real-frontend parity gate

Reason:

- `PR-A` fixes the most obvious “looks like a webpage” failure first
- `PR-C` removes the most damaging real-path divergence next
- `PR-B` then makes the main scene chrome feel product-correct
- `PR-D` cleans up the remaining cross-scope styling drift
- `PR-E` locks the process so the repo does not regress into Storybook-only confidence again

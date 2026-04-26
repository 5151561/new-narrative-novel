# Codex Run Report

## Task

Implement `doc/post-pr34-roadmap-and-pr35-scene-review-gate-plan.md`.

## Plan interpreted by Codex

PR35 corrects Scene runtime review ownership after PR34:

- Scene / Orchestrate Main Stage owns waiting-review `accept`, `accept-with-edit`, `request-rewrite`, and `reject` decisions.
- Bottom Dock remains support-only for run status, events, artifacts, trace, problems, diagnostics, and proposal variant draft context.
- Proposal variant selection remains local UI draft/support state and travels with Main Stage accept decisions.
- Route, layout, editor, API, fixture backend, desktop, lockfile, and Playwright config boundaries stay unchanged.

## Files changed

- `packages/renderer/src/features/scene/containers/scene-run-session-context.tsx`
- `packages/renderer/src/features/scene/containers/scene-run-session-context.test.tsx`
- `packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx`
- `packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx`
- `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
- `packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx`
- `packages/renderer/src/features/scene/containers/SceneDockContainer.tsx`
- `packages/renderer/src/features/scene/containers/SceneDockContainer.test.tsx`
- `packages/renderer/src/features/scene/components/SceneBottomDock.tsx`
- `packages/renderer/src/features/scene/components/SceneBottomDock.test.tsx`
- `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`
- `packages/renderer/src/features/scene/containers/SceneDockContainer.stories.tsx`
- `doc/review/post-pr33-workbench-surface-audit.md`

## Implementation summary

- Lifted proposal variant draft ownership into the shared `SceneRunSessionProvider` state.
- Wired Main Stage `RunReviewGate` to receive `selectedVariantsForSubmit` and variant summary copy.
- Removed `RunReviewGate` and review submit props from `SceneBottomDock`.
- Replaced Dock decision UI with waiting-review handoff/support copy.
- Preserved Dock artifact/variant support selection.
- Added Storybook coverage for Main Stage waiting-review ownership and Dock support-only behavior.
- Added audit closure notes for PR35.

## Tests run

- `pnpm --filter @narrative-novel/renderer typecheck`
- `pnpm --filter @narrative-novel/renderer test`
- `pnpm --filter @narrative-novel/renderer build-storybook`
- `pnpm typecheck`
- `pnpm test`
- Storybook MCP `getComponentList`
- In-app browser structured DOM snapshots plus screenshots for:
  - `mockups-scene-workspace--waiting-review-main-stage-gate`
  - `mockups-scene-bottom-dock--waiting-review-support-only`

Review gates:

- Spec compliance reviewer: approved, no PR35 spec violations.
- Code quality reviewer: approved, no Critical, Important, or Minor issues.

## Test results

- Renderer typecheck passed.
- Renderer test passed: 158 files, 910 tests.
- Storybook build passed. Warnings were the existing classes: missing MDX stories, Storybook runtime eval warnings, and large chunk warning.
- Root typecheck passed across API, renderer, and desktop.
- Root test passed:
  - API: 16 files, 70 tests.
  - Desktop: 5 files, 19 tests.
  - Renderer: 158 files, 910 tests.
- Known baseline BookDraftWorkspace duplicate React key warnings still appear and were not changed in this PR.
- Storybook structured checks:
  - Main Stage story shows the run review gate and decision buttons.
  - Dock story shows waiting-review support copy and zero decision buttons for `Accept`, `Accept With Edit`, `Request Rewrite`, `Reject`, `采纳`, `编辑后采纳`, `请求重写`, and `拒绝`.

## Risks / limitations

- The full renderer test suite still emits the pre-existing BookDraftWorkspace duplicate key warnings recorded in the PR33/PR34 audit history.
- Storybook dev server also reports existing dependency-version and missing MDX warnings.

## Follow-up suggestions

- Fix the deferred BookDraftWorkspace duplicate key warnings in a dedicated book-draft cleanup slice.

## Suggested PR body

## Summary

- Move Scene waiting-review decisions back to the Scene / Orchestrate Main Stage.
- Keep Bottom Dock support-only while preserving proposal variant draft selection context.
- Add regression tests, Storybook states, and PR35 audit closure notes.

## Test Plan

- `pnpm --filter @narrative-novel/renderer typecheck`
- `pnpm --filter @narrative-novel/renderer test`
- `pnpm --filter @narrative-novel/renderer build-storybook`
- `pnpm typecheck`
- `pnpm test`
- Storybook MCP plus structured DOM snapshot and screenshot checks for the PR35 Main Stage and Dock stories.

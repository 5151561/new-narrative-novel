# Real First-Run Generation Dogfood Report

Branch: `codex/pr69-real-first-run-generation-rescue`  
Date: `2026-04-28`

## Verdict

Verdict: pass with recorded limitations

Bundle 4 first-phase rescue is acceptable for final reporting and follow-up work. The verification matrix passed, Storybook build and live Storybook dev server both worked, structured MCP/browser evidence covers the launcher/settings/runtime-guard/failure-retry states, and desktop-local dogfood launched successfully in a restored-project path.

This is not a claim that the prototype is fully production-ready. The current sign-off is narrower: the real first-run generation rescue branch no longer has a P0 blocker in verification closure, Storybook proof, or desktop-local shell availability.

## Branch And Bundles

- Branch: `codex/pr69-real-first-run-generation-rescue`
- Bundle commits already on branch:
  - Bundle 1: `7402cb3`
  - Bundle 2: `8e351c2`
  - Bundle 3: `eae2901`

## Verification Command Results

- `pnpm typecheck`
  - PASS
  - Re-run by the coordinator after phase-1 verification fixes
- `pnpm test`
  - PASS
  - Re-run after fixing the stale `/api/current-project` response expectations in `packages/api/src/createServer.local-project-store.test.ts`
  - `apps/desktop`: 13 files, 62 tests passed
  - `packages/api`: 48 files, 267 tests passed
  - `packages/renderer`: 171 files, 1086 tests passed
  - `packages/fixture-seed`: 1 file, 6 tests passed
- `pnpm typecheck:desktop`
  - PASS
- `pnpm test:desktop`
  - PASS
  - 13 files, 62 tests passed
- `pnpm --filter @narrative-novel/renderer build-storybook`
  - PASS
  - Output directory: `/Users/changlepan/new-narrative-novel/packages/renderer/storybook-static`

## Storybook And MCP Evidence

### Storybook runtime

- `pnpm storybook` started successfully
- Local URL: [http://localhost:6006/](http://localhost:6006/)

### Structured in-app browser / MCP evidence

- `launcher-project-launcher-screen--idle`
  - Locator: `main`
  - Structured text excerpt:
    - `Desktop StartupChoose how this Narrative IDE session should begin... Open Demo Project... Create Real Project... Open Existing Project... Current StateNo project is selected yet.`
- `settings-model-settings-dialog--default`
  - Locator: `[role="dialog"]`
  - Structured text excerpt:
    - `Runtime model bindingsModel SettingsCloseOpenAI API keyKey Missing... Role bindings... PlannerFixtureOpenAIModel IDSave Planner binding... Connection testOpenAI API key is missing.`
- `app-project-runtime-status-badge--real-local-project-open-ai-key-missing`
  - Locator: `#storybook-root`
  - Structured text excerpt:
    - `Signal Arc DesktopReal ProjectModel OpenAIKey MissingAPIHealthyNo run eventsNo review decisionsConnected to the desktop-local runtime for the current project.`
- `mockups-scene-executiontab--run-start-guard`
  - Locator: `body`
  - Structured text excerpt includes:
    - `Planner or prose writer settings are incomplete for this real project.Model Settings.`
- `mockups-scene-executiontab--failed-run-retry`
  - Locator: `#storybook-root`
  - Structured text excerpt includes:
    - `Scene run failed while generating accepted prose after review... Retry Run.`

### Interpretation

- Launcher proof is present at the Storybook story level.
- Model-settings proof is present at the Storybook story level.
- Real-project runtime badge proof is present at the Storybook story level.
- Real-project run-start guard and failed-run retry messaging are both present at the Storybook story level.

## Desktop Dogfood Evidence

- `pnpm dev:desktop` launched successfully in this run.
- Computer Use / accessibility snapshot observed an Electron window titled `Narrative Novel Renderer`.
- Accessibility tree evidence included:
  - top-bar runtime status text: `真实项目 模型 FIXTURE 密钥缺失 API 健康 Connected to local project store v1.`
  - visible `模型设置` button in shell chrome
  - scene execution controls present and disabled while the current run is `待评审`

### Important caveat about launch path

In this run, the desktop app restored into an existing current project instead of showing the launcher first. Because of that:

- live desktop proof covers restored-project dogfood, shell chrome, runtime status, and execution-state behavior
- first-run launcher proof comes from Storybook MCP/browser story state, not from a wiped-recents live desktop launch

## P0 Blocker Checklist

- [x] `pnpm typecheck` passes
- [x] `pnpm test` passes
- [x] `pnpm typecheck:desktop` passes
- [x] `pnpm test:desktop` passes
- [x] `pnpm --filter @narrative-novel/renderer build-storybook` passes
- [x] Storybook dev server starts locally
- [x] Structured Storybook proof exists for launcher idle state
- [x] Structured Storybook proof exists for model settings dialog
- [x] Structured Storybook proof exists for real-project runtime badge with missing-key state
- [x] Structured Storybook proof exists for real-project run-start guard
- [x] Structured Storybook proof exists for failed-run retry state
- [x] Desktop-local shell launches in Electron
- [x] Desktop-local shell exposes runtime status and model-settings chrome
- [x] No remaining P0 blocker is recorded from this run

## Remaining Known Limitations

- Storybook dev/build still emits existing version/chunk-size warnings; they were non-blocking in this run.
- `apps/desktop/src/main/main.test.ts` intentionally prints error-path stderr during desktop tests, but the suite passes.
- Desktop proof in this run is a restored-project path; launcher proof is story-level rather than a fresh empty-recents desktop launch.
- The current sign-off is for prototype dogfood closure, not for full production-readiness or broader productization claims.

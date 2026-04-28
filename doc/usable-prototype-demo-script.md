# Usable Prototype Demo Script

## Goal

Verify the real user flow, not just a fixture-only dev route:

`launch desktop -> choose demo/create/open -> configure model settings -> test connection -> enter scene workbench -> run scene -> review -> generate prose -> open chapter/book draft -> restart -> continue`

This document separates two uses:

- `Fixture demo`: stable walkthrough when you want a deterministic prototype run.
- `Real model dogfood`: real first-run generation path for a local project.

## Shared setup

### 1. Install

```bash
pnpm install
```

### 2. Start desktop

```bash
pnpm dev:desktop
```

Expected behavior:

- Electron launches the workbench shell.
- Electron main auto-starts the local `@narrative-novel/api`.
- Renderer receives `desktop-local` runtime config through `window.narrativeDesktop.getRuntimeConfig()`.

Do not start `pnpm dev:api` separately for the normal desktop path unless you are debugging startup.

## Real model dogfood path

Use this when you want to validate the first real generation flow end-to-end.

### 1. Choose project entry

When the launcher opens, verify all three entry points are visible:

- `Open Demo Project`
- `Create Real Project`
- `Open Existing Project`

For real dogfood:

1. Choose `Create Real Project` to start a new local project, or choose `Open Existing Project` to continue one.
2. Complete the native directory picker.
3. Confirm the workbench opens on the selected project instead of falling back to the demo project.

Expected:

- Top bar runtime badge shows `API`.
- Runtime health reaches `Healthy`.
- Current project identity reflects the chosen real project, not `book-signal-arc`.

### 2. Configure model settings

1. Open `Model Settings`.
2. Enter an OpenAI API key and save it.
3. For the roles you want to dogfood, switch provider from `Fixture` to `OpenAI`.
4. Fill model ids for the `OpenAI` roles.

Minimum practical set for this flow:

- `planner`
- `sceneProseWriter`
- `sceneRevision`

You can keep the rest on `Fixture` if you are only validating the first generation rescue path.

### 3. Test connection

1. In `Model Settings`, click `Test Connection`.
2. Wait for the connection test summary to update.

Expected:

- The dialog reports a successful connection, or gives a role/config-specific failure instead of silently succeeding.
- The workbench stays mounted even if the connection test fails.

### 4. Enter Scene Workbench

1. Navigate to the target scene through the normal workbench flow.
2. For the canonical happy path, use `Midnight Platform` in Scene / Orchestrate / Execution.

Expected:

- Main Stage is the Scene execution task, not a generic page.
- Navigator, Inspector, and Bottom Dock remain in workbench roles.

### 5. Run scene

1. Click `Run Scene`.
2. Wait for the run state to advance.

Expected:

- The run does not masquerade as immediate fixture success.
- Bottom Dock shows run activity and related refs.
- The session reaches `Waiting Review` or an explicit failure state.

### 6. Review

1. Open the proposal set from the Bottom Dock or review surface.
2. Inspect the returned proposal.
3. Choose a review action such as `Accept` or `Accept With Edit`.
4. Submit the review decision.

Expected:

- Run state records the review decision explicitly.
- Review does not silently skip straight to prose.
- Inspector / trace surfaces keep the run evidence visible.

### 7. Generate prose

After acceptance:

1. Confirm the run progresses through canon/prose completion states.
2. Open `Open Prose`.

Expected:

- Scene Prose Workbench opens on the same scene.
- The accepted/generated prose is visible for that scene.
- If the run fails, the UI stays in retry-first recovery instead of looking like fixture completion.

### 8. Open Chapter Draft and Book Draft

1. Switch to `Chapter`, then `Draft`.
2. Focus the scene you just ran.
3. Switch to `Book`, then `Draft`.
4. Select the target chapter.

Expected:

- Chapter Draft reflects the newly available scene prose/read model.
- Book Draft opens the selected manuscript destination instead of pretending the whole book is complete.
- Missing downstream drafts remain explicit.

### 9. Restart and continue

1. Close the desktop app.
2. Start it again with `pnpm dev:desktop`.
3. Reopen the app and allow startup restore to complete.

Expected:

- The recent real project is restored, or is reopenable through `Open Existing Project`.
- Model settings and project identity remain scoped to the desktop-local project flow.
- You can continue from the same workbench context instead of re-entering a fixture-only onboarding path.

## Fixture demo path

Use this when you want a deterministic walkthrough without depending on live model output.

### 1. Choose the demo project

1. Start desktop with `pnpm dev:desktop`.
2. In the launcher, choose `Open Demo Project`.

Expected:

- Project id resolves to `book-signal-arc`.
- Runtime badge shows `API` and `Healthy`.

### 2. Open the canonical route

The stable validation route remains:

```txt
/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution
```

### 3. Walk the deterministic prototype loop

1. Confirm the scene route opens on `Midnight Platform`.
2. Click `Run Scene`.
3. Wait for `Waiting Review`.
4. Open the proposal set from the Bottom Dock.
5. In `Run Review Gate`, choose `Accept With Edit`.
6. Submit the decision.
7. Confirm the run shows:
   - `Review decision submitted`
   - `Canon patch applied`
   - `Prose generated`
   - `Run completed`
8. In `Run Inspector`, open `Trace`.
9. Confirm trace/artifact explanation shows:
   - `Canon patches`
   - `Prose drafts`
   - `Accepted into canon`
   - `Rendered as prose`
10. Click `Open Prose`.
11. Confirm `Scene Prose Workbench` opens and shows accepted prose for `Midnight Platform`.
12. Click `Chapter`, then `Draft`.
13. Focus `Scene 1 Midnight Platform`.
14. Confirm chapter draft shows the generated scene state.
15. Click `Book`, then `Draft`.
16. Select `Chapter 1 Signals in Rain`.
17. Confirm book draft opens the selected manuscript destination and keeps remaining missing drafts explicit.

## Optional web fixture demo

If you specifically want the older web API-only demo path:

```bash
pnpm dev:api
VITE_NARRATIVE_API_BASE_URL=http://127.0.0.1:4174 \
VITE_NARRATIVE_PROJECT_ID=book-signal-arc \
pnpm --filter @narrative-novel/renderer dev --host 127.0.0.1 --port 4173
```

Then open:

- `http://127.0.0.1:4173/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution`

This remains useful for API contract checks, but it is not the primary real-user first-run path anymore.

## Recovery notes

If the runtime badge becomes degraded during either path:

- `Unavailable`: relaunch `pnpm dev:desktop`, then click `Retry`.
- `Not found`: confirm the runtime still points at the intended project id and current project root.
- `Unauthorized` / `Forbidden`: the workbench should stay mounted, but auth recovery is still outside this prototype phase.

Generic web without `VITE_NARRATIVE_API_BASE_URL` is intentionally not the real dogfood path. It falls back to mock runtime for Storybook, static preview, and tests.

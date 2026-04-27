# Usable Prototype Demo Script

## Goal

Use the locked prototype path end-to-end:

`book-signal-arc -> scene-midnight-platform -> run -> proposal -> review decision -> canon patch -> prose draft -> chapter draft -> book draft -> trace`

Default verification route:

`/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution`

This route is already the renderer default for the usable prototype demo.

## Web API Demo

### 1. Install

```bash
pnpm install
```

### 2. Start the fixture API

```bash
pnpm dev:api
```

Expected:

- API listens on `http://127.0.0.1:4174`

### 3. Start the renderer against the API runtime

```bash
VITE_NARRATIVE_API_BASE_URL=http://127.0.0.1:4174 \
VITE_NARRATIVE_PROJECT_ID=book-signal-arc \
pnpm --filter @narrative-novel/renderer dev --host 127.0.0.1 --port 4173
```

Open:

- `http://127.0.0.1:4173/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution`

Expected top-bar runtime badge:

- `API`
- `Healthy`

### 4. Demo flow

1. Confirm the scene route opens on `Midnight Platform`.
2. Click `Run Scene`.
3. Wait for `Waiting Review`.
4. Open the proposal set from the bottom dock.
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
14. Confirm chapter draft shows the generated scene state plus `A fixture prose draft was rendered for Midnight Platform.`
15. Click `Book`, then `Draft`.
16. Select `Chapter 1 Signals in Rain`.
17. Confirm book draft opens `Selected manuscript destination` and keeps the remaining missing scene drafts explicit instead of pretending the chapter is complete.

## Desktop Demo

### 1. Start the desktop shell

```bash
pnpm dev:desktop
```

Expected behavior:

- Electron launches the renderer shell
- Electron main auto-starts the local fixture API
- Renderer uses `desktop-local` runtime config from `window.narrativeDesktop.getRuntimeConfig()`

Do not start `pnpm dev:api` separately for this path unless you are debugging desktop startup.

### 2. Optional live renderer mode

```bash
NARRATIVE_DESKTOP_LIVE_RENDERER=1 pnpm dev:desktop
```

Optional fixed dev-server URL:

```bash
NARRATIVE_DESKTOP_LIVE_RENDERER=1 \
NARRATIVE_RENDERER_DEV_URL=http://127.0.0.1:5173 \
pnpm dev:desktop
```

### 3. Desktop verification

Use the same default scene route and the same run/review/prose/chapter/book flow as the web API demo.

Expected top-bar runtime badge:

- `API`
- `Healthy`

Desktop is the stricter prototype path because it still goes through the same `/api/projects/{projectId}/...` HTTP contract while adding the narrow Electron runtime bridge.

## Degraded Runtime Recovery

If the runtime badge becomes degraded during the API-backed demo:

- `Unavailable`: start `pnpm dev:api` again for web, or relaunch `pnpm dev:desktop` for desktop-local, then click `Retry`.
- `Not found`: verify `VITE_NARRATIVE_PROJECT_ID=book-signal-arc` for web, or verify the desktop-local runtime still points at the seeded fixture project.
- `Unauthorized` / `Forbidden`: the workbench shell stays open, but this prototype lock does not implement auth recovery; fix runtime access first, then retry.

Generic web without `VITE_NARRATIVE_API_BASE_URL` is intentionally not the API-backed demo path. It falls back to mock runtime for Storybook, static preview, and tests.

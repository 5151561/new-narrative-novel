# 2026-04-25 Real Frontend Interaction Smoke

## Gate

Fail. The real API-backed frontend is interactive on the valid `scene-midnight-platform` path, but several user-visible paths break when clicked in the browser.

## Setup

- API: `pnpm dev:api` at `http://127.0.0.1:4174`
- Renderer: `VITE_NARRATIVE_API_BASE_URL=http://127.0.0.1:4174/api VITE_NARRATIVE_PROJECT_ID=book-signal-arc pnpm --filter @narrative-novel/renderer dev --host 127.0.0.1 --port 4173`
- Browser target: `http://127.0.0.1:4173/`
- Runtime status observed in UI: `API / 健康 / Connected to fixture API runtime.`
- Method: Codex in-app browser with structured DOM snapshots and real clicks.

## Findings

### P1: Scene navigator exposes API-missing scenes, then routes into full-page unavailable states

Steps:

1. Open `http://127.0.0.1:4173/` with the API runtime enabled.
2. In the scene navigator, click `候车厅延误`.

Observed:

- The navigator lists `候车厅延误`, `售票窗`, and `发车钟` with a persistent `加载中` badge.
- Clicking `候车厅延误` routes to `?scope=scene&id=scene-concourse-delay&lens=orchestrate&tab=execution`.
- Main, inspector, and dock all render unavailable states: `Scene scene-concourse-delay was not found.`
- API proof: `GET /api/projects/book-signal-arc/scenes/scene-concourse-delay/workspace` returns `404 SCENE_NOT_FOUND`.

Likely responsibility area:

- `packages/renderer/src/App.tsx:278` to `packages/renderer/src/App.tsx:309` builds the scene navigator from mock chapter records, then silently falls back to mock cards when API scene queries fail.

### P1: Book scope is unusable against the real API fixture because book/chapter data references scenes that scene APIs cannot serve

Steps:

1. Open `http://127.0.0.1:4173/?scope=book&id=book-signal-arc&lens=structure&view=sequence`.
2. Wait for the book loading state to settle.

Observed:

- The whole book workspace becomes `书籍不可用`.
- The error message is `Scene scene-concourse-delay was not found.`
- API proof: chapter structure returns `scene-concourse-delay`, but the scene workspace API for that scene returns 404.

Likely responsibility area:

- `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts:132` to `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts:150` expands chapter scenes into prose queries.
- `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts:210` to `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts:216` escalates one missing scene query into a full book workspace error.

### P2: Scene main-stage breadcrumb stays hard-coded to `编排`

Steps:

1. From the valid scene, click `成稿`.
2. Click `结构`.

Observed:

- Top command bar and URL correctly change to `lens=draft` / `lens=structure`.
- The main-stage header still says `Signals in Rain / 场景 / 编排` in both modes.

Likely responsibility area:

- `packages/renderer/src/features/scene/components/SceneHeader.tsx:33` to `packages/renderer/src/features/scene/components/SceneHeader.tsx:35` hard-codes the scene header lens label.

### P2: zh-CN mode still leaks English in core user-facing surfaces

Observed examples:

- Scene navigator and scene header still show `Signals in Rain`, `Midnight Platform`, and English objective text.
- Scene execution headings show English proposal/run text such as `Raise the price in public`.
- After clicking `开始修订`, the zh-CN page shows `Revision queued` and the English diff summary.

This may be partly fixture-content policy, but as a user-facing zh-CN pass it is visibly mixed.

### P3: Prose `专注模式` reads as active but does not meaningfully change the workbench chrome

Steps:

1. Switch to `成稿`.
2. Click `专注模式`.

Observed:

- The control changes to `退出专注模式` and shows `专注模式已开启`.
- Navigator, inspector, bottom dock, and the normal scene chrome remain present in the structured UI.

This may be intended as a light mode, but the label currently suggests stronger focus behavior than the UI provides.

## Passed Areas

- Valid scene initial load settled without console errors.
- Scene `设定` / `执行` / `正文` tabs switched correctly.
- Layout controls for navigator visibility, bottom dock maximize/restore, and reset were usable.
- Asset scope loaded and its `资料` / `提及` / `关系` / `上下文` tabs switched correctly.
- Bottom dock `事件` / `追踪` / `一致性` / `问题` / `成本` tabs switched correctly.
- Run artifact inspector opened artifact detail and trace views.
- Export dialog opened and closed correctly.

## Notes

- A prose revision action was clicked during the smoke. The fixture API accepted it and updated the visible revision count from `修订 1` to `修订 2` in the current in-memory server session.
- No browser console errors or warnings were observed during the tested flows.

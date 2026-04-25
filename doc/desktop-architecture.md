# Desktop Architecture

This document records the first desktop boundary for `new-narrative-novel`.
The desktop app is a VS Code-style Electron Workbench Shell. Electron owns the
local shell and native process lifecycle. It is not a backend and must not become
a second implementation of product logic.

## Position

The desktop app exists to carry the existing Web-first Workbench in a safe local
shell:

- `apps/desktop`: Electron main process, preload bridge, window lifecycle,
  native menu, and future local process supervision.
- `packages/renderer`: the React/Vite Workbench. It remains Web-first and must
  continue to run as a normal browser app.
- `packages/api`: the business API contract. Desktop business capability still
  goes through this package over HTTP.
- future worker packages: orchestration, model, indexing, export, and other
  heavy work run outside the renderer and outside the Electron UI surface.

Electron is shell, not backend. Domain logic, run orchestration, artifact
storage, model routing, indexing, and project data mutation do not belong in the
Electron main process.

## Why Electron First

Electron is the lowest-risk first desktop shell for this repository because the
renderer is already a Vite web app and the target product is a workbench with
VS Code-like local integration. The first rounds need BrowserWindow lifecycle,
native menu behavior, preload isolation, process supervision, and packaging
paths more than native UI primitives.

This does not rule out Tauri later. It only keeps the first desktop proof close
to the existing Web Workbench and avoids a renderer rewrite while the runtime
and API contracts are still evolving.

## Renderer Rules

`packages/renderer` must not import Electron or Node-only modules. The renderer
never directly accesses:

- `fs`
- `child_process`
- Node globals as product capability
- raw `ipcRenderer`
- arbitrary Electron shell APIs

The renderer may only receive local desktop capability through a narrow,
versioned preload bridge such as `window.narrativeDesktop`. Product reads and
writes still use the same API contract as the web build.

## API Boundary

Desktop business capability still goes through `packages/api`. The intended
runtime path is:

```text
renderer -> HTTP API contract -> packages/api
```

The path is not:

```text
renderer -> Electron IPC -> Electron main -> domain service
```

Keeping the API boundary independent allows the same renderer code to work in
web, fixture, local desktop, and future remote deployments.

## Local API Supervisor

Electron supervises a local API process in desktop-local mode. That
responsibility is process lifecycle only:

- find or reserve a local port
- spawn the API process
- pass runtime environment variables
- wait for health readiness
- stop the child process when the app quits
- keep recent stdout/stderr logs for diagnostics

The local API supervisor is separate from product behavior. It does not
implement route handlers, stores, orchestration, or run logic.

## Worker Process Boundary

Heavy work must not enter the renderer. It also should not be implemented in the
Electron main process. Future workers are separate process responsibilities,
including:

- model gateway work
- orchestration workers
- Temporal or equivalent workflow workers
- context building
- artifact indexing
- embedding and retrieval
- export packaging

The first desktop rounds may leave workers unimplemented, but the architecture
keeps their process boundary explicit.

## Preload Bridge Security

The preload bridge is the only desktop capability surface exposed to the
renderer. The current bridge contract exposes only:

```ts
window.narrativeDesktop.getAppVersion(): Promise<string>
window.narrativeDesktop.getPlatform(): Promise<'darwin' | 'win32' | 'linux'>
window.narrativeDesktop.getRuntimeMode(): Promise<'web' | 'desktop'>
window.narrativeDesktop.getRuntimeConfig(): Promise<{
  runtimeMode: 'desktop-local'
  apiBaseUrl: string
}>
window.narrativeDesktop.getLocalApiStatus(): Promise<LocalApiStatusSnapshot>
window.narrativeDesktop.restartLocalApi(): Promise<LocalApiStatusSnapshot>
window.narrativeDesktop.getLocalApiLogs(): Promise<string[]>
```

Security rules:

- `contextIsolation` is enabled.
- `sandbox` is enabled.
- `nodeIntegration` is disabled.
- raw `ipcRenderer` is never exposed.
- Node modules are not re-exported to the renderer.
- every new bridge method must be explicit, typed, and scoped to a product
  capability.

## Not Implemented In Early Desktop Rounds

The early desktop rounds still do not implement:

- project directory selection
- worker startup
- packaging or release artifacts
- auto update
- local database storage
- model or LLM integration
- multi-window behavior
- native file read/write capability exposed to renderer

Desktop-PR1 only answers whether the current Workbench can be carried by a safe
Electron shell.

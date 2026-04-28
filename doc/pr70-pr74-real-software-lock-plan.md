# PR70–PR74 Real Software Lock Plan

> Baseline branch: `codex/pr69-real-first-run-generation-rescue`  
> Target outcome: turn PR69's real-model first-run rescue into a real, usable writing loop.  
> Audience: Codex / implementation agent.  
> Language note: keep code, branch names, tests, and UI labels in English where the repository already uses English.

---

## 0. Executive Decision

PR69 rescued the project from fixture-only demo mode into a first-run dogfood prototype. The next five PRs must **not** expand the product horizon. They must convert the existing desktop + API + renderer stack into a usable real project workflow.

The only product chain that matters until PR74 is:

```text
launch desktop
-> create/open real project
-> configure model
-> test connection
-> create chapter/scene
-> run scene with real provider
-> review proposal
-> generate prose
-> read chapter/book draft
-> close and reopen
-> continue writing
-> export Markdown
```

These PRs must not chase Temporal, plugins, Blender, command palette, advanced branch compare, full prompt manager, asset graph, or new dashboard surfaces.

---

## 1. Current Baseline After PR69

Assume the branch already has the following:

- `@narrative-novel/renderer`: Workbench UI, four scopes, settings feature, model settings dialog/provider, Storybook/tests.
- `@narrative-novel/api`: Fastify API server, project runtime, run/review/artifact/trace routes, model gateway, OpenAI provider entry points, fixture/demo paths.
- `@narrative-novel/desktop`: Electron shell, local API supervisor, project picker, credential store, model binding store, recent projects.
- `@narrative-novel/fixture-seed`: canonical demo seed for fixture path.

PR69 README already distinguishes:

```text
fixture demo path
real model dogfood path
mock / Storybook / test path
```

PR70–PR74 must keep these paths distinct. Fixture remains allowed for demo/test, but it must never masquerade as real project generation.

---

## 2. Global Non-Negotiables

### 2.1 Real project mode must not fake success

In `projectMode=real` or equivalent real project identity:

```text
missing OpenAI key -> run blocked or failed with explicit setup error
missing model binding -> run blocked or failed with explicit setup error
provider error -> run failed, no fixture fallback
invalid structured output -> repair/retry if supported, then failed
```

No silent fallback to fixture is allowed in real project mode.

### 2.2 Fixture remains scoped to Demo/Test

Fixture is still useful, but only for:

```text
Open Demo Project
Storybook
unit tests
contract tests
explicit fixture runtime
```

The UI must show when the current project is Demo/Fixture versus Real/OpenAI.

### 2.3 Product state remains reviewable

Do not bypass the existing product state flow:

```text
constraint -> proposal -> review -> accepted canon -> prose
```

AI output must not directly become canon or final prose without review/artifact/trace discipline.

### 2.4 Workbench Constitution still applies

Every frontend change must respect:

```text
WorkbenchShell owns layout
scope/lens owns work identity
Main Stage has one primary task
Navigator is object navigation
Inspector is supporting judgment
Bottom Dock is runtime/problems/trace
route state and layout state remain separate
```

Do not create new page-like dashboards.

### 2.5 Narrow PR rule

Each PR must leave the repository better for real use even if the following PR is never implemented.

---

## 3. Branch Plan

Use these branches unless the repository has a newer naming convention:

```text
codex/pr70-real-mode-lock-no-fixture-bleed
codex/pr71-blank-real-project-mvp
codex/pr72-real-generation-reliability-pass
codex/pr73-persistence-backup-resume
codex/pr74-write-loop-release-candidate
```

Each PR must include a short plan document under `doc/`:

```text
doc/pr70-real-mode-lock-no-fixture-bleed-plan.md
doc/pr71-blank-real-project-mvp-plan.md
doc/pr72-real-generation-reliability-pass-plan.md
doc/pr73-persistence-backup-resume-plan.md
doc/pr74-write-loop-release-candidate-plan.md
```

---

# PR70：Real Mode Lock / No Fixture Bleed

## Goal

Make real project mode impossible to confuse with fixture/demo mode.

After PR70, a user should always know:

```text
Am I in Demo Project or Real Project?
Which provider/model will this run use?
Is Run Scene actually allowed?
If it failed, did it fail honestly instead of silently falling back?
```

## Why this PR comes first

PR69 made real first-run possible. PR70 must make fake success impossible. A failed real run is acceptable. A fake fixture success in a real project is not.

## Scope

### A. Introduce explicit runtime/project mode guard

Find and normalize all current project mode concepts across desktop, API, and renderer.

Expected mode shape:

```ts
type ProjectMode = 'demo' | 'real' | 'mock'
type RuntimeMode = 'web/mock' | 'web/api' | 'desktop-local'
```

The exact type names may differ. Do not invent a second truth if one already exists. Normalize around the existing runtime config and project identity.

A run request must be able to answer:

```text
projectMode: demo | real | mock
runtimeMode: web/mock | web/api | desktop-local
modelProvider: fixture | openai
modelId?: string
```

### B. Block real runs without real bindings

In real project mode, `Run Scene` must be disabled or must fail before execution if:

```text
OpenAI credential is missing
planner binding is not openai
planner modelId is missing
sceneProseWriter binding is not openai
sceneProseWriter modelId is missing
last connection test failed, if available
```

Do not over-block Demo Project. Demo can still use fixture.

### C. Remove silent fixture fallback from real path

Audit model gateway and orchestration paths for fixture fallback behavior.

Rules:

```text
Demo project + fixture binding -> allowed
Storybook/mock -> allowed
Real project + openai binding + provider failure -> run failed
Real project + openai binding + invalid output -> run failed or repair/retry per PR72
Real project + fixture binding -> blocked setup error
```

The gateway can still return fixture if binding explicitly says fixture **and** project mode is demo/mock. In real mode it must throw a product-level setup error.

### D. Add visible real/demo badges

Workbench header or top runtime badge must show:

```text
Real Project / Demo Project / Mock Runtime
Provider: OpenAI / Fixture
Model: <model id> / Not configured
```

Keep it narrow. Do not build a full status bar.

### E. Add run artifact provenance summary

Every run/proposal/prose artifact produced after PR70 must expose minimal provenance:

```ts
provider: 'fixture' | 'openai'
modelId: string
projectMode: 'demo' | 'real' | 'mock'
fallbackUsed: boolean
fallbackReason?: string
```

For real project runs, `fallbackUsed` must be `false`.

## Likely Files / Areas

Start by inspecting these areas, but adapt to actual code:

```text
packages/api/src/config.ts
packages/api/src/orchestration/modelGateway/*
packages/api/src/orchestration/sceneRun/*
packages/api/src/routes/run.ts
packages/api/src/routes/model-settings.ts
packages/renderer/src/features/settings/*
packages/renderer/src/features/run/*
packages/renderer/src/features/scene/*
packages/renderer/src/features/workbench/*
apps/desktop/src/main/model-binding-store.ts
apps/desktop/src/main/project-store.ts
apps/desktop/src/main/local-api-supervisor.ts
apps/desktop/src/shared/desktop-bridge-types.ts
```

## Tests

Add or update tests for:

```text
api: real mode + missing key -> setup error, no fixture provider invoked
api: real mode + fixture binding -> setup error
api: demo mode + fixture binding -> fixture still works
api: openai provider error -> failed run, no fallback
api: invalid output -> failed run, no fallback
renderer: Run Scene disabled/warned when real project model setup is incomplete
renderer: runtime badge differentiates Real Project vs Demo Project
renderer: run provenance visible in artifact/trace surface
```

Minimum commands:

```bash
pnpm typecheck
pnpm test
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/desktop test
```

## Acceptance Criteria

A reviewer can verify:

```text
Open Demo Project -> fixture run works and is visibly Demo/Fixture.
Create Real Project without key -> Run Scene does not fake success.
Create Real Project with key but missing model -> Run Scene does not fake success.
OpenAI provider error -> run enters failed state with explicit error.
No artifact generated in real mode claims fixture success.
```

## Explicit Non-Goals

```text
No blank project CRUD yet.
No backup system yet.
No export workflow yet.
No Temporal/SSE/token streaming.
No full prompt manager.
No provider marketplace.
```

## PR70 Failure Conditions

PR70 fails if any real project path can still silently produce fixture prose/proposal while the UI looks successful.

---

# PR71：Blank Real Project MVP

## Goal

Allow a user to create their own minimal real writing project instead of being locked into SignalArc/demo seed.

After PR71, a real user can create:

```text
Project
-> Book
-> Chapter
-> Scene
```

and edit enough scene setup to run a first real generation.

## Why this PR comes second

PR70 prevents fake success. PR71 gives real users their own starting point.

## User Story

```text
I launch desktop.
I click Create Real Project.
I choose a folder.
I enter a project title and book title.
I create Chapter 1.
I create Scene 1.
I enter scene title, objective, cast note, location note, and constraints.
I save.
I can close/reopen and see the same objects.
```

## Scope

### A. Real project template must be blank/minimal

Do not use `book-signal-arc` as the hidden real project content.

Real project initial state should contain either:

```text
empty book with no chapters/scenes
```

or a minimal starter:

```text
Book: user-entered title
Chapter: Chapter 1
Scene: Scene 1
```

The first-run flow can choose one, but it must be user-owned and clearly not SignalArc.

### B. Minimal object CRUD

Implement the smallest persistent operations needed:

```text
create book if needed
create chapter
rename chapter
create scene
rename scene
edit scene setup fields
save chapter scene ordering
```

Scene setup fields for PR71:

```ts
sceneTitle: string
sceneObjective: string
castNote?: string
locationNote?: string
constraints?: string
povNote?: string
```

Do not build full character/location asset CRUD yet. Notes are enough.

### C. Navigator must show real project hierarchy

Navigator should show real project objects:

```text
Book
  Chapter 1
    Scene 1
```

It must not fall back to SignalArc canonical seed for a real project.

### D. Route should deep-link real objects

Existing workbench route model should support:

```text
/workbench?scope=scene&id=<real-scene-id>&lens=orchestrate&tab=setup
/workbench?scope=chapter&id=<real-chapter-id>&lens=structure
/workbench?scope=book&id=<real-book-id>&lens=draft
```

Avoid introducing a new page-based route system.

### E. Basic empty states

Real project empty states must be actionable:

```text
No chapters yet -> Create Chapter
No scenes yet -> Create Scene
Scene missing setup -> Fill setup before run
```

## Likely Files / Areas

```text
packages/api/src/repositories/project-state-persistence.ts
packages/api/src/repositories/project-store* or local project repository files
packages/api/src/routes/book.ts
packages/api/src/routes/chapter.ts
packages/api/src/routes/scene.ts
packages/api/src/routes/project-runtime.ts
packages/renderer/src/features/book/*
packages/renderer/src/features/chapter/*
packages/renderer/src/features/scene/*
packages/renderer/src/features/workbench/*
apps/desktop/src/main/project-store.ts
apps/desktop/src/main/recent-projects* if present
apps/desktop/src/main/project-picker* if present
```

## API Contract Suggestions

Prefer using existing routes if present. If missing, add narrow endpoints such as:

```http
POST /api/projects/{projectId}/chapters
PATCH /api/projects/{projectId}/chapters/{chapterId}
POST /api/projects/{projectId}/chapters/{chapterId}/scenes
PATCH /api/projects/{projectId}/scenes/{sceneId}/setup
PATCH /api/projects/{projectId}/chapters/{chapterId}/scene-order
```

Response models must match existing renderer read models where possible.

## Tests

Add or update tests for:

```text
api: create real project template without SignalArc objects
api: create chapter persists
api: create scene persists
api: edit scene setup persists
api: reorder scenes persists
renderer: empty real project shows Create Chapter
renderer: chapter empty state shows Create Scene
renderer: created scene appears in navigator
renderer: scene setup fields save and restore
```

Minimum commands:

```bash
pnpm typecheck
pnpm test
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/desktop test
```

## Acceptance Criteria

A reviewer can verify:

```text
Create Real Project does not create hidden SignalArc story content.
A new chapter and scene can be created from UI.
Scene setup can be edited and saved.
Closing and reopening desktop preserves project/chapter/scene/setup.
Navigator and route point to real object IDs.
```

## Explicit Non-Goals

```text
No full asset/story bible CRUD.
No chapter outliner polish beyond minimal object visibility.
No drag-and-drop reorder unless already present and cheap.
No import/export yet.
No multi-book library management.
No real database migration system yet; file persistence is enough.
```

## PR71 Failure Conditions

PR71 fails if a real project still depends on demo seed objects to show a usable workbench.

---

# PR72：Real Generation Reliability Pass

## Goal

Make one real scene generation reliable enough for dogfood use.

After PR72, a real model run should produce either:

```text
clear proposal/review/prose artifacts with provider/model provenance
```

or:

```text
clear failed run state with actionable error and safe retry
```

## Why this PR comes third

PR70 stops fake success. PR71 creates real input objects. PR72 makes real generation survivable.

## Scope

### A. Structured output validation and repair/retry

For planner/proposal generation and prose generation:

```text
validate structured output
on invalid output, attempt one repair/retry if supported
if repair fails, mark run failed
never write invalid output into canon/prose
```

Keep retry count small and deterministic:

```ts
maxStructuredOutputRepairAttempts = 1
```

The retry prompt can be simple:

```text
The previous output did not match the required JSON schema. Return only valid JSON matching this schema.
```

Do not build full prompt manager.

### B. Run error model

Normalize run failures into a user-facing error shape:

```ts
type RunFailureClass =
  | 'missing_model_config'
  | 'provider_error'
  | 'invalid_output'
  | 'rate_limited'
  | 'cancelled'
  | 'unknown'

interface RunFailureSummary {
  failureClass: RunFailureClass
  provider?: 'openai' | 'fixture'
  modelId?: string
  retryable: boolean
  userMessage: string
  technicalMessage?: string
}
```

Expose this via run detail and/or run events without dumping raw provider secrets.

### C. Token/cost/latency metadata

Capture what the provider returns if available:

```ts
promptTokens?: number
completionTokens?: number
totalTokens?: number
estimatedCostUsd?: number
latencyMs?: number
providerRequestId?: string
```

If exact cost is not implemented, expose tokens/latency and leave cost absent. Do not fake cost.

### D. Idempotent retry behavior

Retry must not duplicate accepted prose or corrupt scene state.

Rules:

```text
Retry failed run -> creates a new run or safely resumes failed run, but does not duplicate accepted canon.
Accept same review twice -> idempotent or returns conflict, not duplicate canon patch.
Request rewrite -> does not overwrite current accepted prose.
Reject -> leaves current prose unchanged.
```

### E. UI reliability states

Scene Orchestrate should show:

```text
running
waiting review
failed retryable
failed non-retryable
completed
```

Scene Draft should show:

```text
No prose yet
Prose generated
Prose generation failed
Retry available if safe
```

## Likely Files / Areas

```text
packages/api/src/orchestration/modelGateway/*OutputSchema.ts
packages/api/src/orchestration/modelGateway/*Gateway.ts
packages/api/src/orchestration/modelGateway/modelGatewayErrors.ts
packages/api/src/orchestration/sceneRun/*
packages/api/src/routes/run.ts
packages/api/src/routes/runArtifacts.ts
packages/renderer/src/features/run/*
packages/renderer/src/features/scene/*
packages/renderer/src/features/traceability/*
```

## Tests

Add or update tests for:

```text
api: invalid planner JSON -> one repair attempt -> success
api: invalid planner JSON + failed repair -> failed run
api: provider error -> failed run with retryable true when appropriate
api: missing model config -> failed setup error, no provider call
api: accept review twice -> no duplicate canon/prose
api: reject/request rewrite does not overwrite prose
renderer: failed run displays user-facing error
renderer: retry action visible only when retryable
renderer: token/latency metadata visible in runtime/artifact support surface
```

Minimum commands:

```bash
pnpm typecheck
pnpm test
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/renderer test
```

## Acceptance Criteria

A reviewer can verify:

```text
Bad API key fails visibly.
Invalid structured output does not enter canon.
Provider timeout/rate-limit does not fallback to fixture.
Successful run records provider/model/tokens/latency when available.
Retry does not duplicate prose/canon.
```

## Explicit Non-Goals

```text
No streaming tokens.
No Temporal or durable workflow platform.
No complex backoff UI.
No multi-provider marketplace.
No full cost accounting dashboard.
No advanced prompt editor.
```

## PR72 Failure Conditions

PR72 fails if invalid or failed real model output can still create accepted prose/canon as if it succeeded.

---

# PR73：Persistence / Backup / Resume

## Goal

Make users comfortable putting real content into the app.

After PR73, a user can close/reopen the app, recover from common local file problems, and export a backup project archive.

## Why this PR comes fourth

A real generation loop is not usable if users fear data loss.

## Scope

### A. Project schema version

Every real project state file must include:

```ts
schemaVersion: number
appVersion?: string
createdAt: string
updatedAt: string
```

If some files already have versions, normalize them. Do not invent competing version fields.

### B. Atomic writes and backup snapshots

Before writing critical project state:

```text
write temp file
rename temp file atomically
keep previous snapshot backup
```

Minimum backup policy:

```text
.narrative/backups/YYYYMMDD-HHMMSS/<state files>
keep last 10 backups by default
```

If backup size is a concern, start with project metadata/state JSON and prose artifacts only. Do not over-engineer incremental backups.

### C. Corrupt file recovery

If a project state file is invalid JSON or fails schema validation:

```text
move broken file to .narrative/recovery/broken-<timestamp>.json
restore latest valid backup if available
show recovery notice in desktop/renderer
```

Do not silently reset real project to empty unless there is no backup and user explicitly chooses reset.

### D. Resume state

On reopen, restore:

```text
last project
recent projects
last selected book/chapter/scene where feasible
scene setup
run/review status
accepted prose
chapter/book draft read surfaces
model binding settings
credential configured status, not raw secret
```

Route restore should not override unavailable/deleted objects; fall back to nearest valid object.

### E. Project export zip

Add a minimal export action:

```text
Export Project Backup
```

It should create a zip containing:

```text
narrative.project.json or equivalent project descriptor
.narrative project state files
artifacts/prose/context/trace files if stored separately
model-bindings metadata without raw API key
README-backup.txt explaining what is included/excluded
```

Do not include raw OpenAI API key.

### F. Markdown manuscript export

If not already reliable, add minimal Markdown export:

```text
Export Manuscript Markdown
```

Output:

```text
# Book Title

## Chapter Title

### Scene Title

<scene prose>
```

Missing prose scenes should show an explicit marker:

```text
<!-- Scene not drafted yet: Scene Title -->
```

## Likely Files / Areas

```text
packages/api/src/repositories/project-state-persistence.ts
packages/api/src/repositories/*artifact* or project store files
packages/api/src/routes/book.ts
packages/api/src/routes/project-runtime.ts
apps/desktop/src/main/project-store.ts
apps/desktop/src/main/recent-projects* if present
apps/desktop/src/main/credential-store.ts
apps/desktop/src/main/model-binding-store.ts
apps/desktop/src/main/*export* if present
packages/renderer/src/features/book/*export*
packages/renderer/src/features/workbench/*runtime*
```

## Tests

Add or update tests for:

```text
api/desktop: project state writes are atomic
api/desktop: backup snapshot created before overwrite
api/desktop: corrupt state restores latest valid backup
api/desktop: raw credential is not included in project backup zip
api/renderer: reopen restores recent project and route fallback
api/renderer: accepted prose remains after restart
api: Markdown export includes book/chapter/scene prose
```

Minimum commands:

```bash
pnpm typecheck
pnpm test
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/desktop test
pnpm --filter @narrative-novel/renderer test
```

## Acceptance Criteria

A reviewer can verify:

```text
Create project -> create scene -> run -> accept -> prose visible.
Quit desktop.
Relaunch desktop.
Recent project opens and prose is still there.
Manually corrupt a project state JSON.
Relaunch shows recovery notice and restores backup when available.
Export Project Backup creates zip without API key.
Export Markdown creates readable manuscript draft.
```

## Explicit Non-Goals

```text
No cloud sync.
No collaborative editing.
No encrypted project archive unless already easy.
No full migration framework beyond schemaVersion guard.
No database engine migration.
No binary artifact deduplication.
```

## PR73 Failure Conditions

PR73 fails if a successful real generation can be lost after closing/reopening the app without clear recovery or backup path.

---

# PR74：Write Loop Release Candidate

## Goal

Freeze one complete real writing loop as a release candidate.

After PR74, the project should be suitable for serious dogfood use by a non-developer who has an OpenAI API key.

## Why this PR comes last

PR70–PR73 create the foundations for honest real use. PR74 locks the loop and removes friction.

## Release Candidate Script

PR74 must make this script pass:

```text
1. pnpm install
2. pnpm dev:desktop
3. Create Real Project
4. Enter project/book title
5. Open Model Settings
6. Save OpenAI API key
7. Set planner model
8. Set sceneProseWriter model
9. Test Connection -> passed
10. Create Chapter 1
11. Create Scene 1
12. Fill scene objective / cast note / location note / constraints
13. Run Scene
14. See run timeline and proposal
15. Accept or Accept with edit
16. See prose generated in Scene Draft
17. Open Chapter Draft and read assembled prose
18. Open Book Draft and read manuscript
19. Export Markdown
20. Quit app
21. Reopen app
22. Recent project resumes with prose still present
23. Run another scene or continue editing
```

## Scope

### A. Remove first-run friction

Add a narrow first-run checklist in desktop/workbench:

```text
Project created
Model key configured
Connection tested
Chapter exists
Scene exists
Scene setup complete
Ready to run
```

This should be a calm onboarding surface, not a dashboard. It can live in Main Stage empty state or a modal/wizard if already consistent with the app.

### B. One primary CTA at each state

Each state must have a single obvious next action:

```text
No project -> Create Real Project / Open Existing Project
No model -> Open Model Settings
No chapter -> Create Chapter
No scene -> Create Scene
Scene incomplete -> Complete Setup
Ready -> Run Scene
Waiting review -> Review Proposal
Accepted -> Generate/View Prose
Prose ready -> Open Chapter Draft
Chapter draft ready -> Open Book Draft / Export Markdown
```

### C. Real/Demo separation in docs and UI

Update docs and UI copy so users understand:

```text
Open Demo Project = fixture demonstration
Create Real Project = your writing project
Mock/Storybook = development only
```

Do not bury this in developer docs only.

### D. Smoke test / E2E-lite coverage

Add one high-level smoke test. It can be API-level plus renderer-level if full Electron E2E is too heavy.

Minimum smoke coverage:

```text
create real project
configure model settings with test fake/stub provider
create chapter/scene
start run
submit review decision
materialize prose
read chapter/book draft
export markdown
reload state
```

Use controlled test provider/stubs, not live OpenAI, for CI.

### E. Dogfood issue template

Add a lightweight dogfood checklist doc:

```text
doc/real-writing-dogfood-checklist.md
```

It should include:

```text
setup steps
known limitations
how to report model/run failure
where backups live
what is included in export
what fixture/demo means
```

### F. Cleanup obvious dead/confusing paths

Do not delete useful test/mock infrastructure. But remove or label UI paths that confuse real users:

```text
fixture-only controls visible in real project
legacy accept endpoints exposed in main UI
ambiguous run success copy
hidden mock fallback in real dogfood path
```

## Likely Files / Areas

```text
README.md
doc/usable-prototype-demo-script.md
doc/real-writing-dogfood-checklist.md
packages/renderer/src/App.tsx
packages/renderer/src/features/settings/*
packages/renderer/src/features/workbench/*
packages/renderer/src/features/scene/*
packages/renderer/src/features/chapter/*
packages/renderer/src/features/book/*
packages/renderer/src/features/run/*
packages/api/src/routes/*
apps/desktop/src/main/*
apps/desktop/src/shared/*
```

## Tests

Minimum commands:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @narrative-novel/renderer build-storybook
pnpm --filter @narrative-novel/desktop test
pnpm --filter @narrative-novel/desktop build
```

If desktop build is too environment-sensitive, document exactly why and keep typecheck/test passing.

Add tests for:

```text
first-run checklist state transitions
real project can complete fake-provider/stubbed run in CI
export Markdown includes generated prose
restart/reload restores prose and project identity
fixture/demo project remains available and labeled
mock fallback is never presented as real model dogfood
```

## Acceptance Criteria

PR74 is accepted only if a reviewer can follow the Release Candidate Script without reading source code.

The final README must make this distinction clear:

```text
Use Demo Project to see the product shape without a model key.
Use Create Real Project + Model Settings for real writing.
Mock runtime is development-only.
```

## Explicit Non-Goals

```text
No Temporal.
No live SSE/token streaming.
No model marketplace.
No plugin system.
No Blender/spatial layer.
No advanced branch/compare release.
No complete asset graph.
No cloud account/auth.
No packaging notarization/signing unless already trivial.
```

## PR74 Failure Conditions

PR74 fails if the user still needs developer knowledge to complete the real writing loop.

---

## 4. Cross-PR Test Matrix

Keep this table updated in each PR plan.

| Scenario | PR70 | PR71 | PR72 | PR73 | PR74 |
|---|---:|---:|---:|---:|---:|
| Demo fixture run still works | yes | yes | yes | yes | yes |
| Real project cannot silently use fixture | yes | yes | yes | yes | yes |
| Blank real project can be created | no | yes | yes | yes | yes |
| Real scene setup can be edited | no | yes | yes | yes | yes |
| Real run error is honest and actionable | partial | partial | yes | yes | yes |
| Invalid output cannot enter canon/prose | partial | partial | yes | yes | yes |
| Accepted prose survives restart | no | partial | partial | yes | yes |
| Markdown export works | no | no | no | yes | yes |
| Full real writing loop script passes | no | no | no | partial | yes |

---

## 5. Do-Not-Start List Until PR74 Lands

Do not start these unless directly required to complete PR70–PR74:

```text
Temporal / durable workflow platform
real SSE or token streaming
Blender / Spatial Blackboard
plugin / extension system
full prompt manager
command palette
full status bar
asset graph expansion
multi-provider marketplace
advanced branch compare
collaboration / cloud sync
large UI redesign
new dashboard surfaces
```

---

## 6. Codex Execution Protocol

At the start of each PR, Codex must write a short execution note answering:

```text
1. Which part of the real writing loop does this PR advance?
2. How does it prevent fake fixture success?
3. What is the primary user-facing acceptance path?
4. Which existing mock/demo paths remain intentionally supported?
5. Which tests prove the path?
```

Before final response, Codex must report:

```text
changed files
key behavior changes
tests run and results
known limitations
whether any non-goals were touched
```

If tests cannot run, Codex must state exactly why and provide the closest available evidence.

---

## 7. Final Success Definition

The PR70–PR74 sequence is successful when the project has stopped being primarily a fixture/demo workbench and has become a real writing tool with a demo mode.

The final product state should be:

```text
Demo mode: stable fixture showcase.
Real mode: usable local writing project with OpenAI-backed generation.
Mock mode: development-only UI/testing support.
```

The user should never have to ask:

```text
Did this really call my model?
Where did my prose go?
Will it still be there after restart?
How do I start my own book?
How do I export what I wrote?
```


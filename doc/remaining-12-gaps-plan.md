# Remaining 12 Gaps: Execution Plan

## P1 (blocks usability)

### 1. Scene setup incomplete → prompt user (PR71-E)
- **File**: `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
- **Change**: Before the "Run Scene" button, check if `execution.objective.goal` is empty. If so, show an actionable warning: "Fill scene objective before running" with a link to the Setup tab.

### 2. UI: retryable vs non-retryable failure + retry CTA (PR72-E)
- **File**: `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
- **Change**: When `activeRun.status === 'failed'`, check `activeRun.failureClass` to show:
  - retryable failures (provider_error, rate_limited, model_timeout): "Retry Run" button
  - non-retryable failures (invalid_output, missing_model_config): "Fix & Retry" guidance with model settings link
- **File**: `packages/renderer/src/features/run/` — add `useRetryRunMutation` hook if not present
- **File**: `packages/renderer/src/features/scene/components/SceneProseTab.tsx`
  - Show failure state when prose generation failed

### 3. Resume last book/chapter/scene scope on reopen (PR73-D)
- **File**: `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts`
- **Change**: On first load with no URL params, check `localStorage` for last-known scope + id, and use those as defaults (over project first-object defaults when a previous session exists).

---

## P2 (polish)

### 4. Chapter rename inline editing (PR71)
- **File**: `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
- **Change**: Make chapter title click-to-edit (inline input that calls `chapterClient.renameChapter` on blur/Enter).

### 5. Project export ZIP (PR73-E)
- **File**: New `packages/api/src/repositories/project-export-zip.ts`
- **Change**: Create a ZIP archive containing: project store JSON, narrative.project.json, artifacts dir content, README-backup.txt. Exclude raw API keys (reuse `sanitizeArchiveValue`).
- **Route**: Add `GET /projects/:projectId/export-zip` in project-runtime.ts or book.ts
- **Dependency**: Need `archiver` or Node.js built-in zlib. Use Node.js built-in if possible.

### 6. Recovery notice in UI (PR73-C)
- **File**: `packages/api/src/routes/project-runtime.ts`
- **Change**: Add a `recoveryNotice` field to the `/current-project` or `/runtime-info` response when recovery occurred on load.
- **File**: `packages/renderer/src/app/project-runtime/` — show a banner/toast when recovery notice is present.

### 7. Cleanup fixture-only controls in real project (PR74-F)
- **Files**: Various renderer components
- **Change**: Audit and hide/disable UI elements that only make sense in demo mode when projectMode is real-project. Key areas: asset scope (no real-project assets yet), fixture-specific run labels.

### 8. Smoke test for real project flow (PR74-D)
- **File**: New `packages/api/src/createServer.real-project-smoke.test.ts`
- **Change**: Exercise the full loop: create project → create chapter → create scene → edit setup → run (with fixture provider) → review → verify prose → export markdown → verify output.

### 9. Scene rename standalone action (PR71)
- **File**: `packages/renderer/src/features/scene/components/SceneHeader.tsx`
- **Change**: Add inline click-to-edit for scene title.

### 10. Book empty state "Create Chapter" in ChapterWorkbench (PR71-E)
- **File**: `packages/renderer/src/features/chapter/containers/ChapterWorkbench.tsx` or `ChapterStructureWorkspace.tsx`
- **Change**: When chapter has no scenes but is in a real project, show "Create First Scene" CTA.

### 11. Export README-backup.txt (PR73-E)
- **File**: `packages/api/src/repositories/project-export-zip.ts`
- **Change**: Include a README-backup.txt explaining what's included/excluded.

### 12. Scene setup fields restore after reopen (verify) (PR73-D)
- **Status**: Already works (pre-existing persistence). Add test to verify.

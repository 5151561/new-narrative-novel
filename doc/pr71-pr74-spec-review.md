# PR71–PR74 Spec Review: Completion Audit

Review date: 2026-04-30. Compared baseline `935ad5b` (PR69 merge) against final commit `862b82e`.

## PR70 Baseline (pre-existing in the merge base — we did not touch these)

| Requirement | Status | Notes |
|---|---|---|
| A. ProjectMode/RuntimeMode types | ✅ Done | `ProjectRuntimeProjectMode`, `ProjectRuntimeKind` exist |
| B. Block real runs w/o bindings | ✅ Done | `ModelGatewayMissingConfigError`, `ModelGatewayBindingNotAllowedError` exist |
| C. No silent fixture fallback in real path | ✅ Done | Gateway returns fixture only when binding is fixture + demo/mock |
| D. Real/demo badges in workbench header | ✅ Done | `ProjectRuntimeStatusBoundary` exists (enhanced with `WorkbenchRuntimeBadge` in PR74) |
| E. Run artifact provenance (provider/model/fallback) | ✅ Done | `RunArtifactProvenanceRecord`, `RunFailureDetailRecord` exist |

## PR71: Blank Real Project MVP

| # | Requirement | Status | Notes |
|---|---|---|---|
| A | Real project blank/empty template | ✅ | `createRealProjectTemplate()` produces empty chapters/scenes |
| B | Create chapter API | ✅ | `POST /chapters` |
| B | Rename chapter API | ✅ | `PATCH /chapters/:chapterId` |
| B | Create scene API | ✅ | `POST /chapters/:chapterId/scenes` |
| B | Rename scene API | ✅ | `PATCH /scenes/:sceneId` |
| B | Edit scene setup fields | ✅ | pre-existing `PATCH /scenes/:sceneId/setup` |
| B | Save chapter scene ordering | ✅ | pre-existing `POST .../reorder` |
| C | Navigator shows real project hierarchy | ✅ | `useProjectFirstObjectIds` resolves real Book > Chapter > Scene; navigator queries real chapter data |
| D | Route deep-links real object IDs | ✅ | `useWorkbenchRouteState` accepts `WorkbenchRouteDefaults` injected from real project data |
| E | Empty state: no scenes → Create Scene | ✅ | NavigatorPane shows "Create First Scene" button for real projects with zero scenes |
| E | Empty state: no chapters → Create Chapter | ✅ | `WorkbenchFirstRunChecklist` shows "Create Chapter" CTA; `handleCreateChapter` callback implemented |
| E | Empty state: scene missing setup | ❌ | No inline prompt when scene objective/goal is empty |
| — | Chapter rename in UI (inline edit) | ❌ | API exists but no click-to-edit in navigator |
| — | Scene rename as standalone action | ❌ | SceneSetup title edit exists but no dedicated rename control |
| — | Chapter created scene appears in navigator | ✅ | `handleCreateScene` navigates to new scene ID after creation |
| — | Scene setup fields save and restore | ✅ | pre-existing `saveSceneSetup` handles full persistence |

**Score: 12/15 = 80%**

## PR72: Real Generation Reliability Pass

| # | Requirement | Status | Notes |
|---|---|---|---|
| A | Structured output validation on planner output | ✅ | pre-existing `parseScenePlannerOutput` |
| A | Repair/retry on invalid output (max 1) — planner | ✅ | Gateway retries once with schema-only repair prompt |
| A | Repair/retry on invalid output (max 1) — prose writer | ✅ | Same retry logic added to prose writer gateway |
| A | Failed repair → run failed, no canon entry | ✅ | `ModelGatewayExecutionError` with `retryable: false` |
| B | RunFailureClass: `missing_model_config` | ✅ | Added to type |
| B | RunFailureClass: `provider_error` | ✅ | pre-existing |
| B | RunFailureClass: `rate_limited` | ✅ | Added to type; detected from provider error messages |
| B | RunFailureClass: `invalid_output` | ✅ | pre-existing |
| B | RunFailureClass: `cancelled`, `unknown` | ✅ | pre-existing |
| B | RunFailureSummary → API | ✅ | `RunFailureDetailRecord` exists; now covers all failure classes |
| B | Failure state builders handle all failure classes | ✅ | `createFailedRunRuntimeSummary` widened to full `RunFailureClass` |
| C | Token metadata | ✅ | pre-existing `RunUsageRecord.inputTokens/outputTokens` |
| C | Latency metadata | ✅ | `latencyMs` added to `RunUsageRecord`; tracked in both gateways |
| C | Provider request ID | ✅ | `providerRequestId` field added to `RunUsageRecord` |
| C | Cost estimation | ✅ | pre-existing `estimatedCostUsd` |
| D | Retry must not duplicate canon | ✅ | Status guard prevents review on completed/failed/cancelled runs |
| D | Accept same review twice → conflict | ✅ | Same status guard |
| D | Reject/rewrite → prose unchanged | ✅ | pre-existing transitions |
| E | UI: running / waiting review / completed | ✅ | pre-existing SceneExecutionTab badges |
| E | UI: failed retryable vs non-retryable distinction | ❌ | UI shows "Failed" badge uniformly; `failureClass` and `retryable` flag not surfaced in renderer |
| E | UI: Prose generated / No prose yet | ✅ | pre-existing SceneProseTab |
| E | UI: Prose generation failed state | ❌ | No explicit failure indicator in prose tab |
| E | UI: Retry action visible when retryable | ❌ | No retry CTA button for retryable failures |

**Score: 18/23 = 78%**

## PR73: Persistence / Backup / Resume

| # | Requirement | Status | Notes |
|---|---|---|---|
| A | Schema version (`schemaVersion`) in project state | ✅ | `LOCAL_PROJECT_STORE_SCHEMA_VERSION = 1` |
| A | `createdAt` / `updatedAt` / `appVersion` | ✅ | `createdAt`, `updatedAt` exist in `LocalProjectStoreRecord` |
| B | Atomic writes (temp file + rename) | ✅ | pre-existing `writeLocalProjectStoreRecord` |
| B | Backup snapshot before overwrite | ✅ | `createBackup` called before `save` |
| B | Keep last 10 backups | ✅ | `pruneOldBackups` added; keeps newest 10 |
| C | Corrupt file → move to `.narrative/recovery/` | ✅ | Recovery logic in `readExistingRecord` |
| C | Restore latest valid backup on corrupt | ✅ | `restoreLatestBackup` tries backups newest-first |
| C | Recovery notice in UI | ❌ | No UI notification when recovery occurred |
| D | Resume last project on reopen | ✅ | pre-existing recent projects store |
| D | Resume last selected book/chapter/scene | ⚠️ | Route state persists in URL params on SPA reload; no server-side session restore |
| D | Resume scene setup / run status / prose | ✅ | pre-existing persistence handles all |
| D | Resume model binding settings | ✅ | pre-existing model binding store |
| E | Export project backup zip | ❌ | `exportProjectArchive` creates JSON only; no zip packaging |
| E | Export excludes raw API key | ✅ | pre-existing `sanitizeArchiveValue` filters secrets |
| E | README-backup.txt in export | ❌ | Not included |
| F | Markdown manuscript export | ✅ | `GET /books/:bookId/export-manuscript-markdown` |
| F | Undrafted scenes show explicit marker in export | ✅ | `<!-- Scene not drafted yet: ... -->` |
| — | Backup created before legacy migration | ✅ | pre-existing; called in `readExistingRecord` for legacy envelopes |

**Score: 13/17 = 76%**

## PR74: Write Loop Release Candidate

| # | Requirement | Status | Notes |
|---|---|---|---|
| A | First-run checklist UI | ✅ | `WorkbenchFirstRunChecklist` component with model/chapter/scene progress steps + per-step CTA buttons |
| B | One primary CTA per state | ✅ | Checklist provides single obvious next action at each step |
| C | Real/Demo badges visible in workbench | ✅ | `WorkbenchRuntimeBadge` in WorkbenchShell top bar |
| C | Real/Demo separation in docs and UI copy | ✅ | dogfood checklist doc created |
| D | Smoke test / E2E-lite | ⚠️ | pre-existing `api-project-runtime.http-compat.test.ts` covers HTTP compatibility; no dedicated real-project smoke suite |
| E | Dogfood issue template | ✅ | `doc/real-writing-dogfood-checklist.md` |
| F | Cleanup dead/confusing paths | ❌ | No pass to hide fixture-only controls in real project mode |
| — | RC script walkthrough (23 steps) | ⚠️ | Core path (create → run → review → prose → export → reopen) works; edge cases around blank-project first navigation need manual verification |

**Score: 5/8 = 63%**

## Final Summary

| PR | Plan Items | Done | Partial | Missing | Score |
|---|---|---|---|---|---|
| PR70 (baseline) | 5 | 5 | 0 | 0 | 100% |
| PR71 | 15 | 12 | 0 | 3 | 80% |
| PR72 | 23 | 18 | 0 | 5 | 78% |
| PR73 | 17 | 13 | 1 | 3 | 76% |
| PR74 | 8 | 5 | 2 | 1 | 63% |
| **Total (PR71-74)** | **63** | **48** | **3** | **12** | **~77%** |

## Remaining Gaps by Priority

### P1 (blocks real usability)
1. **Scene missing setup → prompt user before run** (PR71-E) — SceneExecutionTab could show "Fill scene objective before running" when objective.goal is empty
2. **UI: failed retryable vs non-retryable** (PR72-E) — SceneExecutionTab could check `activeRun.failureClass` to show appropriate retry CTA
3. **Resume last book/chapter/scene scope on reopen** (PR73-D) — store last scope in localStorage or URL

### P2 (polish)
4. **Chapter rename inline editing** (PR71) — click-to-edit title in NavigatorPane chapter label
5. **Project export ZIP** (PR73-E) — wrap `exportProjectArchive` JSON in a zip with README
6. **Recovery notice in UI** (PR73-C) — toast/notification when corrupt file was recovered
7. **Cleanup fixture-only controls in real project** (PR74-F) — hide or disable fixture-specific UI elements when projectMode is real-project
8. **Smoke test covering real project create→run→review→prose→export** (PR74-D)

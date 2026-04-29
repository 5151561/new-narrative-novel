# PR71–PR74 Spec Review: Completion Audit

Review date: 2026-04-30. Compared baseline `935ad5b` (PR69 merge) against commits `72b44c9`, `5d2c8a2`, `5f20f0a`, `05248af`, `507f4f0`.

## PR70 Baseline (pre-existing, not in our commits)

| Requirement | Status | Notes |
|---|---|---|
| A. ProjectMode/RuntimeMode types | ✅ Done | `ProjectRuntimeProjectMode`, `ProjectRuntimeKind` exist |
| B. Block real runs w/o bindings | ✅ Done | `ModelGatewayMissingConfigError`, `ModelGatewayBindingNotAllowedError` exist |
| C. No silent fixture fallback | ✅ Done | Gateway returns fixture only when binding is fixture + demo/mock |
| D. Real/demo badges | ✅ Done | `ProjectRuntimeStatusBoundary` exists |
| E. Artifact provenance | ✅ Done | `RunArtifactProvenanceRecord`, `RunFailureDetailRecord` exist |

## PR71: Blank Real Project MVP

| Requirement | Status | Notes |
|---|---|---|
| A. Real project blank template | ✅ Done | `createRealProjectTemplate()` produces empty chapters/scenes |
| B. Create chapter API | ✅ Done | `POST /chapters` route + repo method |
| B. Rename chapter API | ✅ Done | `PATCH /chapters/:chapterId` route + repo method |
| B. Create scene API | ✅ Done | `POST /chapters/:chapterId/scenes` route + repo method |
| B. Rename scene API | ✅ Done | `PATCH /scenes/:sceneId` for title rename |
| B. Edit scene setup fields | ✅ Pre-existing | `PATCH /scenes/:sceneId/setup` already existed |
| B. Save chapter scene ordering | ✅ Pre-existing | `POST /chapters/:chapterId/scenes/:sceneId/reorder` existed |
| C. Navigator shows real project hierarchy | ⚠️ Partial | Defaults now resolve real objects, but still uses SignalArc fallback in some paths |
| D. Route deep-links real objects | ⚠️ Partial | URL `id` param works, but no automatic redirect from SignalArc defaults on page load |
| E. Empty state: no chapters → Create Chapter | ❌ Missing | Only scene-level empty state implemented, no book-level |
| E. Empty state: no scenes → Create Scene | ✅ Done | NavigatorPane shows "Create First Scene" button |
| E. Empty state: scene setup incomplete | ❌ Missing | No actionable prompt when scene objective is empty |
| Chapter rename in UI | ❌ Missing | No inline click-to-edit for chapter titles in navigator/frontend |
| Scene rename in UI | ❌ Missing | Scene title edit exists in SceneSetup but not as standalone rename action |
| Import/export of mock chapter/scene snapshots | ❌ Missing | `createMockChapter` etc. exist but no snapshot methods |

## PR72: Real Generation Reliability Pass

| Requirement | Status | Notes |
|---|---|---|
| A. Structured output validation | ✅ Pre-existing | `parseScenePlannerOutput` already validates |
| A. Repair/retry on invalid output (max 1) | ✅ Done | Planner gateway retries once with schema-only prompt |
| A. Retry in prose writer gateway | ❌ Missing | Only planner gateway has retry; prose writer does not |
| A. Never write invalid output into canon | ✅ Pre-existing | `parseScenePlannerOutput` throws before output enters workflow |
| B. RunFailureClass: missing_model_config | ✅ Done | Added to type |
| B. RunFailureClass: provider_error | ✅ Pre-existing | Already existed |
| B. RunFailureClass: rate_limited | ✅ Done | Added to type + mapped from provider errors |
| B. RunFailureClass: invalid_output | ✅ Pre-existing | Already existed |
| B. RunFailureClass: cancelled, unknown | ✅ Pre-existing | Already existed |
| B. RunFailureSummary exposed via API | ✅ Pre-existing | `RunFailureDetailRecord` exists in artifact detail |
| C. Token metadata (promptTokens etc.) | ✅ Pre-existing | `RunUsageRecord.inputTokens`, `outputTokens` exist |
| C. Latency metadata | ✅ Done | `latencyMs` added to `RunUsageRecord` + tracked in gateway |
| C. Provider request ID | ✅ Done | `providerRequestId` added to `RunUsageRecord` |
| C. Cost estimation | ✅ Pre-existing | `estimatedCostUsd` exists |
| D. Retry must not duplicate canon | ✅ Done | Status guard prevents review on completed/failed/cancelled runs |
| D. Accept same review twice → conflict | ✅ Done | Same status guard handles this |
| D. Reject/rewrite → leaves prose unchanged | ✅ Pre-existing | Existing transitions handle this |
| E. UI: running state | ✅ Pre-existing | SceneExecutionTab shows running |
| E. UI: waiting review state | ✅ Pre-existing | SceneExecutionTab shows waiting_review |
| E. UI: failed retryable vs non-retryable | ❌ Missing | UI shows "Failed" uniformly; no retryable distinction |
| E. UI: completed state | ✅ Pre-existing | SceneExecutionTab shows completed |
| E. UI: No prose yet | ✅ Pre-existing | SceneProseTab shows empty state |
| E. UI: Prose generated | ✅ Pre-existing | SceneProseTab shows draft |
| E. UI: Prose generation failed | ❌ Missing | No explicit failure state in prose tab |
| E. UI: Retry available if safe | ❌ Missing | No retry CTA in UI for retryable failures |

## PR73: Persistence / Backup / Resume

| Requirement | Status | Notes |
|---|---|---|
| A. Schema version in project state | ✅ Pre-existing | `LOCAL_PROJECT_STORE_SCHEMA_VERSION = 1` |
| A. createdAt / updatedAt timestamps | ✅ Pre-existing | Already in `LocalProjectStoreRecord` |
| B. Atomic writes (temp + rename) | ✅ Pre-existing | `writeLocalProjectStoreRecord` uses temp file + rename |
| B. Backup before critical writes | ✅ Done | `createBackup` called before save |
| B. Keep last 10 backups | ✅ Done | `pruneOldBackups` added |
| C. Corrupt file → move to .narrative/recovery/ | ✅ Done | Recovery logic in `readExistingRecord` |
| C. Restore latest valid backup on corrupt | ✅ Done | `restoreLatestBackup` implemented |
| C. Show recovery notice in UI | ❌ Missing | No UI notification for recovery event |
| D. Resume: last project on reopen | ✅ Pre-existing | Recent projects store exists |
| D. Resume: last selected book/chapter/scene | ❌ Missing | Route doesn't restore last-scope on reopen |
| D. Resume: scene setup preserved | ✅ Pre-existing | Persistence handles this |
| D. Resume: run/review status preserved | ✅ Pre-existing | Run store persists |
| D. Resume: model binding settings | ✅ Pre-existing | Model binding store exists |
| E. Export project backup zip | ❌ Missing | `exportProjectArchive` creates JSON, not ZIP |
| E. Export excludes raw API key | ✅ Pre-existing | `sanitizeArchiveValue` filters sensitive keys |
| E. README-backup.txt in export | ❌ Missing | No README included |
| F. Markdown manuscript export | ✅ Done | `GET /books/:bookId/export-manuscript-markdown` |
| F. Missing prose shows marker | ✅ Done | `<!-- Scene not drafted yet: ... -->` in export |

## PR74: Write Loop Release Candidate

| Requirement | Status | Notes |
|---|---|---|
| A. First-run checklist UI | ❌ Missing | No checklist component; only doc exists |
| B. One primary CTA per state | ❌ Missing | No contextual CTA system |
| C. Real/Demo badges visible | ✅ Done | `WorkbenchRuntimeBadge` in WorkbenchShell |
| C. Real/Demo separation in docs | ✅ Done | Dogfood checklist doc created |
| D. Smoke test / E2E-lite | ❌ Missing | No real-project smoke test |
| E. Dogfood issue template | ✅ Done | `doc/real-writing-dogfood-checklist.md` created |
| F. Cleanup dead/confusing paths | ❌ Missing | No cleanup of fixture-only controls in real projects |
| Release candidate script walks through | ⚠️ Partial | Core path works but gaps in UI states reduce smoothness |

## Summary

| PR | Plan Items | Done | Partial | Missing | Score |
|---|---|---|---|---|---|
| PR71 | 14 | 8 | 2 | 4 | 64% |
| PR72 | 20 | 12 | 0 | 8 | 60% |
| PR73 | 20 | 12 | 0 | 8 | 60% |
| PR74 | 9 | 3 | 1 | 5 | 38% |

## Top Missing Items (Priority Order)

1. **P0**: Chapter/book-level empty state with "Create Chapter" CTA (PR71)
2. **P0**: First-run checklist UI component (PR74)  
3. **P1**: Retry CTA for retryable failed runs in UI (PR72)
4. **P1**: Route restore of last-selected book/chapter/scene on reopen (PR73)
5. **P1**: Prose writer gateway retry parity with planner (PR72)
6. **P2**: Project export ZIP file (PR73)
7. **P2**: Recovery notice in UI when backup was restored (PR73)
8. **P2**: Contextual single-CTA guidance per state (PR74)
9. **P2**: Chapter rename inline editing in navigator (PR71)

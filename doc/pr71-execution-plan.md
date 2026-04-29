# PR71: Blank Real Project MVP -- Execution Plan

## Current State Summary

### Already Done
1. **Real project blank template** -- `real-project-template.ts` creates minimal book with empty chapters/scenes via `LOCAL_PROJECT_STORE_TEMPLATE_VERSION` constant
2. **Persistence infrastructure** -- atomic writes, load/save/reset, legacy migration
3. **Scene setup editing** -- PATCH scene setup route exists, full UI in SceneSetupTab
4. **Runtime identity** -- projectMode/runtimeKind exposed via API and frontend badges (PR70 work)

### Remaining Gaps
1. **No CRUD routes** -- No API routes for creating/renaming chapters or scenes
2. **No repository methods** -- FixtureRepository lacks createChapter, renameChapter, createScene, renameScene
3. **Navigator uses SignalArc defaults** -- Hardcoded to SignalArc scene/chapter IDs in useWorkbenchRouteState.ts
4. **No empty states** -- No "Create Chapter", "Create Scene" actionable empty states
5. **No frontend client methods** -- ChapterClient missing create/rename methods

---

## Phase 1: API -- Create/Rename Repository Methods and Routes

### Task 1.1: Add repository interface + implementation
- File: `packages/api/src/repositories/fixtureRepository.ts`
- Add: `createChapter`, `renameChapter`, `createScene`, `renameScene` to FixtureRepository interface
- Implement each method with ID generation, data structure creation, and persistProjectOverlay

### Task 1.2: Register API routes
- File: `packages/api/src/routes/chapter.ts` -- Add POST /chapters, PATCH /chapters/:id, POST /chapters/:id/scenes
- File: `packages/api/src/routes/scene.ts` -- Add PATCH /scenes/:id for rename

### Task 1.3: API tests
- File: `packages/api/src/createServer.local-project-store.test.ts`

## Phase 2: Frontend -- Route Contracts, Client Methods, Mutation Hooks

### Task 2.1: Route contract entries
- File: `packages/renderer/src/app/project-runtime/api-route-contract.ts`

### Task 2.2: ChapterClient interface + implementation
- File: `packages/renderer/src/features/chapter/api/chapter-client.ts`
- File: `packages/renderer/src/app/project-runtime/api-project-runtime.ts`

### Task 2.3: Mock DB + mutation hooks
- File: `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`
- New: `useCreateChapterMutation`, `useRenameChapterMutation`, `useCreateSceneMutation`

## Phase 3: Navigator -- Dynamic Real Project Object Resolution

### Task 3.1: useProjectObjectDefaults hook
- New file: `packages/renderer/src/features/workbench/hooks/useProjectObjectDefaults.ts`

### Task 3.2: Update useWorkbenchRouteState defaults
- File: `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts`

### Task 3.3: Update App.tsx Navigator
- File: `packages/renderer/src/App.tsx`

## Phase 4: UI -- CRUD Forms, Empty States, Creation Flow

### Task 4.1: CreateChapterForm + CreateSceneForm components
### Task 4.2: Chapter rename inline editing
### Task 4.3: Empty state components (BookEmptyState, ChapterEmptyState)
### Task 4.4: Wire empty states into workbench

## Phase 5: Integration, Testing, Polish

### Task 5.1: Integration tests
### Task 5.2: PR70 non-regression verification
### Task 5.3: Run full test suite (typecheck + test for all packages)

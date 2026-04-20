import { apiRouteContract } from './api-route-contract'

export const API_READ_SLICE_PROJECT_ID = 'project-smoke'
export const API_READ_SLICE_BOOK_ID = 'book-signal-arc'
export const API_READ_SLICE_CHECKPOINT_ID = 'checkpoint-book-signal-arc-pr11-baseline'
export const API_READ_SLICE_EXPORT_PROFILE_ID = 'export-review-packet'
export const API_READ_SLICE_BRANCH_ID = 'branch-book-signal-arc-quiet-ending'
export const API_READ_SLICE_SELECTED_CHAPTER_ID = 'chapter-open-water-signals'
export const API_READ_SLICE_ROUTE =
  '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&reviewStatusFilter=open&selectedChapterId=chapter-open-water-signals'

export const API_READ_SLICE_CHAPTER_IDS = ['chapter-signals-in-rain', 'chapter-open-water-signals'] as const

export const API_READ_SLICE_SCENE_IDS = [
  'scene-midnight-platform',
  'scene-concourse-delay',
  'scene-ticket-window',
  'scene-departure-bell',
  'scene-warehouse-bridge',
  'scene-canal-watch',
  'scene-dawn-slip',
] as const

export interface ExpectedApiReadRequest {
  method: 'GET'
  path: string
  query?: Record<string, string>
}

export function buildApiReadSliceExpectedRequests(
  projectId: string = API_READ_SLICE_PROJECT_ID,
): ExpectedApiReadRequest[] {
  return [
    {
      method: 'GET',
      path: apiRouteContract.bookStructure({ projectId, bookId: API_READ_SLICE_BOOK_ID }),
    },
    {
      method: 'GET',
      path: apiRouteContract.bookManuscriptCheckpoints({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
    },
    {
      method: 'GET',
      path: apiRouteContract.bookManuscriptCheckpoint({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
        checkpointId: API_READ_SLICE_CHECKPOINT_ID,
      }),
    },
    {
      method: 'GET',
      path: apiRouteContract.bookExportProfiles({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
    },
    {
      method: 'GET',
      path: apiRouteContract.bookExportProfile({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
        exportProfileId: API_READ_SLICE_EXPORT_PROFILE_ID,
      }),
    },
    {
      method: 'GET',
      path: apiRouteContract.bookExportArtifacts({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
      query: {
        exportProfileId: API_READ_SLICE_EXPORT_PROFILE_ID,
        checkpointId: API_READ_SLICE_CHECKPOINT_ID,
      },
    },
    {
      method: 'GET',
      path: apiRouteContract.bookExperimentBranches({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
    },
    {
      method: 'GET',
      path: apiRouteContract.bookExperimentBranch({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
        branchId: API_READ_SLICE_BRANCH_ID,
      }),
    },
    {
      method: 'GET',
      path: apiRouteContract.reviewDecisions({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
    },
    {
      method: 'GET',
      path: apiRouteContract.reviewFixActions({
        projectId,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
    },
    ...API_READ_SLICE_CHAPTER_IDS.map((chapterId) => ({
      method: 'GET' as const,
      path: apiRouteContract.chapterStructure({ projectId, chapterId }),
    })),
    ...API_READ_SLICE_SCENE_IDS.flatMap((sceneId) => [
      {
        method: 'GET' as const,
        path: apiRouteContract.sceneProse({ projectId, sceneId }),
      },
      {
        method: 'GET' as const,
        path: apiRouteContract.sceneExecution({ projectId, sceneId }),
      },
      {
        method: 'GET' as const,
        path: apiRouteContract.sceneInspector({ projectId, sceneId }),
      },
      {
        method: 'GET' as const,
        path: apiRouteContract.scenePatchPreview({ projectId, sceneId }),
      },
    ]),
  ]
}

export function buildApiReadSliceExpectedQueryKeys() {
  return [
    ['book', 'workspace', API_READ_SLICE_BOOK_ID, 'en'],
    ['book', 'checkpoints', API_READ_SLICE_BOOK_ID, 'en'],
    ['book', 'checkpoint', API_READ_SLICE_BOOK_ID, API_READ_SLICE_CHECKPOINT_ID, 'en'],
    ['book', 'exportProfiles', API_READ_SLICE_BOOK_ID, 'en'],
    ['book', 'exportProfile', API_READ_SLICE_BOOK_ID, API_READ_SLICE_EXPORT_PROFILE_ID, 'en'],
    ['book', 'exportArtifacts', API_READ_SLICE_BOOK_ID, API_READ_SLICE_EXPORT_PROFILE_ID, API_READ_SLICE_CHECKPOINT_ID],
    ['book', 'branches', API_READ_SLICE_BOOK_ID, 'en'],
    ['book', 'branch', API_READ_SLICE_BOOK_ID, API_READ_SLICE_BRANCH_ID, 'en'],
    ['review', 'decisions', API_READ_SLICE_BOOK_ID],
    ['review', 'fix-actions', API_READ_SLICE_BOOK_ID],
    ...API_READ_SLICE_CHAPTER_IDS.map((chapterId) => ['chapter', 'workspace', chapterId]),
    ...API_READ_SLICE_SCENE_IDS.flatMap((sceneId) => [
      ['scene', 'prose', sceneId, 'en'],
      ['scene', 'execution', sceneId, 'en'],
      ['scene', 'inspector', sceneId, 'en'],
      ['scene', 'patchPreview', sceneId, 'en'],
    ]),
  ]
}

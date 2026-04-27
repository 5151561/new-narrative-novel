import { describe, expect, it } from 'vitest'
import {
  getSignalArcCanonicalSceneIdsForChapter,
  signalArcBookId,
  signalArcChapterIds,
  signalArcMockOnlyPreviewSceneIds,
} from '@narrative-novel/fixture-seed'

import { withTestServer } from './test/support/test-server.js'

type TestApp = Parameters<Parameters<typeof withTestServer>[0]>[0]['app']

const PROJECT_ID = 'book-signal-arc'
const BOOK_ID = signalArcBookId
const CANONICAL_NAVIGATOR_SCENE_IDS_BY_CHAPTER = {
  'chapter-signals-in-rain': getSignalArcCanonicalSceneIdsForChapter('chapter-signals-in-rain'),
  'chapter-open-water-signals': getSignalArcCanonicalSceneIdsForChapter('chapter-open-water-signals'),
} as const

const CANONICAL_NAVIGATOR_SCENE_IDS = signalArcChapterIds.flatMap((chapterId) => [
  ...CANONICAL_NAVIGATOR_SCENE_IDS_BY_CHAPTER[chapterId],
])
type SignalArcChapterId = (typeof signalArcChapterIds)[number]

type BookStructureResponse = {
  bookId: string
  chapterIds: string[]
}

type ChapterStructureResponse = {
  chapterId: string
  scenes: Array<{
    id: string
    order: number
  }>
}

type DraftAssemblyResponse = {
  chapters: Array<{
    chapterId: string
    scenes: Array<
      | {
          kind: 'gap'
          sceneId: string
          proseStatusLabel: { en: string; 'zh-CN': string }
        }
      | {
          kind: 'draft'
          sceneId: string
          proseDraft: string
          proseStatusLabel: { en: string; 'zh-CN': string }
        }
    >
  }>
}

function findEventRef(
  events: Array<{
    kind: string
    refs?: Array<{ kind: string; id: string }>
  }>,
  eventKind: string,
  refKind: string,
) {
  return events.find((event) => event.kind === eventKind)?.refs?.find((ref) => ref.kind === refKind)
}

async function fetchBookStructure(app: TestApp) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/${PROJECT_ID}/books/${BOOK_ID}/structure`,
  })
  expect(response.statusCode).toBe(200)
  return response.json<BookStructureResponse>()
}

async function fetchChapterStructure(app: TestApp, chapterId: string) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/${PROJECT_ID}/chapters/${chapterId}/structure`,
  })
  expect(response.statusCode).toBe(200)
  return response.json<ChapterStructureResponse>()
}

async function fetchDraftAssembly(app: TestApp) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/${PROJECT_ID}/books/${BOOK_ID}/draft-assembly`,
  })
  expect(response.statusCode).toBe(200)
  return response.json<DraftAssemblyResponse>()
}

async function fetchSceneSurface(app: TestApp, sceneId: string, surface: string) {
  return app.inject({
    method: 'GET',
    url: `/api/projects/${PROJECT_ID}/scenes/${sceneId}/${surface}`,
  })
}

async function fetchAssemblyScene(app: TestApp, chapterId: string, sceneId: string) {
  const assembly = await fetchDraftAssembly(app)
  const chapter = assembly.chapters.find((entry) => entry.chapterId === chapterId)
  expect(chapter).toBeTruthy()
  const scene = chapter?.scenes.find((entry) => entry.sceneId === sceneId)
  expect(scene).toBeTruthy()
  return scene!
}

async function fetchPostReviewEvents(app: TestApp, runId: string, cursor: string) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/${PROJECT_ID}/runs/${runId}/events?cursor=${cursor}`,
  })
  expect(response.statusCode).toBe(200)
  return response.json().events as Array<{
    kind: string
    refs?: Array<{ kind: string; id: string }>
    metadata?: Record<string, unknown>
  }>
}

describe('fixture API server integrity guards', () => {
  it('resolves every book chapter id and every navigator-visible chapter scene id through scene read surfaces', async () => {
    await withTestServer(async ({ app }) => {
      const book = await fetchBookStructure(app)
      expect(book.bookId).toBe(BOOK_ID)
      expect(book.chapterIds).toEqual(signalArcChapterIds)

      const chapterStructures = await Promise.all(book.chapterIds.map((chapterId) => fetchChapterStructure(app, chapterId)))
      const navigatorSceneIds = chapterStructures.flatMap((chapter) => chapter.scenes.map((scene) => scene.id))

      expect(navigatorSceneIds).toEqual(CANONICAL_NAVIGATOR_SCENE_IDS)
      expect(book.chapterIds).toContain('chapter-signals-in-rain')

      for (const chapter of chapterStructures) {
        const chapterId = chapter.chapterId as SignalArcChapterId
        expect(book.chapterIds).toContain(chapterId)
        expect(chapter.scenes.map((scene) => scene.id)).toEqual(CANONICAL_NAVIGATOR_SCENE_IDS_BY_CHAPTER[chapterId])
        expect(chapter.scenes.some((scene) => scene.id === 'scene-midnight-platform')).toBe(chapterId === 'chapter-signals-in-rain')

        for (const scene of chapter.scenes) {
          const [workspace, setup, execution, prose, inspector, dockSummary] = await Promise.all([
            fetchSceneSurface(app, scene.id, 'workspace'),
            fetchSceneSurface(app, scene.id, 'setup'),
            fetchSceneSurface(app, scene.id, 'execution'),
            fetchSceneSurface(app, scene.id, 'prose'),
            fetchSceneSurface(app, scene.id, 'inspector'),
            fetchSceneSurface(app, scene.id, 'dock-summary'),
          ])

          expect(workspace.statusCode).toBe(200)
          expect(workspace.json().id).toBe(scene.id)
          expect(setup.statusCode).toBe(200)
          expect(setup.json().sceneId).toBe(scene.id)
          expect(execution.statusCode).toBe(200)
          expect(prose.statusCode).toBe(200)
          expect(prose.json().sceneId).toBe(scene.id)
          expect(inspector.statusCode).toBe(200)
          expect(dockSummary.statusCode).toBe(200)
        }
      }

      for (const previewOnlySceneId of signalArcMockOnlyPreviewSceneIds) {
        expect(navigatorSceneIds).not.toContain(previewOnlySceneId)
      }
    })
  })

  it('keeps draft assembly rows anchored to chapter and scene ids instead of anonymous or title-matched identity', async () => {
    await withTestServer(async ({ app }) => {
      const book = await fetchBookStructure(app)
      const assembly = await fetchDraftAssembly(app)

      expect(assembly.chapters.map((chapter) => chapter.chapterId)).toEqual(signalArcChapterIds)

      for (const chapterRow of assembly.chapters) {
        const chapterId = chapterRow.chapterId as SignalArcChapterId
        expect(book.chapterIds).toContain(chapterId)
        expect(chapterRow.scenes.map((scene) => scene.sceneId)).toEqual(
          CANONICAL_NAVIGATOR_SCENE_IDS_BY_CHAPTER[chapterId],
        )

        for (const sceneRow of chapterRow.scenes) {
          expect(CANONICAL_NAVIGATOR_SCENE_IDS_BY_CHAPTER[chapterId]).toContain(sceneRow.sceneId)

          const proseResponse = await fetchSceneSurface(app, sceneRow.sceneId, 'prose')
          expect(proseResponse.statusCode).toBe(200)

          if (sceneRow.kind === 'gap') {
            expect(proseResponse.json().sceneId).toBe(sceneRow.sceneId)
            expect(sceneRow.proseStatusLabel.en.length).toBeGreaterThan(0)
          } else {
            expect(sceneRow.proseDraft.trim().length).toBeGreaterThan(0)
            expect(proseResponse.json().proseDraft).toBe(sceneRow.proseDraft)
          }
        }
      }

      for (const previewOnlySceneId of signalArcMockOnlyPreviewSceneIds) {
        expect(
          assembly.chapters.flatMap((chapter) => chapter.scenes.map((scene) => scene.sceneId)),
        ).not.toContain(previewOnlySceneId)
      }
    })
  })

  it('keeps reject and request-rewrite decisions from overwriting live assembly prose', async () => {
    for (const decision of ['request-rewrite', 'reject'] as const) {
      await withTestServer(async ({ app }) => {
        const sceneBefore = await fetchAssemblyScene(app, 'chapter-signals-in-rain', 'scene-midnight-platform')

        expect(sceneBefore.kind).toBe('draft')

        const startResponse = await app.inject({
          method: 'POST',
          url: `/api/projects/${PROJECT_ID}/scenes/scene-midnight-platform/runs`,
          payload: {
            mode: 'rewrite',
            note: `Fixture integrity guard for ${decision}.`,
          },
        })
        expect(startResponse.statusCode).toBe(200)
        const startedRun = startResponse.json()

        const reviewResponse = await app.inject({
          method: 'POST',
          url: `/api/projects/${PROJECT_ID}/runs/${startedRun.id}/review-decisions`,
          payload: {
            reviewId: startedRun.pendingReviewId,
            decision,
            note: `Do not overwrite live assembly prose on ${decision}.`,
          },
        })
        expect(reviewResponse.statusCode).toBe(200)

        const sceneAfter = await fetchAssemblyScene(app, 'chapter-signals-in-rain', 'scene-midnight-platform')
        expect(sceneAfter).toEqual(sceneBefore)
      })
    }
  })

  it('keeps run events lightweight while preserving canon patch and prose draft refs after review', async () => {
    await withTestServer(async ({ app }) => {
      const selectedVariant = {
        proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
        variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
      }

      const startResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/${PROJECT_ID}/scenes/scene-midnight-platform/runs`,
        payload: {
          mode: 'rewrite',
          note: 'Exercise event payload integrity.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()

      const firstEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/${PROJECT_ID}/runs/${startedRun.id}/events`,
      })
      expect(firstEventsResponse.statusCode).toBe(200)
      const firstEventsPage = firstEventsResponse.json()

      const secondEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/${PROJECT_ID}/runs/${startedRun.id}/events?cursor=${firstEventsPage.nextCursor}`,
      })
      expect(secondEventsResponse.statusCode).toBe(200)
      const secondEventsPage = secondEventsResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/${PROJECT_ID}/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'accept',
          selectedVariants: [selectedVariant],
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const postReviewEvents = await fetchPostReviewEvents(app, startedRun.id, startedRun.latestEventId)
      const allEvents = [...firstEventsPage.events, ...secondEventsPage.events, ...postReviewEvents]
      const serializedEvents = JSON.stringify(allEvents)

      expect(serializedEvents).not.toContain('Accepted proposal proposal-set-scene-midnight-platform-run-002-proposal-001 anchors the draft.')
      expect(serializedEvents).not.toContain('assetActivations')
      expect(serializedEvents).not.toContain('ren-scene-cast')
      expect(serializedEvents).not.toContain(selectedVariant.variantId)

      expect(findEventRef(postReviewEvents, 'canon_patch_applied', 'canon-patch')).toBeTruthy()
      expect(findEventRef(postReviewEvents, 'prose_generated', 'prose-draft')).toBeTruthy()
    })
  })
})

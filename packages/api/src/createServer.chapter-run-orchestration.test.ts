import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

type TestApp = Parameters<Parameters<typeof withTestServer>[0]>[0]['app']

async function seedAcceptedBacklog(app: TestApp) {
  const proposalResponse = await app.inject({
    method: 'POST',
    url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals',
    payload: {
      locale: 'en',
    },
  })
  expect(proposalResponse.statusCode).toBe(200)
  const proposal = proposalResponse.json().planning.proposals.at(-1)

  const patchResponse = await app.inject({
    method: 'PATCH',
    url: `/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals/${proposal.proposalId}/scenes/${proposal.scenes[0].proposalSceneId}`,
    payload: {
      locale: 'en',
      backlogStatus: 'drafted',
    },
  })
  expect(patchResponse.statusCode).toBe(200)

  const acceptResponse = await app.inject({
    method: 'POST',
    url: `/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals/${proposal.proposalId}/accept`,
    payload: {
      locale: 'en',
    },
  })
  expect(acceptResponse.statusCode).toBe(200)
}

async function fetchChapterScene(app: TestApp, sceneId: string) {
  const response = await app.inject({
    method: 'GET',
    url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/structure',
  })
  expect(response.statusCode).toBe(200)
  return response.json().scenes.find((scene: { id: string }) => scene.id === sceneId)
}

describe('chapter run orchestration API', () => {
  it('starts the next planned scene from the accepted backlog and stops at review', async () => {
    await withTestServer(async ({ app }) => {
      await seedAcceptedBacklog(app)

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/run-next-scene',
        payload: {
          locale: 'en',
          mode: 'continue',
          note: 'Advance the next accepted chapter scene.',
        },
      })

      expect(startResponse.statusCode).toBe(200)
      expect(startResponse.json()).toMatchObject({
        selectedScene: {
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-concourse-delay',
          order: 2,
        },
        run: {
          scope: 'scene',
          scopeId: 'scene-concourse-delay',
          status: 'waiting_review',
          pendingReviewId: expect.any(String),
        },
        chapter: {
          chapterId: 'chapter-signals-in-rain',
        },
      })

      const startedScene = startResponse.json().chapter.scenes.find((scene: { id: string }) => scene.id === 'scene-concourse-delay')
      expect(startedScene).toMatchObject({
        backlogStatus: 'needs_review',
        runStatusLabel: {
          en: 'Run waiting for review',
        },
      })

      const proseResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-concourse-delay/prose',
      })
      expect(proseResponse.statusCode).toBe(200)
      expect(proseResponse.json().proseDraft).toBeUndefined()
    })
  })

  it('blocks launching a later scene while the previous scene waits for review', async () => {
    await withTestServer(async ({ app }) => {
      await seedAcceptedBacklog(app)

      const firstStart = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/run-next-scene',
        payload: {
          locale: 'en',
        },
      })
      expect(firstStart.statusCode).toBe(200)

      const secondStart = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/run-next-scene',
        payload: {
          locale: 'en',
        },
      })
      expect(secondStart.statusCode).toBe(409)
      expect(secondStart.json()).toMatchObject({
        code: 'CHAPTER_RUN_REVIEW_GATE_BLOCKED',
        detail: {
          blockingSceneId: 'scene-concourse-delay',
        },
      })
    })
  })

  it('marks the scene drafted only after accepting the pending scene review', async () => {
    await withTestServer(async ({ app }) => {
      await seedAcceptedBacklog(app)

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/run-next-scene',
        payload: {
          locale: 'en',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const started = startResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${started.run.id}/review-decisions`,
        payload: {
          reviewId: started.run.pendingReviewId,
          decision: 'accept',
          note: 'Accept canon and generate prose.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const chapterScene = await fetchChapterScene(app, 'scene-concourse-delay')
      expect(chapterScene).toMatchObject({
        backlogStatus: 'drafted',
        proseStatusLabel: {
          en: 'Generated',
          'zh-CN': '已生成',
        },
        runStatusLabel: {
          en: 'Run completed',
        },
      })
    })
  })
})

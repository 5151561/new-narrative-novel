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

async function fetchChapterDraftAssembly(app: TestApp, chapterId = 'chapter-signals-in-rain') {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/book-signal-arc/chapters/${chapterId}/draft-assembly`,
  })
  expect(response.statusCode).toBe(200)
  return response.json()
}

function findSceneSection(
  assembly: {
    sections: Array<{ kind: string; sceneId?: string }>
  },
  sceneId: string,
) {
  const section = assembly.sections.find((entry) => entry.sceneId === sceneId)
  expect(section).toBeTruthy()
  return section
}

describe('fixture API server chapter draft assembly', () => {
  it('returns current chapter draft assembly with stable scene order, explicit gaps, and PR59 statuses', async () => {
    await withTestServer(async ({ app }) => {
      const assembly = await fetchChapterDraftAssembly(app)

      expect(assembly).toMatchObject({
        chapterId: 'chapter-signals-in-rain',
        sceneCount: 4,
        draftedSceneCount: 1,
        missingDraftCount: 3,
        assembledWordCount: expect.any(Number),
      })
      expect(assembly.scenes.map((scene: { sceneId: string }) => scene.sceneId)).toEqual([
        'scene-midnight-platform',
        'scene-concourse-delay',
        'scene-ticket-window',
        'scene-departure-bell',
      ])
      expect(
        assembly.sections.map((section: { kind: string; sceneId?: string; fromSceneId?: string; toSceneId?: string }) => ({
          kind: section.kind,
          sceneId: section.sceneId,
          fromSceneId: section.fromSceneId,
          toSceneId: section.toSceneId,
        })),
      ).toEqual([
        { kind: 'scene-draft', sceneId: 'scene-midnight-platform', fromSceneId: undefined, toSceneId: undefined },
        { kind: 'transition-gap', sceneId: undefined, fromSceneId: 'scene-midnight-platform', toSceneId: 'scene-concourse-delay' },
        { kind: 'scene-gap', sceneId: 'scene-concourse-delay', fromSceneId: undefined, toSceneId: undefined },
        { kind: 'transition-gap', sceneId: undefined, fromSceneId: 'scene-concourse-delay', toSceneId: 'scene-ticket-window' },
        { kind: 'scene-gap', sceneId: 'scene-ticket-window', fromSceneId: undefined, toSceneId: undefined },
        { kind: 'transition-gap', sceneId: undefined, fromSceneId: 'scene-ticket-window', toSceneId: 'scene-departure-bell' },
        { kind: 'scene-gap', sceneId: 'scene-departure-bell', fromSceneId: undefined, toSceneId: undefined },
      ])
      expect(findSceneSection(assembly, 'scene-midnight-platform')).toMatchObject({
        kind: 'scene-draft',
        backlogStatus: 'planned',
        proseStatusLabel: {
          en: expect.any(String),
          'zh-CN': expect.any(String),
        },
        traceRollup: expect.objectContaining({
          acceptedFactCount: expect.any(Number),
          relatedAssetCount: expect.any(Number),
          sourceProposalCount: expect.any(Number),
          missingLinks: expect.any(Array),
        }),
      })
      expect(findSceneSection(assembly, 'scene-concourse-delay')).toMatchObject({
        kind: 'scene-gap',
        backlogStatus: 'planned',
        proseStatusLabel: {
          en: 'Draft handoff ready',
          'zh-CN': '草稿交接已就绪',
        },
        gapReason: {
          en: expect.any(String),
          'zh-CN': expect.any(String),
        },
      })
    })
  })

  it('promotes a missing scene from gap to draft only after accepting the PR59 review gate', async () => {
    await withTestServer(async ({ app }) => {
      await seedAcceptedBacklog(app)

      const before = await fetchChapterDraftAssembly(app)
      expect(findSceneSection(before, 'scene-concourse-delay')).toMatchObject({ kind: 'scene-gap' })

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/run-next-scene',
        payload: {
          locale: 'en',
          mode: 'continue',
          note: 'Promote the next chapter scene into chapter draft assembly.',
        },
      })
      expect(startResponse.statusCode).toBe(200)

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startResponse.json().run.id}/review-decisions`,
        payload: {
          reviewId: startResponse.json().run.pendingReviewId,
          decision: 'accept',
          note: 'Accept canon and prose for the chapter assembly.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const after = await fetchChapterDraftAssembly(app)
      expect(findSceneSection(after, 'scene-concourse-delay')).toMatchObject({
        kind: 'scene-draft',
        backlogStatus: 'drafted',
        proseStatusLabel: {
          en: 'Generated',
          'zh-CN': '已生成',
        },
      })
      expect(after.draftedSceneCount).toBe(before.draftedSceneCount + 1)
      expect(after.missingDraftCount).toBe(before.missingDraftCount - 1)
    })
  })

  it('keeps transition prose absent unless the read model has an artifact reference', async () => {
    await withTestServer(async ({ app }) => {
      const assembly = await fetchChapterDraftAssembly(app)
      const transitionSections = assembly.sections.filter((section: { kind: string }) => section.kind.startsWith('transition-'))

      expect(transitionSections.length).toBeGreaterThan(0)
      for (const transition of transitionSections) {
        if (transition.kind === 'transition-draft') {
          expect(transition.artifactRef).toMatchObject({
            kind: 'prose-draft',
            id: expect.any(String),
          })
          expect(transition.transitionProse).toEqual(expect.any(String))
        } else {
          expect(transition).not.toHaveProperty('transitionProse')
          expect(transition).not.toHaveProperty('artifactRef')
          expect(transition.gapReason.en).toBeTruthy()
        }
      }
    })
  })
})

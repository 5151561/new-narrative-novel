// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'

import { createTestServer } from '../../../../api/src/test/support/test-server'

import { createApiProjectRuntime } from './api-project-runtime'
import { createApiTransport } from './api-transport'

const projectId = 'book-signal-arc'
const defaultSceneId = 'scene-midnight-platform'

function testTransportToApiServer(baseUrl: string) {
  return createApiTransport({ baseUrl })
}

describe('api project runtime HTTP compatibility smoke', () => {
  const servers: Array<ReturnType<typeof createTestServer>> = []

  afterEach(async () => {
    while (servers.length > 0) {
      await servers.pop()?.app.close()
    }
  })

  it('consumes the fixture API server through the real renderer runtime client over HTTP', async () => {
    const server = createTestServer()
    servers.push(server)

    await server.app.listen({
      host: server.config.host,
      port: 0,
    })

    const address = server.app.server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Expected a TCP address from the test API server.')
    }

    const runtime = createApiProjectRuntime({
      projectId,
      transport: testTransportToApiServer(`http://${server.config.host}:${address.port}`),
    })

    const runtimeInfo = await runtime.runtimeInfoClient.getProjectRuntimeInfo()
    expect(runtimeInfo).toMatchObject({
      projectId,
      source: 'api',
      status: 'healthy',
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
      },
    })

    const sceneWorkspace = await runtime.sceneClient.getSceneWorkspace(defaultSceneId)
    expect(sceneWorkspace).toMatchObject({
      id: defaultSceneId,
      latestRunId: 'run-scene-midnight-platform-001',
      runStatus: 'paused',
    })

    const generatedBacklog = await runtime.chapterClient.generateChapterBacklogProposal({
      chapterId: 'chapter-signals-in-rain',
      locale: 'en',
    })
    expect(generatedBacklog?.planning.proposals).toHaveLength(1)
    const proposal = generatedBacklog?.planning.proposals.at(-1)
    expect(proposal).toBeTruthy()
    if (!proposal) {
      return
    }

    const patchedBacklog = await runtime.chapterClient.updateChapterBacklogProposalScene({
      chapterId: 'chapter-signals-in-rain',
      proposalId: proposal.proposalId,
      proposalSceneId: proposal.scenes[0]!.proposalSceneId,
      locale: 'en',
      backlogStatus: 'drafted',
    })
    expect(patchedBacklog?.planning.proposals.at(-1)?.scenes[0]?.backlogStatus).toBe('drafted')

    const acceptedBacklog = await runtime.chapterClient.acceptChapterBacklogProposal({
      chapterId: 'chapter-signals-in-rain',
      proposalId: proposal.proposalId,
      locale: 'en',
    })
    expect(acceptedBacklog?.planning.acceptedProposalId).toBe(proposal.proposalId)

    const chapterRun = await runtime.chapterClient.startNextChapterSceneRun({
      chapterId: 'chapter-signals-in-rain',
      locale: 'en',
      mode: 'continue',
      note: 'Advance the next chapter scene.',
    })
    expect(chapterRun).toMatchObject({
      selectedScene: {
        sceneId: 'scene-concourse-delay',
      },
      run: {
        scope: 'scene',
        scopeId: 'scene-concourse-delay',
        status: 'waiting_review',
      },
    })

    const startedRun = await runtime.runClient.startSceneRun({
      sceneId: defaultSceneId,
      mode: 'rewrite',
      note: 'Compatibility smoke review loop.',
    })
    expect(startedRun).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      status: 'waiting_review',
      pendingReviewId: 'review-scene-midnight-platform-002',
      latestEventId: 'run-event-scene-midnight-platform-002-009',
    })

    const firstEventsPage = await runtime.runClient.getRunEvents({
      runId: startedRun.id,
    })
    expect(firstEventsPage).toMatchObject({
      runId: startedRun.id,
      nextCursor: 'run-event-scene-midnight-platform-002-004',
    })
    expect(firstEventsPage.events.map((event) => event.kind)).toEqual([
      'run_created',
      'run_started',
      'context_packet_built',
      'agent_invocation_started',
    ])

    const completedRun = await runtime.runClient.submitRunReviewDecision({
      runId: startedRun.id,
      reviewId: startedRun.pendingReviewId ?? 'missing-review-id',
      decision: 'accept',
      note: 'Approved in renderer smoke.',
    })
    expect(completedRun).toMatchObject({
      id: startedRun.id,
      status: 'completed',
      summary: 'Proposal set accepted and applied to canon and prose.',
    })

    const completionEventsPage = await runtime.runClient.getRunEvents({
      runId: startedRun.id,
      cursor: startedRun.latestEventId,
    })
    expect(completionEventsPage.events.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
      'canon_patch_applied',
      'prose_generated',
      'run_completed',
    ])
  })
})

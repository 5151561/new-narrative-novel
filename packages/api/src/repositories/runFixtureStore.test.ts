import { describe, expect, it } from 'vitest'

import { createRunFixtureStore } from './runFixtureStore.js'

describe('runFixtureStore', () => {
  function listAllEventPages(
    store: ReturnType<typeof createRunFixtureStore>,
    projectId: string,
    runId: string,
  ) {
    const events = [] as ReturnType<typeof store.getRunEvents>['events']
    let cursor: string | undefined

    while (true) {
      const page = store.getRunEvents(projectId, { runId, cursor })
      events.push(...page.events)
      if (!page.nextCursor) {
        return events
      }

      cursor = page.nextCursor
    }
  }

  it('lists readable start-run artifacts for context, invocations, and proposal sets', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-artifacts', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const artifacts = store.listRunArtifacts('project-artifacts', run.id)

    expect(artifacts?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
    ])
  })

  it('resolves every start-run artifact event ref through getRunArtifact', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-ref-resolution', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const events = listAllEventPages(store, 'project-ref-resolution', run.id)
    const artifactRefs = events
      .flatMap((event) => (event.refs ?? []).map((ref) => ({ eventId: event.id, ref })))
      .filter(({ ref }) => ref.kind === 'context-packet' || ref.kind === 'agent-invocation' || ref.kind === 'proposal-set')

    expect(artifactRefs).toHaveLength(6)
    for (const { eventId, ref } of artifactRefs) {
      expect(store.getRunArtifact('project-ref-resolution', run.id, ref.id)).toMatchObject({
        id: ref.id,
        kind: ref.kind,
        sourceEventIds: expect.arrayContaining([eventId]),
      })
    }
  })

  it('adds canon patch and prose draft details after acceptance', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-accept-artifacts', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    store.submitRunReviewDecision('project-accept-artifacts', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
    })

    const artifacts = store.listRunArtifacts('project-accept-artifacts', run.id)
    expect(artifacts?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
      'canon-patch',
      'prose-draft',
    ])

    expect(store.getRunArtifact('project-accept-artifacts', run.id, 'canon-patch-scene-midnight-platform-001')).toMatchObject({
      kind: 'canon-patch',
      sourceProposalSetId: 'proposal-set-scene-midnight-platform-run-001',
      acceptedProposalIds: ['proposal-set-scene-midnight-platform-run-001-proposal-001'],
    })
    expect(store.getRunArtifact('project-accept-artifacts', run.id, 'prose-draft-scene-midnight-platform-001')).toMatchObject({
      kind: 'prose-draft',
      sourceCanonPatchId: 'canon-patch-scene-midnight-platform-001',
      sourceProposalIds: ['proposal-set-scene-midnight-platform-run-001-proposal-001'],
    })
  })

  it('rejects custom patch ids that collide with an existing artifact id and preserves current read surfaces', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-patchid-collision', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const beforeContextPacket = store.getRunArtifact('project-patchid-collision', run.id, 'ctx-scene-midnight-platform-run-001')
    const beforeTrace = store.getRunTrace('project-patchid-collision', run.id)
    const beforeArtifacts = store.listRunArtifacts('project-patchid-collision', run.id)

    try {
      store.submitRunReviewDecision('project-patchid-collision', {
        runId: run.id,
        reviewId: run.pendingReviewId!,
        decision: 'accept-with-edit',
        patchId: 'ctx-scene-midnight-platform-run-001',
      })
      throw new Error('expected patchId collision to throw')
    } catch (error) {
      expect(error).toMatchObject({
        status: 409,
        code: 'RUN_ARTIFACT_ID_CONFLICT',
        message: 'Run artifact id ctx-scene-midnight-platform-run-001 conflicts within run run-scene-midnight-platform-001.',
      })
    }

    expect(store.getRunArtifact('project-patchid-collision', run.id, 'ctx-scene-midnight-platform-run-001')).toEqual(beforeContextPacket)
    expect(store.getRunTrace('project-patchid-collision', run.id)).toEqual(beforeTrace)
    expect(store.listRunArtifacts('project-patchid-collision', run.id)).toEqual(beforeArtifacts)
  })

  it('accepts valid custom patch ids and keeps artifact lookup and trace complete', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-custom-patchid', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    store.submitRunReviewDecision('project-custom-patchid', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept-with-edit',
      patchId: 'canon-patch-editorial-777',
    })

    expect(store.getRunArtifact('project-custom-patchid', run.id, 'canon-patch-editorial-777')).toMatchObject({
      id: 'canon-patch-editorial-777',
      kind: 'canon-patch',
      decision: 'accept-with-edit',
      traceLinkIds: [
        'trace-link-scene-midnight-platform-001-accepted_into-001',
        'trace-link-scene-midnight-platform-001-accepted_into-002',
      ],
    })
    expect(store.getRunArtifact('project-custom-patchid', run.id, 'ctx-scene-midnight-platform-run-001')).toMatchObject({
      id: 'ctx-scene-midnight-platform-run-001',
      kind: 'context-packet',
    })
    expect(store.getRunTrace('project-custom-patchid', run.id)).toMatchObject({
      summary: {
        proposalSetCount: 1,
        canonPatchCount: 1,
        proseDraftCount: 1,
        missingTraceCount: 0,
      },
      links: expect.arrayContaining([
        expect.objectContaining({
          relation: 'accepted_into',
          from: {
            kind: 'canon-fact',
            id: 'canon-patch-editorial-777-fact-001',
          },
          to: {
            kind: 'canon-patch',
            id: 'canon-patch-editorial-777',
          },
        }),
        expect.objectContaining({
          relation: 'rendered_as',
          from: {
            kind: 'canon-patch',
            id: 'canon-patch-editorial-777',
          },
          to: {
            kind: 'prose-draft',
            id: 'prose-draft-scene-midnight-platform-001',
          },
        }),
      ]),
    })
  })

  it('returns a minimal proposal to canon to prose trace after acceptance', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-accept-trace', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    store.submitRunReviewDecision('project-accept-trace', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
    })

    const trace = store.getRunTrace('project-accept-trace', run.id)
    const canonPatch = store.getRunArtifact('project-accept-trace', run.id, 'canon-patch-scene-midnight-platform-001')

    expect(trace).toMatchObject({
      runId: run.id,
      summary: {
        proposalSetCount: 1,
        canonPatchCount: 1,
        proseDraftCount: 1,
        missingTraceCount: 0,
      },
    })
    expect(canonPatch).toMatchObject({
      kind: 'canon-patch',
      traceLinkIds: [
        'trace-link-scene-midnight-platform-001-accepted_into-001',
        'trace-link-scene-midnight-platform-001-accepted_into-002',
      ],
    })
    expect(canonPatch?.kind).toBe('canon-patch')
    if (canonPatch?.kind !== 'canon-patch') {
      throw new Error('expected canon patch detail')
    }
    expect(canonPatch.traceLinkIds.every((linkId) => trace?.links.some((link) => link.id === linkId))).toBe(true)
    expect(trace?.links).toEqual(expect.arrayContaining([
      expect.objectContaining({
        relation: 'accepted_into',
        from: {
          kind: 'proposal',
          id: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
        },
        to: {
          kind: 'canon-fact',
          id: 'canon-patch-scene-midnight-platform-001-fact-001',
        },
      }),
      expect.objectContaining({
        relation: 'rendered_as',
        from: {
          kind: 'canon-patch',
          id: 'canon-patch-scene-midnight-platform-001',
        },
        to: {
          kind: 'prose-draft',
          id: 'prose-draft-scene-midnight-platform-001',
        },
      }),
      expect.objectContaining({
        relation: 'accepted_into',
        from: {
          kind: 'canon-fact',
          id: 'canon-patch-scene-midnight-platform-001-fact-001',
        },
        to: {
          kind: 'canon-patch',
          id: 'canon-patch-scene-midnight-platform-001',
        },
      }),
    ]))
  })

  it('does not create canon or prose artifacts for rejection', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-reject-artifacts', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    store.submitRunReviewDecision('project-reject-artifacts', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'reject',
    })

    expect(store.listRunArtifacts('project-reject-artifacts', run.id)?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
    ])
    expect(store.getRunArtifact('project-reject-artifacts', run.id, 'canon-patch-scene-midnight-platform-001')).toBeNull()
    expect(store.getRunArtifact('project-reject-artifacts', run.id, 'prose-draft-scene-midnight-platform-001')).toBeNull()
    expect(store.getRunTrace('project-reject-artifacts', run.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
  })

  it('returns null for invalid artifact ids', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-invalid-artifact', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    expect(store.getRunArtifact('project-invalid-artifact', run.id, 'artifact-missing')).toBeNull()
  })

  it('keeps artifacts isolated by project and run', () => {
    const store = createRunFixtureStore()
    const runA = store.startSceneRun('project-artifact-a', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    const runB = store.startSceneRun('project-artifact-b', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    store.submitRunReviewDecision('project-artifact-a', {
      runId: runA.id,
      reviewId: runA.pendingReviewId!,
      decision: 'accept',
    })

    expect(runA.id).toBe(runB.id)
    expect(store.getRunArtifact('project-artifact-b', runB.id, 'canon-patch-scene-midnight-platform-001')).toBeNull()
    expect(store.getRunTrace('project-artifact-b', runB.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
  })

  it('appends accept-with-edit review events and clears the pending review', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-review', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const reviewedRun = store.submitRunReviewDecision('project-review', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept-with-edit',
      note: 'Tighten the final paragraph.',
    })

    expect(reviewedRun).toMatchObject({
      id: run.id,
      status: 'completed',
      summary: 'Proposal set accepted with editor adjustments applied to canon and prose.',
      completedAtLabel: '2026-04-23 10:13',
      pendingReviewId: undefined,
    })

    const events = store.getRunEvents('project-review', {
      runId: run.id,
      cursor: run.latestEventId,
    })
    expect(events.events.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
      'canon_patch_applied',
      'prose_generated',
      'run_completed',
    ])
    expect(store.getRunTrace('project-review', run.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 1,
      proseDraftCount: 1,
      missingTraceCount: 0,
    })
  })

  it('keeps request-rewrite semantics without completing the run', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-rewrite', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const reviewedRun = store.submitRunReviewDecision('project-rewrite', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'request-rewrite',
      note: 'Take another pass on the ending beat.',
    })

    expect(reviewedRun).toMatchObject({
      id: run.id,
      status: 'running',
      summary: 'Rewrite requested and the run returned to execution.',
      pendingReviewId: undefined,
      completedAtLabel: undefined,
    })

    const events = store.getRunEvents('project-rewrite', {
      runId: run.id,
      cursor: run.latestEventId,
    })
    expect(events.events.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
    ])
    expect(events.nextCursor).toBeUndefined()
    expect(store.listRunArtifacts('project-rewrite', run.id)?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
    ])
    expect(store.getRunTrace('project-rewrite', run.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
  })
})

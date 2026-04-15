import { createSceneClient } from './scene-client'

describe('sceneClient', () => {
  const sceneId = 'scene-midnight-platform'

  it('prefers preload bridge methods when present and falls back to mock handlers for missing capabilities', async () => {
    const bridgeWorkspace = {
      id: sceneId,
      title: 'Bridge Workspace',
      chapterId: 'chapter-bridge',
      chapterTitle: 'Bridge Chapter',
      status: 'running' as const,
      runStatus: 'running' as const,
      objective: 'Bridge objective',
      castIds: ['ren'],
      pendingProposalCount: 0,
      warningCount: 0,
      currentVersionLabel: 'Bridge Run',
      activeThreadId: 'thread-main',
      availableThreads: [{ id: 'thread-main', label: 'Mainline' }],
    }
    const previewBridge = {
      patchId: 'bridge-patch',
      label: 'Bridge Patch',
      summary: 'Bridge preview data',
      status: 'ready_for_commit' as const,
      sceneSummary: 'Bridge preview summary',
      acceptedFacts: [{ id: 'bridge-fact', label: 'Bridge fact', value: 'Bridge value' }],
      changes: [{ id: 'bridge-change', label: 'Bridge change', detail: 'Bridge delta' }],
    }
    const commitAcceptedPatch = vi.fn(async () => {})

    const client = createSceneClient({
      bridgeResolver: () => ({
        getSceneWorkspace: async () => bridgeWorkspace,
        previewAcceptedPatch: async () => previewBridge,
        commitAcceptedPatch,
      }),
    })

    await expect(client.getRuntimeInfo()).resolves.toMatchObject({
      source: 'preload-bridge',
      label: 'Preload Bridge',
    })
    await expect(client.getSceneWorkspace(sceneId)).resolves.toEqual(bridgeWorkspace)
    await expect(client.getSceneExecution(sceneId)).resolves.toMatchObject({
      objective: expect.objectContaining({
        goal: expect.any(String),
      }),
    })
    await expect(client.previewAcceptedPatch(sceneId)).resolves.toEqual(previewBridge)

    await client.commitAcceptedPatch(sceneId, 'bridge-patch')

    expect(commitAcceptedPatch).toHaveBeenCalledWith(sceneId, 'bridge-patch')
  })

  it('keeps fallback reads in sync after bridge-only proposal writes', async () => {
    const acceptProposal = vi.fn(async () => {})
    const client = createSceneClient({
      bridgeResolver: () => ({
        acceptProposal,
      }),
    })

    const beforeExecution = await client.getSceneExecution(sceneId)
    const beforeInspector = await client.getSceneInspector(sceneId)
    const beforeDock = await client.getSceneDockSummary(sceneId)

    await client.acceptProposal(sceneId, { proposalId: 'proposal-2' })

    const afterExecution = await client.getSceneExecution(sceneId)
    const afterInspector = await client.getSceneInspector(sceneId)
    const afterDock = await client.getSceneDockSummary(sceneId)

    expect(acceptProposal).toHaveBeenCalledWith(sceneId, { proposalId: 'proposal-2' })
    expect(afterExecution.acceptedSummary.patchCandidateCount).toBe(
      (beforeExecution.acceptedSummary.patchCandidateCount ?? 0) + 1,
    )
    expect(afterExecution.acceptedSummary.acceptedFacts[0]?.label).toBe('Let Mei name the cost in private terms')
    expect(afterInspector.context.acceptedFacts[0]?.label).toBe('Let Mei name the cost in private terms')
    expect(afterInspector.context.acceptedFacts.length).toBeGreaterThan(beforeInspector.context.acceptedFacts.length)
    expect(afterDock.events[0]?.title).toMatch(/accepted proposal queued/i)
    expect(afterDock.events[0]?.title).not.toBe(beforeDock.events[0]?.title)
  })

  it('uses locale-aware fallback labels and scene content when no preload bridge is available', async () => {
    const client = createSceneClient({
      localeResolver: () => 'zh-CN',
    })

    await expect(client.getRuntimeInfo()).resolves.toMatchObject({
      source: 'mock-fallback',
      label: '预览数据',
    })
    await expect(client.getSceneWorkspace(sceneId)).resolves.toMatchObject({
      title: '午夜站台',
      chapterTitle: '雨中信号',
      currentVersionLabel: '运行 07',
    })

    const execution = await client.getSceneExecution(sceneId)
    expect(execution.objective.goal).toBe('逼美伊表态：账本究竟是诱饵，还是她手里的筹码。')
    expect(execution.beats[0]?.title).toBe('站灯下的抵达')
  })
})

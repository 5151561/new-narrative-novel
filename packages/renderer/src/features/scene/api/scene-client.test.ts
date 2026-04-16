import {
  applyProposalAction,
  applyProseRevision,
  commitAcceptedPatch,
  continueSceneRun,
  createSceneMockDatabase,
  getSceneDockSummary,
  getSceneDockTab,
  previewAcceptedPatch,
  saveSceneSetup,
  switchSceneThread,
} from '@/mock/scene-fixtures'

import { createSceneClient } from './scene-client'

describe('sceneClient', () => {
  const sceneId = 'scene-midnight-platform'

  function createBridgeBackedClient() {
    const localDatabase = createSceneMockDatabase()
    const bridgeDatabase = createSceneMockDatabase()

    const bridge = {
      getSceneWorkspace: vi.fn(async () => structuredClone(bridgeDatabase.scenes[sceneId]!.workspace)),
      getSceneSetup: vi.fn(async () => structuredClone(bridgeDatabase.scenes[sceneId]!.setup)),
      getSceneExecution: vi.fn(async () => structuredClone(bridgeDatabase.scenes[sceneId]!.execution)),
      getSceneProse: vi.fn(async () => structuredClone(bridgeDatabase.scenes[sceneId]!.prose)),
      getSceneInspector: vi.fn(async () => structuredClone(bridgeDatabase.scenes[sceneId]!.inspector)),
      getSceneDockSummary: vi.fn(async () => getSceneDockSummary(bridgeDatabase, sceneId)),
      getSceneDockTab: vi.fn(async (_sceneId: string, tab: Parameters<typeof getSceneDockTab>[2]) =>
        getSceneDockTab(bridgeDatabase, sceneId, tab),
      ),
      previewAcceptedPatch: vi.fn(async () => previewAcceptedPatch(bridgeDatabase, sceneId)),
      commitAcceptedPatch: vi.fn(async (_sceneId: string, patchId: string) => {
        commitAcceptedPatch(bridgeDatabase, sceneId, patchId)
      }),
      saveSceneSetup: vi.fn(async (_sceneId: string, setup: Awaited<ReturnType<ReturnType<typeof createSceneClient>['getSceneSetup']>>) => {
        saveSceneSetup(bridgeDatabase, sceneId, setup)
      }),
      reviseSceneProse: vi.fn(async (_sceneId: string, revisionMode: Awaited<ReturnType<ReturnType<typeof createSceneClient>['getSceneProse']>>['revisionModes'][number]) => {
        applyProseRevision(bridgeDatabase, sceneId, revisionMode)
      }),
      continueSceneRun: vi.fn(async () => {
        continueSceneRun(bridgeDatabase, sceneId)
      }),
      switchSceneThread: vi.fn(async (_sceneId: string, threadId: string) => {
        switchSceneThread(bridgeDatabase, sceneId, threadId)
      }),
      acceptProposal: vi.fn(async (_sceneId: string, input: { proposalId: string; editedSummary?: string }) => {
        applyProposalAction(bridgeDatabase, sceneId, 'accept', input)
      }),
      editAcceptProposal: vi.fn(async (_sceneId: string, input: { proposalId: string; editedSummary?: string }) => {
        applyProposalAction(bridgeDatabase, sceneId, 'editAccept', input)
      }),
      requestRewrite: vi.fn(async (_sceneId: string, input: { proposalId: string }) => {
        applyProposalAction(bridgeDatabase, sceneId, 'requestRewrite', input)
      }),
      rejectProposal: vi.fn(async (_sceneId: string, input: { proposalId: string }) => {
        applyProposalAction(bridgeDatabase, sceneId, 'reject', input)
      }),
    }

    return {
      localDatabase,
      bridgeDatabase,
      bridge,
      bridgeClient: createSceneClient({
        database: localDatabase,
        bridgeResolver: () => bridge,
      }),
      mockClient: createSceneClient({
        database: localDatabase,
        bridgeResolver: () => undefined,
      }),
    }
  }

  it('throws an explicit capability error instead of falling back to mock fixtures when a bridge capability is missing', async () => {
    const localDatabase = createSceneMockDatabase()
    const client = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => ({
        getSceneWorkspace: async () => structuredClone(localDatabase.scenes[sceneId]!.workspace),
      }),
    })

    await expect(client.getRuntimeInfo()).resolves.toMatchObject({
      source: 'preload-bridge',
      capabilities: expect.objectContaining({
        getSceneWorkspace: true,
        getSceneExecution: false,
      }),
    })

    await expect(client.getSceneExecution(sceneId)).rejects.toMatchObject({
      name: 'SceneRuntimeCapabilityError',
      capability: 'getSceneExecution',
      source: 'preload-bridge',
    })
  })

  it('reads setup, execution, prose, inspector, and dock data from the bridge without touching fallback fixtures', async () => {
    const { bridge, bridgeClient, bridgeDatabase, mockClient } = createBridgeBackedClient()

    bridgeDatabase.scenes[sceneId]!.workspace.title = 'Bridge Workspace'
    bridgeDatabase.scenes[sceneId]!.setup.identity.title = 'Bridge Setup'
    bridgeDatabase.scenes[sceneId]!.execution.objective.goal = 'Bridge goal'
    bridgeDatabase.scenes[sceneId]!.prose.statusLabel = 'Bridge prose'
    bridgeDatabase.scenes[sceneId]!.inspector.runtime.profile.label = 'Bridge runtime profile'
    bridgeDatabase.scenes[sceneId]!.dock.events[0]!.title = 'Bridge dock event'

    await expect(bridgeClient.getSceneWorkspace(sceneId)).resolves.toMatchObject({ title: 'Bridge Workspace' })
    await expect(bridgeClient.getSceneSetup(sceneId)).resolves.toMatchObject({ identity: { title: 'Bridge Setup' } })
    await expect(bridgeClient.getSceneExecution(sceneId)).resolves.toMatchObject({ objective: { goal: 'Bridge goal' } })
    await expect(bridgeClient.getSceneProse(sceneId)).resolves.toMatchObject({ statusLabel: 'Bridge prose' })
    await expect(bridgeClient.getSceneInspector(sceneId)).resolves.toMatchObject({
      runtime: { profile: { label: 'Bridge runtime profile' } },
    })
    await expect(bridgeClient.getSceneDockSummary(sceneId)).resolves.toSatisfy((summary) =>
      summary.events.some((event) => event.title === 'Bridge dock event'),
    )
    await expect(bridgeClient.getSceneDockTab(sceneId, 'trace')).resolves.toMatchObject({
      trace: expect.any(Array),
    })

    expect(bridge.getSceneWorkspace).toHaveBeenCalledTimes(1)
    expect((await mockClient.getSceneWorkspace(sceneId)).title).not.toBe('Bridge Workspace')
  })

  it('keeps the local mock database untouched when bridge-backed setup, prose, and workspace writes succeed', async () => {
    const { bridgeClient, mockClient } = createBridgeBackedClient()
    const originalSetup = await mockClient.getSceneSetup(sceneId)
    const originalWorkspace = await mockClient.getSceneWorkspace(sceneId)
    const originalProse = await mockClient.getSceneProse(sceneId)

    await bridgeClient.saveSceneSetup(sceneId, {
      ...originalSetup,
      identity: {
        ...originalSetup.identity,
        title: 'Bridge Saved Title',
      },
    })
    await bridgeClient.reviseSceneProse(sceneId, 'compress')
    await bridgeClient.continueSceneRun(sceneId)
    await bridgeClient.switchSceneThread(sceneId, 'thread-branch-a')

    await expect(bridgeClient.getSceneSetup(sceneId)).resolves.toMatchObject({
      identity: { title: 'Bridge Saved Title' },
    })
    await expect(bridgeClient.getSceneProse(sceneId)).resolves.toMatchObject({
      statusLabel: expect.not.stringMatching(new RegExp(`^${originalProse.statusLabel}$`)),
    })
    await expect(bridgeClient.getSceneWorkspace(sceneId)).resolves.toMatchObject({
      activeThreadId: 'thread-branch-a',
      runStatus: 'running',
    })

    await expect(mockClient.getSceneSetup(sceneId)).resolves.toEqual(originalSetup)
    await expect(mockClient.getSceneWorkspace(sceneId)).resolves.toEqual(originalWorkspace)
    await expect(mockClient.getSceneProse(sceneId)).resolves.toEqual(originalProse)
  })

  it('preserves accept-versus-commit semantics for bridge-backed proposal mutations', async () => {
    const { bridgeClient, mockClient } = createBridgeBackedClient()
    const initialExecution = await bridgeClient.getSceneExecution(sceneId)
    const [firstPending, secondPending] = initialExecution.proposals.filter((proposal) => proposal.status === 'pending')

    expect(firstPending).toBeDefined()
    expect(secondPending).toBeDefined()

    await bridgeClient.acceptProposal(sceneId, { proposalId: firstPending!.id })
    await bridgeClient.editAcceptProposal(sceneId, {
      proposalId: secondPending!.id,
      editedSummary: 'Bridge edited acceptance',
    })

    const acceptedExecution = await bridgeClient.getSceneExecution(sceneId)
    const preview = await bridgeClient.previewAcceptedPatch(sceneId)
    const proseBeforeCommit = await bridgeClient.getSceneProse(sceneId)

    expect(acceptedExecution.proposals.find((proposal) => proposal.id === firstPending!.id)?.status).toBe('accepted')
    expect(acceptedExecution.proposals.find((proposal) => proposal.id === secondPending!.id)?.summary).toBe('Bridge edited acceptance')
    expect(acceptedExecution.acceptedSummary.patchCandidateCount).toBeGreaterThan(0)
    expect(preview).not.toBeNull()
    expect(proseBeforeCommit.statusLabel).not.toMatch(/committed/i)

    await bridgeClient.commitAcceptedPatch(sceneId, preview!.patchId)

    await expect(bridgeClient.previewAcceptedPatch(sceneId)).resolves.toSatisfy((nextPreview) => {
      return nextPreview !== null && nextPreview.patchId !== preview!.patchId
    })
    await expect(bridgeClient.getSceneWorkspace(sceneId)).resolves.toMatchObject({ status: 'committed' })
    await expect(bridgeClient.getSceneProse(sceneId)).resolves.toMatchObject({
      statusLabel: expect.any(String),
      latestDiffSummary: expect.any(String),
    })

    const fallbackExecution = await mockClient.getSceneExecution(sceneId)
    expect(fallbackExecution.acceptedSummary.patchCandidateCount).toBe(initialExecution.acceptedSummary.patchCandidateCount)
  })

  it('routes rewrite and reject proposal actions through the bridge without mutating fallback fixtures', async () => {
    const { bridgeClient, mockClient } = createBridgeBackedClient()
    const pendingProposal = (await bridgeClient.getSceneExecution(sceneId)).proposals.find((proposal) => proposal.status === 'pending')

    expect(pendingProposal).toBeDefined()

    await bridgeClient.requestRewrite(sceneId, { proposalId: pendingProposal!.id })
    await expect(bridgeClient.getSceneExecution(sceneId)).resolves.toSatisfy((execution) => {
      return execution.proposals.find((proposal) => proposal.id === pendingProposal!.id)?.status === 'rewrite-requested'
    })

    await bridgeClient.rejectProposal(sceneId, { proposalId: pendingProposal!.id })
    await expect(bridgeClient.getSceneExecution(sceneId)).resolves.toSatisfy((execution) => {
      return execution.proposals.find((proposal) => proposal.id === pendingProposal!.id)?.status === 'rejected'
    })

    await expect(mockClient.getSceneExecution(sceneId)).resolves.toSatisfy((execution) => {
      return execution.proposals.find((proposal) => proposal.id === pendingProposal!.id)?.status === 'pending'
    })
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

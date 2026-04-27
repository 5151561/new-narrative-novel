import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type PropsWithChildren } from 'react'
import { vi } from 'vitest'

import { APP_LOCALE_STORAGE_KEY, I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createTestProjectRuntime } from '@/app/project-runtime'
import { createFakeApiRuntime } from '@/app/project-runtime/fake-api-runtime.test-utils'
import { createSceneClient } from '@/features/scene/api/scene-client'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'
import { createSceneMockDatabase } from '@/mock/scene-fixtures'

import { SceneProseContainer } from './SceneProseContainer'

function wrapperFactory(runtime = createTestProjectRuntime()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }
}

afterEach(() => {
  window.localStorage.removeItem(APP_LOCALE_STORAGE_KEY)
})

describe('SceneProseContainer', () => {
  it('uses the runtime scene client when no explicit client prop is provided', async () => {
    const baseClient = createSceneClient()
    const runtimeClient = {
      ...baseClient,
      getSceneProse: vi.fn(baseClient.getSceneProse),
    }
    const Wrapper = wrapperFactory(
      createTestProjectRuntime({
        sceneClient: runtimeClient,
      }),
    )

    render(<SceneProseContainer sceneId="scene-midnight-platform" />, {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('Current manuscript draft')).toBeInTheDocument()
    })

    expect(runtimeClient.getSceneProse).toHaveBeenCalledWith('scene-midnight-platform')
  })

  it('prefers the explicit client prop over the runtime scene client', async () => {
    const runtimeClient = {
      ...createSceneClient(),
      getSceneProse: vi.fn(async () => {
        throw new Error('runtime client should not be used')
      }),
    }
    const explicitClient = createSceneClient()
    const explicitSpy = vi.fn(explicitClient.getSceneProse)
    const Wrapper = wrapperFactory(
      createTestProjectRuntime({
        sceneClient: runtimeClient,
      }),
    )

    render(
      <SceneProseContainer
        sceneId="scene-midnight-platform"
        client={{
          ...explicitClient,
          getSceneProse: explicitSpy,
        }}
      />,
      {
        wrapper: Wrapper,
      },
    )

    await waitFor(() => {
      expect(screen.getByText('Current manuscript draft')).toBeInTheDocument()
    })

    expect(explicitSpy).toHaveBeenCalledWith('scene-midnight-platform')
    expect(runtimeClient.getSceneProse).not.toHaveBeenCalled()
  })

  it('renders generated prose and its source summary from the prose read model', async () => {
    const generatedProse: SceneProseViewModel = {
      sceneId: 'scene-midnight-platform',
      proseDraft: 'Accepted run draft opens with the ledger still shut.',
      revisionModes: ['rewrite', 'compress'],
      latestDiffSummary: 'Generated from accepted run prose artifact.',
      warningsCount: 0,
      focusModeAvailable: true,
      draftWordCount: 9,
      statusLabel: 'Generated from run',
      traceSummary: {
        sourcePatchId: 'canon-patch-scene-midnight-platform-001',
        sourceProposals: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
            title: 'Anchor the arrival beat',
            sourceTraceId: 'trace-accepted-1',
          },
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
            title: 'Duplicate arrival beat',
            sourceTraceId: 'trace-accepted-duplicate',
          },
        ],
        relatedAssets: [
          { assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' },
          { assetId: 'asset-ren-voss', title: 'Ren Voss duplicate', kind: 'character' },
        ],
        missingLinks: ['asset-ledger-stays-shut'],
      },
    }
    const client = {
      ...createSceneClient(),
      getSceneProse: vi.fn(async () => generatedProse),
    }
    const Wrapper = wrapperFactory()

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('Accepted run draft opens with the ledger still shut.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Source summary' })).toBeInTheDocument()
    expect(screen.getByText(/canon-patch-scene-midnight-platform/)).toBeInTheDocument()
    expect(screen.getByText(/^\d+ proposals$/)).toBeInTheDocument()
    expect(screen.getByText('Anchor the arrival beat')).toBeInTheDocument()
    expect(screen.queryByText('Duplicate arrival beat')).not.toBeInTheDocument()
    expect(screen.getByText('Ren Voss')).toBeInTheDocument()
    expect(screen.queryByText('Ren Voss duplicate')).not.toBeInTheDocument()
    expect(screen.getByText('asset-ledger-stays-shut')).toBeInTheDocument()
  })

  it('does not render source summary noise for an empty trace summary', async () => {
    const proseWithEmptyTrace: SceneProseViewModel = {
      sceneId: 'scene-midnight-platform',
      proseDraft: 'Accepted run draft remains readable.',
      revisionModes: ['rewrite'],
      warningsCount: 0,
      focusModeAvailable: false,
      traceSummary: {
        sourcePatchId: '  ',
        sourceProposals: [],
        relatedAssets: [],
        missingLinks: [],
      },
    }
    const client = {
      ...createSceneClient(),
      getSceneProse: vi.fn(async () => proseWithEmptyTrace),
    }
    const Wrapper = wrapperFactory()

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('Accepted run draft remains readable.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Source summary' })).not.toBeInTheDocument()
    expect(screen.queryByText('No missing source links')).not.toBeInTheDocument()
  })

  it('derives a readable word count when prose text exists but draftWordCount is missing', async () => {
    const proseWithoutWordCount: SceneProseViewModel = {
      sceneId: 'scene-midnight-platform',
      proseDraft: 'Accepted run draft keeps the platform bargain public.',
      revisionModes: ['rewrite'],
      latestDiffSummary: 'Generated from accepted run prose artifact.',
      warningsCount: 0,
      focusModeAvailable: true,
      statusLabel: 'Generated from run',
    }
    const client = {
      ...createSceneClient(),
      getSceneProse: vi.fn(async () => proseWithoutWordCount),
    }
    const Wrapper = wrapperFactory()

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('Accepted run draft keeps the platform bargain public.')).toBeInTheDocument()
    expect(screen.getByText(/^\d+ words$/)).toBeInTheDocument()
    expect(screen.queryByText('undefined words')).not.toBeInTheDocument()
  })

  it('does not collapse zh-CN prose fallback into a single-character count', async () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'zh-CN')

    const proseWithoutWordCount: SceneProseViewModel = {
      sceneId: 'scene-midnight-platform',
      proseDraft: '雨一直压着站台，任让梅把条件说给旁观者听。',
      revisionModes: ['rewrite'],
      latestDiffSummary: '来自已采纳正文。',
      warningsCount: 0,
      focusModeAvailable: true,
      statusLabel: '已生成',
    }
    const client = {
      ...createSceneClient(),
      getSceneProse: vi.fn(async () => proseWithoutWordCount),
    }
    const Wrapper = wrapperFactory()

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('雨一直压着站台，任让梅把条件说给旁观者听。')).toBeInTheDocument()
    expect(screen.getByText(/^\d+ 字$/)).toBeInTheDocument()
    expect(screen.queryByText('1 字')).not.toBeInTheDocument()
    expect(screen.queryByText('undefined 字')).not.toBeInTheDocument()
  })

  it('applies a mock revision request and updates the prose status footer', async () => {
    const user = userEvent.setup()
    const client = createSceneClient()
    const Wrapper = wrapperFactory()

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('Current manuscript draft')).toBeInTheDocument()
    })
    expect(screen.queryByText('Local Mock')).not.toBeInTheDocument()
    expect(screen.queryByText(/local mock state/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    await user.click(screen.getByRole('button', { name: 'Request Revision' }))

    expect((await screen.findAllByText('Compressed repeated witness beats while preserving accepted provenance.')).length).toBeGreaterThan(0)
    expect(screen.getByText('Pending revision candidate')).toBeInTheDocument()
    expect(screen.getByText('Queue 1')).toBeInTheDocument()
  })

  it('shows a prose toolbar and exposes focus mode only when prose focus is available', async () => {
    const user = userEvent.setup()
    const client = createSceneClient()
    const Wrapper = wrapperFactory()

    const { rerender } = render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Focus Mode' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Focus Mode' }))
    expect(screen.getByText('Focus mode active')).toBeInTheDocument()

    rerender(<SceneProseContainer sceneId="scene-warehouse-bridge" client={client} />)

    await waitFor(() => {
      expect(screen.getByText('No manuscript draft yet')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Focus Mode' })).not.toBeInTheDocument()
  })

  it('refetches bridge-backed prose after revise without mutating fallback fixtures', async () => {
    const user = userEvent.setup()
    const localDatabase = createSceneMockDatabase()
    const bridgeDatabase = createSceneMockDatabase()
    const bridgeStateClient = createSceneClient({
      database: bridgeDatabase,
      bridgeResolver: () => undefined,
    })
    const runtimeClient = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => ({
        getSceneProse: async () => bridgeStateClient.getSceneProse('scene-midnight-platform'),
        reviseSceneProse: async (_sceneId, input) => {
          await bridgeStateClient.reviseSceneProse('scene-midnight-platform', input)
        },
      }),
    })
    const fallbackClient = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => undefined,
    })
    const runtime = createTestProjectRuntime({
      sceneClient: {
        ...runtimeClient,
        getSceneProse: vi.fn(runtimeClient.getSceneProse),
        reviseSceneProse: vi.fn(runtimeClient.reviseSceneProse),
      },
    })
    const Wrapper = wrapperFactory(runtime)

    render(<SceneProseContainer sceneId="scene-midnight-platform" />, {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('Current manuscript draft')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    await user.click(screen.getByRole('button', { name: 'Request Revision' }))

    expect((await screen.findAllByText('Compressed repeated witness beats while preserving accepted provenance.')).length).toBeGreaterThan(0)
    expect(screen.getByText('Queue 1')).toBeInTheDocument()
    expect(runtime.sceneClient.reviseSceneProse).toHaveBeenCalledWith('scene-midnight-platform', {
      revisionMode: 'compress',
      instruction: undefined,
    })
    expect(runtime.sceneClient.getSceneProse).toHaveBeenCalledTimes(2)

    const fallbackProse = await fallbackClient.getSceneProse('scene-midnight-platform')
    expect(fallbackProse.latestDiffSummary).not.toBe('Compressed repeated witness beats while preserving accepted provenance.')
    expect(fallbackProse.revisionQueueCount ?? 0).toBe(0)
  })

  it('routes prose revisions through the API runtime, refetches queued state, and keeps the draft body stable', async () => {
    const user = userEvent.setup()
    const { projectId, requests, runtime, mockRuntime } = createFakeApiRuntime()
    const getSceneProseSpy = vi.spyOn(mockRuntime.sceneClient, 'getSceneProse')
    const reviseSceneProseSpy = vi.spyOn(mockRuntime.sceneClient, 'reviseSceneProse')
    const acceptSceneProseRevisionSpy = vi.spyOn(mockRuntime.sceneClient, 'acceptSceneProseRevision')
    const initialProse = await mockRuntime.sceneClient.getSceneProse('scene-midnight-platform')
    const Wrapper = wrapperFactory(runtime)

    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose')

    render(<SceneProseContainer sceneId="scene-midnight-platform" />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText(initialProse.proseDraft!)).toBeInTheDocument()
    const stableSearch = window.location.search

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    expect(window.location.search).toBe(stableSearch)
    await user.type(screen.getByLabelText('Revision brief'), 'Tighten the witness pressure without changing the accepted facts.')
    expect(window.location.search).toBe(stableSearch)
    await user.click(screen.getByRole('button', { name: 'Request Revision' }))

    expect((await screen.findAllByText('Compressed repeated witness beats while preserving accepted provenance.')).length).toBeGreaterThan(0)
    expect(screen.getByText('Pending revision candidate')).toBeInTheDocument()
    expect(screen.getByText('Queue 1')).toBeInTheDocument()
    expect(screen.getByText(initialProse.proseDraft!)).toBeInTheDocument()
    expect(reviseSceneProseSpy).toHaveBeenCalledWith('scene-midnight-platform', {
      revisionMode: 'compress',
      instruction: 'Tighten the witness pressure without changing the accepted facts.',
    })
    expect(requests).toContainEqual({
      method: 'POST',
      path: `/api/projects/${projectId}/scenes/scene-midnight-platform/prose/revision`,
      body: {
        revisionMode: 'compress',
        instruction: 'Tighten the witness pressure without changing the accepted facts.',
      },
    })

    await user.click(screen.getByRole('button', { name: 'Accept Revision' }))

    expect(window.location.search).toBe(stableSearch)
    await waitFor(() => {
      expect(screen.queryByText('Pending revision candidate')).not.toBeInTheDocument()
      expect(screen.getByText(/Editorial instruction: Tighten the witness pressure without changing the accepted facts\./)).toBeInTheDocument()
    })

    expect(acceptSceneProseRevisionSpy).toHaveBeenCalledTimes(1)
    expect(requests).toContainEqual({
      method: 'POST',
      path: `/api/projects/${projectId}/scenes/scene-midnight-platform/prose/revision/accept`,
      body: {
        revisionId: expect.any(String),
      },
    })
    expect(getSceneProseSpy.mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  it('resets the local revision brief when switching scenes on the prose tab', async () => {
    const user = userEvent.setup()
    const sceneAClient = createSceneClient()
    const sceneBClient = createSceneClient()
    const client = {
      ...sceneAClient,
      getSceneProse: vi.fn(async (sceneId: string) =>
        sceneId === 'scene-midnight-platform'
          ? sceneAClient.getSceneProse(sceneId)
          : sceneBClient.getSceneProse('scene-concourse-delay'),
      ),
      reviseSceneProse: vi.fn(async () => undefined),
    }
    const Wrapper = wrapperFactory()

    const { rerender } = render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('Current manuscript draft')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Revision brief'), 'Carry the witness pressure from scene A.')
    expect(screen.getByLabelText('Revision brief')).toHaveValue('Carry the witness pressure from scene A.')

    rerender(<SceneProseContainer sceneId="scene-concourse-delay" client={client} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Revision brief')).toHaveValue('')
    })

    await user.click(screen.getByRole('button', { name: 'Request Revision' }))

    expect(client.reviseSceneProse).toHaveBeenCalledWith('scene-concourse-delay', {
      revisionMode: 'rewrite',
      instruction: undefined,
    })
  })

  it('keeps revise disabled when the API runtime prose read model has no draft', async () => {
    const user = userEvent.setup()
    const { requests, runtime } = createFakeApiRuntime()
    const Wrapper = wrapperFactory(runtime)

    render(<SceneProseContainer sceneId="scene-warehouse-bridge" />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('No manuscript draft yet')).toBeInTheDocument()
    expect(
      screen.getByText('This scene has not produced a readable manuscript draft for chapter and book assembly yet.'),
    ).toBeInTheDocument()
    expect(screen.getByText('A prose draft is required before queuing a revision.')).toBeInTheDocument()
    expect(screen.getByText('No draft')).toBeInTheDocument()

    const reviseButton = screen.getByRole('button', { name: 'Request Revision' })
    expect(reviseButton).toBeDisabled()

    await user.click(reviseButton)

    expect(requests.some((request) => request.method === 'POST' && request.path.endsWith('/prose/revision'))).toBe(false)
  })

  it('trims revision briefs before submit and blocks overlength revision requests locally', async () => {
    const user = userEvent.setup()
    const { requests, runtime } = createFakeApiRuntime()
    const Wrapper = wrapperFactory(runtime)
    const overlongBrief = 'x'.repeat(281)

    render(<SceneProseContainer sceneId="scene-midnight-platform" />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('Current manuscript draft')).toBeInTheDocument()

    const revisionBriefInput = screen.getByLabelText('Revision brief')

    fireEvent.change(revisionBriefInput, {
      target: { value: '  Tighten the witness pressure.  ' },
    })
    await user.click(screen.getByRole('button', { name: 'Request Revision' }))

    expect(requests).toContainEqual({
      method: 'POST',
      path: '/api/projects/project-smoke/scenes/scene-midnight-platform/prose/revision',
      body: {
        revisionMode: 'rewrite',
        instruction: 'Tighten the witness pressure.',
      },
    })

    fireEvent.change(revisionBriefInput, {
      target: { value: overlongBrief },
    })

    const requestButton = screen.getByRole('button', { name: 'Request Revision' })
    expect(requestButton).toBeDisabled()
    expect(screen.getByText('Revision brief must be 280 characters or fewer.')).toBeInTheDocument()
    expect(
      requests.filter((request) => request.method === 'POST' && request.path.endsWith('/prose/revision')),
    ).toHaveLength(1)
  })

  it('keeps revision mode and brief local while current prose stays visible until accept swaps in the candidate', async () => {
    const user = userEvent.setup()
    const initialDraft = 'Current draft stays visible until acceptance.'
    const acceptedDraft = 'Accepted candidate becomes the new current prose.'
    let proseState: SceneProseViewModel = {
      sceneId: 'scene-midnight-platform',
      proseDraft: initialDraft,
      revisionModes: ['rewrite', 'compress', 'expand'],
      latestDiffSummary: 'A fixture prose draft was rendered for Midnight Platform.',
      warningsCount: 0,
      focusModeAvailable: true,
      revisionQueueCount: 0,
      draftWordCount: 7,
      statusLabel: 'Generated',
      traceSummary: {
        sourcePatchId: 'canon-patch-scene-midnight-platform-002',
      },
    }

    const client = {
      ...createSceneClient(),
      getSceneProse: vi.fn(async () => structuredClone(proseState)),
      reviseSceneProse: vi.fn(async (_sceneId: string, input: { revisionMode: 'rewrite' | 'compress' | 'expand'; instruction?: string }) => {
        proseState = {
          ...proseState,
          revisionModes: ['rewrite', 'expand', 'compress'],
          latestDiffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
          revisionQueueCount: 1,
          statusLabel: 'Revision candidate ready',
          revisionCandidate: {
            revisionId: 'revision-scene-midnight-platform-001',
            revisionMode: input.revisionMode,
            instruction: input.instruction,
            proseBody: acceptedDraft,
            diffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
            sourceProseDraftId: 'prose-draft-scene-midnight-platform-002',
            sourceCanonPatchId: 'canon-patch-scene-midnight-platform-002',
            contextPacketId: 'ctx-scene-midnight-platform-run-002',
          },
        }
      }),
      acceptSceneProseRevision: vi.fn(async (_sceneId: string, revisionId: string) => {
        expect(revisionId).toBe('revision-scene-midnight-platform-001')
        proseState = {
          ...proseState,
          revisionModes: ['rewrite', 'expand', 'compress'],
          proseDraft: acceptedDraft,
          latestDiffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
          revisionQueueCount: 0,
          statusLabel: 'Updated',
          revisionCandidate: undefined,
        }
      }),
    }
    const Wrapper = wrapperFactory()

    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose')

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText(initialDraft)).toBeInTheDocument()
    const stableSearch = window.location.search

    await user.click(screen.getByRole('button', { name: 'Expand' }))
    expect(screen.getByRole('button', { name: 'Expand' }).className).toContain('bg-accent')
    expect(window.location.search).toBe(stableSearch)
    await user.type(screen.getByLabelText('Revision brief'), 'Add a clearer witness-facing aftermath.')
    expect(window.location.search).toBe(stableSearch)
    await user.click(screen.getByRole('button', { name: 'Request Revision' }))

    expect(await screen.findByText('Pending revision candidate')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand' }).className).toContain('bg-accent')
    expect(screen.getByRole('button', { name: 'Rewrite' }).className).not.toContain('bg-accent')
    expect(screen.getByText(initialDraft)).toBeInTheDocument()
    expect(screen.getByText(acceptedDraft)).toBeInTheDocument()
    expect(window.location.search).toBe(stableSearch)

    await user.click(screen.getByRole('button', { name: 'Accept Revision' }))

    await waitFor(() => {
      expect(screen.queryByText('Pending revision candidate')).not.toBeInTheDocument()
      expect(screen.queryByText(initialDraft)).not.toBeInTheDocument()
      expect(screen.getByText(acceptedDraft)).toBeInTheDocument()
    })

    expect(window.location.search).toBe(stableSearch)
    expect(screen.getByRole('button', { name: 'Expand' }).className).toContain('bg-accent')
    expect(screen.getByRole('button', { name: 'Rewrite' }).className).not.toContain('bg-accent')
    expect(client.reviseSceneProse).toHaveBeenCalledWith('scene-midnight-platform', {
      revisionMode: 'expand',
      instruction: 'Add a clearer witness-facing aftermath.',
    })
    expect(client.acceptSceneProseRevision).toHaveBeenCalledWith(
      'scene-midnight-platform',
      'revision-scene-midnight-platform-001',
    )
  })

})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type PropsWithChildren } from 'react'
import { vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createTestProjectRuntime } from '@/app/project-runtime'
import { createFakeApiRuntime } from '@/app/project-runtime/fake-api-runtime.test-utils'
import { createSceneClient } from '@/features/scene/api/scene-client'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'
import { applyProseRevision, createSceneMockDatabase } from '@/mock/scene-fixtures'

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
      expect(screen.getByText('Current Draft')).toBeInTheDocument()
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
      expect(screen.getByText('Current Draft')).toBeInTheDocument()
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
    expect(screen.getByRole('heading', { name: 'Draft Source Summary' })).toBeInTheDocument()
    expect(screen.getByText('canon-patch-scene-midnight-platform-001')).toBeInTheDocument()
    expect(screen.getByText('1 proposals')).toBeInTheDocument()
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
    expect(screen.queryByRole('heading', { name: 'Draft Source Summary' })).not.toBeInTheDocument()
    expect(screen.queryByText('No missing source links')).not.toBeInTheDocument()
  })

  it('applies a mock revision request and updates the prose status footer', async () => {
    const user = userEvent.setup()
    const client = createSceneClient()
    const Wrapper = wrapperFactory()

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('Current Draft')).toBeInTheDocument()
    })
    expect(screen.queryByText('Local Mock')).not.toBeInTheDocument()
    expect(screen.queryByText(/local mock state/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    await user.click(screen.getByRole('button', { name: 'Revise Draft' }))

    expect(await screen.findAllByText('Latest revision: compress pass prepared for review.')).toHaveLength(2)
    expect(screen.getByText('1 revision queued')).toBeInTheDocument()
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
      expect(screen.getByText('No draft prose yet')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Focus Mode' })).not.toBeInTheDocument()
  })

  it('refetches bridge-backed prose after revise without mutating fallback fixtures', async () => {
    const user = userEvent.setup()
    const localDatabase = createSceneMockDatabase()
    const bridgeDatabase = createSceneMockDatabase()
    const runtimeClient = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => ({
        getSceneProse: async () => structuredClone(bridgeDatabase.scenes['scene-midnight-platform']!.prose),
        reviseSceneProse: async (_sceneId, revisionMode) => {
          applyProseRevision(bridgeDatabase, 'scene-midnight-platform', revisionMode)
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
      expect(screen.getByText('Current Draft')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    await user.click(screen.getByRole('button', { name: 'Revise Draft' }))

    expect(await screen.findAllByText('Latest revision: compress pass prepared for review.')).toHaveLength(2)
    expect(screen.getByText('1 revision queued')).toBeInTheDocument()
    expect(runtime.sceneClient.reviseSceneProse).toHaveBeenCalledWith('scene-midnight-platform', 'compress')
    expect(runtime.sceneClient.getSceneProse).toHaveBeenCalledTimes(2)

    const fallbackProse = await fallbackClient.getSceneProse('scene-midnight-platform')
    expect(fallbackProse.latestDiffSummary).not.toBe('Latest revision: compress pass prepared for review.')
    expect(fallbackProse.revisionQueueCount ?? 0).toBe(0)
  })

  it('routes prose revisions through the API runtime, refetches queued state, and keeps the draft body stable', async () => {
    const user = userEvent.setup()
    const { projectId, requests, runtime, mockRuntime } = createFakeApiRuntime()
    const getSceneProseSpy = vi.spyOn(mockRuntime.sceneClient, 'getSceneProse')
    const reviseSceneProseSpy = vi.spyOn(mockRuntime.sceneClient, 'reviseSceneProse')
    const initialProse = await mockRuntime.sceneClient.getSceneProse('scene-midnight-platform')
    const Wrapper = wrapperFactory(runtime)

    render(<SceneProseContainer sceneId="scene-midnight-platform" />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText(initialProse.proseDraft!)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    await user.click(screen.getByRole('button', { name: 'Revise Draft' }))

    expect(await screen.findAllByText('Latest revision: compress pass prepared for review.')).toHaveLength(2)
    expect(screen.getByText('1 revision queued')).toBeInTheDocument()
    expect(screen.getByText('Queue 1')).toBeInTheDocument()
    expect(screen.getByText(initialProse.proseDraft!)).toBeInTheDocument()
    expect(reviseSceneProseSpy).toHaveBeenCalledWith('scene-midnight-platform', 'compress')
    expect(getSceneProseSpy).toHaveBeenCalledTimes(4)
    expect(requests).toContainEqual({
      method: 'POST',
      path: `/api/projects/${projectId}/scenes/scene-midnight-platform/prose/revision`,
      body: {
        revisionMode: 'compress',
      },
    })
  })

  it('keeps revise disabled when the API runtime prose read model has no draft', async () => {
    const user = userEvent.setup()
    const { requests, runtime } = createFakeApiRuntime()
    const Wrapper = wrapperFactory(runtime)

    render(<SceneProseContainer sceneId="scene-warehouse-bridge" />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('No draft prose yet')).toBeInTheDocument()
    expect(screen.getByText('A prose draft is required before queuing a revision.')).toBeInTheDocument()

    const reviseButton = screen.getByRole('button', { name: 'Revise Draft' })
    expect(reviseButton).toBeDisabled()

    await user.click(reviseButton)

    expect(requests.some((request) => request.method === 'POST' && request.path.endsWith('/prose/revision'))).toBe(false)
  })
})

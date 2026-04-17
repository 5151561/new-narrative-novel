import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

import { useTraceabilitySceneSources } from './useTraceabilitySceneSources'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return {
    queryClient,
    wrapper: function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          <I18nProvider>{children}</I18nProvider>
        </QueryClientProvider>
      )
    },
  }
}

describe('useTraceabilitySceneSources', () => {
  it('does not create a prose query entry when the scene prose is provided by seed data', async () => {
    const { queryClient, wrapper } = createWrapper()
    const client = {
      async getSceneExecution(sceneId: string) {
        return {
          runId: `run-${sceneId}`,
          objective: { goal: 'Goal', warningsCount: 0, unresolvedCount: 0, cast: [], constraintSummary: [] },
          beats: [],
          proposals: [],
          acceptedSummary: { sceneSummary: 'Summary', acceptedFacts: [], readiness: 'draftable' as const, pendingProposalCount: 0, warningCount: 0, patchCandidateCount: 0 },
          runtimeSummary: { runHealth: 'stable' as const, latencyLabel: '', tokenLabel: '', costLabel: '' },
          canContinueRun: false,
          canOpenProse: true,
        }
      },
      async getSceneProse() {
        throw new Error('seeded prose query should not be created')
      },
      async getSceneInspector() {
        return {
          context: { acceptedFacts: [], privateInfoGuard: { summary: '', items: [] }, actorKnowledgeBoundaries: [], localState: [], overrides: [] },
          versions: { checkpoints: [], acceptanceTimeline: [], patchCandidates: [] },
          runtime: { profile: { label: '', summary: '' }, runHealth: 'stable' as const, metrics: { latencyLabel: '', tokenLabel: '', costLabel: '' } },
        }
      },
      async previewAcceptedPatch() {
        return null
      },
    }

    const hook = renderHook(
      () =>
        useTraceabilitySceneSources(['scene-seeded'], client, {
          sceneSourceSeedsBySceneId: {
            'scene-seeded': {
              proseState: {
                prose: {
                  sceneId: 'scene-seeded',
                  proseDraft: 'Seeded draft',
                  revisionModes: ['rewrite'],
                  latestDiffSummary: 'Seeded diff',
                  warningsCount: 0,
                  focusModeAvailable: true,
                },
                isLoading: false,
                error: null,
              },
            },
          },
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.traceBySceneId['scene-seeded']).not.toBeNull()
    expect(queryClient.getQueryCache().find({ queryKey: sceneQueryKeys.prose('scene-seeded', 'en') })).toBeUndefined()
  })
})

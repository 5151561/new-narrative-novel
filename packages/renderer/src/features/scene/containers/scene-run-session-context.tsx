import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'

import type { RunSelectedProposalVariantRecord } from '@/features/run/api/run-records'
import { useRunArtifactDetailQuery } from '@/features/run/hooks/useRunArtifactDetailQuery'
import { useRunArtifactsQuery } from '@/features/run/hooks/useRunArtifactsQuery'
import { useRunProposalVariantDraft } from '@/features/run/hooks/useRunProposalVariantDraft'
import { useSceneRunSession } from '@/features/run/hooks/useSceneRunSession'

export interface SceneRunReviewVariantState {
  proposalSetArtifactId: string | null
  selectedVariantsByProposalId: Record<string, string>
  selectedVariantsForSubmit: RunSelectedProposalVariantRecord[]
  selectVariant: (proposalId: string, variantId: string) => void
  resetVariants: () => void
  isLoadingProposalSet: boolean
  proposalSetError: Error | null
}

type SharedSceneRunSession = ReturnType<typeof useSceneRunSession> & {
  reviewVariants: SceneRunReviewVariantState
}

const SceneRunSessionContext = createContext<SharedSceneRunSession | null>(null)

interface SceneRunSessionProviderProps extends PropsWithChildren {
  sceneId: string
  runId?: string | null
  latestRunId?: string | null
}

export function SceneRunSessionProvider({
  children,
  sceneId,
  runId,
  latestRunId,
}: SceneRunSessionProviderProps) {
  const session = useSceneRunSession({
    sceneId,
    runId,
    latestRunId,
  })
  const activeRunId = session.activeRunId ?? null
  const artifactsQuery = useRunArtifactsQuery(activeRunId)
  const proposalSetArtifactId = useMemo(
    () => artifactsQuery.artifacts.find((artifact) => artifact.kind === 'proposal-set')?.id ?? null,
    [artifactsQuery.artifacts],
  )
  const proposalSetDetailQuery = useRunArtifactDetailQuery({
    runId: activeRunId,
    artifactId: proposalSetArtifactId,
  })
  const proposalSetArtifact =
    proposalSetDetailQuery.artifact?.kind === 'proposal-set' ? proposalSetDetailQuery.artifact : null
  const variantDraft = useRunProposalVariantDraft({
    runId: activeRunId,
    proposalSetArtifact,
  })
  const reviewVariants = useMemo<SceneRunReviewVariantState>(
    () => ({
      proposalSetArtifactId,
      selectedVariantsByProposalId: variantDraft.selectedVariantsByProposalId,
      selectedVariantsForSubmit: variantDraft.selectedVariantsForSubmit,
      selectVariant: variantDraft.selectVariant,
      resetVariants: variantDraft.reset,
      isLoadingProposalSet: artifactsQuery.isLoading || proposalSetDetailQuery.isLoading,
      proposalSetError: artifactsQuery.error ?? proposalSetDetailQuery.error ?? null,
    }),
    [
      artifactsQuery.error,
      artifactsQuery.isLoading,
      proposalSetArtifactId,
      proposalSetDetailQuery.error,
      proposalSetDetailQuery.isLoading,
      variantDraft.reset,
      variantDraft.selectVariant,
      variantDraft.selectedVariantsByProposalId,
      variantDraft.selectedVariantsForSubmit,
    ],
  )
  const value = useMemo<SharedSceneRunSession>(
    () => ({
      ...session,
      reviewVariants,
    }),
    [reviewVariants, session],
  )

  return <SceneRunSessionContext.Provider value={value}>{children}</SceneRunSessionContext.Provider>
}

export function useSharedSceneRunSession() {
  const session = useContext(SceneRunSessionContext)

  if (!session) {
    throw new Error('useSharedSceneRunSession must be used within SceneRunSessionProvider.')
  }

  return session
}

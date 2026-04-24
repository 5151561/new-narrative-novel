import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ProposalSetArtifactDetailRecord } from '@/features/run/api/run-artifact-records'
import type { RunSelectedProposalVariantRecord } from '@/features/run/api/run-records'

export interface UseRunProposalVariantDraftInput {
  runId?: string | null
  proposalSetArtifact?: ProposalSetArtifactDetailRecord | null
}

interface DraftState {
  resetKey: string
  artifactSignature: string
  selectedVariantsByProposalId: Record<string, string>
}

function buildResetKey(runId?: string | null, proposalSetArtifact?: ProposalSetArtifactDetailRecord | null) {
  return `${runId ?? '__missing_run__'}:${proposalSetArtifact?.id ?? '__missing_proposal_set__'}`
}

function hasVariant(proposal: ProposalSetArtifactDetailRecord['proposals'][number], variantId?: string) {
  return Boolean(variantId && proposal.variants?.some((variant) => variant.id === variantId))
}

function getInitialVariantId(proposal: ProposalSetArtifactDetailRecord['proposals'][number]) {
  const variants = proposal.variants ?? []
  if (variants.length === 0) {
    return undefined
  }

  if (hasVariant(proposal, proposal.selectedVariantId)) {
    return proposal.selectedVariantId
  }

  if (hasVariant(proposal, proposal.defaultVariantId)) {
    return proposal.defaultVariantId
  }

  return variants[0]!.id
}

function buildArtifactSignature(proposalSetArtifact?: ProposalSetArtifactDetailRecord | null) {
  return (proposalSetArtifact?.proposals ?? [])
    .map((proposal) => [
      proposal.id,
      proposal.selectedVariantId ?? '',
      proposal.defaultVariantId ?? '',
      ...(proposal.variants ?? []).map((variant) => variant.id),
    ].join(':'))
    .join('|')
}

function deriveInitialSelection(proposalSetArtifact?: ProposalSetArtifactDetailRecord | null) {
  const selectedVariantsByProposalId: Record<string, string> = {}

  for (const proposal of proposalSetArtifact?.proposals ?? []) {
    const initialVariantId = getInitialVariantId(proposal)
    if (initialVariantId) {
      selectedVariantsByProposalId[proposal.id] = initialVariantId
    }
  }

  return selectedVariantsByProposalId
}

function reconcileSelection(
  currentSelection: Record<string, string>,
  proposalSetArtifact?: ProposalSetArtifactDetailRecord | null,
) {
  const nextSelection: Record<string, string> = {}

  for (const proposal of proposalSetArtifact?.proposals ?? []) {
    if (!proposal.variants?.length) {
      continue
    }

    const currentVariantId = currentSelection[proposal.id]
    if (hasVariant(proposal, currentVariantId)) {
      nextSelection[proposal.id] = currentVariantId!
      continue
    }

    const initialVariantId = getInitialVariantId(proposal)
    if (initialVariantId) {
      nextSelection[proposal.id] = initialVariantId
    }
  }

  return nextSelection
}

export function useRunProposalVariantDraft({
  runId,
  proposalSetArtifact,
}: UseRunProposalVariantDraftInput) {
  const resetKey = buildResetKey(runId, proposalSetArtifact)
  const artifactSignature = useMemo(() => buildArtifactSignature(proposalSetArtifact), [proposalSetArtifact])
  const initialSelection = useMemo(() => deriveInitialSelection(proposalSetArtifact), [proposalSetArtifact])
  const variantIdsByProposalId = useMemo(() => {
    const next: Record<string, Set<string>> = {}

    for (const proposal of proposalSetArtifact?.proposals ?? []) {
      if (proposal.variants?.length) {
        next[proposal.id] = new Set(proposal.variants.map((variant) => variant.id))
      }
    }

    return next
  }, [proposalSetArtifact])
  const [draftState, setDraftState] = useState<DraftState>(() => ({
    resetKey,
    artifactSignature,
    selectedVariantsByProposalId: initialSelection,
  }))

  useEffect(() => {
    setDraftState((current) => {
      if (current.resetKey === resetKey && current.artifactSignature === artifactSignature) {
        return current
      }

      if (current.resetKey === resetKey) {
        return {
          resetKey,
          artifactSignature,
          selectedVariantsByProposalId: reconcileSelection(current.selectedVariantsByProposalId, proposalSetArtifact),
        }
      }

      return {
        resetKey,
        artifactSignature,
        selectedVariantsByProposalId: initialSelection,
      }
    })
  }, [artifactSignature, initialSelection, proposalSetArtifact, resetKey])

  const selectedVariantsByProposalId = draftState.resetKey === resetKey && draftState.artifactSignature === artifactSignature
    ? draftState.selectedVariantsByProposalId
    : reconcileSelection(
        draftState.resetKey === resetKey ? draftState.selectedVariantsByProposalId : initialSelection,
        proposalSetArtifact,
      )

  const selectVariant = useCallback(
    (proposalId: string, variantId: string) => {
      if (!variantIdsByProposalId[proposalId]?.has(variantId)) {
        return
      }

      setDraftState((current) => {
        const currentSelection = current.resetKey === resetKey && current.artifactSignature === artifactSignature
          ? current.selectedVariantsByProposalId
          : reconcileSelection(
              current.resetKey === resetKey ? current.selectedVariantsByProposalId : initialSelection,
              proposalSetArtifact,
            )

        if (
          current.resetKey === resetKey
          && current.artifactSignature === artifactSignature
          && currentSelection[proposalId] === variantId
        ) {
          return current
        }

        return {
          resetKey,
          artifactSignature,
          selectedVariantsByProposalId: {
            ...currentSelection,
            [proposalId]: variantId,
          },
        }
      })
    },
    [artifactSignature, initialSelection, proposalSetArtifact, resetKey, variantIdsByProposalId],
  )

  const reset = useCallback(() => {
    setDraftState({
      resetKey,
      artifactSignature,
      selectedVariantsByProposalId: initialSelection,
    })
  }, [artifactSignature, initialSelection, resetKey])

  const selectedVariantsForSubmit = useMemo<RunSelectedProposalVariantRecord[]>(
    () =>
      Object.entries(selectedVariantsByProposalId).map(([proposalId, variantId]) => ({
        proposalId,
        variantId,
      })),
    [selectedVariantsByProposalId],
  )

  return {
    selectedVariantsByProposalId,
    selectedVariantsForSubmit,
    selectVariant,
    reset,
  }
}

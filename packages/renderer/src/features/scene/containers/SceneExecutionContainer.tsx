import { useEffect, useMemo } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'

import { SceneExecutionTab } from '../components/SceneExecutionTab'
import { useProposalActions } from '../hooks/useProposalActions'
import { useProposalSelection } from '../hooks/useProposalSelection'
import { useSceneExecutionQuery } from '../hooks/useSceneExecutionQuery'

interface SceneExecutionContainerProps {
  sceneId: string
}

export function SceneExecutionContainer({ sceneId }: SceneExecutionContainerProps) {
  const execution = useSceneExecutionQuery(sceneId)
  const selection = useProposalSelection()
  const actions = useProposalActions(sceneId)

  const filteredProposals = useMemo(() => {
    return execution.proposals.filter((proposal) => {
      if (selection.filters.beatId && proposal.beatId !== selection.filters.beatId) {
        return false
      }
      if (selection.filters.status && proposal.status !== selection.filters.status) {
        return false
      }
      if (selection.filters.kind && proposal.kind !== selection.filters.kind) {
        return false
      }
      if (selection.filters.actorId && proposal.actor.id !== selection.filters.actorId) {
        return false
      }
      if (selection.filters.severity) {
        const severities = proposal.risks?.map((risk) => risk.severity) ?? []
        if (!severities.includes(selection.filters.severity)) {
          return false
        }
      }
      return true
    })
  }, [execution.proposals, selection.filters])

  useEffect(() => {
    if (filteredProposals.length === 0) {
      selection.setSelectedProposalId(undefined)
      return
    }

    const currentVisible = filteredProposals.some((proposal) => proposal.id === selection.selectedProposalId)
    if (!currentVisible) {
      selection.setSelectedProposalId(filteredProposals[0]?.id)
    }
  }, [filteredProposals, selection])

  if (execution.error) {
    return (
      <div className="p-5">
        <EmptyState
          title="Execution data unavailable"
          message={execution.error.message}
        />
      </div>
    )
  }

  if (execution.isLoading) {
    return (
      <div className="p-5">
        <EmptyState title="Loading execution" message="Gathering the scene objective, beats, proposals, and accepted summary." />
      </div>
    )
  }

  return (
    <SceneExecutionTab
      objective={execution.objective}
      beats={execution.beats}
      proposals={filteredProposals}
      selectedBeatId={selection.selectedBeatId}
      selectedProposalId={selection.selectedProposalId}
      filters={selection.filters}
      acceptedSummary={execution.acceptedSummary}
      canContinueRun={execution.canContinueRun}
      canOpenProse={execution.canOpenProse}
      onSelectBeat={(beatId) => selection.setFilters({ ...selection.filters, beatId })}
      onSelectProposal={selection.setSelectedProposalId}
      onAccept={(proposalId) => void actions.accept({ proposalId })}
      onEditAccept={(proposalId, editedSummary) => void actions.editAccept({ proposalId, editedSummary })}
      onRequestRewrite={(proposalId) => void actions.requestRewrite({ proposalId, note: 'Tighten continuity before resubmitting.' })}
      onReject={(proposalId) => void actions.reject({ proposalId, note: 'Rejected during mock review flow.' })}
      onClearFilters={selection.resetFilters}
    />
  )
}

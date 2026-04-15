import { useEffect, useMemo } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'

import { SceneExecutionTab } from '../components/SceneExecutionTab'
import { useProposalActions } from '../hooks/useProposalActions'
import { useProposalSelection } from '../hooks/useProposalSelection'
import { useSceneRouteState } from '../hooks/useSceneRouteState'
import { useSceneExecutionQuery } from '../hooks/useSceneExecutionQuery'
import { useSceneWorkspaceActions } from '../hooks/useSceneWorkspaceActions'

interface SceneExecutionContainerProps {
  sceneId: string
}

export function SceneExecutionContainer({ sceneId }: SceneExecutionContainerProps) {
  const execution = useSceneExecutionQuery(sceneId)
  const actions = useProposalActions(sceneId)
  const workspaceActions = useSceneWorkspaceActions({ sceneId })
  const { route, setRoute } = useSceneRouteState()
  const filters = useProposalSelection((state) => state.filters)
  const resetFilters = useProposalSelection((state) => state.resetFilters)

  const selectedBeatId = route.sceneId === sceneId ? route.beatId : undefined
  const selectedProposalId = route.sceneId === sceneId ? route.proposalId : undefined
  const activeFilters = useMemo(
    () => ({
      ...filters,
      beatId: selectedBeatId,
    }),
    [filters, selectedBeatId],
  )

  const filteredProposals = useMemo(() => {
    return execution.proposals.filter((proposal) => {
      if (activeFilters.beatId && proposal.beatId !== activeFilters.beatId) {
        return false
      }
      if (activeFilters.status && proposal.status !== activeFilters.status) {
        return false
      }
      if (activeFilters.kind && proposal.kind !== activeFilters.kind) {
        return false
      }
      if (activeFilters.actorId && proposal.actor.id !== activeFilters.actorId) {
        return false
      }
      if (activeFilters.severity) {
        const severities = proposal.risks?.map((risk) => risk.severity) ?? []
        if (!severities.includes(activeFilters.severity)) {
          return false
        }
      }
      return true
    })
  }, [activeFilters, execution.proposals])

  useEffect(() => {
    if (execution.isLoading) {
      return
    }

    if (filteredProposals.length === 0) {
      if (selectedProposalId !== undefined) {
        setRoute({ sceneId, proposalId: undefined }, { replace: true })
      }
      return
    }

    const currentVisible = filteredProposals.some((proposal) => proposal.id === selectedProposalId)
    if (!currentVisible) {
      setRoute({ sceneId, proposalId: filteredProposals[0]?.id }, { replace: true })
    }
  }, [execution.isLoading, filteredProposals, sceneId, selectedProposalId, setRoute])

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
      selectedBeatId={selectedBeatId}
      selectedProposalId={selectedProposalId}
      filters={activeFilters}
      acceptedSummary={execution.acceptedSummary}
      canContinueRun={execution.canContinueRun}
      canOpenProse={execution.canOpenProse}
      onContinueRun={() => void workspaceActions.continueRun()}
      onOpenPatchPreview={workspaceActions.openPatchPreview}
      onOpenProse={workspaceActions.openProse}
      onSelectBeat={(beatId) => {
        setRoute({ sceneId, beatId, proposalId: undefined })
      }}
      onSelectProposal={(proposalId) => {
        setRoute({ sceneId, proposalId })
      }}
      onAccept={(proposalId) => void actions.accept({ proposalId })}
      onEditAccept={(proposalId, editedSummary) => void actions.editAccept({ proposalId, editedSummary })}
      onRequestRewrite={(proposalId) => void actions.requestRewrite({ proposalId, note: 'Tighten continuity before resubmitting.' })}
      onReject={(proposalId) => void actions.reject({ proposalId, note: 'Rejected during mock review flow.' })}
      onClearFilters={() => {
        resetFilters()
        setRoute({ sceneId, beatId: undefined, proposalId: undefined })
      }}
    />
  )
}

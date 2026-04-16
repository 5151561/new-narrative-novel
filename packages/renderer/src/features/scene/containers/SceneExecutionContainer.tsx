import { useEffect, useMemo } from 'react'

import { useI18n } from '@/app/i18n'
import { EmptyState } from '@/components/ui/EmptyState'

import { SceneExecutionTab } from '../components/SceneExecutionTab'
import { useProposalActions } from '../hooks/useProposalActions'
import { useProposalFilters } from '../hooks/useProposalFilters'
import { useSceneRouteState } from '../hooks/useSceneRouteState'
import { useSceneExecutionQuery } from '../hooks/useSceneExecutionQuery'
import { useSceneWorkspaceActions } from '../hooks/useSceneWorkspaceActions'

interface SceneExecutionContainerProps {
  sceneId: string
}

export function SceneExecutionContainer({ sceneId }: SceneExecutionContainerProps) {
  const { locale } = useI18n()
  const execution = useSceneExecutionQuery(sceneId)
  const actions = useProposalActions(sceneId)
  const workspaceActions = useSceneWorkspaceActions({ sceneId })
  const { route, setRoute } = useSceneRouteState()
  const { filters, setFilters, resetFilters } = useProposalFilters()

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

  const actorOptions = useMemo(() => {
    const seen = new Map<string, string>()

    for (const proposal of execution.proposals) {
      if (!seen.has(proposal.actor.id)) {
        seen.set(proposal.actor.id, proposal.actor.name)
      }
    }

    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }))
  }, [execution.proposals])

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
          title={locale === 'zh-CN' ? '执行数据不可用' : 'Execution data unavailable'}
          message={execution.error.message}
        />
      </div>
    )
  }

  if (execution.isLoading) {
    return (
      <div className="p-5">
        <EmptyState
          title={locale === 'zh-CN' ? '正在加载执行视图' : 'Loading execution'}
          message={
            locale === 'zh-CN'
              ? '正在聚合场景目标、节拍、提案和已采纳摘要。'
              : 'Gathering the scene objective, beats, proposals, and accepted summary.'
          }
        />
      </div>
    )
  }

  return (
    <SceneExecutionTab
      objective={execution.objective}
      beats={execution.beats}
      proposals={filteredProposals}
      actorOptions={actorOptions}
      selectedBeatId={selectedBeatId}
      selectedProposalId={selectedProposalId}
      filters={activeFilters}
      acceptedSummary={execution.acceptedSummary}
      canContinueRun={execution.canContinueRun}
      canOpenProse={execution.canOpenProse}
      onOpenSetup={() => workspaceActions.openTab('setup')}
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
      onRequestRewrite={(proposalId) =>
        void actions.requestRewrite({
          proposalId,
          note: locale === 'zh-CN' ? '请先收紧连续性，再重新提交。' : 'Tighten continuity before resubmitting.',
        })
      }
      onReject={(proposalId) =>
        void actions.reject({
          proposalId,
          note: locale === 'zh-CN' ? '不符合当前场景契约。' : 'Does not fit the current scene contract.',
        })
      }
      onChangeFilters={(next) => {
        setFilters(next)
      }}
      onClearFilters={() => {
        resetFilters()
        setRoute({ sceneId, beatId: undefined, proposalId: undefined })
      }}
    />
  )
}

import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useI18n } from '@/app/i18n'
import type {
  ChapterBacklogPlanningViewModel,
  ChapterBacklogProposalSceneViewModel,
  ChapterStructureWorkspaceViewModel,
} from '../types/chapter-view-models'

interface ChapterBacklogPlannerViewProps {
  workspace: ChapterStructureWorkspaceViewModel
  onSelectScene?: (sceneId: string) => void
  onSavePlanningInput?: (input: { goal: string; constraints: string[] }) => Promise<void> | void
  onGenerateProposal?: () => Promise<void> | void
  onUpdateProposalScene?: (
    proposalId: string,
    proposalSceneId: string,
    input: {
      patch?: Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', string>>
      order?: number
      backlogStatus?: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
    },
  ) => Promise<void> | void
  onAcceptProposal?: (proposalId: string) => Promise<void> | void
  savingPlanning?: boolean
  generatingProposal?: boolean
  updatingProposalSceneId?: string | null
  acceptingProposalId?: string | null
}

function joinConstraints(planning: ChapterBacklogPlanningViewModel) {
  return planning.constraints.map((constraint) => constraint.label).join('\n')
}

function splitConstraints(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function getActiveProposal(workspace: ChapterStructureWorkspaceViewModel) {
  return workspace.planning.proposals.at(-1)
}

export function ChapterBacklogPlannerView({
  workspace,
  onSelectScene,
  onSavePlanningInput,
  onGenerateProposal,
  onUpdateProposalScene,
  onAcceptProposal,
  savingPlanning = false,
  generatingProposal = false,
  updatingProposalSceneId = null,
  acceptingProposalId = null,
}: ChapterBacklogPlannerViewProps) {
  const { locale } = useI18n()
  const [goalDraft, setGoalDraft] = useState(workspace.planning.goal)
  const [constraintsDraft, setConstraintsDraft] = useState(joinConstraints(workspace.planning))
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, {
    summary: string
    purpose: string
    pov: string
    location: string
    conflict: string
    reveal: string
    plannerNotes: string
    order: number
    backlogStatus: ChapterBacklogProposalSceneViewModel['backlogStatus']
  }>>({})

  const activeProposal = workspace.planning.proposals.at(-1)

  useEffect(() => {
    setGoalDraft(workspace.planning.goal)
    setConstraintsDraft(joinConstraints(workspace.planning))
  }, [workspace.planning])

  useEffect(() => {
    if (!activeProposal) {
      setSceneDrafts({})
      return
    }

    setSceneDrafts(
      Object.fromEntries(
        activeProposal.scenes.map((scene) => [
          scene.proposalSceneId,
          {
            summary: scene.summary,
            purpose: scene.purpose,
            pov: scene.pov,
            location: scene.location,
            conflict: scene.conflict,
            reveal: scene.reveal,
            plannerNotes: scene.plannerNotes,
            order: scene.order,
            backlogStatus: scene.backlogStatus,
          },
        ]),
      ),
    )
  }, [activeProposal])

  const planningDirty = useMemo(() => {
    return goalDraft !== workspace.planning.goal || constraintsDraft !== joinConstraints(workspace.planning)
  }, [constraintsDraft, goalDraft, workspace.planning])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <section className="rounded-md border border-line-strong bg-surface-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
              {locale === 'zh-CN' ? '章节规划输入' : 'Chapter planning input'}
            </p>
            <h3 className="mt-1 text-lg text-text-main">{locale === 'zh-CN' ? '本章目标与约束' : 'Chapter goal and constraints'}</h3>
          </div>
          <Badge tone={planningDirty ? 'warn' : 'neutral'}>
            {planningDirty ? (locale === 'zh-CN' ? '待保存' : 'Unsaved') : (locale === 'zh-CN' ? '已同步' : 'Synced')}
          </Badge>
        </div>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-text-main">{locale === 'zh-CN' ? '章节目标' : 'Chapter goal'}</span>
            <textarea
              value={goalDraft}
              onChange={(event) => setGoalDraft(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-text-main">{locale === 'zh-CN' ? '章节约束' : 'Chapter constraints'}</span>
            <textarea
              value={constraintsDraft}
              onChange={(event) => setConstraintsDraft(event.target.value)}
              rows={6}
              placeholder={locale === 'zh-CN' ? '每行一条约束' : 'One constraint per line'}
              className="mt-2 w-full rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={savingPlanning || !planningDirty}
              onClick={() => onSavePlanningInput?.({ goal: goalDraft.trim(), constraints: splitConstraints(constraintsDraft) })}
              className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 text-sm text-text-main disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPlanning
                ? (locale === 'zh-CN' ? '保存中…' : 'Saving...')
                : (locale === 'zh-CN' ? '保存输入' : 'Save input')}
            </button>
            <button
              type="button"
              disabled={generatingProposal}
              onClick={() => onGenerateProposal?.()}
              className="rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm font-medium text-text-main disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingProposal
                ? (locale === 'zh-CN' ? '生成中…' : 'Generating...')
                : (locale === 'zh-CN' ? '生成 backlog 提案' : 'Generate backlog proposal')}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-line-strong bg-surface-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
              {locale === 'zh-CN' ? '主舞台唯一任务' : 'Primary stage task'}
            </p>
            <h3 className="mt-1 text-lg text-text-main">{locale === 'zh-CN' ? '审阅并接受 scene backlog' : 'Review and accept the scene backlog'}</h3>
          </div>
          {activeProposal ? (
            <Badge tone={workspace.planning.acceptedProposalId === activeProposal.proposalId ? 'success' : 'accent'}>
              {workspace.planning.acceptedProposalId === activeProposal.proposalId
                ? (locale === 'zh-CN' ? '已接受' : 'Accepted')
                : (locale === 'zh-CN' ? '待审阅' : 'Reviewable')}
            </Badge>
          ) : null}
        </div>

        {!activeProposal ? (
          <div className="mt-4">
            <EmptyState
              title={locale === 'zh-CN' ? '还没有 backlog 提案' : 'No backlog proposal yet'}
              message={
                locale === 'zh-CN'
                  ? '先保存章节目标与约束，再生成可审阅的 scene backlog 提案。'
                  : 'Save the chapter goal and constraints, then generate a reviewable scene backlog proposal.'
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border border-line-soft bg-surface-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{activeProposal.proposalId}</Badge>
                {workspace.planning.acceptedProposalId === activeProposal.proposalId ? (
                  <Badge tone="success">{locale === 'zh-CN' ? '当前 canonical plan' : 'Current canonical plan'}</Badge>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-text-muted">{activeProposal.goalSnapshot}</p>
              {activeProposal.constraintSnapshot.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-text-muted">
                  {activeProposal.constraintSnapshot.map((constraint) => (
                    <li key={constraint.id}>
                      {[constraint.label, constraint.detail].filter(Boolean).join(': ')}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={acceptingProposalId === activeProposal.proposalId}
                  onClick={() => onAcceptProposal?.(activeProposal.proposalId)}
                  className="rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm font-medium text-text-main disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {acceptingProposalId === activeProposal.proposalId
                    ? (locale === 'zh-CN' ? '接受中…' : 'Accepting...')
                    : (locale === 'zh-CN' ? '接受 scene plan' : 'Accept scene plan')}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeProposal.scenes.map((scene) => {
                const draft = sceneDrafts[scene.proposalSceneId] ?? {
                  summary: scene.summary,
                  purpose: scene.purpose,
                  pov: scene.pov,
                  location: scene.location,
                  conflict: scene.conflict,
                  reveal: scene.reveal,
                  plannerNotes: scene.plannerNotes,
                  order: scene.order,
                  backlogStatus: scene.backlogStatus,
                }
                const selected = workspace.selectedSceneId === scene.sceneId

                return (
                  <div
                    key={scene.proposalSceneId}
                    className={`rounded-md border p-3 ${selected ? 'border-line-strong bg-surface-2' : 'border-line-soft bg-surface-2/70'}`}
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelectScene?.(scene.sceneId)}
                      className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                            {locale === 'zh-CN' ? `提案场景 ${scene.order}` : `Proposal scene ${scene.order}`}
                          </p>
                          <h4 className="mt-1 text-base text-text-main">{scene.title}</h4>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Badge tone={selected ? 'accent' : 'neutral'}>{scene.backlogStatusLabel}</Badge>
                          <Badge tone="neutral">{scene.sceneId}</Badge>
                        </div>
                      </div>
                    </button>

                    <div className="mt-3 grid gap-3 md:grid-cols-[90px_minmax(0,1fr)]">
                      <label className="block">
                        <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                          {locale === 'zh-CN' ? '顺位' : 'Order'}
                        </span>
                        <input
                          type="number"
                          value={draft.order}
                          min={1}
                          onChange={(event) =>
                            setSceneDrafts((current) => ({
                              ...current,
                              [scene.proposalSceneId]: {
                                ...draft,
                                order: Number(event.target.value),
                              },
                            }))}
                          className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                          {locale === 'zh-CN' ? 'backlog 状态' : 'Backlog status'}
                        </span>
                        <select
                          value={draft.backlogStatus}
                          onChange={(event) =>
                            setSceneDrafts((current) => ({
                              ...current,
                              [scene.proposalSceneId]: {
                                ...draft,
                                backlogStatus: event.target.value as ChapterBacklogProposalSceneViewModel['backlogStatus'],
                              },
                            }))}
                          className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                        >
                          {['planned', 'running', 'needs_review', 'drafted', 'revised'].map((status) => (
                            <option key={status} value={status}>
                              {status === scene.backlogStatus ? scene.backlogStatusLabel : status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="mt-3 block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '场景摘要' : 'Scene summary'}
                      </span>
                      <textarea
                        value={draft.summary}
                        rows={3}
                        onChange={(event) =>
                          setSceneDrafts((current) => ({
                            ...current,
                            [scene.proposalSceneId]: {
                              ...draft,
                              summary: event.target.value,
                            },
                          }))}
                        className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                      />
                    </label>

                    <label className="mt-3 block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '视角' : 'POV'}
                      </span>
                      <input
                        value={draft.pov}
                        onChange={(event) =>
                          setSceneDrafts((current) => ({
                            ...current,
                            [scene.proposalSceneId]: {
                              ...draft,
                              pov: event.target.value,
                            },
                          }))}
                        className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                      />
                    </label>

                    <label className="mt-3 block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '地点' : 'Location'}
                      </span>
                      <input
                        value={draft.location}
                        onChange={(event) =>
                          setSceneDrafts((current) => ({
                            ...current,
                            [scene.proposalSceneId]: {
                              ...draft,
                              location: event.target.value,
                            },
                          }))}
                        className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                      />
                    </label>

                    <label className="mt-3 block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '场景目的' : 'Scene purpose'}
                      </span>
                      <textarea
                        value={draft.purpose}
                        rows={2}
                        onChange={(event) =>
                          setSceneDrafts((current) => ({
                            ...current,
                            [scene.proposalSceneId]: {
                              ...draft,
                              purpose: event.target.value,
                            },
                          }))}
                        className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                      />
                    </label>

                    <label className="mt-3 block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '冲突' : 'Conflict'}
                      </span>
                      <textarea
                        value={draft.conflict}
                        rows={2}
                        onChange={(event) =>
                          setSceneDrafts((current) => ({
                            ...current,
                            [scene.proposalSceneId]: {
                              ...draft,
                              conflict: event.target.value,
                            },
                          }))}
                        className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                      />
                    </label>

                    <label className="mt-3 block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '揭示' : 'Reveal'}
                      </span>
                      <textarea
                        value={draft.reveal}
                        rows={2}
                        onChange={(event) =>
                          setSceneDrafts((current) => ({
                            ...current,
                            [scene.proposalSceneId]: {
                              ...draft,
                              reveal: event.target.value,
                            },
                          }))}
                        className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                      />
                    </label>

                    <label className="mt-3 block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? 'Planner 备注' : 'Planner notes'}
                      </span>
                      <textarea
                        value={draft.plannerNotes}
                        rows={2}
                        onChange={(event) =>
                          setSceneDrafts((current) => ({
                            ...current,
                            [scene.proposalSceneId]: {
                              ...draft,
                              plannerNotes: event.target.value,
                            },
                          }))}
                        className="mt-2 w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
                      />
                    </label>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={updatingProposalSceneId === scene.proposalSceneId}
                        onClick={() =>
                          onUpdateProposalScene?.(activeProposal.proposalId, scene.proposalSceneId, {
                            patch: {
                              title: draft.title,
                              summary: draft.summary,
                              purpose: draft.purpose,
                              pov: draft.pov,
                              location: draft.location,
                              conflict: draft.conflict,
                              reveal: draft.reveal,
                              plannerNotes: draft.plannerNotes,
                            },
                            order: draft.order,
                            backlogStatus: draft.backlogStatus,
                          })}
                        className="rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-text-main disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingProposalSceneId === scene.proposalSceneId
                          ? (locale === 'zh-CN' ? '保存中…' : 'Saving...')
                          : (locale === 'zh-CN' ? '保存场景计划' : 'Save scene plan')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

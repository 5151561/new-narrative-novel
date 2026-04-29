import { useCallback, useEffect, useRef, useState } from 'react'

import { getChapterStructureViewLabel, getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { WorkbenchStatusTopBar } from '@/features/workbench/components/WorkbenchStatusTopBar'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type { SceneLens } from '@/features/workbench/types/workbench-route'

import { ChapterBinderPane } from '../components/ChapterBinderPane'
import { ChapterModeRail } from '../components/ChapterModeRail'
import { ChapterRunOrchestrationPanel } from '../components/ChapterRunOrchestrationPanel'
import { ChapterStructureInspectorPane } from '../components/ChapterStructureInspectorPane'
import { ChapterStructureStage } from '../components/ChapterStructureStage'
import type { ChapterSceneStructurePatch } from '../api/chapter-record-mutations'
import { type ChapterWorkbenchMutationEvent } from '../hooks/useChapterWorkbenchActivity'
import { useAcceptChapterBacklogProposalMutation } from '../hooks/useAcceptChapterBacklogProposalMutation'
import { useGenerateChapterBacklogProposalMutation } from '../hooks/useGenerateChapterBacklogProposalMutation'
import { useReorderChapterSceneMutation } from '../hooks/useReorderChapterSceneMutation'
import { useChapterStructureWorkspaceQuery } from '../hooks/useChapterStructureWorkspaceQuery'
import { useStartNextChapterSceneRunMutation } from '../hooks/useStartNextChapterSceneRunMutation'
import { useUpdateChapterBacklogInputMutation } from '../hooks/useUpdateChapterBacklogInputMutation'
import { useUpdateChapterBacklogProposalSceneMutation } from '../hooks/useUpdateChapterBacklogProposalSceneMutation'
import { useUpdateChapterSceneStructureMutation } from '../hooks/useUpdateChapterSceneStructureMutation'
import type { ChapterStructureView } from '../types/chapter-view-models'
import { ChapterDockContainer } from './ChapterDockContainer'

const defaultChapterViews: ChapterStructureView[] = ['backlog', 'sequence', 'outliner', 'assembly']

function getEffectiveChapterView(
  activeView: ChapterStructureView,
  availableViews: ChapterStructureView[],
): ChapterStructureView {
  if (availableViews.includes(activeView)) {
    return activeView
  }

  return availableViews[0] ?? defaultChapterViews[0]
}

function resolveChapterRunGate(
  scenes: Array<{
    id: string
    title: string
    order: number
    summary: string
    backlogStatus: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
    backlogStatusLabel: string
    runStatusLabel: string
  }>,
) {
  const orderedScenes = [...scenes].sort((left, right) => left.order - right.order)
  const blockingScenes: Array<{
    id: string
    title: string
    order: number
    runStatusLabel: string
  }> = []

  for (const scene of orderedScenes) {
    if (scene.backlogStatus === 'running' || scene.backlogStatus === 'needs_review') {
      blockingScenes.push({
        id: scene.id,
        title: scene.title,
        order: scene.order,
        runStatusLabel: scene.runStatusLabel,
      })
      break
    }

    if (scene.backlogStatus === 'planned') {
      return {
        nextScene: scene,
        blockingScenes,
      }
    }
  }

  return {
    nextScene: undefined,
    blockingScenes,
  }
}

function ChapterTopCommandBar({
  chapterTitle,
  view,
}: {
  chapterTitle: string
  view: ChapterStructureView
}) {
  const { locale, dictionary } = useI18n()

  return (
    <WorkbenchStatusTopBar
      title={dictionary.app.chapterWorkbench}
      subtitle={`${chapterTitle} / ${getWorkbenchLensLabel(locale, 'structure')} / ${getChapterStructureViewLabel(locale, view)}`}
    />
  )
}

function ChapterPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

export function ChapterStructureWorkspace() {
  const { route, replaceRoute, patchChapterRoute } = useWorkbenchRouteState()
  const { locale, dictionary } = useI18n()
  const [latestMutation, setLatestMutation] = useState<ChapterWorkbenchMutationEvent | null>(null)
  const mutationSequenceRef = useRef(0)

  if (route.scope !== 'chapter') {
    return null
  }

  const reorderSceneMutation = useReorderChapterSceneMutation({
    chapterId: route.chapterId,
  })
  const updateSceneStructureMutation = useUpdateChapterSceneStructureMutation({
    chapterId: route.chapterId,
  })
  const updateBacklogInputMutation = useUpdateChapterBacklogInputMutation({
    chapterId: route.chapterId,
  })
  const generateBacklogProposalMutation = useGenerateChapterBacklogProposalMutation({
    chapterId: route.chapterId,
  })
  const updateBacklogProposalSceneMutation = useUpdateChapterBacklogProposalSceneMutation({
    chapterId: route.chapterId,
  })
  const acceptBacklogProposalMutation = useAcceptChapterBacklogProposalMutation({
    chapterId: route.chapterId,
  })
  const startNextSceneRunMutation = useStartNextChapterSceneRunMutation({
    chapterId: route.chapterId,
  })

  const { workspace, isLoading, error } = useChapterStructureWorkspaceQuery({
    chapterId: route.chapterId,
    selectedSceneId: route.sceneId ?? null,
  })

  const openSceneFromChapter = useCallback(
    (sceneId: string | undefined, lens: Extract<SceneLens, 'orchestrate' | 'draft'>) => {
      if (!sceneId) {
        return
      }

      if (route.scope === 'chapter' && route.sceneId !== sceneId) {
        patchChapterRoute({ sceneId }, { replace: true })
      }

      replaceRoute({
        scope: 'scene',
        sceneId,
        lens,
        tab: lens === 'draft' ? 'prose' : 'execution',
        beatId: undefined,
        proposalId: undefined,
        modal: undefined,
      })
    },
    [patchChapterRoute, replaceRoute, route],
  )

  const shellModeRail = (
    <ChapterModeRail
      onSelectScope={(scope) => {
        if (scope === 'chapter') {
          return
        }
        if (scope === 'book') {
          replaceRoute({ scope: 'book' })
          return
        }
        if (scope === 'asset') {
          replaceRoute({ scope: 'asset' })
          return
        }
        if (scope === 'scene') {
          openSceneFromChapter(route.sceneId ?? workspace?.scenes[0]?.id, 'orchestrate')
        }
      }}
      activeLens="structure"
      onSelectLens={(lens) => {
        if (lens !== route.lens) {
          patchChapterRoute({ lens })
        }
      }}
    />
  )
  const availableViews = workspace?.viewsMeta?.availableViews ?? defaultChapterViews
  const effectiveView = getEffectiveChapterView(route.view, availableViews)
  const { nextScene, blockingScenes } = workspace
    ? resolveChapterRunGate(workspace.scenes)
    : { nextScene: undefined, blockingScenes: [] }
  const draftedSceneCount = workspace?.scenes.filter((scene) => scene.backlogStatus === 'drafted' || scene.backlogStatus === 'revised').length ?? 0
  const missingDraftCount = workspace ? workspace.scenes.length - draftedSceneCount : 0

  useEffect(() => {
    setLatestMutation(null)
    mutationSequenceRef.current = 0
  }, [route.chapterId])

  const moveSceneWithinChapter = useCallback(
    async (sceneId: string, direction: 'up' | 'down') => {
      if (!workspace) {
        return
      }

      const currentIndex = workspace.scenes.findIndex((scene) => scene.id === sceneId)
      if (currentIndex < 0) {
        return
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= workspace.scenes.length) {
        return
      }

      const nextWorkspace = await reorderSceneMutation.mutateAsync({ sceneId, targetIndex })
      if (nextWorkspace === null) {
        return
      }

      setLatestMutation({
        id: `mutation-${mutationSequenceRef.current++}`,
        chapterId: route.chapterId,
        action: 'moved-scene',
        sceneTitle: workspace.scenes[currentIndex]?.title ?? sceneId,
        direction,
      })
    },
    [reorderSceneMutation, route.chapterId, workspace],
  )

  const saveScenePatch = useCallback(
    async (sceneId: string, patch: ChapterSceneStructurePatch) => {
      if (!workspace) {
        return
      }

      const nextWorkspace = await updateSceneStructureMutation.mutateAsync({ sceneId, locale, patch })
      if (nextWorkspace === null) {
        return
      }

      setLatestMutation({
        id: `mutation-${mutationSequenceRef.current++}`,
        chapterId: route.chapterId,
        action: 'updated-structure',
        sceneTitle: workspace.scenes.find((scene) => scene.id === sceneId)?.title ?? sceneId,
      })
    },
    [locale, route.chapterId, updateSceneStructureMutation, workspace],
  )

  const saveBacklogInput = useCallback(
    async (input: { goal: string; constraints: string[] }) => {
      const nextWorkspace = await updateBacklogInputMutation.mutateAsync({
        locale,
        goal: input.goal,
        constraints: input.constraints,
      })
      if (nextWorkspace === null) {
        return
      }

      setLatestMutation({
        id: `mutation-${mutationSequenceRef.current++}`,
        chapterId: route.chapterId,
        action: 'saved-backlog-input',
        sceneTitle: nextWorkspace.title,
      })
    },
    [locale, route.chapterId, updateBacklogInputMutation],
  )

  const generateBacklogProposal = useCallback(async () => {
    const nextWorkspace = await generateBacklogProposalMutation.mutateAsync()
    if (nextWorkspace === null) {
      return
    }

    setLatestMutation({
      id: `mutation-${mutationSequenceRef.current++}`,
      chapterId: route.chapterId,
      action: 'generated-backlog-proposal',
      sceneTitle: nextWorkspace.title,
    })
  }, [generateBacklogProposalMutation, route.chapterId])

  const updateBacklogProposalScene = useCallback(
    async (
      proposalId: string,
      proposalSceneId: string,
      input: {
        patch?: Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', string>>
        order?: number
        backlogStatus?: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
      },
    ) => {
      const nextWorkspace = await updateBacklogProposalSceneMutation.mutateAsync({
        proposalId,
        proposalSceneId,
        locale,
        ...input,
      })
      if (nextWorkspace === null) {
        return
      }

      const sceneTitle = nextWorkspace.planning.proposals
        .find((proposal) => proposal.proposalId === proposalId)
        ?.scenes.find((scene) => scene.proposalSceneId === proposalSceneId)?.title
        ?? proposalSceneId

      setLatestMutation({
        id: `mutation-${mutationSequenceRef.current++}`,
        chapterId: route.chapterId,
        action: 'updated-backlog-proposal-scene',
        sceneTitle,
      })
    },
    [locale, route.chapterId, updateBacklogProposalSceneMutation],
  )

  const acceptBacklogProposal = useCallback(
    async (proposalId: string) => {
      const nextWorkspace = await acceptBacklogProposalMutation.mutateAsync({ proposalId })
      if (nextWorkspace === null) {
        return
      }

      setLatestMutation({
        id: `mutation-${mutationSequenceRef.current++}`,
        chapterId: route.chapterId,
        action: 'accepted-backlog-proposal',
        sceneTitle: nextWorkspace.title,
      })
    },
    [acceptBacklogProposalMutation, route.chapterId],
  )

  const startNextSceneRun = useCallback(async () => {
    if (!workspace || !nextScene) {
      return
    }

    const record = await startNextSceneRunMutation.mutateAsync({
      locale,
      mode: 'continue',
      note: `Advance ${nextScene.title} from chapter ${workspace.title}.`,
    })
    if (!record) {
      return
    }

    setLatestMutation({
      id: `mutation-${mutationSequenceRef.current++}`,
      chapterId: route.chapterId,
      action: 'started-next-scene-run',
      sceneTitle: record.selectedScene.title[locale],
    })
  }, [locale, nextScene, route.chapterId, startNextSceneRunMutation, workspace])

  useEffect(() => {
    if (error || isLoading || workspace === undefined || workspace === null) {
      return
    }

    if (route.view !== effectiveView) {
      patchChapterRoute({ view: effectiveView }, { replace: true })
    }
  }, [effectiveView, error, isLoading, patchChapterRoute, route.view, workspace])

  if (error) {
    const message = error.message

    return (
      <WorkbenchShell
        topBar={<ChapterTopCommandBar chapterTitle={route.chapterId} view={route.view} />}
        modeRail={shellModeRail}
        navigator={<ChapterPaneState title={locale === 'zh-CN' ? '章节不可用' : 'Chapter unavailable'} message={message} />}
        mainStage={<ChapterPaneState title={locale === 'zh-CN' ? '章节不可用' : 'Chapter unavailable'} message={message} />}
        inspector={<ChapterPaneState title={locale === 'zh-CN' ? '检查器不可用' : 'Inspector unavailable'} message={message} />}
        bottomDock={<ChapterPaneState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={message} />}
      />
    )
  }

  if (isLoading || workspace === undefined) {
    const message =
      locale === 'zh-CN'
        ? '正在准备章节结构工作区、装配视图和检查器摘要。'
        : 'Preparing the chapter structure workspace, assembly view, and inspector summary.'

    return (
      <WorkbenchShell
        topBar={<ChapterTopCommandBar chapterTitle={route.chapterId} view={route.view} />}
        modeRail={shellModeRail}
        navigator={<ChapterPaneState title={dictionary.common.loading} message={message} />}
        mainStage={<ChapterPaneState title={dictionary.common.loading} message={message} />}
        inspector={<ChapterPaneState title={dictionary.common.loading} message={message} />}
        bottomDock={<ChapterPaneState title={locale === 'zh-CN' ? '正在加载底部面板' : 'Loading bottom dock'} message={message} />}
      />
    )
  }

  if (workspace === null) {
    const message =
      locale === 'zh-CN'
        ? `未找到章节 ${route.chapterId}。`
        : `Chapter ${route.chapterId} could not be found.`

    return (
      <WorkbenchShell
        topBar={<ChapterTopCommandBar chapterTitle={route.chapterId} view={route.view} />}
        modeRail={shellModeRail}
        navigator={<ChapterPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
        mainStage={<ChapterPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
        inspector={<ChapterPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
        bottomDock={<ChapterPaneState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={message} />}
      />
    )
  }

  return (
    <WorkbenchShell
      topBar={<ChapterTopCommandBar chapterTitle={workspace.title} view={effectiveView} />}
      modeRail={shellModeRail}
      navigator={
        <ChapterBinderPane
          title={dictionary.app.chapters}
          description={dictionary.app.chapterNavigatorDescription}
          workspace={workspace}
          activeView={effectiveView}
          onSelectScene={(sceneId) => patchChapterRoute({ sceneId })}
          onMoveScene={(sceneId, direction) => void moveSceneWithinChapter(sceneId, direction)}
          movingSceneId={reorderSceneMutation.isPending ? reorderSceneMutation.variables?.sceneId ?? null : null}
          onOpenScene={openSceneFromChapter}
        />
      }
      mainStage={
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <ChapterRunOrchestrationPanel
            title={locale === 'zh-CN' ? '章节编排' : 'Chapter orchestration'}
            description={
              locale === 'zh-CN'
                ? '按 accepted backlog 顺序推进下一场，并在 review 处停下。'
                : 'Advance the next accepted backlog scene in order and stop at review.'
            }
            nextScene={nextScene ? {
              sceneId: nextScene.id,
              title: nextScene.title,
              order: nextScene.order,
              summary: nextScene.summary,
              backlogStatusLabel: nextScene.backlogStatusLabel,
              runStatusLabel: nextScene.runStatusLabel,
            } : undefined}
            waitingReviewScenes={blockingScenes.map((scene) => ({
              sceneId: scene.id,
              title: scene.title,
              order: scene.order,
              backlogStatus: workspace.scenes.find((candidate) => candidate.id === scene.id)?.backlogStatus === 'running' ? 'running' : 'needs_review',
              runStatusLabel: scene.runStatusLabel,
            }))}
            draftedSceneCount={draftedSceneCount}
            missingDraftCount={missingDraftCount}
            isStarting={startNextSceneRunMutation.isPending}
            errorMessage={startNextSceneRunMutation.errorState?.message}
            onStartNextScene={() => {
              void startNextSceneRun()
            }}
          />
          <ChapterStructureStage
            activeView={effectiveView}
            labels={{
              backlog: dictionary.app.backlog,
              sequence: dictionary.app.sequence,
              outliner: dictionary.app.outliner,
              assembly: dictionary.app.assembly,
            }}
            availableViews={availableViews}
            workspace={workspace}
            title={dictionary.app.chapterStructure}
            onViewChange={(view) => patchChapterRoute({ view })}
            onSelectScene={(sceneId) => patchChapterRoute({ sceneId })}
            onSaveScenePatch={(sceneId, patch) => saveScenePatch(sceneId, patch)}
            savingSceneId={updateSceneStructureMutation.isPending ? updateSceneStructureMutation.variables?.sceneId ?? null : null}
            onOpenScene={openSceneFromChapter}
            onSavePlanningInput={saveBacklogInput}
            onGenerateProposal={() => generateBacklogProposal()}
            onUpdateProposalScene={updateBacklogProposalScene}
            onAcceptProposal={acceptBacklogProposal}
            savingPlanning={updateBacklogInputMutation.isPending}
            generatingProposal={generateBacklogProposalMutation.isPending}
            updatingProposalSceneId={
              updateBacklogProposalSceneMutation.isPending
                ? updateBacklogProposalSceneMutation.variables?.proposalSceneId ?? null
                : null
            }
            acceptingProposalId={
              acceptBacklogProposalMutation.isPending
                ? acceptBacklogProposalMutation.variables?.proposalId ?? null
                : null
            }
          />
        </div>
      }
      inspector={
        <ChapterStructureInspectorPane
          chapterTitle={workspace.title}
          chapterSummary={workspace.summary}
          unresolvedCount={workspace.unresolvedCount}
          inspector={workspace.inspector}
          planning={workspace.planning}
          selectedSceneBacklogStatusLabel={
            workspace.scenes.find((scene) => scene.id === workspace.selectedSceneId)?.backlogStatusLabel
          }
        />
      }
      bottomDock={<ChapterDockContainer activeView={effectiveView} workspace={workspace} latestMutation={latestMutation} />}
    />
  )
}

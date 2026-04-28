import { useCallback, useEffect, useState } from 'react'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { WorkbenchStatusTopBar } from '@/features/workbench/components/WorkbenchStatusTopBar'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type { SceneLens } from '@/features/workbench/types/workbench-route'

import { ChapterDraftBinderPane } from '../components/ChapterDraftBinderPane'
import { ChapterDraftInspectorPane } from '../components/ChapterDraftInspectorPane'
import { ChapterDraftReader } from '../components/ChapterDraftReader'
import { ChapterModeRail } from '../components/ChapterModeRail'
import { ChapterRunOrchestrationPanel } from '../components/ChapterRunOrchestrationPanel'
import { useStartNextChapterSceneRunMutation } from '../hooks/useStartNextChapterSceneRunMutation'
import { useChapterDraftWorkspaceQuery } from '../hooks/useChapterDraftWorkspaceQuery'
import { useChapterDraftTraceabilityQuery } from '@/features/traceability/hooks/useChapterDraftTraceabilityQuery'
import { ChapterDraftDockContainer } from './ChapterDraftDockContainer'
import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

function resolveChapterRunGate(
  scenes: Array<{
    sceneId: string
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
    sceneId: string
    title: string
    order: number
    runStatusLabel: string
  }> = []

  for (const scene of orderedScenes) {
    if (scene.backlogStatus === 'running' || scene.backlogStatus === 'needs_review') {
      blockingScenes.push({
        sceneId: scene.sceneId,
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

function mergeTraceabilityIntoWorkspace(
  workspace: ChapterDraftWorkspaceViewModel,
  traceability: ReturnType<typeof useChapterDraftTraceabilityQuery>,
) {
  const scenes = workspace.scenes.map((scene) => {
    const traceSummary = traceability.traceability?.sceneSummariesBySceneId[scene.sceneId] ?? {
      sceneId: scene.sceneId,
      sourceFactCount: 0,
      relatedAssetCount: 0,
      status: 'missing' as const,
    }

    return {
      ...scene,
      traceSummary: {
        sourceFactCount: traceSummary.sourceFactCount,
        relatedAssetCount: traceSummary.relatedAssetCount,
        status: traceSummary.status,
      },
    }
  })
  const sceneById = new Map(scenes.map((scene) => [scene.sceneId, scene]))
  const sections = workspace.sections?.map((section) => {
    if (section.kind !== 'scene') {
      return section
    }

    return {
      kind: 'scene' as const,
      ...(sceneById.get(section.sceneId) ?? section),
    }
  })

  return {
    ...workspace,
    scenes,
    sections,
    selectedScene: scenes.find((scene) => scene.sceneId === workspace.selectedSceneId) ?? workspace.selectedScene,
    inspector: {
      ...workspace.inspector,
      selectedSceneTraceability: traceability.traceability?.selectedSceneTrace ?? null,
      chapterTraceCoverage: traceability.traceability?.chapterCoverage ?? null,
    },
  }
}

function DraftPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

function ChapterDraftTopBar({
  chapterTitle,
  selectedSceneTitle,
  draftedSceneCount,
  missingDraftCount,
  assembledWordCount,
}: {
  chapterTitle: string
  selectedSceneTitle?: string
  draftedSceneCount?: number
  missingDraftCount?: number
  assembledWordCount?: number
}) {
  const { locale, dictionary } = useI18n()

  return (
    <WorkbenchStatusTopBar
      title={dictionary.app.chapterWorkbench}
      subtitle={`${chapterTitle} / ${getWorkbenchLensLabel(locale, 'draft')}${selectedSceneTitle ? ` / ${selectedSceneTitle}` : ''}`}
    >
      {draftedSceneCount !== undefined ? (
        <Badge tone="neutral">{locale === 'zh-CN' ? `已起草 ${draftedSceneCount}` : `Drafted ${draftedSceneCount}`}</Badge>
      ) : null}
      {missingDraftCount !== undefined ? (
        <Badge tone={missingDraftCount > 0 ? 'warn' : 'success'}>
          {locale === 'zh-CN' ? `缺稿 ${missingDraftCount}` : `Missing ${missingDraftCount}`}
        </Badge>
      ) : null}
      {assembledWordCount !== undefined ? (
        <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${assembledWordCount} 词` : `${assembledWordCount} words`}</Badge>
      ) : null}
    </WorkbenchStatusTopBar>
  )
}

export function ChapterDraftWorkspace() {
  const { route, replaceRoute, patchChapterRoute } = useWorkbenchRouteState()
  const { locale } = useI18n()
  const [lastStartedRunSceneId, setLastStartedRunSceneId] = useState<string | null>(null)

  if (route.scope !== 'chapter') {
    return null
  }

  const startNextSceneRunMutation = useStartNextChapterSceneRunMutation({
    chapterId: route.chapterId,
  })

  const { workspace, isLoading, error } = useChapterDraftWorkspaceQuery({
    chapterId: route.chapterId,
    selectedSceneId: route.sceneId ?? null,
  })
  const traceability = useChapterDraftTraceabilityQuery({
    chapterId: route.chapterId,
    selectedSceneId: route.sceneId ?? null,
  })
  const { nextScene, blockingScenes } = workspace
    ? resolveChapterRunGate(workspace.scenes)
    : { nextScene: undefined, blockingScenes: [] }

  const openSceneFromChapter = useCallback(
    (sceneId: string | undefined, lens: Extract<SceneLens, 'orchestrate' | 'draft'>) => {
      if (!sceneId) {
        return
      }

      if (route.sceneId !== sceneId) {
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
    [patchChapterRoute, replaceRoute, route.sceneId],
  )

  useEffect(() => {
    if (isLoading || error || workspace === undefined || workspace === null) {
      return
    }

    if (workspace.selectedSceneId && workspace.selectedSceneId !== route.sceneId) {
      patchChapterRoute({ sceneId: workspace.selectedSceneId }, { replace: true })
    }
  }, [error, isLoading, patchChapterRoute, route.sceneId, workspace])

  const shellModeRail = (
    <ChapterModeRail
      activeLens="draft"
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
          openSceneFromChapter(route.sceneId ?? workspace?.selectedSceneId ?? workspace?.scenes[0]?.sceneId, 'draft')
        }
      }}
      onSelectLens={(lens) => {
        if (lens !== route.lens) {
          patchChapterRoute({ lens })
        }
      }}
    />
  )

  if (error) {
    const message = error.message

    return (
      <WorkbenchShell
        topBar={<ChapterDraftTopBar chapterTitle={route.chapterId} />}
        modeRail={shellModeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '章节不可用' : 'Chapter unavailable'} message={message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '阅读稿不可用' : 'Draft unavailable'} message={message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '检查器不可用' : 'Inspector unavailable'} message={message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={message} />}
      />
    )
  }

  if (isLoading || workspace === undefined) {
    const message =
      locale === 'zh-CN'
        ? '正在按章节顺序装配场景阅读稿，并同步检查器与底部面板摘要。'
        : 'Assembling the chapter reading draft in chapter order and syncing the inspector and dock summary.'

    return (
      <WorkbenchShell
        topBar={<ChapterDraftTopBar chapterTitle={route.chapterId} />}
        modeRail={shellModeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '正在加载导航' : 'Loading navigator'} message={message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '正在加载阅读稿' : 'Loading draft'} message={message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '正在加载检查器' : 'Loading inspector'} message={message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '正在加载底部面板' : 'Loading bottom dock'} message={message} />}
      />
    )
  }

  if (workspace === null) {
    const message = locale === 'zh-CN' ? `未找到章节 ${route.chapterId}。` : `Chapter ${route.chapterId} could not be found.`

    return (
      <WorkbenchShell
        topBar={<ChapterDraftTopBar chapterTitle={route.chapterId} />}
        modeRail={shellModeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={message} />}
      />
    )
  }

  const tracedWorkspace = mergeTraceabilityIntoWorkspace(workspace, traceability)
  const openAssetProfile = (assetId: string) => {
    replaceRoute({
      scope: 'asset',
      assetId,
      lens: 'knowledge',
      view: 'profile',
    })
  }
  const lastStartedRun = lastStartedRunSceneId
    ? tracedWorkspace.scenes.find((scene) => scene.sceneId === lastStartedRunSceneId)
    : null

  return (
    <WorkbenchShell
      topBar={
        <ChapterDraftTopBar
          chapterTitle={tracedWorkspace.title}
          selectedSceneTitle={tracedWorkspace.selectedScene?.title}
          draftedSceneCount={tracedWorkspace.draftedSceneCount}
          missingDraftCount={tracedWorkspace.missingDraftCount}
          assembledWordCount={tracedWorkspace.assembledWordCount}
        />
      }
      modeRail={shellModeRail}
      navigator={
        <ChapterDraftBinderPane
          workspace={tracedWorkspace}
          onSelectScene={(sceneId) => patchChapterRoute({ sceneId })}
          onOpenScene={openSceneFromChapter}
        />
      }
      mainStage={
        <ChapterDraftReader
          workspace={tracedWorkspace}
          runOrchestrationPanel={
            <ChapterRunOrchestrationPanel
              title={locale === 'zh-CN' ? '章节编排' : 'Chapter orchestration'}
              description={
                locale === 'zh-CN'
                  ? '继续按 accepted backlog 顺序推进下一场，并在 review 处停下。'
                  : 'Keep advancing the accepted backlog one scene at a time and stop at review.'
              }
              nextScene={nextScene ? {
                sceneId: nextScene.sceneId,
                title: nextScene.title,
                order: nextScene.order,
                summary: nextScene.summary,
                backlogStatusLabel: nextScene.backlogStatusLabel,
                runStatusLabel: nextScene.runStatusLabel,
              } : undefined}
              waitingReviewScenes={blockingScenes.map((scene) => ({
                ...scene,
                backlogStatus: tracedWorkspace.scenes.find((candidate) => candidate.sceneId === scene.sceneId)?.backlogStatus === 'running'
                  ? 'running'
                  : 'needs_review',
              }))}
              draftedSceneCount={tracedWorkspace.draftedSceneCount}
              missingDraftCount={tracedWorkspace.missingDraftCount}
              isStarting={startNextSceneRunMutation.isPending}
              errorMessage={startNextSceneRunMutation.errorState?.message}
              onStartNextScene={() => {
                if (!nextScene) {
                  return
                }

                void startNextSceneRunMutation
                  .mutateAsync({
                    locale,
                    mode: 'continue',
                    note: `Advance ${nextScene.title} from chapter ${tracedWorkspace.title}.`,
                  })
                  .then(async (record) => {
                    if (!record) {
                      return
                    }

                    setLastStartedRunSceneId(record.selectedScene.sceneId)
                    await traceability.refetch?.()
                  })
              }}
            />
          }
          onSelectScene={(sceneId) => patchChapterRoute({ sceneId })}
          onOpenScene={openSceneFromChapter}
        />
      }
      inspector={
        <ChapterDraftInspectorPane
          chapterTitle={tracedWorkspace.title}
          chapterSummary={tracedWorkspace.summary}
          inspector={tracedWorkspace.inspector}
          selectedSceneTraceabilityLoading={traceability.selectedSceneTraceLoading}
          chapterCoverageLoading={traceability.chapterCoverageLoading}
          traceabilityError={traceability.error}
          onOpenAsset={openAssetProfile}
        />
      }
      bottomDock={<ChapterDraftDockContainer workspace={tracedWorkspace} lastStartedRun={lastStartedRun ? {
        sceneId: lastStartedRun.sceneId,
        title: lastStartedRun.title,
      } : null} />}
    />
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getChapterStructureViewLabel,
  getLocaleName,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type { SceneLens } from '@/features/workbench/types/workbench-route'

import { ChapterBinderPane } from '../components/ChapterBinderPane'
import { ChapterModeRail } from '../components/ChapterModeRail'
import { ChapterStructureInspectorPane } from '../components/ChapterStructureInspectorPane'
import { ChapterStructureStage } from '../components/ChapterStructureStage'
import type { ChapterSceneStructurePatch } from '../api/chapter-record-mutations'
import { type ChapterWorkbenchMutationEvent } from '../hooks/useChapterWorkbenchActivity'
import { useReorderChapterSceneMutation } from '../hooks/useReorderChapterSceneMutation'
import { useChapterStructureWorkspaceQuery } from '../hooks/useChapterStructureWorkspaceQuery'
import { useUpdateChapterSceneStructureMutation } from '../hooks/useUpdateChapterSceneStructureMutation'
import type { ChapterStructureView, ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'
import { ChapterDockContainer } from './ChapterDockContainer'

const defaultChapterViews: ChapterStructureView[] = ['sequence', 'outliner', 'assembly']

function getEffectiveChapterView(
  activeView: ChapterStructureView,
  availableViews: ChapterStructureView[],
): ChapterStructureView {
  if (availableViews.includes(activeView)) {
    return activeView
  }

  return availableViews[0] ?? defaultChapterViews[0]
}

function LanguageToggle() {
  const { locale, setLocale, dictionary } = useI18n()

  return (
    <div className="flex items-center gap-1 rounded-md border border-line-soft bg-surface-2 p-1">
      <span className="px-2 text-[11px] uppercase tracking-[0.05em] text-text-soft">{dictionary.common.language}</span>
      {(['en', 'zh-CN'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            locale === value ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
          }`}
        >
          {getLocaleName(locale, value)}
        </button>
      ))}
    </div>
  )
}

function ChapterTopCommandBar({
  activeView,
  workspace,
}: {
  activeView: ChapterStructureView
  workspace?: ChapterStructureWorkspaceViewModel | null
}) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{dictionary.app.chapterWorkbench}</h1>
          <Badge tone="neutral">{dictionary.common.chapter}</Badge>
          <Badge tone="accent">{getChapterStructureViewLabel(locale, activeView)}</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {workspace?.title ?? dictionary.common.chapter} / {dictionary.app.chapterStructure} / {getChapterStructureViewLabel(locale, activeView)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        <Badge tone="neutral">{dictionary.app.chapterStructure}</Badge>
        <Badge tone="neutral">{getChapterStructureViewLabel(locale, activeView)}</Badge>
      </div>
    </div>
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
        topBar={<ChapterTopCommandBar activeView={route.view} workspace={null} />}
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
        topBar={<ChapterTopCommandBar activeView={route.view} workspace={workspace} />}
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
        topBar={<ChapterTopCommandBar activeView={route.view} workspace={workspace} />}
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
      topBar={<ChapterTopCommandBar activeView={effectiveView} workspace={workspace} />}
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
        <ChapterStructureStage
          activeView={effectiveView}
          labels={{
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
        />
      }
      inspector={
        <ChapterStructureInspectorPane
          chapterTitle={workspace.title}
          chapterSummary={workspace.summary}
          unresolvedCount={workspace.unresolvedCount}
          inspector={workspace.inspector}
        />
      }
      bottomDock={<ChapterDockContainer activeView={effectiveView} workspace={workspace} latestMutation={latestMutation} />}
    />
  )
}

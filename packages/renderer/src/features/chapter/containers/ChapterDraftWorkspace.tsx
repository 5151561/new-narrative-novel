import { useCallback, useEffect } from 'react'

import { getLocaleName, getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type { SceneLens } from '@/features/workbench/types/workbench-route'

import { ChapterDraftBinderPane } from '../components/ChapterDraftBinderPane'
import { ChapterDraftInspectorPane } from '../components/ChapterDraftInspectorPane'
import { ChapterDraftReader } from '../components/ChapterDraftReader'
import { ChapterModeRail } from '../components/ChapterModeRail'
import { useChapterDraftWorkspaceQuery } from '../hooks/useChapterDraftWorkspaceQuery'
import { useChapterDraftTraceabilityQuery } from '@/features/traceability/hooks/useChapterDraftTraceabilityQuery'
import { ChapterDraftDockContainer } from './ChapterDraftDockContainer'
import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

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

  return {
    ...workspace,
    scenes,
    selectedScene: scenes.find((scene) => scene.sceneId === workspace.selectedSceneId) ?? workspace.selectedScene,
    inspector: {
      ...workspace.inspector,
      selectedSceneTraceability: traceability.traceability?.selectedSceneTrace ?? null,
      chapterTraceCoverage: traceability.traceability?.chapterCoverage ?? null,
    },
  }
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
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{dictionary.app.chapterWorkbench}</h1>
          <Badge tone="neutral">{dictionary.common.chapter}</Badge>
          <Badge tone="accent">{getWorkbenchLensLabel(locale, 'draft')}</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {chapterTitle} / {getWorkbenchLensLabel(locale, 'draft')}
          {selectedSceneTitle ? ` / ${selectedSceneTitle}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
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
      </div>
    </div>
  )
}

export function ChapterDraftWorkspace() {
  const { route, replaceRoute, patchChapterRoute } = useWorkbenchRouteState()
  const { locale } = useI18n()

  if (route.scope !== 'chapter') {
    return null
  }

  const { workspace, isLoading, error } = useChapterDraftWorkspaceQuery({
    chapterId: route.chapterId,
    selectedSceneId: route.sceneId ?? null,
  })
  const traceability = useChapterDraftTraceabilityQuery({
    chapterId: route.chapterId,
    selectedSceneId: route.sceneId ?? null,
  })

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
        if (scope === 'asset') {
          replaceRoute({ scope: 'asset' })
          return
        }
        openSceneFromChapter(route.sceneId ?? workspace?.selectedSceneId ?? workspace?.scenes[0]?.sceneId, 'draft')
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
      bottomDock={<ChapterDraftDockContainer workspace={tracedWorkspace} />}
    />
  )
}

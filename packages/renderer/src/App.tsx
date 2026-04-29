import { useCallback } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'

import { signalArcFixtureSeed } from '@narrative-novel/fixture-seed'

import {
  getSceneRunStatusLabel,
  getSceneStatusLabel,
  getSceneTabLabel,
  getWorkbenchLensLabel,
  useI18n,
} from '@/app/i18n'
import { useProjectRuntime } from '@/app/project-runtime'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { AssetWorkbench } from '@/features/asset/containers/AssetWorkbench'
import { readLocalizedChapterText } from '@/features/chapter/api/chapter-records'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'
import { ChapterWorkbench } from '@/features/chapter/containers/ChapterWorkbench'
import { BookWorkbench } from '@/features/book/containers/BookWorkbench'
import { SceneDockContainer } from '@/features/scene/containers/SceneDockContainer'
import { SceneInspectorContainer } from '@/features/scene/containers/SceneInspectorContainer'
import { SceneRunSessionProvider } from '@/features/scene/containers/scene-run-session-context'
import { SceneWorkspace } from '@/features/scene/containers/SceneWorkspace'
import { useSceneExecutionQuery } from '@/features/scene/hooks/useSceneExecutionQuery'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import { useSceneWorkspaceQuery } from '@/features/scene/hooks/useSceneWorkspaceQuery'
import type { SceneTab, SceneWorkspaceViewModel } from '@/features/scene/types/scene-view-models'
import { LocaleToggle } from '@/features/workbench/components/LocaleToggle'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { WorkbenchEditorProvider } from '@/features/workbench/editor/WorkbenchEditorProvider'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import { useProjectFirstObjectIds } from '@/features/workbench/hooks/useProjectFirstObjectIds'
import type {
  SceneRouteState,
  SceneLens,
  WorkbenchScope,
} from '@/features/workbench/types/workbench-route'

interface SceneNavigatorCard {
  sceneId: string
  title: string
  chapterTitle: string
  statusLabel: string
  statusTone: 'accent' | 'success' | 'warn' | 'neutral'
  detail: string
  disabled?: boolean
}

function statusTone(status: SceneWorkspaceViewModel['status']): SceneNavigatorCard['statusTone'] {
  if (status === 'ready' || status === 'committed') {
    return 'success'
  }
  if (status === 'review') {
    return 'accent'
  }
  if (status === 'running') {
    return 'warn'
  }
  return 'neutral'
}

function getCanonicalSeedChapterId(sceneId: string) {
  return signalArcFixtureSeed.chapters.find((chapter) => chapter.canonicalSceneIds.includes(sceneId))?.chapterId ?? null
}

function getCanonicalSeedSceneIdSetForChapter(chapterId: string) {
  const chapterSeed = signalArcFixtureSeed.chapters.find((chapter) => chapter.chapterId === chapterId)
  return chapterSeed ? new Set<string>(chapterSeed.canonicalSceneIds) : null
}

function isUnavailableNavigatorSceneError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status === 404
  )
}

function SceneTopCommandBar({
  activeScene,
  lens,
  tab,
}: {
  activeScene?: SceneWorkspaceViewModel
  lens: SceneLens
  tab: SceneTab
}) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-end gap-2">
      <div className="sr-only">
        <h1>{dictionary.app.sceneCockpit}</h1>
        <p>
          {activeScene?.chapterTitle ?? dictionary.common.chapter} / {activeScene?.title ?? dictionary.common.activeScene} /{' '}
          {getWorkbenchLensLabel(locale, lens)} / {getSceneTabLabel(locale, tab)}
        </p>
      </div>
      <LocaleToggle />
      {activeScene ? (
        <>
          <Badge tone={statusTone(activeScene.status)}>{getSceneStatusLabel(locale, activeScene.status)}</Badge>
          <Badge tone={activeScene.runStatus === 'paused' ? 'warn' : 'neutral'}>
            {getSceneRunStatusLabel(locale, activeScene.runStatus)}
          </Badge>
          {activeScene.currentVersionLabel ? <Badge tone="neutral">{activeScene.currentVersionLabel}</Badge> : null}
        </>
      ) : null}
    </div>
  )
}

function ModeRail({
  activeScope,
  activeLens,
  onSelectScope,
  onSelectLens,
}: {
  activeScope: WorkbenchScope
  activeLens: SceneLens
  onSelectScope: (scope: WorkbenchScope) => void
  onSelectLens: (lens: SceneLens, tab: SceneTab) => void
}) {
  const { locale, dictionary } = useI18n()
  const sceneLensItems: Array<{
    lens: SceneLens
    label: string
    tab: SceneTab
    detail?: string
  }> =
    activeScope === 'scene'
      ? [
          {
            lens: 'structure',
            label: getWorkbenchLensLabel(locale, 'structure'),
            tab: 'setup',
            detail: dictionary.app.modeRailDetails.structure,
          },
          {
            lens: 'orchestrate',
            label: getWorkbenchLensLabel(locale, 'orchestrate'),
            tab: 'execution',
            detail: dictionary.app.modeRailDetails.orchestrate,
          },
          {
            lens: 'draft',
            label: getWorkbenchLensLabel(locale, 'draft'),
            tab: 'prose',
            detail: dictionary.app.modeRailDetails.draft,
          },
        ]
      : [
          {
            lens: 'structure',
            label: dictionary.app.chapterStructure,
            tab: 'execution',
          },
        ]

  return (
    <div className="flex h-full flex-col gap-2 px-2 py-3">
      <div className="rounded-md border border-line-soft bg-surface-1 p-2">
        <p className="text-center text-[10px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.scope}</p>
        <div className="mt-2 grid gap-2">
          {([
            { scope: 'scene' as const, label: dictionary.common.scene },
            { scope: 'chapter' as const, label: dictionary.common.chapter },
            { scope: 'asset' as const, label: dictionary.common.asset },
            { scope: 'book' as const, label: dictionary.common.book },
          ]).map((item) => (
            <button
              key={item.scope}
              type="button"
              aria-pressed={activeScope === item.scope}
              onClick={() => onSelectScope(item.scope)}
              className={`rounded-md border px-2 py-2 text-sm ${
                activeScope === item.scope
                  ? 'border-line-strong bg-surface-1 text-text-main'
                  : 'border-transparent text-text-muted hover:border-line-soft hover:bg-surface-2'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {sceneLensItems.map((item) => (
        <button
          key={item.lens}
          type="button"
          aria-pressed={activeLens === item.lens}
          onClick={() => onSelectLens(item.lens, item.tab)}
          title={item.detail}
          className={`rounded-md border px-2 py-3 text-left ${
            activeLens === item.lens
              ? 'border-line-strong bg-surface-1 text-text-main'
              : 'border-transparent text-text-muted hover:border-line-soft hover:bg-surface-1'
          }`}
        >
          <span className="block text-sm font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

function NavigatorPane({
  items,
  activeSceneId,
  onSelectScene,
  onCreateScene,
  isRealProject,
}: {
  items: SceneNavigatorCard[]
  activeSceneId: string
  onSelectScene: (sceneId: string) => void
  onCreateScene?: () => void
  isRealProject?: boolean
}) {
  const { locale, dictionary } = useI18n()

  return (
    <>
      <PaneHeader title={dictionary.app.scenes} />
      <div className="grid gap-2 p-3">
        {items.length === 0 && isRealProject ? (
          <div className="rounded-md border border-line-soft bg-surface-2/80 px-4 py-6 text-center">
            <p className="text-sm text-text-muted">{dictionary.app.noScenesYet ?? 'No scenes yet'}</p>
            {onCreateScene ? (
              <button
                type="button"
                onClick={onCreateScene}
                className="mt-3 rounded-md border border-line-strong bg-surface-1 px-4 py-2 text-sm font-medium text-text-main hover:bg-surface-2"
              >
                {locale === 'zh-CN' ? '创建第一个场景' : 'Create First Scene'}
              </button>
            ) : null}
          </div>
        ) : null}
        {items.map((item) => {
          const active = item.sceneId === activeSceneId

          return (
            <button
              key={item.sceneId}
              type="button"
              disabled={item.disabled}
              onClick={() => onSelectScene(item.sceneId)}
              className={`rounded-md border px-3 py-3 text-left transition ${
                active
                  ? 'border-line-strong bg-surface-1 shadow-sm'
                  : item.disabled
                    ? 'border-line-soft bg-surface-2/60 text-text-muted opacity-75'
                    : 'border-line-soft bg-surface-2/80 hover:bg-surface-1'
              }`}
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.08em] text-text-soft">{item.chapterTitle}</p>
                  <p className="break-words text-sm font-medium text-text-main">{item.title}</p>
                </div>
                <Badge tone={item.statusTone} className="max-w-full whitespace-normal break-words text-left">
                  {item.statusLabel}
                </Badge>
              </div>
              <p className="mt-2 break-words text-sm leading-6 text-text-muted">{item.detail}</p>
            </button>
          )
        })}
      </div>
      <div className="border-t border-line-soft px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.queue}</p>
        <p className="mt-2 text-sm leading-6 text-text-muted">{dictionary.app.queueDescription}</p>
      </div>
    </>
  )
}

function SceneWorkbench({
  route,
  replaceRoute,
  patchSceneRoute,
}: {
  route: SceneRouteState
  replaceRoute: ReturnType<typeof useWorkbenchRouteState>['replaceRoute']
  patchSceneRoute: ReturnType<typeof useWorkbenchRouteState>['patchSceneRoute']
}) {
  const { locale, dictionary } = useI18n()
  const runtime = useProjectRuntime()
  const sceneId = route.sceneId
  const activeSceneQuery = useSceneWorkspaceQuery(sceneId)
  const sceneExecutionQuery = useSceneExecutionQuery(sceneId)
  const preservesStorybookNavigatorRichness = Boolean(runtime.persistence)
  const navigatorChapterId = activeSceneQuery.scene?.chapterId ?? getCanonicalSeedChapterId(sceneId)
  const navigatorChapterQuery = useQuery({
    queryKey: navigatorChapterId ? chapterQueryKeys.workspace(navigatorChapterId) : [...chapterQueryKeys.all, 'workspace', 'scene-navigator', sceneId],
    queryFn: () => runtime.chapterClient.getChapterStructureWorkspace({ chapterId: navigatorChapterId! }),
    enabled: Boolean(navigatorChapterId),
  })
  const navigatorChapterRecord = navigatorChapterQuery.data
  const canonicalNavigatorSceneIdSet = navigatorChapterId ? getCanonicalSeedSceneIdSetForChapter(navigatorChapterId) : null
  const navigatorChapterScenes =
    navigatorChapterRecord?.scenes.filter((scene) => canonicalNavigatorSceneIdSet?.has(scene.id) ?? true) ?? []
  const navigatorSceneIds = navigatorChapterScenes.map((scene) => scene.id)
  const navigatorQueries = useQueries({
    queries: navigatorSceneIds.map((navigatorSceneId) => ({
      queryKey: sceneQueryKeys.workspace(navigatorSceneId, locale),
      queryFn: () => runtime.sceneClient.getSceneWorkspace(navigatorSceneId),
    })),
  })
  const fallbackNavigatorItems: SceneNavigatorCard[] =
    navigatorChapterScenes.map((scene) => ({
      sceneId: scene.id,
      title: readLocalizedChapterText(scene.title, locale),
      chapterTitle: readLocalizedChapterText(navigatorChapterRecord.title, locale),
      statusLabel: dictionary.common.loading,
      statusTone: 'neutral',
      detail: readLocalizedChapterText(scene.summary, locale),
    })) ?? []
  const navigatorItems = navigatorQueries.map((query, index) => {
    const fallback = fallbackNavigatorItems[index]

    if (query.data) {
      return {
          sceneId: query.data.id,
          title: query.data.title,
          chapterTitle: query.data.chapterTitle,
          statusLabel: query.data.currentVersionLabel ?? getSceneStatusLabel(locale, query.data.status),
          statusTone: statusTone(query.data.status),
          detail: query.data.objective,
        }
    }

    if (!fallback) {
      return undefined
    }

    if (!preservesStorybookNavigatorRichness && isUnavailableNavigatorSceneError(query.error)) {
      return {
        ...fallback,
        statusLabel: dictionary.common.unavailable,
        detail: query.error.message,
        disabled: true,
      }
    }

    return fallback
  }).filter((item): item is SceneNavigatorCard => item !== undefined)
  const activeScene = activeSceneQuery.scene ?? navigatorQueries.find((query) => query.data?.id === sceneId)?.data

  const realChapterId = navigatorChapterId ?? getCanonicalSeedChapterId(sceneId)
  const isRealProjectForNavigator = runtime.info?.projectMode === 'real-project'

  const handleCreateScene = useCallback(async () => {
    if (!realChapterId || !isRealProjectForNavigator) {
      return
    }
    try {
      const updatedChapter = await runtime.chapterClient.createScene({ chapterId: realChapterId, title: undefined, summary: undefined })
      if (updatedChapter && updatedChapter.scenes.length > 0) {
        const newSceneId = updatedChapter.scenes[updatedChapter.scenes.length - 1]?.id
        if (newSceneId) {
          patchSceneRoute({
            sceneId: newSceneId,
            beatId: undefined,
            proposalId: undefined,
            modal: undefined,
          })
        }
      }
      navigatorChapterQuery.refetch()
    } catch {
      // silently handle; the UI will show the error via react-query state
    }
  }, [realChapterId, isRealProjectForNavigator, runtime.chapterClient, patchSceneRoute, navigatorChapterQuery])

  return (
    <SceneRunSessionProvider
      sceneId={sceneId}
      runId={sceneExecutionQuery.runId}
      latestRunId={activeSceneQuery.scene?.latestRunId ?? null}
    >
      <WorkbenchShell
        topBar={<SceneTopCommandBar activeScene={activeScene} lens={route.lens} tab={route.tab} />}
        modeRail={
          <ModeRail
            activeScope="scene"
            activeLens={route.lens}
            onSelectScope={(scope) => {
              if (scope === 'scene') {
                return
              }
              replaceRoute({ scope })
            }}
            onSelectLens={(lens, tab) => {
              patchSceneRoute({
                lens,
                tab,
                beatId: undefined,
                proposalId: undefined,
                modal: undefined,
              })
            }}
          />
        }
        navigator={
          <NavigatorPane
            items={navigatorItems}
            activeSceneId={sceneId}
            onSelectScene={(nextSceneId) => {
              patchSceneRoute({
                sceneId: nextSceneId,
                beatId: undefined,
                proposalId: undefined,
                modal: undefined,
              })
            }}
            onCreateScene={
              isRealProjectForNavigator && navigatorItems.length === 0
                ? handleCreateScene
                : undefined
            }
            isRealProject={isRealProjectForNavigator}
          />
        }
        mainStage={<SceneWorkspace sceneId={sceneId} defaultTab="execution" />}
        inspector={<SceneInspectorContainer sceneId={sceneId} />}
        bottomDock={<SceneDockContainer sceneId={sceneId} />}
      />
    </SceneRunSessionProvider>
  )
}

export default function App() {
  const { bookId, chapterId, sceneId } = useProjectFirstObjectIds()
  const { route, replaceRoute, patchSceneRoute } = useWorkbenchRouteState({
    sceneId,
    chapterId,
    bookId,
  })

  return (
    <WorkbenchEditorProvider route={route} replaceRoute={replaceRoute}>
      {route.scope === 'scene' ? (
        <SceneWorkbench route={route} replaceRoute={replaceRoute} patchSceneRoute={patchSceneRoute} />
      ) : route.scope === 'asset' ? (
        <AssetWorkbench />
      ) : route.scope === 'book' ? (
        <BookWorkbench />
      ) : (
        <ChapterWorkbench />
      )}
    </WorkbenchEditorProvider>
  )
}

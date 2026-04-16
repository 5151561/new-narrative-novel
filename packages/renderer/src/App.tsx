import { useQueries, useQuery } from '@tanstack/react-query'

import {
  getChapterStructureViewLabel,
  getLocaleName,
  getSceneRunStatusLabel,
  getSceneStatusLabel,
  getSceneTabLabel,
  getWorkbenchLensLabel,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { ChapterBinderPlaceholder } from '@/features/chapter/components/ChapterBinderPlaceholder'
import {
  ChapterStructureInspectorPlaceholder,
  ChapterStructureWorkspace,
  useChapterStructureWorkspaceModel,
} from '@/features/chapter/containers/ChapterStructureWorkspace'
import { sceneClient } from '@/features/scene/api/scene-client'
import { SceneDockContainer } from '@/features/scene/containers/SceneDockContainer'
import { SceneInspectorContainer } from '@/features/scene/containers/SceneInspectorContainer'
import { SceneWorkspace } from '@/features/scene/containers/SceneWorkspace'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import { useSceneWorkspaceQuery } from '@/features/scene/hooks/useSceneWorkspaceQuery'
import type { SceneTab, SceneWorkspaceViewModel } from '@/features/scene/types/scene-view-models'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type {
  ChapterRouteState,
  SceneRouteState,
  WorkbenchLens,
  WorkbenchScope,
} from '@/features/workbench/types/workbench-route'

const sceneNavigatorIds = ['scene-midnight-platform', 'scene-warehouse-bridge'] as const

interface SceneNavigatorCard {
  sceneId: string
  title: string
  chapterTitle: string
  statusLabel: string
  statusTone: 'accent' | 'success' | 'warn' | 'neutral'
  detail: string
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

function SceneTopCommandBar({
  activeScene,
  lens,
  tab,
}: {
  activeScene?: SceneWorkspaceViewModel
  lens: WorkbenchLens
  tab: SceneTab
}) {
  const { locale, dictionary } = useI18n()
  const runtimeInfo = useQuery({
    queryKey: sceneQueryKeys.runtimeInfo(locale),
    queryFn: () => sceneClient.getRuntimeInfo(),
  })
  const runtimeBadge = runtimeInfo.data ?? {
    source: 'mock-fallback' as const,
    label: dictionary.common.previewData,
  }

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{dictionary.app.sceneCockpit}</h1>
          <Badge tone="neutral">{dictionary.common.scene}</Badge>
          {activeScene ? <Badge tone={statusTone(activeScene.status)}>{getSceneStatusLabel(locale, activeScene.status)}</Badge> : null}
          {activeScene ? (
            <Badge tone={activeScene.runStatus === 'paused' ? 'warn' : 'neutral'}>
              {getSceneRunStatusLabel(locale, activeScene.runStatus)}
            </Badge>
          ) : null}
          {activeScene?.currentVersionLabel ? <Badge tone="neutral">{activeScene.currentVersionLabel}</Badge> : null}
        </div>
        <p className="text-sm text-text-muted">
          {activeScene?.chapterTitle ?? dictionary.common.chapter} / {activeScene?.title ?? dictionary.common.activeScene} /{' '}
          {getWorkbenchLensLabel(locale, lens)} / {getSceneTabLabel(locale, tab)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        <Badge tone="neutral">{getWorkbenchLensLabel(locale, lens)}</Badge>
        <Badge tone="neutral">{getSceneTabLabel(locale, tab)}</Badge>
        <Badge tone={runtimeBadge.source === 'preload-bridge' ? 'success' : 'accent'}>{runtimeBadge.label}</Badge>
      </div>
    </div>
  )
}

function ChapterTopCommandBar({ route }: { route: ChapterRouteState }) {
  const { locale, dictionary } = useI18n()
  const model = useChapterStructureWorkspaceModel(route)

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{dictionary.app.chapterWorkbench}</h1>
          <Badge tone="neutral">{dictionary.common.chapter}</Badge>
          <Badge tone="accent">{getChapterStructureViewLabel(locale, route.view)}</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {model.title} / {dictionary.app.chapterStructure} / {getChapterStructureViewLabel(locale, route.view)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        <Badge tone="neutral">{dictionary.app.chapterStructure}</Badge>
        <Badge tone="neutral">{getChapterStructureViewLabel(locale, route.view)}</Badge>
      </div>
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
  activeLens: WorkbenchLens
  onSelectScope: (scope: WorkbenchScope) => void
  onSelectLens: (lens: WorkbenchLens, tab: SceneTab) => void
}) {
  const { locale, dictionary } = useI18n()
  const sceneLensItems: Array<{
    lens: WorkbenchLens
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
          className={`rounded-md border px-2 py-3 text-left ${
            activeLens === item.lens
              ? 'border-line-strong bg-surface-1 text-text-main'
              : 'border-transparent text-text-muted hover:border-line-soft hover:bg-surface-1'
          }`}
        >
          <span className="block text-sm font-medium">{item.label}</span>
          {item.detail ? <span className="mt-1 block text-[11px] leading-4 text-text-soft">{item.detail}</span> : null}
        </button>
      ))}
    </div>
  )
}

function NavigatorPane({
  items,
  activeSceneId,
  onSelectScene,
}: {
  items: SceneNavigatorCard[]
  activeSceneId: string
  onSelectScene: (sceneId: string) => void
}) {
  const { dictionary } = useI18n()

  return (
    <>
      <PaneHeader title={dictionary.app.scenes} description={dictionary.app.sceneNavigatorDescription} />
      <div className="grid gap-2 p-3">
        {items.map((item) => {
          const active = item.sceneId === activeSceneId

          return (
            <button
              key={item.sceneId}
              type="button"
              onClick={() => onSelectScene(item.sceneId)}
              className={`rounded-md border px-3 py-3 text-left transition ${
                active
                  ? 'border-line-strong bg-surface-1 shadow-sm'
                  : 'border-line-soft bg-surface-2/80 hover:bg-surface-1'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.08em] text-text-soft">{item.chapterTitle}</p>
                  <p className="truncate text-sm font-medium text-text-main">{item.title}</p>
                </div>
                <Badge tone={item.statusTone}>{item.statusLabel}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-text-muted">{item.detail}</p>
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
  const sceneId = route.sceneId
  const activeSceneQuery = useSceneWorkspaceQuery(sceneId)
  const navigatorQueries = useQueries({
    queries: sceneNavigatorIds.map((navigatorSceneId) => ({
      queryKey: sceneQueryKeys.workspace(navigatorSceneId, locale),
      queryFn: () => sceneClient.getSceneWorkspace(navigatorSceneId),
    })),
  })
  const fallbackNavigatorItems: SceneNavigatorCard[] = [
    {
      sceneId: 'scene-midnight-platform',
      title: locale === 'zh-CN' ? '午夜站台' : 'Midnight Platform',
      chapterTitle: dictionary.app.activeChapter,
      statusLabel: dictionary.common.loading,
      statusTone: 'neutral',
      detail: dictionary.app.loadingSceneWorkspace,
    },
    {
      sceneId: 'scene-warehouse-bridge',
      title: locale === 'zh-CN' ? '仓桥交接' : 'Warehouse Bridge',
      chapterTitle: dictionary.app.activeChapter,
      statusLabel: dictionary.common.loading,
      statusTone: 'neutral',
      detail: dictionary.app.loadingSceneWorkspace,
    },
  ]
  const navigatorItems = navigatorQueries.map((query, index) => {
    const fallback = fallbackNavigatorItems[index]

    return query.data
      ? {
          sceneId: query.data.id,
          title: query.data.title,
          chapterTitle: query.data.chapterTitle,
          statusLabel: query.data.currentVersionLabel ?? getSceneStatusLabel(locale, query.data.status),
          statusTone: statusTone(query.data.status),
          detail: query.data.objective,
        }
      : fallback
  })
  const activeScene = activeSceneQuery.scene ?? navigatorQueries.find((query) => query.data?.id === sceneId)?.data

  return (
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
            replaceRoute({ scope: 'chapter' })
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
        />
      }
      mainStage={<SceneWorkspace sceneId={sceneId} defaultTab="execution" />}
      inspector={<SceneInspectorContainer sceneId={sceneId} />}
      bottomDock={<SceneDockContainer sceneId={sceneId} />}
    />
  )
}

function ChapterWorkbench({
  route,
  replaceRoute,
  patchChapterRoute,
}: {
  route: ChapterRouteState
  replaceRoute: ReturnType<typeof useWorkbenchRouteState>['replaceRoute']
  patchChapterRoute: ReturnType<typeof useWorkbenchRouteState>['patchChapterRoute']
}) {
  const { dictionary } = useI18n()
  const model = useChapterStructureWorkspaceModel(route)

  return (
    <WorkbenchShell
      topBar={<ChapterTopCommandBar route={route} />}
      modeRail={
        <ModeRail
          activeScope="chapter"
          activeLens="structure"
          onSelectScope={(scope) => {
            if (scope === 'chapter') {
              return
            }
            replaceRoute({ scope: 'scene' })
          }}
          onSelectLens={() => {}}
        />
      }
      navigator={
        <ChapterBinderPlaceholder
          title={dictionary.app.chapters}
          description={dictionary.app.chapterNavigatorDescription}
          model={model}
          onSelectScene={(sceneId) => patchChapterRoute({ sceneId })}
        />
      }
      mainStage={<ChapterStructureWorkspace route={route} onViewChange={(view) => patchChapterRoute({ view })} />}
      inspector={<ChapterStructureInspectorPlaceholder route={route} />}
    />
  )
}

export default function App() {
  const { route, replaceRoute, patchSceneRoute, patchChapterRoute } = useWorkbenchRouteState()

  return route.scope === 'scene' ? (
    <SceneWorkbench route={route} replaceRoute={replaceRoute} patchSceneRoute={patchSceneRoute} />
  ) : (
    <ChapterWorkbench route={route} replaceRoute={replaceRoute} patchChapterRoute={patchChapterRoute} />
  )
}

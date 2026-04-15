import { useQueries, useQuery } from '@tanstack/react-query'

import {
  getLocaleName,
  getSceneLensLabel,
  getSceneRunStatusLabel,
  getSceneStatusLabel,
  getSceneTabLabel,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { sceneClient } from '@/features/scene/api/scene-client'
import { SceneDockContainer } from '@/features/scene/containers/SceneDockContainer'
import { SceneInspectorContainer } from '@/features/scene/containers/SceneInspectorContainer'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import { type SceneLens, useSceneRouteState } from '@/features/scene/hooks/useSceneRouteState'
import { useSceneWorkspaceQuery } from '@/features/scene/hooks/useSceneWorkspaceQuery'
import type { SceneWorkspaceViewModel } from '@/features/scene/types/scene-view-models'
import type { SceneTab } from '@/features/scene/types/scene-view-models'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { SceneWorkspace } from '@/features/scene/containers/SceneWorkspace'

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

function TopCommandBar({
  activeScene,
  lens,
  tab,
}: {
  activeScene?: SceneWorkspaceViewModel
  lens: SceneLens
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
          {getSceneLensLabel(locale, lens)} / {getSceneTabLabel(locale, tab)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        <Badge tone="neutral">{getSceneLensLabel(locale, lens)}</Badge>
        <Badge tone="neutral">{getSceneTabLabel(locale, tab)}</Badge>
        <Badge tone={runtimeBadge.source === 'preload-bridge' ? 'success' : 'accent'}>{runtimeBadge.label}</Badge>
      </div>
    </div>
  )
}

function ModeRail({
  activeLens,
  onSelectLens,
}: {
  activeLens: SceneLens
  onSelectLens: (lens: SceneLens, tab: SceneTab) => void
}) {
  const { locale, dictionary } = useI18n()
  const sceneLensItems: Array<{
    lens: SceneLens
    label: string
    tab: SceneTab
    detail: string
  }> = [
    {
      lens: 'structure',
      label: getSceneLensLabel(locale, 'structure'),
      tab: 'setup',
      detail: dictionary.app.modeRailDetails.structure,
    },
    {
      lens: 'orchestrate',
      label: getSceneLensLabel(locale, 'orchestrate'),
      tab: 'execution',
      detail: dictionary.app.modeRailDetails.orchestrate,
    },
    {
      lens: 'draft',
      label: getSceneLensLabel(locale, 'draft'),
      tab: 'prose',
      detail: dictionary.app.modeRailDetails.draft,
    },
  ]

  return (
    <div className="flex h-full flex-col gap-2 px-2 py-3">
      <div className="rounded-md border border-line-soft bg-surface-1 px-2 py-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.scope}</p>
        <p className="mt-1 text-sm font-medium text-text-main">{dictionary.common.scene}</p>
      </div>
      {sceneLensItems.map((item) => (
        <button
          key={item.lens}
          type="button"
          onClick={() => onSelectLens(item.lens, item.tab)}
          className={`rounded-md border px-2 py-3 text-left ${
            activeLens === item.lens
              ? 'border-line-strong bg-surface-1 text-text-main'
              : 'border-transparent text-text-muted hover:border-line-soft hover:bg-surface-1'
          }`}
        >
          <span className="block text-sm font-medium">{item.label}</span>
          <span className="mt-1 block text-[11px] leading-4 text-text-soft">{item.detail}</span>
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

export default function App() {
  const { locale, dictionary } = useI18n()
  const { route, setRoute } = useSceneRouteState()
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
  const activeScene =
    activeSceneQuery.scene ??
    navigatorQueries.find((query) => query.data?.id === sceneId)?.data

  return (
    <WorkbenchShell
      topBar={<TopCommandBar activeScene={activeScene} lens={route.lens} tab={route.tab} />}
      modeRail={
        <ModeRail
          activeLens={route.lens}
          onSelectLens={(lens, tab) => {
            setRoute({
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
            setRoute({
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

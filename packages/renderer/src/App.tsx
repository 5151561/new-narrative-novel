import { useQueries, useQuery } from '@tanstack/react-query'

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

function buildNavigatorCard(scene: SceneWorkspaceViewModel): SceneNavigatorCard {
  return {
    sceneId: scene.id,
    title: scene.title,
    chapterTitle: scene.chapterTitle,
    statusLabel: scene.currentVersionLabel ?? scene.status,
    statusTone: statusTone(scene.status),
    detail: scene.objective,
  }
}

const fallbackNavigatorItems: SceneNavigatorCard[] = [
  {
    sceneId: 'scene-midnight-platform',
    title: 'Midnight Platform',
    chapterTitle: 'Active chapter',
    statusLabel: 'Loading',
    statusTone: 'neutral',
    detail: 'Loading scene workspace.',
  },
  {
    sceneId: 'scene-warehouse-bridge',
    title: 'Warehouse Bridge',
    chapterTitle: 'Active chapter',
    statusLabel: 'Loading',
    statusTone: 'neutral',
    detail: 'Loading scene workspace.',
  },
]

const sceneLensItems: Array<{
  lens: SceneLens
  label: string
  tab: SceneTab
  detail: string
}> = [
  { lens: 'structure', label: 'Structure', tab: 'setup', detail: 'Objective, cast, and guardrails.' },
  { lens: 'orchestrate', label: 'Orchestrate', tab: 'execution', detail: 'Beats, proposals, and accepted state.' },
  { lens: 'draft', label: 'Draft', tab: 'prose', detail: 'Scene prose and revision passes.' },
]

function formatLensLabel(lens: SceneLens) {
  return lens.charAt(0).toUpperCase() + lens.slice(1)
}

function formatTabLabel(tab: SceneTab) {
  return tab.charAt(0).toUpperCase() + tab.slice(1)
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
  const runtimeInfo = useQuery({
    queryKey: sceneQueryKeys.runtimeInfo(),
    queryFn: () => sceneClient.getRuntimeInfo(),
  })
  const runtimeBadge = runtimeInfo.data ?? {
    source: 'mock-fallback' as const,
    label: 'Preview Data',
  }

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">Narrative workbench</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">Scene cockpit</h1>
          <Badge tone="neutral">Scene</Badge>
          {activeScene ? <Badge tone={statusTone(activeScene.status)}>{activeScene.status}</Badge> : null}
          {activeScene ? (
            <Badge tone={activeScene.runStatus === 'paused' ? 'warn' : 'neutral'}>{activeScene.runStatus}</Badge>
          ) : null}
          {activeScene?.currentVersionLabel ? <Badge tone="neutral">{activeScene.currentVersionLabel}</Badge> : null}
        </div>
        <p className="text-sm text-text-muted">
          {activeScene?.chapterTitle ?? 'Chapter'} / {activeScene?.title ?? 'Active scene'} / {formatLensLabel(lens)} / {formatTabLabel(tab)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{formatLensLabel(lens)}</Badge>
        <Badge tone="neutral">{formatTabLabel(tab)}</Badge>
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
  return (
    <div className="flex h-full flex-col gap-2 px-2 py-3">
      <div className="rounded-md border border-line-soft bg-surface-1 px-2 py-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.08em] text-text-soft">Scope</p>
        <p className="mt-1 text-sm font-medium text-text-main">Scene</p>
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
  return (
    <>
      <PaneHeader title="Scenes" description="Keep scene selection close and let the run stay central." />
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
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">Queue</p>
        <p className="mt-2 text-sm leading-6 text-text-muted">Accepted state, versions, and dock telemetry stay live while the current scene keeps moving.</p>
      </div>
    </>
  )
}

export default function App() {
  const { route, setRoute } = useSceneRouteState()
  const sceneId = route.sceneId
  const activeSceneQuery = useSceneWorkspaceQuery(sceneId)
  const navigatorQueries = useQueries({
    queries: sceneNavigatorIds.map((navigatorSceneId) => ({
      queryKey: sceneQueryKeys.workspace(navigatorSceneId),
      queryFn: () => sceneClient.getSceneWorkspace(navigatorSceneId),
    })),
  })
  const navigatorItems = navigatorQueries.map((query, index) => {
    const fallback = fallbackNavigatorItems[index]

    return query.data ? buildNavigatorCard(query.data) : fallback
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

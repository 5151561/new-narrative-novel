import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { TimelineList } from '@/components/ui/TimelineList'
import { SceneDockContainer } from '@/features/scene/containers/SceneDockContainer'
import { SceneInspectorContainer } from '@/features/scene/containers/SceneInspectorContainer'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { SceneWorkspace } from '@/features/scene/containers/SceneWorkspace'

function TopCommandBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.08em] text-text-soft">Narrative Novel</p>
        <h2 className="text-xl leading-tight">Scene Scope Workbench</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Mock Runtime</Badge>
        <button type="button" className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm">
          Search
        </button>
        <button type="button" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white">
          New Scene
        </button>
      </div>
    </div>
  )
}

function ModeRail() {
  const items = ['Book', 'Chapter', 'Scene', 'Prose']
  return (
    <div className="flex h-full flex-col items-center gap-3 px-3 py-4">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`w-full rounded-md px-2 py-3 text-sm ${item === 'Scene' ? 'bg-surface-2 font-medium text-text-main shadow-ringwarm' : 'text-text-muted hover:bg-surface-2'}`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function NavigatorPane() {
  return (
    <>
      <PaneHeader title="Navigator" description="Scene selection stays lightweight in batch 1." />
      <TimelineList
        items={[
          {
            id: 'scene-midnight-platform',
            title: 'Midnight Platform',
            detail: 'Execution review active with three pending proposals.',
            meta: 'Scene',
            tone: 'accent',
          },
          {
            id: 'scene-warehouse-bridge',
            title: 'Warehouse Bridge',
            detail: 'Setup draft only.',
            meta: 'Draft',
            tone: 'neutral',
          },
        ]}
      />
    </>
  )
}

export default function App() {
  const sceneId = 'scene-midnight-platform'

  return (
    <WorkbenchShell
      topBar={<TopCommandBar />}
      modeRail={<ModeRail />}
      navigator={<NavigatorPane />}
      mainStage={<SceneWorkspace sceneId={sceneId} defaultTab="execution" />}
      inspector={<SceneInspectorContainer sceneId={sceneId} />}
      bottomDock={<SceneDockContainer sceneId={sceneId} />}
    />
  )
}

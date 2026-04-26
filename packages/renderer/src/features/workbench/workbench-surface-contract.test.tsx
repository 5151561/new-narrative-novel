import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProjectRuntime } from '@/app/project-runtime/project-runtime-test-utils'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import type { WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

const LAYOUT_KEYS = [
  'bottomDockHeight',
  'bottomDockMaximized',
  'bottomDockVisible',
  'inspectorVisible',
  'inspectorWidth',
  'navigatorVisible',
  'navigatorWidth',
]

const SURFACES: Array<{
  scope: WorkbenchRouteState['scope']
  route: WorkbenchRouteState
  label: string
}> = [
  {
    scope: 'scene',
    route: {
      scope: 'scene',
      sceneId: 'scene-midnight-platform',
      lens: 'orchestrate',
      tab: 'execution',
      proposalId: 'proposal-2',
    },
    label: 'Scene orchestration payload',
  },
  {
    scope: 'chapter',
    route: {
      scope: 'chapter',
      chapterId: 'chapter-signals-in-rain',
      lens: 'structure',
      view: 'sequence',
      sceneId: 'scene-midnight-platform',
    },
    label: 'Chapter structure payload',
  },
  {
    scope: 'asset',
    route: {
      scope: 'asset',
      assetId: 'asset-ren-voss',
      lens: 'knowledge',
      view: 'mentions',
    },
    label: 'Asset knowledge payload',
  },
  {
    scope: 'book',
    route: {
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'review',
      selectedChapterId: 'chapter-open-water-signals',
    },
    label: 'Book draft payload',
  },
]

function routeIdentity(route: WorkbenchRouteState) {
  if (route.scope === 'scene') {
    return route.sceneId
  }

  if (route.scope === 'chapter') {
    return route.chapterId
  }

  if (route.scope === 'asset') {
    return route.assetId
  }

  return route.bookId
}

function renderSurfaceContract(
  surface: (typeof SURFACES)[number],
  layoutStorageKey = `workbench-surface-contract:${surface.scope}`,
) {
  return renderWithProjectRuntime(
    <WorkbenchShell
      layoutStorageKey={layoutStorageKey}
      topBar={
        <div data-testid={`${surface.scope}-top-bar`} data-route-scope={surface.route.scope}>
          {surface.label}
        </div>
      }
      modeRail={
        <nav data-testid={`${surface.scope}-mode-rail`} aria-label={`${surface.scope} scope lens`}>
          {surface.route.lens}
        </nav>
      }
      navigator={
        <div data-testid={`${surface.scope}-navigator-payload`} data-route-id={routeIdentity(surface.route)}>
          Object navigation
        </div>
      }
      mainStage={
        <section data-testid={`${surface.scope}-primary-task`} data-route-scope={surface.route.scope}>
          Primary work surface
        </section>
      }
      inspector={
        <aside data-testid={`${surface.scope}-inspector-payload`}>
          Supporting judgment
        </aside>
      }
      bottomDock={
        <section data-testid={`${surface.scope}-dock-payload`}>
          Problems and activity support
        </section>
      }
    />,
  )
}

describe('workbench surface contract', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate')
  })

  it.each(SURFACES)('hosts $scope content inside the same shell-owned regions', (surface) => {
    renderSurfaceContract(surface)

    expect(screen.getByTestId('workbench-shell')).toBeInTheDocument()
    expect(screen.getByTestId('workbench-top-bar')).toContainElement(
      screen.getByTestId(`${surface.scope}-top-bar`),
    )
    expect(screen.getByTestId('workbench-mode-rail')).toContainElement(
      screen.getByTestId(`${surface.scope}-mode-rail`),
    )
    expect(screen.getByTestId('workbench-navigator')).toContainElement(
      screen.getByTestId(`${surface.scope}-navigator-payload`),
    )
    expect(screen.getByTestId('workbench-main-stage')).toContainElement(
      screen.getByTestId(`${surface.scope}-primary-task`),
    )
    expect(screen.getByTestId('workbench-inspector')).toContainElement(
      screen.getByTestId(`${surface.scope}-inspector-payload`),
    )
    expect(screen.getByTestId('workbench-bottom-dock')).toContainElement(
      screen.getByTestId(`${surface.scope}-dock-payload`),
    )
  })

  it('persists layout preference without route identity when scope payloads are mounted', async () => {
    const user = userEvent.setup()
    const surface = SURFACES[0]
    const layoutStorageKey = 'workbench-surface-contract:layout-boundary'
    renderSurfaceContract(surface, layoutStorageKey)

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))

    const storedLayout = window.localStorage.getItem(layoutStorageKey)
    expect(storedLayout).not.toBeNull()
    expect(JSON.parse(storedLayout ?? '{}')).toEqual(
      expect.objectContaining({
        navigatorVisible: false,
      }),
    )
    expect(Object.keys(JSON.parse(storedLayout ?? '{}')).sort()).toEqual(LAYOUT_KEYS)
    expect(storedLayout).not.toContain(surface.route.scope)
    expect(storedLayout).not.toContain(routeIdentity(surface.route))
    expect(storedLayout).not.toContain(surface.route.lens)
  })
})

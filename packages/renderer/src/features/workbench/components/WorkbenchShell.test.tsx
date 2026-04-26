import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProjectRuntime } from '@/app/project-runtime/project-runtime-test-utils'
import { WorkbenchEditorProvider } from '@/features/workbench/editor/WorkbenchEditorProvider'
import {
  DEFAULT_WORKBENCH_LAYOUT_STATE,
  WORKBENCH_LAYOUT_BOUNDS,
  getWorkbenchBodyGridColumns,
} from '@/features/workbench/types/workbench-layout'
import type { WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

import { WorkbenchShell } from './WorkbenchShell'

const TEST_STORAGE_KEY = 'workbench-shell-layout-test'
const TEST_EDITOR_STORAGE_KEY = 'workbench-shell-editor-test'
const TEST_ROUTE: WorkbenchRouteState = {
  scope: 'scene',
  sceneId: 'scene-midnight-platform',
  lens: 'orchestrate',
  tab: 'execution',
}

function renderWorkbenchShell(
  props: Partial<Parameters<typeof WorkbenchShell>[0]> = {},
  storageKey = TEST_STORAGE_KEY,
) {
  return renderWithProjectRuntime(
    <WorkbenchShell
      topBar={<div>Shell Top Bar</div>}
      modeRail={<nav aria-label="Mode Rail">Mode Rail</nav>}
      navigator={<div>Navigator Content</div>}
      mainStage={<div>Main Stage Content</div>}
      inspector={<div>Inspector Content</div>}
      bottomDock={<div>Bottom Dock Content</div>}
      layoutStorageKey={storageKey}
      {...props}
    />,
  )
}

function renderWorkbenchShellWithEditor(
  props: Partial<Parameters<typeof WorkbenchShell>[0]> = {},
  storageKey = TEST_STORAGE_KEY,
) {
  return renderWithProjectRuntime(
    <WorkbenchEditorProvider route={TEST_ROUTE} replaceRoute={() => {}} storageKey={TEST_EDITOR_STORAGE_KEY}>
      <WorkbenchShell
        topBar={<div>Shell Top Bar</div>}
        modeRail={<nav aria-label="Mode Rail">Mode Rail</nav>}
        navigator={<div>Navigator Content</div>}
        mainStage={<div>Main Stage Content</div>}
        inspector={<div>Inspector Content</div>}
        bottomDock={<div>Bottom Dock Content</div>}
        layoutStorageKey={storageKey}
        {...props}
      />
    </WorkbenchEditorProvider>,
  )
}

function shellRoot() {
  return screen.getByTestId('workbench-shell')
}

function shellBody() {
  return screen.getByTestId('workbench-body')
}

function bodyColumns() {
  return shellBody().style.gridTemplateColumns
}

function bodyColumnTracks() {
  return bodyColumns().split(' ')
}

function expectBodyUsesNoGridGap() {
  expect(shellBody()).not.toHaveClass('gap-3')
  expect(shellBody()).not.toHaveClass('gap-x-3')
}

describe('WorkbenchShell', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/workbench?scope=scene&tab=execution')
  })

  it('renders the default workbench regions', () => {
    renderWorkbenchShell()

    expect(screen.getByRole('navigation', { name: 'Mode Rail' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Navigator' })).toHaveAttribute(
      'data-testid',
      'workbench-navigator',
    )
    expect(screen.getByTestId('workbench-main-stage')).toHaveTextContent('Main Stage Content')
    expect(screen.getByRole('region', { name: 'Inspector' })).toHaveAttribute(
      'data-testid',
      'workbench-inspector',
    )
    expect(screen.getByRole('region', { name: 'Bottom Dock' })).toHaveAttribute(
      'data-testid',
      'workbench-bottom-dock',
    )
    expect(screen.getByRole('separator', { name: 'Resize Navigator' })).toHaveAttribute(
      'aria-valuenow',
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.navigatorWidth}`,
    )
    expect(screen.getByRole('separator', { name: 'Resize Inspector' })).toHaveAttribute(
      'aria-valuenow',
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.inspectorWidth}`,
    )
    expect(screen.getByRole('separator', { name: 'Resize Bottom Dock' })).toHaveAttribute(
      'aria-valuenow',
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.bottomDockHeight}`,
    )
  })

  it('renders editor tabs above the main content when an editor provider is present', async () => {
    renderWorkbenchShellWithEditor()

    const tablist = await screen.findByRole('tablist', { name: 'Open Editors' })
    const mainContent = screen.getByText('Main Stage Content')

    expect(screen.getByRole('tab', { name: /Scene.*Orchestrate.*scene-midnight-platform/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(tablist.compareDocumentPosition(mainContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the legacy main stage without editor tabs when no editor provider is present', () => {
    renderWorkbenchShell()

    const mainStage = screen.getByTestId('workbench-main-stage')
    const mainStageBody = screen.getByTestId('workbench-main-stage-scroll-body')
    const mainContent = screen.getByText('Main Stage Content')

    expect(mainStage).toHaveTextContent('Main Stage Content')
    expect(mainStage).toHaveClass('min-h-0', 'flex-1', 'flex-col', 'overflow-hidden')
    expect(mainStageBody).toHaveClass('min-h-0', 'min-w-0', 'flex-1', 'overflow-auto')
    expect(mainContent.parentElement).toBe(mainStageBody)
    expect(screen.queryByRole('tablist', { name: 'Open Editors' })).not.toBeInTheDocument()
  })

  it('gives shell surfaces explicit internal scroll regions', () => {
    renderWorkbenchShell()

    expect(screen.getByTestId('workbench-mode-rail-scroll-body')).toHaveClass('overflow-auto')
    expect(screen.getByTestId('workbench-navigator-scroll-body')).toHaveClass('overflow-auto')
    expect(screen.getByTestId('workbench-main-stage-scroll-body')).toHaveClass('overflow-auto')
    expect(screen.getByTestId('workbench-inspector-scroll-body')).toHaveClass('overflow-auto')
    expect(screen.getByTestId('workbench-bottom-dock-body')).toHaveClass('overflow-hidden')
  })

  it('keeps long bottom dock content bounded in the shell-owned dock region', () => {
    const longRows = Array.from({ length: 80 }, (_, index) => (
      <div key={index}>Dock row {index + 1}</div>
    ))

    renderWorkbenchShell({
      navigator: <div>{Array.from({ length: 60 }, (_, index) => <div key={index}>Navigator row {index + 1}</div>)}</div>,
      mainStage: <div>{Array.from({ length: 120 }, (_, index) => <div key={index}>Main row {index + 1}</div>)}</div>,
      inspector: <div>{Array.from({ length: 60 }, (_, index) => <div key={index}>Inspector row {index + 1}</div>)}</div>,
      bottomDock: <div>{longRows}</div>,
    })

    const bottomDock = screen.getByRole('region', { name: 'Bottom Dock' })
    const bottomDockBody = screen.getByTestId('workbench-bottom-dock-body')

    expect(bottomDock).toHaveAttribute('data-testid', 'workbench-bottom-dock')
    expect(bottomDock).toHaveClass('h-full', 'min-h-0')
    expect(bottomDockBody).toHaveClass('min-h-0', 'min-w-0', 'flex-1', 'overflow-hidden')
    expect(bottomDockBody.parentElement).toBe(bottomDock)
    expect(shellRoot()).toHaveClass('h-screen', 'min-h-0', 'overflow-hidden')
    expect(shellRoot().style.gridTemplateRows).toContain(
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.bottomDockHeight}px`,
    )
    expect(screen.getByText('Dock row 80')).toBeInTheDocument()
  })

  it('keeps main stage and editor tabs accessible when the navigator is hidden', async () => {
    const user = userEvent.setup()
    renderWorkbenchShellWithEditor()

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))

    expect(screen.queryByRole('region', { name: 'Navigator' })).not.toBeInTheDocument()
    expect(screen.getByTestId('workbench-main-stage')).toHaveTextContent('Main Stage Content')
    expect(await screen.findByRole('tablist', { name: 'Open Editors' })).toBeInTheDocument()
  })

  it('keeps editor tabs accessible when the bottom dock is maximized', async () => {
    const user = userEvent.setup()
    renderWorkbenchShellWithEditor()

    await user.click(screen.getByRole('button', { name: 'Maximize Bottom Dock' }))

    expect(screen.getByRole('button', { name: 'Restore Bottom Dock' })).toBeInTheDocument()
    expect(await screen.findByRole('tablist', { name: 'Open Editors' })).toBeInTheDocument()
  })

  it('toggle Navigator removes the navigator region', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))

    expect(screen.queryByRole('region', { name: 'Navigator' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('workbench-navigator')).not.toBeInTheDocument()
  })

  it('toggle Inspector removes the inspector region', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    await user.click(screen.getByRole('button', { name: 'Toggle Inspector' }))

    expect(screen.queryByRole('region', { name: 'Inspector' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('workbench-inspector')).not.toBeInTheDocument()
  })

  it('toggle Bottom Dock removes the bottom dock region', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    await user.click(screen.getByRole('button', { name: 'Toggle Bottom Dock' }))

    expect(screen.queryByRole('region', { name: 'Bottom Dock' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('workbench-bottom-dock')).not.toBeInTheDocument()
  })

  it('reset restores hidden parts and default grid sizes', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Inspector' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Bottom Dock' }))
    await user.click(screen.getByRole('button', { name: 'Reset Workbench Layout' }))

    expect(screen.getByRole('region', { name: 'Navigator' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Inspector' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Bottom Dock' })).toBeInTheDocument()
    expect(shellBody().style.gridTemplateColumns).toContain(
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.navigatorWidth}px`,
    )
    expect(shellBody().style.gridTemplateColumns).toContain(
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.inspectorWidth}px`,
    )
    expect(shellRoot().style.gridTemplateRows).toContain(
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.bottomDockHeight}px`,
    )
  })

  it('keyboard resize on the navigator sash changes grid columns', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    screen.getByRole('separator', { name: 'Resize Navigator' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(shellBody().style.gridTemplateColumns).toContain(
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.navigatorWidth + 16}px`,
    )
  })

  it('keyboard resize on the inspector sash changes grid columns with inverted direction', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    screen.getByRole('separator', { name: 'Resize Inspector' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(shellBody().style.gridTemplateColumns).toContain(
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.inspectorWidth - 16}px`,
    )
  })

  it('keyboard resize on the bottom dock sash changes rows with inverted direction', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    screen.getByRole('separator', { name: 'Resize Bottom Dock' }).focus()
    await user.keyboard('{ArrowUp}')

    expect(shellRoot().style.gridTemplateRows).toContain(
      `${DEFAULT_WORKBENCH_LAYOUT_STATE.bottomDockHeight + 16}px`,
    )
  })

  it('bottom dock maximize changes rows and exposes the restore action', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    await user.click(screen.getByRole('button', { name: 'Maximize Bottom Dock' }))

    expect(shellRoot().style.gridTemplateRows).toContain(
      `${WORKBENCH_LAYOUT_BOUNDS.bottomDock.maximizedSize}px`,
    )
    expect(screen.getByRole('button', { name: 'Restore Bottom Dock' })).toBeInTheDocument()
  })

  it('remount restores persisted localStorage layout', async () => {
    const user = userEvent.setup()
    const firstRender = renderWorkbenchShell()

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))
    firstRender.unmount()
    renderWorkbenchShell()

    expect(screen.queryByRole('region', { name: 'Navigator' })).not.toBeInTheDocument()
    expect(bodyColumns()).toBe(
      getWorkbenchBodyGridColumns({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        navigatorVisible: false,
      }),
    )
    expect(bodyColumnTracks()).toContain('0px')
    expectBodyUsesNoGridGap()
    expect(shellBody().children).toHaveLength(3)
  })

  it('hidden side panes use helper zero-width tracks without grid gap gutters', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Inspector' }))

    expect(bodyColumns()).toBe(
      getWorkbenchBodyGridColumns({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        navigatorVisible: false,
        inspectorVisible: false,
      }),
    )
    expect(bodyColumnTracks()).toContain('0px')
    expectBodyUsesNoGridGap()
    expect(shellBody().children).toHaveLength(2)
    expect(screen.getByTestId('workbench-main-stage').parentElement).toHaveStyle({
      gridColumn: '3',
    })
  })

  it('missing side panes use helper zero-width tracks without grid gap gutters', () => {
    renderWorkbenchShell({ navigator: undefined, inspector: undefined })

    expect(bodyColumns()).toBe(
      getWorkbenchBodyGridColumns({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        navigatorVisible: false,
        inspectorVisible: false,
      }),
    )
    expect(bodyColumnTracks()).toContain('0px')
    expectBodyUsesNoGridGap()
    expect(shellBody().children).toHaveLength(2)
    expect(screen.queryByRole('separator', { name: 'Resize Navigator' })).not.toBeInTheDocument()
    expect(screen.queryByRole('separator', { name: 'Resize Inspector' })).not.toBeInTheDocument()
  })

  it('hidden panes cannot be found by role or test id', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))

    expect(screen.queryByRole('region', { name: 'Navigator' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('workbench-navigator')).not.toBeInTheDocument()
    expect(screen.queryByText('Navigator Content')).not.toBeInTheDocument()
  })

  it('layout actions do not change window.location.search', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell()
    const initialSearch = window.location.search

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Inspector' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Bottom Dock' }))
    await user.click(screen.getByRole('button', { name: 'Reset Workbench Layout' }))
    screen.getByRole('separator', { name: 'Resize Navigator' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(window.location.search).toBe(initialSearch)
  })

  it('missing optional panes stay absent when their controls are toggled', async () => {
    const user = userEvent.setup()
    renderWorkbenchShell({ navigator: undefined, inspector: undefined, bottomDock: undefined })

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Inspector' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Bottom Dock' }))

    expect(screen.queryByRole('region', { name: 'Navigator' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Inspector' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bottom Dock' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle Navigator' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Toggle Inspector' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Toggle Bottom Dock' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('null and false optional panes are treated as absent', () => {
    renderWorkbenchShell({ navigator: null, inspector: false, bottomDock: null })

    expect(screen.queryByRole('region', { name: 'Navigator' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Inspector' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bottom Dock' })).not.toBeInTheDocument()
    expect(screen.queryByRole('separator', { name: 'Resize Navigator' })).not.toBeInTheDocument()
    expect(screen.queryByRole('separator', { name: 'Resize Inspector' })).not.toBeInTheDocument()
    expect(screen.queryByRole('separator', { name: 'Resize Bottom Dock' })).not.toBeInTheDocument()
    expect(bodyColumns()).toBe(
      getWorkbenchBodyGridColumns({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        navigatorVisible: false,
        inspectorVisible: false,
      }),
    )
    expectBodyUsesNoGridGap()
  })
})

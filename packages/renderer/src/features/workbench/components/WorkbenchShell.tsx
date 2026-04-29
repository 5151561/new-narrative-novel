import type { ReactNode } from 'react'

import { useI18n } from '@/app/i18n'
import { ProjectRuntimeStatusBoundary, useProjectRuntime } from '@/app/project-runtime'
import { Badge } from '@/components/ui/Badge'
import { Pane } from '@/components/ui/Pane'
import { ModelSettingsDialog } from '@/features/settings/ModelSettingsDialog'
import { ModelSettingsProvider, useOptionalModelSettingsController } from '@/features/settings/ModelSettingsProvider'

import { useOptionalWorkbenchEditor } from '../editor/WorkbenchEditorProvider'
import { WorkbenchEditorTabs } from '../editor/WorkbenchEditorTabs'
import { useWorkbenchLayoutState } from '../hooks/useWorkbenchLayoutState'
import {
  WORKBENCH_LAYOUT_BOUNDS,
  getWorkbenchBodyGridColumns,
  getWorkbenchShellGridRows,
} from '../types/workbench-layout'
import { WorkbenchLayoutControls } from './WorkbenchLayoutControls'
import { WorkbenchSash } from './WorkbenchSash'
import { WorkbenchSurfaceBody } from './WorkbenchSurfaceBody'

function WorkbenchRuntimeBadge() {
  const runtime = useProjectRuntime()
  const projectMode = runtime.info?.projectMode
  if (!projectMode || projectMode === 'mock-storybook') {
    return null
  }

  const isReal = projectMode === 'real-project'
  const providerLabel = runtime.info?.modelBindings?.usable ? 'OpenAI' : 'Fixture'

  return (
    <div className="flex items-center gap-2">
      <Badge tone={isReal ? 'success' : 'accent'}>
        {isReal ? 'Real Project' : 'Demo Project'}
      </Badge>
      <Badge tone="neutral">{providerLabel}</Badge>
    </div>
  )
}

interface WorkbenchShellProps {
  topBar: ReactNode
  modeRail: ReactNode
  navigator?: ReactNode
  mainStage: ReactNode
  inspector?: ReactNode
  bottomDock?: ReactNode
  layoutStorageKey?: string
}

function isRenderablePane(pane: ReactNode): boolean {
  return pane != null && pane !== false
}

export function WorkbenchShell({
  topBar,
  modeRail,
  navigator,
  mainStage,
  inspector,
  bottomDock,
  layoutStorageKey,
}: WorkbenchShellProps) {
  return (
    <ModelSettingsProvider>
      <WorkbenchShellContent
        topBar={topBar}
        modeRail={modeRail}
        navigator={navigator}
        mainStage={mainStage}
        inspector={inspector}
        bottomDock={bottomDock}
        layoutStorageKey={layoutStorageKey}
      />
    </ModelSettingsProvider>
  )
}

function WorkbenchShellContent({
  topBar,
  modeRail,
  navigator,
  mainStage,
  inspector,
  bottomDock,
  layoutStorageKey,
}: WorkbenchShellProps) {
  const { dictionary } = useI18n()
  const modelSettings = useOptionalModelSettingsController()
  const layout = useWorkbenchLayoutState(layoutStorageKey)
  const editor = useOptionalWorkbenchEditor()
  const hasNavigator = isRenderablePane(navigator)
  const hasInspector = isRenderablePane(inspector)
  const hasBottomDock = isRenderablePane(bottomDock)
  const effectiveLayoutState = {
    ...layout.state,
    navigatorVisible: hasNavigator && layout.state.navigatorVisible,
    inspectorVisible: hasInspector && layout.state.inspectorVisible,
    bottomDockVisible: hasBottomDock && layout.state.bottomDockVisible,
    bottomDockMaximized:
      hasBottomDock && layout.state.bottomDockVisible && layout.state.bottomDockMaximized,
  }
  const gridTemplateRows = getWorkbenchShellGridRows(effectiveLayoutState)
  const showNavigator = hasNavigator && effectiveLayoutState.navigatorVisible
  const showInspector = hasInspector && effectiveLayoutState.inspectorVisible
  const showBottomDock = hasBottomDock && effectiveLayoutState.bottomDockVisible
  const gridTemplateColumns = getWorkbenchBodyGridColumns(effectiveLayoutState)
  const noop = () => {}

  return (
    <div
      data-testid="workbench-shell"
      className="grid h-screen min-h-0 overflow-hidden bg-app text-text-main"
      style={{ gridTemplateRows }}
    >
      <header
        data-testid="workbench-top-bar"
        className="border-b border-line-soft bg-surface-1/90 px-5 py-3 backdrop-blur"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">{topBar}</div>
            <div className="flex shrink-0 items-center gap-2">
              <WorkbenchRuntimeBadge />
              {modelSettings?.supported ? (
                <button
                  type="button"
                  onClick={() => modelSettings.setOpen(true)}
                  className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-main"
                >
                  {dictionary.shell.openModelSettings}
                </button>
              ) : null}
              <WorkbenchLayoutControls
                layout={effectiveLayoutState}
                navigatorAvailable={hasNavigator}
                inspectorAvailable={hasInspector}
                bottomDockAvailable={hasBottomDock}
                onToggleNavigator={hasNavigator ? () => layout.togglePart('navigator') : noop}
                onToggleInspector={hasInspector ? () => layout.togglePart('inspector') : noop}
                onToggleBottomDock={hasBottomDock ? () => layout.togglePart('bottomDock') : noop}
                onToggleBottomDockMaximized={
                  hasBottomDock && effectiveLayoutState.bottomDockVisible
                    ? layout.toggleBottomDockMaximized
                    : noop
                }
                onResetLayout={layout.resetLayout}
              />
            </div>
          </div>
          <ProjectRuntimeStatusBoundary />
        </div>
      </header>
      <div
        data-testid="workbench-body"
        className="grid min-h-0 overflow-hidden px-3 py-3"
        style={{ gridTemplateColumns }}
      >
        <Pane
          muted
          className="min-h-0"
          role="region"
          aria-label="Mode Rail"
          data-testid="workbench-mode-rail"
          style={{ gridColumn: 1 }}
        >
          <WorkbenchSurfaceBody data-testid="workbench-mode-rail-scroll-body">
            {modeRail}
          </WorkbenchSurfaceBody>
        </Pane>
        {showNavigator ? (
          <div className="relative ml-3 min-h-0" style={{ gridColumn: 2 }}>
            <Pane
              muted
              className="h-full min-h-0"
              role="region"
              aria-label={dictionary.shell.navigatorTitle}
              data-testid="workbench-navigator"
            >
              <WorkbenchSurfaceBody data-testid="workbench-navigator-scroll-body">
                {navigator}
              </WorkbenchSurfaceBody>
            </Pane>
            <div className="absolute -right-3 top-0 z-10 flex h-full justify-center">
              <WorkbenchSash
                orientation="vertical"
                label={dictionary.shell.resizeNavigator}
                onResize={(delta) => layout.resizePart('navigator', delta)}
                valueNow={layout.state.navigatorWidth}
                valueMin={WORKBENCH_LAYOUT_BOUNDS.navigator.min}
                valueMax={WORKBENCH_LAYOUT_BOUNDS.navigator.max}
                valueText={`${layout.state.navigatorWidth}px`}
              />
            </div>
          </div>
        ) : null}
        <Pane className="ml-3 min-h-0" style={{ gridColumn: 3 }}>
          {editor ? (
            <main data-testid="workbench-main-stage" className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div data-testid="workbench-editor-tabs" className="shrink-0">
                <WorkbenchEditorTabs
                  contexts={editor.state.contexts}
                  activeContextId={editor.state.activeContextId}
                  onActivateContext={editor.activateContext}
                  onCloseContext={editor.closeContext}
                />
              </div>
              <WorkbenchSurfaceBody data-testid="workbench-main-stage-scroll-body">
                {mainStage}
              </WorkbenchSurfaceBody>
            </main>
          ) : (
            <main data-testid="workbench-main-stage" className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <WorkbenchSurfaceBody data-testid="workbench-main-stage-scroll-body">
                {mainStage}
              </WorkbenchSurfaceBody>
            </main>
          )}
        </Pane>
        {showInspector ? (
          <div className="relative ml-3 min-h-0" style={{ gridColumn: 4 }}>
            <Pane
              muted
              className="h-full min-h-0"
              role="region"
              aria-label={dictionary.shell.inspectorTitle}
              data-testid="workbench-inspector"
            >
              <WorkbenchSurfaceBody data-testid="workbench-inspector-scroll-body">
                {inspector}
              </WorkbenchSurfaceBody>
            </Pane>
            <div className="absolute -left-3 top-0 z-10 flex h-full justify-center">
              <WorkbenchSash
                orientation="vertical"
                label={dictionary.shell.resizeInspector}
                onResize={(delta) => layout.resizePart('inspector', -delta)}
                valueNow={layout.state.inspectorWidth}
                valueMin={WORKBENCH_LAYOUT_BOUNDS.inspector.min}
                valueMax={WORKBENCH_LAYOUT_BOUNDS.inspector.max}
                valueText={`${layout.state.inspectorWidth}px`}
              />
            </div>
          </div>
        ) : null}
      </div>
      {showBottomDock ? (
        <div className="relative mx-3 mb-3 min-h-0 overflow-hidden">
          <Pane
            muted
            className="h-full min-h-0"
            role="region"
            aria-label={dictionary.shell.bottomDockTitle}
            data-testid="workbench-bottom-dock"
          >
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden" data-testid="workbench-bottom-dock-body">
              {bottomDock}
            </div>
          </Pane>
          {!effectiveLayoutState.bottomDockMaximized ? (
            <div className="absolute -top-4 left-0 z-10 flex w-full justify-center">
              <WorkbenchSash
                orientation="horizontal"
                label={dictionary.shell.resizeBottomDock}
                onResize={(delta) => layout.resizePart('bottomDock', -delta)}
                valueNow={layout.state.bottomDockHeight}
                valueMin={WORKBENCH_LAYOUT_BOUNDS.bottomDock.min}
                valueMax={WORKBENCH_LAYOUT_BOUNDS.bottomDock.max}
                valueText={`${layout.state.bottomDockHeight}px`}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <ModelSettingsDialog
        open={Boolean(modelSettings?.open)}
        onOpenChange={(nextOpen) => modelSettings?.setOpen(nextOpen)}
      />
    </div>
  )
}

export type WorkbenchLayoutPart = 'navigator' | 'inspector' | 'bottomDock'

export interface WorkbenchLayoutState {
  navigatorVisible: boolean
  inspectorVisible: boolean
  bottomDockVisible: boolean
  navigatorWidth: number
  inspectorWidth: number
  bottomDockHeight: number
  bottomDockMaximized: boolean
}

export interface WorkbenchLayoutBounds {
  navigator: { min: number; max: number; defaultSize: number }
  inspector: { min: number; max: number; defaultSize: number }
  bottomDock: {
    min: number
    max: number
    defaultSize: number
    maximizedSize: number
  }
}

export const WORKBENCH_LAYOUT_BOUNDS: WorkbenchLayoutBounds = {
  navigator: { min: 180, max: 420, defaultSize: 240 },
  inspector: { min: 220, max: 460, defaultSize: 280 },
  bottomDock: { min: 120, max: 420, defaultSize: 248, maximizedSize: 420 },
}

export const DEFAULT_WORKBENCH_LAYOUT_STATE: WorkbenchLayoutState = {
  navigatorVisible: true,
  inspectorVisible: true,
  bottomDockVisible: true,
  navigatorWidth: 240,
  inspectorWidth: 280,
  bottomDockHeight: 248,
  bottomDockMaximized: false,
}

function clampSize(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function readSize(value: unknown, fallback: number, bounds: { min: number; max: number }) {
  return typeof value === 'number' && Number.isFinite(value) ? clampSize(value, bounds.min, bounds.max) : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function clampWorkbenchLayoutState(input: Partial<WorkbenchLayoutState>): WorkbenchLayoutState {
  return {
    navigatorVisible: readBoolean(input.navigatorVisible, DEFAULT_WORKBENCH_LAYOUT_STATE.navigatorVisible),
    inspectorVisible: readBoolean(input.inspectorVisible, DEFAULT_WORKBENCH_LAYOUT_STATE.inspectorVisible),
    bottomDockVisible: readBoolean(input.bottomDockVisible, DEFAULT_WORKBENCH_LAYOUT_STATE.bottomDockVisible),
    navigatorWidth: readSize(
      input.navigatorWidth,
      DEFAULT_WORKBENCH_LAYOUT_STATE.navigatorWidth,
      WORKBENCH_LAYOUT_BOUNDS.navigator,
    ),
    inspectorWidth: readSize(
      input.inspectorWidth,
      DEFAULT_WORKBENCH_LAYOUT_STATE.inspectorWidth,
      WORKBENCH_LAYOUT_BOUNDS.inspector,
    ),
    bottomDockHeight: readSize(
      input.bottomDockHeight,
      DEFAULT_WORKBENCH_LAYOUT_STATE.bottomDockHeight,
      WORKBENCH_LAYOUT_BOUNDS.bottomDock,
    ),
    bottomDockMaximized: readBoolean(
      input.bottomDockMaximized,
      DEFAULT_WORKBENCH_LAYOUT_STATE.bottomDockMaximized,
    ),
  }
}

export function serializeWorkbenchLayoutState(state: WorkbenchLayoutState): string {
  return JSON.stringify(clampWorkbenchLayoutState(state))
}

export function parseWorkbenchLayoutState(raw: string | null): WorkbenchLayoutState {
  if (!raw) {
    return DEFAULT_WORKBENCH_LAYOUT_STATE
  }

  try {
    const parsed = JSON.parse(raw)

    return isRecord(parsed) ? clampWorkbenchLayoutState(parsed) : DEFAULT_WORKBENCH_LAYOUT_STATE
  } catch {
    return DEFAULT_WORKBENCH_LAYOUT_STATE
  }
}

export function getWorkbenchBodyGridColumns(state: WorkbenchLayoutState): string {
  const layoutState = clampWorkbenchLayoutState(state)
  const navigatorWidth = layoutState.navigatorVisible ? layoutState.navigatorWidth : 0
  const inspectorWidth = layoutState.inspectorVisible ? layoutState.inspectorWidth : 0

  return `68px ${navigatorWidth}px minmax(0,1fr) ${inspectorWidth}px`
}

export function getWorkbenchShellGridRows(state: WorkbenchLayoutState): string {
  const layoutState = clampWorkbenchLayoutState(state)
  const bottomDockHeight = layoutState.bottomDockVisible
    ? layoutState.bottomDockMaximized
      ? WORKBENCH_LAYOUT_BOUNDS.bottomDock.maximizedSize
      : layoutState.bottomDockHeight
    : 0

  return `minmax(72px,auto) minmax(0,1fr) ${bottomDockHeight}px`
}

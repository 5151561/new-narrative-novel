import {
  Maximize2,
  Minimize2,
  PanelBottom,
  PanelLeft,
  PanelRight,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react'

import { useI18n } from '@/app/i18n'
import type { WorkbenchLayoutState } from '@/features/workbench/types/workbench-layout'
import { cn } from '@/lib/cn'

interface WorkbenchLayoutControlsProps {
  layout: WorkbenchLayoutState
  navigatorAvailable?: boolean
  inspectorAvailable?: boolean
  bottomDockAvailable?: boolean
  onToggleNavigator: () => void
  onToggleInspector: () => void
  onToggleBottomDock: () => void
  onToggleBottomDockMaximized: () => void
  onResetLayout: () => void
}

interface IconButtonProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  pressed?: boolean
  disabled?: boolean
}

function IconButton({ label, icon: Icon, onClick, pressed, disabled = false }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        pressed
          ? 'border-line-strong bg-surface-1 text-text-main shadow-sm'
          : 'border-line-soft bg-surface-2 text-text-muted hover:bg-surface-1 hover:text-text-main',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-surface-2 hover:text-text-muted',
      )}
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
    </button>
  )
}

export function WorkbenchLayoutControls({
  layout,
  navigatorAvailable = true,
  inspectorAvailable = true,
  bottomDockAvailable = true,
  onToggleNavigator,
  onToggleInspector,
  onToggleBottomDock,
  onToggleBottomDockMaximized,
  onResetLayout,
}: WorkbenchLayoutControlsProps) {
  const { dictionary } = useI18n()
  const bottomDockMaximizeLabel = layout.bottomDockMaximized
    ? dictionary.shell.restoreBottomDock
    : dictionary.shell.maximizeBottomDock
  const BottomDockMaximizeIcon = layout.bottomDockMaximized ? Minimize2 : Maximize2

  return (
    <div
      role="toolbar"
      aria-label={dictionary.shell.layoutControls}
      className="inline-flex items-center gap-1 rounded-md border border-line-soft bg-surface-2 p-1"
      data-testid="workbench-layout-controls"
    >
      <IconButton
        label={dictionary.shell.toggleNavigator}
        icon={PanelLeft}
        onClick={onToggleNavigator}
        pressed={layout.navigatorVisible}
        disabled={!navigatorAvailable}
      />
      <IconButton
        label={dictionary.shell.toggleInspector}
        icon={PanelRight}
        onClick={onToggleInspector}
        pressed={layout.inspectorVisible}
        disabled={!inspectorAvailable}
      />
      <IconButton
        label={dictionary.shell.toggleBottomDock}
        icon={PanelBottom}
        onClick={onToggleBottomDock}
        pressed={layout.bottomDockVisible}
        disabled={!bottomDockAvailable}
      />
      <IconButton
        label={bottomDockMaximizeLabel}
        icon={BottomDockMaximizeIcon}
        onClick={onToggleBottomDockMaximized}
        disabled={!bottomDockAvailable || !layout.bottomDockVisible}
      />
      <IconButton
        label={dictionary.shell.resetWorkbenchLayout}
        icon={RotateCcw}
        onClick={onResetLayout}
      />
    </div>
  )
}

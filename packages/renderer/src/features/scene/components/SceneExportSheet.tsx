interface SceneExportSheetProps {
  sceneTitle: string
  currentVersionLabel?: string
  onClose: () => void
}

export function SceneExportSheet({ sceneTitle, currentVersionLabel, onClose }: SceneExportSheetProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-start justify-end bg-app/70 p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-export-title"
        className="w-full max-w-md rounded-md border border-line-soft bg-surface-1 shadow-ringwarm"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-soft px-4 py-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Export</p>
            <h3 id="scene-export-title" className="text-lg leading-tight">
              Export scene workspace
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 px-4 py-4 text-sm leading-6 text-text-muted">
          <p>{sceneTitle}</p>
          <p>{currentVersionLabel ? `Ready to export ${currentVersionLabel} as scene package or prose handoff.` : 'Ready to export the current scene package.'}</p>
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
            <p className="font-medium text-text-main">Included in this export</p>
            <ul className="mt-2 space-y-1">
              <li>Scene summary and accepted facts</li>
              <li>Version checkpoints and patch candidates</li>
              <li>Current prose draft and thread selection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

import { EmptyState } from '@/components/ui/EmptyState'

import type { ScenePatchPreviewViewModel } from '../types/scene-view-models'

interface ScenePatchPreviewSheetProps {
  preview: ScenePatchPreviewViewModel | null
  isLoading: boolean
  error?: Error | null
  onClose: () => void
  onCommit: (patchId: string) => void
}

export function ScenePatchPreviewSheet({
  preview,
  isLoading,
  error,
  onClose,
  onCommit,
}: ScenePatchPreviewSheetProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-start justify-end bg-app/70 p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-patch-preview-title"
        className="w-full max-w-xl rounded-md border border-line-soft bg-surface-1 shadow-ringwarm"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-soft px-4 py-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Patch Preview</p>
            <h3 id="scene-patch-preview-title" className="text-lg leading-tight">
              Patch preview
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
        <div className="space-y-4 px-4 py-4">
          {error ? (
            <EmptyState title="Patch preview unavailable" message={error.message} />
          ) : isLoading ? (
            <EmptyState title="Loading patch preview" message="Resolving the current accepted patch candidate." />
          ) : !preview ? (
            <EmptyState title="No patch ready" message="Accept stays separate from commit, so patch preview opens only when a candidate is ready." />
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.05em] text-text-soft">{preview.status}</p>
                <h4 className="text-xl leading-tight text-text-main">{preview.label}</h4>
                <p className="text-sm leading-6 text-text-muted">{preview.summary}</p>
                <p className="text-sm leading-6 text-text-main">{preview.sceneSummary}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <p className="text-sm font-medium text-text-main">Accepted facts</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-text-muted">
                    {preview.acceptedFacts.map((fact) => (
                      <li key={fact.id}>
                        <span className="font-medium text-text-main">{fact.label}:</span> {fact.value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <p className="text-sm font-medium text-text-main">Patch changes</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-text-muted">
                    {preview.changes.map((change) => (
                      <li key={change.id}>
                        <span className="font-medium text-text-main">{change.label}:</span> {change.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onCommit(preview.patchId)}
                  className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={preview.status !== 'ready_for_commit'}
                >
                  Commit Patch
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

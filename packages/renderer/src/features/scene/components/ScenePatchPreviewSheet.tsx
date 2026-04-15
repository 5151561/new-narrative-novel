import { getGenericStatusLabel, useI18n } from '@/app/i18n'
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
  const { locale } = useI18n()

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
            <p className="text-xs uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '补丁预览' : 'Patch Preview'}</p>
            <h3 id="scene-patch-preview-title" className="text-lg leading-tight">
              {locale === 'zh-CN' ? '补丁预览' : 'Patch preview'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
          >
            {locale === 'zh-CN' ? '关闭' : 'Close'}
          </button>
        </div>
        <div className="space-y-4 px-4 py-4">
          {error ? (
            <EmptyState title={locale === 'zh-CN' ? '补丁预览不可用' : 'Patch preview unavailable'} message={error.message} />
          ) : isLoading ? (
            <EmptyState
              title={locale === 'zh-CN' ? '正在加载补丁预览' : 'Loading patch preview'}
              message={locale === 'zh-CN' ? '正在解析当前已采纳的补丁候选。' : 'Resolving the current accepted patch candidate.'}
            />
          ) : !preview ? (
            <EmptyState
              title={locale === 'zh-CN' ? '暂无可用补丁' : 'No patch ready'}
              message={
                locale === 'zh-CN'
                  ? '采纳和提交保持分离，所以只有候选准备好时才会打开补丁预览。'
                  : 'Accept stays separate from commit, so patch preview opens only when a candidate is ready.'
              }
            />
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.05em] text-text-soft">{getGenericStatusLabel(locale, preview.status)}</p>
                <h4 className="text-xl leading-tight text-text-main">{preview.label}</h4>
                <p className="text-sm leading-6 text-text-muted">{preview.summary}</p>
                <p className="text-sm leading-6 text-text-main">{preview.sceneSummary}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '已采纳事实' : 'Accepted facts'}</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-text-muted">
                    {preview.acceptedFacts.map((fact) => (
                      <li key={fact.id}>
                        <span className="font-medium text-text-main">{fact.label}:</span> {fact.value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '补丁变更' : 'Patch changes'}</p>
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
                  {locale === 'zh-CN' ? '提交补丁' : 'Commit Patch'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

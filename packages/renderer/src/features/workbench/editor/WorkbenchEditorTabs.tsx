import { X } from 'lucide-react'

import { useI18n } from '@/app/i18n'
import { cn } from '@/lib/cn'

import type { WorkbenchEditorContext, WorkbenchEditorContextId } from './workbench-editor-context'

interface WorkbenchEditorTabsProps {
  contexts: WorkbenchEditorContext[]
  activeContextId: WorkbenchEditorContextId | null
  onActivateContext: (id: WorkbenchEditorContextId) => void
  onCloseContext: (id: WorkbenchEditorContextId) => void
  className?: string
}

function getEditorActionLabel(title: string, subtitle: string) {
  return subtitle ? `${title} / ${subtitle}` : title
}

function getCloseLabel(template: string, title: string, subtitle: string) {
  return `${template}: ${getEditorActionLabel(title, subtitle)}`
}

function isRawObjectId(value: string) {
  return /^(scene|chapter|asset|book)-[a-z0-9-]+$/i.test(value)
}

export function WorkbenchEditorTabs({
  contexts,
  activeContextId,
  onActivateContext,
  onCloseContext,
  className,
}: WorkbenchEditorTabsProps) {
  const { dictionary } = useI18n()

  if (contexts.length === 0) {
    return null
  }

  return (
    <div
      role="tablist"
      aria-label={dictionary.shell.openEditors}
      className={cn(
        'flex min-h-11 max-w-full items-stretch overflow-x-auto border-b border-line-soft bg-surface-2',
        className,
      )}
    >
      {contexts.map((context) => {
        const isActive = context.id === activeContextId
        const visibleSubtitle = isRawObjectId(context.subtitle) ? '' : context.subtitle

        return (
          <div
            key={context.id}
            role="presentation"
            className={cn(
              'flex min-w-48 max-w-72 shrink-0 items-stretch border-r border-line-soft',
              isActive ? 'bg-surface-1 text-text-main' : 'bg-surface-2 text-text-muted',
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onActivateContext(context.id)}
              className={cn(
                'flex min-w-0 flex-1 flex-col justify-center px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
                isActive ? 'text-text-main' : 'hover:bg-surface-1 hover:text-text-main',
              )}
            >
              <span className="truncate text-xs font-semibold leading-4">{context.title}</span>
              {visibleSubtitle ? (
                <span className="truncate text-[11px] leading-4 text-text-muted">{visibleSubtitle}</span>
              ) : null}
            </button>
            <button
              type="button"
              aria-label={getCloseLabel(dictionary.shell.closeEditor, context.title, visibleSubtitle)}
              title={getCloseLabel(dictionary.shell.closeEditor, context.title, visibleSubtitle)}
              onClick={(event) => {
                event.stopPropagation()
                onCloseContext(context.id)
              }}
              className={cn(
                'my-1 mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-text-muted outline-none transition-colors hover:bg-surface-2 hover:text-text-main focus-visible:ring-2 focus-visible:ring-accent',
                isActive && 'hover:bg-app',
              )}
            >
              <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

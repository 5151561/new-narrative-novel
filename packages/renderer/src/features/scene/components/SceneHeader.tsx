import { useCallback, useRef, useState } from 'react'

import { getSceneRunStatusLabel, getSceneStatusLabel, getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { useProjectRuntime } from '@/app/project-runtime'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import type { SceneLens } from '@/features/workbench/types/workbench-route'

import type { SceneWorkspaceViewModel } from '../types/scene-view-models'

interface SceneHeaderProps {
  scene: SceneWorkspaceViewModel
  lens: SceneLens
  onOpenExport: () => void
  onSwitchThread: (threadId: string) => void
  onOpenVersions: () => void
}

function statusTone(status: SceneWorkspaceViewModel['status']): 'neutral' | 'accent' | 'success' | 'warn' {
  if (status === 'ready' || status === 'committed') {
    return 'success'
  }
  if (status === 'review') {
    return 'accent'
  }
  if (status === 'running') {
    return 'warn'
  }
  return 'neutral'
}

export function SceneHeader({ scene, lens, onOpenExport, onSwitchThread, onOpenVersions }: SceneHeaderProps) {
  const { locale } = useI18n()
  const runtime = useProjectRuntime()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const editTitleInputRef = useRef<HTMLInputElement>(null)

  const startEditingTitle = useCallback(() => {
    setEditTitleValue(scene.title)
    setIsEditingTitle(true)
    requestAnimationFrame(() => {
      editTitleInputRef.current?.focus()
      editTitleInputRef.current?.select()
    })
  }, [scene.title])

  const commitTitleEdit = useCallback(async () => {
    if (!editTitleValue.trim() || editTitleValue.trim() === scene.title) {
      setIsEditingTitle(false)
      return
    }
    setIsEditingTitle(false)
    await runtime.sceneClient.renameScene?.(scene.id, editTitleValue.trim())
  }, [editTitleValue, scene.id, scene.title, runtime.sceneClient])

  const cancelTitleEdit = useCallback(() => {
    setIsEditingTitle(false)
  }, [])

  const handleTitleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        void commitTitleEdit()
      } else if (event.key === 'Escape') {
        cancelTitleEdit()
      }
    },
    [commitTitleEdit, cancelTitleEdit],
  )

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.08em] text-text-soft">
          {scene.chapterTitle} / {locale === 'zh-CN' ? '场景' : 'Scene'} / {getWorkbenchLensLabel(locale, lens)}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {isEditingTitle ? (
            <input
              ref={editTitleInputRef}
              type="text"
              value={editTitleValue}
              onChange={(event) => setEditTitleValue(event.target.value)}
              onBlur={() => void commitTitleEdit()}
              onKeyDown={handleTitleKeyDown}
              className="min-w-[200px] rounded-md border border-line-soft bg-surface-1 px-2 py-1 text-[30px] leading-[1.15] text-text-main"
              placeholder={locale === 'zh-CN' ? '场景标题' : 'Scene title'}
            />
          ) : (
            <button
              type="button"
              onClick={startEditingTitle}
              className="rounded-md px-1 -ml-1 text-[30px] leading-[1.15] hover:bg-surface-2 hover:text-accent text-left"
              title={locale === 'zh-CN' ? '点击编辑场景标题' : 'Click to edit scene title'}
            >
              {scene.title}
            </button>
          )}
          <Badge tone={statusTone(scene.status)}>{getSceneStatusLabel(locale, scene.status)}</Badge>
          <Badge tone={scene.runStatus === 'paused' ? 'warn' : 'neutral'}>
            <StatusDot tone={scene.runStatus === 'paused' ? 'warn' : 'neutral'} className="mr-1" />
            {getSceneRunStatusLabel(locale, scene.runStatus)}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={scene.pendingProposalCount > 0 ? 'warn' : 'neutral'}>
            {locale === 'zh-CN' ? `待审提案：${scene.pendingProposalCount}` : `Pending proposals: ${scene.pendingProposalCount}`}
          </Badge>
          <Badge tone={scene.warningCount > 0 ? 'warn' : 'neutral'}>
            {locale === 'zh-CN' ? `警告：${scene.warningCount}` : `Warnings: ${scene.warningCount}`}
          </Badge>
          {scene.currentVersionLabel ? <Badge>{scene.currentVersionLabel}</Badge> : null}
        </div>
        <p className="max-w-3xl text-sm leading-6 text-text-muted">{scene.objective}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-muted">
          <span>{locale === 'zh-CN' ? '线程' : 'Thread'}</span>
          <select
            value={scene.activeThreadId}
            onChange={(event) => onSwitchThread(event.target.value)}
            className="min-w-28 border-0 bg-transparent p-0 text-text-main focus:ring-0"
          >
            {scene.availableThreads.map((thread) => (
              <option key={thread.id} value={thread.id}>
                {thread.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onOpenVersions} className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm">
          {locale === 'zh-CN' ? '版本' : 'Versions'}
        </button>
        <button type="button" onClick={onOpenExport} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white">
          {locale === 'zh-CN' ? '导出' : 'Export'}
        </button>
      </div>
    </header>
  )
}

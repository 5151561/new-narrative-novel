import { getSceneRunStatusLabel, getSceneStatusLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'

import type { SceneWorkspaceViewModel } from '../types/scene-view-models'

interface SceneHeaderProps {
  scene: SceneWorkspaceViewModel
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

export function SceneHeader({ scene, onOpenExport, onSwitchThread, onOpenVersions }: SceneHeaderProps) {
  const { locale } = useI18n()

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.08em] text-text-soft">
          {scene.chapterTitle} / {locale === 'zh-CN' ? '场景' : 'Scene'} / {locale === 'zh-CN' ? '编排' : 'Orchestrate'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[30px] leading-[1.15]">{scene.title}</h1>
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

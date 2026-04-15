import { useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionCard } from '@/components/ui/SectionCard'
import { StickyFooter } from '@/components/ui/StickyFooter'
import { Toolbar } from '@/components/ui/Toolbar'

import type { SceneProseViewModel } from '../types/scene-view-models'

interface SceneProseTabProps {
  prose: SceneProseViewModel
  selectedMode: SceneProseViewModel['revisionModes'][number]
  isFocusModeActive: boolean
  isRevising: boolean
  onSelectMode: (mode: SceneProseViewModel['revisionModes'][number]) => void
  onToggleFocusMode: () => void
  onRevise: () => void
}

export function ProseDraftReader({ proseDraft }: Pick<SceneProseViewModel, 'proseDraft'>) {
  const { locale } = useI18n()

  if (!proseDraft) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '还没有正文草稿' : 'No draft prose yet'}
        message={
          locale === 'zh-CN'
            ? '执行流程仍可继续，但在生成本地草稿之前，正文区域会保持为空。'
            : 'Execution can still continue, but prose stays empty until a local draft is generated.'
        }
      />
    )
  }

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '只读' : 'Read Only'} title={locale === 'zh-CN' ? '当前草稿' : 'Current Draft'}>
      <div className="space-y-4">
        <p className="rounded-md border border-line-soft bg-surface-2 px-4 py-4 text-[15px] leading-7 text-text-main">
          {proseDraft}
        </p>
      </div>
    </SectionCard>
  )
}

export function RevisionActionBar({
  revisionModes,
  selectedMode,
  isRevising,
  onSelectMode,
  onRevise,
}: Pick<SceneProseTabProps, 'selectedMode' | 'isRevising' | 'onSelectMode' | 'onRevise'> &
  Pick<SceneProseViewModel, 'revisionModes'>) {
  const { locale } = useI18n()
  const revisionLabels: Record<SceneProseViewModel['revisionModes'][number], string> = {
    rewrite: locale === 'zh-CN' ? '重写' : 'Rewrite',
    compress: locale === 'zh-CN' ? '压缩' : 'Compress',
    expand: locale === 'zh-CN' ? '扩写' : 'Expand',
    tone_adjust: locale === 'zh-CN' ? '语气调整' : 'Tone Adjust',
    continuity_fix: locale === 'zh-CN' ? '连续性修复' : 'Continuity Fix',
  }

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '修订' : 'Revision'} title={locale === 'zh-CN' ? '修订动作' : 'Revision Actions'}>
      <div className="flex flex-wrap gap-2">
        {revisionModes.map((mode) => {
          const isSelected = selectedMode === mode

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onSelectMode(mode)}
              className={`rounded-md px-3 py-2 text-sm ${
                isSelected ? 'bg-accent text-white' : 'border border-line-soft bg-surface-2 text-text-main'
              }`}
            >
              {revisionLabels[mode]}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '当前轮次' : 'Selected pass'}</p>
          <p className="text-sm text-text-muted">
            {locale === 'zh-CN'
              ? `${revisionLabels[selectedMode]}会在不离开工作台的前提下，为这份场景草稿准备下一轮修订。`
              : `${revisionLabels[selectedMode]} prepares the next revision pass against this scene draft without leaving the workbench.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onRevise}
          disabled={isRevising}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {locale === 'zh-CN' ? '开始修订' : 'Revise Draft'}
        </button>
      </div>
    </SectionCard>
  )
}

export function ProseToolbar({
  prose,
  selectedMode,
  isFocusModeActive,
  onToggleFocusMode,
}: Pick<SceneProseTabProps, 'prose' | 'selectedMode' | 'isFocusModeActive' | 'onToggleFocusMode'>) {
  const { locale } = useI18n()
  const revisionLabel =
    selectedMode === 'rewrite'
      ? locale === 'zh-CN'
        ? '重写'
        : 'Rewrite'
      : selectedMode === 'compress'
        ? locale === 'zh-CN'
          ? '压缩'
          : 'Compress'
        : selectedMode === 'expand'
          ? locale === 'zh-CN'
            ? '扩写'
            : 'Expand'
          : selectedMode === 'tone_adjust'
            ? locale === 'zh-CN'
              ? '语气调整'
              : 'Tone Adjust'
            : locale === 'zh-CN'
              ? '连续性修复'
              : 'Continuity Fix'

  return (
    <Toolbar className="justify-between border-b border-line-soft bg-surface-1 px-4 py-3 shadow-ringwarm">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '正文工具栏' : 'Prose Toolbar'}</p>
        <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '场景正文工作台' : 'Scene Prose Workbench'}</p>
        <p className="text-sm text-text-muted">
          {locale === 'zh-CN'
            ? '阅读已采纳草稿，选择修订轮次，并继续留在场景驾驶舱内。'
            : 'Read the accepted draft, choose a revision pass, and stay inside the scene cockpit.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{revisionLabel}</Badge>
          <Badge tone={prose.focusModeAvailable ? 'success' : 'neutral'}>
            {prose.focusModeAvailable
              ? locale === 'zh-CN'
                ? '可用专注模式'
                : 'Focus available'
              : locale === 'zh-CN'
                ? '专注模式不可用'
                : 'Focus unavailable'}
          </Badge>
          {isFocusModeActive ? <Badge tone="accent">{locale === 'zh-CN' ? '专注模式已开启' : 'Focus mode active'}</Badge> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {prose.focusModeAvailable ? (
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
          >
            {isFocusModeActive
              ? locale === 'zh-CN'
                ? '退出专注模式'
                : 'Exit Focus Mode'
              : locale === 'zh-CN'
                ? '专注模式'
                : 'Focus Mode'}
          </button>
        ) : null}
      </div>
    </Toolbar>
  )
}

export function ProseStatusFooter({ prose, selectedMode }: Pick<SceneProseTabProps, 'prose' | 'selectedMode'>) {
  const { locale } = useI18n()
  const revisionLabel =
    selectedMode === 'rewrite'
      ? locale === 'zh-CN'
        ? '重写'
        : 'Rewrite'
      : selectedMode === 'compress'
        ? locale === 'zh-CN'
          ? '压缩'
          : 'Compress'
        : selectedMode === 'expand'
          ? locale === 'zh-CN'
            ? '扩写'
            : 'Expand'
          : selectedMode === 'tone_adjust'
            ? locale === 'zh-CN'
              ? '语气调整'
              : 'Tone Adjust'
            : locale === 'zh-CN'
              ? '连续性修复'
              : 'Continuity Fix'

  return (
    <StickyFooter>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={prose.warningsCount > 0 ? 'warn' : 'success'}>
            {locale === 'zh-CN' ? `${prose.warningsCount} 条警告` : `${prose.warningsCount} warnings`}
          </Badge>
          <Badge tone="neutral">{locale === 'zh-CN' ? `${prose.draftWordCount ?? 0} 字` : `${prose.draftWordCount ?? 0} words`}</Badge>
          <Badge tone="accent">{revisionLabel}</Badge>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-sm text-text-main">{prose.statusLabel ?? (locale === 'zh-CN' ? '可进入修订轮次' : 'Ready for revision pass')}</p>
          <p className="text-sm text-text-muted">{prose.latestDiffSummary ?? (locale === 'zh-CN' ? '尚未请求新的正文修订。' : 'No prose revision requested yet.')}</p>
        </div>
      </div>
    </StickyFooter>
  )
}

export function SceneProseTab({
  prose,
  selectedMode,
  isFocusModeActive,
  isRevising,
  onSelectMode,
  onToggleFocusMode,
  onRevise,
}: SceneProseTabProps) {
  const { locale } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-5">
        <ProseToolbar
          prose={prose}
          selectedMode={selectedMode}
          isFocusModeActive={isFocusModeActive}
          onToggleFocusMode={onToggleFocusMode}
        />
      </div>
      <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <ProseDraftReader proseDraft={prose.proseDraft} />
        <div className="grid content-start gap-4">
          <RevisionActionBar
            revisionModes={prose.revisionModes}
            selectedMode={selectedMode}
            isRevising={isRevising}
            onSelectMode={onSelectMode}
            onRevise={onRevise}
          />
          <SectionCard eyebrow={locale === 'zh-CN' ? '差异摘要' : 'Diff Summary'} title={locale === 'zh-CN' ? '最新修订' : 'Latest Revision'}>
            <p className="text-sm leading-6 text-text-muted">
              {prose.latestDiffSummary ?? (locale === 'zh-CN' ? '尚未请求新的正文修订。' : 'No prose revision requested yet.')}
            </p>
          </SectionCard>
        </div>
      </div>
      <ProseStatusFooter prose={prose} selectedMode={selectedMode} />
    </div>
  )
}

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
  revisionBrief: string
  isRevisionBriefTooLong: boolean
  isFocusModeActive: boolean
  isRevising: boolean
  isAcceptingRevision: boolean
  canReviseDraft: boolean
  onSelectMode: (mode: SceneProseViewModel['revisionModes'][number]) => void
  onRevisionBriefChange: (value: string) => void
  onToggleFocusMode: () => void
  onRevise: () => void
  onAcceptRevision: () => void
}

export function ProseDraftReader({ proseDraft }: Pick<SceneProseViewModel, 'proseDraft'>) {
  const { locale } = useI18n()
  const hasDraft = Boolean(proseDraft?.trim())

  if (!hasDraft) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '还没有正文手稿' : 'No manuscript draft yet'}
        message={
          locale === 'zh-CN'
            ? '这个场景还没有产出可进入 chapter / book draft 装配的可读正文。'
            : 'This scene has not produced a readable manuscript draft for chapter and book assembly yet.'
        }
      />
    )
  }

  return (
    <SectionCard
      eyebrow={locale === 'zh-CN' ? '正文手稿' : 'Manuscript'}
      title={locale === 'zh-CN' ? '当前手稿草稿' : 'Current manuscript draft'}
    >
      <div className="space-y-4">
        <p className="rounded-md border border-line-soft bg-surface-2 px-4 py-4 text-[15px] leading-7 text-text-main">
          {proseDraft}
        </p>
      </div>
    </SectionCard>
  )
}

function dedupeByKey<T>(items: T[] | undefined, getKey: (item: T) => string | undefined) {
  const seen = new Set<string>()
  const deduped: T[] = []

  for (const item of items ?? []) {
    const key = getKey(item)?.trim()
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(item)
  }

  return deduped
}

function normalizeTraceSummary(traceSummary: SceneProseViewModel['traceSummary']) {
  if (!traceSummary) {
    return null
  }

  const sourcePatchId = traceSummary.sourcePatchId?.trim()
  const sourceProposals = dedupeByKey(traceSummary.sourceProposals, (proposal) => proposal.proposalId)
  const relatedAssets = dedupeByKey(traceSummary.relatedAssets, (asset) => asset.assetId)
  const missingLinks = [...new Set((traceSummary.missingLinks ?? []).map((link) => link.trim()).filter(Boolean))]

  if (!sourcePatchId && sourceProposals.length === 0 && relatedAssets.length === 0 && missingLinks.length === 0) {
    return null
  }

  return {
    sourcePatchId,
    sourceProposals,
    relatedAssets,
    missingLinks,
  }
}

export function ProseSourceSummary({ traceSummary }: Pick<SceneProseViewModel, 'traceSummary'>) {
  const { locale } = useI18n()
  const normalizedTraceSummary = normalizeTraceSummary(traceSummary)

  if (!normalizedTraceSummary) {
    return null
  }

  const sourceProposals = normalizedTraceSummary.sourceProposals
  const relatedAssets = normalizedTraceSummary.relatedAssets
  const missingLinks = normalizedTraceSummary.missingLinks

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '来源' : 'Sources'} title={locale === 'zh-CN' ? '来源摘要' : 'Source summary'}>
      <div className="grid gap-3 text-sm">
        {normalizedTraceSummary.sourcePatchId ? (
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? 'Source patch' : 'Source patch'}</p>
            <p className="mt-1 break-all font-medium text-text-main">{normalizedTraceSummary.sourcePatchId}</p>
          </div>
        ) : null}
        {sourceProposals.length > 0 ? (
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
              {locale === 'zh-CN' ? 'Source proposals' : 'Source proposals'}
            </p>
            <p className="mt-1 text-text-main">
              {locale === 'zh-CN' ? `${sourceProposals.length} 个提案` : `${sourceProposals.length} proposals`}
            </p>
            <ul className="mt-2 space-y-1 text-text-muted">
              {sourceProposals.map((proposal) => (
                <li key={proposal.proposalId} className="break-words">
                  {proposal.title ?? proposal.proposalId}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {relatedAssets.length > 0 ? (
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? 'Related assets' : 'Related assets'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {relatedAssets.map((asset) => (
                <Badge key={asset.assetId} tone="neutral">
                  {asset.title}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {missingLinks.length > 0 ? (
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? 'Missing links' : 'Missing links'}</p>
            <p className="mt-1 text-text-muted">{missingLinks.join(', ')}</p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}

function deriveDraftWordCount(locale: 'en' | 'zh-CN', proseDraft?: string, draftWordCount?: number) {
  if (draftWordCount !== undefined) {
    return draftWordCount
  }

  const trimmed = proseDraft?.trim()
  if (!trimmed) {
    return undefined
  }

  if (locale === 'zh-CN') {
    return trimmed.replace(/\s+/g, '').length
  }

  return trimmed.split(/\s+/).filter(Boolean).length
}

function getDraftWordCountLabel(
  locale: 'en' | 'zh-CN',
  hasDraft: boolean,
  proseDraft?: string,
  draftWordCount?: number,
) {
  if (!hasDraft) {
    return locale === 'zh-CN' ? '未起草' : 'No draft'
  }

  const resolvedDraftWordCount = deriveDraftWordCount(locale, proseDraft, draftWordCount)
  return locale === 'zh-CN' ? `${resolvedDraftWordCount} 字` : `${resolvedDraftWordCount} words`
}

export function RevisionActionBar({
  revisionModes,
  selectedMode,
  revisionBrief,
  isRevisionBriefTooLong,
  isRevising,
  canReviseDraft,
  onSelectMode,
  onRevisionBriefChange,
  onRevise,
  hasPendingRevisionCandidate,
}: Pick<
  SceneProseTabProps,
  'selectedMode' | 'revisionBrief' | 'isRevising' | 'canReviseDraft' | 'onSelectMode' | 'onRevisionBriefChange' | 'onRevise'
> & {
  hasPendingRevisionCandidate: boolean
  isRevisionBriefTooLong: boolean
} &
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
          disabled={isRevising || !canReviseDraft || hasPendingRevisionCandidate || isRevisionBriefTooLong}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {locale === 'zh-CN' ? '请求修订' : 'Request Revision'}
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <label htmlFor="scene-prose-revision-brief" className="text-sm font-medium text-text-main">
          {locale === 'zh-CN' ? '修订简报' : 'Revision brief'}
        </label>
        <input
          id="scene-prose-revision-brief"
          type="text"
          value={revisionBrief}
          onChange={(event) => onRevisionBriefChange(event.target.value)}
          placeholder={
            locale === 'zh-CN'
              ? '简要说明这一轮修订要解决什么。'
              : 'Briefly note what this revision pass should improve.'
          }
          aria-invalid={isRevisionBriefTooLong}
          className="w-full rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-main placeholder:text-text-soft"
        />
        {isRevisionBriefTooLong ? (
          <p className="text-sm text-warn">
            {locale === 'zh-CN'
              ? '修订简报不能超过 280 个字符。'
              : 'Revision brief must be 280 characters or fewer.'}
          </p>
        ) : null}
      </div>
      {!canReviseDraft ? (
        <p className="mt-3 text-sm text-text-muted">
          {locale === 'zh-CN' ? '需要先生成正文草稿，才能排队新的修订。' : 'A prose draft is required before queuing a revision.'}
        </p>
      ) : null}
      {hasPendingRevisionCandidate ? (
        <p className="mt-3 text-sm text-text-muted">
          {locale === 'zh-CN'
            ? '当前已有待审阅的修订候选，请先接受它，再请求下一轮。'
            : 'A revision candidate is already pending review. Accept it before requesting another pass.'}
        </p>
      ) : null}
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

export function PendingRevisionCandidateCard({
  prose,
  isAcceptingRevision,
  onAcceptRevision,
}: Pick<SceneProseTabProps, 'prose' | 'isAcceptingRevision' | 'onAcceptRevision'>) {
  const { locale } = useI18n()
  const candidate = prose.revisionCandidate

  if (!candidate) {
    return null
  }

  const revisionLabels: Record<SceneProseViewModel['revisionModes'][number], string> = {
    rewrite: locale === 'zh-CN' ? '重写' : 'Rewrite',
    compress: locale === 'zh-CN' ? '压缩' : 'Compress',
    expand: locale === 'zh-CN' ? '扩写' : 'Expand',
    tone_adjust: locale === 'zh-CN' ? '语气调整' : 'Tone Adjust',
    continuity_fix: locale === 'zh-CN' ? '连续性修复' : 'Continuity Fix',
  }

  return (
    <SectionCard
      eyebrow={locale === 'zh-CN' ? '候选正文' : 'Candidate prose'}
      title={locale === 'zh-CN' ? '待审阅修订候选' : 'Pending revision candidate'}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{revisionLabels[candidate.revisionMode]}</Badge>
          <Badge tone="neutral">{candidate.revisionId}</Badge>
          {candidate.fallbackProvenance ? <Badge tone="warn">{candidate.fallbackProvenance.modelId}</Badge> : null}
        </div>
        {candidate.instruction ? (
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
              {locale === 'zh-CN' ? '修订简报' : 'Revision brief'}
            </p>
            <p className="mt-1 text-sm leading-6 text-text-main">{candidate.instruction}</p>
          </div>
        ) : null}
        <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
            {locale === 'zh-CN' ? '候选正文' : 'Candidate prose'}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-main">{candidate.proseBody}</p>
        </div>
        <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
            {locale === 'zh-CN' ? '差异摘要' : 'Diff summary'}
          </p>
          <p className="mt-1 text-sm leading-6 text-text-main">{candidate.diffSummary}</p>
        </div>
        <div className="grid gap-2 text-sm text-text-muted">
          <p>{locale === 'zh-CN' ? `来源正文：${candidate.sourceProseDraftId}` : `Source prose: ${candidate.sourceProseDraftId}`}</p>
          <p>{locale === 'zh-CN' ? `来源补丁：${candidate.sourceCanonPatchId}` : `Source patch: ${candidate.sourceCanonPatchId}`}</p>
          <p>{locale === 'zh-CN' ? `上下文包：${candidate.contextPacketId}` : `Context packet: ${candidate.contextPacketId}`}</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAcceptRevision}
            disabled={isAcceptingRevision}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {locale === 'zh-CN' ? '接受修订' : 'Accept Revision'}
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

export function ProseStatusFooter({ prose, selectedMode }: Pick<SceneProseTabProps, 'prose' | 'selectedMode'>) {
  const { locale } = useI18n()
  const revisionQueueCount = prose.revisionQueueCount ?? 0
  const hasDraft = Boolean(prose.proseDraft?.trim())
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
          <Badge tone="neutral">{getDraftWordCountLabel(locale, hasDraft, prose.proseDraft, prose.draftWordCount)}</Badge>
          <Badge tone="accent">{revisionLabel}</Badge>
          {revisionQueueCount > 0 ? (
            <Badge tone="accent">{locale === 'zh-CN' ? `队列 ${revisionQueueCount}` : `Queue ${revisionQueueCount}`}</Badge>
          ) : null}
        </div>
        <div className="space-y-1 text-right">
          <p className="text-sm text-text-main">
            {prose.statusLabel ??
              (hasDraft ? (locale === 'zh-CN' ? '可进入修订轮次' : 'Ready for revision pass') : locale === 'zh-CN' ? '等待正文产物' : 'Waiting for prose artifact')}
          </p>
          <p className="text-sm text-text-muted">
            {prose.latestDiffSummary ??
              (hasDraft
                ? locale === 'zh-CN'
                  ? '尚未请求新的正文修订。'
                  : 'No prose revision requested yet.'
                : locale === 'zh-CN'
                  ? '当前还没有可进入 chapter / book draft 装配的正文。'
                  : 'No manuscript draft has been materialized for assembly yet.')}
          </p>
        </div>
      </div>
    </StickyFooter>
  )
}

export function SceneProseTab({
  prose,
  selectedMode,
  revisionBrief,
  isRevisionBriefTooLong,
  isFocusModeActive,
  isRevising,
  isAcceptingRevision,
  canReviseDraft,
  onSelectMode,
  onRevisionBriefChange,
  onToggleFocusMode,
  onRevise,
  onAcceptRevision,
}: SceneProseTabProps) {
  const { locale } = useI18n()
  const pendingDiffSummary = prose.revisionCandidate?.diffSummary ?? prose.latestDiffSummary

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
            revisionBrief={revisionBrief}
            isRevisionBriefTooLong={isRevisionBriefTooLong}
            isRevising={isRevising}
            canReviseDraft={canReviseDraft}
            onSelectMode={onSelectMode}
            onRevisionBriefChange={onRevisionBriefChange}
            onRevise={onRevise}
            hasPendingRevisionCandidate={Boolean(prose.revisionCandidate)}
          />
          <PendingRevisionCandidateCard
            prose={prose}
            isAcceptingRevision={isAcceptingRevision}
            onAcceptRevision={onAcceptRevision}
          />
          <SectionCard eyebrow={locale === 'zh-CN' ? '差异摘要' : 'Diff Summary'} title={locale === 'zh-CN' ? '最新修订' : 'Latest Revision'}>
            <p className="text-sm leading-6 text-text-muted">
              {pendingDiffSummary ?? (locale === 'zh-CN' ? '尚未请求新的正文修订。' : 'No prose revision requested yet.')}
            </p>
          </SectionCard>
          <ProseSourceSummary traceSummary={prose.traceSummary} />
        </div>
      </div>
      <ProseStatusFooter prose={prose} selectedMode={selectedMode} />
    </div>
  )
}

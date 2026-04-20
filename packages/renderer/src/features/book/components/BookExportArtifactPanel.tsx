import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'

import { useI18n } from '@/app/i18n'
import { cn } from '@/lib/cn'

import type { BookExportArtifactFormat } from '../api/book-export-artifact-records'
import type {
  BookExportArtifactSummaryViewModel,
  BookExportArtifactWorkspaceViewModel,
} from '../types/book-export-artifact-view-models'
import { BookExportArtifactGate } from './BookExportArtifactGate'

export interface BookExportArtifactPanelProps {
  artifactWorkspace: BookExportArtifactWorkspaceViewModel | null
  selectedFormat: BookExportArtifactFormat
  isBuilding?: boolean
  buildErrorMessage?: string | null
  onSelectFormat?: (format: BookExportArtifactFormat) => void
  onBuildArtifact?: () => void
  onCopyArtifact?: (artifact: BookExportArtifactSummaryViewModel) => void
  onDownloadArtifact?: (artifact: BookExportArtifactSummaryViewModel) => void
}

const formatOptions: Array<{ format: BookExportArtifactFormat; label: { en: string; 'zh-CN': string } }> = [
  { format: 'markdown', label: { en: 'Markdown', 'zh-CN': 'Markdown' } },
  { format: 'plain_text', label: { en: 'Plain text', 'zh-CN': 'Plain text' } },
]

function formatLabel(locale: 'en' | 'zh-CN', format: BookExportArtifactFormat) {
  return formatOptions.find((option) => option.format === format)?.label[locale] ?? format
}

function extensionForFormat(format: BookExportArtifactFormat) {
  return format === 'markdown' ? 'md' : 'txt'
}

function buildLabel(locale: 'en' | 'zh-CN', format: BookExportArtifactFormat) {
  const label = format === 'markdown' ? 'Markdown' : 'plain text'
  return locale === 'zh-CN' ? `构建 ${label} package` : `Build ${label} package`
}

function readinessBadge(locale: 'en' | 'zh-CN', status: BookExportArtifactSummaryViewModel['readinessStatus']) {
  if (status === 'blocked') {
    return { tone: 'danger' as const, label: locale === 'zh-CN' ? '阻塞' : 'Blocked' }
  }
  if (status === 'attention') {
    return { tone: 'warn' as const, label: locale === 'zh-CN' ? '需关注' : 'Attention' }
  }

  return { tone: 'success' as const, label: locale === 'zh-CN' ? '已就绪' : 'Ready' }
}

function ArtifactMetadata({ artifact }: { artifact: BookExportArtifactSummaryViewModel }) {
  const { locale } = useI18n()
  const readiness = readinessBadge(locale, artifact.readinessStatus)

  return (
    <FactList
      items={[
        {
          id: 'artifact-format',
          label: locale === 'zh-CN' ? '格式' : 'Format',
          value: formatLabel(locale, artifact.format),
        },
        {
          id: 'artifact-created-at',
          label: locale === 'zh-CN' ? '构建时间' : 'Created',
          value: artifact.createdAtLabel,
        },
        {
          id: 'artifact-created-by',
          label: locale === 'zh-CN' ? '构建者' : 'Created by',
          value: artifact.createdByLabel,
        },
        {
          id: 'artifact-readiness',
          label: locale === 'zh-CN' ? '准备度快照' : 'Readiness snapshot',
          value: readiness.label,
        },
      ]}
    />
  )
}

export function BookExportArtifactPanel({
  artifactWorkspace,
  selectedFormat,
  isBuilding = false,
  buildErrorMessage = null,
  onSelectFormat,
  onBuildArtifact,
  onCopyArtifact,
  onDownloadArtifact,
}: BookExportArtifactPanelProps) {
  const { locale } = useI18n()
  const latestArtifact = artifactWorkspace?.latestArtifact ?? null
  const recentArtifacts = artifactWorkspace?.artifacts.filter((artifact) => artifact.artifactId !== latestArtifact?.artifactId).slice(0, 3) ?? []
  const canSelectFormat = Boolean(artifactWorkspace && onSelectFormat)
  const canBuild = Boolean(artifactWorkspace?.gate.canBuild && onBuildArtifact) && !isBuilding

  return (
    <section className="space-y-4 rounded-md border border-line-soft bg-surface-1 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? 'Artifact builder' : 'Artifact builder'}</h4>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            {locale === 'zh-CN'
              ? '在本地构建 Markdown 或纯文本 package；实际复制和下载由外层处理。'
              : 'Build a local Markdown or plain text package; copy and download are handled by the container.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBuildArtifact}
          disabled={!canBuild}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium',
            canBuild ? 'bg-accent text-white hover:opacity-90' : 'cursor-not-allowed bg-surface-2 text-text-soft',
          )}
        >
          {isBuilding ? (locale === 'zh-CN' ? '构建中...' : 'Building package...') : buildLabel(locale, selectedFormat)}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {formatOptions.map((option) => (
          <button
            key={option.format}
            type="button"
            aria-pressed={selectedFormat === option.format}
            disabled={!canSelectFormat}
            onClick={() => onSelectFormat?.(option.format)}
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              selectedFormat === option.format
                ? 'border-line-strong bg-surface-2 text-text-main shadow-sm'
                : 'border-line-soft text-text-muted hover:bg-surface-2 hover:text-text-main',
              !canSelectFormat ? 'cursor-not-allowed opacity-60 hover:bg-transparent hover:text-text-muted' : '',
            )}
          >
            {option.label[locale]}
          </button>
        ))}
      </div>

      {buildErrorMessage ? (
        <p className="rounded-md border border-danger/20 bg-[rgba(162,78,69,0.08)] px-3 py-2 text-sm leading-6 text-danger">
          {buildErrorMessage}
        </p>
      ) : null}

      {artifactWorkspace ? (
        <BookExportArtifactGate gate={artifactWorkspace.gate} />
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? 'Artifact gate 不可用' : 'Artifact gate unavailable'}
          message={
            locale === 'zh-CN'
              ? '等待 export preview 和 review gate 数据后才能构建 artifact。'
              : 'Artifact building waits for export preview and review gate data.'
          }
        />
      )}

      {latestArtifact ? (
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h5 className="text-base text-text-main">{locale === 'zh-CN' ? 'Latest artifact' : 'Latest artifact'}</h5>
              <p className="mt-1 break-all text-sm font-medium text-text-main">{latestArtifact.filename}</p>
              <p className="mt-2 text-sm font-medium text-text-main">{latestArtifact.title}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">{latestArtifact.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={latestArtifact.isStale ? 'warn' : 'success'}>
                {latestArtifact.isStale ? (locale === 'zh-CN' ? '已过期' : 'Stale') : locale === 'zh-CN' ? '当前' : 'Current'}
              </Badge>
              <Badge tone={readinessBadge(locale, latestArtifact.readinessStatus).tone}>
                {readinessBadge(locale, latestArtifact.readinessStatus).label}
              </Badge>
            </div>
          </div>
          <div className="mt-3">
            <ArtifactMetadata artifact={latestArtifact} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">
              {locale === 'zh-CN' ? `${latestArtifact.chapterCount} 章` : `${latestArtifact.chapterCount} chapters`}
            </Badge>
            <Badge tone="neutral">
              {locale === 'zh-CN' ? `${latestArtifact.sceneCount} 场景` : `${latestArtifact.sceneCount} scenes`}
            </Badge>
            <Badge tone="neutral">
              {locale === 'zh-CN' ? `${latestArtifact.wordCount} 词` : `${latestArtifact.wordCount} words`}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line-soft pt-3">
            <button
              type="button"
              disabled={!onCopyArtifact}
              onClick={() => onCopyArtifact?.(latestArtifact)}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locale === 'zh-CN' ? '复制 package 文本' : 'Copy package text'}
            </button>
            <button
              type="button"
              disabled={!onDownloadArtifact}
              onClick={() => onDownloadArtifact?.(latestArtifact)}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locale === 'zh-CN' ? `下载 .${extensionForFormat(latestArtifact.format)}` : `Download .${extensionForFormat(latestArtifact.format)}`}
            </button>
          </div>
        </section>
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? '还没有 artifact' : 'No artifact built yet'}
          message={
            locale === 'zh-CN'
              ? '选择格式并通过 gate 后，可以构建第一个本地 package。'
              : 'Choose a format and pass the gate before building the first local package.'
          }
        />
      )}

      {recentArtifacts.length ? (
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <h5 className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '最近 artifact' : 'Recent artifacts'}</h5>
          <ul className="mt-3 space-y-2">
            {recentArtifacts.map((artifact) => (
              <li key={artifact.artifactId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line-soft bg-surface-1 px-3 py-2">
                <span className="break-all text-sm text-text-main">{artifact.filename}</span>
                <span className="text-xs text-text-muted">{artifact.createdAtLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}

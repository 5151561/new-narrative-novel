import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'

import {
  getCompareChapterStatus,
  getCompareChapterStatusBadge,
} from '../lib/book-draft-compare-presentation'
import type {
  BookManuscriptCompareSceneViewModel,
  BookManuscriptCompareWorkspaceViewModel,
} from '../types/book-compare-view-models'

interface BookDraftCompareViewProps {
  compare: BookManuscriptCompareWorkspaceViewModel | null
  errorMessage?: string | null
  onSelectChapter: (chapterId: string) => void
  onOpenChapter: (chapterId: string, lens: 'structure' | 'draft') => void
}

function getChapterLabel(locale: 'en' | 'zh-CN', order: number) {
  return locale === 'zh-CN' ? `第 ${order} 章` : `Chapter ${order}`
}

function formatWordDelta(locale: 'en' | 'zh-CN', value: number) {
  const prefix = value > 0 ? '+' : ''
  return locale === 'zh-CN' ? `字数变化 ${prefix}${value}` : `Word delta ${prefix}${value}`
}

function getDeltaLabel(locale: 'en' | 'zh-CN', delta: BookManuscriptCompareSceneViewModel['delta']) {
  if (locale === 'zh-CN') {
    return delta === 'added'
      ? '新增'
      : delta === 'missing'
        ? '缺失'
        : delta === 'draft_missing'
          ? '当前缺稿'
          : delta === 'changed'
            ? '已变更'
            : '未变化'
  }

  return delta === 'added'
    ? 'Added'
    : delta === 'missing'
      ? 'Missing'
      : delta === 'draft_missing'
        ? 'Draft missing'
        : delta === 'changed'
          ? 'Changed'
          : 'Unchanged'
}

function renderExcerpt(label: string, value: string | undefined) {
  return (
    <div className="space-y-1 rounded-md border border-line-soft bg-surface-1 p-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{label}</p>
      <p className="text-sm leading-6 text-text-muted">{value ?? '—'}</p>
    </div>
  )
}

export function BookDraftCompareView({
  compare,
  errorMessage = null,
  onSelectChapter,
  onOpenChapter,
}: BookDraftCompareViewProps) {
  const { locale } = useI18n()

  if (!compare) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PaneHeader
          title={locale === 'zh-CN' ? '手稿 Compare' : 'Book manuscript compare'}
          description={
            locale === 'zh-CN'
              ? '当前 checkpoint 不可用。'
              : 'The current checkpoint is unavailable.'
          }
        />
        <div className="p-6">
          <EmptyState
            title={locale === 'zh-CN' ? 'Compare 不可用' : 'Compare unavailable'}
            message={
              errorMessage ??
              (locale === 'zh-CN'
                ? '请选择其他 checkpoint，或稍后重新载入。'
                : 'Choose another checkpoint or retry after the compare data finishes loading.')
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '手稿 Compare' : 'Book manuscript compare'}
        description={
          locale === 'zh-CN'
            ? `对照 ${compare.checkpoint.title} 审阅章节与场景差异。`
            : `Review chapter and scene deltas against ${compare.checkpoint.title}.`
        }
      />
      <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-3">
          {compare.chapters.map((chapter) => {
            const status = getCompareChapterStatusBadge(getCompareChapterStatus(chapter), locale)
            const active = chapter.chapterId === compare.selectedChapterId

            return (
              <article
                key={chapter.chapterId}
                className={`rounded-md border ${active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-1'}`}
              >
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`${getChapterLabel(locale, chapter.order)} ${chapter.title}`}
                  onClick={() => onSelectChapter(chapter.chapterId)}
                  className="w-full rounded-md px-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {getChapterLabel(locale, chapter.order)}
                      </p>
                      <h3 className="mt-1 text-base text-text-main">{chapter.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{chapter.summary}</p>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                    <Badge tone="neutral">{locale === 'zh-CN' ? `变更 ${chapter.totals.changedCount}` : `Changed ${chapter.totals.changedCount}`}</Badge>
                    <Badge tone="neutral">{locale === 'zh-CN' ? `新增 ${chapter.totals.addedCount}` : `Added ${chapter.totals.addedCount}`}</Badge>
                    <Badge tone="neutral">{locale === 'zh-CN' ? `缺失 ${chapter.totals.missingCount}` : `Missing ${chapter.totals.missingCount}`}</Badge>
                    <Badge tone="neutral">{formatWordDelta(locale, chapter.wordDelta)}</Badge>
                    <Badge tone={chapter.traceRegressionCount > 0 ? 'warn' : 'success'}>
                      {locale === 'zh-CN'
                        ? `溯源回退 ${chapter.traceRegressionCount}`
                        : `Trace regressions ${chapter.traceRegressionCount}`}
                    </Badge>
                    <Badge tone={chapter.warningsDelta > 0 ? 'warn' : 'neutral'}>
                      {locale === 'zh-CN'
                        ? `警告变化 ${chapter.warningsDelta > 0 ? '+' : ''}${chapter.warningsDelta}`
                        : `Warnings ${chapter.warningsDelta > 0 ? '+' : ''}${chapter.warningsDelta}`}
                    </Badge>
                  </div>
                </button>
                <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-4 py-3">
                  <button
                    type="button"
                    aria-label={`${locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}: ${chapter.title}`}
                    onClick={() => onOpenChapter(chapter.chapterId, 'draft')}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                  >
                    {locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}
                  </button>
                  <button
                    type="button"
                    aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${chapter.title}`}
                    onClick={() => onOpenChapter(chapter.chapterId, 'structure')}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                  >
                    {locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
        <section className="rounded-md border border-line-soft bg-surface-1 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                {locale === 'zh-CN' ? '选中章节' : 'Selected chapter'}
              </p>
              <h3 className="mt-1 text-lg text-text-main">{compare.selectedChapter?.title ?? compare.title}</h3>
            </div>
            {compare.selectedChapter ? (
              <Badge tone={getCompareChapterStatusBadge(getCompareChapterStatus(compare.selectedChapter), locale).tone}>
                {getCompareChapterStatusBadge(getCompareChapterStatus(compare.selectedChapter), locale).label}
              </Badge>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">{locale === 'zh-CN' ? `变更 ${compare.selectedChapter?.totals.changedCount ?? 0}` : `Changed ${compare.selectedChapter?.totals.changedCount ?? 0}`}</Badge>
            <Badge tone="neutral">{locale === 'zh-CN' ? `新增 ${compare.selectedChapter?.totals.addedCount ?? 0}` : `Added ${compare.selectedChapter?.totals.addedCount ?? 0}`}</Badge>
            <Badge tone="neutral">{locale === 'zh-CN' ? `缺失 ${compare.selectedChapter?.totals.missingCount ?? 0}` : `Missing ${compare.selectedChapter?.totals.missingCount ?? 0}`}</Badge>
            <Badge tone="neutral">
              {formatWordDelta(locale, compare.selectedChapter?.wordDelta ?? 0)}
            </Badge>
            <Badge tone={(compare.selectedChapter?.traceRegressionCount ?? 0) > 0 ? 'warn' : 'success'}>
              {locale === 'zh-CN'
                ? `溯源回退 ${compare.selectedChapter?.traceRegressionCount ?? 0}`
                : `Trace regressions ${compare.selectedChapter?.traceRegressionCount ?? 0}`}
            </Badge>
            <Badge tone={(compare.selectedChapter?.warningsDelta ?? 0) > 0 ? 'warn' : 'neutral'}>
              {locale === 'zh-CN'
                ? `警告变化 ${(compare.selectedChapter?.warningsDelta ?? 0) > 0 ? '+' : ''}${compare.selectedChapter?.warningsDelta ?? 0}`
                : `Warnings ${(compare.selectedChapter?.warningsDelta ?? 0) > 0 ? '+' : ''}${compare.selectedChapter?.warningsDelta ?? 0}`}
            </Badge>
          </div>
          <div className="mt-4 space-y-3">
            {compare.selectedChapter?.scenes.map((scene) => (
              <article key={scene.sceneId} className="rounded-md border border-line-soft bg-surface-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                      {locale === 'zh-CN' ? `场景 ${scene.order}` : `Scene ${scene.order}`}
                    </p>
                    <h4 className="mt-1 text-base text-text-main">{scene.title}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={scene.delta === 'missing' || scene.delta === 'draft_missing' ? 'warn' : scene.delta === 'unchanged' ? 'success' : 'accent'}>
                      {getDeltaLabel(locale, scene.delta)}
                    </Badge>
                    <Badge tone="neutral">{formatWordDelta(locale, scene.wordDelta)}</Badge>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {renderExcerpt(locale === 'zh-CN' ? '当前摘录' : 'Current excerpt', scene.currentExcerpt)}
                  {renderExcerpt(locale === 'zh-CN' ? 'Checkpoint 摘录' : 'Checkpoint excerpt', scene.checkpointExcerpt)}
                </div>
              </article>
            )) ?? null}
          </div>
        </section>
      </div>
    </div>
  )
}

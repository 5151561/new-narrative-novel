import { useEffect, useMemo, useRef, useState } from 'react'

import { useI18n } from '@/app/i18n'
import type { BookDraftView, BookLens, BookReviewFilter, BookStructureView } from '@/features/workbench/types/workbench-route'

interface BookWorkbenchActivityChapter {
  id: string
  title: string
  summary: string
}

export interface BookWorkbenchHandoffEvent {
  id: string
  bookId: string
  chapterTitle: string
  lens: 'structure' | 'draft'
}

interface BookWorkbenchCheckpoint {
  id: string
  title: string
  summary: string
}

interface BookWorkbenchExportProfile {
  id: string
  title: string
  summary: string
}

interface BookWorkbenchBranch {
  id: string
  title: string
  summary: string
}

interface BookWorkbenchBranchBaseline {
  id: string
  title: string
  kind: 'current' | 'checkpoint'
  checkpointId?: string
}

interface BookWorkbenchReviewIssue {
  id: string
  title: string
  sourceLabel: string
  chapterTitle?: string
  sceneTitle?: string
}

export interface BookWorkbenchReviewSourceEvent {
  id: string
  bookId: string
  issueTitle: string
  sourceActionLabel: string
}

export interface BookWorkbenchReviewDecisionEvent {
  id: string
  bookId: string
  issueTitle: string
  status: 'reviewed' | 'deferred' | 'dismissed' | 'reopened'
  note?: string
}

export interface BookWorkbenchReviewFixActionEvent {
  id: string
  bookId: string
  issueTitle: string
  action: 'started' | 'checked' | 'blocked' | 'cleared'
  sourceActionLabel?: string
  note?: string
}

export type BookWorkbenchActivityKind =
  | 'lens'
  | 'view'
  | 'chapter'
  | 'handoff'
  | 'draft-view'
  | 'checkpoint'
  | 'branch'
  | 'branch-baseline'
  | 'export-profile'
  | 'review-filter'
  | 'review-issue'
  | 'review-decision'
  | 'review-fix-action'
  | 'review-source'

interface BookWorkbenchActivityEntry {
  id: string
  kind: BookWorkbenchActivityKind
  tone: 'accent' | 'neutral'
  action:
    | 'entered-lens'
    | 'switched-lens'
    | 'entered-view'
    | 'switched-view'
    | 'focused-chapter'
    | 'opened-structure'
    | 'opened-draft'
    | 'entered-compare'
    | 'returned-read'
    | 'entered-export'
    | 'returned-compare'
    | 'selected-checkpoint'
    | 'entered-branch'
    | 'entered-review'
    | 'selected-branch'
    | 'selected-branch-baseline'
    | 'selected-export-profile'
    | 'selected-review-filter'
    | 'selected-review-issue'
    | 'marked-reviewed'
    | 'deferred-issue'
    | 'dismissed-issue'
    | 'reopened-issue'
    | 'started-source-fix'
    | 'marked-source-checked'
    | 'marked-source-blocked'
    | 'cleared-source-fix-action'
    | 'opened-review-source'
  lens?: BookLens
  view?: BookStructureView
  draftView?: BookDraftView
  reviewFilter?: BookReviewFilter
  chapterTitle?: string
  chapterSummary?: string
  checkpointTitle?: string
  checkpointSummary?: string
  branchTitle?: string
  branchSummary?: string
  branchBaselineTitle?: string
  branchBaselineKind?: 'current' | 'checkpoint'
  branchBaselineCheckpointId?: string
  exportProfileTitle?: string
  exportProfileSummary?: string
  reviewIssueTitle?: string
  reviewIssueSourceLabel?: string
  reviewIssueChapterTitle?: string
  reviewIssueSceneTitle?: string
  reviewDecisionNote?: string
  reviewFixActionNote?: string
  reviewSourceActionLabel?: string
}

export interface BookWorkbenchActivityItem {
  id: string
  kind: BookWorkbenchActivityKind
  title: string
  detail: string
  tone: 'accent' | 'neutral'
}

interface UseBookWorkbenchActivityOptions {
  bookId: string
  activeLens?: BookLens
  activeView: BookStructureView
  activeDraftView?: BookDraftView
  selectedReviewFilter?: BookReviewFilter
  selectedReviewIssue?: BookWorkbenchReviewIssue | null
  selectedCheckpoint?: BookWorkbenchCheckpoint | null
  selectedBranch?: BookWorkbenchBranch | null
  selectedBranchBaseline?: BookWorkbenchBranchBaseline | null
  selectedExportProfile?: BookWorkbenchExportProfile | null
  selectedChapter: BookWorkbenchActivityChapter | null
  latestHandoff?: BookWorkbenchHandoffEvent | null
  maxItems?: number
}

const rememberedBookHandoffsByBookId = new Map<string, BookWorkbenchActivityEntry[]>()
const rememberedBookReviewSourceByBookId = new Map<string, BookWorkbenchActivityEntry[]>()
const rememberedBookReviewDecisionByBookId = new Map<string, BookWorkbenchActivityEntry[]>()
const rememberedBookReviewFixActionByBookId = new Map<string, BookWorkbenchActivityEntry[]>()

function buildHandoffActivityEntry(event: BookWorkbenchHandoffEvent): BookWorkbenchActivityEntry {
  return {
    id: event.id,
    kind: 'handoff',
    tone: 'accent',
    action: event.lens === 'structure' ? 'opened-structure' : 'opened-draft',
    chapterTitle: event.chapterTitle,
  }
}

export function rememberBookWorkbenchHandoff(event: BookWorkbenchHandoffEvent, maxItems = 6) {
  const nextEntry = buildHandoffActivityEntry(event)
  const currentEntries = rememberedBookHandoffsByBookId.get(event.bookId) ?? []
  const dedupedEntries = currentEntries.filter((entry) => entry.id !== nextEntry.id)

  rememberedBookHandoffsByBookId.set(event.bookId, [nextEntry, ...dedupedEntries].slice(0, maxItems))
}

function buildReviewSourceActivityEntry(event: BookWorkbenchReviewSourceEvent): BookWorkbenchActivityEntry {
  return {
    id: event.id,
    kind: 'review-source',
    tone: 'neutral',
    action: 'opened-review-source',
    reviewIssueTitle: event.issueTitle,
    reviewSourceActionLabel: event.sourceActionLabel,
  }
}

export function rememberBookWorkbenchReviewSourceOpen(event: BookWorkbenchReviewSourceEvent, maxItems = 6) {
  const nextEntry = buildReviewSourceActivityEntry(event)
  const currentEntries = rememberedBookReviewSourceByBookId.get(event.bookId) ?? []
  const dedupedEntries = currentEntries.filter((entry) => entry.id !== nextEntry.id)

  rememberedBookReviewSourceByBookId.set(event.bookId, [nextEntry, ...dedupedEntries].slice(0, maxItems))
}

function buildReviewDecisionActivityEntry(event: BookWorkbenchReviewDecisionEvent): BookWorkbenchActivityEntry {
  return {
    id: event.id,
    kind: 'review-decision',
    tone: event.status === 'reviewed' ? 'accent' : 'neutral',
    action:
      event.status === 'reviewed'
        ? 'marked-reviewed'
        : event.status === 'deferred'
          ? 'deferred-issue'
          : event.status === 'dismissed'
            ? 'dismissed-issue'
            : 'reopened-issue',
    reviewIssueTitle: event.issueTitle,
    reviewDecisionNote: event.note,
  }
}

export function rememberBookWorkbenchReviewDecision(event: BookWorkbenchReviewDecisionEvent, maxItems = 6) {
  const nextEntry = buildReviewDecisionActivityEntry(event)
  const currentEntries = rememberedBookReviewDecisionByBookId.get(event.bookId) ?? []
  const dedupedEntries = currentEntries.filter((entry) => entry.id !== nextEntry.id)

  rememberedBookReviewDecisionByBookId.set(event.bookId, [nextEntry, ...dedupedEntries].slice(0, maxItems))
}

function buildReviewFixActionActivityEntry(event: BookWorkbenchReviewFixActionEvent): BookWorkbenchActivityEntry {
  return {
    id: event.id,
    kind: 'review-fix-action',
    tone: event.action === 'started' || event.action === 'checked' ? 'accent' : 'neutral',
    action:
      event.action === 'started'
        ? 'started-source-fix'
        : event.action === 'checked'
          ? 'marked-source-checked'
          : event.action === 'blocked'
            ? 'marked-source-blocked'
            : 'cleared-source-fix-action',
    reviewIssueTitle: event.issueTitle,
    reviewSourceActionLabel: event.sourceActionLabel,
    reviewFixActionNote: event.note,
  }
}

export function rememberBookWorkbenchReviewFixAction(event: BookWorkbenchReviewFixActionEvent, maxItems = 6) {
  const nextEntry = buildReviewFixActionActivityEntry(event)
  const currentEntries = rememberedBookReviewFixActionByBookId.get(event.bookId) ?? []
  const dedupedEntries = currentEntries.filter((entry) => entry.id !== nextEntry.id)

  rememberedBookReviewFixActionByBookId.set(event.bookId, [nextEntry, ...dedupedEntries].slice(0, maxItems))
}

export function resetRememberedBookWorkbenchHandoffs() {
  rememberedBookHandoffsByBookId.clear()
  rememberedBookReviewSourceByBookId.clear()
  rememberedBookReviewDecisionByBookId.clear()
  rememberedBookReviewFixActionByBookId.clear()
}

function getViewLabel(locale: 'en' | 'zh-CN', view: BookStructureView) {
  if (locale === 'zh-CN') {
    return view === 'sequence' ? '顺序' : view === 'outliner' ? '大纲' : '信号'
  }

  return view === 'sequence' ? 'Sequence' : view === 'outliner' ? 'Outliner' : 'Signals'
}

function getLensLabel(locale: 'en' | 'zh-CN', lens: 'structure' | 'draft') {
  if (locale === 'zh-CN') {
    return lens === 'structure' ? '结构' : '成稿'
  }

  return lens === 'structure' ? 'Structure' : 'Draft'
}

function getReviewFilterLabel(locale: 'en' | 'zh-CN', filter: BookReviewFilter) {
  if (locale === 'zh-CN') {
    return filter === 'all'
      ? '全部'
      : filter === 'blockers'
        ? '阻塞项'
        : filter === 'trace-gaps'
          ? '溯源缺口'
          : filter === 'missing-drafts'
            ? '缺稿'
            : filter === 'compare-deltas'
              ? 'Compare 差异'
              : filter === 'export-readiness'
                ? '导出准备度'
                : filter === 'branch-readiness'
                  ? '实验稿准备度'
                  : '场景提案'
  }

  return filter === 'all'
    ? 'All'
    : filter === 'blockers'
      ? 'Blockers'
      : filter === 'trace-gaps'
        ? 'Trace gaps'
        : filter === 'missing-drafts'
          ? 'Missing drafts'
          : filter === 'compare-deltas'
            ? 'Compare deltas'
            : filter === 'export-readiness'
              ? 'Export readiness'
              : filter === 'branch-readiness'
                ? 'Branch readiness'
                : 'Scene proposals'
}

function localizeActivityEntry(
  entry: BookWorkbenchActivityEntry,
  locale: 'en' | 'zh-CN',
): BookWorkbenchActivityItem {
  if (entry.kind === 'lens' && entry.lens) {
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `${entry.action === 'entered-lens' ? '进入' : '切换到'}${getLensLabel(locale, entry.lens)}`
          : `${entry.action === 'entered-lens' ? 'Entered' : 'Switched to'} ${getLensLabel(locale, entry.lens)}`,
      detail:
        locale === 'zh-CN'
          ? '书籍工作区继续保持 lens 与章节焦点都由路由拥有。'
          : 'The book workspace keeps the active lens and selected chapter route-owned.',
    }
  }

  if (entry.kind === 'view' && entry.view) {
    const viewLabel = getViewLabel(locale, entry.view)
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `${entry.action === 'entered-view' ? '进入' : '切换到'}${viewLabel}`
          : `${entry.action === 'entered-view' ? 'Entered' : 'Switched to'} ${viewLabel}`,
      detail:
        locale === 'zh-CN'
          ? '底部日志只记录书籍工作区里的视图切换，不接管路由。'
          : 'The dock records book-stage switches without owning route state.',
    }
  }

  if (entry.kind === 'handoff') {
    const lens = entry.action === 'opened-structure' ? 'structure' : 'draft'
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `在${getLensLabel(locale, lens)}中打开 ${entry.chapterTitle ?? ''}`
          : `Opened ${entry.chapterTitle ?? ''} in ${getLensLabel(locale, lens)}`,
      detail:
        locale === 'zh-CN'
          ? 'Chapter handoff 仍由路由接管，底部面板只保留本次会话日志。'
          : 'Chapter handoff stays route-owned while the dock keeps only session-local history.',
    }
  }

  if (entry.kind === 'draft-view' && entry.draftView) {
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? entry.action === 'entered-compare'
            ? '进入 Compare'
            : entry.action === 'entered-branch'
              ? '进入实验稿审阅'
            : entry.action === 'entered-review'
              ? '进入 Review'
            : entry.action === 'entered-export'
              ? '进入导出预览'
              : entry.action === 'returned-compare'
                ? '返回 Compare'
                : '返回 Read'
          : entry.action === 'entered-compare'
            ? 'Entered Compare'
            : entry.action === 'entered-branch'
              ? 'Entered Branch Review'
            : entry.action === 'entered-review'
              ? 'Entered Review'
            : entry.action === 'entered-export'
              ? 'Entered Export Preview'
              : entry.action === 'returned-compare'
                ? 'Returned to Compare'
                : 'Returned to Read',
      detail:
        locale === 'zh-CN'
          ? entry.draftView === 'compare'
            ? 'Compare 面板继续把 checkpoint 与章节焦点交给路由。'
            : entry.draftView === 'branch'
              ? '实验稿审阅继续把 branch 选择与 baseline 都交给路由。'
            : entry.draftView === 'review'
              ? 'Review 继续把筛选器与问题选择交给路由。'
            : entry.draftView === 'export'
              ? 'Export 预览继续把 chapter focus 与 export profile 交给路由。'
            : 'Read 面板恢复连续阅读，不接管结构视图。'
          : entry.draftView === 'compare'
            ? 'Compare keeps checkpoint and chapter focus route-owned.'
            : entry.draftView === 'branch'
              ? 'Branch review keeps branch selection and baseline route-owned.'
            : entry.draftView === 'review'
              ? 'Review keeps filter and issue selection route-owned.'
            : entry.draftView === 'export'
              ? 'Export preview keeps chapter focus and profile selection route-owned.'
            : 'Read mode restores the manuscript reader without taking over the dormant structure view.',
    }
  }

  if (entry.kind === 'checkpoint') {
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `选择 checkpoint ${entry.checkpointTitle ?? ''}`
          : `Selected checkpoint ${entry.checkpointTitle ?? ''}`,
      detail: entry.checkpointSummary ?? '',
    }
  }

  if (entry.kind === 'branch') {
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `选择实验稿 ${entry.branchTitle ?? ''}`
          : `Selected branch ${entry.branchTitle ?? ''}`,
      detail: entry.branchSummary ?? '',
    }
  }

  if (entry.kind === 'branch-baseline') {
    const checkpointDetail =
      entry.branchBaselineCheckpointId && entry.branchBaselineTitle
        ? locale === 'zh-CN'
          ? `相对${entry.branchBaselineTitle}继续复核分支差异（${entry.branchBaselineCheckpointId}）。`
          : `Review branch deltas against ${entry.branchBaselineTitle} (${entry.branchBaselineCheckpointId}).`
        : entry.branchBaselineTitle
          ? locale === 'zh-CN'
            ? `相对${entry.branchBaselineTitle}继续复核分支差异。`
            : `Review branch deltas against ${entry.branchBaselineTitle}.`
          : locale === 'zh-CN'
            ? '继续相对 checkpoint 手稿基线复核分支差异。'
            : 'Review branch deltas against the checkpoint manuscript baseline.'

    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `选择${entry.branchBaselineTitle ?? ''}`
          : `Selected ${entry.branchBaselineTitle?.toLowerCase() ?? 'branch baseline'}`,
      detail:
        entry.branchBaselineKind === 'current'
          ? locale === 'zh-CN'
            ? '继续以当前正文作为实验稿审阅基线。'
            : 'Keep the current manuscript as the branch review baseline.'
          : checkpointDetail,
    }
  }

  if (entry.kind === 'export-profile') {
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `选择导出配置 ${entry.exportProfileTitle ?? ''}`
          : `Selected export profile ${entry.exportProfileTitle ?? ''}`,
      detail: entry.exportProfileSummary ?? '',
    }
  }

  if (entry.kind === 'review-filter' && entry.reviewFilter) {
    const filterLabel = getReviewFilterLabel(locale, entry.reviewFilter)

    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `选择筛选器 ${filterLabel}`
          : `Selected review filter ${filterLabel}`,
      detail:
        locale === 'zh-CN'
          ? 'Review 队列继续把当前筛选器保留在 route state 中。'
          : 'The review queue keeps the active filter in route state.',
    }
  }

  if (entry.kind === 'review-issue') {
    const anchor = [entry.reviewIssueChapterTitle, entry.reviewIssueSceneTitle].filter(Boolean).join(' / ')

    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `选择审阅问题 ${entry.reviewIssueTitle ?? ''}`
          : `Selected review issue ${entry.reviewIssueTitle ?? ''}`,
      detail: anchor || entry.reviewIssueSourceLabel || '',
    }
  }

  if (entry.kind === 'review-decision') {
    const verb =
      entry.action === 'marked-reviewed'
        ? locale === 'zh-CN'
          ? '标记已阅'
          : 'Marked reviewed'
        : entry.action === 'deferred-issue'
          ? locale === 'zh-CN'
            ? '暂缓问题'
            : 'Deferred issue'
          : entry.action === 'dismissed-issue'
            ? locale === 'zh-CN'
              ? '本轮忽略'
              : 'Dismissed issue'
            : locale === 'zh-CN'
              ? '重新打开问题'
              : 'Reopened issue'

    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title: `${verb} ${entry.reviewIssueTitle ?? ''}`.trim(),
      detail:
        entry.reviewDecisionNote ??
        (locale === 'zh-CN'
          ? 'Review 决策保持会话级活动记录，不接管 issue 真源。'
          : 'Review decisions stay session-local in activity without becoming the source of truth.'),
    }
  }

  if (entry.kind === 'review-fix-action') {
    const verb =
      entry.action === 'started-source-fix'
        ? locale === 'zh-CN'
          ? '开始来源修复'
          : 'Started source fix'
        : entry.action === 'marked-source-checked'
          ? locale === 'zh-CN'
            ? '标记来源已检查'
            : 'Marked source checked'
          : entry.action === 'marked-source-blocked'
            ? locale === 'zh-CN'
              ? '标记来源阻塞'
              : 'Marked source blocked'
            : locale === 'zh-CN'
              ? '清除来源修复动作'
              : 'Cleared source fix action'
    const sourceDetail = entry.reviewSourceActionLabel
      ? locale === 'zh-CN'
        ? `来源动作：${entry.reviewSourceActionLabel}`
        : `Source action: ${entry.reviewSourceActionLabel}`
      : locale === 'zh-CN'
        ? '来源修复动作保持独立，不修改 review decision。'
        : 'Source fix action remains independent from the review decision.'

    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title: `${verb} ${entry.reviewIssueTitle ?? ''}`.trim(),
      detail: entry.reviewFixActionNote ?? sourceDetail,
    }
  }

  if (entry.kind === 'review-source') {
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `打开问题来源 ${entry.reviewSourceActionLabel ?? ''}`
          : `Opened issue source ${entry.reviewSourceActionLabel ?? ''}`,
      detail: entry.reviewIssueTitle ?? '',
    }
  }

  return {
    id: entry.id,
    kind: entry.kind,
    tone: entry.tone,
    title: locale === 'zh-CN' ? `聚焦${entry.chapterTitle ?? ''}` : `Focused ${entry.chapterTitle ?? ''}`,
    detail: entry.chapterSummary ?? '',
  }
}

export function useBookWorkbenchActivity({
  bookId,
  activeLens = 'structure',
  activeView,
  activeDraftView = 'read',
  selectedReviewFilter = 'all',
  selectedReviewIssue = null,
  selectedCheckpoint = null,
  selectedBranch = null,
  selectedBranchBaseline = null,
  selectedExportProfile = null,
  selectedChapter,
  latestHandoff = null,
  maxItems = 6,
}: UseBookWorkbenchActivityOptions) {
  const { locale } = useI18n()
  const [activity, setActivity] = useState<BookWorkbenchActivityEntry[]>([])
  const lastBookIdRef = useRef<string | null>(null)
  const lastLocaleRef = useRef<'en' | 'zh-CN' | null>(null)
  const lastLensRef = useRef<BookLens | null>(null)
  const lastViewRef = useRef<BookStructureView | null>(null)
  const lastDraftViewRef = useRef<BookDraftView | null>(null)
  const lastReviewFilterRef = useRef<BookReviewFilter | null>(null)
  const lastReviewIssueIdRef = useRef<string | null>(null)
  const lastCheckpointIdRef = useRef<string | null>(null)
  const lastBranchIdRef = useRef<string | null>(null)
  const lastBranchBaselineIdRef = useRef<string | null>(null)
  const lastExportProfileIdRef = useRef<string | null>(null)
  const lastChapterIdRef = useRef<string | null>(null)
  const seenHandoffIdsRef = useRef<Set<string>>(new Set())
  const seenReviewSourceIdsRef = useRef<Set<string>>(new Set())
  const seenReviewDecisionIdsRef = useRef<Set<string>>(new Set())
  const seenReviewFixActionIdsRef = useRef<Set<string>>(new Set())
  const sequenceRef = useRef(0)

  useEffect(() => {
    const bookChanged = lastBookIdRef.current !== bookId
    const localeInitialized = lastLocaleRef.current !== null
    const localeChanged = localeInitialized && lastLocaleRef.current !== locale
    const nextEntries: BookWorkbenchActivityEntry[] = []

    if (lastLocaleRef.current === null) {
      lastLocaleRef.current = locale
    }

    if (bookChanged || localeChanged) {
      lastBookIdRef.current = bookId
      lastLocaleRef.current = locale
      lastLensRef.current = null
      lastViewRef.current = null
      lastDraftViewRef.current = null
      lastReviewFilterRef.current = null
      lastReviewIssueIdRef.current = null
      lastCheckpointIdRef.current = null
      lastBranchIdRef.current = null
      lastBranchBaselineIdRef.current = null
      lastExportProfileIdRef.current = null
      lastChapterIdRef.current = null
      seenHandoffIdsRef.current = new Set()
      seenReviewSourceIdsRef.current = new Set()
      seenReviewDecisionIdsRef.current = new Set()
      seenReviewFixActionIdsRef.current = new Set()
      sequenceRef.current = 0

      if (localeChanged) {
        setActivity([])
        return
      }
    }

    if (activeLens === 'draft') {
      if (lastLensRef.current !== activeLens) {
        nextEntries.push({
          id: `lens-${sequenceRef.current++}`,
          kind: 'lens',
          tone: 'accent',
          action: lastLensRef.current === null ? 'entered-lens' : 'switched-lens',
          lens: activeLens,
        })
      }
      lastLensRef.current = activeLens
      lastViewRef.current = activeView

      if (lastDraftViewRef.current !== activeDraftView) {
        if (activeDraftView === 'compare') {
          nextEntries.push({
            id: `draft-view-${sequenceRef.current++}`,
            kind: 'draft-view',
            tone: lastDraftViewRef.current === 'export' ? 'neutral' : 'accent',
            action: lastDraftViewRef.current === 'export' ? 'returned-compare' : 'entered-compare',
            draftView: activeDraftView,
          })
        } else if (activeDraftView === 'branch') {
          nextEntries.push({
            id: `draft-view-${sequenceRef.current++}`,
            kind: 'draft-view',
            tone: 'accent',
            action: 'entered-branch',
            draftView: activeDraftView,
          })
        } else if (activeDraftView === 'review') {
          nextEntries.push({
            id: `draft-view-${sequenceRef.current++}`,
            kind: 'draft-view',
            tone: 'accent',
            action: 'entered-review',
            draftView: activeDraftView,
          })
        } else if (activeDraftView === 'export') {
          nextEntries.push({
            id: `draft-view-${sequenceRef.current++}`,
            kind: 'draft-view',
            tone: 'accent',
            action: 'entered-export',
            draftView: activeDraftView,
          })
        } else if (
          activeDraftView === 'read' &&
          (
            lastDraftViewRef.current === 'compare' ||
            lastDraftViewRef.current === 'branch' ||
            lastDraftViewRef.current === 'export' ||
            lastDraftViewRef.current === 'review'
          )
        ) {
          nextEntries.push({
            id: `draft-view-${sequenceRef.current++}`,
            kind: 'draft-view',
            tone: 'neutral',
            action: 'returned-read',
            draftView: activeDraftView,
          })
        }
        lastDraftViewRef.current = activeDraftView
      }

      if (activeDraftView === 'review' && lastReviewFilterRef.current !== selectedReviewFilter) {
        nextEntries.push({
          id: `review-filter-${sequenceRef.current++}`,
          kind: 'review-filter',
          tone: 'neutral',
          action: 'selected-review-filter',
          reviewFilter: selectedReviewFilter,
        })
        lastReviewFilterRef.current = selectedReviewFilter
      }

      const reviewIssueId = selectedReviewIssue?.id ?? null
      if (activeDraftView === 'review' && selectedReviewIssue && lastReviewIssueIdRef.current !== reviewIssueId) {
        nextEntries.push({
          id: `review-issue-${sequenceRef.current++}`,
          kind: 'review-issue',
          tone: 'neutral',
          action: 'selected-review-issue',
          reviewIssueTitle: selectedReviewIssue.title,
          reviewIssueSourceLabel: selectedReviewIssue.sourceLabel,
          reviewIssueChapterTitle: selectedReviewIssue.chapterTitle,
          reviewIssueSceneTitle: selectedReviewIssue.sceneTitle,
        })
        lastReviewIssueIdRef.current = reviewIssueId
      } else if (activeDraftView !== 'review') {
        lastReviewIssueIdRef.current = reviewIssueId
        lastReviewFilterRef.current = selectedReviewFilter
      }

      const checkpointId = selectedCheckpoint?.id ?? null
      if (
        activeDraftView === 'compare' &&
        selectedCheckpoint &&
        lastCheckpointIdRef.current !== checkpointId
      ) {
        nextEntries.push({
          id: `checkpoint-${sequenceRef.current++}`,
          kind: 'checkpoint',
          tone: 'neutral',
          action: 'selected-checkpoint',
          checkpointTitle: selectedCheckpoint.title,
          checkpointSummary: selectedCheckpoint.summary,
        })
        lastCheckpointIdRef.current = checkpointId
      } else if (activeDraftView !== 'compare') {
        lastCheckpointIdRef.current = checkpointId
      }

      const branchId = selectedBranch?.id ?? null
      if (activeDraftView === 'branch' && selectedBranch && lastBranchIdRef.current !== branchId) {
        nextEntries.push({
          id: `branch-${sequenceRef.current++}`,
          kind: 'branch',
          tone: 'neutral',
          action: 'selected-branch',
          branchTitle: selectedBranch.title,
          branchSummary: selectedBranch.summary,
        })
        lastBranchIdRef.current = branchId
      } else if (activeDraftView !== 'branch') {
        lastBranchIdRef.current = branchId
      }

      const branchBaselineId = selectedBranchBaseline?.id ?? null
      if (
        activeDraftView === 'branch' &&
        selectedBranchBaseline &&
        lastBranchBaselineIdRef.current !== branchBaselineId
      ) {
        nextEntries.push({
          id: `branch-baseline-${sequenceRef.current++}`,
          kind: 'branch-baseline',
          tone: 'neutral',
          action: 'selected-branch-baseline',
          branchBaselineTitle: selectedBranchBaseline.title,
          branchBaselineKind: selectedBranchBaseline.kind,
          branchBaselineCheckpointId: selectedBranchBaseline.checkpointId,
        })
        lastBranchBaselineIdRef.current = branchBaselineId
      } else if (activeDraftView !== 'branch') {
        lastBranchBaselineIdRef.current = branchBaselineId
      }

      const exportProfileId = selectedExportProfile?.id ?? null
      if (activeDraftView === 'export' && selectedExportProfile && lastExportProfileIdRef.current !== exportProfileId) {
        nextEntries.push({
          id: `export-profile-${sequenceRef.current++}`,
          kind: 'export-profile',
          tone: 'neutral',
          action: 'selected-export-profile',
          exportProfileTitle: selectedExportProfile.title,
          exportProfileSummary: selectedExportProfile.summary,
        })
        lastExportProfileIdRef.current = exportProfileId
      } else if (activeDraftView !== 'export') {
        lastExportProfileIdRef.current = exportProfileId
      }
    } else {
      lastLensRef.current = activeLens
      lastDraftViewRef.current = activeDraftView
      lastReviewFilterRef.current = selectedReviewFilter
      lastReviewIssueIdRef.current = selectedReviewIssue?.id ?? null
      lastCheckpointIdRef.current = selectedCheckpoint?.id ?? null
      lastBranchIdRef.current = selectedBranch?.id ?? null
      lastBranchBaselineIdRef.current = selectedBranchBaseline?.id ?? null
      lastExportProfileIdRef.current = selectedExportProfile?.id ?? null
      if (lastViewRef.current !== activeView) {
        nextEntries.push({
          id: `view-${sequenceRef.current++}`,
          kind: 'view',
          tone: 'accent',
          action: lastViewRef.current === null ? 'entered-view' : 'switched-view',
          view: activeView,
        })
        lastViewRef.current = activeView
      }
    }

    const selectedChapterId = selectedChapter?.id ?? null
    if (lastChapterIdRef.current !== selectedChapterId && selectedChapter) {
      nextEntries.push({
        id: `chapter-${sequenceRef.current++}`,
        kind: 'chapter',
        tone: 'neutral',
        action: 'focused-chapter',
        chapterTitle: selectedChapter.title,
        chapterSummary: selectedChapter.summary,
      })
      lastChapterIdRef.current = selectedChapterId
    }

    const rememberedHandoffs = rememberedBookHandoffsByBookId.get(bookId) ?? []
    for (const handoffEntry of [...rememberedHandoffs].reverse()) {
      if (seenHandoffIdsRef.current.has(handoffEntry.id)) {
        continue
      }

      nextEntries.unshift(handoffEntry)
      seenHandoffIdsRef.current.add(handoffEntry.id)
    }

    if (latestHandoff && latestHandoff.bookId === bookId && !seenHandoffIdsRef.current.has(latestHandoff.id)) {
      nextEntries.unshift(buildHandoffActivityEntry(latestHandoff))
      seenHandoffIdsRef.current.add(latestHandoff.id)
    }

    const rememberedReviewSourceEntries = rememberedBookReviewSourceByBookId.get(bookId) ?? []
    for (const reviewSourceEntry of [...rememberedReviewSourceEntries].reverse()) {
      if (seenReviewSourceIdsRef.current.has(reviewSourceEntry.id)) {
        continue
      }

      nextEntries.unshift(reviewSourceEntry)
      seenReviewSourceIdsRef.current.add(reviewSourceEntry.id)
    }

    const rememberedReviewDecisionEntries = rememberedBookReviewDecisionByBookId.get(bookId) ?? []
    for (const reviewDecisionEntry of [...rememberedReviewDecisionEntries].reverse()) {
      if (seenReviewDecisionIdsRef.current.has(reviewDecisionEntry.id)) {
        continue
      }

      nextEntries.unshift(reviewDecisionEntry)
      seenReviewDecisionIdsRef.current.add(reviewDecisionEntry.id)
    }

    const rememberedReviewFixActionEntries = rememberedBookReviewFixActionByBookId.get(bookId) ?? []
    for (const reviewFixActionEntry of [...rememberedReviewFixActionEntries].reverse()) {
      if (seenReviewFixActionIdsRef.current.has(reviewFixActionEntry.id)) {
        continue
      }

      nextEntries.unshift(reviewFixActionEntry)
      seenReviewFixActionIdsRef.current.add(reviewFixActionEntry.id)
    }

    if (nextEntries.length === 0) {
      return
    }

    setActivity((current) => (bookChanged ? nextEntries : [...nextEntries, ...current]).slice(0, maxItems))
  }, [
    activeDraftView,
    activeLens,
    activeView,
    bookId,
    latestHandoff,
    locale,
    maxItems,
    selectedBranch,
    selectedBranchBaseline,
    selectedChapter,
    selectedCheckpoint,
    selectedExportProfile,
    selectedReviewFilter,
    selectedReviewIssue,
  ])

  return useMemo(
    () => activity.map((item) => localizeActivityEntry(item, locale)),
    [activity, locale],
  )
}

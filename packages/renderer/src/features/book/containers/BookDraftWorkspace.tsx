import { useCallback, useEffect } from 'react'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { getLocaleName, getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { BookDraftBinderPane } from '../components/BookDraftBinderPane'
import { BookDraftInspectorPane } from '../components/BookDraftInspectorPane'
import { BookDraftStage } from '../components/BookDraftStage'
import { BookModeRail } from '../components/BookModeRail'
import { useBookDraftWorkspaceQuery } from '../hooks/useBookDraftWorkspaceQuery'
import { useBookExperimentBranchQuery } from '../hooks/useBookExperimentBranchQuery'
import { useBookExportPreviewQuery } from '../hooks/useBookExportPreviewQuery'
import { useBookManuscriptCompareQuery } from '../hooks/useBookManuscriptCompareQuery'
import { rememberBookWorkbenchHandoff } from '../hooks/useBookWorkbenchActivity'
import { BookDraftDockContainer } from './BookDraftDockContainer'
import { DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID } from '../api/book-manuscript-checkpoints'
import { DEFAULT_BOOK_EXPORT_PROFILE_ID } from '../api/book-export-profiles'

let rememberedBookDraftHandoffSequence = 0
const DEFAULT_BOOK_EXPERIMENT_BRANCH_ID = 'branch-book-signal-arc-quiet-ending'

function LanguageToggle() {
  const { locale, setLocale, dictionary } = useI18n()

  return (
    <div className="flex items-center gap-1 rounded-md border border-line-soft bg-surface-2 p-1">
      <span className="px-2 text-[11px] uppercase tracking-[0.05em] text-text-soft">{dictionary.common.language}</span>
      {(['en', 'zh-CN'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            locale === value ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
          }`}
        >
          {getLocaleName(locale, value)}
        </button>
      ))}
    </div>
  )
}

function DraftPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

function BookDraftTopBar({
  bookTitle,
  summary,
  selectedChapterTitle,
  assembledWordCount,
  missingDraftChapterCount,
}: {
  bookTitle?: string
  summary?: string
  selectedChapterTitle?: string
  assembledWordCount?: number
  missingDraftChapterCount?: number
}) {
  const { locale } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
          {locale === 'zh-CN' ? '叙事工作台' : 'Narrative workbench'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{locale === 'zh-CN' ? '书籍手稿' : 'Book manuscript'}</h1>
          <Badge tone="neutral">{locale === 'zh-CN' ? '书籍' : 'Book'}</Badge>
          <Badge tone="accent">{getWorkbenchLensLabel(locale, 'draft')}</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {bookTitle ?? (locale === 'zh-CN' ? '书籍' : 'Book')} / {getWorkbenchLensLabel(locale, 'draft')}
          {selectedChapterTitle ? ` / ${selectedChapterTitle}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        {assembledWordCount !== undefined ? (
          <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${assembledWordCount} 词` : `${assembledWordCount} words`}</Badge>
        ) : null}
        {missingDraftChapterCount !== undefined ? (
          <Badge tone={missingDraftChapterCount > 0 ? 'warn' : 'success'}>
            {locale === 'zh-CN' ? `缺稿 ${missingDraftChapterCount}` : `Missing ${missingDraftChapterCount}`}
          </Badge>
        ) : null}
      </div>
      {summary ? <p className="w-full text-sm leading-6 text-text-muted">{summary}</p> : null}
    </div>
  )
}

export function BookDraftWorkspace() {
  const { route, replaceRoute, patchBookRoute } = useWorkbenchRouteState()
  const { locale } = useI18n()

  if (route.scope !== 'book') {
    return null
  }

  const { workspace, isLoading, error } = useBookDraftWorkspaceQuery({
    bookId: route.bookId,
    selectedChapterId: route.selectedChapterId ?? null,
  })
  const activeDraftView = route.draftView ?? 'read'
  const effectiveCheckpointId = route.checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID
  const effectiveExportProfileId = route.exportProfileId ?? DEFAULT_BOOK_EXPORT_PROFILE_ID
  const effectiveBranchId = route.branchId ?? DEFAULT_BOOK_EXPERIMENT_BRANCH_ID
  const effectiveBranchBaseline = route.branchBaseline ?? 'current'
  const {
    compareWorkspace,
    checkpoints,
    selectedCheckpoint,
    isLoading: isCompareLoading,
    error: compareError,
  } = useBookManuscriptCompareQuery({
    bookId: route.bookId,
    currentDraftWorkspace: workspace,
    checkpointId: effectiveCheckpointId,
  })
  const {
    exportWorkspace,
    exportProfiles,
    selectedExportProfile,
    isLoading: isExportLoading,
    error: exportError,
  } = useBookExportPreviewQuery({
    bookId: route.bookId,
    currentDraftWorkspace: workspace,
    compareWorkspace,
    exportProfileId: effectiveExportProfileId,
    enabled: activeDraftView === 'export',
  })
  const {
    branchWorkspace,
    branches,
    selectedBranch,
    isLoading: isBranchLoading,
    error: branchError,
  } = useBookExperimentBranchQuery({
    bookId: route.bookId,
    currentDraftWorkspace: workspace,
    branchId: effectiveBranchId,
    branchBaseline: effectiveBranchBaseline,
    checkpointId: effectiveCheckpointId,
  })
  const exportBaselineError = activeDraftView === 'export' ? compareError : null
  const effectiveExportError = exportBaselineError ?? exportError
  const effectiveExportPreview = exportBaselineError ? null : (exportWorkspace ?? null)

  useEffect(() => {
    if (isLoading || error || workspace === undefined || workspace === null) {
      return
    }

    if (route.selectedChapterId !== workspace.selectedChapterId) {
      patchBookRoute({ selectedChapterId: workspace.selectedChapterId ?? undefined }, { replace: true })
    }
  }, [error, isLoading, patchBookRoute, route.selectedChapterId, workspace])

  const openChapterFromBook = useCallback(
    (chapterId: string, lens: 'structure' | 'draft') => {
      const chapterTitle = workspace?.chapters.find((chapter) => chapter.chapterId === chapterId)?.title ?? chapterId

      rememberBookWorkbenchHandoff({
        id: `handoff-${route.bookId}-${chapterId}-${lens}-${rememberedBookDraftHandoffSequence++}`,
        bookId: route.bookId,
        chapterTitle,
        lens,
      })

      if (lens === 'structure') {
        replaceRoute({
          scope: 'chapter',
          chapterId,
          lens: 'structure',
          view: 'sequence',
          sceneId: undefined,
        })
        return
      }

      replaceRoute({
        scope: 'chapter',
        chapterId,
        lens: 'draft',
        sceneId: undefined,
      })
    },
    [replaceRoute, route.bookId, workspace],
  )

  const onSelectChapter = useCallback(
    (chapterId: string) => {
      if (route.selectedChapterId === chapterId) {
        return
      }

      patchBookRoute({ selectedChapterId: chapterId })
    },
    [patchBookRoute, route.selectedChapterId],
  )
  const onSelectDraftView = useCallback(
    (draftView: 'read' | 'compare' | 'export' | 'branch') => {
      patchBookRoute({
        draftView,
        checkpointId: draftView === 'compare' ? effectiveCheckpointId : route.checkpointId ?? effectiveCheckpointId,
        exportProfileId: draftView === 'export' ? effectiveExportProfileId : route.exportProfileId ?? effectiveExportProfileId,
        branchId: draftView === 'branch' ? effectiveBranchId : route.branchId ?? effectiveBranchId,
        branchBaseline: draftView === 'branch' ? effectiveBranchBaseline : route.branchBaseline ?? effectiveBranchBaseline,
      })
    },
    [
      effectiveBranchBaseline,
      effectiveBranchId,
      effectiveCheckpointId,
      effectiveExportProfileId,
      patchBookRoute,
      route.branchBaseline,
      route.branchId,
      route.checkpointId,
      route.exportProfileId,
    ],
  )
  const onSelectCheckpoint = useCallback(
    (checkpointId: string) => {
      if (checkpointId === effectiveCheckpointId && activeDraftView === 'compare') {
        return
      }

      patchBookRoute({
        draftView: 'compare',
        checkpointId,
      })
    },
    [activeDraftView, effectiveCheckpointId, patchBookRoute],
  )
  const onSelectExportProfile = useCallback(
    (exportProfileId: string) => {
      patchBookRoute({
        draftView: 'export',
        exportProfileId,
      })
    },
    [patchBookRoute],
  )
  const onSelectBranch = useCallback(
    (branchId: string) => {
      patchBookRoute({
        draftView: 'branch',
        branchId,
      })
    },
    [patchBookRoute],
  )
  const onSelectBranchBaseline = useCallback(
    (branchBaseline: 'current' | 'checkpoint') => {
      patchBookRoute({
        draftView: 'branch',
        branchBaseline,
        checkpointId: route.checkpointId ?? effectiveCheckpointId,
      })
    },
    [effectiveCheckpointId, patchBookRoute, route.checkpointId],
  )

  const modeRail = (
    <BookModeRail
      activeScope="book"
      activeLens="draft"
      onSelectScope={(scope) => {
        if (scope === 'book') {
          return
        }

        if (scope === 'chapter') {
          const chapterId = workspace?.selectedChapterId ?? route.selectedChapterId
          if (chapterId) {
            openChapterFromBook(chapterId, 'draft')
          }
          return
        }

        replaceRoute({ scope })
      }}
      onSelectLens={(lens) => {
        if (lens !== route.lens) {
          patchBookRoute({ lens })
        }
      }}
    />
  )

  if (error) {
    return (
      <WorkbenchShell
        topBar={<BookDraftTopBar bookTitle={route.bookId} />}
        modeRail={modeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '书籍不可用' : 'Book unavailable'} message={error.message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '手稿不可用' : 'Manuscript unavailable'} message={error.message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '检查器不可用' : 'Inspector unavailable'} message={error.message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={error.message} />}
      />
    )
  }

  if (
    isLoading ||
    workspace === undefined ||
    (activeDraftView === 'compare' && (isCompareLoading || compareWorkspace === undefined)) ||
    (activeDraftView === 'export' && (isExportLoading || exportWorkspace === undefined)) ||
    (activeDraftView === 'branch' && (isBranchLoading || (branchWorkspace === undefined && branchError === null)))
  ) {
    const message =
      locale === 'zh-CN'
        ? '正在按书籍顺序装配章节手稿，并同步检查器与底部面板摘要。'
        : 'Assembling chapter manuscript blocks in book order and syncing the inspector and dock summary.'

    return (
      <WorkbenchShell
        topBar={<BookDraftTopBar bookTitle={route.bookId} />}
        modeRail={modeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '正在加载导航' : 'Loading navigator'} message={message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '正在加载手稿' : 'Loading manuscript'} message={message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '正在加载检查器' : 'Loading inspector'} message={message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '正在加载底部面板' : 'Loading bottom dock'} message={message} />}
      />
    )
  }

  if (workspace === null) {
    const message = locale === 'zh-CN' ? `未找到书籍 ${route.bookId}。` : `Book ${route.bookId} could not be found.`

    return (
      <WorkbenchShell
        topBar={<BookDraftTopBar bookTitle={route.bookId} />}
        modeRail={modeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
      />
    )
  }

  return (
    <WorkbenchShell
      topBar={
        <BookDraftTopBar
          bookTitle={workspace.title}
          summary={workspace.summary}
          selectedChapterTitle={workspace.selectedChapter?.title}
          assembledWordCount={workspace.assembledWordCount}
          missingDraftChapterCount={workspace.missingDraftChapterCount}
        />
      }
      modeRail={modeRail}
      navigator={
        <BookDraftBinderPane
          workspace={workspace}
          onSelectChapter={onSelectChapter}
          onOpenChapter={openChapterFromBook}
        />
      }
      mainStage={
        <BookDraftStage
          draftView={activeDraftView}
          workspace={workspace}
          compare={compareWorkspace ?? null}
          compareError={compareError}
          branchWorkspace={branchWorkspace ?? null}
          branchError={branchError}
          branches={branches ?? []}
          selectedBranchId={selectedBranch?.branchId ?? effectiveBranchId}
          branchBaseline={effectiveBranchBaseline}
          exportPreview={effectiveExportPreview}
          exportProfiles={exportProfiles ?? []}
          selectedExportProfileId={selectedExportProfile?.exportProfileId ?? effectiveExportProfileId}
          exportError={effectiveExportError}
          checkpoints={checkpoints ?? []}
          selectedCheckpointId={selectedCheckpoint?.checkpointId ?? effectiveCheckpointId}
          onSelectDraftView={onSelectDraftView}
          onSelectChapter={onSelectChapter}
          onOpenChapter={openChapterFromBook}
          onSelectCheckpoint={onSelectCheckpoint}
          onSelectBranch={onSelectBranch}
          onSelectBranchBaseline={onSelectBranchBaseline}
          onSelectExportProfile={onSelectExportProfile}
        />
      }
      inspector={
        <BookDraftInspectorPane
          bookTitle={workspace.title}
          inspector={workspace.inspector}
          activeDraftView={activeDraftView}
          compare={compareWorkspace ?? null}
          branch={branchWorkspace ?? null}
          exportPreview={effectiveExportPreview}
          exportError={effectiveExportError}
          checkpointMeta={selectedCheckpoint ?? null}
        />
      }
      bottomDock={
        <BookDraftDockContainer
          workspace={workspace}
          activeDraftView={activeDraftView}
          compare={compareWorkspace ?? null}
          branch={branchWorkspace ?? null}
          exportPreview={effectiveExportPreview}
          exportError={effectiveExportError}
        />
      }
    />
  )
}

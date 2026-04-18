import type { BookDraftView } from '@/features/workbench/types/workbench-route'

import { useI18n } from '@/app/i18n'

import type {
  BookManuscriptCheckpointSummaryViewModel,
  BookManuscriptCompareWorkspaceViewModel,
} from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type {
  BookExportPreviewWorkspaceViewModel,
  BookExportProfileSummaryViewModel,
} from '../types/book-export-view-models'
import { BookDraftCheckpointPicker } from './BookDraftCheckpointPicker'
import { BookDraftCompareView } from './BookDraftCompareView'
import { BookDraftExportView } from './BookDraftExportView'
import { BookDraftReader } from './BookDraftReader'

interface BookDraftStageProps {
  draftView: BookDraftView
  workspace: BookDraftWorkspaceViewModel
  compare: BookManuscriptCompareWorkspaceViewModel | null
  compareError?: Error | null
  exportPreview?: BookExportPreviewWorkspaceViewModel | null
  exportProfiles: BookExportProfileSummaryViewModel[]
  selectedExportProfileId: string
  exportError?: Error | null
  checkpoints: BookManuscriptCheckpointSummaryViewModel[]
  selectedCheckpointId: string
  onSelectDraftView: (draftView: BookDraftView) => void
  onSelectChapter: (chapterId: string) => void
  onOpenChapter: (chapterId: string, lens: 'structure' | 'draft') => void
  onSelectCheckpoint: (checkpointId: string) => void
  onSelectExportProfile: (exportProfileId: string) => void
}

export function BookDraftStage({
  draftView,
  workspace,
  compare,
  compareError = null,
  exportPreview = null,
  exportProfiles,
  selectedExportProfileId,
  exportError = null,
  checkpoints,
  selectedCheckpointId,
  onSelectDraftView,
  onSelectChapter,
  onOpenChapter,
  onSelectCheckpoint,
  onSelectExportProfile,
}: BookDraftStageProps) {
  const { locale } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-surface-1 px-4 py-3">
        <div className="inline-flex rounded-md border border-line-soft bg-surface-2 p-1">
          {([
            { value: 'read' as const, label: locale === 'zh-CN' ? 'Read' : 'Read' },
            { value: 'compare' as const, label: locale === 'zh-CN' ? 'Compare' : 'Compare' },
            { value: 'export' as const, label: locale === 'zh-CN' ? 'Export' : 'Export' },
          ]).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={draftView === option.value}
              onClick={() => onSelectDraftView(option.value)}
              className={`rounded-md px-3 py-2 text-sm ${
                draftView === option.value ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {draftView === 'compare' ? (
        <>
          <div className="border-b border-line-soft bg-surface-1 px-4 py-4">
            <BookDraftCheckpointPicker
              checkpoints={checkpoints}
              selectedCheckpointId={selectedCheckpointId}
              checkpointMeta={compare?.checkpoint ?? checkpoints.find((checkpoint) => checkpoint.checkpointId === selectedCheckpointId) ?? null}
              onSelectCheckpoint={onSelectCheckpoint}
            />
          </div>
          <BookDraftCompareView
            compare={compare}
            errorMessage={compareError?.message ?? null}
            onSelectChapter={onSelectChapter}
            onOpenChapter={onOpenChapter}
          />
        </>
      ) : draftView === 'export' ? (
        <BookDraftExportView
          exportPreview={exportPreview}
          exportProfiles={exportProfiles}
          selectedExportProfileId={selectedExportProfileId}
          errorMessage={exportError?.message ?? null}
          onSelectChapter={onSelectChapter}
          onOpenChapter={onOpenChapter}
          onSelectExportProfile={onSelectExportProfile}
        />
      ) : (
        <BookDraftReader workspace={workspace} onSelectChapter={onSelectChapter} onOpenChapter={onOpenChapter} />
      )}
    </div>
  )
}

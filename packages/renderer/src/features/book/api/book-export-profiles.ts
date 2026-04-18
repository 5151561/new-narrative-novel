import type { BookLocalizedText } from './book-records'

export type BookExportProfileKind = 'review_packet' | 'submission_preview' | 'archive_snapshot'

export interface BookExportProfileIncludesRecord {
  manuscriptBody: boolean
  chapterSummaries: boolean
  sceneHeadings: boolean
  traceAppendix: boolean
  compareSummary: boolean
  readinessChecklist: boolean
}

export interface BookExportProfileRulesRecord {
  requireAllScenesDrafted: boolean
  requireTraceReady: boolean
  allowWarnings: boolean
  allowDraftMissing: boolean
}

export interface BookExportProfileRecord {
  exportProfileId: string
  bookId: string
  kind: BookExportProfileKind
  title: BookLocalizedText
  summary: BookLocalizedText
  createdAtLabel: BookLocalizedText
  includes: BookExportProfileIncludesRecord
  rules: BookExportProfileRulesRecord
}

export const DEFAULT_BOOK_EXPORT_PROFILE_ID = 'export-review-packet'

function text(en: string, zhCN: string): BookLocalizedText {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export const mockBookExportProfileSeeds: Record<string, BookExportProfileRecord[]> = {
  'book-signal-arc': [
    {
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
      bookId: 'book-signal-arc',
      kind: 'review_packet',
      title: text('Review Packet', '审阅包'),
      summary: text(
        'Full manuscript packet for editorial review with compare and trace context attached.',
        '用于编辑审阅的完整稿件包，附带 compare 与 trace 上下文。',
      ),
      createdAtLabel: text('Updated for PR13 baseline', '按 PR13 基线更新'),
      includes: {
        manuscriptBody: true,
        chapterSummaries: true,
        sceneHeadings: true,
        traceAppendix: true,
        compareSummary: true,
        readinessChecklist: true,
      },
      rules: {
        requireAllScenesDrafted: true,
        requireTraceReady: true,
        allowWarnings: false,
        allowDraftMissing: false,
      },
    },
    {
      exportProfileId: 'export-submission-preview',
      bookId: 'book-signal-arc',
      kind: 'submission_preview',
      title: text('Submission Preview', '投稿预览'),
      summary: text(
        'Submission-oriented preview that omits internal compare and trace appendices.',
        '面向投稿的预览包，不包含内部 compare 与 trace 附录。',
      ),
      createdAtLabel: text('Prepared for external preview', '为外部预览准备'),
      includes: {
        manuscriptBody: true,
        chapterSummaries: true,
        sceneHeadings: true,
        traceAppendix: false,
        compareSummary: false,
        readinessChecklist: true,
      },
      rules: {
        requireAllScenesDrafted: true,
        requireTraceReady: true,
        allowWarnings: false,
        allowDraftMissing: false,
      },
    },
    {
      exportProfileId: 'export-archive-snapshot',
      bookId: 'book-signal-arc',
      kind: 'archive_snapshot',
      title: text('Archive Snapshot', '归档快照'),
      summary: text(
        'Archive snapshot for preserving a draft state without requiring a clean submission packet.',
        '用于保存草稿状态的归档快照，不要求达到干净的投稿包状态。',
      ),
      createdAtLabel: text('Snapshot policy active', '快照策略生效中'),
      includes: {
        manuscriptBody: true,
        chapterSummaries: true,
        sceneHeadings: false,
        traceAppendix: false,
        compareSummary: false,
        readinessChecklist: true,
      },
      rules: {
        requireAllScenesDrafted: false,
        requireTraceReady: false,
        allowWarnings: true,
        allowDraftMissing: true,
      },
    },
  ],
}

export function getMockBookExportProfiles(bookId: string): BookExportProfileRecord[] {
  return clone(mockBookExportProfileSeeds[bookId] ?? [])
}

export function getMockBookExportProfile(bookId: string, exportProfileId: string): BookExportProfileRecord | null {
  const records = mockBookExportProfileSeeds[bookId] ?? []
  const record = records.find((item) => item.exportProfileId === exportProfileId)
  return record ? clone(record) : null
}

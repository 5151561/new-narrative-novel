import { signalArcBookId, signalArcChapterIds } from '@narrative-novel/fixture-seed'

import type { BookLocalizedText, BookStructureRecord } from './book-records'

function text(en: string, zhCN: string): BookLocalizedText {
  return {
    en,
    'zh-CN': zhCN,
  }
}

export const mockBookRecordSeeds: Record<string, BookStructureRecord> = {
  [signalArcBookId]: {
    bookId: signalArcBookId,
    title: text('Signal Arc', '信号弧线'),
    summary: text(
      'Book-level chapter order, risk, and trace state for Signal Arc.',
      '信号弧线的章节顺序、风险和追踪状态。',
    ),
    chapterIds: [...signalArcChapterIds],
    viewsMeta: {
      availableViews: ['sequence', 'outliner', 'signals'],
    },
  },
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

let mutableMockBookRecords: Record<string, BookStructureRecord> = clone(mockBookRecordSeeds)

export function resetMockBookDb() {
  mutableMockBookRecords = clone(mockBookRecordSeeds)
}

export function getMockBookRecordById(bookId: string): BookStructureRecord | null {
  const record = mutableMockBookRecords[bookId]
  return record ? clone(record) : null
}

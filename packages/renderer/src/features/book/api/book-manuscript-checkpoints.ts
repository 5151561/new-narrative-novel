import type { BookLocalizedText } from './book-records'

export interface BookManuscriptCheckpointSceneRecord {
  sceneId: string
  order: number
  title: BookLocalizedText
  summary: BookLocalizedText
  proseDraft?: string
  draftWordCount?: number
  warningsCount: number
  traceReady: boolean
}

export interface BookManuscriptCheckpointChapterRecord {
  chapterId: string
  order: number
  title: BookLocalizedText
  summary: BookLocalizedText
  scenes: BookManuscriptCheckpointSceneRecord[]
}

export interface BookManuscriptCheckpointRecord {
  checkpointId: string
  bookId: string
  title: BookLocalizedText
  createdAtLabel: BookLocalizedText
  createdFromRunId?: string
  sourceSignature: string
  summary: BookLocalizedText
  selectedChapterId: string
  chapters: BookManuscriptCheckpointChapterRecord[]
}

export interface CreateBookManuscriptCheckpointInput {
  bookId: string
  title: string
  summary: string
  sourceSignature: string
  selectedChapterId: string
}

export const DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID = 'checkpoint-book-signal-arc-pr11-baseline'

function text(en: string, zhCN: string): BookLocalizedText {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export const mockBookManuscriptCheckpointSeeds: Record<string, BookManuscriptCheckpointRecord[]> = {
  'book-signal-arc': [
    {
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      bookId: 'book-signal-arc',
      title: text('PR11 Baseline', 'PR11 基线'),
      createdAtLabel: text('2026-04-17 22:10', '2026-04-17 22:10'),
      sourceSignature: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
      summary: text(
        'Baseline manuscript snapshot captured before compare/review work started.',
        '在 compare/review 工作开始前采集的基线稿快照。',
      ),
      selectedChapterId: 'chapter-signals-in-rain',
      chapters: [
        {
          chapterId: 'chapter-signals-in-rain',
          order: 1,
          title: text('Signals in Rain', '雨中信号'),
          summary: text(
            'Checkpointed chapter draft before the latest ticket-window and bell review pass.',
            '售票窗和发车钟最新复审之前的章节 checkpoint。',
          ),
          scenes: [
            {
              sceneId: 'scene-midnight-platform',
              order: 1,
              title: text('Midnight Platform', '午夜站台'),
              summary: text(
                'The bargain remains public while the ledger stays unread.',
                '交易维持在公开视线内，账本仍未被翻开。',
              ),
              proseDraft:
                'Ren lets the rain hide how tightly he is counting seconds while Mei prices the ledger in full view of the platform witness.',
              draftWordCount: 22,
              warningsCount: 0,
              traceReady: true,
            },
            {
              sceneId: 'scene-concourse-delay',
              order: 2,
              title: text('Concourse Delay', '候车厅延误'),
              summary: text(
                'The crowd stretch keeps the exit beat from collapsing too early.',
                '人群拉长了离场节拍，避免压力过早坍塌。',
              ),
              proseDraft:
                'The crowd slows every turn, forcing Mei and Ren to keep the courier line unresolved for one more move.',
              draftWordCount: 18,
              warningsCount: 1,
              traceReady: true,
            },
            {
              sceneId: 'scene-departure-bell',
              order: 3,
              title: text('Departure Bell', '发车钟'),
              summary: text(
                'The bell still lands as prose instead of a placeholder.',
                '铃声仍然以正文存在，而不是占位状态。',
              ),
              proseDraft:
                'The conductor lifts a hand toward the bell, giving the scene a drafted ending that still needs timing review.',
              draftWordCount: 19,
              warningsCount: 1,
              traceReady: false,
            },
          ],
        },
        {
          chapterId: 'chapter-open-water-signals',
          order: 2,
          title: text('Open Water Signals', '开阔水域信号'),
          summary: text(
            'Checkpointed handoff chapter before the latest warehouse trace fix and scene reshuffle.',
            '仓桥溯源修正与场景重排之前的交接章节 checkpoint。',
          ),
          scenes: [
            {
              sceneId: 'scene-warehouse-bridge',
              order: 1,
              title: text('Warehouse Bridge', '仓桥交接'),
              summary: text(
                'The first handoff is still written with looser trace links and a softer turn.',
                '第一次交接仍以较松的溯源和较缓的转折呈现。',
              ),
              proseDraft:
                'Leya leaves the package half-claimed, buying room to retreat before the betrayal line hardens into proof.',
              draftWordCount: 18,
              warningsCount: 0,
              traceReady: false,
            },
            {
              sceneId: 'scene-canal-watch',
              order: 2,
              title: text('Canal Watch', '运河哨位'),
              summary: text(
                'Canal Watch holds position and keeps the handoff under observation.',
                '运河哨位维持观测，继续看住交接节拍。',
              ),
              proseDraft:
                'The canal watcher keeps the exchange visible, but the package owner still stays one beat offstage.',
              draftWordCount: 17,
              warningsCount: 0,
              traceReady: true,
            },
            {
              sceneId: 'scene-river-ledger',
              order: 3,
              title: text('River Ledger', '河道账本'),
              summary: text(
                'A legacy checkpoint scene that no longer exists in the current draft order.',
                '一个只存在于基线 checkpoint、已经不在当前草稿顺序中的旧场景。',
              ),
              proseDraft:
                'A courier skims the river ledger in transit, creating a branch the current draft later removed.',
              draftWordCount: 17,
              warningsCount: 1,
              traceReady: true,
            },
          ],
        },
      ],
    },
  ],
}

const mockBookManuscriptCheckpointStore = clone(mockBookManuscriptCheckpointSeeds)

function createMirroredText(value: string): BookLocalizedText {
  return text(value, value)
}

export function getMockBookManuscriptCheckpoints(bookId: string): BookManuscriptCheckpointRecord[] {
  return clone(mockBookManuscriptCheckpointStore[bookId] ?? [])
}

export function getMockBookManuscriptCheckpoint(bookId: string, checkpointId: string): BookManuscriptCheckpointRecord | null {
  const checkpoints = mockBookManuscriptCheckpointStore[bookId] ?? []
  const record = checkpoints.find((item) => item.checkpointId === checkpointId)
  return record ? clone(record) : null
}

export function createMockBookManuscriptCheckpoint(
  input: CreateBookManuscriptCheckpointInput & Pick<BookManuscriptCheckpointRecord, 'chapters'> & { createdFromRunId?: string },
): BookManuscriptCheckpointRecord {
  const checkpoints = mockBookManuscriptCheckpointStore[input.bookId] ?? []
  const record: BookManuscriptCheckpointRecord = {
    checkpointId: `checkpoint-${input.bookId}-${String(checkpoints.length + 1).padStart(3, '0')}`,
    bookId: input.bookId,
    title: createMirroredText(input.title),
    createdAtLabel: createMirroredText('2026-04-28 10:00'),
    createdFromRunId: input.createdFromRunId,
    sourceSignature: input.sourceSignature,
    summary: createMirroredText(input.summary),
    selectedChapterId: input.selectedChapterId,
    chapters: clone(input.chapters),
  }

  mockBookManuscriptCheckpointStore[input.bookId] = [...checkpoints, record]
  return clone(record)
}

export function resetMockBookManuscriptCheckpointStore() {
  for (const key of Object.keys(mockBookManuscriptCheckpointStore)) {
    delete mockBookManuscriptCheckpointStore[key]
  }
  Object.assign(mockBookManuscriptCheckpointStore, clone(mockBookManuscriptCheckpointSeeds))
}

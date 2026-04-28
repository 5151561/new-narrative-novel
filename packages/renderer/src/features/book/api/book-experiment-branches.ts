import type { BookLocalizedText } from './book-records'

export type BookExperimentBranchStatus = 'active' | 'review' | 'archived'

export type BookExperimentBranchAdoptionKind = 'canon_patch' | 'prose_draft'

export type BookExperimentBranchAdoptionStatus = 'pending' | 'adopted' | 'blocked'

export interface BookExperimentBranchSceneRecord {
  sceneId: string
  title: BookLocalizedText
  summary: BookLocalizedText
  proseDraft?: BookLocalizedText
  draftWordCount?: number
  traceReady: boolean
  warningsCount: number
  sourceProposalCount: number
}

export interface BookExperimentBranchChapterRecord {
  chapterId: string
  title: BookLocalizedText
  summary: BookLocalizedText
  sceneSnapshots: BookExperimentBranchSceneRecord[]
}

export interface BookExperimentBranchAdoptionRecord {
  adoptionId: string
  branchId: string
  bookId: string
  chapterId: string
  sceneId: string
  kind: BookExperimentBranchAdoptionKind
  status: BookExperimentBranchAdoptionStatus
  summary: BookLocalizedText
  createdAtLabel: BookLocalizedText
  sourceSignature: string
}

export interface BookExperimentBranchRecord {
  branchId: string
  bookId: string
  title: BookLocalizedText
  summary: BookLocalizedText
  rationale: BookLocalizedText
  createdAtLabel: BookLocalizedText
  createdFromRunId?: string
  sourceSignature: string
  basedOnCheckpointId?: string
  selectedChapterId: string
  status: BookExperimentBranchStatus
  archivedAtLabel?: BookLocalizedText
  archiveNote?: BookLocalizedText
  adoptions?: BookExperimentBranchAdoptionRecord[]
  chapterSnapshots: BookExperimentBranchChapterRecord[]
}

export interface CreateBookExperimentBranchInput {
  bookId: string
  title: string
  summary: string
  rationale: string
  basedOnCheckpointId?: string
  selectedChapterId: string
}

export interface ArchiveBookExperimentBranchInput {
  bookId: string
  branchId: string
  archiveNote: string
}

export interface CreateBookExperimentBranchAdoptionInput {
  bookId: string
  branchId: string
  chapterId: string
  sceneId: string
  kind: BookExperimentBranchAdoptionKind
  summary: string
  sourceSignature: string
}

function text(en: string, zhCN: string): BookLocalizedText {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export const mockBookExperimentBranchSeeds: Record<string, BookExperimentBranchRecord[]> = {
  'book-signal-arc': [
    {
      branchId: 'branch-book-signal-arc-quiet-ending',
      bookId: 'book-signal-arc',
      title: text('Quiet Ending', '静默收束稿'),
      summary: text(
        'A lower-conflict branch that trims the closing pressure without removing the handoff logic.',
        '一个更低冲突的实验稿，收束尾声压力，但不移除交接逻辑。',
      ),
      rationale: text(
        'Test a low-conflict landing where the station and waterfront scenes release tension earlier.',
        '测试一个低冲突收束版本，让站台与水域段落更早放下压力。',
      ),
      createdAtLabel: text('Prepared for quiet-ending review', '为静默收束审阅准备'),
      sourceSignature: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
      basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      selectedChapterId: 'chapter-open-water-signals',
      status: 'review',
      chapterSnapshots: [
        {
          chapterId: 'chapter-signals-in-rain',
          title: text('Signals in Rain', '雨中信号'),
          summary: text(
            'The station chapter resolves with a gentler public negotiation and cleaner release.',
            '站台章节以更克制的公开谈判和更干净的离场收束。',
          ),
          sceneSnapshots: [
            {
              sceneId: 'scene-midnight-platform',
              title: text('Midnight Platform', '午夜站台'),
              summary: text(
                'The platform bargain stays visible, but the scene lands with less threat.',
                '站台交易仍在众目睽睽下进行，但收束威胁感更轻。',
              ),
              proseDraft: text(
                'Ren keeps the ledger in sight while Mei lets the platform bargain land softer and leave the witness with less panic.',
                '任仍把账本放在视线里，但梅让站台交易收得更轻，只留下较少惊慌。',
              ),
              draftWordCount: 19,
              traceReady: true,
              warningsCount: 0,
              sourceProposalCount: 2,
            },
            {
              sceneId: 'scene-concourse-delay',
              title: text('Concourse Delay', '候车厅延误'),
              summary: text(
                'The crowd still delays the exit long enough to preserve the courier beat.',
                '人群仍把离场节拍拖住，足以保留信使线。',
              ),
              proseDraft: text(
                'The crowd slows the courier lane long enough for Mei to hide one last instruction inside the delay.',
                '人群把信使通道拖慢，足以让梅把最后一条指令藏进延误里。',
              ),
              draftWordCount: 17,
              traceReady: true,
              warningsCount: 1,
              sourceProposalCount: 1,
            },
            {
              sceneId: 'scene-departure-bell',
              title: text('Departure Bell', '发车钟'),
              summary: text(
                'The bell exits more quietly and no longer carries a warning-heavy landing.',
                '发车钟更安静地收束，不再带着高压警告落点。',
              ),
              proseDraft: text(
                'The departure bell releases the platform in a quieter beat and lets the scene settle before anyone calls the bluff.',
                '发车钟以更安静的节拍放走站台，让场景在任何人揭穿之前先沉下来。',
              ),
              draftWordCount: 18,
              traceReady: true,
              warningsCount: 0,
              sourceProposalCount: 1,
            },
          ],
        },
        {
          chapterId: 'chapter-open-water-signals',
          title: text('Open Water Signals', '开阔水域信号'),
          summary: text(
            'The waterfront branch keeps the handoff but reduces visible pressure in the bridge exit.',
            '水域分支保留交接，但降低仓桥离场段的外显压力。',
          ),
          sceneSnapshots: [
            {
              sceneId: 'scene-warehouse-bridge',
              title: text('Warehouse Bridge', '仓桥交接'),
              summary: text(
                'The bridge handoff lands cleaner and closes the trace gap from the checkpoint.',
                '仓桥交接收得更干净，并补上了 checkpoint 中的溯源缺口。',
              ),
              proseDraft: text(
                'Leya keeps the package moving and clears the bridge with a firmer handoff that now traces cleanly back to the owner.',
                '莱娅让包裹继续前行，用更稳的交接离开仓桥，并把线索清楚接回到持有人身上。',
              ),
              draftWordCount: 20,
              traceReady: true,
              warningsCount: 0,
              sourceProposalCount: 1,
            },
            {
              sceneId: 'scene-dawn-slip',
              title: text('Dawn Slip', '拂晓撤离'),
              summary: text(
                'The branch keeps the quieter dawn withdrawal already present in the current manuscript.',
                '分支保留当前正文里已经存在的拂晓撤离段。',
              ),
              proseDraft: text(
                'At dawn the crew clears the channel and hides the package trail before the harbor shifts awake.',
                '拂晓时分，队伍先清空航道，再在港口苏醒前抹掉包裹痕迹。',
              ),
              draftWordCount: 15,
              traceReady: false,
              warningsCount: 0,
              sourceProposalCount: 0,
            },
          ],
        },
      ],
    },
    {
      branchId: 'branch-book-signal-arc-high-pressure',
      bookId: 'book-signal-arc',
      title: text('High Pressure', '高压推进稿'),
      summary: text(
        'A sharper branch that intensifies the platform bargain and forces a riskier waterfront follow-through.',
        '一个更高压的实验稿，强化站台交易并逼出更冒险的水域后续。',
      ),
      rationale: text(
        'Stress-test a more aggressive branch with new escalation beats, warning growth, and one intentionally incomplete scene.',
        '压测一个更激进的分支，加入新的升级节拍、警告增长，以及一个刻意留空的场景。',
      ),
      createdAtLabel: text('Prepared for escalation review', '为高压升级审阅准备'),
      sourceSignature: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
      basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      selectedChapterId: 'chapter-signals-in-rain',
      status: 'active',
      chapterSnapshots: [
        {
          chapterId: 'chapter-signals-in-rain',
          title: text('Signals in Rain', '雨中信号'),
          summary: text(
            'The station chapter pushes the public bargain into a harder confrontation.',
            '站台章节把公开谈判推向更正面的对抗。',
          ),
          sceneSnapshots: [
            {
              sceneId: 'scene-midnight-platform',
              title: text('Midnight Platform', '午夜站台'),
              summary: text(
                'The platform bargain becomes more explicit and harder to hide from bystanders.',
                '站台交易变得更直接，也更难从旁观者视线中抽离。',
              ),
              proseDraft: text(
                'Ren pushes the ledger into the open and forces Mei to answer the bargain before the whole platform can turn away.',
                '任把账本推到明处，逼梅在整个平台来不及移开视线前回应这笔交易。',
              ),
              draftWordCount: 18,
              traceReady: true,
              warningsCount: 1,
              sourceProposalCount: 2,
            },
            {
              sceneId: 'scene-concourse-delay',
              title: text('Concourse Delay', '候车厅延误'),
              summary: text(
                'The crowd pressure stays unresolved and keeps the lane crowded without relief.',
                '人群压力悬而未决，让通道持续拥堵，没有缓冲。',
              ),
              proseDraft: text(
                'The crowd slows the courier lane long enough for Mei to hide one last instruction inside the delay.',
                '人群把信使通道拖慢，足以让梅把最后一条指令藏进延误里。',
              ),
              draftWordCount: 17,
              traceReady: true,
              warningsCount: 1,
              sourceProposalCount: 1,
            },
            {
              sceneId: 'scene-departure-bell',
              title: text('Departure Bell', '发车钟'),
              summary: text(
                'The branch leaves the bell scene intentionally incomplete to hold the escalation open.',
                '分支刻意把发车钟场景留空，让升级压力继续悬着。',
              ),
              proseDraft: text('   ', '   '),
              traceReady: false,
              warningsCount: 2,
              sourceProposalCount: 0,
            },
          ],
        },
        {
          chapterId: 'chapter-open-water-signals',
          title: text('Open Water Signals', '开阔水域信号'),
          summary: text(
            'The waterfront chapter cuts one stabilizing watch scene and adds a riskier pressure beat.',
            '水域章节拿掉一个稳定哨位，并加入更冒险的高压节拍。',
          ),
          sceneSnapshots: [
            {
              sceneId: 'scene-warehouse-bridge',
              title: text('Warehouse Bridge', '仓桥交接'),
              summary: text(
                'The handoff turns harsher and keeps more warning pressure on the bridge.',
                '交接变得更强硬，并在仓桥上保留更多警告压力。',
              ),
              proseDraft: text(
                'Leya keeps the package moving but turns the bridge handoff into a harsher demand that corners the owner in plain sight.',
                '莱娅继续推进包裹，但把仓桥交接压成更强硬的要求，当众逼住持有人。',
              ),
              draftWordCount: 19,
              traceReady: false,
              warningsCount: 2,
              sourceProposalCount: 1,
            },
            {
              sceneId: 'scene-dawn-slip',
              title: text('Dawn Slip', '拂晓撤离'),
              summary: text(
                'The dawn withdrawal now reads as a stressed scramble instead of a quiet exit.',
                '拂晓撤离现在更像高压逃离，而不是安静离场。',
              ),
              proseDraft: text(
                'At dawn the crew scrambles through the channel and leaves the package trail half-hidden as the harbor wakes around them.',
                '拂晓时分，队伍在航道里仓促撤离，只来得及把包裹痕迹掩去一半，港口已经在周围苏醒。',
              ),
              draftWordCount: 18,
              traceReady: false,
              warningsCount: 1,
              sourceProposalCount: 0,
            },
            {
              sceneId: 'scene-pressure-slip',
              title: text('Pressure Slip', '高压脱身'),
              summary: text(
                'A new branch-only beat where the crew forces a riskier extraction under pressure.',
                '一个仅存在于分支中的新节拍：队伍在高压下强行脱身。',
              ),
              proseDraft: text(
                'The crew forces a last-minute extraction through the side channel and leaves no time to validate the source trail.',
                '队伍从侧航道强行完成最后脱身，没有留下验证来源链路的时间。',
              ),
              draftWordCount: 17,
              traceReady: false,
              warningsCount: 1,
              sourceProposalCount: 0,
            },
          ],
        },
      ],
    },
  ],
}

const mockBookExperimentBranchStore = clone(mockBookExperimentBranchSeeds)

function createMirroredText(value: string): BookLocalizedText {
  return text(value, value)
}

export function getMockBookExperimentBranches(bookId: string): BookExperimentBranchRecord[] {
  return clone(mockBookExperimentBranchStore[bookId] ?? [])
}

export function getMockBookExperimentBranch(bookId: string, branchId: string): BookExperimentBranchRecord | null {
  const records = mockBookExperimentBranchStore[bookId] ?? []
  const record = records.find((item) => item.branchId === branchId)
  return record ? clone(record) : null
}

export function createMockBookExperimentBranch(
  input: CreateBookExperimentBranchInput &
    Pick<BookExperimentBranchRecord, 'chapterSnapshots'> & { sourceSignature: string; createdFromRunId?: string },
): BookExperimentBranchRecord {
  const branches = mockBookExperimentBranchStore[input.bookId] ?? []
  const record: BookExperimentBranchRecord = {
    branchId: `branch-${input.bookId}-${String(branches.length + 1).padStart(3, '0')}`,
    bookId: input.bookId,
    title: createMirroredText(input.title),
    summary: createMirroredText(input.summary),
    rationale: createMirroredText(input.rationale),
    createdAtLabel: createMirroredText('2026-04-28 10:10'),
    createdFromRunId: input.createdFromRunId,
    sourceSignature: input.sourceSignature,
    basedOnCheckpointId: input.basedOnCheckpointId,
    selectedChapterId: input.selectedChapterId,
    status: 'review',
    chapterSnapshots: clone(input.chapterSnapshots),
  }

  mockBookExperimentBranchStore[input.bookId] = [...branches, record]
  return clone(record)
}

export function archiveMockBookExperimentBranch(input: ArchiveBookExperimentBranchInput): BookExperimentBranchRecord {
  const branches = mockBookExperimentBranchStore[input.bookId] ?? []
  const branchIndex = branches.findIndex((item) => item.branchId === input.branchId)
  if (branchIndex < 0) {
    throw new Error(`Book experiment branch ${input.branchId} could not be found for "${input.bookId}".`)
  }

  const updated: BookExperimentBranchRecord = {
    ...branches[branchIndex]!,
    status: 'archived',
    archivedAtLabel: createMirroredText('2026-04-28 10:12'),
    archiveNote: createMirroredText(input.archiveNote),
  }

  mockBookExperimentBranchStore[input.bookId] = branches.map((branch, index) => (index === branchIndex ? updated : branch))
  return clone(updated)
}

export function resetMockBookExperimentBranchStore() {
  for (const key of Object.keys(mockBookExperimentBranchStore)) {
    delete mockBookExperimentBranchStore[key]
  }
  Object.assign(mockBookExperimentBranchStore, clone(mockBookExperimentBranchSeeds))
}

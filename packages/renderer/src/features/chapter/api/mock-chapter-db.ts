import {
  signalArcMockOnlyPreviewSceneIds,
  signalArcSceneIdsByChapter,
} from '@narrative-novel/fixture-seed'

import { ApiRequestError } from '@/app/project-runtime/api-transport'
import { startMockSceneRun } from '@/features/run/api/mock-run-db'

import type {
  ChapterLocalizedText,
  ChapterRunNextSceneRecord,
  ChapterStructureWorkspaceRecord,
  StartNextChapterSceneRunInput,
  StartNextChapterSceneRunRecord,
} from './chapter-records'
import {
  acceptChapterBacklogProposal,
  appendGeneratedChapterBacklogProposal,
  patchChapterBacklogPlanning,
  patchChapterBacklogProposalScene,
  patchChapterRecordScene,
  type ChapterSceneStructurePatch,
  reorderChapterRecordScenes,
} from './chapter-record-mutations'

function text(en: string, zhCN: string): ChapterLocalizedText {
  return {
    en,
    'zh-CN': zhCN,
  }
}

type MockChapterSceneRecord = ChapterStructureWorkspaceRecord['scenes'][number]

function buildMockChapterScenes<const TSceneId extends string>(
  sceneIds: readonly TSceneId[],
  sceneRecordsById: Record<TSceneId, MockChapterSceneRecord>,
  sourceLabel: string,
) {
  return sceneIds.map((sceneId) => {
    const sceneRecord = sceneRecordsById[sceneId]
    if (!sceneRecord) {
      throw new Error(`Missing renderer mock chapter scene record for ${sourceLabel}:${sceneId}`)
    }
    return sceneRecord
  })
}

function createEmptyChapterPlanning(goalEn: string, goalZhCN: string) {
  return {
    goal: text(goalEn, goalZhCN),
    constraints: [],
    proposals: [],
  }
}

const signalsInRainCanonicalScenesById = {
  'scene-midnight-platform': {
    id: 'scene-midnight-platform',
    order: 1,
    title: text('Midnight Platform', '午夜站台'),
    summary: text(
      'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
      'Ren 必须在站台目击者把账本变成公开筹码之前锁定交易。',
    ),
    purpose: text(
      'Push the ledger bargain into a public stalemate without opening the ledger.',
      '在不翻开账本的前提下，把交易推进到公开可见的僵局。',
    ),
    pov: text('Ren Voss', '任·沃斯'),
    location: text('Eastbound platform', '东行月台'),
    conflict: text(
      'Ren needs leverage, Mei needs a higher price, and the witness keeps both of them public.',
      'Ren 需要筹码，美伊需要更高代价，站务员让一切都不能失控。',
    ),
    reveal: text('The courier signal stays legible only to Ren.', '信使暗号仍只对 Ren 可读。'),
    backlogStatus: 'planned',
    statusLabel: text('Current', '当前'),
    proseStatusLabel: text('Needs draft', '需修订'),
    runStatusLabel: text('Paused', '已暂停'),
    unresolvedCount: 3,
    lastRunLabel: text('Run 07', '运行 07'),
  },
  'scene-concourse-delay': {
    id: 'scene-concourse-delay',
    order: 2,
    title: text('Concourse Delay', '候车厅延误'),
    summary: text(
      'A crowd bottleneck should slow the exit without resolving who controls the courier line.',
      '人潮阻塞会拖慢离场，但不会解决谁掌控信使线索。',
    ),
    purpose: text(
      'Hold the exit timing back so the chapter can keep pressure for one more scene.',
      '继续压住离场节拍，让压力留到下一场。',
    ),
    pov: text('Mei Arden', '美伊·阿登'),
    location: text('Concourse hall', '候车大厅'),
    conflict: text(
      'The crowd slows everyone down, but Ren still cannot afford to lose initiative.',
      '拥堵拖慢节奏，但 Ren 不能失去主动权。',
    ),
    reveal: text('Witness pressure carries inward from the platform.', '目击者压力从月台延伸到室内。'),
    backlogStatus: 'planned',
    statusLabel: text('Queued', '排队中'),
    proseStatusLabel: text('Queued for draft', '待起草'),
    runStatusLabel: text('Idle', '未开始'),
    unresolvedCount: 2,
    lastRunLabel: text('Not run', '未运行'),
  },
  'scene-ticket-window': {
    id: 'scene-ticket-window',
    order: 3,
    title: text('Ticket Window', '售票窗'),
    summary: text(
      'The alias stays offstage while Mei tests whether Ren will trade certainty for speed.',
      '别名继续留在台外，Mei 试探 Ren 是否会拿确定性交换速度。',
    ),
    purpose: text(
      'Bring speed and certainty into the same beat without letting the alias surface.',
      '把“速度”和“确定性”的交换压到同一镜头里。',
    ),
    pov: text('Ren Voss', '任·沃斯'),
    location: text('Ticket window', '售票窗'),
    conflict: text('Ren wants speed, Mei wants commitment first.', 'Ren 想加速离场，美伊要逼他先表态。'),
    reveal: text('The alias still has not crossed into public knowledge.', '化名仍然没有进入公开层。'),
    backlogStatus: 'planned',
    statusLabel: text('Guarded', '受控'),
    proseStatusLabel: text('Needs draft', '待起草'),
    runStatusLabel: text('Guarded', '已守护'),
    unresolvedCount: 1,
    lastRunLabel: text('Run 03', '运行 03'),
  },
  'scene-departure-bell': {
    id: 'scene-departure-bell',
    order: 4,
    title: text('Departure Bell', '发车钟'),
    summary: text(
      'The chapter still needs a final bell placement that does not collapse the witness pressure too early.',
      '本章仍需要一个不会过早压垮目击者压力的终局钟声位置。',
    ),
    purpose: text(
      'Find an exit bell cue that preserves witness pressure to the final beat.',
      '为本章找到不破坏见证压力的离场铃点。',
    ),
    pov: text('Station Conductor', '站务员'),
    location: text('Departure gate', '离场门'),
    conflict: text(
      'If the bell lands too early, the chapter’s confrontation loses pressure.',
      '铃声一旦太早落下，章节的对峙压力就会塌掉。',
    ),
    reveal: text('The ending still lacks a safe transition into motion.', '终局节拍仍缺一个安全的过渡。'),
    backlogStatus: 'planned',
    statusLabel: text('Pending', '待定'),
    proseStatusLabel: text('Queued for draft', '待起草'),
    runStatusLabel: text('Idle', '未开始'),
    unresolvedCount: 2,
    lastRunLabel: text('Not run', '未运行'),
  },
} satisfies Record<(typeof signalArcSceneIdsByChapter)['chapter-signals-in-rain'][number], MockChapterSceneRecord>

const openWaterCanonicalScenesById = {
  'scene-warehouse-bridge': {
    id: 'scene-warehouse-bridge',
    order: 1,
    title: text('Warehouse Bridge', '仓桥交接'),
    summary: text(
      'The first handoff stays tentative so the betrayal beat can remain deferred.',
      '第一次交接保持试探性，让背叛节拍继续延后。',
    ),
    purpose: text(
      'Keep the first handoff reversible so later betrayal pressure survives.',
      '把第一次交接压在“仍可撤回”的边缘上。',
    ),
    pov: text('Leya Marr', '莱娅'),
    location: text('Warehouse bridge', '仓桥'),
    conflict: text(
      'Every move risks exposing the package owner too early.',
      '任何一步都可能让货物归属暴露得太早。',
    ),
    reveal: text(
      'The betrayal line still lives in gesture, not explicit dialogue.',
      '背叛线仍只在动作里出现，不在对白里落明。',
    ),
    backlogStatus: 'planned',
    statusLabel: text('Current', '当前'),
    proseStatusLabel: text('Queued for draft', '待起草'),
    runStatusLabel: text('Running', '运行中'),
    unresolvedCount: 2,
    lastRunLabel: text('Run 04', '运行 04'),
  },
} satisfies Record<(typeof signalArcSceneIdsByChapter)['chapter-open-water-signals'][number], MockChapterSceneRecord>

const openWaterMockOnlyPreviewScenesById = {
  'scene-canal-watch': {
    id: 'scene-canal-watch',
    order: 2,
    title: text('Canal Watch', '运河哨位'),
    summary: text(
      'A watchpoint scene should tighten trust pressure without proving the package owner.',
      '哨位场景会收紧信任压力，但不会坐实包裹归属。',
    ),
    purpose: text('Raise trust pressure while keeping ownership unresolved.', '继续施压信任问题，不提前给答案。'),
    pov: text('Leya Marr', '莱娅'),
    location: text('Canal watchpoint', '运河哨位'),
    conflict: text(
      'Everyone knows the package matters, but nobody can admit who it belongs to first.',
      '所有人都知道包裹重要，但没人能先承认它属于谁。',
    ),
    reveal: text('The real receiver remains hidden.', '真正的接收方仍未暴露。'),
    backlogStatus: 'planned',
    statusLabel: text('Queued', '排队中'),
    proseStatusLabel: text('Queued for draft', '待起草'),
    runStatusLabel: text('Idle', '未开始'),
    unresolvedCount: 1,
    lastRunLabel: text('Not run', '未运行'),
  },
  'scene-dawn-slip': {
    id: 'scene-dawn-slip',
    order: 3,
    title: text('Dawn Slip', '黎明滑道'),
    summary: text(
      'The slipway exit still needs a cleaner transition between suspicion and motion.',
      '滑道离场仍需要一个更清晰的怀疑到行动过渡。',
    ),
    purpose: text('Complete the turn from suspicion into motion.', '补齐从怀疑到行动的转折。'),
    pov: text('Watcher', '监视者'),
    location: text('Slipway exit', '滑道出口'),
    conflict: text(
      'If motion arrives too early, the earlier caution stops mattering.',
      '一旦动作太快，前面的试探就会白费。',
    ),
    reveal: text('The exit path still lacks a convincing handoff.', '离场路径还缺一个可信的承接点。'),
    backlogStatus: 'planned',
    statusLabel: text('Pending', '待定'),
    proseStatusLabel: text('Queued for draft', '待起草'),
    runStatusLabel: text('Idle', '未开始'),
    unresolvedCount: 1,
    lastRunLabel: text('Not run', '未运行'),
  },
} satisfies Record<(typeof signalArcMockOnlyPreviewSceneIds)[number], MockChapterSceneRecord>

export const mockChapterRecordSeeds: Record<string, ChapterStructureWorkspaceRecord> = {
  'chapter-signals-in-rain': {
    chapterId: 'chapter-signals-in-rain',
    title: text('Signals in Rain', '雨中信号'),
    summary: text(
      'Re-cut the same chapter through order, density, and assembly pressure without leaving the workbench.',
      '在公共压力与隐秘筹码之间重新编排同一章的节奏线。',
    ),
    planning: createEmptyChapterPlanning(
      'Keep the platform bargain public while the ledger stays unread.',
      '让站台交易保持公开可见，同时不让账本被翻开。',
    ),
    viewsMeta: {
      availableViews: ['backlog', 'sequence', 'outliner', 'assembly'],
    },
    scenes: buildMockChapterScenes(
      signalArcSceneIdsByChapter['chapter-signals-in-rain'],
      signalsInRainCanonicalScenesById,
      'chapter-signals-in-rain',
    ),
    inspector: {
      chapterNotes: [
        text(
          'Witness scrutiny belongs in the auxiliary context, not the stage copy.',
          '目击者压力放在辅助上下文，不放进主舞台文案。',
        ),
        text(
          'Ordering remains structural; no prose merge is implied here.',
          '排序属于结构层，这里不引入正文合并。',
        ),
      ],
      problemsSummary: [
        {
          id: 'departure-bell-timing',
          label: text('Departure bell timing', '发车铃时序'),
          detail: text(
            'The exit bell still lands too early and drains confrontation pressure before the chapter closes.',
            '离场铃点仍然过早，会在章节收束前耗掉对峙压力。',
          ),
        },
        {
          id: 'courier-line-ownership',
          label: text('Courier-line ownership', '信使线归属'),
          detail: text(
            'The chapter keeps delaying who actually controls the courier line, but the transition still feels muddy.',
            '章节一直延后信使线真正归属的揭示，但承接仍然发糊。',
          ),
        },
        {
          id: 'alias-exposure-window',
          label: text('Alias exposure window', '别名暴露窗口'),
          detail: text(
            'The alias remains offstage, but the current sequence still risks exposing it before the handoff earns it.',
            '化名仍留在场外，但现有顺序仍可能在交接站稳之前把它暴露出来。',
          ),
        },
      ],
      assemblyHints: [
        {
          id: 'carry-platform-pressure',
          label: text('Carry platform pressure', '延续站台压力'),
          detail: text(
            'Carry platform witness pressure into the concourse instead of resolving it on the platform.',
            '让站台目击压力延续到候车厅，而不是在月台上耗尽。',
          ),
        },
        {
          id: 'sharpen-ticket-window',
          label: text('Sharpen Ticket Window trade-off', '压紧售票窗交换条件'),
          detail: text(
            'Let Ticket Window sharpen the trade-off, not settle the ledger ownership question.',
            '售票窗一场只推进交换条件，不解决账本归属。',
          ),
        },
      ],
    },
  },
  'chapter-open-water-signals': {
    chapterId: 'chapter-open-water-signals',
    title: text('Open Water Signals', '开阔水域信号'),
    summary: text(
      'Stress-test the same chapter dataset across quieter handoff scenes and broader spatial transitions.',
      '用更开阔的场景切换验证同一份 chapter dataset 的多视图复用。',
    ),
    planning: createEmptyChapterPlanning(
      'Keep the first handoff reversible long enough for the betrayal line to survive.',
      '让第一次交接保持可撤回，直到背叛线能够继续存活。',
    ),
    viewsMeta: {
      availableViews: ['backlog', 'sequence', 'outliner', 'assembly'],
    },
    scenes: [
      ...buildMockChapterScenes(
        signalArcSceneIdsByChapter['chapter-open-water-signals'],
        openWaterCanonicalScenesById,
        'chapter-open-water-signals',
      ),
      ...buildMockChapterScenes(
        signalArcMockOnlyPreviewSceneIds,
        openWaterMockOnlyPreviewScenesById,
        'chapter-open-water-signals:mock-only-preview',
      ),
    ],
    inspector: {
      chapterNotes: [
        text('Keep alternate views pointed at the same chapter identity.', '不同视图仍然指向同一个章节身份。'),
        text('No dock runtime is introduced in this scaffold.', '这个脚手架不引入运行态底部面板。'),
      ],
      problemsSummary: [
        {
          id: 'handoff-bridge',
          label: text('Handoff bridge', '交接承桥'),
          detail: text(
            'The transition from the warehouse handoff to the exit sequence is still too abrupt.',
            '第一场和最后一场之间的承接张力还不够顺。',
          ),
        },
      ],
      assemblyHints: [
        {
          id: 'warehouse-to-canal',
          label: text('Warehouse to canal carry-through', '仓桥到运河的承压'),
          detail: text(
            'Let Warehouse Bridge hesitation flow straight into Canal Watch instead of inventing a new suspense thread.',
            '把仓桥交接的迟疑直接传给运河哨位，而不是另起一条疑心线。',
          ),
        },
      ],
    },
  },
}

export const mockChapterRecords = mockChapterRecordSeeds

function clone<T>(value: T): T {
  return structuredClone(value)
}

let mutableMockChapterRecords: Record<string, ChapterStructureWorkspaceRecord> = clone(mockChapterRecordSeeds)

export function resetMockChapterDb() {
  mutableMockChapterRecords = clone(mockChapterRecordSeeds)
}

export function getMockChapterRecordById(chapterId: string): ChapterStructureWorkspaceRecord | null {
  const record = mutableMockChapterRecords[chapterId]
  return record ? clone(record) : null
}

interface UpdateMockChapterBacklogInput {
  chapterId: string
  locale: 'en' | 'zh-CN'
  goal?: string
  constraints?: string[]
}

export function updateMockChapterBacklogInput({
  chapterId,
  locale,
  goal,
  constraints,
}: UpdateMockChapterBacklogInput): ChapterStructureWorkspaceRecord | null {
  const record = mutableMockChapterRecords[chapterId]
  if (!record) {
    return null
  }

  const nextRecord = patchChapterBacklogPlanning(record, { goal, constraints }, locale)
  mutableMockChapterRecords[chapterId] = nextRecord
  return clone(nextRecord)
}

interface GenerateMockChapterBacklogProposalInput {
  chapterId: string
  locale: 'en' | 'zh-CN'
}

export function generateMockChapterBacklogProposal({
  chapterId,
}: GenerateMockChapterBacklogProposalInput): ChapterStructureWorkspaceRecord | null {
  const record = mutableMockChapterRecords[chapterId]
  if (!record) {
    return null
  }

  const nextRecord = appendGeneratedChapterBacklogProposal(record)
  mutableMockChapterRecords[chapterId] = nextRecord
  return clone(nextRecord)
}

interface UpdateMockChapterBacklogProposalSceneInput {
  chapterId: string
  proposalId: string
  proposalSceneId: string
  locale: 'en' | 'zh-CN'
  patch?: Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', string>>
  order?: number
  backlogStatus?: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
}

export function updateMockChapterBacklogProposalScene({
  chapterId,
  proposalId,
  proposalSceneId,
  locale,
  patch,
  order,
  backlogStatus,
}: UpdateMockChapterBacklogProposalSceneInput): ChapterStructureWorkspaceRecord | null {
  const record = mutableMockChapterRecords[chapterId]
  if (!record || !record.planning.proposals.some((proposal) => proposal.proposalId === proposalId)) {
    return null
  }

  const nextRecord = patchChapterBacklogProposalScene(
    record,
    proposalId,
    proposalSceneId,
    patch ?? {},
    locale,
    order,
    backlogStatus,
  )
  mutableMockChapterRecords[chapterId] = nextRecord
  return clone(nextRecord)
}

interface AcceptMockChapterBacklogProposalInput {
  chapterId: string
  proposalId: string
  locale: 'en' | 'zh-CN'
}

export function acceptMockChapterBacklogProposal({
  chapterId,
  proposalId,
}: AcceptMockChapterBacklogProposalInput): ChapterStructureWorkspaceRecord | null {
  const record = mutableMockChapterRecords[chapterId]
  if (!record || !record.planning.proposals.some((proposal) => proposal.proposalId === proposalId)) {
    return null
  }

  const nextRecord = acceptChapterBacklogProposal(record, proposalId)
  mutableMockChapterRecords[chapterId] = nextRecord
  return clone(nextRecord)
}

function updateSceneBacklogStatus(
  record: ChapterStructureWorkspaceRecord,
  sceneId: string,
  backlogStatus: ChapterStructureWorkspaceRecord['scenes'][number]['backlogStatus'],
) {
  const acceptedProposalId = record.planning.acceptedProposalId

  return {
    ...record,
    scenes: record.scenes.map((scene) => (
      scene.id === sceneId
        ? { ...scene, backlogStatus }
        : scene
    )),
    planning: {
      ...record.planning,
      proposals: record.planning.proposals.map((proposal) => ({
        ...proposal,
        scenes: proposal.scenes.map((scene) => (
          proposal.proposalId === acceptedProposalId
          && proposal.status === 'accepted'
          && scene.sceneId === sceneId
            ? { ...scene, backlogStatus }
            : scene
        )),
      })),
    },
  }
}

export function startNextMockChapterSceneRun(
  input: StartNextChapterSceneRunInput,
  projectId?: string,
): StartNextChapterSceneRunRecord | null {
  const record = mutableMockChapterRecords[input.chapterId]
  if (!record) {
    return null
  }

  const acceptedProposalId = record.planning.acceptedProposalId
  if (!acceptedProposalId) {
    throw new ApiRequestError({
      status: 409,
      message: 'Chapter run cannot start because no accepted backlog proposal is available.',
      code: 'CHAPTER_RUN_ACCEPTED_BACKLOG_REQUIRED',
      detail: {
        chapterId: input.chapterId,
      },
    })
  }

  const acceptedProposal = record.planning.proposals.find((proposal) => proposal.proposalId === acceptedProposalId)
  if (!acceptedProposal) {
    throw new ApiRequestError({
      status: 409,
      message: 'Chapter run cannot start because no accepted backlog proposal is available.',
      code: 'CHAPTER_RUN_ACCEPTED_BACKLOG_REQUIRED',
      detail: {
        chapterId: input.chapterId,
      },
    })
  }

  const orderedProposalScenes = [...acceptedProposal.scenes].sort((left, right) => left.order - right.order)
  let selectedScene: ChapterRunNextSceneRecord | null = null

  for (const proposalScene of orderedProposalScenes) {
    const canonicalScene = record.scenes.find((scene) => scene.id === proposalScene.sceneId)
    const backlogStatus = canonicalScene?.backlogStatus ?? proposalScene.backlogStatus

    if (backlogStatus === 'running' || backlogStatus === 'needs_review') {
      throw new ApiRequestError({
        status: 409,
        message: 'Chapter run is blocked by a scene waiting for review.',
        code: 'CHAPTER_RUN_REVIEW_GATE_BLOCKED',
        detail: {
          chapterId: input.chapterId,
          blockingSceneId: proposalScene.sceneId,
        },
      })
    }

    if (backlogStatus === 'planned') {
      selectedScene = {
        chapterId: input.chapterId,
        sceneId: proposalScene.sceneId,
        order: proposalScene.order,
        title: clone(proposalScene.title),
        backlogStatus,
      }
      break
    }
  }

  if (!selectedScene) {
    throw new ApiRequestError({
      status: 409,
      message: 'Chapter run cannot start because all accepted scenes are already drafted.',
      code: 'CHAPTER_RUN_ALL_SCENES_DRAFTED',
      detail: {
        chapterId: input.chapterId,
      },
    })
  }

  const updatedRecord = updateSceneBacklogStatus(record, selectedScene.sceneId, 'needs_review')
  mutableMockChapterRecords[input.chapterId] = updatedRecord

  const run = startMockSceneRun({
    sceneId: selectedScene.sceneId,
    mode: input.mode,
    note: input.note,
  }, projectId)

  return {
    chapter: clone(updatedRecord),
    run,
    selectedScene,
  }
}

export function setMockChapterSceneBacklogStatus(sceneId: string, backlogStatus: ChapterStructureWorkspaceRecord['scenes'][number]['backlogStatus']) {
  for (const [chapterId, record] of Object.entries(mutableMockChapterRecords)) {
    if (!record.scenes.some((scene) => scene.id === sceneId)) {
      continue
    }

    mutableMockChapterRecords[chapterId] = updateSceneBacklogStatus(record, sceneId, backlogStatus)
    return clone(mutableMockChapterRecords[chapterId]!)
  }

  return null
}

interface ReorderMockChapterSceneInput {
  chapterId: string
  sceneId: string
  targetIndex: number
}

export function reorderMockChapterScene({
  chapterId,
  sceneId,
  targetIndex,
}: ReorderMockChapterSceneInput): ChapterStructureWorkspaceRecord | null {
  const record = mutableMockChapterRecords[chapterId]
  if (!record) {
    return null
  }

  const nextRecord = reorderChapterRecordScenes(record, sceneId, targetIndex)
  mutableMockChapterRecords[chapterId] = nextRecord
  return clone(nextRecord)
}

interface UpdateMockChapterSceneStructureInput {
  chapterId: string
  sceneId: string
  locale: 'en' | 'zh-CN'
  patch: ChapterSceneStructurePatch
}

export function updateMockChapterSceneStructure({
  chapterId,
  sceneId,
  locale,
  patch,
}: UpdateMockChapterSceneStructureInput): ChapterStructureWorkspaceRecord | null {
  const record = mutableMockChapterRecords[chapterId]
  if (!record) {
    return null
  }

  const nextRecord = patchChapterRecordScene(record, sceneId, patch, locale)
  mutableMockChapterRecords[chapterId] = nextRecord
  return clone(nextRecord)
}

export function exportMockChapterSnapshot(): Record<string, ChapterStructureWorkspaceRecord> {
  return clone(mutableMockChapterRecords)
}

export function importMockChapterSnapshot(snapshot: Record<string, ChapterStructureWorkspaceRecord>): void {
  mutableMockChapterRecords = {
    ...clone(mockChapterRecordSeeds),
    ...clone(snapshot),
  }
}

import { randomUUID } from 'node:crypto'

import type {
  AssetContextVisibilityRecord,
  AssetKnowledgeWorkspaceRecord,
  BookReviewIssueSnapshotsRecord,
  AssetNavigatorGroupsRecord,
  AssetNavigatorResponseRecord,
  AssetRecord,
  AssetStoryBibleFactRecord,
  AssetStoryBibleSourceRefRecord,
  AssetSummaryRecord,
  AssetStateTimelineEntryRecord,
  BookDraftAssemblyChapterHeadingSectionRecord,
  BookDraftAssemblyChapterRecord,
  BookDraftAssemblyManuscriptSectionRecord,
  BookDraftAssemblyRecord,
  BookDraftAssemblyReadableManuscriptRecord,
  BookDraftAssemblySceneGapRecord,
  BookDraftAssemblySceneRecord,
  BookDraftAssemblySceneManuscriptSectionRecord,
  BookDraftAssemblySourceManifestEntryRecord,
  BookDraftAssemblyTraceRollupRecord,
  BookDraftAssemblyTransitionManuscriptSectionRecord,
  ChapterDraftAssemblyRecord,
  ChapterDraftAssemblySceneGapSectionRecord,
  ChapterDraftAssemblySceneRecord,
  ChapterDraftAssemblySectionRecord,
  ChapterDraftAssemblyTraceRollupRecord,
  ChapterDraftAssemblyTransitionDraftSectionRecord,
  ChapterDraftAssemblyTransitionGapSectionRecord,
  ChapterBacklogPlanningRecord,
  ChapterBacklogProposalSceneRecord,
  BookExperimentBranchRecord,
  BookExperimentBranchAdoptionRecord,
  BookExportArtifactRecord,
  BookExportProfileRecord,
  BookManuscriptCheckpointRecord,
  BookStructureRecord,
  CreateBookExperimentBranchAdoptionInput,
  CreateBookExperimentBranchInput,
  CreateBookManuscriptCheckpointInput,
  ArchiveBookExperimentBranchInput,
  BuildBookExportArtifactInput,
  CancelRunInput,
  ChapterSceneStructurePatch,
  ChapterSceneBacklogStatus,
  ChapterRunNextSceneRecord,
  ChapterStructureSceneRecord,
  ChapterStructureWorkspaceRecord,
  FixtureDataSnapshot,
  FixtureProjectData,
  LocalizedTextRecord,
  PatchChapterBacklogPlanningInput,
  ProjectRuntimeInfoRecord,
  ProposalActionInput,
  ReviewIssueAssetLocatorRecord,
  ReviewIssueCanonLocatorRecord,
  ProposalSetArtifactDetailRecord,
  ReviewIssueDecisionRecord,
  ReviewIssueFixActionRecord,
  ReviewIssueKindRecord,
  ReviewIssueProseLocatorRecord,
  ReviewIssueSceneLocatorRecord,
  ReviewIssueSeverityRecord,
  ReviewIssueSnapshotRecord,
  ReviewIssueSourceRecord,
  CanonPatchArtifactDetailRecord,
  ProseDraftArtifactDetailRecord,
  RunArtifactDetailRecord,
  RunArtifactSummaryRecord,
  RunEventsPageRecord,
  RunRecord,
  RunTraceResponse,
  ResumeRunInput,
  RetryRunInput,
  SceneDockTabId,
  SceneDockViewModel,
  SceneExecutionViewModel,
  SceneInspectorViewModel,
  ScenePatchPreviewViewModel,
  SceneProseViewModel,
  SceneFixtureRecord,
  SceneSetupViewModel,
  SceneWorkspaceViewModel,
  SetReviewIssueDecisionInput,
  SetReviewIssueFixActionInput,
  StartNextChapterSceneRunInput,
  StartNextChapterSceneRunRecord,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
  UpdateChapterBacklogProposalSceneInput,
} from '../contracts/api-records.js'
import { conflict, notFound } from '../http/errors.js'
import { createChapterBacklogProposal } from '../orchestration/chapterBacklog/chapterBacklogPlanner.js'
import {
  CHAPTER_RUN_REVIEW_GATE_BLOCKED,
  resolveNextChapterRunScene,
  updateChapterRunSceneBacklogStatus,
} from '../orchestration/chapterRun/chapterRunOrchestration.js'
import type {
  ScenePlannerGatewayRequest,
  ScenePlannerGatewayResult,
} from '../orchestration/modelGateway/scenePlannerGateway.js'
import type {
  SceneProseWriterGatewayRequest,
  SceneProseWriterGatewayResult,
} from '../orchestration/modelGateway/sceneProseWriterGateway.js'
import { createSceneProseWriterGateway } from '../orchestration/modelGateway/sceneProseWriterGateway.js'
import { buildSceneContextPacket } from '../orchestration/contextBuilder/sceneContextBuilder.js'
import {
  buildAcceptedFactsFromCanonPatch,
  buildSceneProseFromProseDraftArtifact,
} from '../orchestration/sceneRun/sceneRunProseMaterialization.js'
import {
  acceptSceneProseRevisionCandidate,
  applySceneProseRevisionCandidate,
} from '../orchestration/sceneRun/sceneRunProseRevision.js'

import { createFixtureDataSnapshot } from './fixture-data.js'
import type {
  LocalProjectStoreRecord,
  PersistedRunStore,
} from './project-state-persistence.js'
import { createRunFixtureStore, type RunFixtureStore } from './runFixtureStore.js'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function jsonEquals(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function toJsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function localizedText(en: string, zhCN: string) {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function localizeCurrentSceneProseStatusLabel(statusLabel: string) {
  switch (statusLabel) {
    case 'Draft ready for review':
      return localizedText(statusLabel, '草稿可供审阅')
    case 'Generated':
      return localizedText(statusLabel, '已生成')
    case 'Updated':
      return localizedText(statusLabel, '已更新')
    case 'Revision queued':
      return localizedText(statusLabel, '修订已排队')
    case 'Revision candidate ready':
      return localizedText(statusLabel, '修订候选已就绪')
    case 'Ready for revision pass':
      return localizedText(statusLabel, '可进入修订轮')
    case 'Draft handoff ready':
      return localizedText(statusLabel, '草稿交接已就绪')
    case 'Waiting for prose artifact':
      return localizedText(statusLabel, '等待正文产物')
    case 'Missing draft':
      return localizedText(statusLabel, '缺少草稿')
    case 'Accepted with edit':
      return localizedText(statusLabel, '接受并编辑')
    default:
      return localizedText(statusLabel, statusLabel)
  }
}

function mergeLocalizedText(value: { en: string; 'zh-CN': string }, locale: 'en' | 'zh-CN', nextValue: string) {
  return {
    ...value,
    [locale]: nextValue,
  }
}

const assetVisibilityRank: Record<AssetContextVisibilityRecord, number> = {
  public: 0,
  'character-known': 1,
  private: 2,
  spoiler: 3,
  'editor-only': 4,
}

function assetText(en: string, zhCN: string): LocalizedTextRecord {
  return localizedText(en, zhCN)
}

function assetSourceRef(
  id: string,
  kind: AssetStoryBibleSourceRefRecord['kind'],
  en: string,
  zhCN: string,
): AssetStoryBibleSourceRefRecord {
  return {
    id,
    kind,
    label: assetText(en, zhCN),
  }
}

function assetFact(
  id: string,
  label: LocalizedTextRecord,
  value: LocalizedTextRecord,
  visibility: AssetContextVisibilityRecord,
  sourceRefs: AssetStoryBibleSourceRefRecord[],
  lastReviewedAtLabel: string,
): AssetStoryBibleFactRecord {
  return {
    id,
    label,
    value,
    visibility,
    sourceRefs,
    lastReviewedAtLabel,
  }
}

function assetTimeline(
  id: string,
  label: LocalizedTextRecord,
  summary: LocalizedTextRecord,
  sceneId: string,
  chapterId: string,
  status: AssetStateTimelineEntryRecord['status'],
  sourceRefs: AssetStoryBibleSourceRefRecord[],
): AssetStateTimelineEntryRecord {
  return {
    id,
    label,
    summary,
    sceneId,
    chapterId,
    status,
    sourceRefs,
  }
}

function filterStoryBibleFacts(
  facts: AssetStoryBibleFactRecord[],
  visibility?: AssetContextVisibilityRecord,
) {
  if (!visibility) {
    return facts
  }

  return facts.filter((fact) => assetVisibilityRank[fact.visibility] <= assetVisibilityRank[visibility])
}

function withAssetDefaults(record: Partial<AssetRecord> & Pick<AssetRecord, 'id' | 'kind' | 'title' | 'summary'>): AssetRecord {
  return {
    visibility: 'public',
    profile: { sections: [] },
    canonFacts: [],
    privateFacts: [],
    stateTimeline: [],
    mentions: [],
    relations: [],
    ...record,
  }
}

function buildAugmentedAssetKnowledgeWorkspace(
  rawWorkspace: AssetKnowledgeWorkspaceRecord,
  assetId: string,
  visibility?: AssetContextVisibilityRecord,
): AssetKnowledgeWorkspaceRecord | null {
  const baseById = new Map(rawWorkspace.assets.map((asset) => [asset.id, asset]))
  const platformWitnessLog = assetSourceRef('source-platform-witness-log', 'scene', 'Midnight platform witness log', '午夜站台目击记录')
  const windowQueueNotes = assetSourceRef('source-window-queue-notes', 'scene', 'Ticket window queue notes', '售票窗队列笔记')
  const courierSignalNotes = assetSourceRef('source-courier-signal-notes', 'note', 'Courier signal notes', '信使暗号笔记')
  const courierRoster = assetSourceRef('source-courier-roster', 'asset', 'Courier network roster', '信使网络名册')
  const ledgerShellBrief = assetSourceRef('source-ledger-shell-brief', 'note', 'Closed ledger shell brief', '闭合账本外壳简报')
  const witnessProtocol = assetSourceRef('source-witness-protocol', 'note', 'Witness protocol memo', '目击协议备忘')

  const assets: AssetRecord[] = [
    withAssetDefaults({
      ...baseById.get('asset-ren-voss'),
      id: 'asset-ren-voss',
      kind: 'character',
      title: assetText('Ren Voss', '任·沃斯'),
      summary: assetText(
        'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
        '站在信使一侧的谈判者，在公开压力里一边拖时间，一边坚持账本不能被翻开。',
      ),
      visibility: 'character-known',
      canonFacts: [
        assetFact(
          'ren-public-line',
          assetText('Public line', '公开底线'),
          assetText('Ren will stall in public before he lets the ledger open.', '只要还在公开场合，Ren 宁可拖延也不会让账本打开。'),
          'public',
          [platformWitnessLog],
          '2026-04-27 22:10',
        ),
      ],
      privateFacts: [
        assetFact(
          'ren-courier-key',
          assetText('Courier signal key', '信使暗号钥匙'),
          assetText('Ren is still the only person carrying the current signal key for the courier network.', 'Ren 仍是唯一携带当前信使网络暗号钥匙的人。'),
          'private',
          [courierSignalNotes, courierRoster],
          '2026-04-27 22:14',
        ),
      ],
      stateTimeline: [
        assetTimeline(
          'ren-midnight-platform',
          assetText('Midnight Platform standoff', '午夜站台对峙'),
          assetText('Ren keeps the ledger closed while the witness pressure hardens around him.', 'Ren 在目击压力不断变硬的同时坚持不打开账本。'),
          'scene-midnight-platform',
          'chapter-signals-in-rain',
          'established',
          [platformWitnessLog],
        ),
      ],
      relations: [
        {
          id: 'relation-ren-mei',
          targetAssetId: 'asset-mei-arden',
          relationLabel: assetText('Bargains against', '相互谈判'),
          summary: assetText(
            'Ren needs Mei’s timing, but refuses the terms that would make the ledger public.',
            'Ren 需要 Mei 给出时机，但拒绝接受会让账本公开的条件。',
          ),
        },
        {
          id: 'relation-ren-network',
          targetAssetId: 'asset-courier-network',
          relationLabel: assetText('Represents', '代表'),
          summary: assetText('Ren carries the courier network’s bargaining posture into public view.', 'Ren 把信使网络的谈判姿态带进公开视野。'),
        },
        {
          id: 'relation-ren-ledger',
          targetAssetId: 'asset-public-witness-rule',
          relationLabel: assetText('Protects', '保护'),
          summary: assetText('Ren treats the public witness rule as the non-negotiable line of the exchange.', 'Ren 把公开目击规则当成整场交换里不可退让的底线。'),
        },
      ],
    }),
    withAssetDefaults({
      ...baseById.get('asset-mei-arden'),
      id: 'asset-mei-arden',
      kind: 'character',
      title: assetText('Mei Arden', '美伊·阿登'),
      summary: assetText(
        'Counterparty who keeps raising the visible cost until Ren gives her a usable commitment.',
        '不断抬高公开代价的对手，直到 Ren 给出她能用的承诺。',
      ),
      visibility: 'public',
    }),
    withAssetDefaults({
      ...baseById.get('asset-midnight-platform'),
      id: 'asset-midnight-platform',
      kind: 'location',
      title: assetText('Midnight Platform', '午夜站台'),
      summary: assetText(
        'Open platform where every hesitation turns into public leverage and witness pressure.',
        '一个公开暴露的站台，任何犹豫都会被放大成目击压力和公开筹码。',
      ),
      visibility: 'public',
      relations: [
        {
          id: 'relation-platform-window',
          targetAssetId: 'asset-ticket-window',
          relationLabel: assetText('Funnels pressure toward', '把压力导向'),
          summary: assetText('The platform’s witness pressure flows directly into the ticket window negotiation.', '月台上的目击压力会直接流向售票窗的交换。'),
        },
        {
          id: 'relation-platform-network',
          targetAssetId: 'asset-courier-network',
          relationLabel: assetText('Exposes', '暴露'),
          summary: assetText('The platform strips the courier network of any chance to operate unseen.', '月台会剥夺信使网络在无人察觉中行动的机会。'),
        },
      ],
    }),
    withAssetDefaults({
      ...baseById.get('asset-ticket-window'),
      id: 'asset-ticket-window',
      kind: 'location',
      title: assetText('Ticket Window', '售票窗'),
      summary: assetText(
        'Narrow exchange point where speed, certainty, and queue pressure all become visible at once.',
        '一个狭窄的交换节点，速度、确定性和排队压力会在这里同时显形。',
      ),
      visibility: 'public',
    }),
    withAssetDefaults({
      id: 'asset-courier-network',
      kind: 'organization',
      title: assetText('Courier Network', '信使网络'),
      summary: assetText('The organization trying to keep witness pressure survivable while preserving the closed-ledger line.', '试图在保住闭合账本底线的同时，让目击压力仍可承受的组织。'),
      visibility: 'character-known',
      canonFacts: [
        assetFact(
          'network-public-posture',
          assetText('Public posture', '公开姿态'),
          assetText('The network prefers delay over exposure when witness pressure spikes.', '当目击压力陡增时，网络宁可拖延也不愿曝光。'),
          'character-known',
          [courierRoster],
          '2026-04-27 22:22',
        ),
      ],
      stateTimeline: [
        assetTimeline(
          'network-platform-exposure',
          assetText('Platform exposure', '月台暴露'),
          assetText('The network loses its usual shadow cover once the bargain moves onto the platform.', '一旦交易移上月台，网络惯有的阴影掩护就会失效。'),
          'scene-midnight-platform',
          'chapter-signals-in-rain',
          'watch',
          [platformWitnessLog, courierRoster],
        ),
      ],
      relations: [
        {
          id: 'relation-network-ren',
          targetAssetId: 'asset-ren-voss',
          relationLabel: assetText('Relies on', '依赖'),
          summary: assetText('Ren is the network’s visible negotiator when private signaling stops working.', '当私密暗号失灵时，Ren 就是网络在明面上的谈判者。'),
        },
      ],
    }),
    withAssetDefaults({
      id: 'asset-closed-ledger',
      kind: 'object',
      title: assetText('Closed Ledger', '闭合账本'),
      summary: assetText('A sealed object whose proof value would end the bargaining game the moment it becomes public.', '一个一旦公开就会立刻终结整场谈判游戏的封存物件。'),
      visibility: 'character-known',
      canonFacts: [
        assetFact(
          'closed-ledger-shell',
          assetText('Outer shell', '外层封壳'),
          assetText('Most witnesses only know the ledger as a sealed object that should not be opened publicly.', '大多数目击者只知道它是一个不该在公开场合打开的封存物件。'),
          'character-known',
          [ledgerShellBrief],
          '2026-04-27 22:24',
        ),
        assetFact(
          'closed-ledger-witness-proof',
          assetText('Witness proof payload', '目击证明载荷'),
          assetText('The proof inside the ledger would settle the bargain instantly if revealed to the crowd.', '如果把账本里的证明内容直接暴露给人群，整场交易会被立刻定性。'),
          'spoiler',
          [witnessProtocol],
          '2026-04-27 22:26',
        ),
      ],
      stateTimeline: [
        assetTimeline(
          'closed-ledger-platform-lock',
          assetText('Platform lock', '月台封锁'),
          assetText('The ledger stays sealed while the platform remains fully witnessed.', '只要月台仍处于被完整目击的状态，账本就必须保持封存。'),
          'scene-midnight-platform',
          'chapter-signals-in-rain',
          'established',
          [platformWitnessLog, ledgerShellBrief],
        ),
      ],
      relations: [
        {
          id: 'relation-closed-ledger-rule',
          targetAssetId: 'asset-public-witness-rule',
          relationLabel: assetText('Carries', '承载'),
          summary: assetText('The object is the concrete container of the public witness rule.', '这个物件是公开目击规则的具体承载体。'),
        },
      ],
    }),
    withAssetDefaults({
      id: 'asset-public-witness-rule',
      kind: 'lore',
      title: assetText('Public Witness Rule', '公开目击规则'),
      summary: assetText('Lore-level truth that no witnessed bargain survives once direct proof is placed in public view.', '一条 lore 级真相：一旦直接证明被摆到公开目击面前，任何被围观的交易都无法继续维持原状。'),
      visibility: 'public',
      canonFacts: [
        assetFact(
          'witness-rule-surface',
          assetText('Surface rule', '表层规则'),
          assetText('As long as witnesses remain, the bargain must stay one step away from proof.', '只要目击者还在，交易就必须始终与证明保持一步之遥。'),
          'public',
          [witnessProtocol],
          '2026-04-27 22:28',
        ),
      ],
      relations: [
        {
          id: 'relation-witness-rule-ledger',
          targetAssetId: 'asset-closed-ledger',
          relationLabel: assetText('Governs', '支配'),
          summary: assetText('The public witness rule explains why the closed ledger cannot become public proof.', '公开目击规则解释了为什么闭合账本不能成为公开证明。'),
        },
      ],
    }),
    withAssetDefaults({
      ...baseById.get('asset-ledger-stays-shut'),
      id: 'asset-ledger-stays-shut',
      kind: 'lore',
      title: assetText('Ledger Stays Shut', '账本不得打开'),
      summary: assetText(
        'Deprecated rule seed retained for compatibility with older asset stories and run fixtures.',
        '为兼容旧版 asset story 和 run fixture 而保留的旧规则种子。',
      ),
      visibility: 'spoiler',
    }),
    withAssetDefaults({
      ...baseById.get('asset-departure-bell-timing'),
      id: 'asset-departure-bell-timing',
      kind: 'lore',
      title: assetText('Departure Bell Timing', '发车铃时序'),
      summary: assetText(
        'Timing rule that decides when the exit can move without draining witness pressure too early.',
        '一条时序规则，用来决定何时可以离场，又不至于过早抽干目击压力。',
      ),
      visibility: 'editor-only',
    }),
  ].map((asset) => ({
    ...asset,
    canonFacts: filterStoryBibleFacts(asset.canonFacts ?? [], visibility),
    privateFacts: filterStoryBibleFacts(asset.privateFacts ?? [], visibility),
  }))

  if (!assets.find((asset) => asset.id === assetId)) {
    return null
  }

  return {
    assetId,
    assets,
    requestedVisibility: visibility,
    viewsMeta: rawWorkspace.viewsMeta,
  }
}

function summarizeAssetsForNavigator(workspace: AssetKnowledgeWorkspaceRecord): AssetNavigatorResponseRecord {
  const groups: AssetNavigatorGroupsRecord = {
    character: [],
    location: [],
    organization: [],
    object: [],
    lore: [],
  }

  for (const asset of workspace.assets) {
    groups[asset.kind].push({
      id: asset.id,
      kind: asset.kind,
      title: asset.title,
      summary: asset.summary,
      visibility: asset.visibility ?? 'public',
      mentionCount: asset.mentions.length,
      relationCount: asset.relations.length,
      hasWarnings: (asset.warnings?.length ?? 0) > 0,
    } satisfies AssetSummaryRecord)
  }

  for (const kind of Object.keys(groups) as Array<keyof AssetNavigatorGroupsRecord>) {
    groups[kind].sort((left, right) => left.title.en.localeCompare(right.title.en))
  }

  return { groups }
}

function normalizeIndex(targetIndex: number, sceneCount: number) {
  if (sceneCount <= 1) {
    return 0
  }

  return Math.min(Math.max(targetIndex, 0), sceneCount - 1)
}

function normalizeSceneOrders(record: ChapterStructureWorkspaceRecord): ChapterStructureWorkspaceRecord {
  return {
    ...record,
    scenes: [...record.scenes]
      .sort((left, right) => left.order - right.order)
      .map((scene, index) => ({
        ...scene,
        order: index + 1,
      })),
  }
}

function reorderChapterRecordScenes(
  record: ChapterStructureWorkspaceRecord,
  sceneId: string,
  targetIndex: number,
): ChapterStructureWorkspaceRecord {
  const normalizedRecord = normalizeSceneOrders(record)
  const sourceIndex = normalizedRecord.scenes.findIndex((scene) => scene.id === sceneId)
  if (sourceIndex < 0) {
    return normalizedRecord
  }

  const nextScenes = [...normalizedRecord.scenes]
  const [movedScene] = nextScenes.splice(sourceIndex, 1)
  if (!movedScene) {
    return normalizedRecord
  }

  nextScenes.splice(normalizeIndex(targetIndex, normalizedRecord.scenes.length), 0, movedScene)

  return {
    ...normalizedRecord,
    scenes: nextScenes.map((scene, index) => ({
      ...scene,
      order: index + 1,
    })),
  }
}

function patchChapterRecordScene(
  record: ChapterStructureWorkspaceRecord,
  sceneId: string,
  patch: ChapterSceneStructurePatch,
  locale: 'en' | 'zh-CN',
): ChapterStructureWorkspaceRecord {
  const sceneFields: Array<keyof Pick<ChapterStructureSceneRecord, 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal'>> = [
    'summary',
    'purpose',
    'pov',
    'location',
    'conflict',
    'reveal',
  ]

  return {
    ...record,
    scenes: record.scenes.map((scene) => {
      if (scene.id !== sceneId) {
        return scene
      }

      const nextScene: ChapterStructureSceneRecord = { ...scene }
      for (const field of sceneFields) {
        const nextValue = patch[field]
        if (nextValue === undefined) {
          continue
        }

        nextScene[field] = mergeLocalizedText(nextScene[field], locale, nextValue)
      }

      return nextScene
    }),
  }
}

function normalizeProposalSceneOrders(
  scenes: ChapterBacklogProposalSceneRecord[],
): ChapterBacklogProposalSceneRecord[] {
  return scenes.map((scene, index) => ({
    ...scene,
    order: index + 1,
  }))
}

function reorderProposalScenes(
  scenes: ChapterBacklogProposalSceneRecord[],
  proposalSceneId: string,
  targetOrder: number,
): ChapterBacklogProposalSceneRecord[] {
  const normalizedScenes = normalizeProposalSceneOrders(scenes)
  const sourceIndex = normalizedScenes.findIndex((scene) => scene.proposalSceneId === proposalSceneId)
  if (sourceIndex < 0) {
    return normalizedScenes
  }

  const nextScenes = [...normalizedScenes]
  const [movedScene] = nextScenes.splice(sourceIndex, 1)
  if (!movedScene) {
    return normalizedScenes
  }

  const targetIndex = Math.min(Math.max(targetOrder - 1, 0), nextScenes.length)
  nextScenes.splice(targetIndex, 0, movedScene)
  return normalizeProposalSceneOrders(nextScenes)
}

function createConstraintId(index: number) {
  return `constraint-${String(index + 1).padStart(3, '0')}`
}

function patchChapterBacklogPlanning(
  record: ChapterStructureWorkspaceRecord,
  input: PatchChapterBacklogPlanningInput,
): ChapterStructureWorkspaceRecord {
  const nextPlanning: ChapterBacklogPlanningRecord = {
    ...record.planning,
    goal: input.goal === undefined
      ? clone(record.planning.goal)
      : mergeLocalizedText(record.planning.goal, input.locale, input.goal),
    constraints: input.constraints === undefined
      ? clone(record.planning.constraints)
      : input.constraints.map((constraint, index) => ({
        id: record.planning.constraints[index]?.id ?? createConstraintId(index),
        label: mergeLocalizedText(
          record.planning.constraints[index]?.label ?? localizedText('', ''),
          input.locale,
          constraint,
        ),
        detail: clone(record.planning.constraints[index]?.detail ?? localizedText('', '')),
      })),
  }

  return {
    ...record,
    planning: nextPlanning,
  }
}

function patchChapterBacklogProposalScene(
  record: ChapterStructureWorkspaceRecord,
  proposalId: string,
  proposalSceneId: string,
  input: UpdateChapterBacklogProposalSceneInput,
): ChapterStructureWorkspaceRecord {
  return {
    ...record,
    planning: {
      ...record.planning,
      proposals: record.planning.proposals.map((proposal) => {
        if (proposal.proposalId !== proposalId) {
          return proposal
        }

    const patchedScenes = proposal.scenes.map((scene) => {
            if (scene.proposalSceneId !== proposalSceneId) {
              return scene
            }

            const nextScene = {
              ...scene,
              backlogStatus: input.backlogStatus ?? scene.backlogStatus,
            }

            if (input.patch?.title !== undefined) {
              nextScene.title = mergeLocalizedText(nextScene.title, input.locale, input.patch.title)
            }
            if (input.patch?.summary !== undefined) {
              nextScene.summary = mergeLocalizedText(nextScene.summary, input.locale, input.patch.summary)
            }
            if (input.patch?.purpose !== undefined) {
              nextScene.purpose = mergeLocalizedText(nextScene.purpose, input.locale, input.patch.purpose)
            }
            if (input.patch?.pov !== undefined) {
              nextScene.pov = mergeLocalizedText(nextScene.pov, input.locale, input.patch.pov)
            }
            if (input.patch?.location !== undefined) {
              nextScene.location = mergeLocalizedText(nextScene.location, input.locale, input.patch.location)
            }
            if (input.patch?.conflict !== undefined) {
              nextScene.conflict = mergeLocalizedText(nextScene.conflict, input.locale, input.patch.conflict)
            }
            if (input.patch?.reveal !== undefined) {
              nextScene.reveal = mergeLocalizedText(nextScene.reveal, input.locale, input.patch.reveal)
            }
            if (input.patch?.plannerNotes !== undefined) {
              nextScene.plannerNotes = mergeLocalizedText(nextScene.plannerNotes, input.locale, input.patch.plannerNotes)
            }

            return nextScene
          })
        const nextScenes = input.order === undefined
          ? normalizeProposalSceneOrders(patchedScenes)
          : reorderProposalScenes(patchedScenes, proposalSceneId, input.order)

        return {
          ...proposal,
          scenes: nextScenes,
        }
      }),
    },
  }
}

function applyAcceptedChapterBacklogProposal(
  record: ChapterStructureWorkspaceRecord,
  proposalId: string,
): ChapterStructureWorkspaceRecord {
  const proposal = record.planning.proposals.find((item) => item.proposalId === proposalId)
  if (!proposal) {
    return record
  }

  const proposalScenesBySceneId = new Map(proposal.scenes.map((scene) => [scene.sceneId, scene]))

  const nextScenes = normalizeSceneOrders({
    ...record,
    scenes: proposal.scenes.map((proposalScene) => {
      const currentScene = record.scenes.find((scene) => scene.id === proposalScene.sceneId)
      if (!currentScene) {
        throw notFound(`Scene ${proposalScene.sceneId} was not found.`, {
          code: 'SCENE_NOT_FOUND',
          detail: { chapterId: record.chapterId, sceneId: proposalScene.sceneId },
        })
      }

      return {
        ...currentScene,
        order: proposalScene.order,
        title: clone(proposalScene.title),
        summary: clone(proposalScene.summary),
        purpose: clone(proposalScene.purpose),
        pov: clone(proposalScene.pov),
        location: clone(proposalScene.location),
        conflict: clone(proposalScene.conflict),
        reveal: clone(proposalScene.reveal),
        backlogStatus: proposalScene.backlogStatus,
      }
    }),
  }).scenes

  return {
    ...record,
    scenes: nextScenes,
    planning: {
      ...record.planning,
      acceptedProposalId: proposalId,
      proposals: record.planning.proposals.map((item) => ({
        ...item,
        status: item.proposalId === proposalId ? 'accepted' : item.status,
        scenes: item.proposalId === proposalId
          ? normalizeProposalSceneOrders(item.scenes)
          : item.scenes.map((scene) => ({
            ...scene,
            backlogStatus: proposalScenesBySceneId.get(scene.sceneId)?.backlogStatus ?? scene.backlogStatus,
          })),
      })),
    },
  }
}

function createReviewDecisionRecordId(bookId: string, issueId: string) {
  return `${bookId}::${issueId}`
}

function createReviewFixActionRecordId(bookId: string, issueId: string) {
  return `${bookId}::${issueId}`
}

function trimNote(note?: string) {
  const value = note?.trim()
  return value ? value : undefined
}

interface FixtureReviewIssueSeedRecord {
  id: string
  severity: ReviewIssueSeverityRecord
  source: ReviewIssueSourceRecord
  kind: ReviewIssueKindRecord
  title: string
  detail: string
  chapterId?: string
  sceneId?: string
  assetId?: string
  sourceExcerpt?: string
  sceneLocator?: ReviewIssueSceneLocatorRecord
  assetLocator?: ReviewIssueAssetLocatorRecord
  canonLocator?: ReviewIssueCanonLocatorRecord
  proseLocator?: ReviewIssueProseLocatorRecord
}

const FIXTURE_REVIEW_ISSUE_SEEDS: Record<string, FixtureReviewIssueSeedRecord[]> = {
  'book-signal-arc': [
    {
      id: 'scene-proposal-seed-scene-5',
      severity: 'warning',
      source: 'scene-proposal',
      kind: 'scene_proposal',
      title: 'Scene proposal needs review',
      detail: 'Scene Five is still waiting for proposal review before it can settle into the draft.',
      chapterId: 'chapter-open-water-signals',
      sceneId: 'scene-5',
      sourceExcerpt: 'Scene Five still carries an execution proposal that has not been folded back into the manuscript.',
      sceneLocator: {
        chapterId: 'chapter-open-water-signals',
        sceneId: 'scene-5',
      },
      proseLocator: {
        chapterId: 'chapter-open-water-signals',
        sceneId: 'scene-5',
        excerpt: 'Scene Five still carries an execution proposal that has not been folded back into the manuscript.',
      },
    },
    {
      id: 'chapter-annotation-seed-chapter-1',
      severity: 'warning',
      source: 'chapter-draft',
      kind: 'chapter_annotation',
      title: 'Chapter annotation needs follow-up',
      detail: 'Chapter One still carries a draft annotation that needs editorial follow-up.',
      chapterId: 'chapter-1',
      sourceExcerpt: 'Editorial note: confirm whether the opening pressure beat should stay in Chapter One or move downstream.',
    },
    {
      id: 'trace-gap-seed-asset-ledger',
      severity: 'warning',
      source: 'traceability',
      kind: 'trace_gap',
      title: 'Asset trace gap noted',
      detail: 'The Ledger reference still needs a traceability note in Scene Two.',
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
      assetId: 'asset-ledger',
      sourceExcerpt: 'Ledger appears in Scene Two, but the current manuscript still lacks a matching traceability note.',
      sceneLocator: {
        chapterId: 'chapter-1',
        sceneId: 'scene-2',
      },
      assetLocator: {
        assetId: 'asset-ledger',
      },
      proseLocator: {
        chapterId: 'chapter-1',
        sceneId: 'scene-2',
        excerpt: 'Ledger appears in Scene Two, but the current manuscript still lacks a matching traceability note.',
      },
    },
    {
      id: 'continuity-conflict-ledger-public-proof',
      severity: 'blocker',
      source: 'continuity',
      kind: 'continuity_conflict',
      title: 'Ledger visibility conflicts with the public-proof beat',
      detail: 'Midnight Platform prose implies the ledger proof already went public while the continuity ledger still marks it as withheld.',
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-midnight-platform',
      assetId: 'asset-ledger',
      sourceExcerpt: 'The current prose treats the ledger proof as public even though the continuity ledger still keeps it private.',
      sceneLocator: {
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-midnight-platform',
      },
      assetLocator: {
        assetId: 'asset-ledger',
      },
      canonLocator: {
        entityId: 'asset-ledger',
        factIds: ['canon-ledger-public-proof'],
      },
      proseLocator: {
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-midnight-platform',
        excerpt: 'Ren treats the proof as already public on the midnight platform.',
      },
    },
    {
      id: 'missing-trace-departure-bell',
      severity: 'warning',
      source: 'traceability',
      kind: 'missing_trace',
      title: 'Departure Bell has no trace references',
      detail: 'Departure Bell currently reads as draft prose, but it carries no scene-level trace references back to canon or proposals.',
      chapterId: 'chapter-open-water-signals',
      sceneId: 'scene-departure-bell',
      sourceExcerpt: 'Departure Bell prose is readable, yet the trace chain is blank.',
      sceneLocator: {
        chapterId: 'chapter-open-water-signals',
        sceneId: 'scene-departure-bell',
      },
      proseLocator: {
        chapterId: 'chapter-open-water-signals',
        sceneId: 'scene-departure-bell',
        excerpt: 'The departure bell lands as prose, but no trace references survive in the current draft.',
      },
    },
    {
      id: 'stale-prose-after-canon-midnight-platform',
      severity: 'warning',
      source: 'stale-prose',
      kind: 'stale_prose_after_canon_change',
      title: 'Midnight Platform prose is stale after canon changed',
      detail: 'The accepted canon facts moved after the last draft pass, but Midnight Platform prose still reflects the earlier ledger phrasing.',
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-midnight-platform',
      sourceExcerpt: 'Current prose still uses the pre-change ledger wording.',
      sceneLocator: {
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-midnight-platform',
      },
      canonLocator: {
        entityId: 'asset-ledger',
        factIds: ['canon-ledger-public-proof'],
      },
      proseLocator: {
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-midnight-platform',
        excerpt: 'The prose still uses the older ledger wording.',
      },
    },
    {
      id: 'chapter-gap-open-water-bridge',
      severity: 'warning',
      source: 'manuscript',
      kind: 'chapter_gap',
      title: 'Open Water Signals is missing a readable bridge section',
      detail: 'The chapter still assembles without a readable bridge passage between its current scene drafts.',
      chapterId: 'chapter-open-water-signals',
      sourceExcerpt: 'The assembled draft jumps across Open Water Signals without a readable bridge section.',
    },
    {
      id: 'asset-inconsistency-ledger-rule',
      severity: 'warning',
      source: 'asset-consistency',
      kind: 'asset_inconsistency',
      title: 'Ledger rule conflicts with current asset usage',
      detail: 'The ledger rule still marks the proof path as sealed, but the latest review trail references an already-open ledger exchange.',
      chapterId: 'chapter-signals-in-rain',
      assetId: 'asset-ledger-rule',
      sourceExcerpt: 'Ledger rule and current review notes disagree about whether the proof can surface in public.',
      assetLocator: {
        assetId: 'asset-ledger-rule',
      },
      canonLocator: {
        entityId: 'asset-ledger-rule',
        factIds: ['canon-ledger-rule-visibility'],
      },
    },
  ],
}

function createFixtureReviewIssueSignature(seed: FixtureReviewIssueSeedRecord) {
  return [
    seed.id,
    seed.kind,
    seed.source,
    seed.chapterId ?? '',
    seed.sceneId ?? '',
    seed.assetId ?? '',
    seed.title,
    seed.detail,
    seed.sourceExcerpt ?? '',
  ].join('::')
}

function buildReviewIssueSnapshotsRecord(
  bookId: string,
  reviewDecisions: ReviewIssueDecisionRecord[],
  reviewFixActions: ReviewIssueFixActionRecord[],
): BookReviewIssueSnapshotsRecord {
  const decisionsByIssueId = new Map(reviewDecisions.map((record) => [record.issueId, record]))
  const fixActionsByIssueId = new Map(reviewFixActions.map((record) => [record.issueId, record]))
  const seeds = FIXTURE_REVIEW_ISSUE_SEEDS[bookId] ?? []

  return {
    bookId,
    issues: seeds.map((seed): ReviewIssueSnapshotRecord => {
      const issueSignature = createFixtureReviewIssueSignature(seed)
      const decisionRecord = decisionsByIssueId.get(seed.id)
      const fixActionRecord = fixActionsByIssueId.get(seed.id)

      return {
        id: seed.id,
        severity: seed.severity,
        source: seed.source,
        kind: seed.kind,
        title: seed.title,
        detail: seed.detail,
        issueSignature,
        chapterId: seed.chapterId,
        sceneId: seed.sceneId,
        assetId: seed.assetId,
        sceneLocator: seed.sceneLocator,
        assetLocator: seed.assetLocator,
        canonLocator: seed.canonLocator,
        proseLocator: seed.proseLocator,
        decision: decisionRecord
          ? decisionRecord.issueSignature === issueSignature
            ? {
                status: decisionRecord.status,
                note: decisionRecord.note,
                updatedAtLabel: decisionRecord.updatedAtLabel,
                updatedByLabel: decisionRecord.updatedByLabel,
                isStale: false,
              }
            : {
                status: 'stale',
                note: decisionRecord.note,
                updatedAtLabel: decisionRecord.updatedAtLabel,
                updatedByLabel: decisionRecord.updatedByLabel,
                isStale: true,
              }
          : {
              status: 'open',
              isStale: false,
            },
        fixAction: fixActionRecord
          ? fixActionRecord.issueSignature === issueSignature
            ? {
                status: fixActionRecord.status,
                sourceHandoffId: fixActionRecord.sourceHandoffId,
                sourceHandoffLabel: fixActionRecord.sourceHandoffLabel,
                targetScope: fixActionRecord.targetScope,
                note: fixActionRecord.note,
                rewriteRequestNote: fixActionRecord.rewriteRequestNote,
                rewriteTargetSceneId: fixActionRecord.rewriteTargetSceneId,
                rewriteRequestId: fixActionRecord.rewriteRequestId,
                startedAtLabel: fixActionRecord.startedAtLabel,
                updatedAtLabel: fixActionRecord.updatedAtLabel,
                updatedByLabel: fixActionRecord.updatedByLabel,
                isStale: false,
              }
            : {
                status: 'stale',
                sourceHandoffId: fixActionRecord.sourceHandoffId,
                sourceHandoffLabel: fixActionRecord.sourceHandoffLabel,
                targetScope: fixActionRecord.targetScope,
                note: fixActionRecord.note,
                rewriteRequestNote: fixActionRecord.rewriteRequestNote,
                rewriteTargetSceneId: fixActionRecord.rewriteTargetSceneId,
                rewriteRequestId: fixActionRecord.rewriteRequestId,
                startedAtLabel: fixActionRecord.startedAtLabel,
                updatedAtLabel: fixActionRecord.updatedAtLabel,
                updatedByLabel: fixActionRecord.updatedByLabel,
                isStale: true,
              }
          : {
              status: 'not_started',
              isStale: false,
            },
      }
    }),
  }
}

function mapRunStatusToSceneRunStatus(status: RunRecord['status']): SceneWorkspaceViewModel['runStatus'] {
  switch (status) {
    case 'queued':
    case 'running':
      return 'running'
    case 'waiting_review':
      return 'paused'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'cancelled':
      return 'idle'
  }
}

function mapRunStatusToSceneStatus(status: RunRecord['status']): SceneWorkspaceViewModel['status'] {
  switch (status) {
    case 'queued':
    case 'running':
      return 'running'
    case 'waiting_review':
      return 'review'
    case 'completed':
      return 'ready'
    case 'failed':
    case 'cancelled':
      return 'draft'
  }
}

function mapRunStatusToRunHealth(status: RunRecord['status']): SceneExecutionViewModel['runtimeSummary']['runHealth'] {
  switch (status) {
    case 'failed':
      return 'blocked'
    case 'queued':
    case 'waiting_review':
      return 'attention'
    case 'running':
    case 'completed':
    case 'cancelled':
      return 'stable'
  }
}

function buildSceneRunStatusLabel(run: RunRecord) {
  switch (run.status) {
    case 'queued':
      return 'Run queued'
    case 'running':
      return 'Run in progress'
    case 'waiting_review':
      return 'Run waiting for review'
    case 'completed':
      return 'Run completed'
    case 'failed':
      return 'Run failed'
    case 'cancelled':
      return 'Run cancelled'
  }
}

function isAcceptedRunDecision(decision: SubmitRunReviewDecisionInput['decision']) {
  return decision === 'accept' || decision === 'accept-with-edit'
}

function deriveDraftWordCount(proseDraft?: string, draftWordCount?: number) {
  if (draftWordCount !== undefined) {
    return draftWordCount
  }

  const trimmed = proseDraft?.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.split(/\s+/).length
}

function hasConcreteProseDraft(proseDraft?: string) {
  return Boolean(proseDraft?.trim())
}

function buildRevisionModeLabel(revisionMode: SceneProseViewModel['revisionModes'][number]) {
  switch (revisionMode) {
    case 'rewrite':
      return 'rewrite'
    case 'compress':
      return 'compression'
    case 'expand':
      return 'expansion'
    case 'tone_adjust':
      return 'tone adjustment'
    case 'continuity_fix':
      return 'continuity fix'
  }
}

function trimProseRevisionInstruction(instruction?: string) {
  const value = instruction?.trim()
  return value ? value : undefined
}

function isRevisionSourceRunStateCandidate(
  value: unknown,
): value is {
  run: RunRecord
  artifacts: Array<{ kind: string; id: string }>
  sequence: number
} {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const candidate = value as {
    run?: Partial<RunRecord>
    artifacts?: unknown
    sequence?: unknown
  }

  return typeof candidate.sequence === 'number'
    && typeof candidate.run?.id === 'string'
    && typeof candidate.run.scope === 'string'
    && typeof candidate.run.scopeId === 'string'
    && Array.isArray(candidate.artifacts)
    && candidate.artifacts.every((artifact) => (
      typeof artifact === 'object'
      && artifact !== null
      && !Array.isArray(artifact)
      && typeof (artifact as { kind?: unknown }).kind === 'string'
      && typeof (artifact as { id?: unknown }).id === 'string'
    ))
}

export interface FixtureRepository {
  whenReady(): Promise<void>
  getProjectRuntimeInfo(projectId: string): ProjectRuntimeInfoRecord
  getBookStructure(projectId: string, bookId: string): BookStructureRecord | null
  getBookDraftAssembly(projectId: string, bookId: string): BookDraftAssemblyRecord | null
  getChapterDraftAssembly(projectId: string, chapterId: string): ChapterDraftAssemblyRecord | null
  getBookManuscriptCheckpoints(projectId: string, bookId: string): BookManuscriptCheckpointRecord[]
  getBookManuscriptCheckpoint(projectId: string, bookId: string, checkpointId: string): BookManuscriptCheckpointRecord | null
  createBookManuscriptCheckpoint(projectId: string, input: CreateBookManuscriptCheckpointInput): Promise<BookManuscriptCheckpointRecord>
  getBookExportProfiles(projectId: string, bookId: string): BookExportProfileRecord[]
  getBookExportProfile(projectId: string, bookId: string, exportProfileId: string): BookExportProfileRecord | null
  getBookExportArtifacts(projectId: string, input: { bookId: string; exportProfileId?: string; checkpointId?: string }): BookExportArtifactRecord[]
  createBookExportArtifact(projectId: string, input: BuildBookExportArtifactInput): Promise<BookExportArtifactRecord>
  getBookExperimentBranches(projectId: string, bookId: string): BookExperimentBranchRecord[]
  getBookExperimentBranch(projectId: string, bookId: string, branchId: string): BookExperimentBranchRecord | null
  createBookExperimentBranch(projectId: string, input: CreateBookExperimentBranchInput): Promise<BookExperimentBranchRecord>
  adoptBookExperimentBranch(projectId: string, input: CreateBookExperimentBranchAdoptionInput): Promise<BookExperimentBranchAdoptionRecord>
  archiveBookExperimentBranch(projectId: string, input: ArchiveBookExperimentBranchInput): Promise<BookExperimentBranchRecord>
  getChapterStructure(projectId: string, chapterId: string): ChapterStructureWorkspaceRecord | null
  updateChapterBacklogPlanningInput(projectId: string, chapterId: string, input: PatchChapterBacklogPlanningInput): Promise<ChapterStructureWorkspaceRecord | null>
  generateChapterBacklogProposal(projectId: string, chapterId: string): Promise<ChapterStructureWorkspaceRecord | null>
  updateChapterBacklogProposalScene(
    projectId: string,
    input: {
      chapterId: string
      proposalId: string
      proposalSceneId: string
      patch: UpdateChapterBacklogProposalSceneInput
    },
  ): Promise<ChapterStructureWorkspaceRecord | null>
  acceptChapterBacklogProposal(
    projectId: string,
    input: { chapterId: string; proposalId: string },
  ): Promise<ChapterStructureWorkspaceRecord | null>
  startNextChapterSceneRun(
    projectId: string,
    chapterId: string,
    input: StartNextChapterSceneRunInput,
  ): Promise<StartNextChapterSceneRunRecord | null>
  reorderChapterScene(projectId: string, input: { chapterId: string; sceneId: string; targetIndex: number }): Promise<ChapterStructureWorkspaceRecord | null>
  updateChapterSceneStructure(projectId: string, input: { chapterId: string; sceneId: string; locale: 'en' | 'zh-CN'; patch: ChapterSceneStructurePatch }): Promise<ChapterStructureWorkspaceRecord | null>
  createChapter(projectId: string, input: { title?: string; summary?: string }): Promise<ChapterStructureWorkspaceRecord>
  renameChapter(projectId: string, chapterId: string, input: { title?: string; summary?: string }): Promise<ChapterStructureWorkspaceRecord | null>
  createScene(projectId: string, chapterId: string, input: { title?: string; summary?: string }): Promise<ChapterStructureWorkspaceRecord | null>
  renameScene(projectId: string, sceneId: string, input: { title?: string }): Promise<SceneWorkspaceViewModel>
  listAssets(projectId: string): AssetNavigatorResponseRecord
  getAssetKnowledge(
    projectId: string,
    assetId: string,
    options?: { visibility?: AssetContextVisibilityRecord },
  ): AssetKnowledgeWorkspaceRecord | null
  getReviewDecisions(projectId: string, bookId: string): ReviewIssueDecisionRecord[]
  getReviewIssueSnapshots(projectId: string, bookId: string): BookReviewIssueSnapshotsRecord
  setReviewDecision(projectId: string, input: SetReviewIssueDecisionInput): Promise<ReviewIssueDecisionRecord>
  clearReviewDecision(projectId: string, input: { bookId: string; issueId: string }): Promise<void>
  getReviewFixActions(projectId: string, bookId: string): ReviewIssueFixActionRecord[]
  setReviewFixAction(projectId: string, input: SetReviewIssueFixActionInput): Promise<ReviewIssueFixActionRecord>
  clearReviewFixAction(projectId: string, input: { bookId: string; issueId: string }): Promise<void>
  getSceneWorkspace(projectId: string, sceneId: string): SceneWorkspaceViewModel
  getSceneSetup(projectId: string, sceneId: string): SceneSetupViewModel
  updateSceneSetup(projectId: string, sceneId: string, setup: SceneSetupViewModel): Promise<void>
  getSceneExecution(projectId: string, sceneId: string): SceneExecutionViewModel
  getSceneProse(projectId: string, sceneId: string): SceneProseViewModel
  getSceneInspector(projectId: string, sceneId: string): SceneInspectorViewModel
  getSceneDockSummary(projectId: string, sceneId: string): SceneDockViewModel
  getSceneDockTab(projectId: string, sceneId: string, tab: SceneDockTabId): Partial<SceneDockViewModel>
  getScenePatchPreview(projectId: string, sceneId: string): ScenePatchPreviewViewModel | null
  commitScenePatch(projectId: string, sceneId: string, patchId: string): void
  reviseSceneProse(
    projectId: string,
    sceneId: string,
    input: {
      revisionMode: SceneProseViewModel['revisionModes'][number]
      instruction?: string
    },
  ): Promise<void>
  acceptSceneProseRevision(projectId: string, sceneId: string, revisionId: string): Promise<void>
  continueSceneRun(projectId: string, sceneId: string): void
  switchSceneThread(projectId: string, sceneId: string, threadId: string): Promise<void>
  applySceneProposalAction(projectId: string, sceneId: string, action: 'accept' | 'edit-accept' | 'request-rewrite' | 'reject', input: ProposalActionInput): void
  startSceneRun(projectId: string, input: StartSceneRunInput): Promise<RunRecord>
  retryRun(projectId: string, input: RetryRunInput): Promise<RunRecord>
  cancelRun(projectId: string, input: CancelRunInput): Promise<RunRecord>
  resumeRun(projectId: string, input: ResumeRunInput): Promise<RunRecord>
  getRun(projectId: string, runId: string): RunRecord | null
  listRunArtifacts(projectId: string, runId: string): RunArtifactSummaryRecord[] | null
  getRunArtifact(projectId: string, runId: string, artifactId: string): RunArtifactDetailRecord | null
  getRunTrace(projectId: string, runId: string): RunTraceResponse | null
  getRunEvents(projectId: string, input: { runId: string; cursor?: string }): RunEventsPageRecord
  streamRunEvents(projectId: string, input: { runId: string; cursor?: string; signal?: AbortSignal }): AsyncIterable<RunEventsPageRecord>
  supportsRunEventStream(): boolean
  submitRunReviewDecision(projectId: string, input: SubmitRunReviewDecisionInput): Promise<RunRecord>
  exportSnapshot(): FixtureDataSnapshot
  exportManuscriptMarkdown(projectId: string, bookId: string, locale?: string): string
  resetProject(projectId: string): Promise<void>
  reset(): void
}

export interface FixtureRepositoryProjectStatePersistence {
  load(): Promise<{
    schemaVersion: number
    seedVersion: string
    projects: Record<string, {
      updatedAt: string
      manuscriptCheckpoints?: Record<string, unknown>
      reviewDecisions?: Record<string, unknown>
      reviewFixActions?: Record<string, unknown>
      exportArtifacts?: Record<string, unknown>
      experimentBranches?: Record<string, unknown>
      chapters?: Record<string, unknown>
      scenes?: Record<string, unknown>
      runStore?: PersistedRunStore
    }>
  }>
  saveProjectOverlay(projectId: string, overlay: {
    updatedAt: string
    manuscriptCheckpoints?: Record<string, unknown>
    reviewDecisions?: Record<string, unknown>
    reviewFixActions?: Record<string, unknown>
    exportArtifacts?: Record<string, unknown>
    experimentBranches?: Record<string, unknown>
    chapters?: Record<string, unknown>
    scenes?: Record<string, unknown>
    runStore?: PersistedRunStore
  }): Promise<void>
  clearProjectOverlay(projectId: string): Promise<void>
}

export interface FixtureRepositoryLocalProjectStore {
  load(): Promise<LocalProjectStoreRecord>
  save(input: {
    data: FixtureProjectData
    runStore?: PersistedRunStore
  }): Promise<LocalProjectStoreRecord>
  reset(): Promise<LocalProjectStoreRecord>
}

export function createFixtureRepository(options: {
  apiBaseUrl: string
  currentProject?: {
    projectId: string
    projectRoot?: string
    projectTitle: string
  }
  scenePlannerGateway: {
    generate(request: ScenePlannerGatewayRequest): Promise<ScenePlannerGatewayResult>
  }
  sceneProseWriterGateway?: {
    generate(request: SceneProseWriterGatewayRequest): Promise<SceneProseWriterGatewayResult>
  }
  localProjectStore?: FixtureRepositoryLocalProjectStore
  projectStatePersistence?: FixtureRepositoryProjectStatePersistence
  runEventStreamEnabled?: boolean
}): FixtureRepository {
  const sceneProseWriterGateway = options.sceneProseWriterGateway ?? createSceneProseWriterGateway({
    modelProvider: 'fixture',
  })
  const createSeedSnapshot = () => createFixtureDataSnapshot(options.apiBaseUrl)
  const createSeedRunStore = () => {
    const seedSnapshot = createSeedSnapshot()

    return createRunFixtureStore({
      scenePlannerGateway: options.scenePlannerGateway,
      sceneProseWriterGateway,
      runEventStreamEnabled: options.runEventStreamEnabled,
      buildSceneContextPacket: ({ projectId, sceneId, sequence }) => {
        const project = seedSnapshot.projects[projectId]
        if (!project) {
          throw notFound(`Project ${projectId} was not found.`, {
            code: 'PROJECT_NOT_FOUND',
            detail: { projectId },
          })
        }

        return buildSceneContextPacket({
          project,
          sceneId,
          sequence,
        })
      },
    })
  }

  let snapshot = createSeedSnapshot()
  const runStore: RunFixtureStore = createRunFixtureStore({
    scenePlannerGateway: options.scenePlannerGateway,
    sceneProseWriterGateway,
    runEventStreamEnabled: options.runEventStreamEnabled,
    buildSceneContextPacket: ({ projectId, sceneId, sequence }) => buildSceneContextPacket({
      project: getProject(projectId),
      sceneId,
      sequence,
    }),
  })
  let persistenceQueue = Promise.resolve()
  const selectedLocalProjectId = options.currentProject?.projectId

  function getProject(projectId: string): FixtureProjectData {
    const project = snapshot.projects[projectId]
    if (!project) {
      throw notFound(`Project ${projectId} was not found.`, {
        code: 'PROJECT_NOT_FOUND',
        detail: { projectId },
      })
    }

    return project
  }

  function enqueuePersistence(task: () => Promise<void>) {
    if (!options.localProjectStore && !options.projectStatePersistence) {
      return Promise.resolve()
    }

    const taskPromise = persistenceQueue
      .catch(() => undefined)
      .then(task)
    persistenceQueue = taskPromise.catch(() => undefined)
    return taskPromise
  }

  function applySelectedLocalProjectStore(record: LocalProjectStoreRecord) {
    snapshot.projects[record.project.projectId] = clone(record.project.data)
    if (record.runStore) {
      runStore.hydrateProjectState(record.project.projectId, record.runStore)
    }
  }

  function applyProjectOverlay(
    projectId: string,
    overlay: Awaited<ReturnType<FixtureRepositoryProjectStatePersistence['load']>>['projects'][string],
  ) {
    const project = getProject(projectId)

    if (overlay.manuscriptCheckpoints) {
      project.manuscriptCheckpoints = clone(overlay.manuscriptCheckpoints as unknown as FixtureProjectData['manuscriptCheckpoints'])
    }
    if (overlay.reviewDecisions) {
      project.reviewDecisions = clone(overlay.reviewDecisions as unknown as FixtureProjectData['reviewDecisions'])
    }
    if (overlay.reviewFixActions) {
      project.reviewFixActions = clone(overlay.reviewFixActions as unknown as FixtureProjectData['reviewFixActions'])
    }
    if (overlay.exportArtifacts) {
      project.exportArtifacts = clone(overlay.exportArtifacts as unknown as FixtureProjectData['exportArtifacts'])
    }
    if (overlay.experimentBranches) {
      project.experimentBranches = clone(overlay.experimentBranches as unknown as FixtureProjectData['experimentBranches'])
    }
    if (overlay.chapters) {
      project.chapters = clone(overlay.chapters as unknown as FixtureProjectData['chapters'])
    }
    if (overlay.scenes) {
      project.scenes = clone(overlay.scenes as unknown as FixtureProjectData['scenes'])
    }
    if (overlay.runStore) {
      runStore.hydrateProjectState(projectId, overlay.runStore)
    }
  }

  function buildProjectOverlay(
    projectId: string,
  ): Awaited<ReturnType<FixtureRepositoryProjectStatePersistence['load']>>['projects'][string] | undefined {
    const project = getProject(projectId)
    const seedProject = createSeedSnapshot().projects[projectId]
    const overlay: Awaited<ReturnType<FixtureRepositoryProjectStatePersistence['load']>>['projects'][string] = {
      updatedAt: new Date().toISOString(),
    }

    if (!seedProject || !jsonEquals(project.manuscriptCheckpoints, seedProject.manuscriptCheckpoints)) {
      overlay.manuscriptCheckpoints = toJsonClone(
        project.manuscriptCheckpoints as unknown as NonNullable<typeof overlay.manuscriptCheckpoints>,
      )
    }
    if (!seedProject || !jsonEquals(project.reviewDecisions, seedProject.reviewDecisions)) {
      overlay.reviewDecisions = toJsonClone(project.reviewDecisions as unknown as NonNullable<typeof overlay.reviewDecisions>)
    }
    if (!seedProject || !jsonEquals(project.reviewFixActions, seedProject.reviewFixActions)) {
      overlay.reviewFixActions = toJsonClone(project.reviewFixActions as unknown as NonNullable<typeof overlay.reviewFixActions>)
    }
    if (!seedProject || !jsonEquals(project.exportArtifacts, seedProject.exportArtifacts)) {
      overlay.exportArtifacts = toJsonClone(project.exportArtifacts as unknown as NonNullable<typeof overlay.exportArtifacts>)
    }
    if (!seedProject || !jsonEquals(project.experimentBranches, seedProject.experimentBranches)) {
      overlay.experimentBranches = toJsonClone(
        project.experimentBranches as unknown as NonNullable<typeof overlay.experimentBranches>,
      )
    }
    if (!seedProject || !jsonEquals(project.chapters, seedProject.chapters)) {
      overlay.chapters = toJsonClone(project.chapters as unknown as NonNullable<typeof overlay.chapters>)
    }
    if (!seedProject || !jsonEquals(project.scenes, seedProject.scenes)) {
      overlay.scenes = toJsonClone(project.scenes as unknown as NonNullable<typeof overlay.scenes>)
    }

    const currentRunStore = runStore.exportProjectState(projectId)
    const seedRunStore = createSeedRunStore().exportProjectState(projectId)
    if (!jsonEquals(currentRunStore ?? null, seedRunStore ?? null) && currentRunStore) {
      overlay.runStore = toJsonClone(currentRunStore)
    }

    return Object.keys(overlay).length > 1 ? overlay : undefined
  }

  function persistProjectOverlay(projectId: string) {
    return enqueuePersistence(async () => {
      if (options.localProjectStore && selectedLocalProjectId === projectId) {
        const exportedRunStore = runStore.exportProjectState(projectId)
        await options.localProjectStore.save({
          data: toJsonClone(getProject(projectId)),
          runStore: exportedRunStore ? toJsonClone(exportedRunStore) : undefined,
        })
        return
      }

      if (!options.projectStatePersistence) {
        return
      }

      const overlay = buildProjectOverlay(projectId)
      if (overlay) {
        await options.projectStatePersistence.saveProjectOverlay(projectId, overlay)
        return
      }

      await options.projectStatePersistence.clearProjectOverlay(projectId)
    })
  }

  function resetProjectToSeed(projectId: string) {
    const nextSeedSnapshot = createSeedSnapshot()
    const nextProject = nextSeedSnapshot.projects[projectId]
    if (!nextProject) {
      throw notFound(`Project ${projectId} was not found.`, {
        code: 'PROJECT_NOT_FOUND',
        detail: { projectId },
      })
    }

    snapshot.projects[projectId] = clone(nextProject)
    runStore.clearProject(projectId)

    const seedRunSnapshot = createSeedRunStore().exportProjectState(projectId)
    if (seedRunSnapshot) {
      runStore.hydrateProjectState(projectId, seedRunSnapshot)
    }
  }

  const readyPromise = options.localProjectStore && selectedLocalProjectId
    ? options.localProjectStore.load().then((record) => {
      applySelectedLocalProjectStore(record)
    })
    : options.projectStatePersistence
      ? options.projectStatePersistence.load().then((envelope) => {
        for (const [projectId, overlay] of Object.entries(envelope.projects)) {
          applyProjectOverlay(projectId, overlay)
        }
      })
      : Promise.resolve()
  persistenceQueue = readyPromise

  function getBook(projectId: string, bookId: string) {
    return getProject(projectId).books[bookId] ?? null
  }

  function getChapter(projectId: string, chapterId: string) {
    return getProject(projectId).chapters[chapterId] ?? null
  }

  function getAsset(projectId: string, assetId: string) {
    return getProject(projectId).assets[assetId] ?? null
  }

  function getScene(projectId: string, sceneId: string) {
    const scene = getProject(projectId).scenes[sceneId]
    if (!scene) {
      throw notFound(`Scene ${sceneId} was not found.`, {
        code: 'SCENE_NOT_FOUND',
        detail: { projectId, sceneId },
      })
    }

    return scene
  }

  function buildEmptySceneRecord(input: {
    sceneId: string
    chapterId: string
    title: string
    chapterTitle: string
    summary: string
  }): SceneFixtureRecord {
    return {
      workspace: {
        id: input.sceneId,
        title: input.title,
        chapterId: input.chapterId,
        chapterTitle: input.chapterTitle,
        status: 'draft',
        runStatus: 'idle',
        objective: input.summary,
        castIds: [],
        locationId: undefined,
        latestRunId: undefined,
        pendingProposalCount: 0,
        warningCount: 0,
        currentVersionLabel: undefined,
        activeThreadId: undefined,
        availableThreads: [],
      },
      setup: {
        sceneId: input.sceneId,
        identity: {
          title: input.title,
          chapterLabel: input.chapterTitle,
          locationLabel: '',
          povCharacterId: '',
          timeboxLabel: '',
          summary: input.summary,
        },
        objective: {
          externalGoal: '',
          emotionalGoal: '',
          successSignal: '',
          failureCost: '',
        },
        cast: [],
        constraints: [],
        knowledgeBoundaries: [],
        runtimePreset: {
          selectedPresetId: '',
          presetOptions: [],
        },
      },
      execution: {
        runId: undefined,
        objective: {
          goal: input.summary,
          tensionLabel: undefined,
          pacingLabel: undefined,
          cast: [],
          location: undefined,
          warningsCount: 0,
          unresolvedCount: 0,
          constraintSummary: [],
        },
        beats: [],
        proposals: [],
        acceptedSummary: {
          sceneSummary: input.summary,
          acceptedFacts: [],
          readiness: 'not-ready',
          pendingProposalCount: 0,
          warningCount: 0,
        },
        runtimeSummary: {
          runHealth: 'stable',
          latencyLabel: '--',
          tokenLabel: '--',
          costLabel: '--',
        },
        consistencySummary: undefined,
        canContinueRun: false,
        canOpenProse: false,
      },
      prose: {
        sceneId: input.sceneId,
        proseDraft: undefined,
        revisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
        latestDiffSummary: undefined,
        warningsCount: 0,
        focusModeAvailable: false,
        revisionQueueCount: 0,
        draftWordCount: 0,
        statusLabel: 'No draft yet',
        revisionCandidate: undefined,
        traceSummary: undefined,
      },
      inspector: {
        context: {
          acceptedFacts: [],
          privateInfoGuard: {
            summary: 'No guard information yet.',
            items: [],
          },
          actorKnowledgeBoundaries: [],
          localState: [],
          overrides: [],
        },
        versions: {
          checkpoints: [],
          acceptanceTimeline: [],
          patchCandidates: [],
        },
        runtime: {
          profile: {
            label: 'No profile yet.',
            summary: 'Scene has not been run.',
          },
          runHealth: 'stable',
          metrics: {
            latencyLabel: '--',
            tokenLabel: '--',
            costLabel: '--',
          },
          latestFailure: undefined,
        },
      },
      dock: {
        events: [],
        trace: [],
        consistency: {
          summary: 'No consistency checks yet.',
          checks: [],
        },
        problems: {
          summary: 'No problems detected.',
          items: [],
        },
        cost: {
          currentWindowLabel: '--',
          trendLabel: '--',
          breakdown: [],
        },
      },
      patchPreview: null,
    }
  }

  function runHasGeneratedProseArtifact(projectId: string, run: RunRecord) {
    if (run.scope !== 'scene' || run.status !== 'completed') {
      return false
    }

    return Boolean(findLatestArtifactDetail(projectId, run.id, 'prose-draft'))
  }

  function syncSceneSurfacesFromRun(projectId: string, run: RunRecord) {
    if (run.scope !== 'scene') {
      return
    }

    const scene = getScene(projectId, run.scopeId)
    const runStatus = mapRunStatusToSceneRunStatus(run.status)
    const hasGeneratedProseArtifact = runHasGeneratedProseArtifact(projectId, run)
    const sceneStatus = run.status === 'completed' && !hasGeneratedProseArtifact
      ? 'draft'
      : mapRunStatusToSceneStatus(run.status)
    const runHealth = mapRunStatusToRunHealth(run.status)

    scene.workspace.latestRunId = run.id
    scene.workspace.runStatus = runStatus
    scene.workspace.status = sceneStatus
    scene.workspace.currentVersionLabel = `Latest run ${run.id}`

    scene.execution.runId = run.id
    scene.execution.runtimeSummary.runHealth = runHealth
    scene.execution.runtimeSummary.latestFailureSummary = run.status === 'failed' ? run.summary : undefined
    scene.execution.canContinueRun = run.status === 'running' || run.status === 'queued'
    scene.execution.canOpenProse = run.status === 'completed' && hasGeneratedProseArtifact

    scene.inspector.runtime.runHealth = runHealth
    scene.inspector.runtime.latestFailure = run.status === 'failed' ? run.summary : undefined

    scene.dock.events = [
      {
        id: `run-status-${run.id}`,
        title: run.title,
        detail: run.summary,
        meta: run.id,
        tone: run.status === 'failed' ? 'danger' : run.status === 'waiting_review' ? 'accent' : 'success',
      },
      ...scene.dock.events.filter((entry) => entry.id !== `run-status-${run.id}`),
    ]
  }

  function syncChapterSceneMetadataFromRun(projectId: string, run: RunRecord) {
    if (run.scope !== 'scene') {
      return
    }

    const project = getProject(projectId)
    for (const [chapterId, chapter] of Object.entries(project.chapters)) {
      const sceneIndex = chapter.scenes.findIndex((scene) => scene.id === run.scopeId)
      if (sceneIndex < 0) {
        continue
      }

      const nextChapter = clone(chapter)
      nextChapter.scenes[sceneIndex] = {
        ...nextChapter.scenes[sceneIndex]!,
        backlogStatus: run.status === 'waiting_review'
          ? 'needs_review'
          : run.status === 'queued' || run.status === 'running'
            ? 'running'
            : nextChapter.scenes[sceneIndex]!.backlogStatus,
        runStatusLabel: mergeLocalizedText(nextChapter.scenes[sceneIndex]!.runStatusLabel, 'en', buildSceneRunStatusLabel(run)),
        lastRunLabel: mergeLocalizedText(nextChapter.scenes[sceneIndex]!.lastRunLabel, 'en', `Run ${run.id}`),
      }
      project.chapters[chapterId] = nextChapter
      return
    }
  }

  function findLatestArtifactDetail<TKind extends RunArtifactDetailRecord['kind']>(
    projectId: string,
    runId: string,
    kind: TKind,
  ): Extract<RunArtifactDetailRecord, { kind: TKind }> | undefined {
    const artifacts = runStore.listRunArtifacts(projectId, runId)
    if (!artifacts) {
      return undefined
    }

    for (let index = artifacts.length - 1; index >= 0; index -= 1) {
      const artifact = artifacts[index]
      if (artifact?.kind !== kind) {
        continue
      }

      const detail = runStore.getRunArtifact(projectId, runId, artifact.id)
      if (detail?.kind === kind) {
        return detail as Extract<RunArtifactDetailRecord, { kind: TKind }>
      }
    }

    return undefined
  }

  function findSceneRevisionSource(projectId: string, sceneId: string) {
    const scene = getScene(projectId, sceneId)
    const sourceCanonPatchId = scene.prose.traceSummary?.sourcePatchId?.trim()
    if (!sourceCanonPatchId) {
      return undefined
    }

    const currentSourceProseDraftId = scene.prose.traceSummary?.sourceProseDraftId?.trim()
    const currentContextPacketId = scene.prose.traceSummary?.contextPacketId?.trim()
    if (currentSourceProseDraftId && currentContextPacketId) {
      return {
        proseDraftId: currentSourceProseDraftId,
        sourceCanonPatchId,
        contextPacketId: currentContextPacketId,
      }
    }

    const projectRunState = runStore.exportProjectState(projectId)
    const matchedRunState = ((projectRunState?.runStates ?? []) as unknown[])
      .filter(isRevisionSourceRunStateCandidate)
      .find((candidate) => (
        candidate.run.scope === 'scene'
        && candidate.run.scopeId === sceneId
        && candidate.artifacts.some((artifact) => artifact.kind === 'canon-patch' && artifact.id === sourceCanonPatchId)
      ))

    if (!matchedRunState) {
      return undefined
    }

    const proseDraftArtifact = matchedRunState.artifacts.find((artifact) => artifact.kind === 'prose-draft')
    const contextPacketArtifact = matchedRunState.artifacts.find((artifact) => artifact.kind === 'context-packet')
    if (!proseDraftArtifact || !contextPacketArtifact) {
      return undefined
    }

    return {
      proseDraftId: proseDraftArtifact.id,
      sourceCanonPatchId,
      contextPacketId: contextPacketArtifact.id,
    }
  }

  function syncSceneRevisionTrace(sceneId: string, trace: SceneDockViewModel['trace'], detail: string, tone: 'accent' | 'success') {
    return [
      {
        id: `prose-revision-trace-${sceneId}`,
        title: 'Revision candidate trace',
        detail,
        meta: sceneId,
        tone,
      },
      ...trace.filter((entry) => entry.id !== `prose-revision-trace-${sceneId}`),
    ]
  }

  function syncChapterSceneProseStatus(projectId: string, sceneId: string, statusLabel: { en: string; 'zh-CN': string }) {
    const project = getProject(projectId)
    for (const [chapterId, chapter] of Object.entries(project.chapters)) {
      const sceneIndex = chapter.scenes.findIndex((scene) => scene.id === sceneId)
      if (sceneIndex < 0) {
        continue
      }

      const nextChapter = clone(chapter)
      nextChapter.scenes[sceneIndex] = {
        ...nextChapter.scenes[sceneIndex]!,
        proseStatusLabel: statusLabel,
      }
      project.chapters[chapterId] = nextChapter
      return
    }
  }

  function persistChapterSceneBacklogStatus(
    projectId: string,
    chapterId: string,
    sceneId: string,
    backlogStatus: ChapterSceneBacklogStatus,
  ) {
    const chapter = getChapter(projectId, chapterId)
    if (!chapter) {
      return null
    }

    const nextChapter = updateChapterRunSceneBacklogStatus(chapter, {
      sceneId,
      backlogStatus,
    })
    getProject(projectId).chapters[chapterId] = nextChapter
    return nextChapter
  }

  function syncSceneProseFromAcceptedRun(projectId: string, run: RunRecord, decision: SubmitRunReviewDecisionInput['decision']) {
    if (run.scope !== 'scene' || run.status !== 'completed' || !isAcceptedRunDecision(decision)) {
      return
    }

    const proseDraft = findLatestArtifactDetail(projectId, run.id, 'prose-draft') as ProseDraftArtifactDetailRecord | undefined
    if (!proseDraft) {
      return
    }

    const canonPatch = findLatestArtifactDetail(projectId, run.id, 'canon-patch') as CanonPatchArtifactDetailRecord | undefined
    const proposalSet = findLatestArtifactDetail(projectId, run.id, 'proposal-set') as ProposalSetArtifactDetailRecord | undefined
    const scene = getScene(projectId, run.scopeId)
    const hadProseDraft = Boolean(scene.prose.proseDraft)
    const proseMaterialization = buildSceneProseFromProseDraftArtifact({
      proseDraft,
      canonPatch,
      proposalSet,
    })
    const acceptedFacts = buildAcceptedFactsFromCanonPatch(canonPatch)

    scene.prose = {
      ...scene.prose,
      ...proseMaterialization,
      revisionQueueCount: 0,
      revisionCandidate: undefined,
    }
    scene.execution.acceptedSummary = {
      ...scene.execution.acceptedSummary,
      acceptedFacts,
    }
    scene.inspector.context.acceptedFacts = acceptedFacts
    syncChapterSceneProseStatus(
      projectId,
      run.scopeId,
      hadProseDraft ? { en: 'Updated', 'zh-CN': '已更新' } : { en: 'Generated', 'zh-CN': '已生成' },
    )
    for (const [chapterId, chapter] of Object.entries(getProject(projectId).chapters)) {
      if (chapter.scenes.some((chapterScene) => chapterScene.id === run.scopeId)) {
        persistChapterSceneBacklogStatus(projectId, chapterId, run.scopeId, 'drafted')
        break
      }
    }
  }

  function syncSceneBacklogStatusFromReviewDecision(
    projectId: string,
    run: RunRecord,
    decision: SubmitRunReviewDecisionInput['decision'],
  ) {
    if (run.scope !== 'scene' || (isAcceptedRunDecision(decision) && run.status !== 'completed')) {
      return
    }

    const nextBacklogStatus: ChapterSceneBacklogStatus | null = isAcceptedRunDecision(decision)
      ? 'drafted'
      : decision === 'request-rewrite' || decision === 'reject'
        ? 'planned'
        : null

    if (!nextBacklogStatus) {
      return
    }

    for (const [chapterId, chapter] of Object.entries(getProject(projectId).chapters)) {
      if (chapter.scenes.some((chapterScene) => chapterScene.id === run.scopeId)) {
        persistChapterSceneBacklogStatus(projectId, chapterId, run.scopeId, nextBacklogStatus)
        break
      }
    }
  }

  function syncRunMutations(projectId: string, run: RunRecord) {
    syncSceneSurfacesFromRun(projectId, run)
    syncChapterSceneMetadataFromRun(projectId, run)
  }

  function buildDraftAssemblyTraceRollup(sceneId: string, project: FixtureProjectData): BookDraftAssemblyTraceRollupRecord {
    const prose = project.scenes[sceneId]?.prose
    const traceSummary = prose?.traceSummary

    if (!traceSummary) {
      return {
        acceptedFactCount: 0,
        relatedAssetCount: 0,
        sourceProposalCount: 0,
        missingLinks: ['trace'],
      }
    }

    return {
      acceptedFactCount: traceSummary.acceptedFactIds?.length ?? 0,
      relatedAssetCount: traceSummary.relatedAssets?.length ?? 0,
      sourceProposalCount: traceSummary.sourceProposals?.length ?? 0,
      missingLinks: [...(traceSummary.missingLinks ?? [])],
    }
  }

  function buildDraftAssemblyGapReason(input: {
    hasSceneRecord: boolean
    hasConcreteDraft: boolean
  }) {
    if (!input.hasSceneRecord) {
      return localizedText('Scene prose read model is unavailable.', '场景正文读取模型当前不可用。')
    }

    if (!input.hasConcreteDraft) {
      return localizedText('No prose draft has been materialized for this scene yet.', '该场景尚未生成正文草稿。')
    }

    return localizedText('Scene prose is unavailable.', '场景正文当前不可用。')
  }

  function buildBookDraftAssemblySceneRecord(input: {
    scene: ChapterStructureWorkspaceRecord['scenes'][number]
    project: FixtureProjectData
  }): BookDraftAssemblySceneRecord {
    const sceneFixture = input.project.scenes[input.scene.id]
    const prose = sceneFixture?.prose
    const proseDraft = prose?.proseDraft
    const traceRollup = buildDraftAssemblyTraceRollup(input.scene.id, input.project)
    const draftWordCount = deriveDraftWordCount(proseDraft, prose?.draftWordCount)
    const hasConcreteDraft = hasConcreteProseDraft(proseDraft)
    const proseStatusLabel = hasConcreteDraft && prose?.statusLabel
      ? localizeCurrentSceneProseStatusLabel(prose.statusLabel)
      : input.scene.proseStatusLabel
    const common = {
      sceneId: input.scene.id,
      order: input.scene.order,
      title: clone(input.scene.title),
      summary: clone(input.scene.summary),
      proseStatusLabel: clone(proseStatusLabel),
      latestDiffSummary: prose?.latestDiffSummary,
      warningsCount: prose?.warningsCount ?? 0,
      revisionQueueCount: prose?.revisionQueueCount,
      draftWordCount,
      traceReady: !traceRollup.missingLinks.includes('trace'),
      traceRollup,
    }

    if (!sceneFixture || !hasConcreteDraft) {
      const gapRecord: BookDraftAssemblySceneGapRecord = {
        ...common,
        kind: 'gap',
        gapReason: buildDraftAssemblyGapReason({
          hasSceneRecord: Boolean(sceneFixture),
          hasConcreteDraft,
        }),
      }
      return gapRecord
    }

    return {
      ...common,
      kind: 'draft',
      proseDraft: proseDraft!.trim(),
      sourcePatchId: prose?.traceSummary?.sourcePatchId,
      sourceProposals: clone(prose?.traceSummary?.sourceProposals ?? []),
      acceptedFactIds: clone(prose?.traceSummary?.acceptedFactIds ?? []),
      relatedAssets: clone(prose?.traceSummary?.relatedAssets ?? []),
    }
  }

  function buildChapterDraftAssemblyTraceRollup(sceneId: string, project: FixtureProjectData): ChapterDraftAssemblyTraceRollupRecord {
    return buildDraftAssemblyTraceRollup(sceneId, project)
  }

  function buildChapterDraftAssemblyGapReason(input: {
    hasSceneRecord: boolean
    hasConcreteDraft: boolean
  }) {
    return buildDraftAssemblyGapReason(input)
  }

  function buildChapterDraftAssemblyTransitionGapReason() {
    return localizedText(
      'No artifact-backed transition draft has been materialized for this seam yet.',
      '这条接缝还没有生成带产物引用的过渡草稿。',
    )
  }

  function buildChapterDraftAssemblySceneRecord(input: {
    scene: ChapterStructureWorkspaceRecord['scenes'][number]
    project: FixtureProjectData
  }): ChapterDraftAssemblySceneRecord {
    const sceneFixture = input.project.scenes[input.scene.id]
    const prose = sceneFixture?.prose
    const proseDraft = prose?.proseDraft
    const traceRollup = buildChapterDraftAssemblyTraceRollup(input.scene.id, input.project)
    const draftWordCount = deriveDraftWordCount(proseDraft, prose?.draftWordCount)
    const hasConcreteDraft = hasConcreteProseDraft(proseDraft)
    const proseStatusLabel = prose?.statusLabel
      ? localizeCurrentSceneProseStatusLabel(prose.statusLabel)
      : input.scene.proseStatusLabel
    const common = {
      sceneId: input.scene.id,
      order: input.scene.order,
      title: clone(input.scene.title),
      summary: clone(input.scene.summary),
      backlogStatus: input.scene.backlogStatus,
      proseStatusLabel: clone(proseStatusLabel),
      latestDiffSummary: prose?.latestDiffSummary,
      warningsCount: prose?.warningsCount ?? 0,
      revisionQueueCount: prose?.revisionQueueCount,
      draftWordCount,
      traceReady: !traceRollup.missingLinks.includes('trace'),
      traceRollup,
    }

    if (!sceneFixture || !hasConcreteDraft) {
      const gapRecord: ChapterDraftAssemblySceneGapSectionRecord = {
        ...common,
        kind: 'scene-gap',
        gapReason: buildChapterDraftAssemblyGapReason({
          hasSceneRecord: Boolean(sceneFixture),
          hasConcreteDraft,
        }),
      }
      return gapRecord
    }

    return {
      ...common,
      kind: 'scene-draft',
      proseDraft: proseDraft!.trim(),
      sourcePatchId: prose?.traceSummary?.sourcePatchId,
      sourceProposals: clone(prose?.traceSummary?.sourceProposals ?? []),
      acceptedFactIds: clone(prose?.traceSummary?.acceptedFactIds ?? []),
      relatedAssets: clone(prose?.traceSummary?.relatedAssets ?? []),
    }
  }

  function buildChapterDraftAssemblyTransitionSection(input: {
    fromScene: ChapterDraftAssemblySceneRecord
    toScene: ChapterDraftAssemblySceneRecord
    transitionDraft?: {
      transitionProse?: string
      artifactId?: string
    }
  }): ChapterDraftAssemblyTransitionDraftSectionRecord | ChapterDraftAssemblyTransitionGapSectionRecord {
    const transitionProse = input.transitionDraft?.transitionProse?.trim()
    const artifactId = input.transitionDraft?.artifactId?.trim()

    if (transitionProse && artifactId) {
      return {
        kind: 'transition-draft',
        fromSceneId: input.fromScene.sceneId,
        toSceneId: input.toScene.sceneId,
        fromSceneTitle: clone(input.fromScene.title),
        toSceneTitle: clone(input.toScene.title),
        transitionProse,
        artifactRef: {
          kind: 'prose-draft',
          id: artifactId,
        },
      }
    }

    return {
      kind: 'transition-gap',
      fromSceneId: input.fromScene.sceneId,
      toSceneId: input.toScene.sceneId,
      fromSceneTitle: clone(input.fromScene.title),
      toSceneTitle: clone(input.toScene.title),
      gapReason: buildChapterDraftAssemblyTransitionGapReason(),
    }
  }

  function buildChapterDraftAssemblyRecord(input: {
    chapterId: string
    project: FixtureProjectData
  }): ChapterDraftAssemblyRecord | null {
    const chapter = input.project.chapters[input.chapterId]
    if (!chapter) {
      return null
    }

    const scenes = [...chapter.scenes]
      .sort((left, right) => left.order - right.order)
      .map((scene) => buildChapterDraftAssemblySceneRecord({
        scene,
        project: input.project,
      }))
    const sections: ChapterDraftAssemblySectionRecord[] = []
    for (const [index, scene] of scenes.entries()) {
      sections.push(scene)
      const nextScene = scenes[index + 1]
      if (!nextScene) {
        continue
      }

      sections.push(buildChapterDraftAssemblyTransitionSection({
        fromScene: scene,
        toScene: nextScene,
      }))
    }

    const draftedSceneCount = scenes.filter((scene) => scene.kind === 'scene-draft').length
    const warningsCount = scenes.reduce((total, scene) => total + scene.warningsCount, 0)
    const queuedRevisionCount = scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0)
    const tracedSceneCount = scenes.filter((scene) => scene.traceReady).length
    const assembledWordCount = scenes.reduce((total, scene) => total + (scene.draftWordCount ?? 0), 0)

    return {
      chapterId: chapter.chapterId,
      title: clone(chapter.title),
      summary: clone(chapter.summary),
      sceneCount: scenes.length,
      draftedSceneCount,
      missingDraftCount: scenes.length - draftedSceneCount,
      assembledWordCount,
      warningsCount,
      queuedRevisionCount,
      tracedSceneCount,
      missingTraceSceneCount: scenes.length - tracedSceneCount,
      scenes,
      sections,
    }
  }

  function buildBookDraftAssemblyChapterRecordFromChapterAssembly(input: {
    chapterAssembly: ChapterDraftAssemblyRecord
    order: number
  }): BookDraftAssemblyChapterRecord {
    const scenes = input.chapterAssembly.scenes.map((scene) => {
      const common = {
        sceneId: scene.sceneId,
        order: scene.order,
        title: clone(scene.title),
        summary: clone(scene.summary),
        proseStatusLabel: clone(scene.proseStatusLabel),
        latestDiffSummary: scene.latestDiffSummary,
        warningsCount: scene.warningsCount,
        revisionQueueCount: scene.revisionQueueCount,
        draftWordCount: scene.draftWordCount,
        traceReady: scene.traceReady,
        traceRollup: clone(scene.traceRollup),
      }

      if (scene.kind === 'scene-gap') {
        const gapRecord: BookDraftAssemblySceneGapRecord = {
          ...common,
          kind: 'gap',
          gapReason: clone(scene.gapReason),
        }
        return gapRecord
      }

      return {
        ...common,
        kind: 'draft' as const,
        proseDraft: scene.proseDraft,
        sourcePatchId: scene.sourcePatchId,
        sourceProposals: clone(scene.sourceProposals),
        acceptedFactIds: clone(scene.acceptedFactIds),
        relatedAssets: clone(scene.relatedAssets),
      }
    })

    return {
      chapterId: input.chapterAssembly.chapterId,
      order: input.order,
      title: clone(input.chapterAssembly.title),
      summary: clone(input.chapterAssembly.summary),
      sceneCount: input.chapterAssembly.sceneCount,
      draftedSceneCount: input.chapterAssembly.draftedSceneCount,
      missingDraftCount: input.chapterAssembly.missingDraftCount,
      assembledWordCount: input.chapterAssembly.assembledWordCount,
      warningsCount: input.chapterAssembly.warningsCount,
      queuedRevisionCount: input.chapterAssembly.queuedRevisionCount,
      tracedSceneCount: input.chapterAssembly.tracedSceneCount,
      missingTraceSceneCount: input.chapterAssembly.missingTraceSceneCount,
      scenes,
    }
  }

  function formatBookDraftAssemblyChapterHeading(order: number, title: LocalizedTextRecord) {
    return `Chapter ${order}: ${title.en}`
  }

  function formatBookDraftAssemblySceneHeading(order: number, title: LocalizedTextRecord) {
    return `Scene ${order}: ${title.en}`
  }

  function buildBookDraftReadableManuscript(input: {
    book: BookStructureRecord
    chapters: Array<{
      order: number
      assembly: ChapterDraftAssemblyRecord
    }>
  }): BookDraftAssemblyReadableManuscriptRecord {
    const sections: BookDraftAssemblyManuscriptSectionRecord[] = []
    const sourceManifest: BookDraftAssemblySourceManifestEntryRecord[] = []
    const markdownLines = [`# ${input.book.title.en}`]
    const plainTextLines = [input.book.title.en]

    if (input.book.summary.en.trim()) {
      markdownLines.push('', input.book.summary.en.trim())
      plainTextLines.push('', input.book.summary.en.trim())
    }

    for (const chapter of input.chapters) {
      const chapterHeadingSection: BookDraftAssemblyChapterHeadingSectionRecord = {
        kind: 'chapter-heading',
        chapterId: chapter.assembly.chapterId,
        chapterOrder: chapter.order,
        chapterTitle: clone(chapter.assembly.title),
        summary: clone(chapter.assembly.summary),
        assembledWordCount: chapter.assembly.assembledWordCount,
        missingDraftCount: chapter.assembly.missingDraftCount,
      }
      sections.push(chapterHeadingSection)

      const chapterHeading = formatBookDraftAssemblyChapterHeading(chapter.order, chapter.assembly.title)
      markdownLines.push('', `## ${chapterHeading}`)
      plainTextLines.push('', chapterHeading)

      if (chapter.assembly.summary.en.trim()) {
        markdownLines.push('', chapter.assembly.summary.en.trim())
        plainTextLines.push(chapter.assembly.summary.en.trim())
      }

      for (const section of chapter.assembly.sections) {
        if (section.kind === 'scene-draft' || section.kind === 'scene-gap') {
          const manuscriptSection: BookDraftAssemblySceneManuscriptSectionRecord = {
            kind: section.kind,
            chapterId: chapter.assembly.chapterId,
            chapterOrder: chapter.order,
            chapterTitle: clone(chapter.assembly.title),
            sceneId: section.sceneId,
            sceneOrder: section.order,
            sceneTitle: clone(section.title),
            sceneSummary: clone(section.summary),
            proseDraft: section.kind === 'scene-draft' ? section.proseDraft : undefined,
            gapReason: section.kind === 'scene-gap' ? clone(section.gapReason) : undefined,
            draftWordCount: section.draftWordCount,
            traceReady: section.traceReady,
            sourcePatchId: section.kind === 'scene-draft' ? section.sourcePatchId : undefined,
            sourceProposalIds: section.kind === 'scene-draft'
              ? section.sourceProposals.map((proposal) => proposal.proposalId)
              : [],
            acceptedFactIds: section.kind === 'scene-draft' ? clone(section.acceptedFactIds) : [],
          }
          sections.push(manuscriptSection)
          sourceManifest.push({
            kind: section.kind,
            chapterId: chapter.assembly.chapterId,
            chapterOrder: chapter.order,
            chapterTitle: clone(chapter.assembly.title),
            sceneId: section.sceneId,
            sceneOrder: section.order,
            sceneTitle: clone(section.title),
            sourcePatchId: section.kind === 'scene-draft' ? section.sourcePatchId : undefined,
            sourceProposalIds: manuscriptSection.sourceProposalIds,
            acceptedFactIds: manuscriptSection.acceptedFactIds,
            traceReady: section.traceReady,
            draftWordCount: section.draftWordCount,
            gapReason: section.kind === 'scene-gap' ? clone(section.gapReason) : undefined,
          })

          const sceneHeading = formatBookDraftAssemblySceneHeading(section.order, section.title)
          markdownLines.push('', `### ${sceneHeading}`)
          plainTextLines.push('', sceneHeading)
          if (section.kind === 'scene-draft') {
            markdownLines.push('', section.proseDraft)
            plainTextLines.push(section.proseDraft)
          } else {
            markdownLines.push('', `> Manuscript gap: ${section.gapReason.en}`)
            plainTextLines.push(`[Manuscript gap] ${section.gapReason.en}`)
          }
          continue
        }

        const manuscriptSection: BookDraftAssemblyTransitionManuscriptSectionRecord = {
          kind: section.kind,
          chapterId: chapter.assembly.chapterId,
          chapterOrder: chapter.order,
          chapterTitle: clone(chapter.assembly.title),
          fromSceneId: section.fromSceneId,
          toSceneId: section.toSceneId,
          fromSceneTitle: clone(section.fromSceneTitle),
          toSceneTitle: clone(section.toSceneTitle),
          transitionProse: section.kind === 'transition-draft' ? section.transitionProse : undefined,
          artifactId: section.kind === 'transition-draft' ? section.artifactRef.id : undefined,
          gapReason: section.kind === 'transition-gap' ? clone(section.gapReason) : undefined,
        }
        sections.push(manuscriptSection)
        sourceManifest.push({
          kind: section.kind,
          chapterId: chapter.assembly.chapterId,
          chapterOrder: chapter.order,
          chapterTitle: clone(chapter.assembly.title),
          fromSceneId: section.fromSceneId,
          toSceneId: section.toSceneId,
          sourceProposalIds: [],
          acceptedFactIds: [],
          artifactId: section.kind === 'transition-draft' ? section.artifactRef.id : undefined,
          traceReady: section.kind === 'transition-draft',
          gapReason: section.kind === 'transition-gap' ? clone(section.gapReason) : undefined,
        })

        if (section.kind === 'transition-draft') {
          markdownLines.push('', section.transitionProse)
          plainTextLines.push('', section.transitionProse)
        } else {
          markdownLines.push('', `> Transition gap: ${section.gapReason.en}`)
          plainTextLines.push('', `[Transition gap] ${section.gapReason.en}`)
        }
      }
    }

    return {
      formatVersion: 'book-manuscript-assembly-v1',
      markdown: markdownLines.join('\n').trim(),
      plainText: plainTextLines.join('\n').trim(),
      sections,
      sourceManifest,
    }
  }

  function buildBookDraftAssemblyRecordForBook(project: FixtureProjectData, bookId: string): BookDraftAssemblyRecord | null {
    const book = project.books[bookId]
    if (!book) {
      return null
    }

    const chapterAssemblies = book.chapterIds.flatMap((chapterId, index) => {
      const assembly = buildChapterDraftAssemblyRecord({
        chapterId,
        project,
      })

      return assembly ? [{ order: index + 1, assembly }] : []
    })
    const chapters = chapterAssemblies.map(({ order, assembly }) =>
      buildBookDraftAssemblyChapterRecordFromChapterAssembly({
        chapterAssembly: assembly,
        order,
      }))
    const sceneCount = chapterAssemblies.reduce((total, chapter) => total + chapter.assembly.sceneCount, 0)
    const draftedSceneCount = chapterAssemblies.reduce((total, chapter) => total + chapter.assembly.draftedSceneCount, 0)
    const assembledWordCount = chapterAssemblies.reduce(
      (total, chapter) => total + chapter.assembly.assembledWordCount,
      0,
    )
    const readableManuscript = buildBookDraftReadableManuscript({
      book,
      chapters: chapterAssemblies,
    })

    return {
      bookId: book.bookId,
      title: book.title,
      summary: book.summary,
      chapterCount: chapters.length,
      sceneCount,
      draftedSceneCount,
      missingDraftSceneCount: sceneCount - draftedSceneCount,
      assembledWordCount,
      chapters,
      readableManuscript,
    }
  }

  function createMirroredLocalizedText(value: string) {
    return localizedText(value, value)
  }

  function findBookExperimentBranchScene(
    branch: BookExperimentBranchRecord,
    chapterId: string,
    sceneId: string,
  ) {
    const chapter = branch.chapterSnapshots.find((item) => item.chapterId === chapterId)
    if (!chapter) {
      return null
    }

    return chapter.sceneSnapshots.find((item) => item.sceneId === sceneId) ?? null
  }

  function buildBookCheckpointChaptersFromAssembly(record: BookDraftAssemblyRecord) {
    return record.chapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      order: chapter.order,
      title: clone(chapter.title),
      summary: clone(chapter.summary),
      scenes: chapter.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        order: scene.order,
        title: clone(scene.title),
        summary: clone(scene.summary),
        proseDraft: scene.kind === 'draft' ? scene.proseDraft : undefined,
        draftWordCount: scene.draftWordCount,
        warningsCount: scene.warningsCount,
        traceReady: scene.traceReady,
      })),
    }))
  }

  function buildBranchChaptersFromCheckpoint(record: BookManuscriptCheckpointRecord) {
    return record.chapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      title: clone(chapter.title),
      summary: clone(chapter.summary),
      sceneSnapshots: chapter.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        title: clone(scene.title),
        summary: clone(scene.summary),
        proseDraft: scene.proseDraft ? createMirroredLocalizedText(scene.proseDraft) : undefined,
        draftWordCount: scene.draftWordCount,
        traceReady: scene.traceReady,
        warningsCount: scene.warningsCount,
        sourceProposalCount: 0,
      })),
    }))
  }

  function buildBranchChaptersFromAssembly(record: BookDraftAssemblyRecord) {
    return record.chapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      title: clone(chapter.title),
      summary: clone(chapter.summary),
      sceneSnapshots: chapter.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        title: clone(scene.title),
        summary: clone(scene.summary),
        proseDraft: scene.kind === 'draft' ? createMirroredLocalizedText(scene.proseDraft) : undefined,
        draftWordCount: scene.draftWordCount,
        traceReady: scene.traceReady,
        warningsCount: scene.warningsCount,
        sourceProposalCount: scene.traceRollup.sourceProposalCount,
      })),
    }))
  }

  return {
    whenReady() {
      return readyPromise
    },
    getProjectRuntimeInfo(projectId) {
      const runtimeInfo = clone(getProject(projectId).runtimeInfo)
      runtimeInfo.capabilities.runEventStream = runStore.supportsRunEventStream()
      return runtimeInfo
    },
    getBookStructure(projectId, bookId) {
      const record = getBook(projectId, bookId)
      return record ? clone(record) : null
    },
    getBookDraftAssembly(projectId, bookId) {
      const record = buildBookDraftAssemblyRecordForBook(getProject(projectId), bookId)
      return record ? clone(record) : null
    },
    getChapterDraftAssembly(projectId, chapterId) {
      return clone(buildChapterDraftAssemblyRecord({
        chapterId,
        project: getProject(projectId),
      }))
    },
    getBookManuscriptCheckpoints(projectId, bookId) {
      return clone(getProject(projectId).manuscriptCheckpoints[bookId] ?? [])
    },
    getBookManuscriptCheckpoint(projectId, bookId, checkpointId) {
      const record = (getProject(projectId).manuscriptCheckpoints[bookId] ?? []).find((item) => item.checkpointId === checkpointId)
      return record ? clone(record) : null
    },
    async createBookManuscriptCheckpoint(projectId, input) {
      const project = getProject(projectId)
      const checkpoints = project.manuscriptCheckpoints[input.bookId] ?? []
      const draftAssembly = buildBookDraftAssemblyRecordForBook(project, input.bookId)
      if (!draftAssembly) {
        throw notFound(`Book draft assembly ${input.bookId} was not found.`, {
          code: 'BOOK_DRAFT_ASSEMBLY_NOT_FOUND',
          detail: { bookId: input.bookId },
        })
      }

      const record: BookManuscriptCheckpointRecord = {
        checkpointId: `checkpoint-${input.bookId}-${String(checkpoints.length + 1).padStart(3, '0')}`,
        bookId: input.bookId,
        title: createMirroredLocalizedText(input.title),
        createdAtLabel: createMirroredLocalizedText('2026-04-28 10:00'),
        sourceSignature: input.sourceSignature,
        summary: createMirroredLocalizedText(input.summary),
        selectedChapterId: input.selectedChapterId,
        chapters: buildBookCheckpointChaptersFromAssembly(draftAssembly),
      }

      project.manuscriptCheckpoints[input.bookId] = [...checkpoints, record]
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    getBookExportProfiles(projectId, bookId) {
      return clone(getProject(projectId).exportProfiles[bookId] ?? [])
    },
    getBookExportProfile(projectId, bookId, exportProfileId) {
      const record = (getProject(projectId).exportProfiles[bookId] ?? []).find((item) => item.exportProfileId === exportProfileId)
      return record ? clone(record) : null
    },
    getBookExportArtifacts(projectId, { bookId, exportProfileId, checkpointId }) {
      const artifacts = getProject(projectId).exportArtifacts[bookId] ?? []
      return clone(
        artifacts.filter((artifact) => {
          if (exportProfileId && artifact.exportProfileId !== exportProfileId) {
            return false
          }
          if (checkpointId && artifact.checkpointId !== checkpointId) {
            return false
          }
          return true
        }),
      )
    },
    async createBookExportArtifact(projectId, input) {
      const project = getProject(projectId)
      const artifacts = project.exportArtifacts[input.bookId] ?? []
      const nextId = `artifact-${input.exportProfileId}-${String(artifacts.length + 1).padStart(3, '0')}`
      const record: BookExportArtifactRecord = {
        id: nextId,
        bookId: input.bookId,
        exportProfileId: input.exportProfileId,
        checkpointId: input.checkpointId,
        format: input.format,
        status: 'ready',
        filename: input.filename,
        mimeType: input.mimeType,
        title: input.title,
        summary: input.summary,
        content: input.content,
        sourceSignature: input.sourceSignature,
        chapterCount: input.chapterCount,
        sceneCount: input.sceneCount,
        wordCount: input.wordCount,
        readinessSnapshot: clone(input.readinessSnapshot),
        reviewGateSnapshot: clone(input.reviewGateSnapshot),
        createdAtLabel: '2026-04-23 10:12',
        createdByLabel: 'Fixture API server',
      }

      project.exportArtifacts[input.bookId] = [...artifacts, record]
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    getBookExperimentBranches(projectId, bookId) {
      return clone(getProject(projectId).experimentBranches[bookId] ?? [])
    },
    getBookExperimentBranch(projectId, bookId, branchId) {
      const record = (getProject(projectId).experimentBranches[bookId] ?? []).find((item) => item.branchId === branchId)
      return record ? clone(record) : null
    },
    async createBookExperimentBranch(projectId, input) {
      const project = getProject(projectId)
      const branches = project.experimentBranches[input.bookId] ?? []
      const checkpoint = input.basedOnCheckpointId
        ? (project.manuscriptCheckpoints[input.bookId] ?? []).find((item) => item.checkpointId === input.basedOnCheckpointId) ?? null
        : null
      const draftAssembly = checkpoint ? null : buildBookDraftAssemblyRecordForBook(project, input.bookId)

      if (input.basedOnCheckpointId && !checkpoint) {
        throw notFound(`Book manuscript checkpoint ${input.basedOnCheckpointId} was not found.`, {
          code: 'BOOK_MANUSCRIPT_CHECKPOINT_NOT_FOUND',
          detail: { bookId: input.bookId, checkpointId: input.basedOnCheckpointId },
        })
      }

      if (!checkpoint && !draftAssembly) {
        throw notFound(`Book draft assembly ${input.bookId} was not found.`, {
          code: 'BOOK_DRAFT_ASSEMBLY_NOT_FOUND',
          detail: { bookId: input.bookId },
        })
      }

      const record: BookExperimentBranchRecord = {
        branchId: `branch-${input.bookId}-${String(branches.length + 1).padStart(3, '0')}`,
        bookId: input.bookId,
        title: createMirroredLocalizedText(input.title),
        summary: createMirroredLocalizedText(input.summary),
        rationale: createMirroredLocalizedText(input.rationale),
        createdAtLabel: createMirroredLocalizedText('2026-04-28 10:10'),
        sourceSignature: input.basedOnCheckpointId
          ? `checkpoint:${input.basedOnCheckpointId}`
          : `draft-assembly:${input.bookId}:selected:${input.selectedChapterId}`,
        basedOnCheckpointId: input.basedOnCheckpointId,
        selectedChapterId: input.selectedChapterId,
        status: 'review',
        adoptions: [],
        chapterSnapshots: checkpoint
          ? buildBranchChaptersFromCheckpoint(checkpoint)
          : buildBranchChaptersFromAssembly(draftAssembly!),
      }

      project.experimentBranches[input.bookId] = [...branches, record]
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    async adoptBookExperimentBranch(projectId, input) {
      const project = getProject(projectId)
      const branches = project.experimentBranches[input.bookId] ?? []
      const branchIndex = branches.findIndex((item) => item.branchId === input.branchId)
      if (branchIndex < 0) {
        throw notFound(`Book experiment branch ${input.branchId} was not found.`, {
          code: 'BOOK_EXPERIMENT_BRANCH_NOT_FOUND',
          detail: { bookId: input.bookId, branchId: input.branchId },
        })
      }

      const current = branches[branchIndex]!
      const branchScene = findBookExperimentBranchScene(current, input.chapterId, input.sceneId)
      if (!branchScene) {
        throw notFound(`Book experiment branch scene ${input.sceneId} was not found.`, {
          code: 'BOOK_EXPERIMENT_BRANCH_SCENE_NOT_FOUND',
          detail: {
            bookId: input.bookId,
            branchId: input.branchId,
            chapterId: input.chapterId,
            sceneId: input.sceneId,
          },
        })
      }

      const adoption: BookExperimentBranchAdoptionRecord = {
        adoptionId: `adoption-${input.bookId}-${String((current.adoptions?.length ?? 0) + 1).padStart(3, '0')}`,
        branchId: input.branchId,
        bookId: input.bookId,
        chapterId: input.chapterId,
        sceneId: input.sceneId,
        kind: input.kind,
        status: 'adopted',
        summary: createMirroredLocalizedText(input.summary),
        createdAtLabel: createMirroredLocalizedText('2026-04-28 10:15'),
        sourceSignature: input.sourceSignature,
      }

      if (current.status === 'archived') {
        adoption.status = 'blocked'
      } else if (input.kind === 'canon_patch' && branchScene.sourceProposalCount <= 0) {
        adoption.status = 'blocked'
      } else if (input.kind === 'prose_draft' && !hasConcreteProseDraft(branchScene.proseDraft?.en)) {
        adoption.status = 'blocked'
      }

      const updated: BookExperimentBranchRecord = {
        ...current,
        adoptions: [...(current.adoptions ?? []), adoption],
      }

      project.experimentBranches[input.bookId] = branches.map((branch, index) => (index === branchIndex ? updated : branch))
      await persistProjectOverlay(projectId)
      return clone(adoption)
    },
    async archiveBookExperimentBranch(projectId, input) {
      const project = getProject(projectId)
      const branches = project.experimentBranches[input.bookId] ?? []
      const branchIndex = branches.findIndex((item) => item.branchId === input.branchId)
      if (branchIndex < 0) {
        throw notFound(`Book experiment branch ${input.branchId} was not found.`, {
          code: 'BOOK_EXPERIMENT_BRANCH_NOT_FOUND',
          detail: { bookId: input.bookId, branchId: input.branchId },
        })
      }

      const current = branches[branchIndex]!
      const updated: BookExperimentBranchRecord = {
        ...current,
        status: 'archived',
        archivedAtLabel: createMirroredLocalizedText('2026-04-28 10:12'),
        archiveNote: createMirroredLocalizedText(input.archiveNote),
      }

      project.experimentBranches[input.bookId] = branches.map((branch, index) => (index === branchIndex ? updated : branch))
      await persistProjectOverlay(projectId)
      return clone(updated)
    },
    getChapterStructure(projectId, chapterId) {
      const record = getChapter(projectId, chapterId)
      return record ? clone(record) : null
    },
    async updateChapterBacklogPlanningInput(projectId, chapterId, input) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const nextRecord = patchChapterBacklogPlanning(record, input)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async generateChapterBacklogProposal(projectId, chapterId) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const proposal = createChapterBacklogProposal({
        chapterId,
        proposalSequence: record.planning.proposals.length + 1,
        planning: record.planning,
        scenes: record.scenes,
      })
      const nextRecord: ChapterStructureWorkspaceRecord = {
        ...record,
        planning: {
          ...record.planning,
          proposals: [...record.planning.proposals, proposal],
        },
      }

      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async updateChapterBacklogProposalScene(projectId, { chapterId, proposalId, proposalSceneId, patch }) {
      const record = getChapter(projectId, chapterId)
      if (!record || !record.planning.proposals.some((proposal) => proposal.proposalId === proposalId)) {
        return null
      }

      const nextRecord = patchChapterBacklogProposalScene(record, proposalId, proposalSceneId, patch)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async acceptChapterBacklogProposal(projectId, { chapterId, proposalId }) {
      const record = getChapter(projectId, chapterId)
      if (!record || !record.planning.proposals.some((proposal) => proposal.proposalId === proposalId)) {
        return null
      }

      const nextRecord = applyAcceptedChapterBacklogProposal(record, proposalId)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async startNextChapterSceneRun(projectId, chapterId, input) {
      const chapter = getChapter(projectId, chapterId)
      if (!chapter) {
        return null
      }

      const nextScene = resolveNextChapterRunScene(chapter)
      if (!nextScene.ok) {
        if (nextScene.code === CHAPTER_RUN_REVIEW_GATE_BLOCKED) {
          throw conflict('Chapter run is blocked by a scene waiting for review.', {
            code: CHAPTER_RUN_REVIEW_GATE_BLOCKED,
            detail: { projectId, chapterId, blockingSceneId: nextScene.blockingSceneId },
          })
        }

        throw conflict('Chapter run cannot start because no accepted runnable scene is available.', {
          code: nextScene.code,
          detail: { projectId, chapterId },
        })
      }

      persistChapterSceneBacklogStatus(projectId, chapterId, nextScene.scene.sceneId, 'running')
      const run = await runStore.startSceneRun(projectId, {
        sceneId: nextScene.scene.sceneId,
        mode: input.mode,
        note: input.note,
      })
      syncRunMutations(projectId, run)
      const chapterAfterRun = persistChapterSceneBacklogStatus(
        projectId,
        chapterId,
        nextScene.scene.sceneId,
        run.status === 'waiting_review' ? 'needs_review' : 'running',
      )
      await persistProjectOverlay(projectId)

      return {
        chapter: clone(chapterAfterRun ?? getChapter(projectId, chapterId)!),
        run,
        selectedScene: nextScene.scene,
      }
    },
    async reorderChapterScene(projectId, { chapterId, sceneId, targetIndex }) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const nextRecord = reorderChapterRecordScenes(record, sceneId, targetIndex)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async updateChapterSceneStructure(projectId, { chapterId, sceneId, locale, patch }) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const nextRecord = patchChapterRecordScene(record, sceneId, patch, locale)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async createChapter(projectId, input = {}) {
      const chapterId = `chapter-${randomUUID()}`
      const title = input.title ?? 'Untitled Chapter'
      const summary = input.summary ?? ''
      const record: ChapterStructureWorkspaceRecord = {
        chapterId,
        title: localizedText(title, title),
        summary: localizedText(summary, summary),
        planning: {
          goal: localizedText('', ''),
          constraints: [],
          proposals: [],
        },
        scenes: [],
        inspector: {
          chapterNotes: [],
          problemsSummary: [],
          assemblyHints: [],
        },
        viewsMeta: {
          availableViews: ['backlog', 'sequence', 'outliner', 'assembly'],
        },
      }
      const project = getProject(projectId)
      project.chapters[chapterId] = clone(record)
      const firstBook = Object.values(project.books)[0]
      if (firstBook) {
        firstBook.chapterIds = [...firstBook.chapterIds, chapterId]
      }
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    async renameChapter(projectId, chapterId, input = {}) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }
      if (input.title !== undefined) {
        record.title = localizedText(input.title, input.title)

        const project = getProject(projectId)
        for (const sceneEntry of record.scenes) {
          const scene = project.scenes[sceneEntry.id]
          if (scene) {
            scene.workspace.chapterTitle = input.title
            scene.setup.identity.chapterLabel = input.title
          }
        }
      }
      if (input.summary !== undefined) {
        record.summary = localizedText(input.summary, input.summary)
      }
      getProject(projectId).chapters[chapterId] = record
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    async createScene(projectId, chapterId, input = {}) {
      const chapter = getChapter(projectId, chapterId)
      if (!chapter) {
        return null
      }
      const sceneId = `scene-${randomUUID()}`
      const sceneTitle = input.title ?? 'Untitled Scene'
      const sceneSummary = input.summary ?? ''
      const chapterTitle = chapter.title.en || chapter.title['zh-CN'] || ''

      const sceneRecord = buildEmptySceneRecord({
        sceneId,
        chapterId,
        title: sceneTitle,
        chapterTitle,
        summary: sceneSummary,
      })
      const project = getProject(projectId)
      project.scenes[sceneId] = sceneRecord

      const order = chapter.scenes.length + 1
      chapter.scenes = [
        ...chapter.scenes,
        {
          id: sceneId,
          order,
          title: localizedText(sceneTitle, sceneTitle),
          summary: localizedText(sceneSummary, sceneSummary),
          purpose: localizedText('', ''),
          pov: localizedText('', ''),
          location: localizedText('', ''),
          conflict: localizedText('', ''),
          reveal: localizedText('', ''),
          backlogStatus: 'planned',
          statusLabel: localizedText('New', '新建'),
          proseStatusLabel: localizedText('Needs draft', '需起草'),
          runStatusLabel: localizedText('Not started', '未开始'),
          unresolvedCount: 0,
          lastRunLabel: localizedText('Not run', '未运行'),
        },
      ]
      chapter.scenes.forEach((scene, index) => {
        scene.order = index + 1
      })
      project.chapters[chapterId] = chapter
      await persistProjectOverlay(projectId)
      return clone(chapter)
    },
    async renameScene(projectId, sceneId, input = {}) {
      const scene = getScene(projectId, sceneId)
      if (input.title !== undefined) {
        scene.workspace.title = input.title
        scene.setup.identity.title = input.title

        const project = getProject(projectId)
        for (const chapter of Object.values(project.chapters)) {
          const sceneEntry = chapter.scenes.find((s) => s.id === sceneId)
          if (sceneEntry) {
            sceneEntry.title = localizedText(input.title, input.title)
            break
          }
        }
      }
      await persistProjectOverlay(projectId)
      return clone(scene.workspace)
    },
    listAssets(projectId) {
      const firstWorkspace = Object.values(getProject(projectId).assets)[0] ?? null
      if (!firstWorkspace) {
        return { groups: { character: [], location: [], organization: [], object: [], lore: [] } }
      }

      const workspace = buildAugmentedAssetKnowledgeWorkspace(firstWorkspace, firstWorkspace.assetId)
      return workspace ? summarizeAssetsForNavigator(workspace) : { groups: { character: [], location: [], organization: [], object: [], lore: [] } }
    },
    getAssetKnowledge(projectId, assetId, options) {
      const projectAssets = getProject(projectId).assets
      const record = projectAssets[assetId] ?? Object.values(projectAssets)[0] ?? null
      if (!record) {
        return null
      }

      const augmented = buildAugmentedAssetKnowledgeWorkspace(record, assetId, options?.visibility)
      return augmented ? clone(augmented) : null
    },
    getReviewDecisions(projectId, bookId) {
      return clone(getProject(projectId).reviewDecisions[bookId] ?? [])
    },
    getReviewIssueSnapshots(projectId, bookId) {
      if (!getBook(projectId, bookId)) {
        return {
          bookId,
          issues: [],
        }
      }

      return clone(
        buildReviewIssueSnapshotsRecord(
          bookId,
          getProject(projectId).reviewDecisions[bookId] ?? [],
          getProject(projectId).reviewFixActions[bookId] ?? [],
        ),
      )
    },
    async setReviewDecision(projectId, input) {
      const project = getProject(projectId)
      const bucket = project.reviewDecisions[input.bookId] ?? []
      const record: ReviewIssueDecisionRecord = {
        id: createReviewDecisionRecordId(input.bookId, input.issueId),
        bookId: input.bookId,
        issueId: input.issueId,
        issueSignature: input.issueSignature,
        status: input.status,
        note: trimNote(input.note),
        updatedAtLabel: '2026-04-23 10:05',
        updatedByLabel: 'Fixture API server',
      }
      project.reviewDecisions[input.bookId] = [...bucket.filter((item) => item.issueId !== input.issueId), record]
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    async clearReviewDecision(projectId, { bookId, issueId }) {
      const project = getProject(projectId)
      const bucket = project.reviewDecisions[bookId] ?? []
      project.reviewDecisions[bookId] = bucket.filter((item) => item.issueId !== issueId)
      await persistProjectOverlay(projectId)
    },
    getReviewFixActions(projectId, bookId) {
      return clone(getProject(projectId).reviewFixActions[bookId] ?? [])
    },
    async setReviewFixAction(projectId, input) {
      const project = getProject(projectId)
      const bucket = project.reviewFixActions[input.bookId] ?? []
      const existing = bucket.find((item) => item.issueId === input.issueId)
      const record: ReviewIssueFixActionRecord = {
        id: createReviewFixActionRecordId(input.bookId, input.issueId),
        bookId: input.bookId,
        issueId: input.issueId,
        issueSignature: input.issueSignature,
        sourceHandoffId: input.sourceHandoffId,
        sourceHandoffLabel: input.sourceHandoffLabel,
        targetScope: input.targetScope,
        status: input.status,
        note: trimNote(input.note),
        rewriteRequestNote: trimNote(input.rewriteRequestNote),
        rewriteTargetSceneId: input.rewriteTargetSceneId?.trim() ? input.rewriteTargetSceneId.trim() : undefined,
        rewriteRequestId: input.rewriteRequestId?.trim() ? input.rewriteRequestId.trim() : undefined,
        startedAtLabel: existing?.startedAtLabel ?? '2026-04-23 10:06',
        updatedAtLabel: '2026-04-23 10:07',
        updatedByLabel: 'Fixture API server',
      }
      project.reviewFixActions[input.bookId] = [...bucket.filter((item) => item.issueId !== input.issueId), record]
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    async clearReviewFixAction(projectId, { bookId, issueId }) {
      const project = getProject(projectId)
      const bucket = project.reviewFixActions[bookId] ?? []
      project.reviewFixActions[bookId] = bucket.filter((item) => item.issueId !== issueId)
      await persistProjectOverlay(projectId)
    },
    getSceneWorkspace(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).workspace)
    },
    getSceneSetup(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).setup)
    },
    async updateSceneSetup(projectId, sceneId, setup) {
      const scene = getScene(projectId, sceneId)
      scene.setup = clone(setup)
      scene.workspace.title = setup.identity.title
      await persistProjectOverlay(projectId)
    },
    getSceneExecution(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).execution)
    },
    getSceneProse(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).prose)
    },
    getSceneInspector(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).inspector)
    },
    getSceneDockSummary(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).dock)
    },
    getSceneDockTab(projectId, sceneId, tab) {
      const dock = getScene(projectId, sceneId).dock
      switch (tab) {
        case 'events':
          return { events: clone(dock.events) }
        case 'trace':
          return { trace: clone(dock.trace) }
        case 'consistency':
          return { consistency: clone(dock.consistency) }
        case 'problems':
          return { problems: clone(dock.problems) }
        case 'cost':
          return { cost: clone(dock.cost) }
      }
    },
    getScenePatchPreview(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).patchPreview)
    },
    commitScenePatch(_projectId, _sceneId, _patchId) {},
    async reviseSceneProse(projectId, sceneId, input) {
      const scene = getScene(projectId, sceneId)
      if (!scene.prose.proseDraft) {
        throw conflict(`Scene ${sceneId} requires a prose draft before revision can be requested.`, {
          code: 'SCENE_PROSE_REVISION_DRAFT_REQUIRED',
          detail: { projectId, sceneId, revisionMode: input.revisionMode },
        })
      }

      const source = findSceneRevisionSource(projectId, sceneId)
      if (!source) {
        throw conflict(`Scene ${sceneId} requires prose source artifacts before revision can be requested.`, {
          code: 'SCENE_PROSE_REVISION_SOURCE_REQUIRED',
          detail: { projectId, sceneId, revisionMode: input.revisionMode },
        })
      }

      const trimmedInstruction = trimProseRevisionInstruction(input.instruction)
      const writerResult = await sceneProseWriterGateway.generate({
        task: 'revision',
        sceneId,
        decision: 'accept',
        acceptedProposalIds: scene.prose.traceSummary?.sourceProposals?.map((proposal) => proposal.proposalId) ?? [],
        revisionMode: input.revisionMode,
        currentProse: scene.prose.proseDraft,
        sourceProseDraftId: source.proseDraftId,
        sourceCanonPatchId: source.sourceCanonPatchId,
        contextPacketId: source.contextPacketId,
        ...(trimmedInstruction ? { instruction: trimmedInstruction } : {}),
        instructions: 'Return only the revised scene prose and a short diff summary.',
        input: [
          `Scene: ${sceneId}.`,
          `Revision mode: ${input.revisionMode}.`,
          `Current prose: ${scene.prose.proseDraft}`,
          `Source prose draft: ${source.proseDraftId}.`,
          `Source canon patch: ${source.sourceCanonPatchId}.`,
          `Context packet: ${source.contextPacketId}.`,
          trimmedInstruction ? `Editorial instruction: ${trimmedInstruction}.` : 'Editorial instruction: none.',
        ].join(' '),
      })

      scene.prose = applySceneProseRevisionCandidate({
        prose: scene.prose,
        revisionId: randomUUID(),
        revisionMode: input.revisionMode,
        instruction: trimmedInstruction,
        output: writerResult.output,
        sourceProseDraftId: source.proseDraftId,
        sourceCanonPatchId: source.sourceCanonPatchId,
        contextPacketId: source.contextPacketId,
        provenance: writerResult.provenance,
      })
      syncChapterSceneProseStatus(projectId, sceneId, { en: 'Revision candidate ready', 'zh-CN': '修订候选已就绪' })

      const revisionModeLabel = buildRevisionModeLabel(input.revisionMode)
      scene.dock.events = [
        {
          id: `prose-revision-${sceneId}`,
          title: 'Prose revision candidate ready',
          detail: `The ${revisionModeLabel} revision candidate is ready to compare against the current prose.`,
          meta: scene.prose.revisionCandidate?.revisionId,
          tone: 'accent',
        },
        ...scene.dock.events.filter((entry) => entry.id !== `prose-revision-${sceneId}`),
      ]
      scene.dock.trace = syncSceneRevisionTrace(
        sceneId,
        scene.dock.trace,
        `Candidate ${scene.prose.revisionCandidate?.revisionId} derives from ${source.proseDraftId}, ${source.sourceCanonPatchId}, and ${source.contextPacketId}.`,
        'accent',
      )
      await persistProjectOverlay(projectId)
    },
    async acceptSceneProseRevision(projectId, sceneId, revisionId) {
      const scene = getScene(projectId, sceneId)
      const candidate = scene.prose.revisionCandidate
      if (!candidate || candidate.revisionId !== revisionId) {
        throw conflict(`Scene ${sceneId} does not have revision candidate ${revisionId}.`, {
          code: 'SCENE_PROSE_REVISION_NOT_FOUND',
          detail: { projectId, sceneId, revisionId },
        })
      }

      scene.prose = acceptSceneProseRevisionCandidate({
        prose: scene.prose,
      })
      syncChapterSceneProseStatus(projectId, sceneId, { en: 'Updated', 'zh-CN': '已更新' })
      scene.dock.events = [
        {
          id: `prose-revision-${sceneId}`,
          title: 'Prose revision accepted',
          detail: `Revision candidate ${revisionId} has been promoted into the current prose draft.`,
          meta: revisionId,
          tone: 'success',
        },
        ...scene.dock.events.filter((entry) => entry.id !== `prose-revision-${sceneId}`),
      ]
      scene.dock.trace = syncSceneRevisionTrace(
        sceneId,
        scene.dock.trace,
        `Accepted revision ${revisionId} promoted prose from ${candidate.sourceProseDraftId} with canon patch ${candidate.sourceCanonPatchId}.`,
        'success',
      )
      await persistProjectOverlay(projectId)
    },
    continueSceneRun(_projectId, _sceneId) {},
    async switchSceneThread(projectId, sceneId, threadId) {
      const scene = getScene(projectId, sceneId)
      const hasThread = scene.workspace.availableThreads.some((item) => item.id === threadId)
      if (hasThread) {
        scene.workspace.activeThreadId = threadId
        await persistProjectOverlay(projectId)
      }
    },
    applySceneProposalAction(_projectId, _sceneId, _action, _input) {},
    async startSceneRun(projectId, input) {
      getScene(projectId, input.sceneId)
      const run = await runStore.startSceneRun(projectId, input)
      syncRunMutations(projectId, run)
      await persistProjectOverlay(projectId)
      return run
    },
    async retryRun(projectId, input) {
      const run = await runStore.retryRun(projectId, input)
      syncRunMutations(projectId, run)
      await persistProjectOverlay(projectId)
      return run
    },
    async cancelRun(projectId, input) {
      const run = await runStore.cancelRun(projectId, input)
      syncRunMutations(projectId, run)
      await persistProjectOverlay(projectId)
      return run
    },
    async resumeRun(projectId, input) {
      const run = await runStore.resumeRun(projectId, input)
      syncRunMutations(projectId, run)
      await persistProjectOverlay(projectId)
      return run
    },
    getRun(projectId, runId) {
      return runStore.getRun(projectId, runId)
    },
    listRunArtifacts(projectId, runId) {
      return runStore.listRunArtifacts(projectId, runId)
    },
    getRunArtifact(projectId, runId, artifactId) {
      return runStore.getRunArtifact(projectId, runId, artifactId)
    },
    getRunTrace(projectId, runId) {
      return runStore.getRunTrace(projectId, runId)
    },
    getRunEvents(projectId, input) {
      return runStore.getRunEvents(projectId, input)
    },
    streamRunEvents(projectId, input) {
      return runStore.streamRunEvents(projectId, input)
    },
    supportsRunEventStream() {
      return runStore.supportsRunEventStream()
    },
    async submitRunReviewDecision(projectId, input) {
      const run = await runStore.submitRunReviewDecision(projectId, input)
      syncRunMutations(projectId, run)
      syncSceneBacklogStatusFromReviewDecision(projectId, run, input.decision)
      syncSceneProseFromAcceptedRun(projectId, run, input.decision)
      await persistProjectOverlay(projectId)
      return run
    },
    exportManuscriptMarkdown(projectId, bookId, locale = 'en') {
      const project = getProject(projectId)
      const book = project.books[bookId]
      if (!book) {
        return ''
      }

      const bookTitle = book.title[locale as 'en' | 'zh-CN'] ?? book.title.en ?? ''
      const lines: string[] = []
      lines.push(`# ${bookTitle}`)
      lines.push('')

      for (const chapterId of book.chapterIds) {
        const chapter = project.chapters[chapterId]
        if (!chapter) {
          continue
        }
        const chapterTitle = chapter.title[locale as 'en' | 'zh-CN'] ?? chapter.title.en ?? 'Untitled Chapter'
        lines.push(`## ${chapterTitle}`)
        lines.push('')

        for (const sceneEntry of chapter.scenes) {
          const sceneId = sceneEntry.id
          const scene = project.scenes[sceneId]
          const sceneTitle = sceneEntry.title[locale as 'en' | 'zh-CN'] ?? sceneEntry.title.en ?? 'Untitled Scene'
          const proseDraft = scene?.prose?.proseDraft

          if (proseDraft) {
            lines.push(`### ${sceneTitle}`)
            lines.push('')
            lines.push(proseDraft)
            lines.push('')
          } else {
            lines.push(`<!-- Scene not drafted yet: ${sceneTitle} -->`)
            lines.push('')
          }
        }
      }

      return lines.join('\n')
    },
    exportSnapshot() {
      return clone(snapshot)
    },
    async resetProject(projectId) {
      if (options.localProjectStore && selectedLocalProjectId === projectId) {
        await enqueuePersistence(async () => {
          const resetRecord = await options.localProjectStore!.reset()
          snapshot.projects[projectId] = clone(resetRecord.project.data)
          runStore.clearProject(projectId)
          if (resetRecord.runStore) {
            runStore.hydrateProjectState(projectId, resetRecord.runStore)
            return
          }

          const seedRunSnapshot = createSeedRunStore().exportProjectState(projectId)
          if (seedRunSnapshot) {
            runStore.hydrateProjectState(projectId, seedRunSnapshot)
          }
        })
        return
      }

      resetProjectToSeed(projectId)
      if (options.projectStatePersistence) {
        await enqueuePersistence(async () => {
          await options.projectStatePersistence!.clearProjectOverlay(projectId)
        })
      }
    },
    reset() {
      snapshot = createSeedSnapshot()
      runStore.reset()
    },
  }
}

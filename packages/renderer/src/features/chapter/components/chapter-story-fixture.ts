import { getChapterBacklogStatusLabel, getChapterUnresolvedCountLabel, type Locale } from '@/app/i18n'

import type {
  ChapterDraftSelectedSceneTraceabilityViewModel,
  ChapterDraftTraceCoverageViewModel,
} from '@/features/traceability/types/traceability-view-models'

import type {
  ChapterDraftSectionViewModel,
  ChapterDraftTransitionSectionViewModel,
  ChapterDraftTransitionStatus,
  ChapterDraftWorkspaceViewModel,
} from '../types/chapter-draft-view-models'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

type LocalizedText = Record<Locale, string>

function text(en: string, zhCN: string): LocalizedText {
  return { en, 'zh-CN': zhCN }
}

function pick(locale: Locale, value: LocalizedText) {
  return value[locale]
}

function getQueuedRevisionDetail(locale: Locale, count: number) {
  return locale === 'zh-CN' ? `${count} 个待处理修订` : `${count} queued revision${count === 1 ? '' : 's'}`
}

const chapterTitle = text('Signals in Rain', '雨中信号')
const chapterStructureSummary = text(
  'Keep structure, density, and assembly pressure in the same chapter workbench.',
  '让结构、密度和装配压力继续停留在同一个章节工作台。',
)
const chapterDraftSummary = text(
  'Read the chapter as one continuous draft surface while route.sceneId keeps the focus stable.',
  '把整章当作连续草稿面来阅读，同时让 route.sceneId 保持焦点稳定。',
)

const structureSceneRecords = [
  {
    id: 'scene-midnight-platform',
    order: 1,
    title: text('Midnight Platform', '午夜站台'),
    summary: text('Keep the bargain public and constrained.', '让交换继续保持公开且受限。'),
    purpose: text('Push the bargain into a public stalemate.', '把交换推进到公开僵局里。'),
    pov: text('Ren Voss', '任·沃斯'),
    location: text('Eastbound platform', '东行站台'),
    conflict: text('Ren needs leverage, Mei needs a higher price.', '任需要筹码，梅则要求更高代价。'),
    reveal: text('The courier signal stays readable only to Ren.', '只有任还能读懂信使留下的信号。'),
    backlogStatus: 'planned' as const,
    statusLabel: text('Current', '当前'),
    proseStatusLabel: text('Needs draft', '待起草'),
    runStatusLabel: text('Paused', '已暂停'),
    unresolvedCount: 3,
    lastRunLabel: text('Run 07', '运行 07'),
    briefSummary: text(
      'Keep public witness pressure alive at the edge of the scene.',
      '让公开见证压力继续停留在场景边缘。',
    ),
  },
  {
    id: 'scene-concourse-delay',
    order: 2,
    title: text('Concourse Delay', '候车厅延误'),
    summary: text('Hold the exit timing back a little longer.', '让出口时机再延后一点。'),
    purpose: text('Hold pressure for the next scene.', '把压力继续压送到下一个场景。'),
    pov: text('Mei Arden', '梅·阿登'),
    location: text('Concourse hall', '候车厅'),
    conflict: text('The crowd slows everyone down.', '拥挤的人群拖慢了所有人。'),
    reveal: text('Witness pressure carries inward.', '见证压力继续向内层传导。'),
    backlogStatus: 'needs_review' as const,
    statusLabel: text('Queued', '排队中'),
    proseStatusLabel: text('Queued for draft', '待起草'),
    runStatusLabel: text('Run waiting for review', '等待 Review'),
    unresolvedCount: 2,
    lastRunLabel: text('Not run', '未运行'),
    briefSummary: text(
      'Hold witness pressure at the edge of the exit.',
      '把见证压力继续压在出口边缘。',
    ),
  },
  {
    id: 'scene-ticket-window',
    order: 3,
    title: text('Ticket Window', '售票窗'),
    summary: text('Keep the alias offstage.', '继续让化名留在台后。'),
    purpose: text('Bring speed and certainty into one beat.', '让速度和确定性落在同一个节拍里。'),
    pov: text('Ren Voss', '任·沃斯'),
    location: text('Ticket window', '售票窗'),
    conflict: text('Ren wants speed, Mei wants commitment first.', '任想要速度，梅先要承诺。'),
    reveal: text('The alias still has not entered public knowledge.', '化名仍然没有进入公共认知。'),
    backlogStatus: 'drafted' as const,
    statusLabel: text('Guarded', '受控'),
    proseStatusLabel: text('Needs draft', '待起草'),
    runStatusLabel: text('Guarded', '受控'),
    unresolvedCount: 1,
    lastRunLabel: text('Run 03', '运行 03'),
    briefSummary: text(
      'Keep the alias offstage while the trade-off tightens.',
      '在交换条件收紧时，继续让化名留在场外。',
    ),
  },
] as const

const structurePlanningGoal = text(
  'Keep the chapter pressure public while the ledger stays unread.',
  '让章节压力继续保持公开，同时不要让账本被翻开。',
)

const structurePlanningConstraints = [
  {
    id: 'constraint-ledger',
    label: text('Keep the ledger shut in public.', '让账本在公共场域保持关闭。'),
    detail: text('', ''),
  },
  {
    id: 'constraint-witness',
    label: text('Keep witness pressure visible across the handoff.', '让见证压力在交接过程中持续可见。'),
    detail: text('', ''),
  },
] as const

function buildStoryPlanning(locale: Locale, accepted = false) {
  const proposalId = 'chapter-signals-in-rain-backlog-proposal-001'

  return {
    goal: pick(locale, structurePlanningGoal),
    constraints: structurePlanningConstraints.map((constraint) => ({
      id: constraint.id,
      label: pick(locale, constraint.label),
      detail: pick(locale, constraint.detail),
    })),
    acceptedProposalId: accepted ? proposalId : undefined,
    proposals: [
      {
        proposalId,
        chapterId: 'chapter-signals-in-rain',
        goalSnapshot: pick(locale, structurePlanningGoal),
        constraintSnapshot: structurePlanningConstraints.map((constraint) => ({
          id: constraint.id,
          label: pick(locale, constraint.label),
          detail: pick(locale, constraint.detail),
        })),
        status: accepted ? ('accepted' as const) : ('draft' as const),
        scenes: structureSceneRecords.map((scene) => ({
          proposalSceneId: `${proposalId}::${scene.id}`,
          sceneId: scene.id,
          order: scene.order,
          title: pick(locale, scene.title),
          summary: pick(locale, scene.summary),
          purpose: pick(locale, scene.purpose),
          pov: pick(locale, scene.pov),
          location: pick(locale, scene.location),
          conflict: pick(locale, scene.conflict),
          reveal: pick(locale, scene.reveal),
          backlogStatus: scene.backlogStatus,
          backlogStatusLabel: getChapterBacklogStatusLabel(locale, scene.backlogStatus),
          plannerNotes: pick(locale, structurePlanningGoal),
        })),
      },
    ],
  }
}

function buildSelectedSceneBrief(selectedSceneId: string, locale: Locale) {
  const scene = structureSceneRecords.find((item) => item.id === selectedSceneId) ?? structureSceneRecords[0]

  return {
    sceneId: selectedSceneId,
    title: pick(locale, scene.title),
    summary: pick(locale, scene.briefSummary),
    unresolvedCount: scene.unresolvedCount,
    unresolvedLabel: getChapterUnresolvedCountLabel(locale, scene.unresolvedCount),
  }
}

export function buildChapterStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterStructureWorkspaceViewModel {
  return {
    chapterId: 'chapter-signals-in-rain',
    title: pick(locale, chapterTitle),
    summary: pick(locale, chapterStructureSummary),
    sceneCount: structureSceneRecords.length,
    unresolvedCount: structureSceneRecords.reduce((total, scene) => total + scene.unresolvedCount, 0),
    selectedSceneId,
    planning: buildStoryPlanning(locale),
    scenes: structureSceneRecords.map((scene) => ({
      id: scene.id,
      order: scene.order,
      title: pick(locale, scene.title),
      summary: pick(locale, scene.summary),
      purpose: pick(locale, scene.purpose),
      pov: pick(locale, scene.pov),
      location: pick(locale, scene.location),
      conflict: pick(locale, scene.conflict),
      reveal: pick(locale, scene.reveal),
      backlogStatus: scene.backlogStatus,
      backlogStatusLabel: getChapterBacklogStatusLabel(locale, scene.backlogStatus),
      statusLabel: pick(locale, scene.statusLabel),
      proseStatusLabel: pick(locale, scene.proseStatusLabel),
      runStatusLabel: pick(locale, scene.runStatusLabel),
      unresolvedCount: scene.unresolvedCount,
      lastRunLabel: pick(locale, scene.lastRunLabel),
    })),
    inspector: {
      selectedSceneBrief: buildSelectedSceneBrief(selectedSceneId, locale),
      chapterNotes: [pick(locale, text('Ordering remains structural.', '排序关系继续只承担结构职责。'))],
      problemsSummary: [
        {
          id: 'bell-timing',
          label: pick(locale, text('Bell timing', '铃声时机')),
          detail: pick(locale, text('The exit bell still lands too early.', '出口铃声仍然落得过早。')),
        },
      ],
      assemblyHints: [
        {
          id: 'carry-pressure',
          label: pick(locale, text('Carry platform pressure', '延续站台压力')),
          detail: pick(locale, text('Carry platform pressure into the concourse.', '把站台上的压力继续带进候车厅。')),
        },
      ],
    },
    viewsMeta: {
      availableViews: ['backlog', 'sequence', 'outliner', 'assembly'],
    },
  }
}

export function buildChapterBacklogAcceptedStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterStructureWorkspaceViewModel {
  const workspace = buildChapterStoryWorkspace(selectedSceneId, locale)

  return {
    ...workspace,
    planning: buildStoryPlanning(locale, true),
  }
}

export function buildChapterProblemsHeavyStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterStructureWorkspaceViewModel {
  const workspace = buildChapterStoryWorkspace(selectedSceneId, locale)

  return {
    ...workspace,
    unresolvedCount: 9,
    inspector: {
      ...workspace.inspector,
      chapterNotes: [
        ...workspace.inspector.chapterNotes,
        pick(
          locale,
          text(
            'Carry the witness pressure until the exit is truly blocked.',
            '继续把见证压力顶住，直到出口真的被封死。',
          ),
        ),
      ],
      problemsSummary: [
        ...workspace.inspector.problemsSummary,
        {
          id: 'alias-exposure',
          label: pick(locale, text('Alias exposure', '化名暴露')),
          detail: pick(
            locale,
            text(
              'The alias brushes too close to public knowledge in the ticket window handoff.',
              '售票窗交接时，化名已经过于贴近公共认知边界。',
            ),
          ),
        },
        {
          id: 'timing-drift',
          label: pick(locale, text('Timing drift', '节奏漂移')),
          detail: pick(
            locale,
            text(
              'The bell beat and crowd delay still do not share the same structural clock.',
              '铃声节拍和人群延滞仍然没有落在同一套结构时钟上。',
            ),
          ),
        },
      ],
      assemblyHints: [
        ...workspace.inspector.assemblyHints,
        {
          id: 'tighten-handoff',
          label: pick(locale, text('Tighten the handoff', '压紧交接')),
          detail: pick(
            locale,
            text(
              'Let the concourse exit decision arrive one beat earlier before the ticket window locks it.',
              '让候车厅的出口决断再提前一个节拍，然后再由售票窗把它锁死。',
            ),
          ),
        },
        {
          id: 'hold-witness-line',
          label: pick(locale, text('Hold the witness line', '稳住见证线')),
          detail: pick(
            locale,
            text(
              'Keep witness pressure visible so the next seam does not feel privately reset.',
              '让见证压力继续可见，避免下一个接缝像是被私下重置。',
            ),
          ),
        },
      ],
    },
  }
}

const draftSceneRecords = [
  {
    sceneId: 'scene-midnight-platform',
    order: 1,
    title: text('Midnight Platform', '午夜站台'),
    summary: text('Keep the bargain public and constrained.', '让交换继续保持公开且受限。'),
    proseDraft: text(
      'Rain held the platform in place while Ren refused to blink first.',
      '雨把站台钉在原地，而任始终没有先眨眼。',
    ),
    draftWordCount: 11,
    proseStatusLabel: text('Ready for revision pass', '可进入修订轮'),
    sceneStatusLabel: text('Current', '当前'),
    backlogStatus: 'drafted' as const,
    runStatusLabel: text('Run completed', '运行完成'),
    latestDiffSummary: text('No prose revision requested yet.', '还没有新的正文修订请求。'),
    revisionQueueCount: 0,
    warningsCount: 0,
    isMissingDraft: false,
  },
  {
    sceneId: 'scene-concourse-delay',
    order: 2,
    title: text('Concourse Delay', '候车厅延误'),
    summary: text(
      'Hold the crowd bottleneck long enough to keep platform pressure alive.',
      '把人群瓶颈再拖久一点，让站台压力持续存活。',
    ),
    proseDraft: text(
      'The concourse tightened by inches instead of steps, forcing every glance to travel through strangers before it reached the gate.',
      '候车厅不是一步步收紧，而是一寸寸勒住，让每一道目光都得先穿过陌生人才能抵达闸口。',
    ),
    draftWordCount: 18,
    proseStatusLabel: text('Draft handoff ready', '草稿交接已就绪'),
    sceneStatusLabel: text('Queued', '排队中'),
    backlogStatus: 'needs_review' as const,
    runStatusLabel: text('Run waiting for review', '等待 Review'),
    latestDiffSummary: text(
      'Carry the witness pressure forward without resolving courier ownership.',
      '继续把见证压力往后带，不要提前解释信使归属。',
    ),
    revisionQueueCount: 1,
    warningsCount: 1,
    isMissingDraft: false,
  },
  {
    sceneId: 'scene-ticket-window',
    order: 3,
    title: text('Ticket Window', '售票窗'),
    summary: text(
      'Put speed and certainty in the same beat without surfacing the alias.',
      '让速度与确定性落在同一节拍里，同时不要把化名抬到台前。',
    ),
    proseDraft: text(
      'The clerk slid the ticket halfway out, and even that small motion felt like a question Mei wanted answered before Ren could touch it.',
      '售票员把票只推出一半，而这点小动作都像一个问题，梅要任先回答，才允许他碰到那张票。',
    ),
    draftWordCount: 24,
    proseStatusLabel: text('Ready for prose pass', '可进入正文轮'),
    sceneStatusLabel: text('Guarded', '受控'),
    backlogStatus: 'planned' as const,
    runStatusLabel: text('Idle', '未开始'),
    latestDiffSummary: text(
      'Tighten the visible cost before the clerk notices too much.',
      '在售票员察觉太多之前，再把可见代价压紧一点。',
    ),
    revisionQueueCount: 0,
    warningsCount: 1,
    isMissingDraft: false,
  },
] as const

function buildDraftScenes(locale: Locale) {
  return draftSceneRecords.map((scene) => ({
    sceneId: scene.sceneId,
    order: scene.order,
    title: pick(locale, scene.title),
    summary: pick(locale, scene.summary),
    proseDraft: pick(locale, scene.proseDraft),
    draftWordCount: scene.draftWordCount,
    backlogStatus: scene.backlogStatus,
    backlogStatusLabel: getChapterBacklogStatusLabel(locale, scene.backlogStatus),
    proseStatusLabel: pick(locale, scene.proseStatusLabel),
    sceneStatusLabel: pick(locale, scene.sceneStatusLabel),
    runStatusLabel: pick(locale, scene.runStatusLabel),
    latestDiffSummary: pick(locale, scene.latestDiffSummary),
    revisionQueueCount: scene.revisionQueueCount,
    warningsCount: scene.warningsCount,
    isMissingDraft: scene.isMissingDraft,
  }))
}

function buildTransitionDetail(
  locale: Locale,
  status: ChapterDraftTransitionStatus,
  fallbackDetail?: string,
) {
  if (fallbackDetail) {
    return fallbackDetail
  }

  if (status === 'ready') {
    return pick(
      locale,
      text(
        'Artifact-backed bridge between adjacent drafted scenes.',
        '带产物引用的过渡正文已经把相邻草稿场景接起来了。',
      ),
    )
  }

  if (status === 'weak') {
    return pick(
      locale,
      text(
        'Adjacent scene drafts exist, but the seam still lacks artifact-backed transition prose.',
        '相邻场景都已有草稿，但这条接缝还缺少带产物引用的过渡正文。',
      ),
    )
  }

  return pick(
    locale,
    text(
      'Keep the seam explicit until the adjacent scene drafts are ready.',
      '保持这条接缝显式可见，直到相邻场景草稿准备就绪。',
    ),
  )
}

function buildDraftSections(
  locale: Locale,
  scenes: ChapterDraftWorkspaceViewModel['scenes'],
  transitionOverrides: Record<string, {
    status: ChapterDraftTransitionStatus
    detail?: string
    proseDraft?: string
    artifactId?: string
  }> = {},
) {
  const sections: ChapterDraftSectionViewModel[] = []

  for (const [index, scene] of scenes.entries()) {
    sections.push({
      kind: 'scene',
      ...scene,
    })

    const nextScene = scenes[index + 1]
    if (!nextScene) {
      continue
    }

    const id = `${scene.sceneId}::${nextScene.sceneId}`
    const override = transitionOverrides[id]
    const status = override?.status ?? (!scene.isMissingDraft && !nextScene.isMissingDraft ? 'weak' : 'gap')

    sections.push({
      kind: 'transition',
      id,
      fromSceneId: scene.sceneId,
      toSceneId: nextScene.sceneId,
      fromSceneTitle: scene.title,
      toSceneTitle: nextScene.title,
      status,
      detail: buildTransitionDetail(locale, status, override?.detail),
      proseDraft: status === 'ready' ? override?.proseDraft : undefined,
      artifactId: status === 'ready' ? override?.artifactId : undefined,
    })
  }

  return sections
}

function buildDraftWorkspace(
  selectedSceneId: string,
  locale: Locale,
  scenes = buildDraftScenes(locale),
  transitionOverrides: Record<string, {
    status: ChapterDraftTransitionStatus
    detail?: string
    proseDraft?: string
    artifactId?: string
  }> = {
    'scene-midnight-platform::scene-concourse-delay': {
      status: 'weak',
    },
    'scene-concourse-delay::scene-ticket-window': {
      status: 'ready',
      detail: pick(
        locale,
        text(
          'Artifact-backed bridge between the crowd bottleneck and the ticket decision.',
          '带产物引用的过渡正文已经把人群瓶颈与售票决断接起来了。',
        ),
      ),
      proseDraft: pick(locale, text('Artifact-backed handoff.', '带产物引用的交接段。')),
      artifactId: 'transition-artifact-1',
    },
  },
  overrides?: Partial<ChapterDraftWorkspaceViewModel>,
): ChapterDraftWorkspaceViewModel {
  const selectedScene = scenes.find((scene) => scene.sceneId === selectedSceneId) ?? scenes[0]!
  const draftedSceneCount = scenes.filter((scene) => !scene.isMissingDraft).length
  const missingDraftCount = scenes.filter((scene) => scene.isMissingDraft).length
  const assembledWordCount = scenes.reduce((total, scene) => total + (scene.draftWordCount ?? 0), 0)
  const warningsCount = scenes.reduce((total, scene) => total + scene.warningsCount, 0)
  const queuedRevisionCount = scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0)
  const traceSummaryBySceneId: Record<
    string,
    NonNullable<ChapterDraftWorkspaceViewModel['scenes'][number]['traceSummary']>
  > = {
    'scene-midnight-platform': {
      sourceFactCount: 2,
      relatedAssetCount: 2,
      status: 'ready',
    },
    'scene-concourse-delay': {
      sourceFactCount: 1,
      relatedAssetCount: 1,
      status: 'ready',
    },
    'scene-ticket-window': {
      sourceFactCount: 1,
      relatedAssetCount: 2,
      status: 'ready',
    },
    'scene-warehouse-bridge': {
      sourceFactCount: 0,
      relatedAssetCount: 0,
      status: 'missing',
    },
  }
  const selectedSceneTraceabilityBySceneId: Record<string, ChapterDraftSelectedSceneTraceabilityViewModel> = {
    'scene-midnight-platform': {
      sceneId: 'scene-midnight-platform',
      acceptedFacts: [
        {
          id: 'fact-ledger',
          label: pick(locale, text('Ledger leverage', '账本筹码')),
          value: pick(
            locale,
            text(
              'Ren keeps the ledger shut until Mei names the public cost.',
              '任会一直把账本扣住，直到梅愿意说出公开代价。',
            ),
          ),
          sourceProposals: [{ proposalId: 'proposal-1', title: pick(locale, text('Hold the ledger shut', '继续扣住账本')) }],
          relatedAssets: [
            { assetId: 'asset-ren-voss', title: pick(locale, text('Ren Voss', '任·沃斯')), kind: 'character' },
            { assetId: 'asset-ledger-stays-shut', title: pick(locale, text('Ledger stays shut', '账本保持关闭')), kind: 'rule' },
          ],
        },
      ],
      relatedAssets: [
        { assetId: 'asset-ren-voss', title: pick(locale, text('Ren Voss', '任·沃斯')), kind: 'character' },
        { assetId: 'asset-ledger-stays-shut', title: pick(locale, text('Ledger stays shut', '账本保持关闭')), kind: 'rule' },
      ],
      latestPatchSummary: pick(
        locale,
        text(
          'Semantic patch ready if the public stalemate is accepted into canon.',
          '如果公开僵局进入 canon，就可以提交对应语义补丁。',
        ),
      ),
      latestDiffSummary: pick(locale, text('No prose revision requested yet.', '还没有新的正文修订请求。')),
      sourceProposalCount: 2,
      missingLinks: [],
    },
    'scene-concourse-delay': {
      sceneId: 'scene-concourse-delay',
      acceptedFacts: [
        {
          id: 'fact-crowd-pressure',
          label: pick(locale, text('Crowd pressure stays visible', '人群压力保持可见')),
          value: pick(
            locale,
            text(
              'Keep the bottleneck public so the platform pressure does not dissolve.',
              '让瓶颈保持公开可见，别让站台上的压力提前散掉。',
            ),
          ),
          sourceProposals: [{ proposalId: 'proposal-2', title: pick(locale, text('Carry witness pressure', '继续传递见证压力')) }],
          relatedAssets: [{ assetId: 'asset-ren-voss', title: pick(locale, text('Ren Voss', '任·沃斯')), kind: 'character' }],
        },
      ],
      relatedAssets: [{ assetId: 'asset-ren-voss', title: pick(locale, text('Ren Voss', '任·沃斯')), kind: 'character' }],
      latestPatchSummary: pick(
        locale,
        text(
          'Patch the public bottleneck through the ticket-window handoff.',
          '把公开瓶颈一路带到售票窗交接处，再统一收束。',
        ),
      ),
      latestDiffSummary: pick(
        locale,
        text(
          'Carry the witness pressure forward without resolving courier ownership.',
          '继续把见证压力往后带，不要提前解释信使归属。',
        ),
      ),
      sourceProposalCount: 1,
      missingLinks: [],
    },
    'scene-ticket-window': {
      sceneId: 'scene-ticket-window',
      acceptedFacts: [
        {
          id: 'fact-alias-guard',
          label: pick(locale, text('Alias stays offstage', '化名继续留在场外')),
          value: pick(
            locale,
            text(
              'The alias stays offstage while the ticket decision becomes visible.',
              '票务决断已经公开，但化名依然留在场外。',
            ),
          ),
          sourceProposals: [{ proposalId: 'proposal-3', title: pick(locale, text('Keep the alias offstage', '继续让化名留在场外')) }],
          relatedAssets: [
            { assetId: 'asset-ren-voss', title: pick(locale, text('Ren Voss', '任·沃斯')), kind: 'character' },
            { assetId: 'asset-departure-bell-timing', title: pick(locale, text('Departure bell timing', '发车铃时机')), kind: 'rule' },
          ],
        },
      ],
      relatedAssets: [
        { assetId: 'asset-ren-voss', title: pick(locale, text('Ren Voss', '任·沃斯')), kind: 'character' },
        { assetId: 'asset-departure-bell-timing', title: pick(locale, text('Departure bell timing', '发车铃时机')), kind: 'rule' },
      ],
      latestPatchSummary: pick(
        locale,
        text(
          'The ticket handoff patch is ready once the visible cost tightens.',
          '只要可见代价再压紧一点，就可以提交售票窗交接补丁。',
        ),
      ),
      latestDiffSummary: pick(
        locale,
        text(
          'Tighten the visible cost before the clerk notices too much.',
          '在售票员察觉太多之前，再把可见代价压紧一点。',
        ),
      ),
      sourceProposalCount: 1,
      missingLinks: [],
    },
  }
  const chapterTraceCoverage: ChapterDraftTraceCoverageViewModel = {
    tracedSceneCount: scenes.filter((scene) => traceSummaryBySceneId[scene.sceneId]?.status === 'ready').length,
    missingTraceSceneCount: scenes.filter((scene) => traceSummaryBySceneId[scene.sceneId]?.status !== 'ready').length,
    sceneIdsMissingTrace: scenes
      .filter((scene) => traceSummaryBySceneId[scene.sceneId]?.status !== 'ready')
      .map((scene) => scene.sceneId),
    sceneIdsMissingAssets: scenes
      .filter((scene) => traceSummaryBySceneId[scene.sceneId]?.status === 'ready' && (traceSummaryBySceneId[scene.sceneId]?.relatedAssetCount ?? 0) === 0)
      .map((scene) => scene.sceneId),
  }
  const selectedSceneTraceability = selectedSceneTraceabilityBySceneId[selectedScene.sceneId] ?? null
  const sections = buildDraftSections(locale, scenes, transitionOverrides)
  const transitionSections = sections.filter((section): section is ChapterDraftTransitionSectionViewModel => section.kind === 'transition')
  const transitionSupport = {
    readyCount: transitionSections.filter((section) => section.status === 'ready').length,
    weakCount: transitionSections.filter((section) => section.status === 'weak').length,
    gapCount: transitionSections.filter((section) => section.status === 'gap').length,
    seams: transitionSections
      .filter((section) => section.fromSceneId === selectedScene.sceneId || section.toSceneId === selectedScene.sceneId)
      .map((section) => ({
        id: section.id,
        direction: section.toSceneId === selectedScene.sceneId ? 'incoming' as const : 'outgoing' as const,
        status: section.status,
        counterpartTitle: section.toSceneId === selectedScene.sceneId ? section.fromSceneTitle : section.toSceneTitle,
        detail: section.detail,
        artifactId: section.artifactId,
      })),
  }

  return {
    chapterId: 'chapter-signals-in-rain',
    title: pick(locale, chapterTitle),
    summary: pick(locale, chapterDraftSummary),
    selectedSceneId: selectedScene.sceneId,
    scenes: scenes.map((scene) => ({
      ...scene,
      traceSummary: traceSummaryBySceneId[scene.sceneId],
    })),
    sections,
    assembledWordCount,
    draftedSceneCount,
    missingDraftCount,
    selectedScene,
    inspector: {
      selectedScene: {
        sceneId: selectedScene.sceneId,
        title: selectedScene.title,
        summary: selectedScene.summary,
        proseStatusLabel: selectedScene.proseStatusLabel,
        draftWordCount: selectedScene.draftWordCount,
        revisionQueueCount: selectedScene.revisionQueueCount,
        warningsCount: selectedScene.warningsCount,
        latestDiffSummary: selectedScene.latestDiffSummary,
      },
      chapterReadiness: {
        draftedSceneCount,
        missingDraftCount,
        assembledWordCount,
        warningsCount,
        queuedRevisionCount,
      },
      transitionSupport,
      selectedSceneTraceability,
      chapterTraceCoverage,
    },
    dockSummary: {
      missingDraftCount,
      warningsCount,
      queuedRevisionCount,
      waitingReviewCount: scenes.filter((scene) => scene.backlogStatus === 'needs_review').length,
      transitionGapCount: transitionSections.filter((section) => section.status === 'gap').length,
      transitionReadyCount: transitionSections.filter((section) => section.status === 'ready').length,
      transitionWeakCount: transitionSections.filter((section) => section.status === 'weak').length,
      runnableScene: (() => {
        const runnableScene = scenes.find((scene) => scene.backlogStatus === 'planned')
        return runnableScene
          ? { sceneId: runnableScene.sceneId, title: runnableScene.title, detail: runnableScene.summary }
          : undefined
      })(),
      missingDraftScenes: [],
      warningScenes: scenes
        .filter((scene) => scene.warningsCount > 0)
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: scene.latestDiffSummary ?? scene.summary })),
      queuedRevisionScenes: scenes
        .filter((scene) => (scene.revisionQueueCount ?? 0) > 0)
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: getQueuedRevisionDetail(locale, scene.revisionQueueCount ?? 0) })),
      waitingReviewScenes: scenes
        .filter((scene) => scene.backlogStatus === 'needs_review')
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: scene.runStatusLabel })),
      transitionGapSections: transitionSections
        .filter((section) => section.status === 'gap')
        .map((section) => ({ sceneId: section.id, title: `${section.fromSceneTitle} -> ${section.toSceneTitle}`, detail: section.detail })),
      transitionWeakSections: transitionSections
        .filter((section) => section.status === 'weak')
        .map((section) => ({ sceneId: section.id, title: `${section.fromSceneTitle} -> ${section.toSceneTitle}`, detail: section.detail })),
    },
    ...overrides,
  }
}

export function buildChapterDraftStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterDraftWorkspaceViewModel {
  return buildDraftWorkspace(selectedSceneId, locale)
}

export function buildChapterDraftMissingStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterDraftWorkspaceViewModel {
  const workspace = buildDraftWorkspace(selectedSceneId, locale)
  const scenes = workspace.scenes.map((scene) =>
    scene.sceneId === 'scene-concourse-delay'
      ? {
          ...scene,
          proseDraft: undefined,
          draftWordCount: undefined,
          proseStatusLabel: pick(locale, text('Missing draft', '缺少草稿')),
          latestDiffSummary: pick(locale, text('First prose pass still missing.', '首轮正文仍然缺失。')),
          warningsCount: 2,
          revisionQueueCount: 1,
          isMissingDraft: true,
        }
      : scene,
  )

  return buildDraftWorkspace(selectedSceneId, locale, scenes, {
    'scene-midnight-platform::scene-concourse-delay': {
      status: 'gap',
    },
    'scene-concourse-delay::scene-ticket-window': {
      status: 'weak',
    },
  }, {
    dockSummary: {
      missingDraftCount: scenes.filter((scene) => scene.isMissingDraft).length,
      warningsCount: scenes.reduce((total, scene) => total + scene.warningsCount, 0),
      queuedRevisionCount: scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0),
      waitingReviewCount: scenes.filter((scene) => scene.backlogStatus === 'needs_review').length,
      transitionGapCount: 1,
      transitionReadyCount: 0,
      transitionWeakCount: 1,
      runnableScene: (() => {
        const runnableScene = scenes.find((scene) => scene.backlogStatus === 'planned')
        return runnableScene
          ? { sceneId: runnableScene.sceneId, title: runnableScene.title, detail: runnableScene.summary }
          : undefined
      })(),
      missingDraftScenes: [
        {
          sceneId: 'scene-concourse-delay',
          title: pick(locale, text('Concourse Delay', '候车厅延误')),
          detail: pick(locale, text('First prose pass still missing.', '首轮正文仍然缺失。')),
        },
      ],
      warningScenes: scenes
        .filter((scene) => scene.warningsCount > 0)
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: scene.latestDiffSummary ?? scene.summary })),
      queuedRevisionScenes: scenes
        .filter((scene) => (scene.revisionQueueCount ?? 0) > 0)
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: getQueuedRevisionDetail(locale, scene.revisionQueueCount ?? 0) })),
      waitingReviewScenes: scenes
        .filter((scene) => scene.backlogStatus === 'needs_review')
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: scene.runStatusLabel })),
      transitionGapSections: [
        {
          sceneId: 'scene-midnight-platform::scene-concourse-delay',
          title: `${pick(locale, text('Midnight Platform', '午夜站台'))} -> ${pick(locale, text('Concourse Delay', '候车厅延误'))}`,
          detail: buildTransitionDetail(locale, 'gap'),
        },
      ],
      transitionWeakSections: [
        {
          sceneId: 'scene-concourse-delay::scene-ticket-window',
          title: `${pick(locale, text('Concourse Delay', '候车厅延误'))} -> ${pick(locale, text('Ticket Window', '售票窗'))}`,
          detail: buildTransitionDetail(locale, 'weak'),
        },
      ],
    },
  })
}

export function buildChapterDraftWaitingReviewStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterDraftWorkspaceViewModel {
  return buildDraftWorkspace(selectedSceneId, locale)
}

export function buildChapterDraftTransitionGapStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterDraftWorkspaceViewModel {
  return buildChapterDraftMissingStoryWorkspace(selectedSceneId, locale)
}

export function buildChapterDraftTransitionReadyStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterDraftWorkspaceViewModel {
  return buildDraftWorkspace(selectedSceneId, locale)
}

export function buildChapterDraftRunningGateStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterDraftWorkspaceViewModel {
  const workspace = buildDraftWorkspace(selectedSceneId, locale)
  const scenes = workspace.scenes.map((scene) => (
    scene.sceneId === 'scene-concourse-delay'
      ? {
          ...scene,
          backlogStatus: 'running' as const,
          backlogStatusLabel: getChapterBacklogStatusLabel(locale, 'running'),
          runStatusLabel: pick(locale, text('Run in progress', '运行中')),
        }
      : scene
  ))

  return buildDraftWorkspace(selectedSceneId, locale, scenes, {
    dockSummary: {
      ...workspace.dockSummary,
      waitingReviewCount: 1,
      waitingReviewScenes: [
        {
          sceneId: 'scene-concourse-delay',
          title: pick(locale, text('Concourse Delay', '候车厅延误')),
          detail: pick(locale, text('Run in progress', '运行中')),
        },
      ],
      runnableScene: {
        sceneId: 'scene-ticket-window',
        title: pick(locale, text('Ticket Window', '售票窗')),
        detail: pick(locale, text('Put speed and certainty in the same beat without surfacing the alias.', '让速度与确定性落在同一节拍里，同时不要把化名抬到台前。')),
      },
    },
  })
}

export function buildQuietChapterDraftStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterDraftWorkspaceViewModel {
  const scenes = [
    {
      sceneId: 'scene-warehouse-bridge',
      order: 1,
      title: pick(locale, text('Warehouse Bridge', '仓桥交接')),
      summary: pick(
        locale,
        text(
          'Keep the first handoff tentative enough for later betrayal pressure.',
          '让第一次交接保留足够犹疑，为后续背叛压力留下空间。',
        ),
      ),
      proseDraft: pick(
        locale,
        text(
          'The bridge kept both hands visible and every promise reversible.',
          '桥面让每只手都留在可见处，也让每个承诺都还能撤回。',
        ),
      ),
      draftWordCount: 10,
      backlogStatus: 'planned' as const,
      backlogStatusLabel: getChapterBacklogStatusLabel(locale, 'planned'),
      proseStatusLabel: pick(locale, text('Setup draft only', '仅有设定草稿')),
      sceneStatusLabel: pick(locale, text('Current', '当前')),
      runStatusLabel: pick(locale, text('Idle', '未开始')),
      latestDiffSummary: pick(locale, text('No pending prose revisions.', '当前没有排队中的正文修订。')),
      revisionQueueCount: 0,
      warningsCount: 0,
      isMissingDraft: false,
      traceSummary: {
        sourceFactCount: 0,
        relatedAssetCount: 0,
        status: 'missing',
      },
    },
  ]

  return buildDraftWorkspace(selectedSceneId, locale, scenes, {}, {
    chapterId: 'chapter-open-water-signals',
    title: pick(locale, text('Open Water Signals', '开阔水域信号')),
    summary: pick(locale, text('A quieter chapter draft with one stable handoff scene.', '一个更安静的章节草稿，只保留一个稳定的交接场景。')),
  })
}

export function buildLongChapterDraftStoryWorkspace(
  selectedSceneId: string,
  locale: Locale = 'en',
): ChapterDraftWorkspaceViewModel {
  const workspace = buildDraftWorkspace(selectedSceneId, locale)
  const scenes = workspace.scenes.map((scene) => ({
    ...scene,
    proseDraft: scene.proseDraft ? `${scene.proseDraft}\n\n${scene.proseDraft}\n\n${scene.proseDraft}` : scene.proseDraft,
    draftWordCount: scene.proseDraft ? (scene.draftWordCount ?? 0) * 3 : scene.draftWordCount,
  }))

  return buildDraftWorkspace(selectedSceneId, locale, scenes)
}

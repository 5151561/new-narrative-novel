import {
  getSignalArcCanonicalSceneIdsForChapter,
  signalArcBookId,
  signalArcChapterIds,
} from '@narrative-novel/fixture-seed'

import type {
  AssetKnowledgeWorkspaceRecord,
  BookExperimentBranchRecord,
  BookExportArtifactRecord,
  BookExportProfileRecord,
  BookManuscriptCheckpointRecord,
  BookStructureRecord,
  ChapterStructureWorkspaceRecord,
  FixtureDataSnapshot,
  FixtureProjectData,
  LocalizedTextRecord,
  ReviewIssueDecisionRecord,
  ReviewIssueFixActionRecord,
  SceneFixtureRecord,
} from '../contracts/api-records.js'

function text(en: string, zhCN: string): LocalizedTextRecord {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

type ApiChapterSceneRecord = ChapterStructureWorkspaceRecord['scenes'][number]

const SIGNALS_IN_RAIN_API_SCENE_IDS = getSignalArcCanonicalSceneIdsForChapter('chapter-signals-in-rain')
const OPEN_WATER_API_SCENE_IDS = getSignalArcCanonicalSceneIdsForChapter('chapter-open-water-signals')

function buildApiChapterScenes(
  sceneIds: readonly string[],
  sceneRecordsById: Record<string, ApiChapterSceneRecord>,
  sourceLabel: string,
) {
  return sceneIds.map((sceneId) => {
    const sceneRecord = sceneRecordsById[sceneId]
    if (!sceneRecord) {
      throw new Error(`Missing API chapter fixture scene record for ${sourceLabel}:${sceneId}`)
    }
    return sceneRecord
  })
}

function createBookStructure(): BookStructureRecord {
  return {
    bookId: signalArcBookId,
    title: text('Signal Arc', '信号弧线'),
    summary: text(
      'Fixture-backed project root for the BE-PR1 API server skeleton.',
      '用于 BE-PR1 API server skeleton 的 fixture 项目根数据。',
    ),
    chapterIds: [...signalArcChapterIds],
    viewsMeta: {
      availableViews: ['sequence', 'outliner', 'signals'],
    },
  }
}

function createBookManuscriptCheckpoints(): BookManuscriptCheckpointRecord[] {
  return [
    {
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      bookId: 'book-signal-arc',
      title: text('PR11 Baseline', 'PR11 基线'),
      createdAtLabel: text('2026-04-17 22:10', '2026-04-17 22:10'),
      summary: text(
        'Baseline manuscript snapshot captured before compare and review work started.',
        '在 compare 与 review 工作开始前采集的基线稿快照。',
      ),
      chapters: [
        {
          chapterId: 'chapter-signals-in-rain',
          order: 1,
          title: text('Signals in Rain', '雨中信号'),
          summary: text(
            'Checkpointed station chapter before the latest review pass.',
            '最新复审之前的站台章节 checkpoint。',
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
          ],
        },
      ],
    },
  ]
}

function createBookExportProfiles(): BookExportProfileRecord[] {
  return [
    {
      exportProfileId: 'export-review-packet',
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
  ]
}

function createBookExportArtifacts(): BookExportArtifactRecord[] {
  return [
    {
      id: 'artifact-review-packet-001',
      bookId: 'book-signal-arc',
      exportProfileId: 'export-review-packet',
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      format: 'markdown',
      status: 'ready',
      filename: 'signal-arc-review-packet.md',
      mimeType: 'text/markdown',
      title: 'Signal Arc Review Packet',
      summary: 'Fixture review packet exported from the baseline checkpoint.',
      content: '# Signal Arc Review Packet\n\nFixture export artifact content.',
      sourceSignature: 'book-signal-arc::export-review-packet::checkpoint-book-signal-arc-pr11-baseline::v1',
      chapterCount: 1,
      sceneCount: 1,
      wordCount: 1220,
      readinessSnapshot: {
        status: 'ready',
        blockerCount: 0,
        warningCount: 0,
        infoCount: 1,
      },
      reviewGateSnapshot: {
        openBlockerCount: 0,
        checkedFixCount: 1,
        blockedFixCount: 0,
        staleFixCount: 0,
      },
      createdAtLabel: '2026-04-23 09:50',
      createdByLabel: 'Fixture API server',
    },
  ]
}

function createBookExperimentBranches(): BookExperimentBranchRecord[] {
  return [
    {
      branchId: 'branch-book-signal-arc-quiet-ending',
      bookId: 'book-signal-arc',
      title: text('Quiet Ending', '静默收束稿'),
      summary: text(
        'A lower-conflict branch that trims the closing pressure without removing the handoff logic.',
        '一个更低冲突的实验稿，收束尾声压力，但不移除交接逻辑。',
      ),
      rationale: text(
        'Test a low-conflict landing where the station scenes release tension earlier.',
        '测试一个低冲突收束版本，让站台段落更早放下压力。',
      ),
      createdAtLabel: text('Prepared for quiet-ending review', '为静默收束审阅准备'),
      basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
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
                'Ren keeps the ledger in sight while Mei lets the platform bargain land softer.',
                '任仍把账本放在视线里，但梅让站台交易收得更轻。',
              ),
              draftWordCount: 16,
              traceReady: true,
              warningsCount: 0,
              sourceProposalCount: 2,
            },
          ],
        },
      ],
    },
  ]
}

function createChapterRecords(): Record<string, ChapterStructureWorkspaceRecord> {
  const signalsInRainScenesById: Record<string, ApiChapterSceneRecord> = {
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
      statusLabel: text('Pending', '待定'),
      proseStatusLabel: text('Queued for draft', '待起草'),
      runStatusLabel: text('Idle', '未开始'),
      unresolvedCount: 2,
      lastRunLabel: text('Not run', '未运行'),
    },
  }

  const openWaterScenesById: Record<string, ApiChapterSceneRecord> = {
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
      statusLabel: text('Current', '当前'),
      proseStatusLabel: text('Queued for draft', '待起草'),
      runStatusLabel: text('Running', '运行中'),
      unresolvedCount: 2,
      lastRunLabel: text('Run 04', '运行 04'),
    },
  }

  return {
    'chapter-signals-in-rain': {
      chapterId: 'chapter-signals-in-rain',
      title: text('Signals in Rain', '雨中信号'),
      summary: text(
        'Re-cut the same chapter through order, density, and assembly pressure without leaving the workbench.',
        '在公共压力与隐秘筹码之间重新编排同一章的节奏线。',
      ),
      viewsMeta: {
        availableViews: ['sequence', 'outliner', 'assembly'],
      },
      scenes: buildApiChapterScenes(
        SIGNALS_IN_RAIN_API_SCENE_IDS,
        signalsInRainScenesById,
        'chapter-signals-in-rain',
      ),
      inspector: {
        chapterNotes: [
          text(
            'Witness scrutiny belongs in the auxiliary context, not the stage copy.',
            '目击者压力放在辅助上下文，不放进主舞台文案。',
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
      viewsMeta: {
        availableViews: ['sequence', 'outliner', 'assembly'],
      },
      scenes: buildApiChapterScenes(
        OPEN_WATER_API_SCENE_IDS,
        openWaterScenesById,
        'chapter-open-water-signals',
      ),
      inspector: {
        chapterNotes: [
          text('Keep alternate views pointed at the same chapter identity.', '不同视图仍然指向同一个章节身份。'),
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
}

function createAssetWorkspace(): Record<string, AssetKnowledgeWorkspaceRecord> {
  const assets: AssetKnowledgeWorkspaceRecord['assets'] = [
    {
      id: 'asset-ren-voss',
      kind: 'character',
      title: text('Ren Voss', '任·沃斯'),
      summary: text(
        'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
        '站在信使一侧的谈判者，在公开压力里一边拖时间，一边坚持账本不能被翻开。',
      ),
      profile: {
        sections: [
          {
            id: 'identity',
            title: text('Identity', '身份'),
            facts: [
              { id: 'role', label: text('Role', '角色'), value: text('Courier negotiator', '信使谈判者') },
              {
                id: 'agenda',
                label: text('Agenda', '意图'),
                value: text('Lock the bargain before witnesses harden the price.', '在目击者抬高代价前锁定交易。'),
              },
            ],
          },
        ],
      },
      mentions: [
        {
          id: 'mention-ren-midnight-platform',
          targetScope: 'scene',
          targetId: 'scene-midnight-platform',
          sceneId: 'scene-midnight-platform',
          chapterId: 'chapter-signals-in-rain',
          targetLabel: text('Midnight Platform', '午夜站台'),
          relationLabel: text('Primary POV', '主视角'),
          excerpt: text(
            'Ren holds the line on the platform and refuses to turn the ledger into a public prop.',
            'Ren 在月台上顶住局面，拒绝把账本变成公开道具。',
          ),
          recommendedLens: 'draft',
          backing: {
            kind: 'canon',
            sceneId: 'scene-midnight-platform',
            acceptedFactIds: ['fact-ledger-closed'],
            proposalIds: ['proposal-midnight-platform-001'],
            patchId: 'patch-midnight-platform-001',
          },
        },
      ],
      relations: [
        {
          id: 'relation-ren-mei',
          targetAssetId: 'asset-mei-arden',
          relationLabel: text('Bargains against', '相互谈判'),
          summary: text(
            'Ren needs Mei’s timing, but refuses the terms that would make the ledger public.',
            'Ren 需要 Mei 给出时机，但拒绝接受会让账本公开的条件。',
          ),
        },
      ],
      contextPolicy: {
        assetId: 'asset-ren-voss',
        status: 'active',
        summary: text(
          'Ren may enter run context when he is in cast or explicitly linked to a proposal.',
          '当 Ren 位于登场阵容或被提案显式引用时，可以进入运行上下文。',
        ),
        defaultVisibility: 'character-known',
        defaultBudget: 'selected-facts',
        activationRules: [
          {
            id: 'ren-scene-cast',
            reasonKind: 'scene-cast',
            label: text('Cast member', '登场角色'),
            summary: text('Include selected Ren facts when he is active in the scene cast.', '当 Ren 位于场景登场阵容时纳入筛选事实。'),
            targetAgents: ['scene-manager', 'character-agent', 'prose-agent'],
            visibility: 'character-known',
            budget: 'selected-facts',
            priorityLabel: text('Primary POV context', '主视角上下文'),
          },
          {
            id: 'ren-proposal-link',
            reasonKind: 'proposal-variant',
            label: text('Proposal variant link', '提案变体引用'),
            summary: text('Attach only the facts needed to evaluate a Ren-facing variant.', '仅附带评估 Ren 相关变体所需事实。'),
            targetAgents: ['scene-manager', 'continuity-reviewer'],
            visibility: 'private',
            budget: 'summary-only',
            guardrailLabel: text('Do not expose private courier signal notes.', '不要暴露信使暗号私密备注。'),
          },
        ],
        exclusions: [
          {
            id: 'ren-private-signal',
            label: text('Courier signal private key', '信使暗号私钥'),
            summary: text('Private decoding material stays outside shared scene context.', '私密解码材料不进入共享场景上下文。'),
          },
        ],
      },
      warnings: [
        text(
          'Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.',
          '一旦账本松动，公开目击压力会把 Ren 的筹码反转成负担。',
        ),
      ],
    },
    {
      id: 'asset-mei-arden',
      kind: 'character',
      title: text('Mei Arden', '美伊·阿登'),
      summary: text(
        'Counterparty who keeps raising the visible cost until Ren gives her a usable commitment.',
        '不断抬高公开代价的对手，直到 Ren 给出她能用的承诺。',
      ),
      profile: {
        sections: [
          {
            id: 'identity',
            title: text('Identity', '身份'),
            facts: [
              { id: 'role', label: text('Role', '角色'), value: text('Counterparty broker', '对手方斡旋者') },
            ],
          },
        ],
      },
      mentions: [],
      relations: [
        {
          id: 'relation-mei-ren',
          targetAssetId: 'asset-ren-voss',
          relationLabel: text('Pressures', '施压'),
          summary: text(
            'Mei keeps widening the public price so Ren’s private timing stops being enough.',
            'Mei 不断抬高公开代价，让 Ren 的私下时机不再足够。',
          ),
        },
      ],
      contextPolicy: {
        assetId: 'asset-mei-arden',
        status: 'active',
        summary: text('Mei enters context as visible counter-pressure for bargaining beats.', 'Mei 作为谈判节拍的可见对抗压力进入上下文。'),
        defaultVisibility: 'public',
        defaultBudget: 'selected-facts',
        activationRules: [
          {
            id: 'mei-scene-cast',
            reasonKind: 'scene-cast',
            label: text('Cast pressure', '登场压力'),
            summary: text('Include Mei when the scene needs public bargaining pressure.', '场景需要公开谈判压力时纳入 Mei。'),
            targetAgents: ['scene-manager', 'character-agent', 'prose-agent'],
            visibility: 'public',
            budget: 'selected-facts',
          },
        ],
      },
    },
    {
      id: 'asset-midnight-platform',
      kind: 'location',
      title: text('Midnight Platform', '午夜站台'),
      summary: text(
        'Open platform where every hesitation turns into public leverage and witness pressure.',
        '一个公开暴露的站台，任何犹豫都会被放大成目击压力和公开筹码。',
      ),
      profile: {
        sections: [
          {
            id: 'identity',
            title: text('Identity', '身份'),
            facts: [
              { id: 'type', label: text('Type', '类型'), value: text('Transit platform', '交通月台') },
              { id: 'pressure', label: text('Pressure', '压力'), value: text('Crowd visibility makes secrets expensive.', '人群可见性会让秘密变贵。') },
            ],
          },
        ],
      },
      mentions: [],
      relations: [],
      contextPolicy: {
        assetId: 'asset-midnight-platform',
        status: 'limited',
        summary: text('The platform may provide staging excerpts without copying the full location profile.', '月台可提供调度摘录，但不复制完整地点档案。'),
        defaultVisibility: 'public',
        defaultBudget: 'mentions-excerpts',
        activationRules: [
          {
            id: 'platform-scene-location',
            reasonKind: 'scene-location',
            label: text('Scene location', '场景地点'),
            summary: text('Attach location cues when the scene is staged on the platform.', '场景发生在月台时附带地点线索。'),
            targetAgents: ['scene-manager', 'prose-agent'],
            visibility: 'public',
            budget: 'mentions-excerpts',
          },
        ],
      },
    },
    {
      id: 'asset-ledger-stays-shut',
      kind: 'rule',
      title: text('Ledger Stays Shut', '账本不得打开'),
      summary: text(
        'Core constraint that keeps the exchange from collapsing into immediate public proof.',
        '一条核心约束，用来阻止这场交换立刻坍塌成公开证据。',
      ),
      profile: { sections: [] },
      mentions: [],
      relations: [],
      contextPolicy: {
        assetId: 'asset-ledger-stays-shut',
        status: 'limited',
        summary: text('The ledger rule can enter continuity review, but spoiler proof stays excluded.', '账本规则可进入连续性审阅，但剧透证明保持排除。'),
        defaultVisibility: 'spoiler',
        defaultBudget: 'summary-only',
        activationRules: [
          {
            id: 'ledger-rule-dependency',
            reasonKind: 'rule-dependency',
            label: text('Rule dependency', '规则依赖'),
            summary: text('Use a terse guardrail when a run depends on the closed-ledger rule.', '运行依赖账本关闭规则时只使用简短护栏。'),
            targetAgents: ['continuity-reviewer', 'scene-manager'],
            visibility: 'spoiler',
            budget: 'summary-only',
            guardrailLabel: text('Never include proof contents in context packets.', '不要在上下文包中包含证明内容。'),
          },
        ],
        exclusions: [
          {
            id: 'ledger-proof',
            label: text('Full ledger proof', '完整账本证明'),
            summary: text('Proof contents remain excluded from run context.', '证明内容保持排除，不进入运行上下文。'),
          },
        ],
      },
    },
    {
      id: 'asset-departure-bell-timing',
      kind: 'rule',
      title: text('Departure Bell Timing', '发车铃时序'),
      summary: text(
        'Timing rule that decides when the exit can move without draining witness pressure too early.',
        '一条时序规则，用来决定何时可以离场，又不至于过早抽干目击压力。',
      ),
      profile: { sections: [] },
      mentions: [],
      relations: [],
      contextPolicy: {
        assetId: 'asset-departure-bell-timing',
        status: 'draft',
        summary: text('The bell rule is editor-only until the chapter ending is resolved.', '铃点规则在章节结尾解决前仅供编辑使用。'),
        defaultVisibility: 'editor-only',
        defaultBudget: 'summary-only',
        activationRules: [
          {
            id: 'bell-editor-guardrail',
            reasonKind: 'review-issue',
            label: text('Editor timing guardrail', '编辑时序护栏'),
            summary: text('Redact the exact ending cue while preserving the timing warning count.', '隐藏精确结尾提示，仅保留时序警告计数。'),
            targetAgents: ['continuity-reviewer'],
            visibility: 'editor-only',
            budget: 'summary-only',
          },
        ],
        warnings: [text('Exact bell placement remains unresolved.', '精确铃点仍未解决。')],
      },
    },
    {
      id: 'asset-ticket-window',
      kind: 'location',
      title: text('Ticket Window', '售票窗'),
      summary: text('Narrow exchange point where queue pressure becomes visible.', '一个让队列压力显形的狭窄交换节点。'),
      profile: { sections: [] },
      mentions: [],
      relations: [],
    },
  ]

  return Object.fromEntries(
    assets.map((asset) => [
      asset.id,
      {
        assetId: asset.id,
        assets,
        viewsMeta: {
          availableViews: ['profile', 'mentions', 'relations', 'context'],
        },
      },
    ]),
  )
}

function createReviewDecisions(): Record<string, ReviewIssueDecisionRecord[]> {
  return {
    'book-signal-arc': [
      {
        id: 'book-signal-arc::compare-delta-scene-midnight-platform',
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        status: 'deferred',
        note: 'Hold until the fixture-backed review routes land.',
        updatedAtLabel: '2026-04-23 09:20',
        updatedByLabel: 'Fixture API server',
      },
    ],
  }
}

function createReviewFixActions(): Record<string, ReviewIssueFixActionRecord[]> {
  return {
    'book-signal-arc': [
      {
        id: 'book-signal-arc::compare-delta-scene-midnight-platform',
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        sourceHandoffId: 'handoff-review-001',
        sourceHandoffLabel: 'Review queue handoff',
        targetScope: 'scene',
        status: 'started',
        note: 'Waiting on scene-level patch preview verification.',
        startedAtLabel: '2026-04-23 09:25',
        updatedAtLabel: '2026-04-23 09:26',
        updatedByLabel: 'Fixture API server',
      },
    ],
  }
}

interface LightweightSceneSeed {
  sceneId: string
  title: string
  chapterId: string
  chapterTitle: string
  status: SceneFixtureRecord['workspace']['status']
  runStatus: SceneFixtureRecord['workspace']['runStatus']
  objective: string
  chapterLabel: string
  locationId: string
  locationLabel: string
  povCharacterId: string
  timeboxLabel: string
  setupSummary: string
  cast: SceneFixtureRecord['setup']['cast']
  externalGoal: string
  emotionalGoal: string
  successSignal: string
  failureCost: string
  constraints: SceneFixtureRecord['setup']['constraints']
  knowledgeBoundaries: SceneFixtureRecord['setup']['knowledgeBoundaries']
  executionGoal: string
  tensionLabel: string
  pacingLabel: string
  beatId: string
  beatTitle: string
  beatSummary: string
  proposalId: string
  proposalTitle: string
  proposalSummary: string
  acceptedFactLabel: string
  acceptedFactValue: string
  acceptedFactTrace?: {
    sourceProposals?: SceneFixtureRecord['execution']['acceptedSummary']['acceptedFacts'][number]['sourceProposals']
    relatedAssets?: SceneFixtureRecord['execution']['acceptedSummary']['acceptedFacts'][number]['relatedAssets']
  }
  proseDraft?: string
  proseStatusLabel: string
  proseTraceSummary?: SceneFixtureRecord['prose']['traceSummary']
  dockEventTitle: string
  dockEventDetail: string
  problemTitle: string
  problemRecommendation: string
  latestRunId?: string
  runId?: string
  currentVersionLabel?: string
}

function createFixtureRuntimePresetOptions(): SceneFixtureRecord['setup']['runtimePreset']['presetOptions'] {
  return [
    {
      id: 'runtime-measured-pressure',
      label: 'Measured Pressure',
      focus: 'Controlled escalation',
      intensity: 'Medium',
      summary: 'Keep the scene light enough for parity coverage while preserving scene-shape integrity.',
    },
  ]
}

function createLightweightSceneFixture(seed: LightweightSceneSeed): SceneFixtureRecord {
  const selectedCast = seed.cast.filter((member) => member.selected)
  const acceptedFacts: SceneFixtureRecord['execution']['acceptedSummary']['acceptedFacts'] = [
    {
      id: `fact-${seed.sceneId}`,
      label: seed.acceptedFactLabel,
      value: seed.acceptedFactValue,
      sourceProposals: seed.acceptedFactTrace?.sourceProposals,
      relatedAssets: seed.acceptedFactTrace?.relatedAssets,
    },
  ]
  const guardedBoundaries = seed.knowledgeBoundaries.filter((boundary) => boundary.status !== 'known')

  return {
    workspace: {
      id: seed.sceneId,
      title: seed.title,
      chapterId: seed.chapterId,
      chapterTitle: seed.chapterTitle,
      status: seed.status,
      runStatus: seed.runStatus,
      objective: seed.objective,
      castIds: selectedCast.map((member) => member.id),
      locationId: seed.locationId,
      latestRunId: seed.latestRunId,
      pendingProposalCount: 1,
      warningCount: 1,
      currentVersionLabel: seed.currentVersionLabel,
      activeThreadId: 'thread-main',
      availableThreads: [{ id: 'thread-main', label: 'Mainline' }],
    },
    setup: {
      sceneId: seed.sceneId,
      identity: {
        title: seed.title,
        chapterLabel: seed.chapterLabel,
        locationLabel: seed.locationLabel,
        povCharacterId: seed.povCharacterId,
        timeboxLabel: seed.timeboxLabel,
        summary: seed.setupSummary,
      },
      objective: {
        externalGoal: seed.externalGoal,
        emotionalGoal: seed.emotionalGoal,
        successSignal: seed.successSignal,
        failureCost: seed.failureCost,
      },
      cast: seed.cast,
      constraints: seed.constraints,
      knowledgeBoundaries: seed.knowledgeBoundaries,
      runtimePreset: {
        selectedPresetId: 'runtime-measured-pressure',
        presetOptions: createFixtureRuntimePresetOptions(),
      },
    },
    execution: {
      runId: seed.runId,
      objective: {
        goal: seed.executionGoal,
        tensionLabel: seed.tensionLabel,
        pacingLabel: seed.pacingLabel,
        cast: selectedCast.map((member) => ({ id: member.id, name: member.name, role: member.role })),
        location: { id: seed.locationId, name: seed.locationLabel },
        warningsCount: 1,
        unresolvedCount: seed.knowledgeBoundaries.length,
        constraintSummary: seed.constraints.map((constraint) => constraint.summary),
      },
      beats: [
        {
          id: seed.beatId,
          index: 1,
          title: seed.beatTitle,
          status: 'review',
          proposalCount: 1,
          warningCount: 1,
          summary: seed.beatSummary,
        },
      ],
      proposals: [
        {
          id: seed.proposalId,
          beatId: seed.beatId,
          actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' },
          kind: 'state-change',
          title: seed.proposalTitle,
          summary: seed.proposalSummary,
          status: 'pending',
          impactTags: ['handoff', 'continuity'],
          affects: [
            {
              path: 'scene.accepted-summary',
              label: 'Accepted pressure',
              deltaSummary: seed.proposalSummary,
            },
          ],
          risks: [{ severity: 'warn', message: seed.problemTitle }],
          evidencePeek: [seed.acceptedFactValue],
          sourceTraceId: `trace-${seed.sceneId}`,
        },
      ],
      acceptedSummary: {
        sceneSummary: `Accepted state already keeps ${seed.acceptedFactLabel.toLowerCase()} in play while the next handoff stays reviewable.`,
        acceptedFacts,
        readiness: 'draftable',
        pendingProposalCount: 1,
        warningCount: 1,
        patchCandidateCount: 0,
      },
      runtimeSummary: {
        runHealth: 'attention',
        latencyLabel: seed.runId ? '1.2s avg step' : 'Awaiting run',
        tokenLabel: seed.runId ? '2.4k tokens' : '0 tokens',
        costLabel: seed.runId ? '$0.06 est.' : '$0.00',
        latestFailureSummary: seed.problemTitle,
      },
      consistencySummary: {
        warningsCount: 1,
        topIssues: [seed.problemTitle],
      },
      canContinueRun: false,
      canOpenProse: true,
    },
    prose: {
      sceneId: seed.sceneId,
      proseDraft: seed.proseDraft,
      revisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
      latestDiffSummary: 'No prose revision requested yet.',
      warningsCount: 1,
      focusModeAvailable: true,
      revisionQueueCount: 0,
      draftWordCount: seed.proseDraft?.trim() ? seed.proseDraft.trim().split(/\s+/).length : 0,
      statusLabel: seed.proseStatusLabel,
      traceSummary: seed.proseTraceSummary,
    },
    inspector: {
      context: {
        acceptedFacts,
        privateInfoGuard: {
          summary:
            guardedBoundaries.length > 0
              ? `Protect ${guardedBoundaries.length} guarded reveal point${guardedBoundaries.length === 1 ? '' : 's'} while review stays open.`
              : 'No guarded reveal points remain.',
          items: guardedBoundaries.map((boundary) => ({
            id: `guard-${boundary.id}`,
            label: boundary.label,
            summary: boundary.summary,
            status: boundary.status === 'guarded' ? 'guarded' : 'watching',
          })),
        },
        actorKnowledgeBoundaries: selectedCast.map((member) => ({
          actor: { id: member.id, name: member.name, role: member.role },
          boundaries: seed.knowledgeBoundaries.map((boundary) => ({
            ...boundary,
          })),
        })),
        localState: [
          { id: 'state-1', label: 'Active beat', value: seed.beatTitle },
          { id: 'state-2', label: 'Selected runtime preset', value: 'Measured Pressure' },
          { id: 'state-3', label: 'Accepted patch candidates', value: '0 semantic candidates' },
        ],
        overrides: [
          {
            id: `override-${seed.sceneId}`,
            label: 'Chapter handoff',
            summary: seed.problemRecommendation,
            status: 'active',
          },
        ],
      },
      versions: {
        checkpoints: [
          {
            id: `checkpoint-${seed.sceneId}`,
            label: seed.currentVersionLabel ?? 'Scaffold checkpoint',
            summary: `Fixture parity for ${seed.title} is available in scene scope.`,
            status: 'review',
          },
        ],
        acceptanceTimeline: [
          {
            id: `timeline-${seed.sceneId}`,
            title: seed.dockEventTitle,
            detail: seed.dockEventDetail,
            meta: 'Review',
            tone: 'accent',
          },
        ],
        patchCandidates: [],
      },
      runtime: {
        profile: {
          label: 'Measured Pressure',
          summary: `Keep ${seed.title} light enough for parity coverage while preserving scene-shape integrity.`,
        },
        runHealth: 'attention',
        metrics: {
          latencyLabel: seed.runId ? '1.2s avg step' : 'Awaiting run',
          tokenLabel: seed.runId ? '2.4k tokens' : '0 tokens',
          costLabel: seed.runId ? '$0.06 est.' : '$0.00',
        },
        latestFailure: seed.problemTitle,
      },
    },
    dock: {
      events: [
        {
          id: `event-${seed.sceneId}`,
          title: seed.dockEventTitle,
          detail: seed.dockEventDetail,
          meta: 'Event',
          tone: 'accent',
        },
      ],
      trace: [
        {
          id: `trace-${seed.sceneId}`,
          title: `Trace / ${seed.title}`,
          detail: seed.proposalSummary,
          meta: 'Trace',
          tone: 'neutral',
        },
      ],
      consistency: {
        summary: `One continuity checkpoint remains open for ${seed.title}.`,
        checks: [
          {
            id: `consistency-${seed.sceneId}`,
            label: seed.problemTitle,
            status: 'warn',
            detail: seed.problemRecommendation,
          },
        ],
      },
      problems: {
        summary: 'Keep the remaining risk visible without expanding the scene scaffold.',
        items: [
          {
            id: `problem-${seed.sceneId}`,
            title: seed.problemTitle,
            severity: 'warn',
            recommendation: seed.problemRecommendation,
          },
        ],
      },
      cost: {
        currentWindowLabel: seed.runId ? '$0.06 estimated' : '$0.00 estimated',
        trendLabel: 'Lightweight parity fixture.',
        breakdown: [{ id: `cost-${seed.sceneId}`, label: 'Fixture status', value: 'Parity scaffold' }],
      },
    },
    patchPreview: null,
  }
}

function createSceneRecords(): Record<string, SceneFixtureRecord> {
  return {
    'scene-midnight-platform': {
      workspace: {
        id: 'scene-midnight-platform',
        title: 'Midnight Platform',
        chapterId: 'chapter-signals-in-rain',
        chapterTitle: 'Signals in Rain',
        status: 'review',
        runStatus: 'paused',
        objective: 'Lock the bargain before the witness can turn the ledger into public leverage.',
        castIds: ['asset-ren-voss', 'asset-mei-arden'],
        locationId: 'asset-midnight-platform',
        latestRunId: 'run-scene-midnight-platform-001',
        pendingProposalCount: 2,
        warningCount: 1,
        currentVersionLabel: 'Checkpoint PR11 + draft delta',
        activeThreadId: 'thread-platform-01',
        availableThreads: [
          { id: 'thread-platform-01', label: 'Primary thread' },
          { id: 'thread-platform-02', label: 'Quiet ending branch' },
        ],
      },
      setup: {
        sceneId: 'scene-midnight-platform',
        identity: {
          title: 'Midnight Platform',
          chapterLabel: 'Signals in Rain',
          locationLabel: 'Eastbound platform',
          povCharacterId: 'asset-ren-voss',
          timeboxLabel: 'Near midnight, one train window left',
          summary: 'The platform scene keeps every negotiation beat public.',
        },
        objective: {
          externalGoal: 'Close the bargain without opening the ledger.',
          emotionalGoal: 'Keep Ren visibly controlled under witness pressure.',
          successSignal: 'The witness sees a bargain, but not the ledger contents.',
          failureCost: 'The courier signal becomes public leverage.',
        },
        cast: [
          {
            id: 'asset-ren-voss',
            name: 'Ren Voss',
            role: 'POV negotiator',
            agenda: 'Hold the ledger line and buy time.',
            selected: true,
          },
          {
            id: 'asset-mei-arden',
            name: 'Mei Arden',
            role: 'Counterparty',
            agenda: 'Force a visible commitment before the crowd disperses.',
            selected: true,
          },
        ],
        constraints: [
          {
            id: 'constraint-ledger',
            label: 'Ledger stays shut',
            kind: 'canon',
            summary: 'No beat can expose the ledger contents in public.',
          },
        ],
        knowledgeBoundaries: [
          {
            id: 'boundary-courier-signal',
            label: 'Courier signal meaning',
            summary: 'Only Ren can decode the private courier signal.',
            status: 'guarded',
          },
        ],
        runtimePreset: {
          selectedPresetId: 'preset-tight-stakes',
          presetOptions: [
            {
              id: 'preset-tight-stakes',
              label: 'Tight Stakes',
              focus: 'Public bargaining pressure',
              intensity: 'High',
              summary: 'Bias toward visible negotiation and compressed pacing.',
            },
          ],
        },
      },
      execution: {
        runId: 'run-scene-midnight-platform-001',
        objective: {
          goal: 'Keep the platform bargain public without letting the ledger open.',
          tensionLabel: 'Public leverage rising',
          pacingLabel: 'Compressed',
          cast: [
            { id: 'asset-ren-voss', name: 'Ren Voss', role: 'negotiator' },
            { id: 'asset-mei-arden', name: 'Mei Arden', role: 'counterparty' },
          ],
          location: {
            id: 'asset-midnight-platform',
            name: 'Midnight Platform',
          },
          warningsCount: 1,
          unresolvedCount: 2,
          constraintSummary: ['Ledger stays shut', 'Witness must remain external'],
        },
        beats: [
          {
            id: 'beat-platform-open',
            index: 1,
            title: 'Open with witness pressure',
            status: 'accepted',
            proposalCount: 1,
            warningCount: 0,
            summary: 'Witness pressure establishes the public terms.',
          },
          {
            id: 'beat-bargain-turn',
            index: 2,
            title: 'Force the bargain turn',
            status: 'review',
            proposalCount: 2,
            warningCount: 1,
            summary: 'Proposal set is waiting for editorial review.',
          },
        ],
        proposals: [
          {
            id: 'proposal-midnight-platform-001',
            actor: {
              id: 'scene-manager',
              name: 'Scene Manager',
              type: 'scene-manager',
            },
            kind: 'conflict',
            title: 'Raise the price in public',
            summary: 'Mei escalates the bargain while the witness stays close enough to hear.',
            status: 'pending',
            impactTags: ['pressure', 'visibility'],
            affects: [
              {
                path: 'beats[1].summary',
                label: 'Beat summary',
                deltaSummary: 'More visible escalation before the train departs.',
              },
            ],
            risks: [
              {
                severity: 'warn',
                message: 'Too much escalation could expose the courier signal.',
              },
            ],
            evidencePeek: ['Witness stays on platform edge', 'Ledger still unread'],
            sourceTraceId: 'trace-platform-001',
          },
        ],
        acceptedSummary: {
          sceneSummary: 'The platform bargain remains public while Ren keeps the ledger unread.',
          acceptedFacts: [
            {
              id: 'fact-ledger-closed',
              label: 'Ledger remains closed',
              value: 'No public beat opens the ledger.',
            },
          ],
          readiness: 'draftable',
          pendingProposalCount: 2,
          warningCount: 1,
          patchCandidateCount: 1,
        },
        runtimeSummary: {
          runHealth: 'attention',
          latencyLabel: '1.2s median',
          tokenLabel: '2.8k tokens',
          costLabel: '$0.04',
          latestFailureSummary: 'Previous pass stalled on the closing beat.',
        },
        consistencySummary: {
          warningsCount: 1,
          topIssues: ['Closing bell timing still unresolved.'],
        },
        canContinueRun: true,
        canOpenProse: true,
      },
      prose: {
        sceneId: 'scene-midnight-platform',
        proseDraft:
          'Ren lets the rain hide the count in his head while Mei keeps every term loud enough for the witness to hear.',
        revisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
        latestDiffSummary: 'Tightened public bargaining beats and reduced repeated witness narration.',
        warningsCount: 1,
        focusModeAvailable: true,
        revisionQueueCount: 1,
        draftWordCount: 21,
        statusLabel: 'Draft ready for review',
        traceSummary: {
          sourcePatchId: 'patch-midnight-platform-001',
          sourceProposals: [
            {
              proposalId: 'proposal-midnight-platform-001',
              title: 'Raise the price in public',
              sourceTraceId: 'trace-platform-001',
            },
          ],
          acceptedFactIds: ['fact-ledger-closed'],
          relatedAssets: [
            {
              assetId: 'asset-ren-voss',
              title: 'Ren Voss',
              kind: 'character',
            },
          ],
          missingLinks: ['Departure bell timing'],
        },
      },
      inspector: {
        context: {
          acceptedFacts: [
            {
              id: 'fact-ledger-closed',
              label: 'Ledger remains closed',
              value: 'The witness never sees the ledger opened.',
            },
          ],
          privateInfoGuard: {
            summary: 'Keep private courier knowledge out of public beats.',
            items: [
              {
                id: 'guard-courier-signal',
                label: 'Courier signal meaning',
                summary: 'Only Ren can decode the courier signal.',
                status: 'guarded',
              },
            ],
          },
          actorKnowledgeBoundaries: [
            {
              actor: {
                id: 'asset-mei-arden',
                name: 'Mei Arden',
                role: 'counterparty',
              },
              boundaries: [
                {
                  id: 'boundary-mei-courier-signal',
                  label: 'Courier signal contents',
                  summary: 'Mei sees pressure, not the actual code.',
                  status: 'guarded',
                },
              ],
            },
          ],
          localState: [
            {
              id: 'state-platform-weather',
              label: 'Weather',
              value: 'Rain keeps the platform noisy and visible.',
            },
          ],
          overrides: [
            {
              id: 'override-closing-beat',
              label: 'Closing beat guard',
              summary: 'Do not resolve the witness pressure before the bell cue.',
              status: 'watching',
            },
          ],
        },
        versions: {
          checkpoints: [
            {
              id: 'checkpoint-book-signal-arc-pr11-baseline',
              label: 'PR11 baseline',
              summary: 'Current compare anchor for the scene.',
              status: 'accepted',
            },
          ],
          acceptanceTimeline: [
            {
              id: 'timeline-accepted-001',
              title: 'Accepted draft delta',
              detail: 'Public bargaining pressure increased without exposing the ledger.',
              meta: 'Review queue',
              tone: 'success',
            },
          ],
          patchCandidates: [
            {
              id: 'patch-midnight-platform-001',
              label: 'Platform pressure patch',
              summary: 'Tighten witness-facing dialogue before the final beat.',
              status: 'ready_for_commit',
            },
          ],
        },
        runtime: {
          profile: {
            label: 'Fixture scene runtime',
            summary: 'In-memory API-backed scene runtime scaffold.',
          },
          runHealth: 'attention',
          metrics: {
            latencyLabel: '1.2s median',
            tokenLabel: '2.8k tokens',
            costLabel: '$0.04',
          },
          latestFailure: 'Closing beat still needs a safer handoff into motion.',
        },
      },
      dock: {
        events: [
          {
            id: 'dock-event-001',
            title: 'Review waiting',
            detail: 'Run review is waiting on the proposal set.',
            meta: 'run-scene-midnight-platform-001',
            tone: 'accent',
          },
        ],
        trace: [
          {
            id: 'dock-trace-001',
            title: 'Ledger guard',
            detail: 'Accepted fact still protects the ledger from public exposure.',
            meta: 'fact-ledger-closed',
            tone: 'success',
          },
        ],
        consistency: {
          summary: 'One blocking timing concern remains.',
          checks: [
            {
              id: 'consistency-bell',
              label: 'Departure bell timing',
              status: 'warn',
              detail: 'The bell cue still risks collapsing witness pressure too early.',
            },
          ],
        },
        problems: {
          summary: 'Scene remains shippable only after the closing beat is tightened.',
          items: [
            {
              id: 'problem-bell',
              title: 'Closing bell lands too soon',
              severity: 'high',
              recommendation: 'Delay the bell until after Mei forces the last visible term.',
            },
          ],
        },
        cost: {
          currentWindowLabel: 'Current pass: $0.04',
          trendLabel: 'Stable over last 3 runs',
          breakdown: [
            { id: 'cost-planner', label: 'Planner', value: '$0.01' },
            { id: 'cost-writer', label: 'Writer', value: '$0.03' },
          ],
        },
      },
      patchPreview: {
        patchId: 'patch-midnight-platform-001',
        label: 'Platform pressure patch',
        summary: 'Applies a tighter public bargaining turn before the closing beat.',
        status: 'ready_for_commit',
        sceneSummary: 'Witness pressure stays public while Ren holds the ledger line.',
        acceptedFacts: [
          {
            id: 'fact-ledger-closed',
            label: 'Ledger remains closed',
            value: 'No public beat opens the ledger.',
          },
        ],
        changes: [
          {
            id: 'change-public-price',
            label: 'Sharpen public price',
            detail: 'Move Mei’s strongest demand earlier in the beat rail.',
            sourceProposals: [
              {
                proposalId: 'proposal-midnight-platform-001',
                title: 'Raise the price in public',
                sourceTraceId: 'trace-platform-001',
              },
            ],
            relatedAssets: [
              {
                assetId: 'asset-mei-arden',
                title: 'Mei Arden',
                kind: 'character',
              },
            ],
          },
        ],
      },
    },
    'scene-concourse-delay': createLightweightSceneFixture({
      sceneId: 'scene-concourse-delay',
      title: 'Concourse Delay',
      chapterId: 'chapter-signals-in-rain',
      chapterTitle: 'Signals in Rain',
      status: 'draft',
      runStatus: 'idle',
      objective: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
      chapterLabel: 'Signals in Rain / Scene 5',
      locationId: 'concourse-hall',
      locationLabel: 'Crowded concourse hall',
      povCharacterId: 'asset-mei-arden',
      timeboxLabel: '03:18-03:22',
      setupSummary: 'A crowd-bound transition scene that delays the exit without resolving who controls the courier line.',
      cast: [
        { id: 'asset-mei-arden', name: 'Mei Arden', role: 'POV', agenda: 'Hold the crowd between Ren and the gate.', selected: true },
        { id: 'asset-ren-voss', name: 'Ren Voss', role: 'Counterforce', agenda: 'Slip through before the delay hardens.', selected: true },
        { id: 'asset-platform-ushers', name: 'Platform ushers', role: 'Ambient pressure', agenda: 'Keep bodies moving, not answers.', selected: false },
      ],
      externalGoal: 'Delay the exit without giving up the courier advantage.',
      emotionalGoal: 'Let Mei keep control without showing panic.',
      successSignal: 'The crowd slows the move and the witness pressure survives.',
      failureCost: 'The handoff escapes the chapter before the pressure lands.',
      constraints: [
        {
          id: 'constraint-concourse-1',
          label: 'Do not settle courier ownership',
          kind: 'canon',
          summary: 'No one proves who controls the courier line here.',
        },
      ],
      knowledgeBoundaries: [
        {
          id: 'boundary-concourse-1',
          label: 'Courier-line owner',
          summary: 'The crowd delay should not confirm who actually commands the courier path.',
          status: 'guarded',
        },
      ],
      executionGoal: 'Use the bottleneck to delay motion without turning the chapter private.',
      tensionLabel: 'Held',
      pacingLabel: 'Crowded',
      beatId: 'beat-concourse-delay',
      beatTitle: 'Crowd bottleneck',
      beatSummary: 'Bodies compress the exit while Mei tries to keep the witness pressure public.',
      proposalId: 'proposal-concourse-delay',
      proposalTitle: 'Keep the delay visible from both sides of the crowd',
      proposalSummary: 'Let the bottleneck slow everyone down while the witness pressure carries inward from the platform.',
      acceptedFactLabel: 'Crowd delay established',
      acceptedFactValue: 'The concourse bottleneck slows motion without resolving courier ownership.',
      acceptedFactTrace: {
        sourceProposals: [{ proposalId: 'proposal-concourse-delay', sourceTraceId: 'trace-scene-concourse-delay' }],
        relatedAssets: [
          { assetId: 'asset-mei-arden', title: 'Mei Arden', kind: 'character' },
          { assetId: 'asset-midnight-platform', title: 'Midnight Platform', kind: 'location' },
        ],
      },
      proseStatusLabel: 'Draft handoff ready',
      dockEventTitle: 'Concourse delay preserved',
      dockEventDetail: 'The scene scaffold keeps crowd pressure active without settling the courier line.',
      problemTitle: 'Crowd pressure still needs a clean exit path',
      problemRecommendation: 'Keep the witness line visible while the crowd delay hands the chapter forward.',
    }),
    'scene-ticket-window': createLightweightSceneFixture({
      sceneId: 'scene-ticket-window',
      title: 'Ticket Window',
      chapterId: 'chapter-signals-in-rain',
      chapterTitle: 'Signals in Rain',
      status: 'review',
      runStatus: 'paused',
      objective: 'Put speed and certainty in the same beat without letting Ren’s alias surface.',
      chapterLabel: 'Signals in Rain / Scene 6',
      locationId: 'ticket-window',
      locationLabel: 'Station ticket window',
      povCharacterId: 'asset-ren-voss',
      timeboxLabel: '03:22-03:25',
      setupSummary: 'A narrow transaction scene where speed is useful only if the alias stays out of public reach.',
      cast: [
        { id: 'asset-ren-voss', name: 'Ren Voss', role: 'POV', agenda: 'Buy speed without naming the alias.', selected: true },
        { id: 'asset-mei-arden', name: 'Mei Arden', role: 'Counterforce', agenda: 'Force commitment before motion resumes.', selected: true },
        { id: 'asset-ticket-clerk', name: 'Ticket clerk', role: 'Witness', agenda: 'Notice urgency, not the hidden identity.', selected: true },
      ],
      externalGoal: 'Secure the next move before the gate closes.',
      emotionalGoal: 'Keep Ren contained while Mei sharpens the trade-off.',
      successSignal: 'The trade-off tightens and the alias remains private.',
      failureCost: 'The chapter exposes the alias before the handoff earns it.',
      constraints: [
        {
          id: 'constraint-ticket-1',
          label: 'Alias stays offstage',
          kind: 'canon',
          summary: 'No public alias reveal is allowed at the ticket window.',
        },
      ],
      knowledgeBoundaries: [
        {
          id: 'boundary-ticket-1',
          label: 'Alias exposure',
          summary: 'The alias remains withheld from the clerk and the crowd.',
          status: 'guarded',
        },
      ],
      executionGoal: 'Turn urgency into a visible trade-off instead of an explanation dump.',
      tensionLabel: 'Tight',
      pacingLabel: 'Controlled',
      beatId: 'beat-ticket-window',
      beatTitle: 'Window bargain',
      beatSummary: 'Ren reaches for speed while Mei keeps the cost public enough to matter.',
      proposalId: 'proposal-ticket-window',
      proposalTitle: 'Force the trade-off into one visible exchange',
      proposalSummary: 'Let the clerk witness urgency without learning the alias that gives the urgency its edge.',
      acceptedFactLabel: 'Alias still offstage',
      acceptedFactValue: 'The ticket-window exchange keeps the alias outside public knowledge.',
      acceptedFactTrace: {
        sourceProposals: [{ proposalId: 'proposal-ticket-window', sourceTraceId: 'trace-scene-ticket-window' }],
        relatedAssets: [
          { assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' },
          { assetId: 'asset-ticket-window', title: 'Ticket Window', kind: 'location' },
        ],
      },
      proseStatusLabel: 'Ready for prose pass',
      dockEventTitle: 'Ticket-window trade-off held',
      dockEventDetail: 'The scene remains usable in scene scope without exposing the alias.',
      problemTitle: 'Alias pressure needs tighter public cover',
      problemRecommendation: 'Keep the clerk focused on urgency so the alias never enters the room.',
      latestRunId: 'run-03',
      runId: 'run-03',
      currentVersionLabel: 'Run 03',
    }),
    'scene-departure-bell': createLightweightSceneFixture({
      sceneId: 'scene-departure-bell',
      title: 'Departure Bell',
      chapterId: 'chapter-signals-in-rain',
      chapterTitle: 'Signals in Rain',
      status: 'draft',
      runStatus: 'idle',
      objective: 'Place the bell without collapsing witness pressure before the chapter closes.',
      chapterLabel: 'Signals in Rain / Scene 7',
      locationId: 'departure-gate',
      locationLabel: 'Departure gate',
      povCharacterId: 'asset-station-conductor',
      timeboxLabel: '03:25-03:27',
      setupSummary: 'A final timing scene still testing where motion begins and scrutiny stops.',
      cast: [
        { id: 'asset-station-conductor', name: 'Station Conductor', role: 'POV', agenda: 'Keep the platform moving on schedule.', selected: true },
        { id: 'asset-ren-voss', name: 'Ren Voss', role: 'Pressure point', agenda: 'Leave before the bell turns him into a public fact.', selected: true },
        { id: 'asset-mei-arden', name: 'Mei Arden', role: 'Counterforce', agenda: 'Make the bell land on her terms.', selected: true },
      ],
      externalGoal: 'Choose a bell cue that preserves confrontation pressure to the end.',
      emotionalGoal: 'Let the conductor read the tension without explaining it.',
      successSignal: 'The bell lands and the witness pressure still matters.',
      failureCost: 'Motion starts too early and drains the confrontation.',
      constraints: [
        {
          id: 'constraint-bell-1',
          label: 'Bell cannot pre-resolve the chapter',
          kind: 'timing',
          summary: 'The bell must not end the pressure before the final beat lands.',
        },
      ],
      knowledgeBoundaries: [
        {
          id: 'boundary-bell-1',
          label: 'Final exit trigger',
          summary: 'The exact trigger for motion stays provisional until the chapter handoff is stable.',
          status: 'open-question',
        },
      ],
      executionGoal: 'Hold the final cue long enough for the chapter to keep its witness line.',
      tensionLabel: 'Edge',
      pacingLabel: 'Measured',
      beatId: 'beat-departure-bell',
      beatTitle: 'Bell placement review',
      beatSummary: 'The conductor measures when the bell becomes motion instead of pressure.',
      proposalId: 'proposal-departure-bell',
      proposalTitle: 'Tie the bell to the last visible concession',
      proposalSummary: 'Keep the bell attached to a visible choice so the chapter does not drift into abstract timing.',
      acceptedFactLabel: 'Bell timing still provisional',
      acceptedFactValue: 'The chapter still needs one safe bell cue before motion can begin.',
      acceptedFactTrace: {
        sourceProposals: [{ proposalId: 'proposal-departure-bell', sourceTraceId: 'trace-scene-departure-bell' }],
        relatedAssets: [
          { assetId: 'asset-station-conductor', title: 'Station Conductor', kind: 'character' },
          { assetId: 'asset-departure-gate', title: 'Departure gate', kind: 'location' },
        ],
      },
      proseStatusLabel: 'Waiting for first prose pass',
      dockEventTitle: 'Bell timing still under review',
      dockEventDetail: 'The departure cue can open in scene scope, but the final placement still needs chapter alignment.',
      problemTitle: 'Bell timing could still drain pressure too early',
      problemRecommendation: 'Tie the bell to the last visible concession instead of an empty timing slot.',
    }),
    'scene-warehouse-bridge': {
      workspace: {
        id: 'scene-warehouse-bridge',
        title: 'Warehouse Bridge',
        chapterId: 'chapter-open-water-signals',
        chapterTitle: 'Open Water Signals',
        status: 'draft',
        runStatus: 'running',
        objective: 'Keep the first handoff reversible so the betrayal line can stay deferred.',
        castIds: ['asset-ren-voss'],
        pendingProposalCount: 1,
        warningCount: 0,
        availableThreads: [{ id: 'thread-warehouse-01', label: 'Primary thread' }],
      },
      setup: {
        sceneId: 'scene-warehouse-bridge',
        identity: {
          title: 'Warehouse Bridge',
          chapterLabel: 'Open Water Signals',
          locationLabel: 'Warehouse bridge',
          povCharacterId: 'asset-ren-voss',
          timeboxLabel: 'Predawn handoff window',
          summary: 'The first waterfront handoff stays deliberately reversible.',
        },
        objective: {
          externalGoal: 'Move the package without fixing the betrayal line too early.',
          emotionalGoal: 'Hold hesitation and trust pressure together.',
          successSignal: 'The handoff remains provisional.',
          failureCost: 'Ownership becomes explicit before the story is ready.',
        },
        cast: [],
        constraints: [],
        knowledgeBoundaries: [],
        runtimePreset: {
          selectedPresetId: 'preset-quiet-handoff',
          presetOptions: [
            {
              id: 'preset-quiet-handoff',
              label: 'Quiet Handoff',
              focus: 'Low-key movement',
              intensity: 'Medium',
              summary: 'Bias toward quieter trust pressure.',
            },
          ],
        },
      },
      execution: {
        objective: {
          goal: 'Keep the first handoff reversible.',
          cast: [],
          warningsCount: 0,
          unresolvedCount: 1,
          constraintSummary: ['Ownership remains unresolved'],
        },
        beats: [],
        proposals: [],
        acceptedSummary: {
          sceneSummary: 'The handoff stays tentative.',
          acceptedFacts: [],
          readiness: 'draftable',
          pendingProposalCount: 1,
          warningCount: 0,
        },
        runtimeSummary: {
          runHealth: 'stable',
          latencyLabel: '0.8s median',
          tokenLabel: '1.9k tokens',
          costLabel: '$0.03',
        },
        canContinueRun: true,
        canOpenProse: true,
      },
      prose: {
        sceneId: 'scene-warehouse-bridge',
        revisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
        warningsCount: 0,
        focusModeAvailable: true,
      },
      inspector: {
        context: {
          acceptedFacts: [],
          privateInfoGuard: {
            summary: 'No additional private guards recorded.',
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
            label: 'Fixture scene runtime',
            summary: 'In-memory API-backed scene runtime scaffold.',
          },
          runHealth: 'stable',
          metrics: {
            latencyLabel: '0.8s median',
            tokenLabel: '1.9k tokens',
            costLabel: '$0.03',
          },
        },
      },
      dock: {
        events: [],
        trace: [],
        consistency: {
          summary: 'No consistency issues recorded.',
          checks: [],
        },
        problems: {
          summary: 'No blocking issues recorded.',
          items: [],
        },
        cost: {
          currentWindowLabel: 'Current pass: $0.03',
          trendLabel: 'Stable',
          breakdown: [],
        },
      },
      patchPreview: null,
    },
  }
}

export function createSignalArcProjectTemplate(input: {
  projectId: string
  projectTitle: string
  apiBaseUrl: string
  runtimeSummary?: string
  versionLabel?: string
  includeSeedRunReferences?: boolean
}): FixtureProjectData {
  const scenes = createSceneRecords()

  if (input.includeSeedRunReferences === false) {
    for (const scene of Object.values(scenes)) {
      const latestRunId = scene.workspace.latestRunId
      if (!latestRunId) {
        continue
      }

      delete scene.workspace.latestRunId
      if (scene.execution.runId === latestRunId) {
        delete scene.execution.runId
      }

      scene.dock.events = scene.dock.events.map((entry) => (
        entry.meta === latestRunId
          ? {
              ...entry,
              meta: 'Review queue',
            }
          : entry
      ))
    }
  }

  const versionLabel = input.versionLabel ?? 'local-project-store-v1'

  return {
    runtimeInfo: {
      projectId: input.projectId,
      projectTitle: input.projectTitle,
      runtimeKind: versionLabel.startsWith('local-project-store-') ? 'real-local-project' : 'fixture-demo',
      source: 'api',
      status: 'healthy',
      summary: input.runtimeSummary ?? 'Connected to local project store v1.',
      checkedAtLabel: '2026-04-23 10:00',
      apiBaseUrl: input.apiBaseUrl,
      versionLabel,
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: false,
        reviewDecisions: true,
        contextPacketRefs: true,
        proposalSetRefs: true,
      },
    },
    books: {
      'book-signal-arc': createBookStructure(),
    },
    manuscriptCheckpoints: {
      'book-signal-arc': createBookManuscriptCheckpoints(),
    },
    exportProfiles: {
      'book-signal-arc': createBookExportProfiles(),
    },
    exportArtifacts: {
      'book-signal-arc': createBookExportArtifacts(),
    },
    experimentBranches: {
      'book-signal-arc': createBookExperimentBranches(),
    },
    chapters: createChapterRecords(),
    assets: createAssetWorkspace(),
    reviewDecisions: createReviewDecisions(),
    reviewFixActions: createReviewFixActions(),
    scenes: clone(scenes),
  }
}

export function createFixtureDataSnapshot(apiBaseUrl: string): FixtureDataSnapshot {
  return {
    projects: {
      'book-signal-arc': createSignalArcProjectTemplate({
        projectId: 'book-signal-arc',
        projectTitle: 'Signal Arc',
        apiBaseUrl,
        runtimeSummary: 'Connected to fixture API runtime.',
        versionLabel: 'fixture-api-be-pr1',
      }),
      'project-artifact-a': createSignalArcProjectTemplate({
        projectId: 'project-artifact-a',
        projectTitle: 'Signal Arc',
        apiBaseUrl,
        runtimeSummary: 'Connected to fixture API runtime.',
        versionLabel: 'fixture-api-be-pr1',
      }),
      'project-artifact-b': createSignalArcProjectTemplate({
        projectId: 'project-artifact-b',
        projectTitle: 'Signal Arc',
        apiBaseUrl,
        runtimeSummary: 'Connected to fixture API runtime.',
        versionLabel: 'fixture-api-be-pr1',
      }),
    },
  }
}

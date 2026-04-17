import type { Locale } from '@/app/i18n'

type MutableDatabase = {
  locale?: Locale
  scenes: Record<string, any>
}

export function localizeSceneMockDatabase(locale: Locale, database: MutableDatabase): MutableDatabase {
  database.locale = locale
  if (locale !== 'zh-CN') {
    return database
  }

  const midnight = database.scenes['scene-midnight-platform']
  if (midnight) {
    midnight.workspace.title = '午夜站台'
    midnight.workspace.chapterTitle = '雨中信号'
    midnight.workspace.objective = '逼任在列车出发前为账本开价。'
    midnight.workspace.currentVersionLabel = '运行 07'
    midnight.workspace.availableThreads = [
      { id: 'thread-main', label: '主线' },
      { id: 'thread-branch-a', label: '备选节拍' },
    ]

    midnight.setup.identity = {
      ...midnight.setup.identity,
      title: '午夜站台',
      chapterLabel: '雨中信号 / 场景 4',
      locationLabel: '雨水浸透的东行月台',
      timeboxLabel: '03:11-03:18',
      summary: '一场暴露在众目睽睽之下的潮湿交易，每一次让步都必须经得起旁观者的检验。',
    }
    midnight.setup.objective = {
      externalGoal: '逼美伊在东行列车开走前交出账本。',
      emotionalGoal: '让任保持镇定，别暴露他对账本的急迫。',
      successSignal: '美伊让出筹码，但账本始终没有在台面上被翻开。',
      failureCost: '任失去账本，并在站务员面前暴露自己的化名。',
    }
    midnight.setup.cast = [
      { id: 'ren', name: '任·沃斯', role: '视角', agenda: '保持筹码，不露怯。', selected: true },
      { id: 'mei', name: '美伊·阿登', role: '对抗方', agenda: '开出会在之后反咬任的价码。', selected: true },
      { id: 'conductor', name: '站务员', role: '见证者', agenda: '看到足以在之后起作用的东西。', selected: true },
      { id: 'courier', name: '失踪信使', role: '场外压力', agenda: '只被暗示，不亲自登场。', selected: false },
    ]
    midnight.setup.constraints = [
      { id: 'constraint-1', label: '账本保持闭合', kind: 'canon', summary: '整场戏里没有人打开或阅读账本。' },
      { id: 'constraint-2', label: '化名不能公开', kind: 'tone', summary: '任不能在公开场合承认码头上的化名。' },
      { id: 'constraint-3', label: '铃声时点固定', kind: 'timing', summary: '发车铃只能落在离场节拍，不能提前。' },
    ]
    midnight.setup.knowledgeBoundaries = [
      { id: 'boundary-1', label: '账本内容', summary: '读者知道账本重要，但不知道里面具体写了什么。', status: 'guarded' },
      { id: 'boundary-2', label: '港口火灾真凶', summary: '可以暗示旧日愧疚，但不能揭开真正的肇事者。', status: 'open-question' },
      { id: 'boundary-3', label: '信使暗号含义', summary: '任能读懂这个信号，见证者却不能。', status: 'known' },
    ]
    midnight.setup.runtimePreset.presetOptions = [
      {
        id: 'runtime-measured-pressure',
        label: '克制施压',
        focus: '受控升级',
        intensity: '中',
        summary: '让场景保持克制推进，让每次采纳都经得起设定复核。',
      },
      {
        id: 'runtime-pressure-cooker',
        label: '高压锅',
        focus: '更紧的节拍转折',
        intensity: '高',
        summary: '压缩节拍，把更多压力推向发车铃这个约束点。',
      },
      {
        id: 'runtime-witness-heavy',
        label: '见证者优先',
        focus: '公开审视',
        intensity: '中',
        summary: '偏向可见动作，减少私密独白与内心解释。',
      },
    ]

    midnight.execution.objective = {
      ...midnight.execution.objective,
      goal: '逼美伊表态：账本究竟是诱饵，还是她手里的筹码。',
      tensionLabel: '升高',
      pacingLabel: '克制',
      cast: [
        { id: 'ren', name: '任·沃斯', role: '视角' },
        { id: 'mei', name: '美伊·阿登', role: '对抗方' },
        { id: 'conductor', name: '站务员', role: '见证者' },
      ],
      location: { id: 'glass-platform', name: '雨水浸透的东行月台' },
      constraintSummary: ['账本不能在台面上被翻开。', '任的化名不能被公开。', '离场节拍必须和发车铃重合。'],
    }
    midnight.execution.beats = [
      { id: 'beat-arrival', index: 1, title: '站灯下的抵达', status: 'accepted', proposalCount: 1, warningCount: 0, summary: '任拉近距离，并发现了隐藏的信使灯号。' },
      { id: 'beat-bargain', index: 2, title: '围绕账本的讨价还价', status: 'review', proposalCount: 2, warningCount: 1, summary: '美伊一边开价，一边试探任还能忍多久。' },
      { id: 'beat-departure', index: 3, title: '发车铃响', status: 'todo', proposalCount: 1, warningCount: 1, summary: '月台把所有压力压进最后一次选择。' },
    ]
    midnight.execution.proposals = [
      {
        id: 'proposal-1',
        beatId: 'beat-bargain',
        actor: { id: 'scene-manager', name: '场景管理器', type: 'scene-manager' },
        kind: 'conflict',
        title: '把交易逼进可见的僵局',
        summary: '任拒绝美伊的第一次开价，并把失踪信使变成自己的筹码。',
        detail: '这样既能保持账本闭合，也能在铃声响起前把权力转移推得更锋利。',
        status: 'pending',
        impactTags: ['筹码', '权力转移'],
        affects: [{ path: 'scene.summary.conflict', label: '冲突温度', deltaSummary: '从谈判升级为对峙。' }],
        risks: [{ severity: 'warn', message: '可能会挤压站务员的见证节拍。' }],
        evidencePeek: ['第二节拍已经埋下任的怀疑。', '保持了“账本不可开启”的规则。'],
        sourceTraceId: 'trace-41',
      },
      {
        id: 'proposal-2',
        beatId: 'beat-bargain',
        actor: { id: 'mei', name: '美伊·阿登', type: 'character' },
        kind: 'dialogue',
        title: '让美伊用私人代价开价',
        summary: '美伊要求任对港口火灾保持沉默，以此交换账本。',
        status: 'pending',
        impactTags: ['潜台词', '旧史'],
        affects: [{ path: 'scene.accepted-facts.harbor-fire', label: '港口火灾关联', deltaSummary: '把旧秘密拉进这场戏，但仍不揭开真凶。' }],
        risks: [{ severity: 'info', message: '需要避免把共同历史解释得过满。' }],
        evidencePeek: ['延续章节层面的愧疚线索。'],
        sourceTraceId: 'trace-42',
      },
      {
        id: 'proposal-3',
        beatId: 'beat-departure',
        actor: { id: 'system', name: '一致性监视', type: 'system' },
        kind: 'state-change',
        title: '把发车铃压到任作出选择之后',
        summary: '把铃声往后拖一个来回，好让决定落在一个明确动作上。',
        status: 'rewrite-requested',
        impactTags: ['时序', '连续性'],
        affects: [{ path: 'chapter.timeline.departure-bell', label: '发车时间点', deltaSummary: '把铃声推迟到当前章节大纲之外。' }],
        risks: [{ severity: 'high', message: '会和章节时序检查点冲突。' }],
        evidencePeek: ['章节大纲要求铃声紧跟在美伊最后一次出价之后。'],
        sourceTraceId: 'trace-43',
      },
    ]
    midnight.execution.acceptedSummary = {
      ...midnight.execution.acceptedSummary,
      sceneSummary: '已采纳的节拍确立了雨夜月台、任手里的筹码，以及仍缺一个设定安全转折的交易场面。',
      acceptedFacts: [
        { id: 'fact-1', label: '发现信使暗号', value: '任捕捉到了站灯的节奏变化。' },
        { id: 'fact-2', label: '账本保持闭合', value: '没有角色打开或阅读账本。' },
      ],
    }
    midnight.execution.runtimeSummary.latestFailureSummary = '离场节拍仍有一个连续性警告没有解除。'
    midnight.execution.runtimeSummary.tokenLabel = '8.2k 令牌'
    midnight.execution.consistencySummary.topIssues = ['发车铃时序不匹配', '额外对白可能会挤压见证者节拍']

    midnight.prose = {
      ...midnight.prose,
      proseDraft:
        '雨水轻轻敲打着玻璃顶棚，任站在原地，听美伊报出一个她本不该有资格提出的价格。账本横在两人之间，像一只闭着的眼睛，看着他们谁也不肯先眨眼。',
      latestDiffSummary: '尚未请求新的正文修订。',
      statusLabel: '可进入修订轮次',
    }

    midnight.inspector.context.acceptedFacts = [
      { id: 'fact-1', label: '发现信使暗号', value: '任捕捉到了站灯的节奏变化。' },
      { id: 'fact-2', label: '账本保持闭合', value: '没有角色打开或阅读账本。' },
    ]
    midnight.inspector.context.privateInfoGuard = {
      summary: '在评审决定哪些信息可以公开前，必须继续保护账本内容、任的化名和港口火灾真凶。',
      items: [
        { id: 'guard-ledger', label: '账本内容', summary: '读者和角色都知道账本重要，但没人看到里面写了什么。', status: 'guarded' },
        { id: 'guard-harbor-fire', label: '港口火灾真凶', summary: '场景可以持续施压这段历史，但不能揭开真正纵火者。', status: 'watching' },
      ],
    }
    midnight.inspector.context.actorKnowledgeBoundaries = [
      {
        actor: { id: 'ren', name: '任·沃斯', role: '视角' },
        boundaries: [
          { id: 'boundary-1', label: '账本内容', summary: '任知道账本是筹码，但不知道美伊是否改动过里面的内容。', status: 'guarded' },
          { id: 'boundary-2', label: '港口火灾真凶', summary: '任可以背着愧疚，但不能确认是谁造成了火灾。', status: 'open-question' },
          { id: 'boundary-3', label: '信使暗号含义', summary: '任能读懂站灯暗号，但不必把它说破。', status: 'known' },
        ],
      },
      {
        actor: { id: 'mei', name: '美伊·阿登', role: '对抗方' },
        boundaries: [
          { id: 'boundary-1-mei', label: '账本内容', summary: '美伊可以暗示账本的代价，但不能公开其中的文字。', status: 'guarded' },
          { id: 'boundary-2-mei', label: '港口火灾真凶', summary: '美伊可以把那段往事当武器，但真凶仍然未知。', status: 'open-question' },
          { id: 'boundary-3-mei', label: '信使暗号含义', summary: '美伊看见任对信号起反应，但不会在台面上解开图案。', status: 'guarded' },
        ],
      },
      {
        actor: { id: 'conductor', name: '站务员', role: '见证者' },
        boundaries: [
          { id: 'boundary-1-conductor', label: '账本内容', summary: '站务员看出账本很重要，但永远不知道里面写了什么。', status: 'guarded' },
          { id: 'boundary-2-conductor', label: '港口火灾真凶', summary: '站务员察觉火灾相关的紧张，但听不到任何指名道姓的结论。', status: 'open-question' },
          { id: 'boundary-3-conductor', label: '信使暗号含义', summary: '站务员看见灯光节奏，却读不懂它的意思。', status: 'guarded' },
        ],
      },
    ]
    midnight.inspector.context.localState = [
      { id: 'state-1', label: '当前节拍', value: '围绕账本的讨价还价' },
      { id: 'state-2', label: '已选运行预设', value: '克制施压' },
      { id: 'state-3', label: '已采纳补丁候选', value: '1 个语义候选' },
    ]
    midnight.inspector.context.overrides = [
      { id: 'override-1', label: '见证者权重', summary: '保持旁观者视野足够清晰，让采纳事实仍然偏向公开面。', status: 'active' },
      { id: 'override-2', label: '发车铃约束', summary: '在最终决定节拍之前，铃声不能提前。', status: 'watching' },
    ]
    midnight.inspector.versions.checkpoints = [
      { id: 'checkpoint-1', label: '运行 07 / 节拍 1 已采纳', summary: '抵达节拍已经通过，无需进一步修改。', status: 'accepted' },
      { id: 'checkpoint-2', label: '运行 07 / 节拍 2 审阅中', summary: '交易节拍仍挂着两个待审提案。', status: 'review' },
    ]
    midnight.inspector.versions.acceptanceTimeline = [
      { id: 'timeline-1', title: '抵达提示已采纳', detail: '信使暗号仍然设定安全，且只对任可见。', meta: '已采纳', tone: 'success' },
      { id: 'timeline-2', title: '发车时点被标记', detail: '有一个提议的铃声顺延和章节时序冲突。', meta: '关注', tone: 'warn' },
    ]
    midnight.inspector.versions.patchCandidates = [
      { id: 'patch-1', label: '可见僵局摘要', summary: '如果交易僵局被采纳进设定，这个语义补丁就可以提交。', status: 'ready_for_commit' },
      { id: 'patch-2', label: '发车铃延后', summary: '仍被时序审阅卡住，暂不可提交。', status: 'needs_review' },
    ]
    midnight.inspector.runtime.profile = {
      label: '克制施压',
      summary: '转折速度适中，连续性审查更严格，并保持见证者视角可读。',
    }
    midnight.inspector.runtime.metrics.tokenLabel = '8.2k 令牌'
    midnight.inspector.runtime.latestFailure = '发车铃时序警告仍然阻止这次运行干净收束。'

    midnight.dock.events = [
      { id: 'event-1', title: '交易节拍已暂停', detail: '执行评审目前卡在两个待审提案和一个重写请求上。', meta: '事件', tone: 'accent' },
      { id: 'event-2', title: '已采纳状态已更新但未提交', detail: '一个语义候选已可进入后续补丁流程，但提交仍然分离。', meta: '补丁', tone: 'warn' },
    ]
    midnight.dock.trace = [
      { id: 'trace-1', title: '追踪 41 / 筹码升级', detail: '冲突提案引用了已接受的怀疑伏笔和“账本不可开启”规则。', meta: '追踪', tone: 'neutral' },
      { id: 'trace-2', title: '追踪 43 / 时序碰撞', detail: '铃声延后候选与章节时间线检查点冲突。', meta: '追踪', tone: 'warn' },
    ]
    midnight.dock.consistency = {
      summary: '在正文被视为稳定之前，仍有两个评审检查点需要处理。',
      checks: [
        { id: 'consistency-1', label: '发车铃时序', status: 'blocked', detail: '当前重写请求仍把铃声推迟到了大纲设定之外。' },
        { id: 'consistency-2', label: '见证者可见性', status: 'warn', detail: '额外对白可能会遮蔽站务员真正注意到的内容。' },
        { id: 'consistency-3', label: '账本封存', status: 'pass', detail: '所有已采纳候选都保持了“账本闭合”的规则。' },
      ],
    }
    midnight.dock.problems = {
      summary: '问题会被压缩在这里，避免舞台被诊断信息淹没。',
      items: [
        { id: 'problem-1', title: '发车铃与章节大纲冲突', severity: 'high', recommendation: '保持铃声落在离场点，并把选择压进更紧的一次交换。' },
        { id: 'problem-2', title: '见证者节拍可能过满', severity: 'warn', recommendation: '删去一次解释性来回，让站务员作为观察者更清晰。' },
      ],
    }
    midnight.dock.cost = {
      currentWindowLabel: '运行 07 预计 $0.19',
      trendLabel: '相比上一条分支下降 8%，因为提案保持了结构化。',
      breakdown: [
        { id: 'cost-1', label: '输入令牌', value: '5.1k' },
        { id: 'cost-2', label: '输出令牌', value: '3.1k' },
        { id: 'cost-3', label: '连续性轮次', value: '2 次检查' },
      ],
    }
  }

  const warehouse = database.scenes['scene-warehouse-bridge']
  if (warehouse) {
    warehouse.workspace.title = '仓桥交接'
    warehouse.workspace.chapterTitle = '开阔水域信号'
    warehouse.workspace.objective = '把第一次交接摆出来，但不要提前落下最终背叛节拍。'
    warehouse.workspace.currentVersionLabel = '草稿'
    warehouse.workspace.availableThreads = [{ id: 'thread-main', label: '主线' }]

    warehouse.setup.identity = {
      ...warehouse.setup.identity,
      title: '仓桥交接',
      chapterLabel: '开阔水域信号 / 场景 2',
      locationLabel: '横跨仓库运河、带着咸味潮气的栈桥',
      timeboxLabel: '黎明值守',
      summary: '一场尚未完成的交接戏，仍在决定由谁掌握节奏。',
    }
    warehouse.setup.objective = {
      externalGoal: '让包裹通过栈桥，但不证明究竟是谁安排了这场交换。',
      emotionalGoal: '让塔拉继续戒备，而欧伦不断试探信任边界。',
      successSignal: '交接顺利落地，背叛节拍继续延后。',
      failureCost: '场景过早结算，烧掉后续章节的张力。',
    }
    warehouse.setup.cast = [
      { id: 'tala', name: '塔拉·索伦', role: '视角', agenda: '控制这场交换。', selected: true },
      { id: 'oren', name: '欧伦·维尔', role: '对抗方', agenda: '先衡量塔拉，再决定是否下注。', selected: true },
      { id: 'dockers', name: '码头工人', role: '环境压力', agenda: '只停留在背景里。', selected: false },
    ]
    warehouse.setup.constraints = [
      { id: 'constraint-draft-1', label: '暂不揭示背叛', kind: 'canon', summary: '这一场不能解决“谁是叛徒”这个问题。' },
    ]
    warehouse.setup.knowledgeBoundaries = [
      { id: 'boundary-draft-1', label: '包裹内容', summary: '包裹很重要，但在这版草稿中不会被打开。', status: 'guarded' },
    ]
    warehouse.setup.runtimePreset.presetOptions = midnight.setup.runtimePreset.presetOptions

    warehouse.execution.objective = {
      ...warehouse.execution.objective,
      goal: '场景仍处在设定阶段，执行流程尚未启动。',
      tensionLabel: '休眠',
      pacingLabel: '按住',
      cast: [
        { id: 'tala', name: '塔拉·索伦', role: '视角' },
        { id: 'oren', name: '欧伦·维尔', role: '对抗方' },
      ],
      location: { id: 'bridge-catwalk', name: '仓库栈桥' },
      constraintSummary: ['暂不揭示背叛。'],
    }
    warehouse.execution.beats = [
      { id: 'beat-draft-1', index: 1, title: '交接尚未开始', status: 'todo', proposalCount: 0, warningCount: 0, summary: '设定阶段仍在等待第一次执行轮。' },
    ]
    warehouse.execution.acceptedSummary.sceneSummary = '还没有已采纳的执行状态；下一步仍由设定阶段决定。'
    warehouse.execution.runtimeSummary.latencyLabel = '尚未启动'
    warehouse.execution.runtimeSummary.tokenLabel = '0 令牌'
    warehouse.execution.runtimeSummary.costLabel = '$0.00'
    warehouse.prose.latestDiffSummary = '还没有正文草稿。'
    warehouse.prose.statusLabel = '仅有设定草稿'
    warehouse.inspector.context.privateInfoGuard = {
      summary: '在执行流程决定哪些内容会公开之前，必须继续保护包裹内容。',
      items: [{ id: 'guard-package', label: '包裹内容', summary: '设定阶段可以建立重要性，但不能打开或解释包裹。', status: 'guarded' }],
    }
    warehouse.inspector.context.actorKnowledgeBoundaries = [
      {
        actor: { id: 'tala', name: '塔拉·索伦', role: '视角' },
        boundaries: [{ id: 'boundary-draft-1-tala', label: '包裹内容', summary: '塔拉知道包裹很重要，但这场戏不该揭示里面有什么。', status: 'guarded' }],
      },
      {
        actor: { id: 'oren', name: '欧伦·维尔', role: '对抗方' },
        boundaries: [{ id: 'boundary-draft-1-oren', label: '包裹内容', summary: '欧伦可以试探塔拉的底线，但不能证明包裹里是什么。', status: 'guarded' }],
      },
    ]
    warehouse.inspector.context.localState = [{ id: 'draft-state-1', label: '执行状态', value: '尚未启动' }]
    warehouse.inspector.runtime.profile = { label: '克制施压', summary: '预设已经选好，但运行流程还没有开始。' }
    warehouse.inspector.runtime.metrics = { latencyLabel: '尚未启动', tokenLabel: '0 令牌', costLabel: '$0.00' }
    warehouse.dock.consistency.summary = '还没有运行检查。'
    warehouse.dock.problems.summary = '还没有记录到问题。'
    warehouse.dock.cost.currentWindowLabel = '预计 $0.00'
    warehouse.dock.cost.trendLabel = '执行尚未开始。'
  }

  const lightweightSceneLocalizations: Record<
    string,
    {
      title: string
      chapterTitle: string
      objective: string
      availableThreadLabel: string
      currentVersionLabel?: string
      chapterLabel: string
      locationLabel: string
      setupSummary: string
      setupExternalGoal: string
      setupEmotionalGoal: string
      setupSuccessSignal: string
      setupFailureCost: string
      cast: Array<{ name: string; role: string; agenda: string }>
      constraintLabel: string
      constraintSummary: string
      knowledgeBoundaryLabel: string
      knowledgeBoundarySummary: string
      acceptedSummary: string
      acceptedFactLabel: string
      acceptedFactValue: string
      privateInfoGuardSummary: string
      privateInfoGuardLabel: string
      privateInfoGuardItemSummary: string
      localStateActiveBeatLabel: string
      localStateActiveBeatValue: string
      localStateRuntimePresetLabel: string
      localStateRuntimePresetValue: string
      localStatePatchCandidatesLabel: string
      localStatePatchCandidatesValue: string
      overrideLabel: string
      overrideSummary: string
      checkpointLabel: string
      checkpointSummary: string
      executionGoal: string
      executionTensionLabel: string
      executionPacingLabel: string
      beatTitle: string
      beatSummary: string
      proposalActorName: string
      proposalTitle: string
      proposalSummary: string
      proposalImpactTag: string
      proposalAffectLabel: string
      proposalAffectSummary: string
      proposalRiskMessage: string
      runtimeProfileSummary: string
      runtimeProfileLabel: string
      runtimeLatencyLabel: string
      runtimeTokenLabel: string
      runtimeCostLabel: string
      proseStatusLabel: string
      proseDraft: string
      proseLatestDiffSummary: string
      traceTitle: string
      traceDetail: string
      dockEventTitle: string
      dockEventDetail: string
      problemTitle: string
      problemRecommendation: string
      consistencySummary: string
      costCurrentWindowLabel: string
      costTrendLabel: string
      costBreakdownLabel: string
      costBreakdownValue: string
    }
  > = {
    'scene-concourse-delay': {
      title: '候车厅延误',
      chapterTitle: '雨中信号',
      objective: '让拥堵再拖住离场一拍，把站台压力继续留在场上。',
      availableThreadLabel: '主线',
      chapterLabel: '雨中信号 / 场景 5',
      locationLabel: '拥挤的候车大厅',
      setupSummary: '一场被人潮卡住的过渡戏，负责延后离场，而不是揭晓谁掌控信使线。',
      setupExternalGoal: '拖住离场节奏，但不要丢掉信使线上的筹码。',
      setupEmotionalGoal: '让美伊继续掌握场面，但不要让她露出慌乱。',
      setupSuccessSignal: '人潮真的拖慢了动作，而目击压力仍然留在场上。',
      setupFailureCost: '如果这一场放人过去，章节压力就会在落点之前先泄掉。',
      cast: [
        { name: '美伊·阿登', role: '视角', agenda: '把任和闸口之间的人潮维持成一道真正的阻力。' },
        { name: '任·沃斯', role: '对抗方', agenda: '在人潮彻底压实之前想办法挤出一条路。' },
        { name: '站务引导员', role: '环境压力', agenda: '只负责维持秩序，不给任何人答案。' },
      ],
      constraintLabel: '不要坐实信使线归属',
      constraintSummary: '这里不能证明到底是谁真正掌控信使线。',
      knowledgeBoundaryLabel: '信使线归属',
      knowledgeBoundarySummary: '这场人潮延误还不能确认谁才是信使线背后真正的发令者。',
      acceptedSummary: '已采纳状态会继续保留人潮延误，同时把下一次交接留在可评审状态。',
      acceptedFactLabel: '人潮延误已成立',
      acceptedFactValue: '候车厅的阻塞拖慢了动作，但没有解决信使线究竟属于谁。',
      privateInfoGuardSummary: '场景仍在评审中时，需要继续保护“谁掌控信使线”这个揭示点。',
      privateInfoGuardLabel: '谁掌控信使线',
      privateInfoGuardItemSummary: '这场人潮延误还不能确认究竟是谁真正掌控信使通道。',
      localStateActiveBeatLabel: '当前节拍',
      localStateActiveBeatValue: '人潮阻塞',
      localStateRuntimePresetLabel: '已选运行预设',
      localStateRuntimePresetValue: '克制施压',
      localStatePatchCandidatesLabel: '已采纳补丁候选',
      localStatePatchCandidatesValue: '0 个语义候选',
      overrideLabel: '章节交接',
      overrideSummary: '在把章节交给下一场之前，先让目击压力继续留在可见层。',
      checkpointLabel: '脚手架检查点',
      checkpointSummary: '候车厅延误的轻量场景夹具已经具备完整的 scene scope 视图。',
      executionGoal: '把拥堵变成可见阻力，而不是把章节压力私有化。',
      executionTensionLabel: '按住',
      executionPacingLabel: '拥堵',
      beatTitle: '人潮阻塞',
      beatSummary: '人群把离场压慢，而美伊还得让目击压力继续停留在公开层。',
      proposalActorName: '场景管理器',
      proposalTitle: '让阻塞从人潮两侧都可见',
      proposalSummary: '让拥堵同时拖住双方动作，把站台上的目击压力一路带进室内。',
      proposalImpactTag: '交接',
      proposalAffectLabel: '已采纳压力',
      proposalAffectSummary: '让拥堵同时拖住双方动作，把站台上的目击压力一路带进室内。',
      proposalRiskMessage: '人潮压力还缺一个更干净的离场承接',
      runtimeProfileSummary: '保持场景夹具轻量可测，同时让候车厅延误在中文场景视图里不出现混语。',
      runtimeProfileLabel: '克制施压',
      runtimeLatencyLabel: '等待运行',
      runtimeTokenLabel: '0 令牌',
      runtimeCostLabel: '$0.00',
      proseStatusLabel: '可进入正文交接',
      proseDraft: '候车厅里的人潮不是向前流，而是横着挤压过去，逼得每一道视线都得先穿过陌生人的肩膀，才能碰到闸口。',
      proseLatestDiffSummary: '尚未请求新的正文修订。',
      traceTitle: '追踪 / 候车厅延误',
      traceDetail: '让人潮阻塞继续拖住离场，同时把站台上的目击压力带进室内。',
      dockEventTitle: '候车厅延误已保留',
      dockEventDetail: '这个场景已经能在 scene scope 中打开，同时继续保留人潮压力。',
      problemTitle: '人潮压力还缺一个更干净的离场承接',
      problemRecommendation: '在把章节交给下一场之前，先让目击压力继续留在可见层。',
      consistencySummary: '候车厅延误还有一个连续性检查点需要处理。',
      costCurrentWindowLabel: '预计 $0.00',
      costTrendLabel: '轻量场景对齐夹具。',
      costBreakdownLabel: '夹具状态',
      costBreakdownValue: '场景对齐脚手架',
    },
    'scene-ticket-window': {
      title: '售票窗',
      chapterTitle: '雨中信号',
      objective: '把速度和确定性交换压在同一拍里，但别让化名露面。',
      availableThreadLabel: '主线',
      currentVersionLabel: '运行 03',
      chapterLabel: '雨中信号 / 场景 6',
      locationLabel: '车站售票窗',
      setupSummary: '一场狭窄的交易戏，速度只有在化名仍留在场外时才有价值。',
      setupExternalGoal: '在闸口彻底卡死之前，先拿到下一步的行动空间。',
      setupEmotionalGoal: '让任继续绷住自己，不把化名作为交换的一部分说出口。',
      setupSuccessSignal: '交换条件被压紧了，但化名仍然没有进入公开层。',
      setupFailureCost: '如果化名提前露面，后续交接的压力会直接失去价值。',
      cast: [
        { name: '任·沃斯', role: '视角', agenda: '拿到速度，但绝不把化名摆到台面上。' },
        { name: '美伊·阿登', role: '对抗方', agenda: '逼任先给出承诺，再谈是否放行。' },
        { name: '售票员', role: '见证者', agenda: '只看见紧迫感，不知道真正的身份。' },
      ],
      constraintLabel: '化名留在场外',
      constraintSummary: '售票窗这一场里不能出现公开化名揭示。',
      knowledgeBoundaryLabel: '化名暴露',
      knowledgeBoundarySummary: '售票员和旁观者都还不能知道这个化名究竟指向谁。',
      acceptedSummary: '已采纳状态会继续保留化名仍在场外，同时把下一次交接留在可评审状态。',
      acceptedFactLabel: '化名仍在场外',
      acceptedFactValue: '售票窗这次交换仍然把化名挡在公开认知之外。',
      privateInfoGuardSummary: '场景仍在评审中时，需要继续保护“化名暴露”这个揭示点。',
      privateInfoGuardLabel: '化名暴露',
      privateInfoGuardItemSummary: '售票员和围观者都还不能知道这个化名究竟属于谁。',
      localStateActiveBeatLabel: '当前节拍',
      localStateActiveBeatValue: '窗口交易',
      localStateRuntimePresetLabel: '已选运行预设',
      localStateRuntimePresetValue: '克制施压',
      localStatePatchCandidatesLabel: '已采纳补丁候选',
      localStatePatchCandidatesValue: '0 个语义候选',
      overrideLabel: '章节交接',
      overrideSummary: '让售票员只注意紧迫感，不要让化名进入公开视野。',
      checkpointLabel: '运行 03',
      checkpointSummary: '售票窗的轻量场景夹具已经具备完整的 scene scope 视图。',
      executionGoal: '把紧迫感压成可见交换，而不是解释性台词。',
      executionTensionLabel: '绷紧',
      executionPacingLabel: '克制',
      beatTitle: '窗口交易',
      beatSummary: '任伸手去够速度，而美伊逼他把代价也一起摆上台面。',
      proposalActorName: '场景管理器',
      proposalTitle: '把交换条件压进一次可见往返',
      proposalSummary: '让售票员看见紧迫感，但不要让他知道化名才是这份紧迫感真正的来源。',
      proposalImpactTag: '交接',
      proposalAffectLabel: '已采纳压力',
      proposalAffectSummary: '让售票员看见紧迫感，但不要让他知道化名才是这份紧迫感真正的来源。',
      proposalRiskMessage: '化名压力还需要更紧的公开遮蔽',
      runtimeProfileSummary: '保持场景夹具轻量可测，同时让售票窗在中文场景视图里不出现混语。',
      runtimeProfileLabel: '克制施压',
      runtimeLatencyLabel: '1.2 秒平均步进',
      runtimeTokenLabel: '2.4k 令牌',
      runtimeCostLabel: '预计 $0.06',
      proseStatusLabel: '可进入正文轮次',
      proseDraft: '售票员把票推出来一半，那个小动作却像一个问题，逼美伊在任的手指碰到票边之前先听见答案。',
      proseLatestDiffSummary: '尚未请求新的正文修订。',
      traceTitle: '追踪 / 售票窗',
      traceDetail: '让售票员看见紧迫感，但不要让他知道化名才是这份紧迫感真正的来源。',
      dockEventTitle: '售票窗交换已保留',
      dockEventDetail: '这个场景已经能在 scene scope 中打开，同时继续保护化名不公开。',
      problemTitle: '化名压力还需要更紧的公开遮蔽',
      problemRecommendation: '让售票员只注意紧迫感，不要让化名进入公开视野。',
      consistencySummary: '售票窗还有一个连续性检查点需要处理。',
      costCurrentWindowLabel: '预计运行 03 约 $0.06',
      costTrendLabel: '轻量场景对齐夹具。',
      costBreakdownLabel: '夹具状态',
      costBreakdownValue: '场景对齐脚手架',
    },
    'scene-departure-bell': {
      title: '发车钟',
      chapterTitle: '雨中信号',
      objective: '先找到钟声落点，再决定章节压力何时开始转成行动。',
      availableThreadLabel: '主线',
      chapterLabel: '雨中信号 / 场景 7',
      locationLabel: '离场门',
      setupSummary: '一场终局时点戏，仍在测试行动从哪里开始、审视从哪里结束。',
      setupExternalGoal: '找到一个既不提前抽空压力、又能真正启动行动的钟声落点。',
      setupEmotionalGoal: '让站务员看见压力已经抵达临界点，却仍旧说不出答案。',
      setupSuccessSignal: '钟声落下时，目击压力依然成立，而不是被提前掏空。',
      setupFailureCost: '只要钟声太早响起，章节最后的对峙就会先一步塌掉。',
      cast: [
        { name: '站务员', role: '视角', agenda: '让站台继续按时运转。' },
        { name: '任·沃斯', role: '压力点', agenda: '在钟声把他变成公开事实之前离开。' },
        { name: '美伊·阿登', role: '对抗方', agenda: '让钟声最终落在自己能够利用的位置。' },
      ],
      constraintLabel: '钟声不能提前替章节收尾',
      constraintSummary: '钟声不能在最后一个节拍落地前就把压力提前收掉。',
      knowledgeBoundaryLabel: '最终离场触发点',
      knowledgeBoundarySummary: '这场还不能说死究竟是哪个动作最终触发了离场。',
      acceptedSummary: '已采纳状态会继续保留钟声时点仍待定，同时把下一次交接留在可评审状态。',
      acceptedFactLabel: '钟声时点仍待定',
      acceptedFactValue: '章节仍然需要一个安全的钟声落点，才能真正开始行动。',
      privateInfoGuardSummary: '场景仍在评审中时，需要继续保护“最终离场触发点”这个揭示点。',
      privateInfoGuardLabel: '最终离场触发点',
      privateInfoGuardItemSummary: '钟声究竟因为什么动作而落下，还不能在这场里被说死。',
      localStateActiveBeatLabel: '当前节拍',
      localStateActiveBeatValue: '钟声落点评审',
      localStateRuntimePresetLabel: '已选运行预设',
      localStateRuntimePresetValue: '克制施压',
      localStatePatchCandidatesLabel: '已采纳补丁候选',
      localStatePatchCandidatesValue: '0 个语义候选',
      overrideLabel: '章节交接',
      overrideSummary: '把钟声绑到最后一次可见让步上，而不是空白时序点。',
      checkpointLabel: '脚手架检查点',
      checkpointSummary: '发车钟的轻量场景夹具已经具备完整的 scene scope 视图。',
      executionGoal: '把最后的钟点按住，直到章节的目击线真正落地。',
      executionTensionLabel: '压边',
      executionPacingLabel: '克制',
      beatTitle: '钟声落点评审',
      beatSummary: '站务员在衡量：钟声究竟会变成行动，还是只会继续压缩眼前的压力。',
      proposalActorName: '场景管理器',
      proposalTitle: '把钟声绑在最后一次可见让步上',
      proposalSummary: '把钟声绑在一个可见选择上，避免章节滑进只剩时序说明的空档。',
      proposalImpactTag: '交接',
      proposalAffectLabel: '已采纳压力',
      proposalAffectSummary: '把钟声绑在一个可见选择上，避免章节滑进只剩时序说明的空档。',
      proposalRiskMessage: '钟声落点仍可能过早抽空压力',
      runtimeProfileSummary: '保持场景夹具轻量可测，同时让发车钟在中文场景视图里不出现混语。',
      runtimeProfileLabel: '克制施压',
      runtimeLatencyLabel: '等待运行',
      runtimeTokenLabel: '0 令牌',
      runtimeCostLabel: '$0.00',
      proseStatusLabel: '等待第一轮正文',
      proseDraft: '钟绳垂在站务员手边，像一项还没被脚下这些人真正挣来的判决。',
      proseLatestDiffSummary: '尚未请求新的正文修订。',
      traceTitle: '追踪 / 发车钟',
      traceDetail: '把钟声绑在一个可见选择上，避免章节滑进只剩时序说明的空档。',
      dockEventTitle: '钟声时点仍在评审',
      dockEventDetail: '这个离场提示已经能在 scene scope 中打开，但最终落点仍需要和 chapter 对齐。',
      problemTitle: '钟声落点仍可能过早抽空压力',
      problemRecommendation: '把钟声绑到最后一次可见让步上，而不是空白时序点。',
      consistencySummary: '发车钟还有一个连续性检查点需要处理。',
      costCurrentWindowLabel: '预计 $0.00',
      costTrendLabel: '轻量场景对齐夹具。',
      costBreakdownLabel: '夹具状态',
      costBreakdownValue: '场景对齐脚手架',
    },
    'scene-canal-watch': {
      title: '运河哨位',
      chapterTitle: '开阔水域信号',
      objective: '继续收紧信任压力，但别提前坐实包裹归属。',
      availableThreadLabel: '主线',
      chapterLabel: '开阔水域信号 / 场景 3',
      locationLabel: '运河哨位',
      setupSummary: '一场哨位戏，把仓桥上的迟疑继续往前带，而不是另起一条揭示线。',
      setupExternalGoal: '把仓桥上的迟疑继续带进运河，但不要另起一条新揭示线。',
      setupEmotionalGoal: '让每个人都被信任问题继续勒住，但谁也不能先说出归属。',
      setupSuccessSignal: '运河哨位继续收紧信任，而包裹归属仍保持未决。',
      setupFailureCost: '一旦提前坐实归属，后面的交接就会失去剩余张力。',
      cast: [
        { name: '莱娅·马尔', role: '视角', agenda: '看清哨位，却不点破接货人的名字。' },
        { name: '梅雷克·戴恩', role: '对抗方', agenda: '在线路真正打开之前先把信任逼到极限。' },
        { name: '运河哨兵', role: '见证者', agenda: '只记住动作，不记住归属。' },
      ],
      constraintLabel: '包裹归属保持未决',
      constraintSummary: '任何节拍都不能证明包裹到底属于谁。',
      knowledgeBoundaryLabel: '真正接收方',
      knowledgeBoundarySummary: '这场哨位戏会继续施压，但还不能确认谁才是最终接货的人。',
      acceptedSummary: '已采纳状态会继续保留真正接收方仍未暴露，同时把下一次交接留在可评审状态。',
      acceptedFactLabel: '真正接收方仍未暴露',
      acceptedFactValue: '运河哨位继续把真正的接收方藏在场外。',
      privateInfoGuardSummary: '场景仍在评审中时，需要继续保护“真正接收方”这个揭示点。',
      privateInfoGuardLabel: '真正接收方',
      privateInfoGuardItemSummary: '这场哨位戏会继续施压，但还不能确认谁才是最终接货的人。',
      localStateActiveBeatLabel: '当前节拍',
      localStateActiveBeatValue: '哨位盘查',
      localStateRuntimePresetLabel: '已选运行预设',
      localStateRuntimePresetValue: '克制施压',
      localStatePatchCandidatesLabel: '已采纳补丁候选',
      localStatePatchCandidatesValue: '0 个语义候选',
      overrideLabel: '章节交接',
      overrideSummary: '把仓桥迟疑直接传到哨位里，不要另起新的悬念。',
      checkpointLabel: '脚手架检查点',
      checkpointSummary: '运河哨位的轻量场景夹具已经具备完整的 scene scope 视图。',
      executionGoal: '把谨慎转成信任压力，而不是让谜底提前坍塌。',
      executionTensionLabel: '悬住',
      executionPacingLabel: '警戒',
      beatTitle: '哨位盘查',
      beatSummary: '运河哨位让信任继续收紧，但包裹归属仍然不能被说破。',
      proposalActorName: '场景管理器',
      proposalTitle: '让哨位继续压紧信任线',
      proposalSummary: '把仓桥上的迟疑直接带进运河哨位，而不是为它另开一条悬念线。',
      proposalImpactTag: '交接',
      proposalAffectLabel: '已采纳压力',
      proposalAffectSummary: '把仓桥上的迟疑直接带进运河哨位，而不是为它另开一条悬念线。',
      proposalRiskMessage: '信任压力还需要更强的承压延续',
      runtimeProfileSummary: '保持场景夹具轻量可测，同时让运河哨位在中文场景视图里不出现混语。',
      runtimeProfileLabel: '克制施压',
      runtimeLatencyLabel: '等待运行',
      runtimeTokenLabel: '0 令牌',
      runtimeCostLabel: '$0.00',
      proseStatusLabel: '可进入正文交接',
      proseDraft: '运河静得近乎坦白，可也正因为这样，栏杆边没有一个人愿意轻易相信它。',
      proseLatestDiffSummary: '尚未请求新的正文修订。',
      traceTitle: '追踪 / 运河哨位',
      traceDetail: '把仓桥上的迟疑直接带进运河哨位，而不是为它另开一条悬念线。',
      dockEventTitle: '运河哨位已保留',
      dockEventDetail: '这个场景已经能在 scene scope 中打开，同时继续保护包裹归属不被坐实。',
      problemTitle: '信任压力还需要更强的承压延续',
      problemRecommendation: '把仓桥迟疑直接传到哨位里，不要另起新的悬念。',
      consistencySummary: '运河哨位还有一个连续性检查点需要处理。',
      costCurrentWindowLabel: '预计 $0.00',
      costTrendLabel: '轻量场景对齐夹具。',
      costBreakdownLabel: '夹具状态',
      costBreakdownValue: '场景对齐脚手架',
    },
    'scene-dawn-slip': {
      title: '黎明滑道',
      chapterTitle: '开阔水域信号',
      objective: '补齐从怀疑到行动的桥，不要让离场像跳切一样发生。',
      availableThreadLabel: '主线',
      chapterLabel: '开阔水域信号 / 场景 4',
      locationLabel: '滑道出口',
      setupSummary: '一场离场戏，仍在寻找“怀疑”如何平顺地转成“行动”。',
      setupExternalGoal: '把章节从迟疑平顺地交给行动，不要让离场像跳切一样发生。',
      setupEmotionalGoal: '让最后一点怀疑继续可见，直到动作真正开始。',
      setupSuccessSignal: '离场开始移动时，前面的迟疑仍然像代价一样留在场上。',
      setupFailureCost: '只要动作跑在承接前面，前面累积的怀疑就会白白丢掉。',
      cast: [
        { name: '滑道监视者', role: '视角', agenda: '在动作消失进离场之前，看清它是怎么转过去的。' },
        { name: '莱娅·马尔', role: '压力点', agenda: '只有在线路真正稳住之后才肯动。' },
        { name: '梅雷克·戴恩', role: '对抗方', agenda: '在确定来临之前先把转身逼出来。' },
      ],
      constraintLabel: '不要跳过承接',
      constraintSummary: '离场路径仍然需要一个可见的“怀疑转行动”承接点。',
      knowledgeBoundaryLabel: '离场触发点',
      knowledgeBoundarySummary: '离场究竟由哪个动作触发，目前还不能在这场里被钉死。',
      acceptedSummary: '已采纳状态会继续保留离场承桥仍然缺位，同时把下一次交接留在可评审状态。',
      acceptedFactLabel: '离场承桥仍然缺位',
      acceptedFactValue: '滑道离场之前还缺一次可信的承接动作。',
      privateInfoGuardSummary: '场景仍在评审中时，需要继续保护“离场触发点”这个揭示点。',
      privateInfoGuardLabel: '离场触发点',
      privateInfoGuardItemSummary: '离场究竟由哪个动作触发，目前还不能在这场里被钉死。',
      localStateActiveBeatLabel: '当前节拍',
      localStateActiveBeatValue: '滑道放行',
      localStateRuntimePresetLabel: '已选运行预设',
      localStateRuntimePresetValue: '克制施压',
      localStatePatchCandidatesLabel: '已采纳补丁候选',
      localStatePatchCandidatesValue: '0 个语义候选',
      overrideLabel: '章节交接',
      overrideSummary: '用一个可见交接来启动动作，别让怀疑线被甩掉。',
      checkpointLabel: '脚手架检查点',
      checkpointSummary: '黎明滑道的轻量场景夹具已经具备完整的 scene scope 视图。',
      executionGoal: '让最后的滑道动作读起来像结果，而不是突然跳过去。',
      executionTensionLabel: '不稳',
      executionPacingLabel: '抬升',
      beatTitle: '滑道放行',
      beatSummary: '出口终于开始挪动，但最后一点迟疑还挂在栏杆边，没有真正松开。',
      proposalActorName: '场景管理器',
      proposalTitle: '用一次可见交接把怀疑推进行动',
      proposalSummary: '用一个可见交接来启动离场动作，好让前面的怀疑线真正落地。',
      proposalImpactTag: '交接',
      proposalAffectLabel: '已采纳压力',
      proposalAffectSummary: '用一个可见交接来启动离场动作，好让前面的怀疑线真正落地。',
      proposalRiskMessage: '离场动作仍然跑在承接前面',
      runtimeProfileSummary: '保持场景夹具轻量可测，同时让黎明滑道在中文场景视图里不出现混语。',
      runtimeProfileLabel: '克制施压',
      runtimeLatencyLabel: '等待运行',
      runtimeTokenLabel: '0 令牌',
      runtimeCostLabel: '$0.00',
      proseStatusLabel: '等待第一轮正文',
      proseDraft: '黎明把滑道边的黑暗削薄了一层，却没有缩短怀疑和行动之间那段真正难走的距离。',
      proseLatestDiffSummary: '尚未请求新的正文修订。',
      traceTitle: '追踪 / 黎明滑道',
      traceDetail: '用一个可见交接来启动离场动作，好让前面的怀疑线真正落地。',
      dockEventTitle: '滑道承接仍属暂定',
      dockEventDetail: '这个黎明离场已经能在 scene scope 中打开，但进入行动前的承接还在评审。',
      problemTitle: '离场动作仍然跑在承接前面',
      problemRecommendation: '用一个可见交接来启动动作，别让怀疑线被甩掉。',
      consistencySummary: '黎明滑道还有一个连续性检查点需要处理。',
      costCurrentWindowLabel: '预计 $0.00',
      costTrendLabel: '轻量场景对齐夹具。',
      costBreakdownLabel: '夹具状态',
      costBreakdownValue: '场景对齐脚手架',
    },
  }

  for (const [sceneId, localized] of Object.entries(lightweightSceneLocalizations)) {
    const scene = database.scenes[sceneId]
    if (!scene) {
      continue
    }

    scene.workspace.title = localized.title
    scene.workspace.chapterTitle = localized.chapterTitle
    scene.workspace.objective = localized.objective
    scene.workspace.availableThreads = scene.workspace.availableThreads.map((thread) => ({ ...thread, label: localized.availableThreadLabel }))
    if (localized.currentVersionLabel !== undefined) {
      scene.workspace.currentVersionLabel = localized.currentVersionLabel
    }
    scene.setup.identity.title = localized.title
    scene.setup.identity.chapterLabel = localized.chapterLabel
    scene.setup.identity.locationLabel = localized.locationLabel
    scene.setup.identity.summary = localized.setupSummary
    scene.setup.objective.externalGoal = localized.setupExternalGoal
    scene.setup.objective.emotionalGoal = localized.setupEmotionalGoal
    scene.setup.objective.successSignal = localized.setupSuccessSignal
    scene.setup.objective.failureCost = localized.setupFailureCost
    scene.setup.cast = scene.setup.cast.map((member, index) => ({
      ...member,
      name: localized.cast[index]?.name ?? member.name,
      role: localized.cast[index]?.role ?? member.role,
      agenda: localized.cast[index]?.agenda ?? member.agenda,
    }))
    if (scene.setup.constraints[0]) {
      scene.setup.constraints[0].label = localized.constraintLabel
      scene.setup.constraints[0].summary = localized.constraintSummary
    }
    if (scene.setup.knowledgeBoundaries[0]) {
      scene.setup.knowledgeBoundaries[0].label = localized.knowledgeBoundaryLabel
      scene.setup.knowledgeBoundaries[0].summary = localized.knowledgeBoundarySummary
    }
    scene.setup.runtimePreset.presetOptions = midnight.setup.runtimePreset.presetOptions
    scene.execution.acceptedSummary.sceneSummary = localized.acceptedSummary
    if (scene.execution.acceptedSummary.acceptedFacts[0]) {
      scene.execution.acceptedSummary.acceptedFacts[0].label = localized.acceptedFactLabel
      scene.execution.acceptedSummary.acceptedFacts[0].value = localized.acceptedFactValue
    }
    scene.execution.objective.goal = localized.executionGoal
    scene.execution.objective.tensionLabel = localized.executionTensionLabel
    scene.execution.objective.pacingLabel = localized.executionPacingLabel
    if (scene.execution.objective.location) {
      scene.execution.objective.location.name = localized.locationLabel
    }
    scene.execution.objective.cast = scene.execution.objective.cast.map((member, index) => ({
      ...member,
      name: localized.cast[index]?.name ?? member.name,
      role: localized.cast[index]?.role ?? member.role,
    }))
    scene.execution.objective.constraintSummary = [localized.constraintSummary]
    if (scene.execution.beats[0]) {
      scene.execution.beats[0].title = localized.beatTitle
      scene.execution.beats[0].summary = localized.beatSummary
    }
    if (scene.execution.proposals[0]) {
      scene.execution.proposals[0].actor.name = localized.proposalActorName
      scene.execution.proposals[0].title = localized.proposalTitle
      scene.execution.proposals[0].summary = localized.proposalSummary
      scene.execution.proposals[0].impactTags = [localized.proposalImpactTag, '连续性']
      if (scene.execution.proposals[0].affects[0]) {
        scene.execution.proposals[0].affects[0].label = localized.proposalAffectLabel
        scene.execution.proposals[0].affects[0].deltaSummary = localized.proposalAffectSummary
      }
      if (scene.execution.proposals[0].risks?.[0]) {
        scene.execution.proposals[0].risks[0].message = localized.proposalRiskMessage
      }
      scene.execution.proposals[0].evidencePeek = [localized.acceptedFactValue]
    }
    scene.execution.runtimeSummary.latencyLabel = localized.runtimeLatencyLabel
    scene.execution.runtimeSummary.tokenLabel = localized.runtimeTokenLabel
    scene.execution.runtimeSummary.costLabel = localized.runtimeCostLabel
    scene.inspector.context.privateInfoGuard.summary = localized.privateInfoGuardSummary
    if (scene.inspector.context.privateInfoGuard.items[0]) {
      scene.inspector.context.privateInfoGuard.items[0].label = localized.privateInfoGuardLabel
      scene.inspector.context.privateInfoGuard.items[0].summary = localized.privateInfoGuardItemSummary
    }
    scene.inspector.context.actorKnowledgeBoundaries = scene.inspector.context.actorKnowledgeBoundaries.map((entry, index) => ({
      ...entry,
      actor: {
        ...entry.actor,
        name: localized.cast[index]?.name ?? entry.actor.name,
        role: localized.cast[index]?.role ?? entry.actor.role,
      },
      boundaries: entry.boundaries.map((boundary, boundaryIndex) =>
        boundaryIndex === 0
          ? { ...boundary, label: localized.knowledgeBoundaryLabel, summary: localized.knowledgeBoundarySummary }
          : boundary,
      ),
    }))
    if (scene.inspector.context.localState[0]) {
      scene.inspector.context.localState[0].label = localized.localStateActiveBeatLabel
      scene.inspector.context.localState[0].value = localized.localStateActiveBeatValue
    }
    if (scene.inspector.context.localState[1]) {
      scene.inspector.context.localState[1].label = localized.localStateRuntimePresetLabel
      scene.inspector.context.localState[1].value = localized.localStateRuntimePresetValue
    }
    if (scene.inspector.context.localState[2]) {
      scene.inspector.context.localState[2].label = localized.localStatePatchCandidatesLabel
      scene.inspector.context.localState[2].value = localized.localStatePatchCandidatesValue
    }
    if (scene.inspector.context.overrides[0]) {
      scene.inspector.context.overrides[0].label = localized.overrideLabel
      scene.inspector.context.overrides[0].summary = localized.overrideSummary
    }
    if (scene.inspector.versions.checkpoints[0]) {
      scene.inspector.versions.checkpoints[0].label = localized.checkpointLabel
      scene.inspector.versions.checkpoints[0].summary = localized.checkpointSummary
    }
    scene.inspector.runtime.profile.label = localized.runtimeProfileLabel
    scene.inspector.runtime.profile.summary = localized.runtimeProfileSummary
    scene.inspector.runtime.metrics.latencyLabel = localized.runtimeLatencyLabel
    scene.inspector.runtime.metrics.tokenLabel = localized.runtimeTokenLabel
    scene.inspector.runtime.metrics.costLabel = localized.runtimeCostLabel
    scene.prose.statusLabel = localized.proseStatusLabel
    scene.prose.proseDraft = localized.proseDraft
    scene.prose.latestDiffSummary = localized.proseLatestDiffSummary
    if (scene.inspector.versions.acceptanceTimeline[0]) {
      scene.inspector.versions.acceptanceTimeline[0].title = localized.dockEventTitle
      scene.inspector.versions.acceptanceTimeline[0].detail = localized.dockEventDetail
      scene.inspector.versions.acceptanceTimeline[0].meta = '评审'
    }
    if (scene.inspector.runtime.latestFailure) {
      scene.inspector.runtime.latestFailure = localized.problemTitle
    }
    if (scene.dock.trace[0]) {
      scene.dock.trace[0].title = localized.traceTitle
      scene.dock.trace[0].detail = localized.traceDetail
      scene.dock.trace[0].meta = '追踪'
    }
    scene.dock.consistency.summary = localized.consistencySummary
    if (scene.dock.events[0]) {
      scene.dock.events[0].title = localized.dockEventTitle
      scene.dock.events[0].detail = localized.dockEventDetail
      scene.dock.events[0].meta = '事件'
    }
    if (scene.dock.consistency.checks[0]) {
      scene.dock.consistency.checks[0].label = localized.problemTitle
      scene.dock.consistency.checks[0].detail = localized.problemRecommendation
    }
    if (scene.dock.problems.items[0]) {
      scene.dock.problems.items[0].title = localized.problemTitle
      scene.dock.problems.items[0].recommendation = localized.problemRecommendation
    }
    scene.dock.cost.currentWindowLabel = localized.costCurrentWindowLabel
    scene.dock.cost.trendLabel = localized.costTrendLabel
    if (scene.dock.cost.breakdown[0]) {
      scene.dock.cost.breakdown[0].label = localized.costBreakdownLabel
      scene.dock.cost.breakdown[0].value = localized.costBreakdownValue
    }
  }

  return database
}

export function getSceneFixtureCopy(locale: Locale) {
  if (locale === 'zh-CN') {
    return {
      localState: {
      acceptedPatchCandidatesLabel: '已采纳补丁候选',
      activeBeatLabel: '当前节拍',
      selectedRuntimePresetLabel: '已选运行预设',
      unassigned: '未指定',
      defaultRuntimePreset: '克制施压',
      semanticCandidates: (count: number) => `${count} 个语义候选`,
      },
      privateInfoGuard: {
        none: '当前场景没有启用私密信息保护。',
        protect: (count: number) => `在场景仍处于评审中时，需要保护 ${count} 个敏感揭示点。`,
      },
      actorKnowledge: {
        known: (name: string, summary: string) => `${name}可以依据场上可见信息行动：${summary}`,
        guarded: (name: string, summary: string) => `${name}必须遵守这条边界：${summary}`,
      },
      proseRevision: {
        modeLabels: {
          rewrite: '重写',
          compress: '压缩',
          expand: '扩写',
          tone_adjust: '语气调整',
          continuity_fix: '连续性修复',
        },
        latestRevision: (modeLabel: string) => `最新修订：已为评审准备好“${modeLabel}”轮。`,
        revisionQueued: '1 个修订已排队',
      },
      continueRun: {
        versionLabel: '运行 08',
        summary: '运行已从已采纳状态恢复，正继续朝离场节拍推进。',
        dockTitle: '运行已从已采纳状态恢复',
        dockDetail: '在已采纳状态清出下一节拍之后，执行流程推进到了运行 08。',
      },
      switchThread: {
        altObjective: '备选线程里，美伊占据更强的开价位置，而任没有在公开场合退让。',
        altGoal: '测试“美伊掌握开场筹码”的备选交易线程。',
        altStatus: '备选节拍线程已可进入修订轮',
        altLocalState: '备选节拍分支已激活',
        altDockTitle: '线程已切到备选节拍',
        altDockDetail: '底部摘要现在反映的是备选交易线程。',
        mainObjective: '逼任在列车出发前为账本开价。',
        mainGoal: '逼美伊表态：账本究竟是诱饵，还是她手里的筹码。',
        mainStatus: '可进入修订轮次',
        mainLocalState: '围绕账本的讨价还价',
        mainDockTitle: '线程已切回主线',
        mainDockDetail: '底部摘要已回到默认执行线程。',
      },
      proposalAction: {
        acceptedSceneSummary: (title: string) => `已把“${title}”并入场景状态，但提交仍保留给补丁预览流程。`,
        acceptedTimelineTitle: '提案已进入补丁预览',
        acceptedTimelineDetail: (title: string) => `“${title}”现已进入补丁预览，但尚未提交。`,
        acceptedDockTitle: '已采纳提案已进入补丁预览队列',
        acceptedDockDetail: (title: string) => `“${title}”更新了已采纳状态，正在等待补丁提交。`,
        rewriteSceneSummary: '有一个提案被退回重写；在新候选通过前，已采纳状态保持不变。',
        rewriteDockTitle: '提案已退回重写',
        rewriteDockDetail: (title?: string) => (title ? `“${title}”需要更紧的修订，之后才能重新进入评审。` : '有一个提案已退回重写。'),
        rejectedSceneSummary: '有一个提案被从执行评审中拒绝；已采纳状态继续保持在设定安全的决定上。',
        rejectedDockTitle: '提案已从评审中拒绝',
        rejectedDockDetail: (title?: string) => (title ? `“${title}”已被拒绝，不会进入已采纳补丁队列。` : '有一个提案已被拒绝。'),
      },
      commitPatch: {
        versionLabel: (label: string) => `已提交 / ${label}`,
        sceneSummary: (label: string) => `“${label}”已从补丁预览提交到场景工作区。`,
        proseStatus: '补丁已提交到正文交接',
        proseDiff: (label: string) => `已提交补丁预览：“${label}”。`,
        checkpointLabel: (label: string) => `已提交 / ${label}`,
        checkpointSummary: (label: string) => `“${label}”已从已采纳补丁队列提交。`,
        timelineTitle: '补丁已提交',
        timelineDetail: (label: string) => `“${label}”已从已采纳状态进入已提交的工作区版本。`,
        dockTitle: '已采纳补丁已提交',
        dockDetail: (label: string) => `“${label}”已从补丁预览提交到场景工作区。`,
      },
    }
  }

  return {
    localState: {
      acceptedPatchCandidatesLabel: 'Accepted patch candidates',
      activeBeatLabel: 'Active beat',
      selectedRuntimePresetLabel: 'Selected runtime preset',
      unassigned: 'Unassigned',
      defaultRuntimePreset: 'Measured Pressure',
      semanticCandidates: (count: number) => `${count} semantic candidate${count === 1 ? '' : 's'}`,
    },
    privateInfoGuard: {
      none: 'No private-info guardrails are active for this scene.',
      protect: (count: number) => `Protect ${count} guarded reveal${count === 1 ? '' : 's'} while this scene stays in review.`,
    },
    actorKnowledge: {
      known: (name: string, summary: string) => `${name} can work from observable scene knowledge: ${summary}`,
      guarded: (name: string, summary: string) => `${name} must respect this boundary: ${summary}`,
    },
    proseRevision: {
      modeLabels: {
        rewrite: 'rewrite',
        compress: 'compress',
        expand: 'expand',
        tone_adjust: 'tone adjust',
        continuity_fix: 'continuity fix',
      },
      latestRevision: (modeLabel: string) => `Latest revision: ${modeLabel} pass prepared for review.`,
      revisionQueued: '1 revision queued',
    },
    continueRun: {
      versionLabel: 'Run 08',
      summary: 'Run resumed from the accepted state and is now advancing toward the departure beat.',
      dockTitle: 'Run resumed from accepted state',
      dockDetail: 'Execution moved forward into run 08 after the accepted state cleared the next beat.',
    },
    switchThread: {
      altObjective: 'Alternate thread keeps Mei on the stronger bargaining line while Ren yields no public ground.',
      altGoal: 'Test the alternate bargain thread where Mei controls the opening leverage.',
      altStatus: 'Alt Beat thread ready for revision pass',
      altLocalState: 'Alt Beat branch active',
      altDockTitle: 'Thread switched to Alt Beat',
      altDockDetail: 'Dock summaries now reflect the alternate bargain thread.',
      mainObjective: 'Force Ren to bargain for the ledger before the train departs.',
      mainGoal: 'Corner Mei into revealing whether the ledger is bait or leverage.',
      mainStatus: 'Ready for revision pass',
      mainLocalState: 'Bargain over the ledger',
      mainDockTitle: 'Thread switched to Mainline',
      mainDockDetail: 'Dock summaries returned to the default execution thread.',
    },
    proposalAction: {
      acceptedSceneSummary: (title: string) => `Accepted ${title.toLowerCase()} into the scene state while leaving commit for patch preview.`,
      acceptedTimelineTitle: 'Proposal accepted into patch preview',
      acceptedTimelineDetail: (title: string) => `${title} is now available in patch preview without committing yet.`,
      acceptedDockTitle: 'Accepted proposal queued for patch preview',
      acceptedDockDetail: (title: string) => `${title} updated accepted state and is waiting for patch commit.`,
      rewriteSceneSummary: 'A proposal was sent back for rewrite; accepted state remains unchanged until a new candidate clears review.',
      rewriteDockTitle: 'Proposal sent back for rewrite',
      rewriteDockDetail: (title?: string) => (title ? `${title} needs a tighter revision before it can re-enter review.` : 'A proposal was sent back for rewrite.'),
      rejectedSceneSummary: 'One proposal was rejected from execution review; accepted state remains focused on canon-safe decisions.',
      rejectedDockTitle: 'Proposal rejected from review',
      rejectedDockDetail: (title?: string) => (title ? `${title} was rejected and will not enter the accepted patch queue.` : 'A proposal was rejected.'),
    },
    commitPatch: {
      versionLabel: (label: string) => `Committed / ${label}`,
      sceneSummary: (label: string) => `${label} committed from patch preview into the scene workspace.`,
      proseStatus: 'Patch committed to prose handoff',
      proseDiff: (label: string) => `Committed patch preview: ${label}.`,
      checkpointLabel: (label: string) => `Committed / ${label}`,
      checkpointSummary: (label: string) => `${label} was committed from the accepted patch queue.`,
      timelineTitle: 'Patch committed',
      timelineDetail: (label: string) => `${label} moved from accepted state into the committed workspace version.`,
      dockTitle: 'Accepted patch committed',
      dockDetail: (label: string) => `${label} was committed from patch preview into the scene workspace.`,
    },
  }
}

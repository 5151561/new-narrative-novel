import type {
  AssetChapterMentionRecord,
  AssetContextVisibilityRecord,
  AssetKnowledgeWorkspaceRecord,
  AssetLocalizedText,
  AssetNavigatorGroupsRecord,
  AssetRecord,
  AssetSceneMentionRecord,
  AssetStoryBibleFactRecord,
  AssetStoryBibleSourceRefRecord,
  AssetSummaryRecord,
  AssetStateTimelineEntryRecord,
  CanonicalAssetKind,
} from './asset-records'

function text(en: string, zhCN: string): AssetLocalizedText {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function profileSection(
  id: string,
  title: AssetLocalizedText,
  facts: Array<{ id: string; label: AssetLocalizedText; value: AssetLocalizedText }>,
) {
  return {
    id,
    title,
    facts,
  }
}

function sourceRef(
  id: string,
  kind: AssetStoryBibleSourceRefRecord['kind'],
  en: string,
  zhCN: string,
): AssetStoryBibleSourceRefRecord {
  return {
    id,
    kind,
    label: text(en, zhCN),
  }
}

function fact(
  id: string,
  label: AssetLocalizedText,
  value: AssetLocalizedText,
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

function timelineEntry(
  id: string,
  label: AssetLocalizedText,
  summary: AssetLocalizedText,
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

function assetRecord(record: AssetRecord): AssetRecord {
  return record
}

function sceneMention(record: AssetSceneMentionRecord): AssetSceneMentionRecord {
  return record
}

function chapterMention(record: AssetChapterMentionRecord): AssetChapterMentionRecord {
  return record
}

const visibilityRank: Record<AssetContextVisibilityRecord, number> = {
  public: 0,
  'character-known': 1,
  private: 2,
  spoiler: 3,
  'editor-only': 4,
}

function isCanonicalKind(kind: AssetRecord['kind']): kind is CanonicalAssetKind {
  return ['character', 'location', 'organization', 'object', 'lore'].includes(kind)
}

function canReadFactVisibility(
  factVisibility: AssetContextVisibilityRecord,
  requestedVisibility: AssetContextVisibilityRecord,
) {
  return visibilityRank[factVisibility] <= visibilityRank[requestedVisibility]
}

function filterFacts(
  facts: AssetStoryBibleFactRecord[],
  requestedVisibility?: AssetContextVisibilityRecord,
) {
  if (!requestedVisibility) {
    return facts
  }

  return facts.filter((entry) => canReadFactVisibility(entry.visibility, requestedVisibility))
}

function applyRequestedVisibility(
  asset: AssetRecord,
  requestedVisibility?: AssetContextVisibilityRecord,
): AssetRecord {
  if (!requestedVisibility) {
    return asset
  }

  return {
    ...asset,
    canonFacts: filterFacts(asset.canonFacts, requestedVisibility),
    privateFacts: filterFacts(asset.privateFacts, requestedVisibility),
  }
}

function toNavigatorSummary(asset: AssetRecord): AssetSummaryRecord | null {
  if (!isCanonicalKind(asset.kind)) {
    return null
  }

  return {
    id: asset.id,
    kind: asset.kind,
    title: asset.title,
    summary: asset.summary,
    visibility: asset.visibility,
    mentionCount: asset.mentions.length,
    relationCount: asset.relations.length,
    hasWarnings: (asset.warnings?.length ?? 0) > 0,
  }
}

const courierSignalNotes = sourceRef('source-courier-signal-notes', 'note', 'Courier signal notes', '信使暗号笔记')
const platformWitnessLog = sourceRef('source-platform-witness-log', 'scene', 'Midnight platform witness log', '午夜站台目击记录')
const windowQueueNotes = sourceRef('source-window-queue-notes', 'scene', 'Ticket window queue notes', '售票窗队列笔记')
const courierRoster = sourceRef('source-courier-roster', 'asset', 'Courier network roster', '信使网络名册')
const ledgerShellBrief = sourceRef('source-ledger-shell-brief', 'note', 'Closed ledger shell brief', '闭合账本外壳简报')
const witnessProtocol = sourceRef('source-witness-protocol', 'note', 'Witness protocol memo', '目击协议备忘')

const assetSeeds: AssetRecord[] = [
  assetRecord({
    id: 'asset-ren-voss',
    kind: 'character',
    title: text('Ren Voss', '任·沃斯'),
    summary: text(
      'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
      '站在信使一侧的谈判者，在公开压力里一边拖时间，一边坚持账本不能被翻开。',
    ),
    visibility: 'character-known',
    profile: {
      sections: [
        profileSection('identity', text('Identity', '身份'), [
          { id: 'role', label: text('Role', '角色'), value: text('Courier negotiator', '信使谈判者') },
          { id: 'agenda', label: text('Agenda', '意图'), value: text('Lock the bargain before witnesses harden the price.', '在目击者抬高代价前锁定交易。') },
        ]),
        profileSection('signals', text('Signals', '信号'), [
          { id: 'private-knowledge', label: text('Private knowledge', '私下掌握'), value: text('The courier signal stays legible only to Ren.', '只有 Ren 能继续读懂信使暗号。') },
          { id: 'public-signal', label: text('Public signal', '公开信号'), value: text('Never lets the ledger open in front of a crowd.', '绝不在众人面前翻开账本。') },
        ]),
      ],
    },
    canonFacts: [
      fact(
        'ren-public-line',
        text('Public line', '公开底线'),
        text('Ren will stall in public before he lets the ledger open.', '只要还在公开场合，Ren 宁可拖延也不会让账本打开。'),
        'public',
        [platformWitnessLog],
        '2026-04-27 22:10',
      ),
      fact(
        'ren-platform-debt',
        text('Platform debt', '站台代价'),
        text('Every visible delay on the platform raises the price Mei can demand.', '月台上每一次被看见的拖延都会抬高 Mei 能索取的代价。'),
        'character-known',
        [platformWitnessLog],
        '2026-04-27 22:12',
      ),
    ],
    privateFacts: [
      fact(
        'ren-courier-key',
        text('Courier signal key', '信使暗号钥匙'),
        text('Ren is still the only person carrying the current signal key for the courier network.', 'Ren 仍是唯一携带当前信使网络暗号钥匙的人。'),
        'private',
        [courierSignalNotes, courierRoster],
        '2026-04-27 22:14',
      ),
    ],
    stateTimeline: [
      timelineEntry(
        'ren-midnight-platform',
        text('Midnight Platform standoff', '午夜站台对峙'),
        text('Ren keeps the ledger closed while the witness pressure hardens around him.', 'Ren 在目击压力不断变硬的同时坚持不打开账本。'),
        'scene-midnight-platform',
        'chapter-signals-in-rain',
        'established',
        [platformWitnessLog],
      ),
      timelineEntry(
        'ren-ticket-window',
        text('Ticket Window acceleration', '售票窗加速'),
        text('Ren shifts from stalling to buying seconds without surrendering the ledger line.', 'Ren 从拖延转为抢秒，但仍不让出账本底线。'),
        'scene-ticket-window',
        'chapter-signals-in-rain',
        'watch',
        [windowQueueNotes],
      ),
    ],
    mentions: [
      sceneMention({
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
          acceptedFactIds: ['fact-1'],
          proposalIds: ['proposal-1'],
          patchId: 'patch-1',
        },
      }),
      sceneMention({
        id: 'mention-ren-ticket-window',
        targetScope: 'scene',
        targetId: 'scene-ticket-window',
        sceneId: 'scene-ticket-window',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Ticket Window', '售票窗'),
        relationLabel: text('Tests speed against certainty', '拿速度交换确定性'),
        excerpt: text(
          'Ren pushes for speed while Mei keeps forcing the commitment question back into view.',
          'Ren 想加速离场，而 Mei 一直把“先表态”压回台面。',
        ),
        recommendedLens: 'orchestrate',
        backing: {
          kind: 'draft_context',
          sceneId: 'scene-ticket-window',
          proposalIds: ['proposal-ticket-window'],
        },
      }),
      chapterMention({
        id: 'mention-ren-signals-in-rain',
        targetScope: 'chapter',
        targetId: 'chapter-signals-in-rain',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Signals in Rain', '雨中信号'),
        relationLabel: text('Carries the bargaining line', '承载谈判主线'),
        excerpt: text(
          'Ren stays at the center of every leverage exchange in the chapter.',
          '这一章里每一次筹码交换都绕不开 Ren。',
        ),
        recommendedLens: 'structure',
        backing: {
          kind: 'unlinked',
        },
      }),
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
      {
        id: 'relation-ren-platform',
        targetAssetId: 'asset-midnight-platform',
        relationLabel: text('Works inside', '受制于'),
        summary: text(
          'The platform keeps Ren visible and stops private leverage from staying private.',
          '站台让 Ren 始终暴露在目光下，私下筹码很难继续只停留在私下。',
        ),
      },
      {
        id: 'relation-ren-ledger',
        targetAssetId: 'asset-ledger-stays-shut',
        relationLabel: text('Protects', '保护'),
        summary: text(
          'Ren treats the closed-ledger line as the non-negotiable edge of the whole exchange.',
          'Ren 把“账本必须保持闭合”当成整场交换里不可退让的边界。',
        ),
      },
    ],
    warnings: [text('Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.', '一旦账本松动，公开目击压力会把 Ren 的筹码反转成负担。')],
    notes: [text('Future scene edits should keep Ren’s refusal legible before any exit bell cue lands.', '后续场景调整要先保住 Ren 的拒绝姿态，再安排离场铃点。')],
  }),
  assetRecord({
    id: 'asset-mei-arden',
    kind: 'character',
    title: text('Mei Arden', '美伊·阿登'),
    summary: text(
      'Counterparty who keeps raising the visible cost until Ren gives her a usable commitment.',
      '不断抬高公开代价的对手，直到 Ren 给出她能用的承诺。',
    ),
    visibility: 'public',
    profile: {
      sections: [
        profileSection('identity', text('Identity', '身份'), [
          { id: 'role', label: text('Role', '角色'), value: text('Counterparty broker', '对手方斡旋者') },
          { id: 'agenda', label: text('Agenda', '意图'), value: text('Force a commitment before any quiet exit becomes possible.', '在安静离场成立前，逼对方先表态。') },
        ]),
        profileSection('signals', text('Signals', '信号'), [
          { id: 'private-knowledge', label: text('Private knowledge', '私下掌握'), value: text('Ren cannot afford another public delay.', 'Ren 承受不起下一次公开拖延。') },
          { id: 'public-signal', label: text('Public signal', '公开信号'), value: text('Prices risk upward whenever the crowd can witness the exchange.', '只要人群能看到谈判，代价就会继续上浮。') },
        ]),
      ],
    },
    canonFacts: [
      fact(
        'mei-price-rise',
        text('Visible price rise', '公开涨价'),
        text('Mei turns every visible hesitation into a higher public price.', 'Mei 会把每一次被看见的犹豫都抬成更高的公开代价。'),
        'public',
        [platformWitnessLog],
        '2026-04-27 22:16',
      ),
    ],
    privateFacts: [],
    stateTimeline: [
      timelineEntry(
        'mei-midnight-platform',
        text('Public pressure lock', '公开压力锁定'),
        text('Mei keeps the bargain in full view so hidden terms stop being enough.', 'Mei 把交易锁在众目睽睽之下，让隐藏条件不再足够。'),
        'scene-midnight-platform',
        'chapter-signals-in-rain',
        'established',
        [platformWitnessLog],
      ),
    ],
    mentions: [
      sceneMention({
        id: 'mention-mei-midnight-platform',
        targetScope: 'scene',
        targetId: 'scene-midnight-platform',
        sceneId: 'scene-midnight-platform',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Midnight Platform', '午夜站台'),
        relationLabel: text('Names the cost in public', '在公开处定价'),
        excerpt: text(
          'Mei keeps the exchange public so Ren cannot win with hidden terms alone.',
          'Mei 把交易压在公开场合里，让 Ren 不能只靠暗处条件取胜。',
        ),
        recommendedLens: 'draft',
      }),
      sceneMention({
        id: 'mention-mei-ticket-window',
        targetScope: 'scene',
        targetId: 'scene-ticket-window',
        sceneId: 'scene-ticket-window',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Ticket Window', '售票窗'),
        relationLabel: text('Demands commitment first', '要求先作承诺'),
        excerpt: text(
          'Mei turns the window queue into leverage and keeps asking for the irreversible answer.',
          'Mei 把窗口排队变成压力，持续逼问那个不能撤回的答案。',
        ),
        recommendedLens: 'orchestrate',
      }),
    ],
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
      {
        id: 'relation-mei-network',
        targetAssetId: 'asset-courier-network',
        relationLabel: text('Corners', '逼迫'),
        summary: text(
          'Mei forces the courier network to expose more of its bargaining posture than it wants.',
          'Mei 逼着信使网络暴露出比它原本愿意更多的谈判姿态。',
        ),
      },
    ],
    notes: [text('Mei works best when her pressure stays visible without collapsing into outright exposure.', 'Mei 的压力最好始终可见，但不要直接塌成彻底曝光。')],
  }),
  assetRecord({
    id: 'asset-midnight-platform',
    kind: 'location',
    title: text('Midnight Platform', '午夜站台'),
    summary: text(
      'Open platform where every hesitation turns into public leverage and witness pressure.',
      '一个公开暴露的站台，任何犹豫都会被放大成目击压力和公开筹码。',
    ),
    visibility: 'public',
    profile: {
      sections: [
        profileSection('identity', text('Identity', '身份'), [
          { id: 'type', label: text('Type', '类型'), value: text('Transit platform', '交通月台') },
          { id: 'pressure', label: text('Pressure', '压力'), value: text('Crowd visibility makes secrets expensive.', '人群可见性会让秘密变贵。') },
        ]),
        profileSection('signals', text('Signals', '信号'), [
          { id: 'visibility', label: text('Visibility', '可见度'), value: text('Nothing stays private for long.', '没有什么能长期保持私密。') },
          { id: 'first-appearance', label: text('First appearance', '首次出现'), value: text('Midnight Platform scene', '午夜站台一场') },
        ]),
      ],
    },
    canonFacts: [
      fact(
        'platform-public-stage',
        text('Public stage', '公开场域'),
        text('The platform makes witness pressure impossible to ignore.', '月台会让目击压力不可能被忽略。'),
        'public',
        [platformWitnessLog],
        '2026-04-27 22:18',
      ),
    ],
    privateFacts: [],
    stateTimeline: [
      timelineEntry(
        'platform-crowd-hardens',
        text('Witness pressure hardens', '目击压力成形'),
        text('The platform locks the exchange into public time before the action can move indoors.', '在动作移入室内前，月台先把这场交换锁进公开时间里。'),
        'scene-midnight-platform',
        'chapter-signals-in-rain',
        'established',
        [platformWitnessLog],
      ),
    ],
    mentions: [
      sceneMention({
        id: 'mention-platform-midnight-platform',
        targetScope: 'scene',
        targetId: 'scene-midnight-platform',
        sceneId: 'scene-midnight-platform',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Midnight Platform', '午夜站台'),
        relationLabel: text('Hosts the bargain', '承载谈判'),
        excerpt: text(
          'The platform keeps the whole exchange exposed to witnesses and timing pressure.',
          '整场交换都被月台暴露给目击者和时机压力。',
        ),
        recommendedLens: 'orchestrate',
      }),
      chapterMention({
        id: 'mention-platform-signals-in-rain',
        targetScope: 'chapter',
        targetId: 'chapter-signals-in-rain',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Signals in Rain', '雨中信号'),
        relationLabel: text('Sets the public baseline', '设定公开基线'),
        excerpt: text(
          'The chapter keeps inheriting the platform’s visibility, even after the action moves indoors.',
          '即使动作移入室内，这一章仍一直承受着月台留下的公开可见性。',
        ),
        recommendedLens: 'structure',
      }),
    ],
    relations: [
      {
        id: 'relation-platform-window',
        targetAssetId: 'asset-ticket-window',
        relationLabel: text('Funnels pressure toward', '把压力导向'),
        summary: text(
          'The platform’s witness pressure flows directly into the ticket window negotiation.',
          '月台上的目击压力会直接流向售票窗的交换。',
        ),
      },
      {
        id: 'relation-platform-network',
        targetAssetId: 'asset-courier-network',
        relationLabel: text('Exposes', '暴露'),
        summary: text(
          'The platform strips the courier network of any chance to operate unseen.',
          '月台会剥夺信使网络在无人察觉中行动的机会。',
        ),
      },
    ],
    warnings: [text('Too much exposure here can flatten the later indoor handoff beats.', '这里的曝光如果过强，会压扁后续室内交接的层次。')],
  }),
  assetRecord({
    id: 'asset-ticket-window',
    kind: 'location',
    title: text('Ticket Window', '售票窗'),
    summary: text(
      'Narrow exchange point where speed, certainty, and queue pressure all become visible at once.',
      '一个狭窄的交换节点，速度、确定性和排队压力会在这里同时显形。',
    ),
    visibility: 'public',
    profile: {
      sections: [
        profileSection('identity', text('Identity', '身份'), [
          { id: 'type', label: text('Type', '类型'), value: text('Service window', '服务窗口') },
          { id: 'pressure', label: text('Pressure', '压力'), value: text('The queue turns waiting time into leverage.', '排队会把等待时间本身变成筹码。') },
        ]),
        profileSection('signals', text('Signals', '信号'), [
          { id: 'visibility', label: text('Visibility', '可见度'), value: text('The queue hears enough to amplify every hesitation.', '排队的人会听到足够多的内容来放大每一次犹豫。') },
          { id: 'first-appearance', label: text('First appearance', '首次出现'), value: text('Ticket Window scene', '售票窗一场') },
        ]),
      ],
    },
    canonFacts: [
      fact(
        'window-queue-pressure',
        text('Queue pressure', '队列压力'),
        text('The queue turns every extra second into visible bargaining cost.', '队列会把每多一秒都变成可见的谈判代价。'),
        'public',
        [windowQueueNotes],
        '2026-04-27 22:20',
      ),
    ],
    privateFacts: [],
    stateTimeline: [
      timelineEntry(
        'window-commitment-pivot',
        text('Commitment pivot', '承诺转折'),
        text('The window compresses the standoff into a single question of speed versus certainty.', '售票窗把对峙压缩成速度与确定性的单一问题。'),
        'scene-ticket-window',
        'chapter-signals-in-rain',
        'watch',
        [windowQueueNotes],
      ),
    ],
    mentions: [
      sceneMention({
        id: 'mention-window-ticket-window',
        targetScope: 'scene',
        targetId: 'scene-ticket-window',
        sceneId: 'scene-ticket-window',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Ticket Window', '售票窗'),
        relationLabel: text('Forces the trade-off into one frame', '把交换压进同一镜头'),
        excerpt: text(
          'The window keeps speed and certainty in the same beat instead of letting either side escape the question.',
          '售票窗会把速度和确定性压在同一节拍里，不让任何一方绕开问题。',
        ),
        recommendedLens: 'draft',
      }),
      chapterMention({
        id: 'mention-window-signals-in-rain',
        targetScope: 'chapter',
        targetId: 'chapter-signals-in-rain',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Signals in Rain', '雨中信号'),
        relationLabel: text('Sharpens the chapter exchange', '压紧章节交换'),
        excerpt: text(
          'The chapter uses the window to turn a broad standoff into a precise cost question.',
          '这一章用售票窗把宽泛对峙压缩成精确的代价问题。',
        ),
        recommendedLens: 'draft',
      }),
    ],
    relations: [
      {
        id: 'relation-window-platform',
        targetAssetId: 'asset-midnight-platform',
        relationLabel: text('Inherits pressure from', '承接压力自'),
        summary: text(
          'The platform’s witness pressure keeps echoing through the queue at the window.',
          '月台上的目击压力会继续回响在售票窗前的队列里。',
        ),
      },
      {
        id: 'relation-window-ledger',
        targetAssetId: 'asset-closed-ledger',
        relationLabel: text('Tests', '考验'),
        summary: text(
          'The tighter the queue gets, the more likely someone asks to see the closed ledger.',
          '队列越紧，越容易有人逼着当场看闭合账本。',
        ),
      },
    ],
  }),
  assetRecord({
    id: 'asset-courier-network',
    kind: 'organization',
    title: text('Courier Network', '信使网络'),
    summary: text(
      'The organization trying to keep witness pressure survivable while preserving the closed-ledger line.',
      '试图在保住闭合账本底线的同时，让目击压力仍可承受的组织。',
    ),
    visibility: 'character-known',
    profile: {
      sections: [
        profileSection('identity', text('Identity', '身份'), [
          { id: 'type', label: text('Type', '类型'), value: text('Mutual courier ring', '互助信使网络') },
          { id: 'agenda', label: text('Agenda', '意图'), value: text('Keep the bargain moving without surrendering ledger proof.', '在不交出账本证明的前提下推进交易。') },
        ]),
      ],
    },
    canonFacts: [
      fact(
        'network-public-posture',
        text('Public posture', '公开姿态'),
        text('The network prefers delay over exposure when witness pressure spikes.', '当目击压力陡增时，网络宁可拖延也不愿曝光。'),
        'character-known',
        [courierRoster],
        '2026-04-27 22:22',
      ),
    ],
    privateFacts: [],
    stateTimeline: [
      timelineEntry(
        'network-platform-exposure',
        text('Platform exposure', '月台暴露'),
        text('The network loses its usual shadow cover once the bargain moves onto the platform.', '一旦交易移上月台，网络惯有的阴影掩护就会失效。'),
        'scene-midnight-platform',
        'chapter-signals-in-rain',
        'watch',
        [platformWitnessLog, courierRoster],
      ),
    ],
    mentions: [
      chapterMention({
        id: 'mention-network-signals-in-rain',
        targetScope: 'chapter',
        targetId: 'chapter-signals-in-rain',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Signals in Rain', '雨中信号'),
        relationLabel: text('Supplies the bargaining line', '提供谈判底稿'),
        excerpt: text(
          'The chapter keeps testing whether the courier network can survive full witness pressure.',
          '这一章不断试探信使网络能否扛住完整的目击压力。',
        ),
        recommendedLens: 'structure',
      }),
    ],
    relations: [
      {
        id: 'relation-network-ren',
        targetAssetId: 'asset-ren-voss',
        relationLabel: text('Relies on', '依赖'),
        summary: text(
          'Ren is the network’s visible negotiator when private signaling stops working.',
          '当私密暗号失灵时，Ren 就是网络在明面上的谈判者。',
        ),
      },
      {
        id: 'relation-network-platform',
        targetAssetId: 'asset-midnight-platform',
        relationLabel: text('Gets exposed by', '被暴露于'),
        summary: text(
          'The platform removes the network’s normal margin for secret maneuvering.',
          '月台会拿走这个网络平时依赖的秘密腾挪空间。',
        ),
      },
      {
        id: 'relation-network-ledger',
        targetAssetId: 'asset-closed-ledger',
        relationLabel: text('Protects', '保护'),
        summary: text(
          'The network treats the closed ledger as the one object that cannot become public proof.',
          '这个网络把闭合账本视为绝不能变成公开证明的核心物件。',
        ),
      },
    ],
  }),
  assetRecord({
    id: 'asset-closed-ledger',
    kind: 'object',
    title: text('Closed Ledger', '闭合账本'),
    summary: text(
      'A sealed object whose proof value would end the bargaining game the moment it becomes public.',
      '一个一旦公开就会立刻终结整场谈判游戏的封存物件。',
    ),
    visibility: 'character-known',
    profile: {
      sections: [
        profileSection('identity', text('Identity', '身份'), [
          { id: 'type', label: text('Type', '类型'), value: text('Sealed ledger object', '封存账本物件') },
          { id: 'risk', label: text('Risk', '风险'), value: text('Opening it turns bargaining pressure into proof.', '一旦打开，谈判压力就会直接坍塌成证明。') },
        ]),
      ],
    },
    canonFacts: [
      fact(
        'closed-ledger-shell',
        text('Outer shell', '外层封壳'),
        text('Most witnesses only know the ledger as a sealed object that should not be opened publicly.', '大多数目击者只知道它是一个不该在公开场合打开的封存物件。'),
        'character-known',
        [ledgerShellBrief],
        '2026-04-27 22:24',
      ),
      fact(
        'closed-ledger-witness-proof',
        text('Witness proof payload', '目击证明载荷'),
        text('The proof inside the ledger would settle the bargain instantly if revealed to the crowd.', '如果把账本里的证明内容直接暴露给人群，整场交易会被立刻定性。'),
        'spoiler',
        [witnessProtocol],
        '2026-04-27 22:26',
      ),
    ],
    privateFacts: [],
    stateTimeline: [
      timelineEntry(
        'closed-ledger-platform-lock',
        text('Platform lock', '月台封锁'),
        text('The ledger stays sealed while the platform remains fully witnessed.', '只要月台仍处于被完整目击的状态，账本就必须保持封存。'),
        'scene-midnight-platform',
        'chapter-signals-in-rain',
        'established',
        [platformWitnessLog, ledgerShellBrief],
      ),
    ],
    mentions: [
      sceneMention({
        id: 'mention-closed-ledger-midnight-platform',
        targetScope: 'scene',
        targetId: 'scene-midnight-platform',
        sceneId: 'scene-midnight-platform',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Midnight Platform', '午夜站台'),
        relationLabel: text('Stays sealed in public', '在公开中保持封存'),
        excerpt: text(
          'The platform scene only works because the closed ledger never becomes visible proof.',
          '月台一场之所以成立，是因为闭合账本始终没有变成可见证明。',
        ),
        recommendedLens: 'draft',
      }),
    ],
    relations: [
      {
        id: 'relation-closed-ledger-network',
        targetAssetId: 'asset-courier-network',
        relationLabel: text('Anchors', '锚定'),
        summary: text(
          'The courier network’s leverage depends on keeping this object sealed.',
          '信使网络的筹码建立在让这个物件继续封存之上。',
        ),
      },
      {
        id: 'relation-closed-ledger-rule',
        targetAssetId: 'asset-public-witness-rule',
        relationLabel: text('Carries', '承载'),
        summary: text(
          'The object is the concrete container of the public witness rule.',
          '这个物件是公开目击规则的具体承载体。',
        ),
      },
    ],
    warnings: [text('If the object becomes proof too early, the chapter loses all bargaining ambiguity.', '如果这个物件过早变成证明，整章会失去所有谈判模糊空间。')],
  }),
  assetRecord({
    id: 'asset-public-witness-rule',
    kind: 'lore',
    title: text('Public Witness Rule', '公开目击规则'),
    summary: text(
      'Lore-level truth that no witnessed bargain survives once direct proof is placed in public view.',
      '一条 lore 级真相：一旦直接证明被摆到公开目击面前，任何被围观的交易都无法继续维持原状。',
    ),
    visibility: 'public',
    profile: {
      sections: [
        profileSection('identity', text('Identity', '身份'), [
          { id: 'type', label: text('Type', '类型'), value: text('Witness constraint lore', '目击约束 lore') },
          { id: 'effect', label: text('Effect', '作用'), value: text('Proof collapses bargaining into public judgment.', '证明会把谈判直接压扁成公开判断。') },
        ]),
      ],
    },
    canonFacts: [
      fact(
        'witness-rule-surface',
        text('Surface rule', '表层规则'),
        text('As long as witnesses remain, the bargain must stay one step away from proof.', '只要目击者还在，交易就必须始终与证明保持一步之遥。'),
        'public',
        [witnessProtocol],
        '2026-04-27 22:28',
      ),
    ],
    privateFacts: [],
    stateTimeline: [
      timelineEntry(
        'witness-rule-midnight-platform',
        text('Rule in play', '规则生效'),
        text('The rule becomes the chapter’s dominant truth the moment the platform crowd hardens.', '月台人群一旦成形，这条规则就成为章节里的主导真相。'),
        'scene-midnight-platform',
        'chapter-signals-in-rain',
        'established',
        [platformWitnessLog, witnessProtocol],
      ),
    ],
    mentions: [
      chapterMention({
        id: 'mention-witness-rule-signals-in-rain',
        targetScope: 'chapter',
        targetId: 'chapter-signals-in-rain',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Signals in Rain', '雨中信号'),
        relationLabel: text('Sets the non-proof boundary', '划定非证明边界'),
        excerpt: text(
          'The chapter keeps every bargaining beat just short of public proof.',
          '这一章的每一个谈判节拍都被压在“还没成为公开证明”的边界上。',
        ),
        recommendedLens: 'structure',
      }),
    ],
    relations: [
      {
        id: 'relation-witness-rule-ledger',
        targetAssetId: 'asset-closed-ledger',
        relationLabel: text('Governs', '支配'),
        summary: text(
          'The public witness rule explains why the closed ledger cannot become public proof.',
          '公开目击规则解释了为什么闭合账本不能成为公开证明。',
        ),
      },
      {
        id: 'relation-witness-rule-ren',
        targetAssetId: 'asset-ren-voss',
        relationLabel: text('Constrains', '约束'),
        summary: text(
          'Ren’s public bargaining line only makes sense inside this rule.',
          'Ren 的公开谈判底线只有放进这条规则里才说得通。',
        ),
      },
    ],
  }),
  assetRecord({
    id: 'asset-ledger-stays-shut',
    kind: 'lore',
    title: text('Ledger Stays Shut', '账本不得打开'),
    summary: text(
      'Deprecated rule seed retained for compatibility with older asset stories and run fixtures.',
      '为兼容旧版 asset story 和 run fixture 而保留的旧规则种子。',
    ),
    visibility: 'spoiler',
    profile: {
      sections: [
        profileSection('constraint', text('Constraint', '约束'), [
          { id: 'legacy', label: text('Legacy mapping', '兼容映射'), value: text('Superseded by the public witness rule plus the closed ledger object.', '已被“公开目击规则 + 闭合账本物件”组合取代。') },
        ]),
      ],
    },
    canonFacts: [],
    privateFacts: [],
    stateTimeline: [],
    mentions: [],
    relations: [
      {
        id: 'relation-ledger-legacy-rule',
        targetAssetId: 'asset-public-witness-rule',
        relationLabel: text('Maps to', '映射到'),
        summary: text(
          'Legacy rule references should resolve through the new lore/object split.',
          '旧规则引用应通过新的 lore/object 拆分来理解。',
        ),
      },
    ],
    warnings: [text('Legacy asset retained for compatibility only.', '该旧资产仅为兼容保留。')],
  }),
  assetRecord({
    id: 'asset-departure-bell-timing',
    kind: 'lore',
    title: text('Departure Bell Timing', '发车铃时序'),
    summary: text(
      'Timing rule that decides when the exit can move without draining witness pressure too early.',
      '一条时序规则，用来决定何时可以离场，又不至于过早抽干目击压力。',
    ),
    visibility: 'editor-only',
    profile: {
      sections: [
        profileSection('identity', text('Constraint', '约束'), [
          { id: 'constraint', label: text('Constraint', '约束'), value: text('The departure bell cannot land before the confrontation earns it.', '离场铃不能早于对峙真正站稳的时刻。') },
          { id: 'scope', label: text('Scope', '适用范围'), value: text('Any scene that needs witness pressure to survive into motion.', '任何需要把目击压力带入行动段落的场景。') },
        ]),
      ],
    },
    canonFacts: [],
    privateFacts: [],
    stateTimeline: [],
    mentions: [
      sceneMention({
        id: 'mention-bell-departure-bell',
        targetScope: 'scene',
        targetId: 'scene-departure-bell',
        sceneId: 'scene-departure-bell',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Departure Bell', '发车钟'),
        relationLabel: text('Needs final placement', '仍待最终落点'),
        excerpt: text(
          'The ending cue still has to keep witness pressure alive through the final beat.',
          '终局提示仍要把目击压力保留到最后一个节拍。',
        ),
        recommendedLens: 'orchestrate',
      }),
      chapterMention({
        id: 'mention-bell-signals-in-rain',
        targetScope: 'chapter',
        targetId: 'chapter-signals-in-rain',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Signals in Rain', '雨中信号'),
        relationLabel: text('Frames the chapter exit', '框定章节离场'),
        excerpt: text(
          'The chapter can only leave cleanly if the bell lands after the public stalemate has fully formed.',
          '只有等公开僵局真正站稳，这一章才能靠铃点干净离场。',
        ),
        recommendedLens: 'structure',
      }),
    ],
    relations: [
      {
        id: 'relation-bell-platform',
        targetAssetId: 'asset-midnight-platform',
        relationLabel: text('Destabilizes', '影响'),
        summary: text(
          'If the bell arrives too early, the platform pressure collapses before it pays off.',
          '如果铃声来得太早，月台上的压力会在兑现之前先坍塌。',
        ),
      },
      {
        id: 'relation-bell-ledger',
        targetAssetId: 'asset-public-witness-rule',
        relationLabel: text('Protects', '保护'),
        summary: text(
          'Correct timing keeps the public witness rule intact long enough for the chapter to close under pressure.',
          '正确的时序能让公开目击规则持续到章节在压力中收束。',
        ),
      },
    ],
    warnings: [text('This rule is still unresolved in the current chapter ending.', '这条规则在当前章节结尾里仍未真正解决。')],
  }),
]

const assetContextPolicies: Record<string, NonNullable<AssetRecord['contextPolicy']>> = {
  'asset-ren-voss': {
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
  'asset-mei-arden': {
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
  'asset-midnight-platform': {
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
  'asset-courier-network': {
    assetId: 'asset-courier-network',
    status: 'limited',
    summary: text('The network can contribute posture and routing facts without leaking private keys.', '这个网络可以提供姿态和调度事实，但不能泄露私钥。'),
    defaultVisibility: 'character-known',
    defaultBudget: 'selected-facts',
    activationRules: [
      {
        id: 'network-explicit-link',
        reasonKind: 'explicit-link',
        label: text('Explicit courier link', '显式信使链接'),
        summary: text('Only include the network when a scene or proposal names it directly.', '只有场景或提案直接点名时才纳入这个网络。'),
        targetAgents: ['scene-manager', 'continuity-reviewer'],
        visibility: 'character-known',
        budget: 'selected-facts',
      },
    ],
  },
  'asset-closed-ledger': {
    assetId: 'asset-closed-ledger',
    status: 'limited',
    summary: text('The object may enter context with redacted shell facts, but proof payload stays guarded.', '这个物件可以带着去敏后的外壳事实进入上下文，但证明载荷必须受护栏保护。'),
    defaultVisibility: 'character-known',
    defaultBudget: 'selected-facts',
    activationRules: [
      {
        id: 'ledger-object-dependency',
        reasonKind: 'rule-dependency',
        label: text('Closed-ledger dependency', '闭合账本依赖'),
        summary: text('Use shell facts for scene planning, never the witness-proof payload.', '场景规划只能使用外壳事实，不能使用目击证明载荷。'),
        targetAgents: ['scene-manager', 'continuity-reviewer'],
        visibility: 'character-known',
        budget: 'selected-facts',
        guardrailLabel: text('Never include the witness-proof payload in shared context.', '不要把目击证明载荷放进共享上下文。'),
      },
    ],
    exclusions: [
      {
        id: 'closed-ledger-proof',
        label: text('Witness-proof payload', '目击证明载荷'),
        summary: text('Spoiler proof contents remain excluded from run context.', '剧透级证明内容保持排除，不进入运行上下文。'),
      },
    ],
  },
  'asset-public-witness-rule': {
    assetId: 'asset-public-witness-rule',
    status: 'active',
    summary: text('The public witness rule is safe to reference as high-level lore in read-heavy contexts.', '公开目击规则可以在只读上下文中作为高层 lore 被安全引用。'),
    defaultVisibility: 'public',
    defaultBudget: 'summary-only',
    activationRules: [
      {
        id: 'witness-rule-dependency',
        reasonKind: 'rule-dependency',
        label: text('Witness rule dependency', '目击规则依赖'),
        summary: text('Attach the rule summary whenever public proof boundaries govern the scene.', '只要场景受公开证明边界支配，就附带这条规则摘要。'),
        targetAgents: ['scene-manager', 'continuity-reviewer', 'prose-agent'],
        visibility: 'public',
        budget: 'summary-only',
      },
    ],
  },
  'asset-departure-bell-timing': {
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
}

const policyAwareAssetSeeds = assetSeeds.map((asset) => ({
  ...asset,
  ...(assetContextPolicies[asset.id] ? { contextPolicy: assetContextPolicies[asset.id] } : {}),
}))

export const mockAssetRecordSeeds: Record<string, AssetRecord> = Object.fromEntries(
  policyAwareAssetSeeds.map((asset) => [asset.id, asset]),
) as Record<string, AssetRecord>

export function listMockAssetRecords(options: { visibility?: AssetContextVisibilityRecord } = {}): AssetRecord[] {
  return policyAwareAssetSeeds.map((asset) => structuredClone(applyRequestedVisibility(asset, options.visibility)))
}

export function getMockAssetRecordById(
  assetId: string,
  options: { visibility?: AssetContextVisibilityRecord } = {},
): AssetRecord | null {
  const asset = mockAssetRecordSeeds[assetId]
  return asset ? structuredClone(applyRequestedVisibility(asset, options.visibility)) : null
}

export function listMockAssetNavigatorGroups(): AssetNavigatorGroupsRecord {
  const groups: AssetNavigatorGroupsRecord = {
    character: [],
    location: [],
    organization: [],
    object: [],
    lore: [],
  }

  for (const asset of policyAwareAssetSeeds) {
    const summary = toNavigatorSummary(asset)
    if (!summary) {
      continue
    }
    groups[summary.kind].push(summary)
  }

  for (const kind of Object.keys(groups) as CanonicalAssetKind[]) {
    groups[kind].sort((left, right) => left.title.en.localeCompare(right.title.en))
  }

  return structuredClone(groups)
}

export function getMockAssetKnowledgeWorkspace(
  assetId: string,
  options: { visibility?: AssetContextVisibilityRecord } = {},
): AssetKnowledgeWorkspaceRecord | null {
  if (!mockAssetRecordSeeds[assetId]) {
    return null
  }

  return {
    assetId,
    assets: listMockAssetRecords(options),
    requestedVisibility: options.visibility,
    viewsMeta: {
      availableViews: ['profile', 'mentions', 'relations', 'context'],
    },
  }
}

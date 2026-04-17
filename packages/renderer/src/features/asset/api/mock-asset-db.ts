import type {
  AssetChapterMentionRecord,
  AssetKnowledgeWorkspaceRecord,
  AssetLocalizedText,
  AssetRecord,
  AssetSceneMentionRecord,
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

function assetRecord(record: AssetRecord): AssetRecord {
  return record
}

function sceneMention(record: AssetSceneMentionRecord): AssetSceneMentionRecord {
  return record
}

function chapterMention(record: AssetChapterMentionRecord): AssetChapterMentionRecord {
  return record
}

const assetSeeds: AssetRecord[] = [
  assetRecord({
    id: 'asset-ren-voss',
    kind: 'character',
    title: text('Ren Voss', '任·沃斯'),
    summary: text(
      'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
      '站在信使一侧的谈判者，在公开压力里一边拖时间，一边坚持账本不能被翻开。',
    ),
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
        id: 'relation-ren-ledger',
        targetAssetId: 'asset-ledger-stays-shut',
        relationLabel: text('Protects', '保护'),
        summary: text(
          'Ren treats the closed ledger as the non-negotiable line of the whole exchange.',
          'Ren 把“账本不能打开”当成整场交换里不可退让的底线。',
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
        id: 'relation-mei-ledger',
        targetAssetId: 'asset-ledger-stays-shut',
        relationLabel: text('Tests', '试探'),
        summary: text(
          'Every push from Mei asks whether Ren will finally break the closed-ledger rule.',
          'Mei 的每一次推进都在试探 Ren 会不会最终打破“账本不能打开”的规则。',
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
        id: 'relation-platform-bell',
        targetAssetId: 'asset-departure-bell-timing',
        relationLabel: text('Times against', '受制于'),
        summary: text(
          'The platform becomes unsafe as soon as the departure bell lands too early.',
          '只要离场铃点过早落下，这个站台就会立刻变得不安全。',
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
        targetAssetId: 'asset-ledger-stays-shut',
        relationLabel: text('Tests', '考验'),
        summary: text(
          'The tighter the queue gets, the more likely someone asks to see the ledger.',
          '队列越紧，越容易有人逼着当场看账本。',
        ),
      },
    ],
  }),
  assetRecord({
    id: 'asset-ledger-stays-shut',
    kind: 'rule',
    title: text('Ledger Stays Shut', '账本不得打开'),
    summary: text(
      'Core constraint that keeps the exchange from collapsing into immediate public proof.',
      '一条核心约束，用来阻止这场交换立刻坍塌成公开证据。',
    ),
    profile: {
      sections: [
        profileSection('identity', text('Constraint', '约束'), [
          { id: 'constraint', label: text('Constraint', '约束'), value: text('The ledger cannot open in a witnessed exchange.', '账本不能在被目击的交换中打开。') },
          { id: 'scope', label: text('Scope', '适用范围'), value: text('Platform, window, and any handoff that still carries witnesses.', '月台、窗口，以及任何仍带着目击压力的交接场景。') },
        ]),
        profileSection('signals', text('Implications', '影响'), [
          { id: 'exception', label: text('Exception', '例外'), value: text('Only a fully private handoff could relax it, and none exists yet.', '只有完全私密的交接才可能松动这条规则，而眼下还不存在。') },
          { id: 'downstream-impact', label: text('Downstream impact', '后续影响'), value: text('Keeps both Ren and Mei negotiating around absence instead of proof.', '让 Ren 和 Mei 都只能围绕“不能证明”继续谈判。') },
        ]),
      ],
    },
    mentions: [
      sceneMention({
        id: 'mention-ledger-midnight-platform',
        targetScope: 'scene',
        targetId: 'scene-midnight-platform',
        sceneId: 'scene-midnight-platform',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Midnight Platform', '午夜站台'),
        relationLabel: text('Locks the bargain line', '锁住交易底线'),
        excerpt: text(
          'The scene works only because the ledger remains closed while the crowd watches.',
          '这一场之所以成立，是因为人群围观时账本始终没有打开。',
        ),
        recommendedLens: 'orchestrate',
      }),
      sceneMention({
        id: 'mention-ledger-ticket-window',
        targetScope: 'scene',
        targetId: 'scene-ticket-window',
        sceneId: 'scene-ticket-window',
        chapterId: 'chapter-signals-in-rain',
        targetLabel: text('Ticket Window', '售票窗'),
        relationLabel: text('Prevents the quick proof', '阻止捷径证明'),
        excerpt: text(
          'The window scene stays tense because the easy proof still cannot be used.',
          '售票窗一场保持紧张，是因为最简单的证明手段仍不能用。',
        ),
        recommendedLens: 'draft',
      }),
    ],
    relations: [
      {
        id: 'relation-ledger-ren',
        targetAssetId: 'asset-ren-voss',
        relationLabel: text('Bound to', '绑定于'),
        summary: text(
          'Ren’s whole negotiating posture depends on keeping this rule intact.',
          'Ren 的整套谈判姿态都建立在这条规则不被打破之上。',
        ),
      },
      {
        id: 'relation-ledger-mei',
        targetAssetId: 'asset-mei-arden',
        relationLabel: text('Provokes', '激发'),
        summary: text(
          'Mei keeps testing the boundary of the rule to see what Ren will trade instead.',
          'Mei 不断试探这条规则的边界，想看 Ren 会拿什么来交换。',
        ),
      },
    ],
    warnings: [text('If this rule breaks too early, the chapter loses its bargaining pressure entirely.', '如果这条规则过早破裂，整章的谈判压力会直接消失。')],
  }),
  assetRecord({
    id: 'asset-departure-bell-timing',
    kind: 'rule',
    title: text('Departure Bell Timing', '发车铃时序'),
    summary: text(
      'Timing rule that decides when the exit can move without draining witness pressure too early.',
      '一条时序规则，用来决定何时可以离场，又不至于过早抽干目击压力。',
    ),
    profile: {
      sections: [
        profileSection('identity', text('Constraint', '约束'), [
          { id: 'constraint', label: text('Constraint', '约束'), value: text('The departure bell cannot land before the confrontation earns it.', '离场铃不能早于对峙真正站稳的时刻。') },
          { id: 'scope', label: text('Scope', '适用范围'), value: text('Any scene that needs witness pressure to survive into motion.', '任何需要把目击压力带入行动段落的场景。') },
        ]),
        profileSection('signals', text('Implications', '影响'), [
          { id: 'exception', label: text('Exception', '例外'), value: text('A quiet handoff with no witnesses could ignore the bell.', '如果是完全无人目击的交接，才可能不受铃点束缚。') },
          { id: 'downstream-impact', label: text('Downstream impact', '后续影响'), value: text('Controls whether the chapter ends with pressure or with relief.', '决定章节是以压力收束，还是提前泄气。') },
        ]),
      ],
    },
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
        targetAssetId: 'asset-ledger-stays-shut',
        relationLabel: text('Protects', '保护'),
        summary: text(
          'Correct timing keeps the ledger rule intact long enough for the chapter to close under pressure.',
          '正确的时序能让“账本不能打开”持续到章节在压力中收束。',
        ),
      },
    ],
    warnings: [text('This rule is still unresolved in the current chapter ending.', '这条规则在当前章节结尾里仍未真正解决。')],
  }),
]

export const mockAssetRecordSeeds: Record<string, AssetRecord> = Object.fromEntries(
  assetSeeds.map((asset) => [asset.id, asset]),
) as Record<string, AssetRecord>

export function listMockAssetRecords(): AssetRecord[] {
  return assetSeeds.map((asset) => structuredClone(asset))
}

export function getMockAssetRecordById(assetId: string): AssetRecord | null {
  const asset = mockAssetRecordSeeds[assetId]
  return asset ? structuredClone(asset) : null
}

export function getMockAssetKnowledgeWorkspace(assetId: string): AssetKnowledgeWorkspaceRecord | null {
  if (!mockAssetRecordSeeds[assetId]) {
    return null
  }

  return {
    assetId,
    assets: listMockAssetRecords(),
    viewsMeta: {
      availableViews: ['profile', 'mentions', 'relations'],
    },
  }
}

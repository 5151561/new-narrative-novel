import { describe, expect, it } from 'vitest'

import type { LocalizedTextRecord } from '../../contracts/api-records.js'
import { buildSceneContextPacket } from '../contextBuilder/sceneContextBuilder.js'
import { createFixtureDataSnapshot } from '../../repositories/fixture-data.js'
import {
  createAgentInvocationArtifact,
  createCanonPatchArtifact,
  createContextPacketArtifact,
  createProposalSetArtifact,
  createProseDraftArtifact,
} from './sceneRunArtifacts.js'
import {
  buildAgentInvocationDetail,
  buildCanonPatchDetail,
  buildContextPacketDetail,
  buildProposalSetDetail,
  buildProseDraftDetail,
} from './sceneRunArtifactDetails.js'

function text(en: string, zhCN = en): LocalizedTextRecord {
  return {
    en,
    'zh-CN': zhCN,
  }
}

describe('sceneRunArtifactDetails', () => {
  const runId = 'run-scene-midnight-platform-002'
  const sceneId = 'scene-midnight-platform'

  it('builds persisted context packet detail from project data and accepts localized label overrides', () => {
    const snapshot = createFixtureDataSnapshot('http://127.0.0.1:4174/api')
    const artifact = createContextPacketArtifact({
      runId,
      sceneId,
      sequence: 2,
      contextPacket: buildSceneContextPacket({
        project: snapshot.projects['book-signal-arc'],
        sceneId,
        sequence: 2,
      }),
    })

    const detail = buildContextPacketDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-003'],
      labels: {
        title: text('Context packet', '上下文包'),
        summary: text('Packed context for editorial review.', '供编辑审阅的上下文包。'),
        statusLabel: text('Inspectable', '可查看'),
        createdAtLabel: text('Timeline step 003', '时间线步骤 003'),
      },
    })

    expect(detail.title).toEqual(text('Context packet', '上下文包'))
    expect(detail.summary).toEqual(text('Packed context for editorial review.', '供编辑审阅的上下文包。'))
    expect(detail.statusLabel).toEqual(text('Inspectable', '可查看'))
    expect(detail.createdAtLabel).toEqual(text('Timeline step 003', '时间线步骤 003'))
    expect(detail.sections).toEqual([
      {
        id: 'ctx-scene-midnight-platform-run-002-section-narrative',
        title: text('Narrative brief', '叙事摘要'),
        summary: text(
          'Signal Arc premise, Signals in Rain chapter goal, and the live scene objective were packed together.',
          '已整理 信号弧线 的书级 premise、雨中信号 的章节目标与当前场景目标。',
        ),
        itemCount: 5,
      },
      {
        id: 'ctx-scene-midnight-platform-run-002-section-canon',
        title: text('Canon anchors', '正典锚点'),
        summary: text(
          'Accepted canon facts and current scene state remain the guardrails for planning and prose.',
          '已接受的正典事实与当前场景状态继续作为规划和正文的护栏。',
        ),
        itemCount: 3,
      },
      {
        id: 'ctx-scene-midnight-platform-run-002-section-assets',
        title: text('Asset activation', '资产激活'),
        summary: text(
          'Cast, location, constraints, and review-only rules were filtered through visibility policy before inclusion.',
          '登场角色、地点、约束与仅供评审的规则会先经过可见性策略过滤，再决定是否纳入。',
        ),
        itemCount: 7,
      },
    ])
    expect(detail.includedCanonFacts).toEqual([
      {
        id: 'ctx-scene-midnight-platform-run-002-canon-objective',
        label: text('Scene objective', '场景目标'),
        value: text(
          'Lock the bargain before the witness can turn the ledger into public leverage.',
          'Lock the bargain before the witness can turn the ledger into public leverage.',
        ),
      },
      {
        id: 'ctx-scene-midnight-platform-run-002-canon-current-state',
        label: text('Current scene state', '当前场景状态'),
        value: text(
          'The platform bargain remains public while Ren keeps the ledger unread.',
          'The platform bargain remains public while Ren keeps the ledger unread.',
        ),
      },
      {
        id: 'fact-ledger-closed',
        label: text('Ledger remains closed', 'Ledger remains closed'),
        value: text(
          'No public beat opens the ledger.',
          'No public beat opens the ledger.',
        ),
      },
    ])
    expect(detail.includedAssets).toEqual(expect.arrayContaining([
      {
        assetId: 'asset-ren-voss',
        kind: 'character',
        label: text('Ren Voss', '任·沃斯'),
        reason: text(
          'Courier-side negotiator who keeps the ledger closed while trying to buy time in public. Public line: Ren will stall in public before he lets the ledger open.; Role: Courier negotiator',
          'Courier-side negotiator who keeps the ledger closed while trying to buy time in public. Public line: Ren will stall in public before he lets the ledger open.; Role: Courier negotiator',
        ),
      },
      {
        assetId: 'asset-midnight-platform',
        kind: 'location',
        label: text('Midnight Platform', '午夜站台'),
        reason: text(
          'Open platform where every hesitation turns into public leverage and witness pressure. Type: Transit platform; Pressure: Crowd visibility makes secrets expensive.',
          'Open platform where every hesitation turns into public leverage and witness pressure. Type: Transit platform; Pressure: Crowd visibility makes secrets expensive.',
        ),
      },
      {
        assetId: 'asset-courier-network',
        kind: 'organization',
        label: text('Courier Network', '信使网络'),
        reason: text(
          'The organization trying to keep witness pressure survivable while preserving the closed-ledger line. Public posture: The network prefers delay over exposure when witness pressure spikes.',
          'The organization trying to keep witness pressure survivable while preserving the closed-ledger line. Public posture: The network prefers delay over exposure when witness pressure spikes.',
        ),
      },
      {
        assetId: 'asset-closed-ledger',
        kind: 'object',
        label: text('Closed Ledger', '闭合账本'),
        reason: text(
          'A sealed object whose proof value would end the bargaining game the moment it becomes public. Outer shell: Most witnesses only know the ledger as a sealed object that should not be opened publicly.',
          'A sealed object whose proof value would end the bargaining game the moment it becomes public. Outer shell: Most witnesses only know the ledger as a sealed object that should not be opened publicly.',
        ),
      },
      {
        assetId: 'asset-public-witness-rule',
        kind: 'lore',
        label: text('Public Witness Rule', '公开目击规则'),
        reason: text(
          'Lore-level truth that no witnessed bargain survives once direct proof is placed in public view. Surface rule: As long as witnesses remain, the bargain must stay one step away from proof.',
          'Lore-level truth that no witnessed bargain survives once direct proof is placed in public view. Surface rule: As long as witnesses remain, the bargain must stay one step away from proof.',
        ),
      },
    ]))
    expect(detail.excludedPrivateFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: text('Courier signal private key', '信使暗号私钥'),
      }),
      expect.objectContaining({
        label: text('Witness-proof payload', '目击证明载荷'),
      }),
      expect.objectContaining({
        label: text('Editor timing guardrail', '编辑时序护栏'),
      }),
    ]))
    expect(detail.outputSchemaLabel).toEqual(text('Scene context packet schema', '场景上下文包结构'))
    expect(detail.tokenBudgetLabel).toEqual(text('Target budget 1700 tokens', '目标预算 1700 tokens'))
    expect(detail.assetActivations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        assetId: 'asset-ren-voss',
        assetKind: 'character',
        decision: 'included',
        reasonKind: 'scene-cast',
        visibility: 'character-known',
        budget: 'selected-facts',
        targetAgents: ['scene-manager', 'character-agent', 'prose-agent'],
        policyRuleIds: ['ren-scene-cast'],
      }),
      expect.objectContaining({
        assetId: 'asset-mei-arden',
        decision: 'included',
        visibility: 'public',
      }),
      expect.objectContaining({
        assetId: 'asset-midnight-platform',
        decision: 'included',
        reasonKind: 'scene-location',
        budget: 'mentions-excerpts',
      }),
      expect.objectContaining({
        assetId: 'asset-courier-network',
        assetKind: 'organization',
        decision: 'included',
        visibility: 'character-known',
      }),
      expect.objectContaining({
        assetId: 'asset-closed-ledger',
        assetKind: 'object',
        decision: 'included',
        visibility: 'character-known',
      }),
      expect.objectContaining({
        assetId: 'asset-public-witness-rule',
        assetKind: 'lore',
        decision: 'included',
        visibility: 'public',
      }),
      expect.objectContaining({
        assetId: 'asset-departure-bell-timing',
        decision: 'redacted',
        visibility: 'editor-only',
      }),
    ]))
    expect(detail.activationSummary).toEqual({
      includedAssetCount: 6,
      excludedAssetCount: 0,
      redactedAssetCount: 1,
      targetAgentCount: 4,
      warningCount: 1,
    })
  })

  it('builds agent invocation detail from artifact metadata with deterministic references', () => {
    const artifact = createAgentInvocationArtifact({
      runId,
      sceneId,
      sequence: 2,
      index: 1,
      role: 'planner',
      provenance: {
        provider: 'openai',
        modelId: 'gpt-5.4',
      },
    })

    const detail = buildAgentInvocationDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-005'],
    })

    expect(detail).toMatchObject({
      kind: 'agent-invocation',
      agentRole: 'scene-planner',
      contextPacketId: 'ctx-scene-midnight-platform-run-002',
      modelLabel: text('OpenAI planner profile (gpt-5.4)', 'OpenAI 规划模型 (gpt-5.4)'),
      inputSummary: text(
        'Consumes the packed scene context and editorial note for Midnight Platform.',
        '消费 Midnight Platform 的上下文包和编辑备注。',
      ),
      outputSummary: text(
        'Produces structured proposal candidates for editorial review.',
        '产出供编辑审阅的结构化提案候选。',
      ),
      outputSchemaLabel: text('Proposal candidate schema', '提案候选结构'),
      createdAtLabel: text('Linked event 005', '关联事件 005'),
    })
    expect(detail.generatedRefs).toEqual([
      {
        kind: 'proposal-set',
        id: 'proposal-set-scene-midnight-platform-run-002',
        label: text('Scene proposal set', '场景提案集'),
      },
    ])
  })

  it('compresses planner fallback provenance into labels without leaking raw gateway payloads', () => {
    const artifact = createAgentInvocationArtifact({
      runId,
      sceneId,
      sequence: 2,
      index: 1,
      role: 'planner',
      provenance: {
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
        fallbackReason: 'invalid-output',
      },
    })
    artifact.meta = {
      ...artifact.meta,
      prompt: 'Return scene-planning proposals only.',
      transcript: [
        {
          role: 'assistant',
          content: 'raw planner transcript',
        },
      ],
    }

    const detail = buildAgentInvocationDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-005'],
    })

    expect(detail.modelLabel).toEqual(
      text('Fixture planner fallback (fixture-scene-planner)', 'Fixture 回退规划模型 (fixture-scene-planner)'),
    )
    expect(JSON.stringify(detail)).not.toContain('Return scene-planning proposals only.')
    expect(JSON.stringify(detail)).not.toContain('raw planner transcript')
  })

  it('builds proposal set detail with deterministic proposals and review options', () => {
    const artifact = createProposalSetArtifact({
      runId,
      sceneId,
      sequence: 2,
    })

    const detail = buildProposalSetDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-008'],
    })

    expect(detail.reviewId).toBe('review-scene-midnight-platform-002')
    expect(detail.sourceInvocationIds).toEqual([
      'agent-invocation-scene-midnight-platform-run-002-001',
      'agent-invocation-scene-midnight-platform-run-002-002',
    ])
    expect(detail.proposals).toEqual([
      {
        id: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
        title: text('Anchor the arrival beat', '固定抵达节拍'),
        summary: text(
          'Open on Midnight Platform before introducing any new reveal.',
          '先在 Midnight Platform 落定开场，再引入新的揭示。',
        ),
        changeKind: 'action',
        riskLabel: text('Low continuity risk', '连续性风险低'),
        relatedAssets: [
          {
            assetId: 'asset-scene-midnight-platform-lead',
            label: text('Midnight Platform lead', 'Midnight Platform 主角'),
            kind: 'character',
          },
        ],
        variants: [
          {
            id: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
            label: text('Arrival-first', '先抵达'),
            summary: text(
              "Keep Midnight Platform grounded in the lead character's arrival before escalating the reveal.",
              '先通过主角抵达让 Midnight Platform 稳住，再升级揭示。',
            ),
            rationale: text(
              'Preserves continuity while still giving the scene a clear forward beat.',
              '在保住连续性的同时，让场景拥有清晰的推进节拍。',
            ),
            tradeoffLabel: text('Slower escalation', '升级较慢'),
            riskLabel: text('Low continuity risk', '连续性风险低'),
            relatedAssets: [
              {
                assetId: 'asset-scene-midnight-platform-lead',
                label: text('Midnight Platform lead', 'Midnight Platform 主角'),
                kind: 'character',
              },
            ],
          },
          {
            id: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
            label: text('Reveal pressure', '揭示加压'),
            summary: text(
              'Let the reveal intrude earlier while Midnight Platform is still settling.',
              '在 Midnight Platform 尚未完全落定时提前压入揭示。',
            ),
            rationale: text(
              'Creates a sharper hook, but asks review to accept a faster continuity turn.',
              '制造更强钩子，但需要审阅接受更快的连续性转折。',
            ),
            tradeoffLabel: text('Sharper hook', '钩子更强'),
            riskLabel: text('Higher continuity risk', '连续性风险较高'),
            relatedAssets: [
              {
                assetId: 'asset-scene-midnight-platform-lead',
                label: text('Midnight Platform lead', 'Midnight Platform 主角'),
                kind: 'character',
              },
              {
                assetId: 'asset-scene-midnight-platform-setting',
                label: text('Midnight Platform setting', 'Midnight Platform 场景地点'),
                kind: 'location',
              },
            ],
          },
        ],
        defaultVariantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
      },
      {
        id: 'proposal-set-scene-midnight-platform-run-002-proposal-002',
        title: text('Stage the reveal through the setting', '通过场景地点推进揭示'),
        summary: text(
          'Let the Midnight Platform setting carry the reveal instead of adding raw exposition.',
          '让 Midnight Platform 场景来承载揭示，而不是直接堆叠说明。',
        ),
        changeKind: 'reveal',
        riskLabel: text('Editor check recommended', '建议编辑复核'),
        relatedAssets: [
          {
            assetId: 'asset-scene-midnight-platform-setting',
            label: text('Midnight Platform setting', 'Midnight Platform 场景地点'),
            kind: 'location',
          },
        ],
      },
    ])
    expect(detail.proposals[1]).not.toHaveProperty('variants')
    expect(detail.reviewOptions).toEqual([
      {
        decision: 'accept',
        label: text('Accept', '接受'),
        description: text('Apply the proposal set without further changes.', '直接应用提案集，不再追加改动。'),
      },
      {
        decision: 'accept-with-edit',
        label: text('Accept with edit', '接受并编辑'),
        description: text('Apply the proposal set, then layer editorial adjustments.', '应用提案集后，再叠加编辑调整。'),
      },
      {
        decision: 'request-rewrite',
        label: text('Request rewrite', '要求重写'),
        description: text('Return the run to execution with rewrite guidance.', '附带重写指引后退回执行阶段。'),
      },
      {
        decision: 'reject',
        label: text('Reject', '拒绝'),
        description: text('Close the run without producing canon or prose artifacts.', '关闭本次运行，不产出 canon 或 prose artifact。'),
      },
    ])
  })

  it('marks selected proposal variants when review provenance is supplied', () => {
    const artifact = createProposalSetArtifact({
      runId,
      sceneId,
      sequence: 2,
    })

    const selectedVariant = {
      proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
      variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
    }

    const detail = buildProposalSetDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-008'],
      selectedVariants: [selectedVariant],
    })

    expect(detail.proposals[0]).toMatchObject({
      id: selectedVariant.proposalId,
      defaultVariantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
      selectedVariantId: selectedVariant.variantId,
    })
  })

  it('builds proposal set detail from persisted canonical planner metadata instead of regenerating fixture copy', () => {
    const artifact = createProposalSetArtifact({
      runId,
      sceneId,
      sequence: 2,
      plannerOutput: {
        proposals: [
          {
            title: 'Open with the station alarm',
            summary: 'Lead with the alarm before Ren enters the frame.',
            changeKind: 'action',
            riskLabel: 'Editor check recommended',
            variants: [
              {
                label: 'Alarm-wide',
                summary: 'Stay wide on the station alarm beat.',
                rationale: 'Lets the reveal breathe before character focus.',
              },
              {
                label: 'Ren-cut',
                summary: 'Cut directly to Ren on the alarm hit.',
                rationale: 'Makes the entrance feel abrupt and urgent.',
                tradeoffLabel: 'Sharper cut',
                riskLabel: 'Higher continuity risk',
              },
            ],
          },
        ],
      },
    })

    const detail = buildProposalSetDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-008'],
      selectedVariants: [
        {
          proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
          variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
        },
      ],
    })

    expect(detail.proposals).toEqual([
      {
        id: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
        title: text('Open with the station alarm'),
        summary: text('Lead with the alarm before Ren enters the frame.'),
        changeKind: 'action',
        riskLabel: text('Editor check recommended', '建议编辑复核'),
        relatedAssets: [
          {
            assetId: 'asset-scene-midnight-platform-lead',
            label: text('Midnight Platform lead', 'Midnight Platform 主角'),
            kind: 'character',
          },
        ],
        variants: [
          {
            id: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
            label: text('Alarm-wide'),
            summary: text('Stay wide on the station alarm beat.'),
            rationale: text('Lets the reveal breathe before character focus.'),
            relatedAssets: [
              {
                assetId: 'asset-scene-midnight-platform-lead',
                label: text('Midnight Platform lead', 'Midnight Platform 主角'),
                kind: 'character',
              },
            ],
          },
          {
            id: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
            label: text('Ren-cut'),
            summary: text('Cut directly to Ren on the alarm hit.'),
            rationale: text('Makes the entrance feel abrupt and urgent.'),
            tradeoffLabel: text('Sharper cut'),
            riskLabel: text('Higher continuity risk', '连续性风险较高'),
            relatedAssets: [
              {
                assetId: 'asset-scene-midnight-platform-lead',
                label: text('Midnight Platform lead', 'Midnight Platform 主角'),
                kind: 'character',
              },
              {
                assetId: 'asset-scene-midnight-platform-setting',
                label: text('Midnight Platform setting', 'Midnight Platform 场景地点'),
                kind: 'location',
              },
            ],
          },
        ],
        defaultVariantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
        selectedVariantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
      },
    ])
  })

  it('parameterizes proposal wording for non-platform scenes', () => {
    const artifact = createProposalSetArtifact({
      runId: 'run-scene-sunlit-library-004',
      sceneId: 'scene-sunlit-library',
      sequence: 4,
    })

    const detail = buildProposalSetDetail({
      artifact,
      sourceEventIds: ['run-event-scene-sunlit-library-004-008'],
    })

    expect(detail.summary).toEqual(text(
      'Proposal candidates for Sunlit Library are ready for review.',
      'Sunlit Library 的提案候选已可进入审阅。',
    ))
    expect(detail.proposals[0]?.summary).toEqual(text(
      'Open on Sunlit Library before introducing any new reveal.',
      '先在 Sunlit Library 落定开场，再引入新的揭示。',
    ))
    expect(detail.proposals[1]?.summary.en).toContain('Sunlit Library setting')
    expect(detail.proposals[1]?.summary.en).not.toContain('platform environment')
    expect(detail.proposals[1]?.summary['zh-CN']).toContain('Sunlit Library 场景')
    expect(detail.proposals[1]?.summary['zh-CN']).not.toContain('站台环境')
  })

  it('keeps context activations on fixture asset identities even for alternate scene ids', () => {
    const artifact = createContextPacketArtifact({
      runId: 'run-scene-sunlit-library-004',
      sceneId: 'scene-sunlit-library',
      sequence: 4,
    })

    const detail = buildContextPacketDetail({
      artifact,
      sourceEventIds: ['run-event-scene-sunlit-library-004-003'],
    })

    expect(detail.includedAssets.map((asset) => asset.assetId)).toEqual([
      'asset-ren-voss',
      'asset-mei-arden',
      'asset-midnight-platform',
      'asset-courier-network',
      'asset-closed-ledger',
      'asset-public-witness-rule',
    ])
    expect(detail.assetActivations?.map((activation) => activation.assetId)).toEqual([
      'asset-ren-voss',
      'asset-mei-arden',
      'asset-midnight-platform',
      'asset-courier-network',
      'asset-closed-ledger',
      'asset-public-witness-rule',
      'asset-departure-bell-timing',
    ])
  })

  it('builds canon patch detail from accepted proposal ids without caller-supplied fact payloads', () => {
    const artifact = createCanonPatchArtifact({
      runId,
      sceneId,
      sequence: 2,
    })

    const detail = buildCanonPatchDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-011'],
      decision: 'accept-with-edit',
      acceptedProposalIds: ['proposal-set-scene-midnight-platform-run-002-proposal-002'],
    })

    expect(detail.sourceProposalSetId).toBe('proposal-set-scene-midnight-platform-run-002')
    expect(detail.acceptedProposalIds).toEqual(['proposal-set-scene-midnight-platform-run-002-proposal-002'])
    expect(detail.acceptedFacts).toEqual([
      {
        id: 'canon-patch-scene-midnight-platform-002-fact-001',
        label: text('Accepted fact 1', '接受事实 1'),
        value: text(
          'Midnight Platform now carries an approved reveal through the environment.',
          'Midnight Platform 现在通过环境承载了一条已批准的揭示。',
        ),
        sourceProposalIds: ['proposal-set-scene-midnight-platform-run-002-proposal-002'],
        relatedAssets: [
          {
            assetId: 'asset-scene-midnight-platform-setting',
            label: text('Midnight Platform setting', 'Midnight Platform 场景地点'),
            kind: 'location',
          },
        ],
      },
    ])
    expect(detail.traceLinkIds).toEqual([
      'trace-link-scene-midnight-platform-002-accepted_into-001',
      'trace-link-scene-midnight-platform-002-accepted_into-002',
    ])
  })

  it('carries selected variant provenance into canon patch and prose details', () => {
    const selectedVariant = {
      proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
      variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
    }
    const canonPatchArtifact = createCanonPatchArtifact({
      runId,
      sceneId,
      sequence: 2,
    })

    const canonPatchDetail = buildCanonPatchDetail({
      artifact: canonPatchArtifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-011'],
      decision: 'accept',
      acceptedProposalIds: [selectedVariant.proposalId],
      selectedVariants: [selectedVariant],
    })

    expect(canonPatchDetail.selectedVariants).toEqual([selectedVariant])
    expect(canonPatchDetail.acceptedFacts[0]?.selectedVariants).toEqual([selectedVariant])

    const proseDraftArtifact = createProseDraftArtifact({
      runId,
      sceneId,
      sequence: 2,
    })

    const proseDraftDetail = buildProseDraftDetail({
      artifact: proseDraftArtifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-012'],
      sourceCanonPatchId: canonPatchDetail.id,
      contextPacketId: 'ctx-scene-midnight-platform-run-002',
      sourceProposalIds: canonPatchDetail.acceptedProposalIds,
      selectedVariants: canonPatchDetail.selectedVariants,
    })

    expect(proseDraftDetail.contextPacketId).toBe('ctx-scene-midnight-platform-run-002')
    expect(proseDraftDetail.selectedVariants).toEqual([selectedVariant])
    expect(proseDraftDetail.body?.en).toContain(selectedVariant.variantId)
    expect(proseDraftDetail.body?.en).toContain('rationale retained')
  })

  it('uses explicit backreference metadata for custom canon patch and prose draft ids', () => {
    const canonPatchArtifact = {
      ...createCanonPatchArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      id: 'canon-patch-editorial-777',
    }

    const canonPatchDefaultDetail = buildCanonPatchDetail({
      artifact: canonPatchArtifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-011'],
      decision: 'accept',
    })

    expect(canonPatchDefaultDetail.sourceProposalSetId).toBe('proposal-set-scene-midnight-platform-run-002')

    const canonPatchDetail = buildCanonPatchDetail({
      artifact: canonPatchArtifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-011'],
      decision: 'accept',
      sourceProposalSetId: 'proposal-set-explicit-777',
      acceptedProposalIds: ['proposal-set-explicit-777-proposal-001'],
    })

    expect(canonPatchDetail.sourceProposalSetId).toBe('proposal-set-explicit-777')
    expect(canonPatchDetail.acceptedProposalIds).toEqual(['proposal-set-explicit-777-proposal-001'])
    expect(canonPatchDetail.acceptedFacts[0]?.sourceProposalIds).toEqual(['proposal-set-explicit-777-proposal-001'])
    expect(canonPatchDetail.traceLinkIds).toEqual([
      'trace-link-scene-midnight-platform-002-accepted_into-001',
      'trace-link-scene-midnight-platform-002-accepted_into-002',
    ])

    const proseDraftArtifact = {
      ...createProseDraftArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      id: 'prose-draft-editorial-777',
    }

    const proseDraftDetail = buildProseDraftDetail({
      artifact: proseDraftArtifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-012'],
      sourceCanonPatchId: 'canon-patch-editorial-777',
      contextPacketId: 'ctx-scene-midnight-platform-run-002',
      sourceProposalIds: ['proposal-set-explicit-777-proposal-001'],
    })

    expect(proseDraftDetail.sourceCanonPatchId).toBe('canon-patch-editorial-777')
    expect(proseDraftDetail.contextPacketId).toBe('ctx-scene-midnight-platform-run-002')
    expect(proseDraftDetail.sourceProposalIds).toEqual(['proposal-set-explicit-777-proposal-001'])
  })

  it('derives accepted proposal ids consistently from explicit source proposal set id', () => {
    const artifact = createCanonPatchArtifact({
      runId,
      sceneId,
      sequence: 2,
    })

    const detail = buildCanonPatchDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-011'],
      decision: 'accept-with-edit',
      sourceProposalSetId: 'proposal-set-explicit-555',
    })

    expect(detail.sourceProposalSetId).toBe('proposal-set-explicit-555')
    expect(detail.acceptedProposalIds).toEqual(['proposal-set-explicit-555-proposal-001'])
    expect(detail.acceptedFacts[0]?.sourceProposalIds).toEqual(['proposal-set-explicit-555-proposal-001'])
    expect(detail.traceLinkIds).toEqual([
      'trace-link-scene-midnight-platform-002-accepted_into-001',
      'trace-link-scene-midnight-platform-002-accepted_into-002',
    ])
  })

  it('builds prose draft detail from deterministic canon and proposal links', () => {
    const artifact = createProseDraftArtifact({
      runId,
      sceneId,
      sequence: 2,
    })

    const detail = buildProseDraftDetail({
      artifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-012'],
    })

    expect(detail).toMatchObject({
      sourceCanonPatchId: 'canon-patch-scene-midnight-platform-002',
      contextPacketId: 'ctx-scene-midnight-platform-run-002',
      sourceProposalIds: ['proposal-set-scene-midnight-platform-run-002-proposal-001'],
      body: text(
        'Midnight Platform opens from the accepted run artifact rather than a hard-coded scene field. Accepted proposal proposal-set-scene-midnight-platform-run-002-proposal-001 anchors the draft. No selected proposal variant was submitted, so the draft follows the default accepted proposal path. The scene resolves into generated prose that can be traced back to the canon patch.',
        'Midnight Platform 从已接受的运行 artifact 展开，而不是直接写死在 scene 字段里。已接受提案 proposal-set-scene-midnight-platform-run-002-proposal-001 成为正文锚点。未提交已选提案变体，因此正文沿用默认接受提案路径。 该场景生成的正文可以追溯回正典补丁。',
      ),
      excerpt: text(
        'Midnight Platform settles into view before the next reveal turns visible.',
        'Midnight Platform 先稳稳落入视野，随后下一段揭示才开始显形。',
      ),
      wordCount: 146,
      traceLinkIds: ['trace-link-scene-midnight-platform-002-rendered_as-001'],
    })
    expect(detail.relatedAssets).toEqual([
      {
        assetId: 'asset-scene-midnight-platform-lead',
        label: text('Midnight Platform lead', 'Midnight Platform 主角'),
        kind: 'character',
      },
      {
        assetId: 'asset-scene-midnight-platform-setting',
        label: text('Midnight Platform setting', 'Midnight Platform 场景地点'),
        kind: 'location',
      },
    ])
  })

  it('maps usage and failure detail onto failed invocation and proposal artifacts without exposing raw prompt context', () => {
    const failedInvocationArtifact = createAgentInvocationArtifact({
      runId,
      sceneId,
      sequence: 2,
      index: 1,
      role: 'planner',
      provenance: {
        provider: 'openai',
        modelId: 'gpt-5.4',
      },
    })
    failedInvocationArtifact.meta = {
      ...failedInvocationArtifact.meta,
      prompt: 'Do not leak this raw planner prompt into the detail record.',
      usage: {
        inputTokens: 1420,
        outputTokens: 318,
        estimatedCostUsd: 0.0218,
        provider: 'openai',
        modelId: 'gpt-5.4',
      },
      failureDetail: {
        failureClass: 'provider_error',
        message: 'Provider returned 502 while planner output was being finalized.',
        provider: 'openai',
        modelId: 'gpt-5.4',
        retryable: true,
        sourceEventIds: ['run-event-scene-midnight-platform-002-006'],
      },
    }

    const failedInvocationDetail = buildAgentInvocationDetail({
      artifact: failedInvocationArtifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-005'],
    })

    expect(failedInvocationDetail.usage).toEqual({
      inputTokens: 1420,
      outputTokens: 318,
      estimatedCostUsd: 0.0218,
      provider: 'openai',
      modelId: 'gpt-5.4',
    })
    expect(failedInvocationDetail.failureDetail).toEqual({
      failureClass: 'provider_error',
      message: 'Provider returned 502 while planner output was being finalized.',
      provider: 'openai',
      modelId: 'gpt-5.4',
      retryable: true,
      sourceEventIds: ['run-event-scene-midnight-platform-002-006'],
    })
    expect(failedInvocationDetail).not.toHaveProperty('prompt')

    const failedProposalArtifact = createProposalSetArtifact({
      runId,
      sceneId,
      sequence: 2,
    })
    failedProposalArtifact.meta = {
      ...failedProposalArtifact.meta,
      usage: {
        inputTokens: 1420,
        outputTokens: 318,
        estimatedCostUsd: 0.0218,
        actualCostUsd: 0.0241,
        provider: 'openai',
        modelId: 'gpt-5.4',
      },
      failureDetail: {
        failureClass: 'invalid_output',
        message: 'Proposal normalization failed because no safe variant survived validation.',
        provider: 'openai',
        modelId: 'gpt-5.4',
        retryable: false,
        sourceEventIds: ['run-event-scene-midnight-platform-002-007', 'run-event-scene-midnight-platform-002-008'],
      },
    }

    const failedProposalDetail = buildProposalSetDetail({
      artifact: failedProposalArtifact,
      sourceEventIds: ['run-event-scene-midnight-platform-002-007'],
    })

    expect(failedProposalDetail.usage).toEqual({
      inputTokens: 1420,
      outputTokens: 318,
      estimatedCostUsd: 0.0218,
      actualCostUsd: 0.0241,
      provider: 'openai',
      modelId: 'gpt-5.4',
    })
    expect(failedProposalDetail.failureDetail).toEqual({
      failureClass: 'invalid_output',
      message: 'Proposal normalization failed because no safe variant survived validation.',
      provider: 'openai',
      modelId: 'gpt-5.4',
      retryable: false,
      sourceEventIds: ['run-event-scene-midnight-platform-002-007', 'run-event-scene-midnight-platform-002-008'],
    })
  })
})

import type {
  AgentInvocationArtifactDetailRecord,
  CanonPatchArtifactDetailRecord,
  ContextPacketArtifactDetailRecord,
  LocalizedTextRecord,
  ProposalSetArtifactDetailRecord,
  ProseDraftArtifactDetailRecord,
  RunArtifactRelatedAssetRecord,
  RunTraceLinkRecord,
  RunTraceNodeKind,
  RunTraceNodeRecord,
  RunTraceRelation,
  RunTraceResponse,
} from '../../contracts/api-records.js'
import { buildTraceLinkId } from './sceneRunIds.js'

interface BuildInitialRunTraceInput {
  runId: string
  contextPacket: ContextPacketArtifactDetailRecord
  agentInvocations: AgentInvocationArtifactDetailRecord[]
  proposalSet: ProposalSetArtifactDetailRecord
}

interface BuildAcceptedRunTraceInput extends BuildInitialRunTraceInput {
  canonPatch: CanonPatchArtifactDetailRecord
  proseDraft: ProseDraftArtifactDetailRecord
}

interface MutableTraceState {
  linkCounts: Map<RunTraceRelation, number>
  linksById: Map<string, RunTraceLinkRecord>
  missingTraceCount: number
  nodesById: Map<string, RunTraceNodeRecord>
  runId: string
}

function text(en: string, zhCN = en): LocalizedTextRecord {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function createState(runId: string): MutableTraceState {
  return {
    runId,
    nodesById: new Map<string, RunTraceNodeRecord>(),
    linksById: new Map<string, RunTraceLinkRecord>(),
    linkCounts: new Map<RunTraceRelation, number>(),
    missingTraceCount: 0,
  }
}

function addNode(state: MutableTraceState, node: RunTraceNodeRecord) {
  if (!state.nodesById.has(node.id)) {
    state.nodesById.set(node.id, node)
  }
}

function hasNode(state: MutableTraceState, id: string, kind: RunTraceNodeKind) {
  const node = state.nodesById.get(id)
  return node?.kind === kind
}

function addLink(
  state: MutableTraceState,
  input: {
    from: { id: string; kind: RunTraceNodeKind }
    label: LocalizedTextRecord
    relation: RunTraceRelation
    to: { id: string; kind: RunTraceNodeKind }
  },
) {
  if (!hasNode(state, input.from.id, input.from.kind) || !hasNode(state, input.to.id, input.to.kind)) {
    state.missingTraceCount += 1
    return
  }

  const nextIndex = (state.linkCounts.get(input.relation) ?? 0) + 1
  state.linkCounts.set(input.relation, nextIndex)
  const id = buildTraceLinkId(state.runId, input.relation, nextIndex)
  state.linksById.set(id, {
    id,
    from: input.from,
    to: input.to,
    relation: input.relation,
    label: input.label,
  })
}

function addAssetNode(state: MutableTraceState, asset: RunArtifactRelatedAssetRecord) {
  addNode(state, {
    id: asset.assetId,
    kind: 'asset',
    label: asset.label,
  })
}

function resolveGeneratedTargetKind(state: MutableTraceState, generatedRef: AgentInvocationArtifactDetailRecord['generatedRefs'][number]) {
  if (generatedRef.kind === 'proposal-set') {
    return 'proposal-set' as const
  }

  return state.nodesById.get(generatedRef.id)?.kind
}

function addGeneratedLinksForInvocation(
  state: MutableTraceState,
  invocation: AgentInvocationArtifactDetailRecord,
  options?: {
    includeRef?: (generatedRef: AgentInvocationArtifactDetailRecord['generatedRefs'][number]) => boolean
  },
) {
  for (const generatedRef of invocation.generatedRefs) {
    if (options?.includeRef && !options.includeRef(generatedRef)) {
      continue
    }

    const targetKind = resolveGeneratedTargetKind(state, generatedRef)
    if (!targetKind) {
      state.missingTraceCount += 1
      continue
    }

    addLink(state, {
      from: {
        id: invocation.id,
        kind: 'agent-invocation',
      },
      to: {
        id: generatedRef.id,
        kind: targetKind,
      },
      relation: 'generated',
      label: text('Generated', '生成'),
    })
  }
}

function buildSelectedVariantTraceLabel(
  input: BuildAcceptedRunTraceInput,
  proposalId: string,
  baseLabel: LocalizedTextRecord,
): LocalizedTextRecord {
  const selectedVariant = input.canonPatch.selectedVariants?.find((variant) => variant.proposalId === proposalId)
    ?? input.proseDraft.selectedVariants?.find((variant) => variant.proposalId === proposalId)
  if (!selectedVariant) {
    return baseLabel
  }

  const proposal = input.proposalSet.proposals.find((candidate) => candidate.id === selectedVariant.proposalId)
  const variant = proposal?.variants?.find((candidate) => candidate.id === selectedVariant.variantId)
  if (!variant) {
    return text(
      `${baseLabel.en} via selected variant ${selectedVariant.variantId}`,
      `${baseLabel['zh-CN']}，使用已选变体 ${selectedVariant.variantId}`,
    )
  }

  return text(
    `${baseLabel.en} via selected variant ${variant.label.en}: ${variant.summary.en}`,
    `${baseLabel['zh-CN']}，使用已选变体 ${variant.label['zh-CN']}：${variant.summary['zh-CN']}`,
  )
}

function buildRenderedAsTraceLabel(input: BuildAcceptedRunTraceInput) {
  const selectedVariants = input.proseDraft.selectedVariants ?? input.canonPatch.selectedVariants
  const selectedVariant = selectedVariants?.[0]
  if (!selectedVariant) {
    return text('Rendered as prose', '渲染为正文')
  }

  return buildSelectedVariantTraceLabel(input, selectedVariant.proposalId, text('Rendered as prose', '渲染为正文'))
}

function buildInitialTraceState(input: BuildInitialRunTraceInput) {
  const state = createState(input.runId)

  addNode(state, {
    id: input.contextPacket.id,
    kind: 'context-packet',
    label: input.contextPacket.title,
  })

  for (const invocation of input.agentInvocations) {
    addNode(state, {
      id: invocation.id,
      kind: 'agent-invocation',
      label: invocation.title,
    })
  }

  addNode(state, {
    id: input.proposalSet.id,
    kind: 'proposal-set',
    label: input.proposalSet.title,
  })
  addNode(state, {
    id: input.proposalSet.reviewId,
    kind: 'review',
    label: text('Editorial review', '编辑审阅'),
  })

  for (const proposal of input.proposalSet.proposals) {
    addNode(state, {
      id: proposal.id,
      kind: 'proposal',
      label: proposal.title,
    })
  }

  for (const proposal of input.proposalSet.proposals) {
    for (const asset of proposal.relatedAssets) {
      addAssetNode(state, asset)
    }
  }

  for (const invocation of input.agentInvocations) {
    if (!invocation.contextPacketId) {
      state.missingTraceCount += 1
      continue
    }

    addLink(state, {
      from: {
        id: invocation.contextPacketId,
        kind: 'context-packet',
      },
      to: {
        id: invocation.id,
        kind: 'agent-invocation',
      },
      relation: 'used_context',
      label: text('Used context', '使用上下文'),
    })
  }

  for (const invocation of input.agentInvocations) {
    addGeneratedLinksForInvocation(state, invocation, {
      includeRef: (generatedRef) => generatedRef.kind === 'proposal-set',
    })
  }

  for (const proposal of input.proposalSet.proposals) {
    addLink(state, {
      from: {
        id: input.proposalSet.id,
        kind: 'proposal-set',
      },
      to: {
        id: proposal.id,
        kind: 'proposal',
      },
      relation: 'proposed',
      label: text('Proposed', '提出'),
    })
  }

  addLink(state, {
    from: {
      id: input.proposalSet.id,
      kind: 'proposal-set',
    },
    to: {
      id: input.proposalSet.reviewId,
      kind: 'review',
    },
    relation: 'reviewed_by',
    label: text('Reviewed by', '由其审阅'),
  })

  for (const proposal of input.proposalSet.proposals) {
    for (const asset of proposal.relatedAssets) {
      addLink(state, {
        from: {
          id: proposal.id,
          kind: 'proposal',
        },
        to: {
          id: asset.assetId,
          kind: 'asset',
        },
        relation: 'mentions',
        label: text('Mentions', '提及'),
      })
    }
  }

  return state
}

function toTraceResponse(state: MutableTraceState): RunTraceResponse {
  const nodes = [...state.nodesById.values()]

  return {
    runId: state.runId,
    nodes,
    links: [...state.linksById.values()],
    summary: {
      proposalSetCount: nodes.filter((node) => node.kind === 'proposal-set').length,
      canonPatchCount: nodes.filter((node) => node.kind === 'canon-patch').length,
      proseDraftCount: nodes.filter((node) => node.kind === 'prose-draft').length,
      missingTraceCount: state.missingTraceCount,
    },
  }
}

export function buildInitialRunTrace(input: BuildInitialRunTraceInput): RunTraceResponse {
  return toTraceResponse(buildInitialTraceState(input))
}

export function buildAcceptedRunTrace(input: BuildAcceptedRunTraceInput): RunTraceResponse {
  const state = buildInitialTraceState(input)

  addNode(state, {
    id: input.canonPatch.id,
    kind: 'canon-patch',
    label: input.canonPatch.title,
  })
  addNode(state, {
    id: input.proseDraft.id,
    kind: 'prose-draft',
    label: input.proseDraft.title,
  })

  for (const invocation of input.agentInvocations) {
    if (invocation.generatedRefs.some((generatedRef) => generatedRef.kind === 'artifact')) {
      addGeneratedLinksForInvocation(state, invocation, {
        includeRef: (generatedRef) => generatedRef.kind === 'artifact',
      })
    }
  }

  for (const acceptedFact of input.canonPatch.acceptedFacts) {
    addNode(state, {
      id: acceptedFact.id,
      kind: 'canon-fact',
      label: acceptedFact.label,
    })
    for (const asset of acceptedFact.relatedAssets) {
      addAssetNode(state, asset)
    }
  }

  for (const asset of input.proseDraft.relatedAssets) {
    addAssetNode(state, asset)
  }

  for (const acceptedFact of input.canonPatch.acceptedFacts) {
    for (const sourceProposalId of acceptedFact.sourceProposalIds) {
      addLink(state, {
        from: {
          id: sourceProposalId,
          kind: 'proposal',
        },
        to: {
          id: acceptedFact.id,
          kind: 'canon-fact',
        },
        relation: 'accepted_into',
        label: buildSelectedVariantTraceLabel(input, sourceProposalId, text('Accepted into canon', '接受进入正典')),
      })
    }

    addLink(state, {
      from: {
        id: acceptedFact.id,
        kind: 'canon-fact',
      },
      to: {
        id: input.canonPatch.id,
        kind: 'canon-patch',
      },
      relation: 'accepted_into',
      label: text('Belongs to canon patch', '归属于正典补丁'),
    })

    for (const asset of acceptedFact.relatedAssets) {
      addLink(state, {
        from: {
          id: acceptedFact.id,
          kind: 'canon-fact',
        },
        to: {
          id: asset.assetId,
          kind: 'asset',
        },
        relation: 'mentions',
        label: text('Mentions', '提及'),
      })
    }
  }

  addLink(state, {
    from: {
      id: input.proseDraft.sourceCanonPatchId,
      kind: 'canon-patch',
    },
    to: {
      id: input.proseDraft.id,
      kind: 'prose-draft',
    },
    relation: 'rendered_as',
    label: buildRenderedAsTraceLabel(input),
  })

  for (const asset of input.proseDraft.relatedAssets) {
    addLink(state, {
      from: {
        id: input.proseDraft.id,
        kind: 'prose-draft',
      },
      to: {
        id: asset.assetId,
        kind: 'asset',
      },
      relation: 'mentions',
      label: text('Mentions', '提及'),
    })
  }

  return toTraceResponse(state)
}

export function buildRejectedRunTrace(input: BuildInitialRunTraceInput): RunTraceResponse {
  return buildInitialRunTrace(input)
}

export function buildRewriteRunTrace(input: BuildInitialRunTraceInput): RunTraceResponse {
  return buildInitialRunTrace(input)
}

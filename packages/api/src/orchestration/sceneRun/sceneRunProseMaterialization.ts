import type {
  CanonPatchArtifactDetailRecord,
  ProposalSetArtifactDetailRecord,
  ProseDraftArtifactDetailRecord,
  RunArtifactRelatedAssetRecord,
  RunSelectedProposalVariantRecord,
  SceneAcceptedFactModel,
  SceneProseViewModel,
  SceneTraceAssetRefModel,
  SceneTraceProposalRefModel,
} from '../../contracts/api-records.js'

type SceneProseMaterialization = Pick<
  SceneProseViewModel,
  'proseDraft' | 'draftWordCount' | 'statusLabel' | 'latestDiffSummary' | 'traceSummary'
>

function mapRelatedAsset(asset: RunArtifactRelatedAssetRecord): SceneTraceAssetRefModel {
  return {
    assetId: asset.assetId,
    title: asset.label.en,
    kind: asset.kind,
  }
}

function findSelectedVariant(
  selectedVariants: RunSelectedProposalVariantRecord[] | undefined,
  proposalId: string,
) {
  return selectedVariants?.find((selectedVariant) => selectedVariant.proposalId === proposalId)
}

function describeSelectedVariant(
  proposalSet: ProposalSetArtifactDetailRecord | undefined,
  selectedVariant: RunSelectedProposalVariantRecord | undefined,
) {
  if (!selectedVariant) {
    return undefined
  }

  const proposal = proposalSet?.proposals.find((candidate) => candidate.id === selectedVariant.proposalId)
  const variant = proposal?.variants?.find((candidate) => candidate.id === selectedVariant.variantId)
  if (!variant) {
    return `Selected variant ${selectedVariant.variantId}`
  }

  return `Selected variant ${variant.label.en}: ${variant.summary.en} Rationale: ${variant.rationale.en}`
}

function buildSourceProposalRef(
  proposalId: string,
  input: {
    proposalSet?: ProposalSetArtifactDetailRecord
    selectedVariants?: RunSelectedProposalVariantRecord[]
  },
): SceneTraceProposalRefModel {
  const proposal = input.proposalSet?.proposals.find((candidate) => candidate.id === proposalId)
  const selectedVariant = findSelectedVariant(input.selectedVariants, proposalId)
  const selectedVariantSummary = describeSelectedVariant(input.proposalSet, selectedVariant)
  const proposalTitle = proposal?.title.en ?? `Generated from ${proposalId}`

  return {
    proposalId,
    title: selectedVariantSummary ? `${proposalTitle} - ${selectedVariantSummary}` : proposalTitle,
    sourceTraceId: proposal?.id,
  }
}

export function buildAcceptedFactsFromCanonPatch(
  canonPatch: CanonPatchArtifactDetailRecord | undefined,
): SceneAcceptedFactModel[] {
  if (!canonPatch) {
    return []
  }

  return canonPatch.acceptedFacts.map((fact) => ({
    id: fact.id,
    label: fact.label.en,
    value: fact.value.en,
    sourceProposals: fact.sourceProposalIds.map((proposalId) => buildSourceProposalRef(proposalId, {
      selectedVariants: fact.selectedVariants ?? canonPatch.selectedVariants,
    })),
    relatedAssets: fact.relatedAssets.map(mapRelatedAsset),
  }))
}

export function buildSceneProseFromProseDraftArtifact(input: {
  proseDraft: ProseDraftArtifactDetailRecord
  canonPatch?: CanonPatchArtifactDetailRecord
  proposalSet?: ProposalSetArtifactDetailRecord
}): SceneProseMaterialization {
  const { proseDraft, canonPatch, proposalSet } = input
  const sourceProposals = proseDraft.sourceProposalIds.map((proposalId) => buildSourceProposalRef(proposalId, {
    proposalSet,
    selectedVariants: proseDraft.selectedVariants ?? canonPatch?.selectedVariants,
  }))

  return {
    proseDraft: proseDraft.body?.en ?? proseDraft.excerpt.en,
    draftWordCount: proseDraft.wordCount,
    statusLabel: proseDraft.statusLabel.en || `Generated from ${proseDraft.id}`,
    latestDiffSummary: proseDraft.summary.en,
    traceSummary: {
      sourcePatchId: proseDraft.sourceCanonPatchId,
      sourceProposals,
      acceptedFactIds: canonPatch?.acceptedFacts.map((fact) => fact.id) ?? [],
      relatedAssets: proseDraft.relatedAssets.map(mapRelatedAsset),
      missingLinks: [],
    },
  }
}

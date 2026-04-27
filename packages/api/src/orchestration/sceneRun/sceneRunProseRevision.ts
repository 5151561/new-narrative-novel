import type { SceneProseViewModel } from '../../contracts/api-records.js'
import type {
  SceneProseWriterGatewayProvenance,
} from '../modelGateway/sceneProseWriterGateway.js'
import type { SceneProseWriterOutput } from '../modelGateway/sceneProseWriterOutputSchema.js'

type SceneProseRevisionMode = SceneProseViewModel['revisionModes'][number]

const REVISION_DIFF_SUMMARIES: Record<SceneProseRevisionMode, string> = {
  rewrite: 'Revision queued: rewrite pass will rebuild the draft while preserving accepted provenance.',
  compress: 'Revision queued: compress pass will tighten the draft without changing accepted facts.',
  expand: 'Revision queued: expand pass will add supporting beats while keeping trace links intact.',
  tone_adjust: 'Revision queued: tone adjustment pass will refine voice while preserving the draft body.',
  continuity_fix: 'Revision queued: continuity fix pass will check accepted facts and missing links.',
}

export function applySceneProseRevisionRequest(input: {
  prose: SceneProseViewModel
  revisionMode: SceneProseRevisionMode
}): SceneProseViewModel {
  return {
    ...input.prose,
    revisionQueueCount: (input.prose.revisionQueueCount ?? 0) + 1,
    latestDiffSummary: REVISION_DIFF_SUMMARIES[input.revisionMode],
    statusLabel: 'Revision queued',
  }
}

export function applySceneProseRevisionCandidate(input: {
  prose: SceneProseViewModel
  revisionId: string
  revisionMode: SceneProseRevisionMode
  instruction?: string
  output: SceneProseWriterOutput
  sourceProseDraftId: string
  sourceCanonPatchId: string
  contextPacketId: string
  provenance: SceneProseWriterGatewayProvenance
}): SceneProseViewModel {
  return {
    ...input.prose,
    revisionQueueCount: 1,
    latestDiffSummary: input.output.diffSummary,
    statusLabel: 'Revision candidate ready',
    revisionCandidate: {
      revisionId: input.revisionId,
      revisionMode: input.revisionMode,
      ...(input.instruction ? { instruction: input.instruction } : {}),
      proseBody: input.output.body.en,
      diffSummary: input.output.diffSummary,
      sourceProseDraftId: input.sourceProseDraftId,
      sourceCanonPatchId: input.sourceCanonPatchId,
      contextPacketId: input.contextPacketId,
      ...(input.provenance.provider === 'fixture'
        ? {
            fallbackProvenance: {
              provider: 'fixture' as const,
              modelId: input.provenance.modelId,
              ...(input.provenance.fallbackReason ? { fallbackReason: input.provenance.fallbackReason } : {}),
            },
          }
        : {}),
    },
  }
}

export function acceptSceneProseRevisionCandidate(input: {
  prose: SceneProseViewModel
}): SceneProseViewModel {
  const candidate = input.prose.revisionCandidate
  if (!candidate) {
    return input.prose
  }

  const nextTraceSummary = input.prose.traceSummary
    ? {
        ...input.prose.traceSummary,
        sourcePatchId: candidate.sourceCanonPatchId,
        sourceProseDraftId: buildAcceptedRevisionProseDraftId(candidate.revisionId),
        contextPacketId: candidate.contextPacketId,
      }
    : {
        sourcePatchId: candidate.sourceCanonPatchId,
        sourceProseDraftId: buildAcceptedRevisionProseDraftId(candidate.revisionId),
        contextPacketId: candidate.contextPacketId,
      }

  return {
    ...input.prose,
    proseDraft: candidate.proseBody,
    draftWordCount: countWords(candidate.proseBody),
    latestDiffSummary: candidate.diffSummary,
    revisionQueueCount: 0,
    statusLabel: 'Updated',
    traceSummary: nextTraceSummary,
    revisionCandidate: undefined,
  }
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length
}

function buildAcceptedRevisionProseDraftId(revisionId: string) {
  return `accepted-prose-revision-${revisionId}`
}

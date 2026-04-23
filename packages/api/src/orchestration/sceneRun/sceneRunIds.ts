function toSequenceLabel(sequence: number) {
  return String(sequence).padStart(3, '0')
}

export function buildRunId(sceneId: string, sequence: number) {
  return `run-${sceneId}-${toSequenceLabel(sequence)}`
}

export function buildRunEventId(runId: string, order: number) {
  return `${runId.replace(/^run-/, 'run-event-')}-${toSequenceLabel(order)}`
}

export function buildReviewId(sceneId: string, sequence: number) {
  return `review-${sceneId}-${toSequenceLabel(sequence)}`
}

export function buildContextPacketId(sceneId: string, sequence: number) {
  return `ctx-${sceneId}-run-${toSequenceLabel(sequence)}`
}

export function buildProposalSetId(sceneId: string, sequence: number) {
  return `proposal-set-${sceneId}-run-${toSequenceLabel(sequence)}`
}

export function buildAgentInvocationId(sceneId: string, sequence: number, index: number) {
  return `agent-invocation-${sceneId}-run-${toSequenceLabel(sequence)}-${toSequenceLabel(index)}`
}

export function buildCanonPatchId(sceneId: string, sequence: number) {
  return `canon-patch-${sceneId}-${toSequenceLabel(sequence)}`
}

export function buildProseDraftId(sceneId: string, sequence: number) {
  return `prose-draft-${sceneId}-${toSequenceLabel(sequence)}`
}

export { toSequenceLabel }

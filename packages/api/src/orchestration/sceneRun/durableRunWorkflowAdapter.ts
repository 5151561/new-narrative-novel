import type {
  RunEventRecord,
  RunRecord,
  RunReviewDecisionKind,
  RunSelectedProposalVariantRecord,
} from '../../contracts/api-records.js'
import type { PersistedRunStore } from '../../repositories/project-state-persistence.js'

import type { SceneRunArtifactRecord } from './sceneRunRecords.js'

export interface DurablePersistedRunStateRecord {
  sequence: number
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
  latestReviewDecision?: RunReviewDecisionKind
  selectedVariants?: RunSelectedProposalVariantRecord[]
}

interface DurableRunStateLike {
  sequence: number
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
  latestReviewDecision?: RunReviewDecisionKind
  selectedVariants?: RunSelectedProposalVariantRecord[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toJsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRunReviewDecisionKind(value: string): value is RunReviewDecisionKind {
  return value === 'accept'
    || value === 'accept-with-edit'
    || value === 'request-rewrite'
    || value === 'reject'
}

function isSelectedProposalVariantRecord(value: unknown): value is RunSelectedProposalVariantRecord {
  return isRecord(value)
    && typeof value.proposalId === 'string'
    && typeof value.variantId === 'string'
}

function isDurablePersistedRunStateRecord(value: unknown): value is DurablePersistedRunStateRecord {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.sequence === 'number'
    && Number.isFinite(value.sequence)
    && isRecord(value.run)
    && typeof value.run.id === 'string'
    && Array.isArray(value.events)
    && Array.isArray(value.artifacts)
    && (value.latestReviewDecision === undefined
      || (typeof value.latestReviewDecision === 'string' && isRunReviewDecisionKind(value.latestReviewDecision)))
    && (value.selectedVariants === undefined
      || (Array.isArray(value.selectedVariants) && value.selectedVariants.every(isSelectedProposalVariantRecord)))
}

function invalidPersistedRunStoreError(message: string) {
  return new Error(`Invalid durable run store snapshot: ${message}`)
}

function sanitizeSceneSequences(sceneSequences: PersistedRunStore['sceneSequences']) {
  if (!isRecord(sceneSequences)) {
    throw invalidPersistedRunStoreError('sceneSequences must be a record.')
  }

  const validated = {} as Record<string, number>
  for (const [sceneId, sequence] of Object.entries(sceneSequences)) {
    if (typeof sequence !== 'number' || !Number.isFinite(sequence)) {
      throw invalidPersistedRunStoreError(`sceneSequences.${sceneId} must be a finite number.`)
    }

    validated[sceneId] = sequence
  }

  return validated
}

export function serializeDurableRunState(state: DurableRunStateLike): DurablePersistedRunStateRecord {
  return toJsonClone({
    sequence: state.sequence,
    run: state.run,
    events: state.events,
    artifacts: state.artifacts,
    latestReviewDecision: state.latestReviewDecision,
    selectedVariants: state.selectedVariants ?? [],
  })
}

export function hydrateDurableRunStates<TRunState>(input: {
  snapshot: PersistedRunStore
  createRunState: (serialized: DurablePersistedRunStateRecord) => TRunState
}): {
  states: TRunState[]
  sceneSequences: Record<string, number>
} {
  if (!Array.isArray(input.snapshot.runStates)) {
    throw invalidPersistedRunStoreError('runStates must be an array.')
  }

  const sceneSequences = sanitizeSceneSequences(input.snapshot.sceneSequences)
  const states = [] as TRunState[]

  input.snapshot.runStates.forEach((entry, index) => {
    if (!isDurablePersistedRunStateRecord(entry)) {
      throw invalidPersistedRunStoreError(`runStates[${index}] is invalid or unsupported.`)
    }

    try {
      states.push(input.createRunState(serializeDurableRunState(entry)))
    } catch (error) {
      throw invalidPersistedRunStoreError(
        `runStates[${index}] could not be hydrated: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
    }
  })

  return {
    states,
    sceneSequences: toJsonClone(sceneSequences),
  }
}

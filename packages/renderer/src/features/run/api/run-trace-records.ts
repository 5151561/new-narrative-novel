import type { LocalizedTextRecord } from './run-artifact-records'

export type RunTraceNodeKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'proposal'
  | 'review'
  | 'canon-patch'
  | 'canon-fact'
  | 'prose-draft'
  | 'asset'

export type RunTraceRelation =
  | 'used_context'
  | 'generated'
  | 'proposed'
  | 'reviewed_by'
  | 'accepted_into'
  | 'rendered_as'
  | 'mentions'

export interface RunTraceNodeRecord {
  id: string
  kind: RunTraceNodeKind
  label: LocalizedTextRecord
}

export interface RunTraceLinkRecord {
  id: string
  from: {
    kind: RunTraceNodeKind
    id: string
  }
  to: {
    kind: RunTraceNodeKind
    id: string
  }
  relation: RunTraceRelation
  label: LocalizedTextRecord
}

export interface RunTraceResponse {
  runId: string
  links: RunTraceLinkRecord[]
  nodes: RunTraceNodeRecord[]
  summary: {
    proposalSetCount: number
    canonPatchCount: number
    proseDraftCount: number
    missingTraceCount: number
  }
}

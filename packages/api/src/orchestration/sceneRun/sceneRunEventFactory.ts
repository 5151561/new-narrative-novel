import type {
  RunEventKind,
  RunEventRecord,
  RunEventRefRecord,
} from '../../contracts/api-records.js'
import { buildRunEventId } from './sceneRunIds.js'
import { buildDefaultSceneRunTimelineLabel } from './sceneRunTimeline.js'
import type { SceneRunTimelineLabelBuilder } from './sceneRunRecords.js'

interface SceneRunEventFactoryOptions {
  buildTimelineLabel?: SceneRunTimelineLabelBuilder
  metadata?: RunEventRecord['metadata']
}

export function createRunEvent(
  runId: string,
  order: number,
  kind: RunEventKind,
  label: string,
  summary: string,
  refs?: RunEventRefRecord[],
  options?: SceneRunEventFactoryOptions,
): RunEventRecord {
  return {
    id: buildRunEventId(runId, order),
    runId,
    order,
    kind,
    label,
    summary,
    createdAtLabel: (options?.buildTimelineLabel ?? buildDefaultSceneRunTimelineLabel)(order),
    refs,
    ...(options?.metadata ? { metadata: options.metadata } : {}),
  }
}

export function appendRunEvent(
  events: RunEventRecord[],
  runId: string,
  kind: RunEventKind,
  label: string,
  summary: string,
  refs?: RunEventRefRecord[],
  options?: SceneRunEventFactoryOptions,
) {
  const event = createRunEvent(runId, events.length + 1, kind, label, summary, refs, options)
  events.push(event)
  return event
}

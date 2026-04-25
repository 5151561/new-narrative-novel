import type { SceneProseViewModel } from '../../contracts/api-records.js'

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

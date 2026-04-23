import { describe, expect, it } from 'vitest'

import { createRunFixtureStore } from '../../repositories/runFixtureStore.js'
import { buildFixtureSceneRunTimelineLabel } from './sceneRunTimeline.js'
import { startSceneRunWorkflow } from './sceneRunWorkflow.js'

describe('startSceneRunWorkflow parity with legacy runFixtureStore start', () => {
  it('matches the legacy run and event payloads for the same scene run input', () => {
    const projectId = 'parity-project'
    const input = {
      sceneId: 'scene-parity-check',
      mode: 'rewrite' as const,
      note: 'Parity guard note.',
    }

    const store = createRunFixtureStore()
    const legacyRun = store.startSceneRun(projectId, input)

    const legacyEvents = [] as Awaited<ReturnType<typeof store.getRunEvents>>['events']
    let cursor: string | undefined
    do {
      const page = store.getRunEvents(projectId, {
        runId: legacyRun.id,
        cursor,
      })
      legacyEvents.push(...page.events)
      cursor = page.nextCursor
    } while (cursor)

    const workflow = startSceneRunWorkflow({
      ...input,
      sequence: 1,
    }, {
      buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
    })

    expect(workflow.run).toEqual(legacyRun)
    expect(workflow.events).toEqual(legacyEvents)
  })
})

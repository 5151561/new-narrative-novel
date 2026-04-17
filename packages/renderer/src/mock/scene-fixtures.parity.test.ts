import { describe, expect, it } from 'vitest'

import { mockChapterRecords } from '@/features/chapter/api/mock-chapter-db'

import { getSceneFixture } from './scene-fixtures'

describe('scene fixture parity', () => {
  const lightweightSceneIds = [
    'scene-concourse-delay',
    'scene-ticket-window',
    'scene-departure-bell',
    'scene-canal-watch',
    'scene-dawn-slip',
  ] as const

  function expectZhCoherentField(english: string | undefined, chinese: string | undefined) {
    expect(chinese).toBeTruthy()
    expect(chinese).not.toBe(english)
    expect(chinese).toMatch(/\p{Script=Han}/u)
  }

  it('defines every scene referenced by chapter mock data in both supported locales', () => {
    const sceneIds = Object.values(mockChapterRecords).flatMap((chapter) => chapter.scenes.map((scene) => scene.id))

    for (const sceneId of sceneIds) {
      expect(() => getSceneFixture(sceneId, 'en')).not.toThrow()
      expect(() => getSceneFixture(sceneId, 'zh-CN')).not.toThrow()
    }
  })

  it.each(lightweightSceneIds)('keeps directly rendered scene-scope fields coherent in zh-CN for %s', (sceneId) => {
    const english = getSceneFixture(sceneId, 'en')
    const chinese = getSceneFixture(sceneId, 'zh-CN')

    expectZhCoherentField(english.workspace.availableThreads[0]?.label, chinese.workspace.availableThreads[0]?.label)
    if (english.workspace.currentVersionLabel) {
      expectZhCoherentField(english.workspace.currentVersionLabel, chinese.workspace.currentVersionLabel)
    }
    expectZhCoherentField(english.setup.objective.externalGoal, chinese.setup.objective.externalGoal)
    expectZhCoherentField(english.setup.cast[0]?.name, chinese.setup.cast[0]?.name)
    expectZhCoherentField(english.setup.cast[0]?.role, chinese.setup.cast[0]?.role)
    expectZhCoherentField(english.setup.cast[0]?.agenda, chinese.setup.cast[0]?.agenda)
    expectZhCoherentField(english.setup.constraints[0]?.label, chinese.setup.constraints[0]?.label)
    expectZhCoherentField(english.setup.constraints[0]?.summary, chinese.setup.constraints[0]?.summary)
    expectZhCoherentField(english.setup.knowledgeBoundaries[0]?.label, chinese.setup.knowledgeBoundaries[0]?.label)
    expectZhCoherentField(english.setup.knowledgeBoundaries[0]?.summary, chinese.setup.knowledgeBoundaries[0]?.summary)
    expectZhCoherentField(english.execution.beats[0]?.title, chinese.execution.beats[0]?.title)
    expectZhCoherentField(english.execution.beats[0]?.summary, chinese.execution.beats[0]?.summary)
    expectZhCoherentField(english.execution.proposals[0]?.actor.name, chinese.execution.proposals[0]?.actor.name)
    expectZhCoherentField(english.execution.proposals[0]?.title, chinese.execution.proposals[0]?.title)
    expectZhCoherentField(english.execution.proposals[0]?.summary, chinese.execution.proposals[0]?.summary)
    expectZhCoherentField(english.execution.proposals[0]?.affects[0]?.label, chinese.execution.proposals[0]?.affects[0]?.label)
    expectZhCoherentField(
      english.execution.proposals[0]?.affects[0]?.deltaSummary,
      chinese.execution.proposals[0]?.affects[0]?.deltaSummary,
    )
    expectZhCoherentField(english.execution.proposals[0]?.risks?.[0]?.message, chinese.execution.proposals[0]?.risks?.[0]?.message)
    expectZhCoherentField(english.prose.proseDraft, chinese.prose.proseDraft)
    expectZhCoherentField(english.prose.latestDiffSummary, chinese.prose.latestDiffSummary)
    expectZhCoherentField(english.inspector.context.privateInfoGuard.summary, chinese.inspector.context.privateInfoGuard.summary)
    expectZhCoherentField(
      english.inspector.context.privateInfoGuard.items[0]?.label,
      chinese.inspector.context.privateInfoGuard.items[0]?.label,
    )
    expectZhCoherentField(
      english.inspector.context.localState[0]?.label,
      chinese.inspector.context.localState[0]?.label,
    )
    expectZhCoherentField(
      english.inspector.context.localState[0]?.value,
      chinese.inspector.context.localState[0]?.value,
    )
    expectZhCoherentField(english.inspector.context.overrides[0]?.label, chinese.inspector.context.overrides[0]?.label)
    expectZhCoherentField(english.inspector.versions.checkpoints[0]?.label, chinese.inspector.versions.checkpoints[0]?.label)
    expectZhCoherentField(english.inspector.runtime.profile.label, chinese.inspector.runtime.profile.label)
    expectZhCoherentField(english.dock.trace[0]?.title, chinese.dock.trace[0]?.title)
    expectZhCoherentField(english.dock.cost.trendLabel, chinese.dock.cost.trendLabel)
    expectZhCoherentField(english.dock.cost.breakdown[0]?.label, chinese.dock.cost.breakdown[0]?.label)
  })
})

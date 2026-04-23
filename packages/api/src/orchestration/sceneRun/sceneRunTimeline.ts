import type { SceneRunTimelineLabelBuilder } from './sceneRunRecords.js'

export const buildDefaultSceneRunTimelineLabel: SceneRunTimelineLabelBuilder = (order) =>
  `step-${String(order).padStart(3, '0')}`

export const buildFixtureSceneRunTimelineLabel: SceneRunTimelineLabelBuilder = (order) =>
  `2026-04-23 10:${String(order).padStart(2, '0')}`

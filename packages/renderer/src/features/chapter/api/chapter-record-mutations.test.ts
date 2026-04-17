import { describe, expect, it } from 'vitest'

import type { ChapterStructureWorkspaceRecord } from './chapter-records'
import {
  mergeLocalizedChapterText,
  normalizeSceneOrders,
  patchChapterRecordScene,
  reorderChapterRecordScenes,
} from './chapter-record-mutations'

function createRecord(): ChapterStructureWorkspaceRecord {
  return {
    chapterId: 'chapter-test',
    title: {
      en: 'Signals in Rain',
      'zh-CN': '雨中信号',
    },
    summary: {
      en: 'Chapter summary',
      'zh-CN': '章节摘要',
    },
    viewsMeta: {
      availableViews: ['sequence', 'outliner', 'assembly'],
    },
    scenes: [
      {
        id: 'scene-a',
        order: 4,
        title: { en: 'A', 'zh-CN': '甲' },
        summary: { en: 'A summary', 'zh-CN': '甲摘要' },
        purpose: { en: 'A purpose', 'zh-CN': '甲目的' },
        pov: { en: 'A pov', 'zh-CN': '甲视角' },
        location: { en: 'A location', 'zh-CN': '甲地点' },
        conflict: { en: 'A conflict', 'zh-CN': '甲冲突' },
        reveal: { en: 'A reveal', 'zh-CN': '甲揭示' },
        statusLabel: { en: 'Current', 'zh-CN': '当前' },
        proseStatusLabel: { en: 'Needs draft', 'zh-CN': '待起草' },
        runStatusLabel: { en: 'Idle', 'zh-CN': '未开始' },
        unresolvedCount: 1,
        lastRunLabel: { en: 'Run 01', 'zh-CN': '运行 01' },
      },
      {
        id: 'scene-b',
        order: 2,
        title: { en: 'B', 'zh-CN': '乙' },
        summary: { en: 'B summary', 'zh-CN': '乙摘要' },
        purpose: { en: 'B purpose', 'zh-CN': '乙目的' },
        pov: { en: 'B pov', 'zh-CN': '乙视角' },
        location: { en: 'B location', 'zh-CN': '乙地点' },
        conflict: { en: 'B conflict', 'zh-CN': '乙冲突' },
        reveal: { en: 'B reveal', 'zh-CN': '乙揭示' },
        statusLabel: { en: 'Queued', 'zh-CN': '排队中' },
        proseStatusLabel: { en: 'Queued', 'zh-CN': '排队中' },
        runStatusLabel: { en: 'Idle', 'zh-CN': '未开始' },
        unresolvedCount: 2,
        lastRunLabel: { en: 'Run 02', 'zh-CN': '运行 02' },
      },
      {
        id: 'scene-c',
        order: 9,
        title: { en: 'C', 'zh-CN': '丙' },
        summary: { en: 'C summary', 'zh-CN': '丙摘要' },
        purpose: { en: 'C purpose', 'zh-CN': '丙目的' },
        pov: { en: 'C pov', 'zh-CN': '丙视角' },
        location: { en: 'C location', 'zh-CN': '丙地点' },
        conflict: { en: 'C conflict', 'zh-CN': '丙冲突' },
        reveal: { en: 'C reveal', 'zh-CN': '丙揭示' },
        statusLabel: { en: 'Guarded', 'zh-CN': '受控' },
        proseStatusLabel: { en: 'Guarded', 'zh-CN': '受控' },
        runStatusLabel: { en: 'Paused', 'zh-CN': '已暂停' },
        unresolvedCount: 3,
        lastRunLabel: { en: 'Run 03', 'zh-CN': '运行 03' },
      },
    ],
    inspector: {
      chapterNotes: [{ en: 'Keep notes', 'zh-CN': '保留备注' }],
      problemsSummary: [
        {
          id: 'problem-1',
          label: { en: 'Problem', 'zh-CN': '问题' },
          detail: { en: 'Detail', 'zh-CN': '细节' },
        },
      ],
      assemblyHints: [
        {
          id: 'hint-1',
          label: { en: 'Hint', 'zh-CN': '提示' },
          detail: { en: 'Hint detail', 'zh-CN': '提示细节' },
        },
      ],
    },
  }
}

describe('chapter record mutations', () => {
  it('normalizes scene orders to 1..n without mutating the input record', () => {
    const record = createRecord()

    const normalized = normalizeSceneOrders(record)

    expect(normalized.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-b', 1],
      ['scene-a', 2],
      ['scene-c', 3],
    ])
    expect(record.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-a', 4],
      ['scene-b', 2],
      ['scene-c', 9],
    ])
    expect(normalized.inspector).toEqual(record.inspector)
  })

  it('reorders the target scene and renormalizes orders while preserving other scene fields', () => {
    const record = createRecord()

    const reordered = reorderChapterRecordScenes(record, 'scene-c', 0)

    expect(reordered.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-c', 1],
      ['scene-b', 2],
      ['scene-a', 3],
    ])
    expect(reordered.scenes[0]).toMatchObject({
      id: 'scene-c',
      summary: { en: 'C summary', 'zh-CN': '丙摘要' },
      statusLabel: { en: 'Guarded', 'zh-CN': '受控' },
      lastRunLabel: { en: 'Run 03', 'zh-CN': '运行 03' },
    })
    expect(record.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-a', 4],
      ['scene-b', 2],
      ['scene-c', 9],
    ])
  })

  it('clamps reorder targetIndex to the normalized scene bounds', () => {
    const record = createRecord()

    const reordered = reorderChapterRecordScenes(record, 'scene-a', 99)

    expect(reordered.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-b', 1],
      ['scene-c', 2],
      ['scene-a', 3],
    ])
  })

  it('treats reorder for an unknown scene id as a true no-op on the record contents', () => {
    const record = createRecord()

    const reordered = reorderChapterRecordScenes(record, 'scene-missing', 0)

    expect(reordered).toBe(record)
    expect(reordered).toEqual(record)
    expect(reordered.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-a', 4],
      ['scene-b', 2],
      ['scene-c', 9],
    ])
  })

  it('patches only the active locale for structure fields and preserves the other locale', () => {
    const record = createRecord()

    const patched = patchChapterRecordScene(
      record,
      'scene-b',
      {
        summary: 'Updated English summary',
        purpose: 'Updated English purpose',
        reveal: 'Updated English reveal',
      },
      'en',
    )

    expect(patched.scenes.find((scene) => scene.id === 'scene-b')).toMatchObject({
      summary: { en: 'Updated English summary', 'zh-CN': '乙摘要' },
      purpose: { en: 'Updated English purpose', 'zh-CN': '乙目的' },
      reveal: { en: 'Updated English reveal', 'zh-CN': '乙揭示' },
      conflict: { en: 'B conflict', 'zh-CN': '乙冲突' },
      statusLabel: { en: 'Queued', 'zh-CN': '排队中' },
      runStatusLabel: { en: 'Idle', 'zh-CN': '未开始' },
    })
    expect(record.scenes.find((scene) => scene.id === 'scene-b')?.summary).toEqual({
      en: 'B summary',
      'zh-CN': '乙摘要',
    })
  })

  it('patches zh-CN structure fields without touching chapter-level inspector summaries or hints', () => {
    const record = createRecord()

    const patched = patchChapterRecordScene(
      record,
      'scene-a',
      {
        location: '新地点',
        conflict: '新冲突',
        pov: '新视角',
      },
      'zh-CN',
    )

    expect(patched.scenes.find((scene) => scene.id === 'scene-a')).toMatchObject({
      location: { en: 'A location', 'zh-CN': '新地点' },
      conflict: { en: 'A conflict', 'zh-CN': '新冲突' },
      pov: { en: 'A pov', 'zh-CN': '新视角' },
    })
    expect(patched.inspector.problemsSummary).toEqual(record.inspector.problemsSummary)
    expect(patched.inspector.assemblyHints).toEqual(record.inspector.assemblyHints)
  })

  it('treats patch for an unknown scene id as a true no-op on the record contents', () => {
    const record = createRecord()

    const patched = patchChapterRecordScene(
      record,
      'scene-missing',
      {
        summary: 'Should not apply',
        conflict: 'Should not apply',
      },
      'en',
    )

    expect(patched).toBe(record)
    expect(patched).toEqual(record)
  })

  it('merges localized chapter text for one locale only', () => {
    expect(
      mergeLocalizedChapterText(
        {
          en: 'Original',
          'zh-CN': '原文',
        },
        'zh-CN',
        '更新后',
      ),
    ).toEqual({
      en: 'Original',
      'zh-CN': '更新后',
    })
  })
})

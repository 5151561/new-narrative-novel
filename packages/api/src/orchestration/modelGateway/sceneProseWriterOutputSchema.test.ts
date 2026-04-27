import { describe, expect, it } from 'vitest'

import {
  parseSceneProseWriterOutput,
  validateSceneProseWriterOutput,
} from './sceneProseWriterOutputSchema.js'

describe('sceneProseWriterOutputSchema', () => {
  it('accepts valid writer output, trims strings, and derives wordCount from body.en', () => {
    const parsed = parseSceneProseWriterOutput({
      body: {
        en: '  Midnight Platform opens on the stable arrival beat before the reveal turns.  ',
        'zh-CN': '  Midnight Platform 先以稳定的抵达节拍开场，再推进揭示。  ',
      },
      excerpt: {
        en: '  Midnight Platform settles into view before the reveal turns visible.  ',
        'zh-CN': '  Midnight Platform 先稳稳落入视野，随后揭示开始显形。  ',
      },
      relatedAssets: [
        {
          assetId: 'asset-scene-midnight-platform-lead',
          kind: 'character',
          label: {
            en: '  Midnight Platform lead  ',
            'zh-CN': '  Midnight Platform 主角  ',
          },
        },
      ],
    })

    expect(parsed).toEqual({
      body: {
        en: 'Midnight Platform opens on the stable arrival beat before the reveal turns.',
        'zh-CN': 'Midnight Platform 先以稳定的抵达节拍开场，再推进揭示。',
      },
      excerpt: {
        en: 'Midnight Platform settles into view before the reveal turns visible.',
        'zh-CN': 'Midnight Platform 先稳稳落入视野，随后揭示开始显形。',
      },
      wordCount: 12,
      relatedAssets: [
        {
          assetId: 'asset-scene-midnight-platform-lead',
          kind: 'character',
          label: {
            en: 'Midnight Platform lead',
            'zh-CN': 'Midnight Platform 主角',
          },
        },
      ],
    })
  })

  it('rejects empty or malformed writer output payloads', () => {
    expect(validateSceneProseWriterOutput({
      body: {
        en: '',
        'zh-CN': '有效',
      },
      excerpt: {
        en: 'Valid',
        'zh-CN': '有效',
      },
      relatedAssets: [],
    })).toBe(false)

    expect(() => parseSceneProseWriterOutput({
      body: {
        en: 'Valid body',
        'zh-CN': '有效正文',
      },
      excerpt: {
        en: 'Valid excerpt',
        'zh-CN': '有效摘要',
      },
      relatedAssets: [
        {
          assetId: 'asset-scene-midnight-platform-lead',
          kind: 'unsupported',
          label: {
            en: 'Lead',
            'zh-CN': '主角',
          },
        },
      ],
    })).toThrowError('/relatedAssets/0/kind must be equal to one of the allowed values')
  })
})

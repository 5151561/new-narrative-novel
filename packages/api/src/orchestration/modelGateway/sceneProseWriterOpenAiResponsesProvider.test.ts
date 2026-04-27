import { describe, expect, it, vi } from 'vitest'

import { createSceneProseWriterOpenAiResponsesProvider } from './sceneProseWriterOpenAiResponsesProvider.js'
import { sceneProseWriterOpenAiOutputSchema } from './sceneProseWriterOutputSchema.js'

function createRequest() {
  return {
    sceneId: 'scene-midnight-platform',
    decision: 'accept' as const,
    acceptedProposalIds: ['proposal-set-scene-midnight-platform-run-002-proposal-001'],
    instructions: 'Return accepted scene prose only.',
    input: 'Scene: Midnight Platform. Accepted proposal: proposal-set-scene-midnight-platform-run-002-proposal-001.',
  }
}

describe('createSceneProseWriterOpenAiResponsesProvider', () => {
  it('calls the Responses API with strict structured output for accepted prose drafts', async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        body: {
          en: 'Midnight Platform opens on the accepted beat.',
          'zh-CN': 'Midnight Platform 以已接受节拍开场。',
        },
        excerpt: {
          en: 'Midnight Platform settles into view.',
          'zh-CN': 'Midnight Platform 落入视野。',
        },
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
      }),
    })

    const provider = createSceneProseWriterOpenAiResponsesProvider({
      modelId: 'gpt-5.4',
      apiKey: 'sk-test',
      client: {
        responses: {
          create,
        },
      },
    })

    await provider.generate(createRequest())

    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({
      model: 'gpt-5.4',
      instructions: 'Return accepted scene prose only.',
      input: 'Scene: Midnight Platform. Accepted proposal: proposal-set-scene-midnight-platform-run-002-proposal-001.',
      text: {
        format: {
          name: 'scene_prose_writer_output',
          type: 'json_schema',
          strict: true,
          description: 'Structured accepted scene prose draft output.',
          schema: sceneProseWriterOpenAiOutputSchema,
        },
      },
    })
  })

  it('parses valid structured prose output without exposing raw response envelopes', async () => {
    const provider = createSceneProseWriterOpenAiResponsesProvider({
      modelId: 'gpt-5.4',
      apiKey: 'sk-test',
      client: {
        responses: {
          create: vi.fn().mockResolvedValue({
            output_text: JSON.stringify({
              body: {
                en: '  Midnight Platform opens on the accepted beat.  ',
                'zh-CN': '  Midnight Platform 以已接受节拍开场。  ',
              },
              excerpt: {
                en: '  Midnight Platform settles into view.  ',
                'zh-CN': '  Midnight Platform 落入视野。  ',
              },
              relatedAssets: [
                {
                  assetId: 'asset-scene-midnight-platform-setting',
                  kind: 'location',
                  label: {
                    en: '  Midnight Platform setting  ',
                    'zh-CN': '  Midnight Platform 场景地点  ',
                  },
                },
              ],
            }),
          }),
        },
      },
    })

    await expect(provider.generate(createRequest())).resolves.toEqual({
      body: {
        en: 'Midnight Platform opens on the accepted beat.',
        'zh-CN': 'Midnight Platform 以已接受节拍开场。',
      },
      excerpt: {
        en: 'Midnight Platform settles into view.',
        'zh-CN': 'Midnight Platform 落入视野。',
      },
      wordCount: 7,
      relatedAssets: [
        {
          assetId: 'asset-scene-midnight-platform-setting',
          kind: 'location',
          label: {
            en: 'Midnight Platform setting',
            'zh-CN': 'Midnight Platform 场景地点',
          },
        },
      ],
    })
  })

  it('returns raw output text when the provider response is not valid json so the gateway can classify invalid output', async () => {
    const provider = createSceneProseWriterOpenAiResponsesProvider({
      modelId: 'gpt-5.4',
      apiKey: 'sk-test',
      client: {
        responses: {
          create: vi.fn().mockResolvedValue({
            output_text: 'not-json',
          }),
        },
      },
    })

    await expect(provider.generate(createRequest())).resolves.toBe('not-json')
  })
})

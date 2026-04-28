import { describe, expect, it, vi } from 'vitest'

import { createSceneProseWriterFixtureProvider } from './sceneProseWriterFixtureProvider.js'
import { DEFAULT_MODEL_BINDINGS } from './model-binding.js'
import {
  ModelGatewayExecutionError,
  ModelGatewayMissingConfigError,
} from './modelGatewayErrors.js'
import { createSceneProseWriterGateway } from './sceneProseWriterGateway.js'

function createRequest(overrides?: Partial<{
  task: 'draft' | 'revision'
  sceneId: string
  decision: 'accept' | 'accept-with-edit'
  acceptedProposalIds: string[]
  revisionMode: 'rewrite' | 'compress' | 'expand' | 'tone_adjust' | 'continuity_fix'
  currentProse: string
  sourceProseDraftId: string
  sourceCanonPatchId: string
  contextPacketId: string
  instruction: string
  instructions: string
  input: string
}>) {
  return {
    task: 'draft' as const,
    sceneId: 'scene-midnight-platform',
    decision: 'accept' as const,
    acceptedProposalIds: ['proposal-set-scene-midnight-platform-run-002-proposal-001'],
    revisionMode: 'expand' as const,
    currentProse: 'Midnight Platform opens from the accepted run artifact.',
    sourceProseDraftId: 'prose-draft-scene-midnight-platform-run-002',
    sourceCanonPatchId: 'canon-patch-scene-midnight-platform-002',
    contextPacketId: 'ctx-scene-midnight-platform-run-002',
    instruction: 'Lean into the witness reaction.',
    instructions: 'Return accepted scene prose only.',
    input: 'Scene: Midnight Platform. Accepted proposal: proposal-set-scene-midnight-platform-run-002-proposal-001.',
    ...overrides,
  }
}

describe('createSceneProseWriterGateway', () => {
  it('returns deterministic fixture writer output when provider=fixture', async () => {
    const gateway = createSceneProseWriterGateway(
      {
        modelProvider: 'fixture',
      },
      {
        fixtureProvider: createSceneProseWriterFixtureProvider(),
      },
    )

    await expect(gateway.generate(createRequest())).resolves.toEqual({
      output: expect.objectContaining({
        body: expect.objectContaining({
          en: expect.stringContaining('Accepted proposal proposal-set-scene-midnight-platform-run-002-proposal-001 anchors the draft.'),
        }),
        excerpt: {
          en: 'Midnight Platform settles into view before the next reveal turns visible.',
          'zh-CN': 'Midnight Platform 先稳稳落入视野，随后下一段揭示才开始显形。',
        },
        diffSummary: 'Rendered accepted scene prose from the approved canon patch context.',
        wordCount: 50,
      }),
      provenance: {
        provider: 'fixture',
        modelId: 'fixture-scene-prose-writer',
      },
    })
  })

  it('rejects with missing-config when provider=openai but model config is incomplete', async () => {
    const openAiProviderFactory = vi.fn()
    const gateway = createSceneProseWriterGateway(
      {
        modelProvider: 'openai',
        openAiApiKey: 'sk-test',
      },
      {
        fixtureProvider: createSceneProseWriterFixtureProvider(),
        openAiProviderFactory,
      },
    )

    await expect(gateway.generate(createRequest())).rejects.toEqual(new ModelGatewayMissingConfigError({
      provider: 'openai',
      role: 'sceneProseWriter',
    }))
    expect(openAiProviderFactory).not.toHaveBeenCalled()
  })

  it('uses the openai provider when config is complete and the structured output is valid', async () => {
    const openAiProvider = {
      generate: vi.fn().mockResolvedValue({
        body: {
          en: 'Midnight Platform opens on the accepted beat and holds witness pressure.',
          'zh-CN': 'Midnight Platform 以已接受节拍开场，并保持目击压力。',
        },
        excerpt: {
          en: 'Midnight Platform locks the bargain in view.',
          'zh-CN': 'Midnight Platform 将交易锁定在视野中。',
        },
        diffSummary: 'Expanded the arrival beat while preserving accepted provenance.',
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
    }

    const gateway = createSceneProseWriterGateway(
      {
        modelProvider: 'openai',
        openAiModel: 'gpt-5.4',
        openAiApiKey: 'sk-test',
      },
      {
        fixtureProvider: createSceneProseWriterFixtureProvider(),
        openAiProvider,
      },
    )

    await expect(gateway.generate(createRequest())).resolves.toEqual({
      output: {
        body: {
          en: 'Midnight Platform opens on the accepted beat and holds witness pressure.',
          'zh-CN': 'Midnight Platform 以已接受节拍开场，并保持目击压力。',
        },
        excerpt: {
          en: 'Midnight Platform locks the bargain in view.',
          'zh-CN': 'Midnight Platform 将交易锁定在视野中。',
        },
        diffSummary: 'Expanded the arrival beat while preserving accepted provenance.',
        wordCount: 11,
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
      },
      provenance: {
        provider: 'openai',
        modelId: 'gpt-5.4',
      },
    })
    expect(openAiProvider.generate).toHaveBeenCalledWith(createRequest())
  })

  it('uses the scene prose writer binding for draft tasks and the scene revision binding for revision tasks', async () => {
    const openAiProviderFactory = vi
      .fn()
      .mockImplementationOnce(() => ({
        generate: vi.fn().mockResolvedValue({
          body: {
            en: 'Draft prose uses the draft model binding.',
            'zh-CN': '草稿正文使用草稿模型绑定。',
          },
          excerpt: {
            en: 'Draft binding excerpt.',
            'zh-CN': '草稿绑定摘要。',
          },
          diffSummary: 'Draft binding diff summary.',
          relatedAssets: [
            {
              assetId: 'asset-draft-binding',
              kind: 'character',
              label: {
                en: 'Draft binding asset',
                'zh-CN': '草稿绑定素材',
              },
            },
          ],
        }),
      }))
      .mockImplementationOnce(() => ({
        generate: vi.fn().mockResolvedValue({
          body: {
            en: 'Revision prose uses the revision model binding.',
            'zh-CN': '修订正文使用修订模型绑定。',
          },
          excerpt: {
            en: 'Revision binding excerpt.',
            'zh-CN': '修订绑定摘要。',
          },
          diffSummary: 'Revision binding diff summary.',
          relatedAssets: [
            {
              assetId: 'asset-revision-binding',
              kind: 'location',
              label: {
                en: 'Revision binding asset',
                'zh-CN': '修订绑定素材',
              },
            },
          ],
        }),
      }))

    const gateway = createSceneProseWriterGateway(
      {
        modelBindings: {
          ...DEFAULT_MODEL_BINDINGS,
          sceneProseWriter: {
            apiKey: 'sk-draft-value',
            modelId: 'gpt-5.4',
            provider: 'openai',
          },
          sceneRevision: {
            apiKey: 'sk-revision-value',
            modelId: 'gpt-5.4-mini',
            provider: 'openai',
          },
        },
        modelProvider: 'openai',
      },
      {
        fixtureProvider: createSceneProseWriterFixtureProvider(),
        openAiProviderFactory,
      },
    )

    await expect(gateway.generate(createRequest())).resolves.toMatchObject({
      provenance: {
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
    })
    await expect(gateway.generate(createRequest({
      input: 'Current prose: Midnight Platform opens from the accepted run artifact.',
      instructions: 'Return only the revised scene prose and a short diff summary.',
      task: 'revision',
    }))).resolves.toMatchObject({
      provenance: {
        modelId: 'gpt-5.4-mini',
        provider: 'openai',
      },
    })

    expect(openAiProviderFactory).toHaveBeenNthCalledWith(1, {
      apiKey: 'sk-draft-value',
      modelId: 'gpt-5.4',
    })
    expect(openAiProviderFactory).toHaveBeenNthCalledWith(2, {
      apiKey: 'sk-revision-value',
      modelId: 'gpt-5.4-mini',
    })
  })

  it('renders a revision candidate through the fixture provider instead of a queue-only placeholder', async () => {
    const gateway = createSceneProseWriterGateway(
      {
        modelProvider: 'fixture',
      },
      {
        fixtureProvider: createSceneProseWriterFixtureProvider(),
      },
    )

    await expect(gateway.generate(createRequest({
      task: 'revision',
      instructions: 'Return only the revised scene prose and a short diff summary.',
      input: 'Current prose: Midnight Platform opens from the accepted run artifact.',
    }))).resolves.toEqual({
      output: expect.objectContaining({
        body: expect.objectContaining({
          en: expect.stringContaining('Lean into the witness reaction.'),
        }),
        diffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
      }),
      provenance: {
        provider: 'fixture',
        modelId: 'fixture-scene-prose-writer',
      },
    })
  })

  it('rejects with provider_error when the openai provider throws', async () => {
    const gateway = createSceneProseWriterGateway(
      {
        modelProvider: 'openai',
        openAiModel: 'gpt-5.4',
        openAiApiKey: 'sk-test',
      },
      {
        fixtureProvider: createSceneProseWriterFixtureProvider(),
        openAiProvider: {
          generate: vi.fn().mockRejectedValue(new Error('upstream failed')),
        },
      },
    )

    await expect(gateway.generate(createRequest())).rejects.toMatchObject({
      name: ModelGatewayExecutionError.name,
      failureClass: 'provider_error',
      modelId: 'gpt-5.4',
      provider: 'openai',
      role: 'sceneProseWriter',
    })
  })

  it('rejects with invalid_output when the openai provider returns data outside the writer schema', async () => {
    const gateway = createSceneProseWriterGateway(
      {
        modelProvider: 'openai',
        openAiModel: 'gpt-5.4',
        openAiApiKey: 'sk-test',
      },
      {
        fixtureProvider: createSceneProseWriterFixtureProvider(),
        openAiProvider: {
          generate: vi.fn().mockResolvedValue({
            rawPrompt: 'do not leak this',
          }),
        },
      },
    )

    await expect(gateway.generate(createRequest())).rejects.toMatchObject({
      name: ModelGatewayExecutionError.name,
      failureClass: 'invalid_output',
      modelId: 'gpt-5.4',
      provider: 'openai',
      role: 'sceneProseWriter',
    })
  })
})

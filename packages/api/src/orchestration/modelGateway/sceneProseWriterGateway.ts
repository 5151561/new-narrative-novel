import type { RunSelectedProposalVariantRecord } from '../../contracts/api-records.js'
import type { ApiServerConfig } from '../../config.js'

import {
  createSceneProseWriterFixtureProvider,
  FIXTURE_SCENE_PROSE_WRITER_MODEL_ID,
} from './sceneProseWriterFixtureProvider.js'
import {
  createSceneProseWriterOpenAiResponsesProvider,
  type SceneProseWriterOpenAiResponsesProviderOptions,
} from './sceneProseWriterOpenAiResponsesProvider.js'
import {
  parseSceneProseWriterOutput,
  type SceneProseWriterOutput,
} from './sceneProseWriterOutputSchema.js'

export interface SceneProseWriterGatewayRequest {
  sceneId: string
  decision: 'accept' | 'accept-with-edit'
  acceptedProposalIds: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
  instructions: string
  input: string
}

export type SceneProseWriterGatewayFallbackReason =
  | 'missing-config'
  | 'provider-error'
  | 'invalid-output'

export interface SceneProseWriterGatewayProvenance {
  provider: 'fixture' | 'openai'
  modelId: string
  fallbackReason?: SceneProseWriterGatewayFallbackReason
}

export interface SceneProseWriterGatewayResult {
  output: SceneProseWriterOutput
  provenance: SceneProseWriterGatewayProvenance
}

export interface SceneProseWriterProvider {
  generate(request: SceneProseWriterGatewayRequest): Promise<unknown>
}

export interface SceneProseWriterGatewayConfig
  extends Pick<ApiServerConfig, 'modelProvider' | 'openAiModel' | 'openAiApiKey'> {}

export interface SceneProseWriterGatewayDependencies {
  fixtureProvider?: SceneProseWriterProvider
  openAiProvider?: SceneProseWriterProvider
  openAiProviderFactory?: (options: SceneProseWriterOpenAiResponsesProviderOptions) => SceneProseWriterProvider
}

export function createSceneProseWriterGateway(
  config: SceneProseWriterGatewayConfig,
  dependencies: SceneProseWriterGatewayDependencies = {},
) {
  const fixtureProvider = dependencies.fixtureProvider ?? createSceneProseWriterFixtureProvider()
  const openAiProviderFactory = dependencies.openAiProviderFactory ?? createSceneProseWriterOpenAiResponsesProvider

  async function renderFixtureResult(
    request: SceneProseWriterGatewayRequest,
    fallbackReason?: SceneProseWriterGatewayFallbackReason,
  ): Promise<SceneProseWriterGatewayResult> {
    return {
      output: parseSceneProseWriterOutput(await fixtureProvider.generate(request)),
      provenance: {
        provider: 'fixture',
        modelId: FIXTURE_SCENE_PROSE_WRITER_MODEL_ID,
        ...(fallbackReason ? { fallbackReason } : {}),
      },
    }
  }

  return {
    async generate(request: SceneProseWriterGatewayRequest): Promise<SceneProseWriterGatewayResult> {
      if (config.modelProvider !== 'openai') {
        return renderFixtureResult(request)
      }

      if (!config.openAiModel || !config.openAiApiKey) {
        return renderFixtureResult(request, 'missing-config')
      }

      const openAiProvider = dependencies.openAiProvider ?? openAiProviderFactory({
        modelId: config.openAiModel,
        apiKey: config.openAiApiKey,
      })

      let payload: unknown
      try {
        payload = await openAiProvider.generate(request)
      } catch {
        return renderFixtureResult(request, 'provider-error')
      }

      try {
        return {
          output: parseSceneProseWriterOutput(payload),
          provenance: {
            provider: 'openai',
            modelId: config.openAiModel,
          },
        }
      } catch {
        return renderFixtureResult(request, 'invalid-output')
      }
    },
  }
}

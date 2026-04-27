import type { ApiServerConfig } from '../../config.js'
import { createScenePlannerFixtureProvider, FIXTURE_SCENE_PLANNER_MODEL_ID } from './scenePlannerFixtureProvider.js'
import {
  createScenePlannerOpenAiResponsesProvider,
  type ScenePlannerOpenAiResponsesProviderOptions,
} from './scenePlannerOpenAiResponsesProvider.js'
import {
  parseScenePlannerOutput,
  type ScenePlannerOutput,
} from './scenePlannerOutputSchema.js'

export interface ScenePlannerGatewayRequest {
  sceneId: string
  instructions: string
  input: string
}

export type ScenePlannerGatewayFallbackReason =
  | 'missing-config'
  | 'provider-error'
  | 'invalid-output'

export interface ScenePlannerGatewayProvenance {
  provider: 'fixture' | 'openai'
  modelId: string
  fallbackReason?: ScenePlannerGatewayFallbackReason
}

export interface ScenePlannerGatewayResult {
  output: ScenePlannerOutput
  provenance: ScenePlannerGatewayProvenance
}

export interface ScenePlannerProvider {
  generate(request: ScenePlannerGatewayRequest): Promise<unknown>
}

export interface ScenePlannerGatewayConfig
  extends Pick<ApiServerConfig, 'modelProvider' | 'openAiModel' | 'openAiApiKey'> {}

export interface ScenePlannerGatewayDependencies {
  fixtureProvider?: ScenePlannerProvider
  openAiProvider?: ScenePlannerProvider
  openAiProviderFactory?: (options: ScenePlannerOpenAiResponsesProviderOptions) => ScenePlannerProvider
}

export function createScenePlannerGateway(
  config: ScenePlannerGatewayConfig,
  dependencies: ScenePlannerGatewayDependencies = {},
) {
  const fixtureProvider = dependencies.fixtureProvider ?? createScenePlannerFixtureProvider()
  const openAiProviderFactory = dependencies.openAiProviderFactory ?? createScenePlannerOpenAiResponsesProvider

  async function renderFixtureResult(
    request: ScenePlannerGatewayRequest,
    fallbackReason?: ScenePlannerGatewayFallbackReason,
  ): Promise<ScenePlannerGatewayResult> {
    return {
      output: parseScenePlannerOutput(await fixtureProvider.generate(request)),
      provenance: {
        provider: 'fixture',
        modelId: FIXTURE_SCENE_PLANNER_MODEL_ID,
        ...(fallbackReason ? { fallbackReason } : {}),
      },
    }
  }

  return {
    async generate(request: ScenePlannerGatewayRequest): Promise<ScenePlannerGatewayResult> {
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
          output: parseScenePlannerOutput(payload),
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

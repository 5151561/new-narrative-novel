import type { ScenePlannerGatewayRequest, ScenePlannerProvider } from './scenePlannerGateway.js'
import {
  requestOpenAiCompatibleJsonText,
  type OpenAiCompatibleChatCompletionClientLike,
} from './openai-compatible-json-client.js'
import {
  normalizeScenePlannerOpenAiOutput,
  scenePlannerOpenAiOutputSchema,
} from './scenePlannerOutputSchema.js'

export interface ScenePlannerOpenAiResponsesProviderOptions {
  baseUrl: string
  modelId: string
  apiKey: string
  client?: OpenAiCompatibleChatCompletionClientLike
}

export function createScenePlannerOpenAiResponsesProvider(
  options: ScenePlannerOpenAiResponsesProviderOptions,
): ScenePlannerProvider {
  return {
    async generate(request: ScenePlannerGatewayRequest) {
      let outputText: string
      try {
        outputText = await requestOpenAiCompatibleJsonText({
          apiKey: options.apiKey,
          baseUrl: options.baseUrl,
          client: options.client,
          input: request.input,
          instructions: request.instructions,
          modelId: options.modelId,
          schema: scenePlannerOpenAiOutputSchema,
          schemaName: 'scene_planner_output',
        })
      } catch {
        throw new Error(`OpenAI-compatible request failed for planner model ${options.modelId}.`)
      }

      if (!outputText) {
        return outputText
      }

      try {
        return normalizeScenePlannerOpenAiOutput(JSON.parse(outputText) as unknown)
      } catch {
        return outputText
      }
    },
  }
}

import type { SceneProseWriterGatewayRequest, SceneProseWriterProvider } from './sceneProseWriterGateway.js'
import {
  requestOpenAiCompatibleJsonText,
  type OpenAiCompatibleChatCompletionClientLike,
} from './openai-compatible-json-client.js'
import {
  parseSceneProseWriterOutput,
  sceneProseWriterOpenAiOutputSchema,
} from './sceneProseWriterOutputSchema.js'

export interface SceneProseWriterOpenAiResponsesProviderOptions {
  baseUrl: string
  modelId: string
  apiKey: string
  client?: OpenAiCompatibleChatCompletionClientLike
}

export function createSceneProseWriterOpenAiResponsesProvider(
  options: SceneProseWriterOpenAiResponsesProviderOptions,
): SceneProseWriterProvider {
  return {
    async generate(request: SceneProseWriterGatewayRequest) {
      let outputText: string
      try {
        outputText = await requestOpenAiCompatibleJsonText({
          apiKey: options.apiKey,
          baseUrl: options.baseUrl,
          client: options.client,
          input: request.input,
          instructions: request.instructions,
          modelId: options.modelId,
          schema: sceneProseWriterOpenAiOutputSchema,
          schemaName: 'scene_prose_writer_output',
        })
      } catch {
        throw new Error(`OpenAI-compatible request failed for prose model ${options.modelId}.`)
      }

      if (!outputText) {
        return outputText
      }

      try {
        return parseSceneProseWriterOutput(JSON.parse(outputText) as unknown)
      } catch {
        return outputText
      }
    },
  }
}

export type ModelGatewayRole = 'planner' | 'sceneProseWriter' | 'sceneRevision'
export type ModelGatewayProvider = 'openai-compatible'
export type ModelGatewayFailureClass = 'missing_model_config' | 'provider_error' | 'rate_limited' | 'invalid_output'
export type ModelGatewayProjectMode = 'demo-fixture' | 'real-project'

interface ModelGatewayMissingConfigInput {
  provider: ModelGatewayProvider
  projectMode: ModelGatewayProjectMode
  role: ModelGatewayRole
}

interface ModelGatewayBindingNotAllowedInput {
  projectMode: ModelGatewayProjectMode
  role: ModelGatewayRole
}

interface ModelGatewayExecutionInput {
  failureClass: ModelGatewayFailureClass
  fallbackUsed: boolean
  message: string
  modelId: string
  provider: ModelGatewayProvider
  providerId?: string
  providerLabel?: string
  projectMode: ModelGatewayProjectMode
  retryable: boolean
  role: ModelGatewayRole
}

export class ModelGatewayMissingConfigError extends Error {
  readonly code = 'MODEL_GATEWAY_MISSING_CONFIG'
  readonly provider: ModelGatewayProvider
  readonly projectMode: ModelGatewayProjectMode
  readonly role: ModelGatewayRole

  constructor(input: ModelGatewayMissingConfigInput) {
    super(`Model settings for ${input.role} are incomplete.`)
    this.name = 'ModelGatewayMissingConfigError'
    this.provider = input.provider
    this.projectMode = input.projectMode
    this.role = input.role
  }
}

export class ModelGatewayBindingNotAllowedError extends Error {
  readonly code = 'MODEL_GATEWAY_BINDING_NOT_ALLOWED'
  readonly projectMode: ModelGatewayProjectMode
  readonly role: ModelGatewayRole

  constructor(input: ModelGatewayBindingNotAllowedInput) {
    super(`Fixture bindings are not allowed for ${input.role} in real-project mode.`)
    this.name = 'ModelGatewayBindingNotAllowedError'
    this.projectMode = input.projectMode
    this.role = input.role
  }
}

export class ModelGatewayExecutionError extends Error {
  readonly failureClass: ModelGatewayFailureClass
  readonly fallbackUsed: boolean
  readonly modelId: string
  readonly provider: ModelGatewayProvider
  readonly providerId?: string
  readonly providerLabel?: string
  readonly projectMode: ModelGatewayProjectMode
  readonly retryable: boolean
  readonly role: ModelGatewayRole

  constructor(input: ModelGatewayExecutionInput) {
    super(input.message)
    this.name = 'ModelGatewayExecutionError'
    this.failureClass = input.failureClass
    this.fallbackUsed = input.fallbackUsed
    this.modelId = input.modelId
    this.provider = input.provider
    this.providerId = input.providerId
    this.providerLabel = input.providerLabel
    this.projectMode = input.projectMode
    this.retryable = input.retryable
    this.role = input.role
  }
}

export function isModelGatewayMissingConfigError(error: unknown): error is ModelGatewayMissingConfigError {
  return error instanceof ModelGatewayMissingConfigError
}

export function isModelGatewayBindingNotAllowedError(error: unknown): error is ModelGatewayBindingNotAllowedError {
  return error instanceof ModelGatewayBindingNotAllowedError
}

export function isModelGatewayExecutionError(error: unknown): error is ModelGatewayExecutionError {
  return error instanceof ModelGatewayExecutionError
}

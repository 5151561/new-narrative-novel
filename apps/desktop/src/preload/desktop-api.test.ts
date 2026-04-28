import { afterEach, describe, expect, it, vi } from 'vitest'

import { DESKTOP_API_CHANNELS, type DesktopApiChannel } from '../shared/desktop-bridge-types.js'
import { createNarrativeDesktopApi, type DesktopIpcInvoke } from './desktop-api.js'

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.unmock('electron')
})

describe('createNarrativeDesktopApi', () => {
  it('exposes provider-profile CRUD plus provider-id-scoped credential operations on the desktop bridge', async () => {
    const calls: Array<{ channel: DesktopApiChannel; payload: unknown[] }> = []
    const invoke: DesktopIpcInvoke = async <T>(channel: DesktopApiChannel, ...payload: unknown[]): Promise<T> => {
      calls.push({ channel, payload })

      if (channel === DESKTOP_API_CHANNELS.getProviderCredentialStatus) {
        return {
          configured: true,
          provider: 'openai-compatible',
          providerId: 'deepseek',
          redactedValue: 'sk-...alue',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.saveProviderCredential) {
        return {
          configured: true,
          provider: 'openai-compatible',
          providerId: 'deepseek',
          redactedValue: 'sk-...alue',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.deleteProviderCredential) {
        return {
          configured: false,
          provider: 'openai-compatible',
          providerId: 'deepseek',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getProviderProfiles || channel === DESKTOP_API_CHANNELS.saveProviderProfile) {
        return [{
          baseUrl: 'https://api.deepseek.com/v1',
          id: 'deepseek',
          label: 'DeepSeek',
        }] as T
      }

      if (channel === DESKTOP_API_CHANNELS.deleteProviderProfile) {
        return [] as T
      }

      if (channel === DESKTOP_API_CHANNELS.getModelBindings || channel === DESKTOP_API_CHANNELS.updateModelBinding) {
        return {
          continuityReviewer: { provider: 'fixture' },
          planner: { modelId: 'deepseek-chat', provider: 'openai-compatible', providerId: 'deepseek' },
          sceneProseWriter: { provider: 'fixture' },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getModelSettingsSnapshot) {
        return {
          bindings: {
            continuityReviewer: { provider: 'fixture' },
            planner: { modelId: 'deepseek-chat', provider: 'openai-compatible', providerId: 'deepseek' },
            sceneProseWriter: { provider: 'fixture' },
            sceneRevision: { provider: 'fixture' },
            summary: { provider: 'fixture' },
          },
          connectionTest: {
            status: 'never',
          },
          credentialStatuses: [{
            configured: true,
            provider: 'openai-compatible',
            providerId: 'deepseek',
            redactedValue: 'sk-...alue',
          }],
          providers: [{
            baseUrl: 'https://api.deepseek.com/v1',
            id: 'deepseek',
            label: 'DeepSeek',
          }],
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.testModelSettings) {
        return {
          errorCode: 'missing_key',
          status: 'failed',
          summary: 'Provider API key is missing.',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getCurrentProject) {
        return null as T
      }

      return undefined as T
    }

    const api = createNarrativeDesktopApi(invoke)

    await expect(api.getProviderProfiles()).resolves.toEqual([
      {
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      },
    ])
    await expect(api.saveProviderProfile({
      baseUrl: 'https://api.deepseek.com/v1',
      id: 'deepseek',
      label: 'DeepSeek',
    })).resolves.toEqual([
      {
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      },
    ])
    await expect(api.deleteProviderProfile('deepseek')).resolves.toEqual([])
    await expect(api.getProviderCredentialStatus({
      provider: 'openai-compatible',
      providerId: 'deepseek',
    })).resolves.toEqual({
      configured: true,
      provider: 'openai-compatible',
      providerId: 'deepseek',
      redactedValue: 'sk-...alue',
    })
    await expect(api.saveProviderCredential({
      provider: 'openai-compatible',
      providerId: 'deepseek',
      secret: 'sk-secret-value',
    })).resolves.toEqual({
      configured: true,
      provider: 'openai-compatible',
      providerId: 'deepseek',
      redactedValue: 'sk-...alue',
    })
    await expect(api.deleteProviderCredential({
      provider: 'openai-compatible',
      providerId: 'deepseek',
    })).resolves.toEqual({
      configured: false,
      provider: 'openai-compatible',
      providerId: 'deepseek',
    })
    await expect(api.getModelSettingsSnapshot()).resolves.toEqual({
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { modelId: 'deepseek-chat', provider: 'openai-compatible', providerId: 'deepseek' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
      connectionTest: {
        status: 'never',
      },
      credentialStatuses: [{
        configured: true,
        provider: 'openai-compatible',
        providerId: 'deepseek',
        redactedValue: 'sk-...alue',
      }],
      providers: [{
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      }],
    })

    expect(calls).toEqual([
      { channel: DESKTOP_API_CHANNELS.getProviderProfiles, payload: [] },
      {
        channel: DESKTOP_API_CHANNELS.saveProviderProfile,
        payload: [{
          baseUrl: 'https://api.deepseek.com/v1',
          id: 'deepseek',
          label: 'DeepSeek',
        }],
      },
      { channel: DESKTOP_API_CHANNELS.deleteProviderProfile, payload: ['deepseek'] },
      {
        channel: DESKTOP_API_CHANNELS.getProviderCredentialStatus,
        payload: [{
          provider: 'openai-compatible',
          providerId: 'deepseek',
        }],
      },
      {
        channel: DESKTOP_API_CHANNELS.saveProviderCredential,
        payload: [{
          provider: 'openai-compatible',
          providerId: 'deepseek',
          secret: 'sk-secret-value',
        }],
      },
      {
        channel: DESKTOP_API_CHANNELS.deleteProviderCredential,
        payload: [{
          provider: 'openai-compatible',
          providerId: 'deepseek',
        }],
      },
      { channel: DESKTOP_API_CHANNELS.getModelSettingsSnapshot, payload: [] },
    ])
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import { ModelSettingsDialog } from './ModelSettingsDialog'
import { ModelSettingsProvider } from './ModelSettingsProvider'

function installDesktopBridge() {
  const bridge = {
    deleteProviderCredential: vi.fn(async () => ({
      configured: false,
      provider: 'openai-compatible' as const,
      providerId: 'deepseek',
    })),
    deleteProviderProfile: vi.fn(async () => []),
    getModelSettingsSnapshot: vi.fn(async () => ({
      providers: [
        { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
      ],
      bindings: {
        continuityReviewer: { provider: 'fixture' as const },
        planner: { modelId: 'deepseek-chat', provider: 'openai-compatible' as const, providerId: 'deepseek' },
        sceneProseWriter: { provider: 'fixture' as const },
        sceneRevision: { provider: 'fixture' as const },
        summary: { provider: 'fixture' as const },
      },
      connectionTest: {
        status: 'never' as const,
      },
      credentialStatuses: [
        {
          configured: false,
          provider: 'openai-compatible' as const,
          providerId: 'deepseek',
        },
      ],
    })),
    saveProviderCredential: vi.fn(async () => ({
      configured: true,
      provider: 'openai-compatible' as const,
      providerId: 'deepseek',
      redactedValue: 'sk-...1234',
    })),
    saveProviderProfile: vi.fn(async () => []),
    testModelSettings: vi.fn(async () => ({
      status: 'failed' as const,
      errorCode: 'missing_key' as const,
      summary: 'One or more configured provider credentials are missing.',
    })),
    updateModelBinding: vi.fn(async () => ({
      continuityReviewer: { provider: 'fixture' as const },
      planner: { modelId: 'deepseek-reasoner', provider: 'openai-compatible' as const, providerId: 'deepseek' },
      sceneProseWriter: { provider: 'fixture' as const },
      sceneRevision: { provider: 'fixture' as const },
      summary: { provider: 'fixture' as const },
    })),
  }

  Object.defineProperty(window, 'narrativeDesktop', {
    configurable: true,
    value: bridge,
  })

  return bridge
}

afterEach(() => {
  Reflect.deleteProperty(window, 'narrativeDesktop')
})

describe('ModelSettingsDialog', () => {
  it('renders bridge-backed provider profile and binding snapshot content', async () => {
    installDesktopBridge()

    render(
      <AppProviders>
        <ModelSettingsProvider>
          <ModelSettingsDialog open onOpenChange={() => {}} />
        </ModelSettingsProvider>
      </AppProviders>,
    )

    expect(await screen.findByRole('dialog', { name: 'Model Settings' })).toBeInTheDocument()
    expect(screen.getByText('Provider profiles')).toBeInTheDocument()
    expect(screen.getByText('Real project run needs attention')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('DeepSeek')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('https://api.deepseek.com/v1')).toBeInTheDocument()
    expect(screen.getByLabelText('deepseek provider profile ID input')).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Planner provider' })).toHaveValue('deepseek')
  })

  it('saves provider profiles and credentials, updates model bindings, and runs the connection test through the desktop bridge', async () => {
    const bridge = installDesktopBridge()
    const user = userEvent.setup()

    render(
      <AppProviders>
        <ModelSettingsProvider>
          <ModelSettingsDialog open onOpenChange={() => {}} />
        </ModelSettingsProvider>
      </AppProviders>,
    )

    await screen.findByRole('dialog', { name: 'Model Settings' })
    await screen.findByDisplayValue('DeepSeek')

    await user.type(screen.getByLabelText('Provider profile ID input'), 'openrouter')
    await user.type(screen.getByLabelText('Provider profile label input'), 'OpenRouter')
    await user.type(screen.getByLabelText('Provider profile base URL input'), 'https://openrouter.ai/api/v1')
    await user.click(screen.getByRole('button', { name: 'Create provider profile' }))

    await user.type(screen.getByLabelText('DeepSeek API key input'), 'sk-test-value')
    await user.click(screen.getByRole('button', { name: 'Save DeepSeek API key' }))
    await user.clear(screen.getByLabelText('Planner model'))
    await user.type(screen.getByLabelText('Planner model'), 'deepseek-reasoner')
    await user.click(screen.getByRole('button', { name: 'Save Planner binding' }))
    await user.click(screen.getByRole('button', { name: 'Test model connection' }))

    await waitFor(() => {
      expect(bridge.saveProviderProfile).toHaveBeenCalledWith({
        id: 'openrouter',
        label: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
      })
    })
    expect(bridge.saveProviderCredential).toHaveBeenCalledWith({
      provider: 'openai-compatible',
      providerId: 'deepseek',
      secret: 'sk-test-value',
    })
    expect(bridge.updateModelBinding).toHaveBeenCalledWith({
      binding: {
        modelId: 'deepseek-reasoner',
        provider: 'openai-compatible',
        providerId: 'deepseek',
      },
      role: 'planner',
    })
    expect(bridge.testModelSettings).toHaveBeenCalledTimes(1)
    expect((await screen.findAllByText('One or more configured provider credentials are missing.')).length).toBeGreaterThan(0)
    expect(screen.getByText('Connection test failed')).toBeInTheDocument()
  })

  it('keeps existing provider ids stable while still allowing label and base URL edits', async () => {
    const bridge = installDesktopBridge()
    const user = userEvent.setup()

    render(
      <AppProviders>
        <ModelSettingsProvider>
          <ModelSettingsDialog open onOpenChange={() => {}} />
        </ModelSettingsProvider>
      </AppProviders>,
    )

    await screen.findByRole('dialog', { name: 'Model Settings' })
    const providerIdInput = await screen.findByLabelText('deepseek provider profile ID input')
    expect(providerIdInput).toBeDisabled()

    await user.clear(screen.getByLabelText('deepseek provider profile label input'))
    await user.type(screen.getByLabelText('deepseek provider profile label input'), 'DeepSeek Updated')
    await user.clear(screen.getByLabelText('deepseek provider profile base URL input'))
    await user.type(screen.getByLabelText('deepseek provider profile base URL input'), 'https://api.deepseek.com/v2')
    await user.click(screen.getByRole('button', { name: 'Save DeepSeek profile' }))

    await waitFor(() => {
      expect(bridge.saveProviderProfile).toHaveBeenCalledWith({
        id: 'deepseek',
        label: 'DeepSeek Updated',
        baseUrl: 'https://api.deepseek.com/v2',
      })
    })
  })

  it('renders zh-CN clean labels for the shell-global provider settings flow', async () => {
    installDesktopBridge()
    window.localStorage.setItem('narrative-novel.locale', 'zh-CN')

    render(
      <AppProviders>
        <ModelSettingsProvider>
          <ModelSettingsDialog open onOpenChange={() => {}} />
        </ModelSettingsProvider>
      </AppProviders>,
    )

    expect(await screen.findByRole('dialog', { name: '模型设置' })).toBeInTheDocument()
    expect(screen.getByText('提供方配置')).toBeInTheDocument()
    expect(screen.getByText('规划器')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '规划器提供方' })).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: '演示 Fixture' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('option', { name: 'DeepSeek' }).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('DeepSeek API 密钥输入')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存 规划器 绑定' })).toBeInTheDocument()
  })
})

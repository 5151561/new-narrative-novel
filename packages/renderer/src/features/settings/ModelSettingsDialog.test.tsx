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
      provider: 'openai' as const,
    })),
    getModelSettingsSnapshot: vi.fn(async () => ({
      bindings: {
        continuityReviewer: { provider: 'fixture' as const },
        planner: { modelId: 'gpt-5.4', provider: 'openai' as const },
        sceneProseWriter: { provider: 'fixture' as const },
        sceneRevision: { provider: 'fixture' as const },
        summary: { provider: 'fixture' as const },
      },
      connectionTest: {
        status: 'never' as const,
      },
      credentialStatus: {
        configured: false,
        provider: 'openai' as const,
      },
    })),
    saveProviderCredential: vi.fn(async () => ({
      configured: true,
      provider: 'openai' as const,
      redactedValue: 'sk-...1234',
    })),
    testModelSettings: vi.fn(async () => ({
      status: 'failed' as const,
      errorCode: 'missing_key' as const,
      summary: 'OpenAI API key is missing.',
    })),
    updateModelBinding: vi.fn(async () => ({
      continuityReviewer: { provider: 'fixture' as const },
      planner: { modelId: 'gpt-5.4-mini', provider: 'openai' as const },
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
  it('renders bridge-backed model settings snapshot content', async () => {
    installDesktopBridge()

    render(
      <AppProviders>
        <ModelSettingsProvider>
          <ModelSettingsDialog open onOpenChange={() => {}} />
        </ModelSettingsProvider>
      </AppProviders>,
    )

    expect(await screen.findByRole('dialog', { name: 'Model Settings' })).toBeInTheDocument()
    expect(screen.getByText('OpenAI API key')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('gpt-5.4')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Planner provider' })).toHaveValue('openai')
  })

  it('saves provider credentials, updates model bindings, and runs the connection test through the desktop bridge', async () => {
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
    await screen.findByDisplayValue('gpt-5.4')

    await user.type(screen.getByLabelText('OpenAI API key input'), 'sk-test-value')
    await user.click(screen.getByRole('button', { name: 'Save OpenAI API key' }))
    await user.clear(screen.getByLabelText('Planner model'))
    await user.type(screen.getByLabelText('Planner model'), 'gpt-5.4-mini')
    await user.click(screen.getByRole('button', { name: 'Save Planner binding' }))
    await user.click(screen.getByRole('button', { name: 'Test model connection' }))

    await waitFor(() => {
      expect(bridge.saveProviderCredential).toHaveBeenCalledWith({
        provider: 'openai',
        secret: 'sk-test-value',
      })
    })
    expect(bridge.updateModelBinding).toHaveBeenCalledWith({
      binding: {
        modelId: 'gpt-5.4-mini',
        provider: 'openai',
      },
      role: 'planner',
    })
    expect(bridge.testModelSettings).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('OpenAI API key is missing.')).toBeInTheDocument()
  })

  it('renders zh-CN clean labels for the shell-global settings flow', async () => {
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
    expect(screen.getByText('OpenAI API 密钥')).toBeInTheDocument()
    expect(screen.getByText('规划器')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '规划器提供方' })).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: '演示 Fixture' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('option', { name: 'OpenAI' }).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('OpenAI API 密钥输入')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存 规划器 绑定' })).toBeInTheDocument()
  })
})

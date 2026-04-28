import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import { ModelSettingsDialog } from './ModelSettingsDialog'
import { ModelSettingsProvider } from './ModelSettingsProvider'

function installStoryBridge() {
  if (typeof window === 'undefined') {
    return
  }

  Object.defineProperty(window, 'narrativeDesktop', {
    configurable: true,
    value: {
      deleteProviderCredential: async () => ({
        configured: false,
        provider: 'openai-compatible',
        providerId: 'deepseek',
      }),
      deleteProviderProfile: async () => [],
      getModelSettingsSnapshot: async () => ({
        providers: [
          { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
        ],
        bindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { modelId: 'deepseek-chat', provider: 'openai-compatible', providerId: 'deepseek' },
          sceneProseWriter: { provider: 'fixture' },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        connectionTest: {
          status: 'failed',
          errorCode: 'missing_key',
          summary: 'One or more configured provider credentials are missing.',
        },
        credentialStatuses: [{
          configured: false,
          provider: 'openai-compatible',
          providerId: 'deepseek',
        }],
      }),
      saveProviderCredential: async () => ({
        configured: true,
        provider: 'openai-compatible',
        providerId: 'deepseek',
        redactedValue: 'sk-...1234',
      }),
      saveProviderProfile: async () => [],
      testModelSettings: async () => ({
        status: 'failed',
        errorCode: 'missing_key',
        summary: 'One or more configured provider credentials are missing.',
      }),
      updateModelBinding: async () => ({
        continuityReviewer: { provider: 'fixture' },
        planner: { modelId: 'deepseek-chat', provider: 'openai-compatible', providerId: 'deepseek' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      }),
    },
  })
}

const meta = {
  title: 'Settings/Model Settings Dialog',
  component: ModelSettingsDialog,
  decorators: [
    (Story) => {
      installStoryBridge()

      return (
        <AppProviders>
          <ModelSettingsProvider>
            <div className="min-h-screen bg-app p-6">
              <Story />
            </div>
          </ModelSettingsProvider>
        </AppProviders>
      )
    },
  ],
  args: {
    onOpenChange: () => {},
    open: true,
  },
} satisfies Meta<typeof ModelSettingsDialog>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

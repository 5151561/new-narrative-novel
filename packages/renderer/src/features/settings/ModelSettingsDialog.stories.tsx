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
        provider: 'openai',
      }),
      getModelSettingsSnapshot: async () => ({
        bindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { modelId: 'gpt-5.4', provider: 'openai' },
          sceneProseWriter: { provider: 'fixture' },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        connectionTest: {
          status: 'failed',
          errorCode: 'missing_key',
          summary: 'OpenAI API key is missing.',
        },
        credentialStatus: {
          configured: false,
          provider: 'openai',
        },
      }),
      saveProviderCredential: async () => ({
        configured: true,
        provider: 'openai',
        redactedValue: 'sk-...1234',
      }),
      testModelSettings: async () => ({
        status: 'failed',
        errorCode: 'missing_key',
        summary: 'OpenAI API key is missing.',
      }),
      updateModelBinding: async () => ({
        continuityReviewer: { provider: 'fixture' },
        planner: { modelId: 'gpt-5.4', provider: 'openai' },
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

import type { Meta, StoryObj } from '@storybook/react'

import { I18nProvider } from '@/app/i18n'

import { ProjectLauncherScreen } from './ProjectLauncherScreen'

const meta = {
  title: 'Launcher/Project Launcher Screen',
  component: ProjectLauncherScreen,
  decorators: [
    (Story) => (
      <I18nProvider>
        <Story />
      </I18nProvider>
    ),
  ],
  args: {
    onCreateRealProject: async () => undefined,
    onOpenDemoProject: async () => undefined,
    onOpenExistingProject: async () => undefined,
  },
} satisfies Meta<typeof ProjectLauncherScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Idle: Story = {}

export const Loading: Story = {
  args: {
    activeAction: 'open-demo-project',
  },
}

export const ActionFailure: Story = {
  args: {
    errorMessage: 'Demo project bootstrap failed.',
  },
}

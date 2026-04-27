import { useMemo, type ComponentProps, type PropsWithChildren } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import { createProjectRuntimeInfoRecord } from './project-runtime-info'
import { createStoryProjectRuntimeEnvironment } from './project-runtime-test-utils'
import { ProjectRuntimeStatusBadge } from './ProjectRuntimeStatusBadge'

function StoryProviders({ children }: PropsWithChildren) {
  const storyEnvironment = useMemo(() => createStoryProjectRuntimeEnvironment(), [])

  return <AppProviders runtime={storyEnvironment.runtime} queryClient={storyEnvironment.queryClient}>{children}</AppProviders>
}

const meta = {
  title: 'App/Project Runtime/Status Badge',
  component: ProjectRuntimeStatusBadge,
  decorators: [
    (Story) => (
      <StoryProviders>
        <div className="max-w-3xl p-4">
          <Story />
        </div>
      </StoryProviders>
    ),
  ],
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'project-story-runtime',
      projectTitle: 'Signal Arc Desktop',
      source: 'mock',
      status: 'healthy',
      summary: 'Using in-memory mock project runtime.',
      capabilities: {
        contextPacketRefs: true,
        read: true,
        proposalSetRefs: true,
        reviewDecisions: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: true,
        write: true,
      },
    }),
    isChecking: false,
  },
} satisfies Meta<typeof ProjectRuntimeStatusBadge>

export default meta

type Story = StoryObj<typeof meta>

export const HealthyMock: Story = {}

export const DesktopLocalHealthyCurrentProject: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to the desktop-local runtime for the current project.',
      capabilities: {
        contextPacketRefs: true,
        read: true,
        proposalSetRefs: true,
        reviewDecisions: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: true,
        write: true,
      },
    }),
  },
}

export const LocalProjectStoreHealthy: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'local-project-alpha',
      projectTitle: 'Local Alpha',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to local project store v1.',
      versionLabel: 'local-project-store-v1',
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: false,
        reviewDecisions: true,
      },
    }),
  },
}

export const HealthyLimited: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'project-story-runtime',
      projectTitle: 'Signal Arc Desktop',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to limited runtime gateway.',
      capabilities: {
        read: true,
        write: false,
        runEvents: false,
        reviewDecisions: false,
      },
    }),
  },
}

export const DesktopLocalUnavailableCurrentProject: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      source: 'api',
      status: 'unavailable',
      summary: 'API demo runtime is unavailable. Start the fixture API or reopen the desktop-local demo, then retry.',
      capabilities: {
        read: false,
        write: false,
      },
    }),
    onRetry: () => {},
  },
}

export const AllStates: Story = {
  render: () => {
    const statuses = [
      {
        title: 'Mock healthy',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'project-story-runtime',
            projectTitle: 'Signal Arc Desktop',
            source: 'mock',
            status: 'healthy',
            summary: 'Using in-memory mock project runtime.',
            capabilities: {
              contextPacketRefs: true,
              read: true,
              proposalSetRefs: true,
              reviewDecisions: true,
              runEvents: true,
              runEventPolling: true,
              runEventStream: true,
              write: true,
            },
          }),
        },
      },
      {
        title: 'Desktop-local healthy',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'desktop-project-signal-arc',
            projectTitle: 'Signal Arc Desktop',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to the desktop-local runtime for the current project.',
            capabilities: {
              contextPacketRefs: true,
              read: true,
              proposalSetRefs: true,
              reviewDecisions: true,
              runEvents: true,
              runEventPolling: true,
              runEventStream: true,
              write: true,
            },
          }),
        },
      },
      {
        title: 'Local project store',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'local-project-alpha',
            projectTitle: 'Local Alpha',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to local project store v1.',
            versionLabel: 'local-project-store-v1',
            capabilities: {
              read: true,
              write: true,
              runEvents: true,
              runEventPolling: true,
              runEventStream: false,
              reviewDecisions: true,
            },
          }),
        },
      },
      {
        title: 'Checking',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'desktop-project-signal-arc',
            projectTitle: 'Signal Arc Desktop',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to the desktop-local runtime for the current project.',
            capabilities: {
              contextPacketRefs: true,
              read: true,
              proposalSetRefs: true,
              reviewDecisions: true,
              runEvents: true,
              runEventPolling: true,
              runEventStream: true,
              write: true,
            },
          }),
          isChecking: true,
        },
      },
      {
        title: 'Healthy limited',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'project-story-runtime',
            projectTitle: 'Signal Arc Desktop',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to limited runtime gateway.',
            capabilities: {
              read: true,
              write: false,
              runEvents: false,
              reviewDecisions: false,
            },
          }),
        },
      },
      {
        title: 'Desktop-local unavailable',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'desktop-project-signal-arc',
            projectTitle: 'Signal Arc Desktop',
            source: 'api',
            status: 'unavailable',
            summary: 'API demo runtime is unavailable. Start the fixture API or reopen the desktop-local demo, then retry.',
            capabilities: {
              read: false,
              write: false,
            },
          }),
          onRetry: () => {},
        },
      },
      {
        title: 'Unauthorized',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'project-story-runtime',
            projectTitle: 'Signal Arc Desktop',
            source: 'api',
            status: 'unauthorized',
            summary: 'API demo runtime requires authentication before this project can load.',
            capabilities: {
              read: false,
              write: false,
            },
          }),
          onRetry: () => {},
        },
      },
    ] satisfies Array<{
      title: string
      props: ComponentProps<typeof ProjectRuntimeStatusBadge>
    }>

    return (
      <div className="space-y-3">
        {statuses.map((item) => (
          <div key={item.title} className="space-y-1">
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">{item.title}</p>
            <ProjectRuntimeStatusBadge {...item.props} />
          </div>
        ))}
      </div>
    )
  },
}

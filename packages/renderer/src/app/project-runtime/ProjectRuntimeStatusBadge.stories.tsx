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

export const FixtureDemoHealthy: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'book-signal-arc',
      projectTitle: 'Signal Arc',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to fixture API runtime.',
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

export const MockStorybookHealthy: Story = {}

export const RealLocalProjectHealthy: Story = {
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

export const RealLocalProjectUnavailable: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      source: 'api',
      status: 'unavailable',
      summary:
        'Local project runtime is unavailable for "Signal Arc Desktop". The selected project stays active and mock fallback stays off until the runtime recovers.',
      capabilities: {
        read: false,
        write: false,
      },
    }),
    onRetry: () => {},
  },
}

export const RealLocalProjectUnauthorized: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      source: 'api',
      status: 'unauthorized',
      summary:
        'Local project runtime needs authorization for "Signal Arc Desktop". The selected project stays active and mock fallback stays off until access is restored.',
      capabilities: {
        read: false,
        write: false,
      },
    }),
    onRetry: () => {},
  },
}

export const NoSilentMockFallback: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      source: 'api',
      status: 'unknown',
      summary:
        'Local project runtime health check failed for "Signal Arc Desktop". The selected project stays active and mock fallback stays off until the runtime recovers.',
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
        title: 'Fixture demo healthy',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'book-signal-arc',
            projectTitle: 'Signal Arc',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to fixture API runtime.',
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
        title: 'Mock storybook healthy',
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
        title: 'Real local project healthy',
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
              write: true,
              runEvents: true,
              runEventPolling: true,
              runEventStream: true,
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
        title: 'Real local project unavailable',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'desktop-project-signal-arc',
            projectTitle: 'Signal Arc Desktop',
            source: 'api',
            status: 'unavailable',
            summary:
              'Local project runtime is unavailable for "Signal Arc Desktop". The selected project stays active and mock fallback stays off until the runtime recovers.',
            capabilities: {
              read: false,
              write: false,
            },
          }),
          onRetry: () => {},
        },
      },
      {
        title: 'Real local project unauthorized',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'desktop-project-signal-arc',
            projectTitle: 'Signal Arc Desktop',
            source: 'api',
            status: 'unauthorized',
            summary:
              'Local project runtime needs authorization for "Signal Arc Desktop". The selected project stays active and mock fallback stays off until access is restored.',
            capabilities: {
              read: false,
              write: false,
            },
          }),
          onRetry: () => {},
        },
      },
      {
        title: 'No silent mock fallback',
        props: {
          info: createProjectRuntimeInfoRecord({
            projectId: 'desktop-project-signal-arc',
            projectTitle: 'Signal Arc Desktop',
            source: 'api',
            status: 'unknown',
            summary:
              'Local project runtime health check failed for "Signal Arc Desktop". The selected project stays active and mock fallback stays off until the runtime recovers.',
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

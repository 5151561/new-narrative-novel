import { useMemo, type ComponentProps, type PropsWithChildren } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'
import { ModelSettingsProvider } from '@/features/settings/ModelSettingsProvider'

import { createProjectRuntimeInfoRecord } from './project-runtime-info'
import { createStoryProjectRuntimeEnvironment } from './project-runtime-test-utils'
import { ProjectRuntimeStatusBadge } from './ProjectRuntimeStatusBadge'

interface DesktopModelSettingsStorySnapshot {
  providers: Array<{ id: string; label: string; baseUrl: string }>
  bindings: {
    continuityReviewer: { provider: 'fixture' } | { provider: 'openai-compatible'; providerId: string; modelId: string }
    planner: { provider: 'fixture' } | { provider: 'openai-compatible'; providerId: string; modelId: string }
    sceneProseWriter: { provider: 'fixture' } | { provider: 'openai-compatible'; providerId: string; modelId: string }
    sceneRevision: { provider: 'fixture' } | { provider: 'openai-compatible'; providerId: string; modelId: string }
    summary: { provider: 'fixture' } | { provider: 'openai-compatible'; providerId: string; modelId: string }
  }
  connectionTest: {
    status: 'never' | 'passed' | 'failed'
    errorCode?: 'missing_key' | 'invalid_key' | 'model_not_found' | 'network_error' | 'invalid_output'
    summary?: string
  }
  credentialStatuses: Array<{
    configured: boolean
    provider: 'openai-compatible'
    providerId: string
    redactedValue?: string
  }>
}

const defaultDesktopModelSettingsSnapshot: DesktopModelSettingsStorySnapshot = {
  providers: [],
  bindings: {
    continuityReviewer: { provider: 'fixture' },
    planner: { provider: 'fixture' },
    sceneProseWriter: { provider: 'fixture' },
    sceneRevision: { provider: 'fixture' },
    summary: { provider: 'fixture' },
  },
  connectionTest: {
    status: 'never',
  },
  credentialStatuses: [],
}

function installProjectRuntimeStatusBadgeBridge(
  snapshot: DesktopModelSettingsStorySnapshot,
  mode: 'resolved' | 'pending' = 'resolved',
) {
  if (typeof window === 'undefined') {
    return
  }

  Object.defineProperty(window, 'narrativeDesktop', {
    configurable: true,
    value: {
      getModelSettingsSnapshot: () => {
        if (mode === 'pending') {
          return new Promise<DesktopModelSettingsStorySnapshot>(() => {})
        }

        return Promise.resolve(snapshot)
      },
      saveProviderProfile: async () => snapshot.providers,
      deleteProviderProfile: async () => snapshot.providers,
      saveProviderCredential: async () => snapshot.credentialStatuses[0] ?? {
        configured: true,
        provider: 'openai-compatible' as const,
        providerId: snapshot.providers[0]?.id ?? 'storybook-provider',
      },
      deleteProviderCredential: async () => snapshot.credentialStatuses[0] ?? {
        configured: false,
        provider: 'openai-compatible' as const,
        providerId: snapshot.providers[0]?.id ?? 'storybook-provider',
      },
      updateModelBinding: async () => snapshot.bindings,
      testModelSettings: async () => snapshot.connectionTest,
    },
  })
}

function StoryProviders({ children }: PropsWithChildren) {
  const storyEnvironment = useMemo(() => createStoryProjectRuntimeEnvironment(), [])

  return (
    <AppProviders runtime={storyEnvironment.runtime} queryClient={storyEnvironment.queryClient}>
      <ModelSettingsProvider>{children}</ModelSettingsProvider>
    </AppProviders>
  )
}

const meta = {
  title: 'App/Project Runtime/Status Badge',
  component: ProjectRuntimeStatusBadge,
  decorators: [
    (Story, context) => {
      installProjectRuntimeStatusBadgeBridge(
        (context.parameters.desktopModelSettingsSnapshot as DesktopModelSettingsStorySnapshot | undefined)
          ?? defaultDesktopModelSettingsSnapshot,
        (context.parameters.desktopModelSettingsBridgeMode as 'resolved' | 'pending' | undefined) ?? 'resolved',
      )

      return (
        <StoryProviders>
          <div className="max-w-3xl p-4">
            <Story />
          </div>
        </StoryProviders>
      )
    },
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
      runtimeKind: 'fixture-demo',
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

export const FixtureDemoIgnoresDesktopRealBindings: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'book-signal-arc',
      projectTitle: 'Signal Arc Demo',
      runtimeKind: 'fixture-demo',
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
  parameters: {
    desktopModelSettingsSnapshot: {
      providers: [
        { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
      ],
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { provider: 'openai-compatible', providerId: 'deepseek', modelId: 'deepseek-reasoner' },
        sceneProseWriter: { provider: 'openai-compatible', providerId: 'deepseek', modelId: 'deepseek-chat' },
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
    } satisfies DesktopModelSettingsStorySnapshot,
  },
}

export const MockStorybookHealthy: Story = {}

export const RealLocalProjectHealthy: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      runtimeKind: 'real-local-project',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to the desktop-local runtime for the current project.',
      modelBindings: {
        usable: true,
      },
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
  parameters: {
    desktopModelSettingsSnapshot: {
      providers: [
        { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
      ],
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { provider: 'openai-compatible', providerId: 'deepseek', modelId: 'deepseek-reasoner' },
        sceneProseWriter: { provider: 'openai-compatible', providerId: 'deepseek', modelId: 'deepseek-chat' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
      connectionTest: {
        status: 'passed',
        summary: 'Planner and prose writer settings are ready for the current real project.',
      },
      credentialStatuses: [{
        configured: true,
        provider: 'openai-compatible',
        providerId: 'deepseek',
        redactedValue: 'sk-...1234',
      }],
    } satisfies DesktopModelSettingsStorySnapshot,
  },
}

export const RealLocalProjectHydratingModelSettings: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      runtimeKind: 'real-local-project',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to the desktop-local runtime for the current project.',
      modelBindings: {
        usable: true,
      },
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
  parameters: {
    desktopModelSettingsBridgeMode: 'pending',
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
      runtimeKind: 'real-local-project',
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
      runtimeKind: 'real-local-project',
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
      runtimeKind: 'real-local-project',
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

export const RealLocalProjectOpenAiKeyMissing: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      runtimeKind: 'real-local-project',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to the desktop-local runtime for the current project.',
      capabilities: {
        read: true,
        write: true,
      },
    }),
  },
  parameters: {
    desktopModelSettingsSnapshot: {
      providers: [
        { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
      ],
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { provider: 'openai-compatible', providerId: 'deepseek', modelId: 'deepseek-chat' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
      connectionTest: {
        status: 'never',
      },
      credentialStatuses: [{
        configured: false,
        provider: 'openai-compatible',
        providerId: 'deepseek',
      }],
    } satisfies DesktopModelSettingsStorySnapshot,
  },
}

export const RealLocalProjectTestFailed: Story = {
  args: {
    info: createProjectRuntimeInfoRecord({
      projectId: 'desktop-project-signal-arc',
      projectTitle: 'Signal Arc Desktop',
      runtimeKind: 'real-local-project',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to the desktop-local runtime for the current project.',
      capabilities: {
        read: true,
        write: true,
      },
    }),
  },
  parameters: {
    desktopModelSettingsSnapshot: {
      providers: [
        { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
      ],
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { provider: 'openai-compatible', providerId: 'deepseek', modelId: 'deepseek-chat' },
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
    } satisfies DesktopModelSettingsStorySnapshot,
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
            runtimeKind: 'fixture-demo',
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
            runtimeKind: 'real-local-project',
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
            runtimeKind: 'real-local-project',
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
            runtimeKind: 'real-local-project',
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

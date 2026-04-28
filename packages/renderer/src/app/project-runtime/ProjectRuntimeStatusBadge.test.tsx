import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AllStates, RealLocalProjectTestFailed } from './ProjectRuntimeStatusBadge.stories'
import { createProjectRuntimeInfoRecord } from './project-runtime-info'
import { createProjectRuntimeTestWrapper } from './project-runtime-test-utils'
import { ProjectRuntimeStatusBadge } from './ProjectRuntimeStatusBadge'
import { ModelSettingsProvider } from '@/features/settings/ModelSettingsProvider'

afterEach(() => {
  Reflect.deleteProperty(window, 'narrativeDesktop')
})

function renderBadge(
  props: Partial<Parameters<typeof ProjectRuntimeStatusBadge>[0]> & {
    info?: Parameters<typeof ProjectRuntimeStatusBadge>[0]['info']
  } = {},
) {
  const wrapper = createProjectRuntimeTestWrapper()

  return render(
    <ProjectRuntimeStatusBadge
      info={
        props.info ??
        createProjectRuntimeInfoRecord({
          projectId: 'project-status-badge',
          projectTitle: 'Signal Arc',
          source: 'mock',
          status: 'healthy',
          summary: 'Using in-memory mock project runtime.',
          capabilities: {
            read: true,
            write: true,
          },
        })
      }
      isChecking={props.isChecking}
      onRetry={props.onRetry}
    />,
    { wrapper },
  )
}

describe('ProjectRuntimeStatusBadge', () => {
  it('renders healthy mock runtime status', () => {
    renderBadge()

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Signal Arc')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Mock')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Healthy')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).not.toHaveTextContent('Demo Fixture Project')
    expect(screen.queryByText('Read-only')).not.toBeInTheDocument()
  })

  it('renders healthy API runtime status', () => {
    renderBadge({
      info: createProjectRuntimeInfoRecord({
        projectId: 'project-status-badge',
        projectTitle: 'Signal Arc',
        source: 'api',
        status: 'healthy',
        summary: 'Connected to runtime gateway.',
        capabilities: {
          read: true,
          write: true,
        },
      }),
    })

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Signal Arc')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('API')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Healthy')
  })

  it('keeps demo-fixture badge wording accurate for the dedicated desktop demo session', () => {
    renderBadge({
      info: createProjectRuntimeInfoRecord({
        projectId: 'book-signal-arc',
        projectTitle: 'Signal Arc Demo',
        runtimeKind: 'fixture-demo',
        source: 'api',
        status: 'healthy',
        summary: 'Connected to fixture API runtime.',
        capabilities: {
          read: true,
          write: true,
        },
      }),
    })

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Signal Arc Demo')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Demo Fixture Project')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).not.toHaveTextContent('Real Project')
  })

  it('renders the real-local-project healthy state in the shared storybook status surface', () => {
    const wrapper = createProjectRuntimeTestWrapper()

    render(AllStates.render?.({}, {} as never), { wrapper })

    const realLocalProjectSection = screen.getByText('Real local project healthy').parentElement
    expect(realLocalProjectSection).not.toBeNull()

    const realLocalProjectStatus = within(realLocalProjectSection!).getByRole('status', {
      name: 'Project runtime status',
    })

    expect(realLocalProjectStatus).toHaveTextContent('Signal Arc Desktop')
    expect(realLocalProjectStatus).toHaveTextContent('API')
    expect(realLocalProjectStatus).toHaveTextContent('Healthy')
    expect(realLocalProjectStatus).toHaveTextContent('Real Project')
    expect(realLocalProjectStatus).toHaveTextContent('Model Fixture')
    expect(realLocalProjectStatus).toHaveTextContent('Connected to the desktop-local runtime for the current project.')
  })

  it('surfaces notable capability limitations for a healthy but limited runtime', () => {
    renderBadge({
      info: createProjectRuntimeInfoRecord({
        projectId: 'project-status-badge',
        projectTitle: 'Signal Arc',
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
    })

    const status = screen.getByRole('status', { name: 'Project runtime status' })
    expect(status).toHaveTextContent('Read-only')
    expect(status).toHaveTextContent('No run events')
    expect(status).toHaveTextContent('No review decisions')
  })

  it('shows checking while the health query is in flight', () => {
    renderBadge({ isChecking: true })

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Signal Arc')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Checking')
    expect(screen.queryByText('Read-only')).not.toBeInTheDocument()
    expect(screen.queryByText('No run events')).not.toBeInTheDocument()
    expect(screen.queryByText('No review decisions')).not.toBeInTheDocument()
  })

  it('falls back to the project id when no project title is available', () => {
    renderBadge({
      info: createProjectRuntimeInfoRecord({
        projectId: 'project-id-only',
        source: 'api',
        status: 'healthy',
        summary: 'Connected to runtime gateway.',
        capabilities: {
          read: true,
          write: true,
        },
      }),
    })

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('project-id-only')
  })

  it('shows retry for unavailable runtime status', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    renderBadge({
      info: createProjectRuntimeInfoRecord({
        projectId: 'project-status-badge',
        projectTitle: 'Signal Arc',
        source: 'api',
        status: 'unavailable',
        summary: 'Project runtime is unavailable.',
        capabilities: {
          read: false,
          write: false,
        },
      }),
      onRetry,
    })

    await user.click(screen.getByRole('button', { name: 'Retry runtime check' }))

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Signal Arc')
    expect(screen.queryByText('Read-only')).not.toBeInTheDocument()
    expect(screen.queryByText('No run events')).not.toBeInTheDocument()
    expect(screen.queryByText('No review decisions')).not.toBeInTheDocument()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows degraded real-local-project status without drifting back to fixture/demo wording', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    renderBadge({
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
      onRetry,
    })

    const status = screen.getByRole('status', { name: 'Project runtime status' })
    expect(status).toHaveTextContent('Signal Arc Desktop')
    expect(status).toHaveTextContent('API')
    expect(status).toHaveTextContent('Unavailable')
    expect(status).toHaveTextContent('Real Project')
    expect(status).not.toHaveTextContent(/API demo runtime/i)

    await user.click(screen.getByRole('button', { name: 'Retry runtime check' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it.each([
    {
      status: 'unauthorized' as const,
      projectTitle: 'Signal Arc Desktop',
      summary:
        'Local project runtime needs authorization for "Signal Arc Desktop". The selected project stays active and mock fallback stays off until access is restored.',
    },
    {
      status: 'forbidden' as const,
      projectTitle: 'Signal Arc',
      summary: 'Project runtime access is forbidden.',
    },
  ])('keeps %s runtime wording clear', ({ status, projectTitle, summary }) => {
    renderBadge({
      info: createProjectRuntimeInfoRecord({
        projectId: 'project-status-badge',
        projectTitle,
        source: 'api',
        status,
        summary,
        capabilities: {
          read: false,
          write: false,
        },
      }),
      onRetry: vi.fn(),
    })

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Signal Arc')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent(summary)
  })

  it('shows desktop model configuration badges when a desktop settings snapshot is available', async () => {
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
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
            errorCode: 'missing_key',
            status: 'failed',
            summary: 'One or more configured provider credentials are missing.',
          },
          credentialStatuses: [{
            configured: false,
            provider: 'openai-compatible',
            providerId: 'deepseek',
          }],
        }),
      },
    })

    renderBadge({
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
    })

    const status = screen.getByRole('status', { name: 'Project runtime status' })
    expect(status).toHaveTextContent('Real Project')
    await screen.findByText('Model Provider DeepSeek')
    expect(status).toHaveTextContent('Key Missing')
    expect(status).toHaveTextContent('Test Failed')
  })

  it('renders bridge-backed badge stories for failing desktop model configuration chips', async () => {
    const wrapper = createProjectRuntimeTestWrapper()
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getModelSettingsSnapshot: async () => RealLocalProjectTestFailed.parameters?.desktopModelSettingsSnapshot,
      },
    })

    render(RealLocalProjectTestFailed.render?.(RealLocalProjectTestFailed.args ?? {}, {} as never)
      ?? <ProjectRuntimeStatusBadge {...(RealLocalProjectTestFailed.args as Parameters<typeof ProjectRuntimeStatusBadge>[0])} />, { wrapper })

    const failingStatus = screen.getByRole('status', {
      name: 'Project runtime status',
    })

    await screen.findByText('Model Provider DeepSeek')
    expect(failingStatus).toHaveTextContent('Model Provider DeepSeek')
    expect(failingStatus).toHaveTextContent('Key Missing')
    expect(failingStatus).toHaveTextContent('Test Failed')
  })

  it('offers a model-settings repair CTA for real-project provider bindings that are not runnable yet', async () => {
    const user = userEvent.setup()
    const wrapper = createProjectRuntimeTestWrapper()
    const updateModelBinding = vi.fn()
    const deleteProviderCredential = vi.fn()
    const deleteProviderProfile = vi.fn()
    const saveProviderCredential = vi.fn()
    const saveProviderProfile = vi.fn()
    const testModelSettings = vi.fn()

    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getModelSettingsSnapshot: async () => ({
          providers: [
            { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
          ],
          bindings: {
            continuityReviewer: { provider: 'fixture' },
            planner: { provider: 'openai-compatible', providerId: 'deepseek', modelId: '' },
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
        }),
        updateModelBinding,
        deleteProviderProfile,
        deleteProviderCredential,
        saveProviderProfile,
        saveProviderCredential,
        testModelSettings,
      },
    })

    render(
      <ModelSettingsProvider>
        <ProjectRuntimeStatusBadge
          info={createProjectRuntimeInfoRecord({
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
          })}
        />
      </ModelSettingsProvider>,
      { wrapper },
    )

    await user.click(await screen.findByRole('button', { name: 'Model Settings' }))
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Key Missing')
  })
})

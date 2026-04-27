import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AllStates } from './ProjectRuntimeStatusBadge.stories'
import { createProjectRuntimeInfoRecord } from './project-runtime-info'
import { createProjectRuntimeTestWrapper } from './project-runtime-test-utils'
import { ProjectRuntimeStatusBadge } from './ProjectRuntimeStatusBadge'

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

  it('renders the local project store runtime state in the shared storybook status surface', () => {
    const wrapper = createProjectRuntimeTestWrapper()

    render(AllStates.render?.({}, {} as never), { wrapper })

    const localProjectStoreSection = screen.getByText('Local project store').parentElement
    expect(localProjectStoreSection).not.toBeNull()

    const localProjectStoreStatus = within(localProjectStoreSection!).getByRole('status', {
      name: 'Project runtime status',
    })

    expect(localProjectStoreStatus).toHaveTextContent('Local Alpha')
    expect(localProjectStoreStatus).toHaveTextContent('API')
    expect(localProjectStoreStatus).toHaveTextContent('Healthy')
    expect(localProjectStoreStatus).toHaveTextContent('Connected to local project store v1.')
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

  it.each([
    {
      status: 'unauthorized' as const,
      summary: 'Project runtime authentication is required.',
    },
    {
      status: 'forbidden' as const,
      summary: 'Project runtime access is forbidden.',
    },
  ])('keeps %s runtime wording clear', ({ status, summary }) => {
    renderBadge({
      info: createProjectRuntimeInfoRecord({
        projectId: 'project-status-badge',
        projectTitle: 'Signal Arc',
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
})

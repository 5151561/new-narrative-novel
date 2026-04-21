import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Mock')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Healthy')
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

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('API')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Healthy')
  })

  it('shows checking while the health query is in flight', () => {
    renderBadge({ isChecking: true })

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Checking')
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

    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent(summary)
  })
})

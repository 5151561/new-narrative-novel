import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { DesktopAppRoot } from './DesktopAppRoot'

afterEach(() => {
  Reflect.deleteProperty(window, 'narrativeDesktop')
})

function renderDesktopAppRoot(props: Partial<Parameters<typeof DesktopAppRoot>[0]> = {}) {
  return render(
    <I18nProvider>
      <DesktopAppRoot
        desktopBridge={props.desktopBridge}
        renderWorkbench={props.renderWorkbench ?? (() => <div data-testid="workbench-root">Workbench</div>)}
      />
    </I18nProvider>,
  )
}

describe('DesktopAppRoot', () => {
  it('renders the normal workbench path immediately when no desktop bridge exists', () => {
    renderDesktopAppRoot({
      desktopBridge: undefined,
    })

    expect(screen.getByTestId('workbench-root')).toBeInTheDocument()
  })

  it('shows the launcher before the workbench when no current desktop project is selected', async () => {
    renderDesktopAppRoot({
      desktopBridge: {
        getCurrentProject: vi.fn(async () => null),
      },
    })

    expect(screen.queryByTestId('workbench-root')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Open Demo Project/ })).toBeInTheDocument()
    })
  })

  it('enters the workbench after the user opens the dedicated demo project', async () => {
    const user = userEvent.setup()
    const openDemoProject = vi.fn(async () => ({
      projectId: 'book-signal-arc',
      projectMode: 'demo-fixture' as const,
      projectTitle: 'Signal Arc Demo',
    }))

    renderDesktopAppRoot({
      desktopBridge: {
        createRealProject: vi.fn(async () => null),
        getCurrentProject: vi.fn(async () => null),
        openDemoProject,
        openExistingProject: vi.fn(async () => null),
      },
    })

    await user.click(await screen.findByRole('button', { name: /Open Demo Project/ }))

    await waitFor(() => {
      expect(screen.getByTestId('workbench-root')).toBeInTheDocument()
    })
    expect(openDemoProject).toHaveBeenCalledTimes(1)
  })

  it('keeps the launcher visible and shows the failure when a startup action rejects', async () => {
    const user = userEvent.setup()

    renderDesktopAppRoot({
      desktopBridge: {
        createRealProject: vi.fn(async () => {
          throw new Error('Demo bootstrap failed.')
        }),
        getCurrentProject: vi.fn(async () => null),
        openDemoProject: vi.fn(async () => null),
        openExistingProject: vi.fn(async () => null),
      },
    })

    await user.click(await screen.findByRole('button', { name: /Create Real Project/ }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Demo bootstrap failed.')
    })
    expect(screen.queryByTestId('workbench-root')).not.toBeInTheDocument()
  })
})

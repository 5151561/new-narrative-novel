import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { ProjectLauncherScreen } from './ProjectLauncherScreen'

function renderLauncher(props: Partial<Parameters<typeof ProjectLauncherScreen>[0]> = {}) {
  return render(
    <I18nProvider>
      <ProjectLauncherScreen
        errorMessage={props.errorMessage}
        activeAction={props.activeAction}
        onCreateRealProject={props.onCreateRealProject ?? vi.fn()}
        onOpenDemoProject={props.onOpenDemoProject ?? vi.fn()}
        onOpenExistingProject={props.onOpenExistingProject ?? vi.fn()}
      />
    </I18nProvider>,
  )
}

describe('ProjectLauncherScreen', () => {
  it('renders the three explicit startup choices without mounting workbench chrome copy', () => {
    renderLauncher()

    expect(screen.getByRole('button', { name: /Open Demo Project/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Real Project/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open Existing Project/ })).toBeInTheDocument()
    expect(screen.queryByText('Navigator')).not.toBeInTheDocument()
  })

  it('disables launcher actions while a startup action is running', async () => {
    const user = userEvent.setup()
    const onOpenDemoProject = vi.fn(async () => undefined)

    renderLauncher({
      activeAction: 'open-demo-project',
      onOpenDemoProject,
    })

    expect(screen.getByText('Opening project…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open Demo Project/ })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Open Demo Project/ }))

    expect(onOpenDemoProject).not.toHaveBeenCalled()
  })

  it('surfaces launcher action failures on the pre-workbench screen', () => {
    renderLauncher({
      errorMessage: 'Demo project bootstrap failed.',
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Launcher action failed')
    expect(screen.getByRole('alert')).toHaveTextContent('Demo project bootstrap failed.')
  })
})

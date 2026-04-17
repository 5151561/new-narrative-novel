import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterOutlinerView } from './ChapterOutlinerView'

function updateSelectedSceneStructure(
  workspace: ReturnType<typeof buildChapterStoryWorkspace>,
  patch: Partial<Record<'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal', string>>,
) {
  return {
    ...workspace,
    scenes: workspace.scenes.map((scene) =>
      scene.id === workspace.selectedSceneId
        ? {
            ...scene,
            ...patch,
          }
        : scene,
    ),
  }
}

describe('ChapterOutlinerView', () => {
  it('renders dense structural fields for each scene row', () => {
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} />
      </I18nProvider>,
    )

    const firstRow = screen.getByRole('button', { name: /Beat line 1 Midnight Platform/i })

    expect(firstRow).toBeInTheDocument()
    expect(screen.getByText('Push the bargain into a public stalemate.')).toBeInTheDocument()
    expect(within(firstRow).getByText('Ren Voss')).toBeInTheDocument()
    expect(within(firstRow).getByText('Eastbound platform')).toBeInTheDocument()
    expect(within(firstRow).getByText('Ren needs leverage, Mei needs a higher price.')).toBeInTheDocument()
    expect(within(firstRow).getByText('The courier signal stays readable only to Ren.')).toBeInTheDocument()
    expect(within(firstRow).getByText('Unresolved 3')).toBeInTheDocument()
  })

  it('does not expose edit controls when no save callback is provided', () => {
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} />
      </I18nProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Edit Structure' })).not.toBeInTheDocument()
  })

  it('marks the selected row from workspace.selectedSceneId', () => {
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: /Beat line 2 Concourse Delay/i })).toHaveAttribute('aria-current', 'true')
  })

  it('calls onSelectScene when another row is clicked', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} onSelectScene={onSelectScene} />
      </I18nProvider>,
    )

    await user.click(screen.getByRole('button', { name: /Beat line 3 Ticket Window/i }))

    expect(onSelectScene).toHaveBeenCalledWith('scene-ticket-window')
  })

  it('opens a scene in orchestrate without triggering the primary row click', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const onOpenScene = vi.fn()
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} onSelectScene={onSelectScene} onOpenScene={onOpenScene} />
      </I18nProvider>,
    )

    const targetRow = screen.getByRole('button', { name: /Beat line 2 Concourse Delay/i }).closest('li')
    await user.click(within(targetRow!).getByRole('button', { name: 'Open in Orchestrate: Concourse Delay' }))

    expect(onOpenScene).toHaveBeenCalledWith('scene-concourse-delay', 'orchestrate')
    expect(onSelectScene).not.toHaveBeenCalled()
  })

  it('opens a scene in draft without triggering the primary row click', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const onOpenScene = vi.fn()
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} onSelectScene={onSelectScene} onOpenScene={onOpenScene} />
      </I18nProvider>,
    )

    const targetRow = screen.getByRole('button', { name: /Beat line 3 Ticket Window/i }).closest('li')
    await user.click(within(targetRow!).getByRole('button', { name: 'Open in Draft: Ticket Window' }))

    expect(onOpenScene).toHaveBeenCalledWith('scene-ticket-window', 'draft')
    expect(onSelectScene).not.toHaveBeenCalled()
  })

  it('limits inline editing to the selected row and saves only trimmed changed fields', async () => {
    const user = userEvent.setup()
    const onSaveScenePatch = vi.fn()
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} onSaveScenePatch={onSaveScenePatch} />
      </I18nProvider>,
    )

    expect(screen.getAllByRole('button', { name: 'Edit Structure' })).toHaveLength(1)
    expect(
      within(screen.getByRole('button', { name: /Beat line 2 Concourse Delay/i }).closest('li')!).getByRole('button', {
        name: 'Edit Structure',
      }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('button', { name: /Beat line 1 Midnight Platform/i }).closest('li')!).queryByRole('button', {
        name: 'Edit Structure',
      }),
    ).not.toBeInTheDocument()

    const selectedRow = screen.getByRole('button', { name: /Beat line 2 Concourse Delay/i }).closest('li')
    await user.click(within(selectedRow!).getByRole('button', { name: 'Edit Structure' }))

    const summaryInput = within(selectedRow!).getByLabelText('Summary')
    const purposeInput = within(selectedRow!).getByLabelText('Purpose')
    const povInput = within(selectedRow!).getByLabelText('POV')
    const locationInput = within(selectedRow!).getByLabelText('Location')
    const conflictInput = within(selectedRow!).getByLabelText('Conflict')
    const revealInput = within(selectedRow!).getByLabelText('Reveal')
    const saveButton = within(selectedRow!).getByRole('button', { name: 'Save' })

    expect(summaryInput).toHaveValue('Hold the exit timing back a little longer.')
    expect(purposeInput).toHaveValue('Hold pressure for the next scene.')
    expect(povInput).toHaveValue('Mei Arden')
    expect(locationInput).toHaveValue('Concourse hall')
    expect(conflictInput).toHaveValue('The crowd slows everyone down.')
    expect(revealInput).toHaveValue('Witness pressure carries inward.')

    await user.clear(summaryInput)
    await user.type(summaryInput, '  Updated summary for the concourse.  ')
    await user.clear(purposeInput)
    await user.type(purposeInput, '   ')

    expect(saveButton).toBeDisabled()

    await user.clear(purposeInput)
    await user.type(purposeInput, '  Updated purpose through the bottleneck.  ')
    await user.clear(revealInput)
    await user.type(revealInput, '  Updated reveal under crowd pressure.  ')

    expect(saveButton).toBeEnabled()

    await user.click(saveButton)

    expect(onSaveScenePatch).toHaveBeenCalledWith('scene-concourse-delay', {
      summary: 'Updated summary for the concourse.',
      purpose: 'Updated purpose through the bottleneck.',
      reveal: 'Updated reveal under crowd pressure.',
    })
    expect(within(selectedRow!).queryByLabelText('Summary')).not.toBeInTheDocument()
  })

  it('closes edit mode without mutation when nothing changed and resets when selection changes', async () => {
    const user = userEvent.setup()
    const onSaveScenePatch = vi.fn()
    const initialWorkspace = buildChapterStoryWorkspace('scene-concourse-delay')
    const { rerender } = render(
      <I18nProvider>
        <ChapterOutlinerView workspace={initialWorkspace} onSaveScenePatch={onSaveScenePatch} />
      </I18nProvider>,
    )

    const initialSelectedRow = screen.getByRole('button', { name: /Beat line 2 Concourse Delay/i }).closest('li')
    await user.click(within(initialSelectedRow!).getByRole('button', { name: 'Edit Structure' }))
    await user.click(within(initialSelectedRow!).getByRole('button', { name: 'Save' }))

    expect(onSaveScenePatch).not.toHaveBeenCalled()
    expect(within(initialSelectedRow!).queryByLabelText('Summary')).not.toBeInTheDocument()

    await user.click(within(initialSelectedRow!).getByRole('button', { name: 'Edit Structure' }))

    rerender(
      <I18nProvider>
        <ChapterOutlinerView
          workspace={buildChapterStoryWorkspace('scene-ticket-window')}
          onSaveScenePatch={onSaveScenePatch}
        />
      </I18nProvider>,
    )

    expect(screen.queryByLabelText('Summary')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Edit Structure' })).toHaveLength(1)
    expect(
      within(screen.getByRole('button', { name: /Beat line 3 Ticket Window/i }).closest('li')!).getByRole('button', {
        name: 'Edit Structure',
      }),
    ).toBeInTheDocument()
  })

  it('preserves the draft when a save fails after an optimistic rerender on the same selected scene', async () => {
    const user = userEvent.setup()
    const initialWorkspace = buildChapterStoryWorkspace('scene-concourse-delay')
    let rejectSave: ((error?: unknown) => void) | null = null
    const pendingSave = new Promise<void>((_resolve, reject) => {
      rejectSave = reject
    })
    const handledSave = pendingSave.catch(() => undefined)
    const onSaveScenePatch = vi.fn().mockImplementation(() => pendingSave)

    const { rerender } = render(
      <I18nProvider>
        <ChapterOutlinerView workspace={initialWorkspace} onSaveScenePatch={onSaveScenePatch} />
      </I18nProvider>,
    )

    const selectedRow = screen.getByRole('button', { name: /Beat line 2 Concourse Delay/i }).closest('li')
    await user.click(within(selectedRow!).getByRole('button', { name: 'Edit Structure' }))

    const summaryInput = within(selectedRow!).getByLabelText('Summary')
    const purposeInput = within(selectedRow!).getByLabelText('Purpose')
    const editedSummary = 'Edited summary that should survive rollback.'
    const editedPurpose = 'Edited purpose that should still be available.'

    await user.clear(summaryInput)
    await user.type(summaryInput, `  ${editedSummary}  `)
    await user.clear(purposeInput)
    await user.type(purposeInput, `  ${editedPurpose}  `)
    const saveButton = within(selectedRow!).getByRole('button', { name: 'Save' })

    expect(saveButton).toBeEnabled()

    await user.click(saveButton)

    await waitFor(() => {
      expect(onSaveScenePatch).toHaveBeenCalledWith('scene-concourse-delay', {
        summary: editedSummary,
        purpose: editedPurpose,
      })
    })

    rerender(
      <I18nProvider>
        <ChapterOutlinerView
          workspace={updateSelectedSceneStructure(initialWorkspace, {
            summary: editedSummary,
            purpose: editedPurpose,
          })}
          onSaveScenePatch={onSaveScenePatch}
          savingSceneId="scene-concourse-delay"
        />
      </I18nProvider>,
    )

    expect(screen.getByLabelText('Summary')).toHaveValue(`  ${editedSummary}  `)
    expect(screen.getByLabelText('Purpose')).toHaveValue(`  ${editedPurpose}  `)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    rejectSave?.(new Error('save failed'))
    await handledSave

    rerender(
      <I18nProvider>
        <ChapterOutlinerView workspace={initialWorkspace} onSaveScenePatch={onSaveScenePatch} />
      </I18nProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Summary')).toHaveValue(`  ${editedSummary}  `)
      expect(screen.getByLabelText('Purpose')).toHaveValue(`  ${editedPurpose}  `)
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    })
  })
})

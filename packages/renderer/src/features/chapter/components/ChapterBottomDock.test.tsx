import { render, screen, within } from '@testing-library/react'

describe('ChapterBottomDock', () => {
  it('shows unresolved support, problem summaries, and assembly hints in the problems area', async () => {
    const { ChapterBottomDock } = await import('./ChapterBottomDock')

    render(
      <ChapterBottomDock
        problems={{
          unresolvedCount: 6,
          selectedScene: {
            title: 'Midnight Platform',
            summary: 'Keep public witness pressure alive at the edge of the scene.',
            unresolvedLabel: 'Unresolved 3',
          },
          problemsSummary: [
            {
              id: 'bell-timing',
              label: 'Bell timing',
              detail: 'The exit bell still lands too early.',
            },
          ],
          assemblyHints: [
            {
              id: 'carry-pressure',
              label: 'Carry platform pressure',
              detail: 'Carry platform pressure into the concourse.',
            },
          ],
        }}
        activity={[]}
      />,
    )

    const problemsSection = screen.getByRole('heading', { name: 'Problems' }).closest('section')

    expect(problemsSection).not.toBeNull()
    expect(within(problemsSection!).getByText('Unresolved 6')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Midnight Platform · Unresolved 3')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Bell timing')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Carry platform pressure')).toBeInTheDocument()
    expect(within(problemsSection!).queryByText('Missing reveal')).not.toBeInTheDocument()
  })

  it('shows recent view and scene activity in the activity area', async () => {
    const { ChapterBottomDock } = await import('./ChapterBottomDock')

    render(
      <ChapterBottomDock
        problems={{
          unresolvedCount: 6,
          selectedScene: {
            title: 'Midnight Platform',
            summary: 'Keep public witness pressure alive at the edge of the scene.',
            unresolvedLabel: 'Unresolved 3',
          },
          problemsSummary: [],
          assemblyHints: [],
        }}
        activity={[
          {
            id: 'activity-1',
            kind: 'view',
            title: 'Entered Outliner',
            detail: 'The chapter workbench opened on the outliner surface.',
            tone: 'accent',
          },
          {
            id: 'activity-2',
            kind: 'scene',
            title: 'Focused Midnight Platform',
            detail: 'The selected scene stayed on Midnight Platform.',
            tone: 'neutral',
          },
        ]}
      />,
    )

    const activitySection = screen.getByRole('heading', { name: 'Activity' }).closest('section')

    expect(activitySection).not.toBeNull()
    expect(within(activitySection!).getByText('Entered Outliner')).toBeInTheDocument()
    expect(within(activitySection!).getByText('Focused Midnight Platform')).toBeInTheDocument()
  })

  it('keeps activity display-only so it cannot become a second selected-scene source', async () => {
    const { ChapterBottomDock } = await import('./ChapterBottomDock')

    render(
      <ChapterBottomDock
        problems={{
          unresolvedCount: 2,
          selectedScene: {
            title: 'Concourse Delay',
            summary: 'Hold witness pressure at the edge of the exit.',
            unresolvedLabel: 'Unresolved 2',
          },
          problemsSummary: [],
          assemblyHints: [],
        }}
        activity={[
          {
            id: 'activity-1',
            kind: 'scene',
            title: 'Focused Concourse Delay',
            detail: 'The selected scene moved to Concourse Delay.',
            tone: 'neutral',
          },
        ]}
      />,
    )

    const activitySection = screen.getByRole('heading', { name: 'Activity' }).closest('section')

    expect(activitySection).not.toBeNull()
    expect(within(activitySection!).queryByRole('button')).not.toBeInTheDocument()
    expect(within(activitySection!).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Concourse Delay · Unresolved 2')).toBeInTheDocument()
  })
})

import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { WorkbenchEditorContext } from './workbench-editor-context'
import { WorkbenchEditorTabs } from './WorkbenchEditorTabs'
import { describeWorkbenchEditorContext } from './workbench-editor-descriptors'

function makeContext(index: number, activeAt = index): WorkbenchEditorContext {
  return {
    id: `scene:scene-${index}:orchestrate`,
    route: {
      scope: 'scene',
      sceneId: `scene-${index}`,
      lens: 'orchestrate',
      tab: 'execution',
    },
    title: `Scene ${index} · Orchestrate`,
    subtitle: `scene-${index}`,
    updatedAt: activeAt,
    lastActiveAt: activeAt,
  }
}

function renderTabs(
  contexts = [makeContext(1), makeContext(2)],
  activeContextId = contexts[0]?.id ?? null,
  onActivateContext = vi.fn(),
  onCloseContext = vi.fn(),
) {
  render(
    <WorkbenchEditorTabs
      contexts={contexts}
      activeContextId={activeContextId}
      onActivateContext={onActivateContext}
      onCloseContext={onCloseContext}
    />,
  )

  return {
    onActivateContext,
    onCloseContext,
  }
}

function makeDescribedContext(
  route: WorkbenchEditorContext['route'],
  index: number,
): WorkbenchEditorContext {
  const descriptor = describeWorkbenchEditorContext(
    route,
    {
      shell: {
        sceneEditor: 'Scene',
        chapterEditor: 'Chapter',
        assetEditor: 'Asset',
        bookEditor: 'Book',
        structureLens: 'Structure',
        orchestrateLens: 'Orchestrate',
        draftLens: 'Draft',
        knowledgeLens: 'Knowledge',
      },
    },
    'en',
  )

  return {
    id: descriptor.id,
    route,
    title: descriptor.title,
    subtitle: descriptor.subtitle,
    updatedAt: index,
    lastActiveAt: index,
  }
}

describe('WorkbenchEditorTabs', () => {
  it('renders tablist and tabs', () => {
    renderTabs()

    expect(screen.getByRole('tablist', { name: 'Open Editors' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('sets active tab aria-selected to true', () => {
    renderTabs([makeContext(1), makeContext(2)], 'scene:scene-2:orchestrate')

    expect(screen.getByRole('tab', { name: /Scene 2/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Scene 1/ })).toHaveAttribute('aria-selected', 'false')
  })

  it('clicking tab calls onActivateContext with id', async () => {
    const user = userEvent.setup()
    const { onActivateContext } = renderTabs()

    await user.click(screen.getByRole('tab', { name: /Scene 2/ }))

    expect(onActivateContext).toHaveBeenCalledWith('scene:scene-2:orchestrate')
  })

  it('clicking close calls onCloseContext and does not activate tab', async () => {
    const user = userEvent.setup()
    const { onActivateContext, onCloseContext } = renderTabs()

    await user.click(screen.getByRole('button', { name: 'Close Editor: Scene 2 · Orchestrate' }))

    expect(onCloseContext).toHaveBeenCalledWith('scene:scene-2:orchestrate')
    expect(onActivateContext).not.toHaveBeenCalled()
  })

  it('long list renders without dropping tabs', () => {
    const contexts = Array.from({ length: 16 }, (_, index) => makeContext(index + 1))

    renderTabs(contexts)

    expect(screen.getAllByRole('tab')).toHaveLength(16)
    expect(screen.getByRole('tab', { name: /Scene 16/ })).toBeInTheDocument()
  })

  it('does not visibly render raw object ids as subtitles', () => {
    renderTabs([makeContext(1)])

    expect(screen.getByRole('tab', { name: 'Scene 1 · Orchestrate' })).toBeInTheDocument()
    expect(screen.queryByText('scene-1')).not.toBeInTheDocument()
  })

  it('keeps same scope lens and view tabs distinguishable with clean object labels', () => {
    renderTabs([
      makeDescribedContext(
        {
          scope: 'scene',
          sceneId: 'scene-midnight-platform',
          lens: 'orchestrate',
          tab: 'execution',
        },
        1,
      ),
      makeDescribedContext(
        {
          scope: 'scene',
          sceneId: 'scene-concourse-delay',
          lens: 'orchestrate',
          tab: 'execution',
        },
        2,
      ),
    ])

    expect(screen.getByRole('tab', { name: 'Scene · Orchestrate Midnight Platform · Execution' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Scene · Orchestrate Concourse Delay · Execution' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close Editor: Scene · Orchestrate / Midnight Platform · Execution' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close Editor: Scene · Orchestrate / Concourse Delay · Execution' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /scene-midnight-platform/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /scene-concourse-delay/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /scene-midnight-platform/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /scene-concourse-delay/i })).not.toBeInTheDocument()
    expect(screen.queryByText('scene-midnight-platform')).not.toBeInTheDocument()
    expect(screen.queryByText('scene-concourse-delay')).not.toBeInTheDocument()
  })

  it('close buttons have accessible labels', () => {
    renderTabs([makeContext(1), makeContext(2)])

    const tablist = screen.getByRole('tablist', { name: 'Open Editors' })
    expect(
      within(tablist).getByRole('button', { name: 'Close Editor: Scene 1 · Orchestrate' }),
    ).toBeInTheDocument()
    expect(
      within(tablist).getByRole('button', { name: 'Close Editor: Scene 2 · Orchestrate' }),
    ).toBeInTheDocument()
  })
})

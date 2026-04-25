import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

import { WorkbenchEditorProvider, useOptionalWorkbenchEditor, useWorkbenchEditor } from './WorkbenchEditorProvider'

const TEST_STORAGE_KEY = 'workbench-editor-provider-test'

const sceneRoute = (sceneId: string): WorkbenchRouteState => ({
  scope: 'scene',
  sceneId,
  lens: 'orchestrate',
  tab: 'execution',
})

const draftRoute = (sceneId: string): WorkbenchRouteState => ({
  scope: 'scene',
  sceneId,
  lens: 'draft',
  tab: 'prose',
})

function EditorProbe() {
  const editor = useWorkbenchEditor()

  return (
    <div>
      <div data-testid="context-ids">
        {editor?.state.contexts.map((context) => context.id).join('|') ?? 'missing'}
      </div>
      <div data-testid="active-context-id">{editor?.state.activeContextId ?? 'none'}</div>
      <button type="button" onClick={() => editor?.activateContext('scene:scene-a:orchestrate')}>
        Activate A
      </button>
      <button type="button" onClick={() => editor?.closeContext('scene:scene-a:orchestrate')}>
        Close A
      </button>
      <button type="button" onClick={() => editor?.closeContext('scene:scene-b:draft')}>
        Close B
      </button>
    </div>
  )
}

function OptionalProbe() {
  const editor = useOptionalWorkbenchEditor()

  return <div data-testid="optional-editor">{editor ? 'present' : 'missing'}</div>
}

function renderProvider(route: WorkbenchRouteState, replaceRoute = vi.fn()) {
  const view = render(
    <WorkbenchEditorProvider route={route} replaceRoute={replaceRoute} storageKey={TEST_STORAGE_KEY}>
      <EditorProbe />
    </WorkbenchEditorProvider>,
  )

  return {
    ...view,
    replaceRoute,
    rerenderWithRoute: (nextRoute: WorkbenchRouteState) =>
      view.rerender(
        <WorkbenchEditorProvider
          route={nextRoute}
          replaceRoute={replaceRoute}
          storageKey={TEST_STORAGE_KEY}
        >
          <EditorProbe />
        </WorkbenchEditorProvider>,
      ),
  }
}

describe('WorkbenchEditorProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('syncs the current route on mount and route change', async () => {
    const { rerenderWithRoute } = renderProvider(sceneRoute('scene-a'))

    await waitFor(() =>
      expect(screen.getByTestId('context-ids')).toHaveTextContent('scene:scene-a:orchestrate'),
    )

    rerenderWithRoute(draftRoute('scene-b'))

    await waitFor(() =>
      expect(screen.getByTestId('context-ids')).toHaveTextContent(
        'scene:scene-a:orchestrate|scene:scene-b:draft',
      ),
    )
    expect(screen.getByTestId('active-context-id')).toHaveTextContent('scene:scene-b:draft')
  })

  it('activating a tab calls replaceRoute with the saved route', async () => {
    const user = userEvent.setup()
    const { replaceRoute, rerenderWithRoute } = renderProvider(sceneRoute('scene-a'))

    await waitFor(() =>
      expect(screen.getByTestId('context-ids')).toHaveTextContent('scene:scene-a:orchestrate'),
    )
    rerenderWithRoute(draftRoute('scene-b'))
    await waitFor(() =>
      expect(screen.getByTestId('active-context-id')).toHaveTextContent('scene:scene-b:draft'),
    )

    await user.click(screen.getByRole('button', { name: 'Activate A' }))

    expect(replaceRoute).toHaveBeenCalledWith(sceneRoute('scene-a'))
  })

  it('closing an inactive tab does not call replaceRoute', async () => {
    const user = userEvent.setup()
    const { replaceRoute, rerenderWithRoute } = renderProvider(sceneRoute('scene-a'))

    await waitFor(() =>
      expect(screen.getByTestId('context-ids')).toHaveTextContent('scene:scene-a:orchestrate'),
    )
    rerenderWithRoute(draftRoute('scene-b'))
    await waitFor(() =>
      expect(screen.getByTestId('active-context-id')).toHaveTextContent('scene:scene-b:draft'),
    )

    await user.click(screen.getByRole('button', { name: 'Close A' }))

    expect(replaceRoute).not.toHaveBeenCalled()
    expect(screen.getByTestId('context-ids')).toHaveTextContent('scene:scene-b:draft')
  })

  it('closing the active tab calls replaceRoute with fallback route', async () => {
    const user = userEvent.setup()
    const { replaceRoute, rerenderWithRoute } = renderProvider(sceneRoute('scene-a'))

    await waitFor(() =>
      expect(screen.getByTestId('context-ids')).toHaveTextContent('scene:scene-a:orchestrate'),
    )
    rerenderWithRoute(draftRoute('scene-b'))
    await waitFor(() =>
      expect(screen.getByTestId('active-context-id')).toHaveTextContent('scene:scene-b:draft'),
    )

    await user.click(screen.getByRole('button', { name: 'Close B' }))

    expect(replaceRoute).toHaveBeenCalledWith(sceneRoute('scene-a'))
  })

  it('optional hook returns null outside provider', () => {
    render(<OptionalProbe />)

    expect(screen.getByTestId('optional-editor')).toHaveTextContent('missing')
  })
})

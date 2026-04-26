import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

import { getWorkbenchEditorContextId } from './workbench-editor-context'
import { MAX_WORKBENCH_EDITOR_CONTEXTS } from './workbench-editor-storage'
import { useWorkbenchEditorState } from './useWorkbenchEditorState'

const TEST_STORAGE_KEY = 'workbench-editor-state-test'

const sceneOrchestrateRoute = (sceneId = 'scene-midnight-platform'): WorkbenchRouteState => ({
  scope: 'scene',
  sceneId,
  lens: 'orchestrate',
  tab: 'execution',
})

const sceneDraftRoute = (sceneId = 'scene-midnight-platform'): WorkbenchRouteState => ({
  scope: 'scene',
  sceneId,
  lens: 'draft',
  tab: 'prose',
})

const bookReviewRoute = (reviewIssueId = 'issue-1'): WorkbenchRouteState => ({
  scope: 'book',
  bookId: 'book-signal-arc',
  lens: 'draft',
  view: 'signals',
  draftView: 'review',
  reviewFilter: 'blockers',
  reviewStatusFilter: 'open',
  reviewIssueId,
  selectedChapterId: 'chapter-signals-in-rain',
})

function renderEditorState(storageKey = TEST_STORAGE_KEY) {
  return renderHook(() => useWorkbenchEditorState({ storageKey }))
}

describe('useWorkbenchEditorState', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
    window.history.replaceState({}, '', '/workbench?scope=scene&tab=execution')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty state for invalid localStorage JSON', () => {
    window.localStorage.setItem(TEST_STORAGE_KEY, '{broken json')

    const { result } = renderEditorState()

    expect(result.current.state).toEqual({
      contexts: [],
      contextIds: [],
      activeContextId: null,
    })
  })

  it('open scene orchestrate route creates context', () => {
    const { result } = renderEditorState()
    const route = sceneOrchestrateRoute()

    act(() => {
      result.current.openOrUpdateContext(route)
    })

    expect(result.current.state.contexts).toHaveLength(1)
    expect(result.current.state.contexts[0]).toMatchObject({
      id: 'scene:scene-midnight-platform:orchestrate',
      route,
      title: 'Scene · Orchestrate',
      subtitle: 'scene-midnight-platform',
    })
    expect(result.current.state.activeContextId).toBe('scene:scene-midnight-platform:orchestrate')
  })

  it('same scene and lens route changes update snapshot without duplicate', () => {
    const { result } = renderEditorState()

    act(() => {
      result.current.openOrUpdateContext(sceneOrchestrateRoute())
      result.current.openOrUpdateContext({
        ...sceneOrchestrateRoute(),
        proposalId: 'proposal-new',
      })
    })

    expect(result.current.state.contexts).toHaveLength(1)
    expect(result.current.state.contexts[0].route).toMatchObject({
      proposalId: 'proposal-new',
    })
  })

  it('context ids ignore fine-grained scene proposal and book review route parameters', () => {
    const sceneRoute = sceneOrchestrateRoute()
    const firstBookRoute = bookReviewRoute('issue-1')
    const secondBookRoute = bookReviewRoute('issue-2')

    expect(getWorkbenchEditorContextId({ ...sceneRoute, proposalId: 'proposal-a' })).toBe(
      getWorkbenchEditorContextId({ ...sceneRoute, proposalId: 'proposal-b' }),
    )
    expect(getWorkbenchEditorContextId(firstBookRoute)).toBe(getWorkbenchEditorContextId(secondBookRoute))
  })

  it('scene orchestrate and scene draft are different contexts', () => {
    const { result } = renderEditorState()

    act(() => {
      result.current.openOrUpdateContext(sceneOrchestrateRoute())
      result.current.openOrUpdateContext(sceneDraftRoute())
    })

    expect(result.current.state.contexts.map((context) => context.id)).toEqual([
      'scene:scene-midnight-platform:orchestrate',
      'scene:scene-midnight-platform:draft',
    ])
  })

  it('activateContext does not reorder the displayed context list', () => {
    const { result } = renderEditorState()

    act(() => {
      result.current.openOrUpdateContext(sceneOrchestrateRoute('scene-a'))
      result.current.openOrUpdateContext(sceneOrchestrateRoute('scene-b'))
      result.current.openOrUpdateContext(sceneOrchestrateRoute('scene-c'))
      result.current.activateContext('scene:scene-a:orchestrate')
    })

    expect(result.current.state.contexts.map((context) => context.id)).toEqual([
      'scene:scene-a:orchestrate',
      'scene:scene-b:orchestrate',
      'scene:scene-c:orchestrate',
    ])
    expect(result.current.state.activeContextId).toBe('scene:scene-a:orchestrate')
  })

  it('activateContext returns saved route', () => {
    const { result } = renderEditorState()
    const route = sceneOrchestrateRoute()
    const id = getWorkbenchEditorContextId(route)
    let activatedRoute: WorkbenchRouteState | null = null

    act(() => {
      result.current.openOrUpdateContext(route)
      activatedRoute = result.current.activateContext(id)
    })

    expect(activatedRoute).toEqual(route)
    expect(result.current.state.activeContextId).toBe(id)
  })

  it('close non-active returns null', () => {
    const { result } = renderEditorState()
    let nextRoute: WorkbenchRouteState | null = null

    act(() => {
      result.current.openOrUpdateContext(sceneOrchestrateRoute())
      result.current.openOrUpdateContext(sceneDraftRoute())
      nextRoute = result.current.closeContext('scene:scene-midnight-platform:orchestrate')
    })

    expect(nextRoute).toBeNull()
    expect(result.current.state.contexts.map((context) => context.id)).toEqual([
      'scene:scene-midnight-platform:draft',
    ])
  })

  it('close active returns most recent remaining route', () => {
    const { result } = renderEditorState()
    let nextRoute: WorkbenchRouteState | null = null

    act(() => {
      result.current.openOrUpdateContext(sceneOrchestrateRoute('scene-a'))
      result.current.openOrUpdateContext(sceneDraftRoute('scene-b'))
      result.current.openOrUpdateContext(sceneOrchestrateRoute('scene-c'))
      nextRoute = result.current.closeContext('scene:scene-c:orchestrate')
    })

    expect(nextRoute).toEqual(sceneDraftRoute('scene-b'))
    expect(result.current.state.activeContextId).toBe('scene:scene-b:draft')
  })

  it('more than 12 contexts clamps by lastActiveAt', () => {
    const { result } = renderEditorState()

    act(() => {
      for (let index = 0; index < MAX_WORKBENCH_EDITOR_CONTEXTS + 3; index += 1) {
        result.current.openOrUpdateContext(sceneOrchestrateRoute(`scene-${index}`))
      }
    })

    expect(result.current.state.contexts).toHaveLength(MAX_WORKBENCH_EDITOR_CONTEXTS)
    expect(result.current.state.contexts[0].id).toBe('scene:scene-3:orchestrate')
    expect(result.current.state.contexts.at(-1)?.id).toBe('scene:scene-14:orchestrate')
  })

  it('remount restores localStorage contexts', () => {
    const firstRender = renderEditorState()

    act(() => {
      firstRender.result.current.openOrUpdateContext(sceneOrchestrateRoute())
      firstRender.result.current.openOrUpdateContext(sceneDraftRoute())
    })

    firstRender.unmount()
    const secondRender = renderEditorState()

    expect(secondRender.result.current.state.contexts.map((context) => context.id)).toEqual([
      'scene:scene-midnight-platform:orchestrate',
      'scene:scene-midnight-platform:draft',
    ])
    expect(secondRender.result.current.state.activeContextId).toBe('scene:scene-midnight-platform:draft')
  })

  it('restores valid chapter asset and book route snapshots from localStorage', () => {
    window.localStorage.setItem(
      TEST_STORAGE_KEY,
      JSON.stringify({
        contextIds: [
          'chapter:chapter-signals-in-rain:structure',
          'asset:asset-ren-voss:knowledge',
          'book:book-signal-arc:draft',
        ],
        activeContextId: 'book:book-signal-arc:draft',
        contexts: [
          {
            id: 'chapter:chapter-signals-in-rain:structure',
            route: {
              scope: 'chapter',
              chapterId: 'chapter-signals-in-rain',
              lens: 'structure',
              view: 'outliner',
              sceneId: 'scene-midnight-platform',
            },
            title: 'Chapter · Structure',
            subtitle: 'chapter-signals-in-rain',
            updatedAt: 1,
            lastActiveAt: 1,
          },
          {
            id: 'asset:asset-ren-voss:knowledge',
            route: {
              scope: 'asset',
              assetId: 'asset-ren-voss',
              lens: 'knowledge',
              view: 'relations',
            },
            title: 'Asset · Knowledge',
            subtitle: 'asset-ren-voss',
            updatedAt: 2,
            lastActiveAt: 2,
          },
          {
            id: 'book:book-signal-arc:draft',
            route: {
              scope: 'book',
              bookId: 'book-signal-arc',
              lens: 'draft',
              view: 'signals',
              draftView: 'review',
              reviewFilter: 'blockers',
              reviewStatusFilter: 'open',
              reviewIssueId: 'issue-1',
              selectedChapterId: 'chapter-signals-in-rain',
            },
            title: 'Book · Draft',
            subtitle: 'book-signal-arc',
            updatedAt: 3,
            lastActiveAt: 3,
          },
        ],
      }),
    )

    const { result } = renderEditorState()

    expect(result.current.state.contexts.map((context) => context.id)).toEqual([
      'chapter:chapter-signals-in-rain:structure',
      'asset:asset-ren-voss:knowledge',
      'book:book-signal-arc:draft',
    ])
    expect(result.current.state.contexts.map((context) => context.route.scope)).toEqual([
      'chapter',
      'asset',
      'book',
    ])
  })

  it('ignores malformed old and unknown stored contexts while restoring valid route snapshots', () => {
    window.localStorage.setItem(
      TEST_STORAGE_KEY,
      JSON.stringify({
        version: 0,
        contextIds: [
          'scene:scene-valid:orchestrate',
          'scene:missing-tab:orchestrate',
          'review:issue-1:detail',
          'book:book-signal-arc:draft',
        ],
        activeContextId: 'review:issue-1:detail',
        contexts: [
          {
            id: 'scene:scene-valid:orchestrate',
            route: sceneOrchestrateRoute('scene-valid'),
            title: 'Scene · Orchestrate',
            subtitle: 'scene-valid',
            updatedAt: 10,
            lastActiveAt: 10,
          },
          {
            id: 'scene:missing-tab:orchestrate',
            route: {
              scope: 'scene',
              sceneId: 'missing-tab',
              lens: 'orchestrate',
            },
            title: 'Old scene',
            subtitle: 'missing-tab',
            updatedAt: 9,
            lastActiveAt: 9,
          },
          {
            id: 'review:issue-1:detail',
            route: {
              scope: 'review',
              reviewIssueId: 'issue-1',
            },
            title: 'Unknown review route',
            subtitle: 'issue-1',
            updatedAt: 8,
            lastActiveAt: 12,
          },
          {
            id: 'book:book-signal-arc:draft',
            route: {
              scope: 'book',
              bookId: 'book-signal-arc',
              lens: 'draft',
              view: 'signals',
              draftView: 'review',
              reviewIssueId: 'issue-2',
            },
            title: 'Book · Draft',
            subtitle: 'book-signal-arc',
            updatedAt: 11,
            lastActiveAt: 11,
          },
        ],
      }),
    )

    const { result } = renderEditorState()

    expect(result.current.state.contexts.map((context) => context.id)).toEqual([
      'scene:scene-valid:orchestrate',
      'book:book-signal-arc:draft',
    ])
    expect(result.current.state.activeContextId).toBe('book:book-signal-arc:draft')
  })

  it('returns empty state when localStorage read throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    const { result } = renderEditorState()

    expect(result.current.state).toEqual({
      contexts: [],
      contextIds: [],
      activeContextId: null,
    })
  })

  it('updates in-memory editor state when localStorage write throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const { result } = renderEditorState()

    act(() => {
      result.current.openOrUpdateContext(sceneOrchestrateRoute())
      result.current.openOrUpdateContext(sceneDraftRoute())
      result.current.activateContext('scene:scene-midnight-platform:orchestrate')
    })

    expect(result.current.state.contexts.map((context) => context.id)).toEqual([
      'scene:scene-midnight-platform:orchestrate',
      'scene:scene-midnight-platform:draft',
    ])
    expect(result.current.state.activeContextId).toBe('scene:scene-midnight-platform:orchestrate')
  })

  it('resetEditorContexts updates in-memory state when localStorage remove throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    const { result } = renderEditorState()

    act(() => {
      result.current.openOrUpdateContext(sceneOrchestrateRoute())
      result.current.resetEditorContexts()
    })

    expect(result.current.state).toEqual({
      contexts: [],
      contextIds: [],
      activeContextId: null,
    })
  })

  it('hook does not modify window.location.search', () => {
    const initialSearch = window.location.search
    const { result } = renderEditorState()

    act(() => {
      result.current.openOrUpdateContext(sceneOrchestrateRoute())
      result.current.activateContext('scene:scene-midnight-platform:orchestrate')
      result.current.closeContext('scene:scene-midnight-platform:orchestrate')
      result.current.resetEditorContexts()
    })

    expect(window.location.search).toBe(initialSearch)
  })
})

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_WORKBENCH_LAYOUT_STATE,
  WORKBENCH_LAYOUT_BOUNDS,
  clampWorkbenchLayoutState,
  getWorkbenchBodyGridColumns,
  getWorkbenchShellGridRows,
  parseWorkbenchLayoutState,
  serializeWorkbenchLayoutState,
} from '../types/workbench-layout'
import {
  DEFAULT_WORKBENCH_LAYOUT_STORAGE_KEY,
  resetWorkbenchLayoutStorage,
  useWorkbenchLayoutState,
} from './useWorkbenchLayoutState'

const TEST_STORAGE_KEY = 'workbench-layout-test'
const ALT_TEST_STORAGE_KEY = 'workbench-layout-alt-test'

describe('workbench layout helpers', () => {
  it('falls back to default layout for invalid localStorage JSON', () => {
    expect(parseWorkbenchLayoutState('{broken json')).toEqual(DEFAULT_WORKBENCH_LAYOUT_STATE)
  })

  it('merges partial state with defaults and clamps numeric values', () => {
    expect(
      clampWorkbenchLayoutState({
        navigatorVisible: false,
        inspectorWidth: -9999,
      }),
    ).toEqual({
      ...DEFAULT_WORKBENCH_LAYOUT_STATE,
      navigatorVisible: false,
      inspectorWidth: WORKBENCH_LAYOUT_BOUNDS.inspector.min,
    })
  })

  it('returns hidden grid values and maximized dock row values', () => {
    expect(
      getWorkbenchBodyGridColumns({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        navigatorVisible: false,
        inspectorVisible: false,
      }),
    ).toBe('68px 0px minmax(0,1fr) 0px')

    expect(
      getWorkbenchShellGridRows({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        bottomDockMaximized: true,
      }),
    ).toBe(`minmax(72px,auto) minmax(0,1fr) ${WORKBENCH_LAYOUT_BOUNDS.bottomDock.maximizedSize}px`)

    expect(
      getWorkbenchShellGridRows({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        bottomDockVisible: false,
        bottomDockMaximized: true,
      }),
    ).toBe('minmax(72px,auto) minmax(0,1fr) 0px')
  })

  it('serializes a canonical clamped state', () => {
    expect(
      serializeWorkbenchLayoutState({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        navigatorWidth: 9999,
        bottomDockHeight: -9999,
      }),
    ).toBe(
      JSON.stringify({
        ...DEFAULT_WORKBENCH_LAYOUT_STATE,
        navigatorWidth: WORKBENCH_LAYOUT_BOUNDS.navigator.max,
        bottomDockHeight: WORKBENCH_LAYOUT_BOUNDS.bottomDock.min,
      }),
    )
  })
})

describe('useWorkbenchLayoutState', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/workbench?scope=scene&tab=execution')
  })

  it('renders the default state from the hook', () => {
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    expect(result.current.state).toEqual(DEFAULT_WORKBENCH_LAYOUT_STATE)
  })

  it('uses the default storage key when resetting layout storage', () => {
    window.localStorage.setItem(
      DEFAULT_WORKBENCH_LAYOUT_STORAGE_KEY,
      serializeWorkbenchLayoutState(DEFAULT_WORKBENCH_LAYOUT_STATE),
    )

    resetWorkbenchLayoutStorage()

    expect(window.localStorage.getItem(DEFAULT_WORKBENCH_LAYOUT_STORAGE_KEY)).toBeNull()
  })

  it('falls back to default state for invalid localStorage JSON', () => {
    window.localStorage.setItem(TEST_STORAGE_KEY, '{broken json')

    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    expect(result.current.state).toEqual(DEFAULT_WORKBENCH_LAYOUT_STATE)
  })

  it('togglePart hides the navigator state', () => {
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => result.current.togglePart('navigator'))

    expect(result.current.state.navigatorVisible).toBe(false)
  })

  it('setPartVisible hides the inspector state', () => {
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => result.current.setPartVisible('inspector', false))

    expect(result.current.state.inspectorVisible).toBe(false)
  })

  it('clamps navigator resize at the maximum width', () => {
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => result.current.resizePart('navigator', 9999))

    expect(result.current.state.navigatorWidth).toBe(WORKBENCH_LAYOUT_BOUNDS.navigator.max)
  })

  it('clamps bottom dock resize at the minimum height', () => {
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => result.current.resizePart('bottomDock', -9999))

    expect(result.current.state.bottomDockHeight).toBe(WORKBENCH_LAYOUT_BOUNDS.bottomDock.min)
  })

  it('toggles bottom dock maximized without destroying normal height', () => {
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => result.current.resizePart('bottomDock', 64))
    const normalHeight = result.current.state.bottomDockHeight

    act(() => result.current.toggleBottomDockMaximized())

    expect(result.current.state.bottomDockMaximized).toBe(true)
    expect(result.current.state.bottomDockHeight).toBe(normalHeight)

    act(() => result.current.toggleBottomDockMaximized())

    expect(result.current.state.bottomDockMaximized).toBe(false)
    expect(result.current.state.bottomDockHeight).toBe(normalHeight)
  })

  it('toggles bottom dock maximized without changing side pane visibility preferences', () => {
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => {
      result.current.setPartVisible('navigator', false)
      result.current.setPartVisible('inspector', false)
      result.current.toggleBottomDockMaximized()
    })

    expect(result.current.state.bottomDockMaximized).toBe(true)
    expect(result.current.state.navigatorVisible).toBe(false)
    expect(result.current.state.inspectorVisible).toBe(false)

    act(() => result.current.toggleBottomDockMaximized())

    expect(result.current.state.bottomDockMaximized).toBe(false)
    expect(result.current.state.navigatorVisible).toBe(false)
    expect(result.current.state.inspectorVisible).toBe(false)
  })

  it('sets bottom dock maximized directly', () => {
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => result.current.setBottomDockMaximized(true))

    expect(result.current.state.bottomDockMaximized).toBe(true)

    act(() => result.current.setBottomDockMaximized(false))

    expect(result.current.state.bottomDockMaximized).toBe(false)
  })

  it('restores persisted state after remount', () => {
    const firstRender = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => {
      firstRender.result.current.togglePart('navigator')
      firstRender.result.current.resizePart('inspector', 40)
    })

    firstRender.unmount()

    const secondRender = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    expect(secondRender.result.current.state.navigatorVisible).toBe(false)
    expect(secondRender.result.current.state.inspectorWidth).toBe(DEFAULT_WORKBENCH_LAYOUT_STATE.inspectorWidth + 40)
  })

  it('loads a changed storage key without writing the previous key state into it', () => {
    const keyBState = {
      ...DEFAULT_WORKBENCH_LAYOUT_STATE,
      inspectorVisible: false,
      bottomDockHeight: WORKBENCH_LAYOUT_BOUNDS.bottomDock.max,
    }
    window.localStorage.setItem(ALT_TEST_STORAGE_KEY, serializeWorkbenchLayoutState(keyBState))

    const { result, rerender } = renderHook(({ storageKey }) => useWorkbenchLayoutState(storageKey), {
      initialProps: { storageKey: TEST_STORAGE_KEY },
    })

    act(() => result.current.togglePart('navigator'))

    expect(result.current.state.navigatorVisible).toBe(false)

    rerender({ storageKey: ALT_TEST_STORAGE_KEY })

    expect(result.current.state).toEqual(keyBState)
    expect(parseWorkbenchLayoutState(window.localStorage.getItem(ALT_TEST_STORAGE_KEY))).toEqual(keyBState)
  })

  it('resetLayout restores defaults', () => {
    const { result, unmount } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => {
      result.current.togglePart('navigator')
      result.current.resizePart('bottomDock', 80)
      result.current.resetLayout()
    })

    expect(result.current.state).toEqual(DEFAULT_WORKBENCH_LAYOUT_STATE)

    unmount()

    const remounted = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    expect(remounted.result.current.state).toEqual(DEFAULT_WORKBENCH_LAYOUT_STATE)
  })

  it('does not modify window.location.search', () => {
    const initialSearch = window.location.search
    const { result } = renderHook(() => useWorkbenchLayoutState(TEST_STORAGE_KEY))

    act(() => {
      result.current.togglePart('navigator')
      result.current.setPartVisible('inspector', false)
      result.current.resizePart('bottomDock', 40)
      result.current.toggleBottomDockMaximized()
      result.current.resetLayout()
    })

    expect(window.location.search).toBe(initialSearch)
  })
})

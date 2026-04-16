import { act } from '@testing-library/react'

import { useSceneUiStore } from './scene-ui-store'

describe('useSceneUiStore', () => {
  beforeEach(() => {
    act(() => {
      useSceneUiStore.getState().resetFilters()
    })
  })

  it('keeps only filter and panel ui state in the store', () => {
    const state = useSceneUiStore.getState()

    expect(state).not.toHaveProperty('selectedBeatId')
    expect(state).not.toHaveProperty('selectedProposalId')
    expect(state.filters).toEqual({})
    expect(state.inspectorTab).toBe('context')
    expect(state.dockTab).toBe('events')
    expect(state.patchPreviewOpen).toBe(false)
  })

  it('does not persist beat selection in filter state', () => {
    act(() => {
      useSceneUiStore.getState().setFilters({
        beatId: 'beat-bargain',
        status: 'pending',
      })
    })

    expect(useSceneUiStore.getState().filters).toEqual({
      status: 'pending',
    })
  })
})

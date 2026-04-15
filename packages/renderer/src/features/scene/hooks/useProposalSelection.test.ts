import { act, renderHook } from '@testing-library/react'

import { useProposalSelection } from './useProposalSelection'

describe('useProposalSelection', () => {
  beforeEach(() => {
    const current = useProposalSelection.getState()
    act(() => {
      current.resetFilters()
      current.setSelectedBeatId(undefined)
      current.setSelectedProposalId(undefined)
    })
  })

  it('resets beat-specific filter state back to defaults', () => {
    const { result } = renderHook(() => useProposalSelection())

    act(() => {
      result.current.setSelectedBeatId('beat-2')
      result.current.setSelectedProposalId('proposal-3')
      result.current.setFilters({ status: 'pending', beatId: 'beat-2', severity: 'warn' })
    })

    expect(result.current.selectedBeatId).toBe('beat-2')
    expect(result.current.selectedProposalId).toBe('proposal-3')
    expect(result.current.filters.beatId).toBe('beat-2')

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filters).toEqual({})
    expect(result.current.selectedBeatId).toBeUndefined()
    expect(result.current.selectedProposalId).toBeUndefined()
  })
})

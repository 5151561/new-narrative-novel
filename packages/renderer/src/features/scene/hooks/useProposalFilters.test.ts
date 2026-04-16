import { act, renderHook } from '@testing-library/react'

import { useProposalFilters } from './useProposalFilters'

describe('useProposalFilters', () => {
  beforeEach(() => {
    act(() => {
      useProposalFilters.getState().resetFilters()
    })
  })

  it('exposes only filter state and filter actions', () => {
    const { result } = renderHook(() => useProposalFilters())

    act(() => {
      result.current.setFilters({
        beatId: 'beat-2',
        status: 'pending',
        severity: 'warn',
      })
    })

    expect(result.current.filters).toEqual({
      status: 'pending',
      severity: 'warn',
    })
    expect(result.current).not.toHaveProperty('selectedBeatId')
    expect(result.current).not.toHaveProperty('selectedProposalId')

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filters).toEqual({})
  })
})

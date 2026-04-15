import { create } from 'zustand'

import type { ProposalFilters } from '../types/scene-view-models'

export interface SceneUiState {
  selectedProposalId?: string
  selectedBeatId?: string
  filters: ProposalFilters
  setSelectedProposalId: (id?: string) => void
  setSelectedBeatId: (id?: string) => void
  setFilters: (next: ProposalFilters) => void
  resetFilters: () => void
}

export const useSceneUiStore = create<SceneUiState>((set) => ({
  selectedProposalId: undefined,
  selectedBeatId: undefined,
  filters: {},
  setSelectedProposalId: (id) => set({ selectedProposalId: id }),
  setSelectedBeatId: (id) =>
    set((state) => ({
      selectedBeatId: id,
      filters: id ? { ...state.filters, beatId: id } : { ...state.filters, beatId: undefined },
    })),
  setFilters: (next) =>
    set({
      filters: next,
      selectedBeatId: next.beatId,
    }),
  resetFilters: () =>
    set({
      selectedProposalId: undefined,
      selectedBeatId: undefined,
      filters: {},
    }),
}))

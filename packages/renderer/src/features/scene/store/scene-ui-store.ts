import { create } from 'zustand'

import type { ProposalFilters, SceneDockTabId } from '../types/scene-view-models'
import type { InspectorTabId } from '../components/SceneInspectorPanel'

export interface SceneUiState {
  selectedProposalId?: string
  selectedBeatId?: string
  filters: ProposalFilters
  inspectorTab: InspectorTabId
  dockTab: SceneDockTabId
  patchPreviewOpen: boolean
  setSelectedProposalId: (id?: string) => void
  setSelectedBeatId: (id?: string) => void
  setFilters: (next: ProposalFilters) => void
  resetFilters: () => void
  setInspectorTab: (tab: InspectorTabId) => void
  setDockTab: (tab: SceneDockTabId) => void
  setPatchPreviewOpen: (open: boolean) => void
}

function sameFilters(left: ProposalFilters, right: ProposalFilters) {
  const leftEntries = Object.entries(left).filter(([, value]) => value !== undefined)
  const rightEntries = Object.entries(right).filter(([, value]) => value !== undefined)

  if (leftEntries.length !== rightEntries.length) {
    return false
  }

  return leftEntries.every(([key, value]) => right[key as keyof ProposalFilters] === value)
}

export const useSceneUiStore = create<SceneUiState>((set) => ({
  selectedProposalId: undefined,
  selectedBeatId: undefined,
  filters: {},
  inspectorTab: 'context',
  dockTab: 'events',
  patchPreviewOpen: false,
  setSelectedProposalId: (id) =>
    set((state) => (state.selectedProposalId === id ? state : { ...state, selectedProposalId: id })),
  setSelectedBeatId: (id) =>
    set((state) => {
      const nextFilters = id ? { ...state.filters, beatId: id } : { ...state.filters, beatId: undefined }
      if (state.selectedBeatId === id && sameFilters(state.filters, nextFilters)) {
        return state
      }

      return {
        ...state,
        selectedBeatId: id,
        filters: nextFilters,
      }
    }),
  setFilters: (next) =>
    set((state) =>
      sameFilters(state.filters, next) && state.selectedBeatId === next.beatId
        ? state
        : {
            ...state,
            filters: next,
            selectedBeatId: next.beatId,
          },
    ),
  resetFilters: () =>
    set((state) =>
      state.selectedProposalId === undefined && state.selectedBeatId === undefined && sameFilters(state.filters, {})
        ? state
        : {
            ...state,
            selectedProposalId: undefined,
            selectedBeatId: undefined,
            filters: {},
          },
    ),
  setInspectorTab: (tab) =>
    set((state) => (state.inspectorTab === tab ? state : { ...state, inspectorTab: tab })),
  setDockTab: (tab) =>
    set((state) => (state.dockTab === tab ? state : { ...state, dockTab: tab })),
  setPatchPreviewOpen: (open) =>
    set((state) => (state.patchPreviewOpen === open ? state : { ...state, patchPreviewOpen: open })),
}))

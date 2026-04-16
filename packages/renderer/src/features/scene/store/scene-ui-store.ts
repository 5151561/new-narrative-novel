import { create } from 'zustand'

import type { ProposalFilters, SceneDockTabId } from '../types/scene-view-models'
import type { InspectorTabId } from '../components/SceneInspectorPanel'

export interface SceneUiState {
  filters: ProposalFilters
  inspectorTab: InspectorTabId
  dockTab: SceneDockTabId
  patchPreviewOpen: boolean
  setFilters: (next: ProposalFilters) => void
  resetFilters: () => void
  setInspectorTab: (tab: InspectorTabId) => void
  setDockTab: (tab: SceneDockTabId) => void
  setPatchPreviewOpen: (open: boolean) => void
}

function normalizeFilters(filters: ProposalFilters): ProposalFilters {
  const normalized: ProposalFilters = {}

  if (filters.status !== undefined) {
    normalized.status = filters.status
  }
  if (filters.kind !== undefined) {
    normalized.kind = filters.kind
  }
  if (filters.actorId !== undefined) {
    normalized.actorId = filters.actorId
  }
  if (filters.severity !== undefined) {
    normalized.severity = filters.severity
  }

  return normalized
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
  filters: {},
  inspectorTab: 'context',
  dockTab: 'events',
  patchPreviewOpen: false,
  setFilters: (next) =>
    set((state) => {
      const normalized = normalizeFilters(next)

      return sameFilters(state.filters, normalized)
        ? state
        : {
            ...state,
            filters: normalized,
          }
    }),
  resetFilters: () =>
    set((state) =>
      sameFilters(state.filters, {})
        ? state
        : {
            ...state,
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

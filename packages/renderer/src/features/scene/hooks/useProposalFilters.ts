import { useShallow } from 'zustand/react/shallow'

import { useSceneUiStore, type SceneUiState } from '../store/scene-ui-store'

type ProposalFilterState = Pick<SceneUiState, 'filters' | 'setFilters' | 'resetFilters'>

function selectProposalFilters(state: SceneUiState): ProposalFilterState {
  return {
    filters: state.filters,
    setFilters: state.setFilters,
    resetFilters: state.resetFilters,
  }
}

interface UseProposalFilters {
  (): ProposalFilterState
  getState: () => ProposalFilterState
}

export const useProposalFilters = (() =>
  useSceneUiStore(useShallow(selectProposalFilters))) as UseProposalFilters

useProposalFilters.getState = () => selectProposalFilters(useSceneUiStore.getState())

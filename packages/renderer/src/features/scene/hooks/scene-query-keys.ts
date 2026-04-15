import type { SceneDockTabId } from '../types/scene-view-models'

export const sceneQueryKeys = {
  all: ['scene'] as const,
  runtimeInfo: () => [...sceneQueryKeys.all, 'runtime-info'] as const,
  workspace: (sceneId: string) => [...sceneQueryKeys.all, 'workspace', sceneId] as const,
  setup: (sceneId: string) => [...sceneQueryKeys.all, 'setup', sceneId] as const,
  execution: (sceneId: string) => [...sceneQueryKeys.all, 'execution', sceneId] as const,
  prose: (sceneId: string) => [...sceneQueryKeys.all, 'prose', sceneId] as const,
  inspector: (sceneId: string) => [...sceneQueryKeys.all, 'inspector', sceneId] as const,
  dock: (sceneId: string) => [...sceneQueryKeys.all, 'dock', sceneId] as const,
  dockSummary: (sceneId: string) => [...sceneQueryKeys.dock(sceneId), 'summary'] as const,
  dockTab: (sceneId: string, tab: SceneDockTabId) => [...sceneQueryKeys.dock(sceneId), 'tab', tab] as const,
  patchPreview: (sceneId: string) => [...sceneQueryKeys.all, 'patchPreview', sceneId] as const,
}

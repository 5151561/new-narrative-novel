export const sceneQueryKeys = {
  all: ['scene'] as const,
  workspace: (sceneId: string) => [...sceneQueryKeys.all, 'workspace', sceneId] as const,
  setup: (sceneId: string) => [...sceneQueryKeys.all, 'setup', sceneId] as const,
  execution: (sceneId: string) => [...sceneQueryKeys.all, 'execution', sceneId] as const,
  prose: (sceneId: string) => [...sceneQueryKeys.all, 'prose', sceneId] as const,
  inspector: (sceneId: string) => [...sceneQueryKeys.all, 'inspector', sceneId] as const,
  dock: (sceneId: string) => [...sceneQueryKeys.all, 'dock', sceneId] as const,
}

import type { ApiRouteContext } from './route-context.js'

type ProjectMode = 'demo-fixture' | 'real-project'
type RuntimeKind = 'fixture-demo' | 'mock-storybook' | 'real-local-project'

function inferProjectModeFromRuntimeKind(runtimeKind: RuntimeKind): ProjectMode {
  return runtimeKind === 'real-local-project' ? 'real-project' : 'demo-fixture'
}

export function registerProjectRuntimeRoutes({
  app,
  apiBasePath,
  currentProject,
  repository,
}: ApiRouteContext & {
  currentProject?: {
    projectId: string
    projectMode: 'demo-fixture' | 'real-project'
    runtimeKind?: 'fixture-demo' | 'real-local-project'
    modelBindingsUsable?: boolean
    projectRoot: string
    projectTitle: string
  }
}) {
  app.get(`${apiBasePath}/current-project`, async () => {
    if (!currentProject) {
      return null
    }

    return {
      projectId: currentProject.projectId,
      projectMode: currentProject.projectMode,
      runtimeKind: currentProject.runtimeKind ?? (currentProject.projectMode === 'demo-fixture' ? 'fixture-demo' : 'real-local-project'),
      projectTitle: currentProject.projectTitle,
    }
  })

  app.get(`${apiBasePath}/projects/:projectId/runtime-info`, async (request) => {
    const { projectId } = request.params as { projectId: string }
    const runtimeInfo = repository.getProjectRuntimeInfo(projectId)

    if (currentProject?.projectId === projectId) {
      return {
        ...runtimeInfo,
        modelBindings: {
          usable: currentProject.modelBindingsUsable ?? (currentProject.projectMode !== 'real-project'),
        },
        projectMode: currentProject.projectMode,
        projectTitle: currentProject.projectTitle,
        runtimeKind: currentProject.runtimeKind ?? (currentProject.projectMode === 'demo-fixture' ? 'fixture-demo' : 'real-local-project'),
      }
    }

    return {
      ...runtimeInfo,
      modelBindings: {
        usable: inferProjectModeFromRuntimeKind(runtimeInfo.runtimeKind) !== 'real-project',
      },
      projectMode: inferProjectModeFromRuntimeKind(runtimeInfo.runtimeKind),
    }
  })

  app.post(`${apiBasePath}/projects/:projectId/runtime/reset`, async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    await repository.resetProject(projectId)
    reply.status(204)
    return null
  })
}

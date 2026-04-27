import type { ApiRouteContext } from './route-context.js'

export function registerProjectRuntimeRoutes({
  app,
  apiBasePath,
  currentProject,
  repository,
}: ApiRouteContext & {
  currentProject?: {
    projectId: string
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
      projectTitle: currentProject.projectTitle,
    }
  })

  app.get(`${apiBasePath}/projects/:projectId/runtime-info`, async (request) => {
    const { projectId } = request.params as { projectId: string }
    const runtimeInfo = repository.getProjectRuntimeInfo(projectId)

    if (currentProject?.projectId === projectId) {
      return {
        ...runtimeInfo,
        projectTitle: currentProject.projectTitle,
      }
    }

    return runtimeInfo
  })

  app.post(`${apiBasePath}/projects/:projectId/runtime/reset`, async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    await repository.resetProject(projectId)
    reply.status(204)
    return null
  })
}

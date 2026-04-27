import type { ApiRouteContext } from './route-context.js'

export function registerProjectRuntimeRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  app.get(`${apiBasePath}/projects/:projectId/runtime-info`, async (request) => {
    const { projectId } = request.params as { projectId: string }
    return repository.getProjectRuntimeInfo(projectId)
  })

  app.post(`${apiBasePath}/projects/:projectId/runtime/reset`, async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    await repository.resetProject(projectId)
    reply.status(204)
    return null
  })
}

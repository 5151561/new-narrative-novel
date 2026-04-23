import type { ApiRouteContext } from './route-context.js'

export function registerProjectRuntimeRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  app.get(`${apiBasePath}/projects/:projectId/runtime-info`, async (request) => {
    const { projectId } = request.params as { projectId: string }
    return repository.getProjectRuntimeInfo(projectId)
  })
}

import type { ApiRouteContext } from './route-context.js'

export function registerAssetRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`

  app.get(`${projectBase}/assets/:assetId/knowledge`, async (request) => {
    const { projectId, assetId } = request.params as { projectId: string; assetId: string }
    return repository.getAssetKnowledge(projectId, assetId)
  })
}

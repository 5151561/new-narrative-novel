export const runQueryKeys = {
  all: ['run'] as const,
  project: (projectId: string) => [...runQueryKeys.all, projectId] as const,
  detail: (projectId: string, runId: string) => [...runQueryKeys.project(projectId), 'detail', runId] as const,
  events: (projectId: string, runId: string) => [...runQueryKeys.project(projectId), 'events', runId] as const,
  eventsPage: (projectId: string, runId: string, cursor?: string) =>
    [...runQueryKeys.events(projectId, runId), cursor ?? '__head__'] as const,
  artifacts: (projectId: string, runId: string) => [...runQueryKeys.project(projectId), 'artifacts', runId] as const,
  artifact: (projectId: string, runId: string, artifactId: string) =>
    [...runQueryKeys.artifacts(projectId, runId), artifactId] as const,
  trace: (projectId: string, runId: string) => [...runQueryKeys.project(projectId), 'trace', runId] as const,
}

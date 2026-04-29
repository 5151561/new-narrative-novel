import type {
  FixtureProjectData,
  LocalizedTextRecord,
} from '../contracts/api-records.js'

function text(en: string, zhCN: string): LocalizedTextRecord {
  return { en, 'zh-CN': zhCN }
}

export function createRealProjectTemplate(input: {
  projectId: string
  projectTitle: string
  apiBaseUrl: string
  runtimeSummary?: string
  versionLabel?: string
}): FixtureProjectData {
  const bookId = `book-${input.projectId}`

  return {
    runtimeInfo: {
      projectId: input.projectId,
      projectTitle: input.projectTitle,
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      source: 'api',
      status: 'healthy',
      summary: input.runtimeSummary ?? 'Connected to local project store v1.',
      checkedAtLabel: new Date().toISOString(),
      apiBaseUrl: input.apiBaseUrl,
      versionLabel: input.versionLabel ?? 'local-project-store-v1',
      modelBindings: { usable: true },
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: false,
        reviewDecisions: true,
        contextPacketRefs: true,
        proposalSetRefs: true,
      },
    },
    books: {
      [bookId]: {
        bookId,
        title: text(input.projectTitle, input.projectTitle),
        summary: text('A new narrative project.', '一个新的叙事项目。'),
        chapterIds: [],
        viewsMeta: {
          availableViews: ['sequence', 'outliner', 'signals'],
        },
      },
    },
    manuscriptCheckpoints: {},
    exportProfiles: {},
    exportArtifacts: {},
    experimentBranches: {},
    chapters: {},
    assets: {},
    reviewDecisions: {},
    reviewFixActions: {},
    scenes: {},
  }
}

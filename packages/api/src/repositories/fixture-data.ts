import type { FixtureDataSnapshot, FixtureProjectData, LocalizedTextRecord } from '../contracts/api-records.js'

function text(en: string, zhCN: string): LocalizedTextRecord {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function createSignalArcProject(apiBaseUrl: string): FixtureProjectData {
  return {
    runtimeInfo: {
      projectId: 'book-signal-arc',
      projectTitle: 'Signal Arc',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to fixture API runtime.',
      checkedAtLabel: '2026-04-23 10:00',
      apiBaseUrl,
      versionLabel: 'fixture-api-be-pr1',
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
      'book-signal-arc': {
        bookId: 'book-signal-arc',
        title: text('Signal Arc', '信号弧线'),
        summary: text(
          'Fixture-backed project root for the API server skeleton.',
          '用于 API server skeleton 的 fixture 项目根数据。',
        ),
        chapterIds: ['chapter-signals-in-rain'],
      },
    },
    chapters: {
      'chapter-signals-in-rain': {
        chapterId: 'chapter-signals-in-rain',
        title: text('Signals in Rain', '雨中信号'),
        summary: text(
          'A minimal chapter fixture for book/chapter/scene API wiring.',
          '用于书籍/章节/场景 API 接线的最小章节 fixture。',
        ),
        scenes: [
          {
            id: 'scene-midnight-platform',
            order: 1,
            title: text('Midnight Platform', '午夜站台'),
            summary: text(
              'Ren locks the bargain before the witness can re-price it.',
              'Ren 必须在目击者重新定价前锁定交易。',
            ),
          },
        ],
      },
    },
    scenes: {
      'scene-midnight-platform': {
        sceneId: 'scene-midnight-platform',
        chapterId: 'chapter-signals-in-rain',
        bookId: 'book-signal-arc',
        title: text('Midnight Platform', '午夜站台'),
        status: 'waiting_review',
      },
    },
    assets: {
      'asset-ren-voss': {
        assetId: 'asset-ren-voss',
        kind: 'character',
        title: text('Ren Voss', '任·沃斯'),
        summary: text(
          'Negotiator keeping the ledger shut in public.',
          '在公开压力下坚持账本不能被翻开的谈判者。',
        ),
      },
    },
    reviewDecisions: {
      'book-signal-arc': [
        {
          id: 'review-decision-book-signal-arc-issue-1',
          bookId: 'book-signal-arc',
          issueId: 'issue-1',
          status: 'deferred',
          note: 'Hold until the fixture-backed review routes land.',
        },
      ],
    },
    exportProfiles: {
      'book-signal-arc': [
        {
          id: 'export-review-packet',
          bookId: 'book-signal-arc',
          title: text('Review Packet', '审阅包'),
          format: 'docx',
        },
      ],
    },
    exportArtifacts: {
      'book-signal-arc': [
        {
          id: 'artifact-review-packet-001',
          bookId: 'book-signal-arc',
          exportProfileId: 'export-review-packet',
          label: 'Review packet v1',
          status: 'ready',
        },
      ],
    },
    experimentBranches: {
      'book-signal-arc': [
        {
          id: 'branch-book-signal-arc-quiet-ending',
          bookId: 'book-signal-arc',
          label: 'Quiet Ending',
          baseline: 'current',
        },
      ],
    },
    manuscriptCheckpoints: {
      'book-signal-arc': [
        {
          id: 'checkpoint-book-signal-arc-pr11-baseline',
          bookId: 'book-signal-arc',
          label: 'PR11 baseline',
          sceneCount: 1,
        },
      ],
    },
  }
}

export function createFixtureDataSnapshot(apiBaseUrl: string): FixtureDataSnapshot {
  return {
    projects: {
      'book-signal-arc': createSignalArcProject(apiBaseUrl),
    },
  }
}

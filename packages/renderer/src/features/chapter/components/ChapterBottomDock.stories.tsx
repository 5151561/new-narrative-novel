import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import { buildChapterProblemsHeavyStoryWorkspace, buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterBottomDock } from './ChapterBottomDock'

const recentWorkspace = buildChapterProblemsHeavyStoryWorkspace('scene-midnight-platform')
const quietWorkspace = buildChapterStoryWorkspace('scene-concourse-delay')

const meta = {
  title: 'Business/ChapterBottomDock',
  component: ChapterBottomDock,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[360px] bg-app p-6">
        <div className="max-w-6xl rounded-md border border-line-soft bg-surface-1">
          <ChapterBottomDock {...args} />
        </div>
      </div>
    </AppProviders>
  ),
} satisfies Meta<typeof ChapterBottomDock>

export default meta

type Story = StoryObj<typeof meta>

export const WithRecentActivity: Story = {
  args: {
    problems: {
      unresolvedCount: recentWorkspace.unresolvedCount,
      selectedScene: {
        title: recentWorkspace.inspector.selectedSceneBrief?.title ?? 'Midnight Platform',
        summary: recentWorkspace.inspector.selectedSceneBrief?.summary ?? recentWorkspace.summary,
        unresolvedLabel: recentWorkspace.inspector.selectedSceneBrief?.unresolvedLabel ?? 'Unresolved 3',
      },
      problemsSummary: recentWorkspace.inspector.problemsSummary,
      assemblyHints: recentWorkspace.inspector.assemblyHints,
    },
    activity: [
      {
        id: 'activity-1',
        kind: 'view',
        title: 'Entered Outliner',
        detail: 'The chapter workbench opened on the outliner surface.',
        tone: 'accent',
      },
      {
        id: 'activity-2',
        kind: 'scene',
        title: 'Focused Midnight Platform',
        detail: recentWorkspace.inspector.selectedSceneBrief?.summary ?? recentWorkspace.summary,
        tone: 'neutral',
      },
      {
        id: 'activity-3',
        kind: 'view',
        title: 'Switched to Assembly',
        detail: 'Judgment moved to seam review while keeping the same selected scene.',
        tone: 'accent',
      },
      {
        id: 'activity-4',
        kind: 'mutation',
        title: 'Moved Ticket Window earlier',
        detail: 'Chapter order changed without changing the selected scene.',
        tone: 'accent',
      },
    ],
  },
}

export const QuietSession: Story = {
  args: {
    problems: {
      unresolvedCount: quietWorkspace.unresolvedCount,
      selectedScene: {
        title: quietWorkspace.inspector.selectedSceneBrief?.title ?? 'Concourse Delay',
        summary: quietWorkspace.inspector.selectedSceneBrief?.summary ?? quietWorkspace.summary,
        unresolvedLabel: quietWorkspace.inspector.selectedSceneBrief?.unresolvedLabel ?? 'Unresolved 2',
      },
      problemsSummary: quietWorkspace.inspector.problemsSummary,
      assemblyHints: quietWorkspace.inspector.assemblyHints,
    },
    activity: [],
  },
}

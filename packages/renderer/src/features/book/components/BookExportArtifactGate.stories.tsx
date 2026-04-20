import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { buildBookExportArtifactGate } from '../lib/book-export-artifact-mappers'
import type { BookExportArtifactGateViewModel } from '../types/book-export-artifact-view-models'
import { BookStoryShell } from './book-storybook'
import { buildBookDraftExportStoryData } from './book-draft-storybook'
import { BookExportArtifactGate } from './BookExportArtifactGate'

interface StoryProps {
  state: 'ready' | 'readiness-blocked' | 'review-blocked'
}

function buildGate(state: StoryProps['state'], locale: 'en' | 'zh-CN'): BookExportArtifactGateViewModel {
  if (state === 'ready') {
    return {
      canBuild: true,
      status: 'ready',
      label: locale === 'zh-CN' ? 'Artifact build ready' : 'Artifact build ready',
      reasons: [],
      openBlockerCount: 0,
      checkedFixCount: 0,
      blockedFixCount: 0,
      staleFixCount: 0,
    }
  }

  if (state === 'readiness-blocked') {
    const exportData = buildBookDraftExportStoryData(locale, {
      variant: 'default',
    })

    return buildBookExportArtifactGate({
      exportPreview: exportData.exportWorkspace,
      reviewInbox: null,
    })
  }

  return {
    canBuild: false,
    status: 'blocked',
    label: locale === 'zh-CN' ? 'Artifact build blocked' : 'Artifact build blocked',
    reasons: [
      {
        id: 'review-blocker-story',
        severity: 'blocker',
        title: locale === 'zh-CN' ? 'Review blocker 仍然打开' : 'Open review blocker',
        detail:
          locale === 'zh-CN'
            ? '这个 review blocker 需要先做 decision，checked source-fix 不能视为 resolved。'
            : 'This review blocker needs a decision before the artifact can be built.',
        source: 'review-open-blocker',
      },
    ],
    openBlockerCount: 1,
    checkedFixCount: 2,
    blockedFixCount: 1,
    staleFixCount: 1,
  }
}

function StoryComponent({ state }: StoryProps) {
  const { locale } = useI18n()

  return <BookExportArtifactGate gate={buildGate(state, locale)} />
}

const meta = {
  title: 'Business/BookExportArtifactGate',
  component: StoryComponent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[360px]">
      <div className="max-w-3xl p-4">
        <StoryComponent {...args} />
      </div>
    </BookStoryShell>
  ),
  args: {
    state: 'ready',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const GateReady: Story = {}

export const GateBlockedByReadiness: Story = {
  args: {
    state: 'readiness-blocked',
  },
}

export const GateBlockedByReview: Story = {
  args: {
    state: 'review-blocked',
  },
}

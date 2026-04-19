import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { BookStoryShell } from '@/features/book/components/book-storybook'
import { buildBookDraftReviewStoryData } from '@/features/book/components/book-draft-storybook'

import { BookReviewFilterBar } from './BookReviewFilterBar'

function StoryComponent() {
  const { locale } = useI18n()
  const { reviewInbox } = buildBookDraftReviewStoryData(locale, {
    reviewFilter: 'export-readiness',
    selectedChapterId: 'chapter-open-water-signals',
  })

  return (
    <BookReviewFilterBar
      activeFilter="export-readiness"
      counts={reviewInbox.counts}
      onSelectFilter={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookReviewFilterBar',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: () => (
    <BookStoryShell frameClassName="max-w-4xl rounded-md border border-line-soft bg-surface-1 p-4">
      <StoryComponent />
    </BookStoryShell>
  ),
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ReviewExportReadiness: Story = {}

import type { Meta, StoryObj } from '@storybook/react'

import {
  BookStructureWorkspaceStory,
  getBookStorySearch,
  withBookStoryShell,
} from './book-storybook'

const meta = {
  title: 'Mockups/Book/Structure Workspace',
  component: BookStructureWorkspaceStory,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withBookStoryShell('ring-panel overflow-hidden rounded-md bg-surface-1')],
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof BookStructureWorkspaceStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    bookStory: {
      search: getBookStorySearch({ variant: 'default', view: 'sequence' }),
    },
  },
}

export const SelectedSecondChapter: Story = {
  parameters: {
    bookStory: {
      search: getBookStorySearch({
        variant: 'default',
        view: 'outliner',
        selectedChapterId: 'chapter-open-water-signals',
      }),
    },
  },
}

export const SignalsHeavy: Story = {
  args: {
    variant: 'signals-heavy',
  },
  parameters: {
    bookStory: {
      search: getBookStorySearch({
        variant: 'signals-heavy',
        view: 'signals',
        selectedChapterId: 'chapter-open-water-signals',
      }),
    },
  },
}

export const QuietBook: Story = {
  args: {
    variant: 'quiet-book',
  },
  parameters: {
    bookStory: {
      search: getBookStorySearch({
        variant: 'quiet-book',
        view: 'sequence',
        selectedChapterId: 'chapter-signals-in-rain',
      }),
    },
  },
}

export const MissingTraceAttention: Story = {
  args: {
    variant: 'missing-trace-attention',
  },
  parameters: {
    bookStory: {
      search: getBookStorySearch({
        variant: 'missing-trace-attention',
        view: 'signals',
        selectedChapterId: 'chapter-dawn-slip',
      }),
    },
  },
}

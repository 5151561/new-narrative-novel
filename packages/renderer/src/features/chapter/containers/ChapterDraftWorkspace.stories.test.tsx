import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { withStorybookLocale } from '../../../../.storybook/storybook-locale'
import meta, {
  Default,
  LongDraftKeepsDockVisible,
  RunningGate,
  TransitionGap,
  TransitionReady,
  WaitingReviewGate,
} from './ChapterDraftWorkspace.stories'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  document.documentElement.removeAttribute('lang')
})

function renderStoryWithLocale(locale: 'en' | 'zh-CN') {
  const storyArgs = Default.args ?? {}
  const Story = () => {
    if (!meta.render) {
      throw new Error('Expected ChapterDraftWorkspace story to define a render function')
    }

    return meta.render(storyArgs as Parameters<NonNullable<typeof meta.render>>[0])
  }

  const element = withStorybookLocale(Story, {
    globals: { locale },
  } as never)

  return render(element)
}

describe('ChapterDraftWorkspace story locale integration', () => {
  it('uses the storybook locale to switch both UI copy and chapter fixture content', () => {
    renderStoryWithLocale('zh-CN')

    expect(screen.getByRole('button', { name: /EN/ })).toBeInTheDocument()
    expect(screen.getAllByText(/已起草/).length).toBeGreaterThan(0)
    expect(screen.getByText('按章节顺序浏览阅读稿，并让 route.sceneId 继续保持唯一焦点真源。')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /中文/ })).not.toBeInTheDocument()

    cleanup()

    renderStoryWithLocale('en')

    expect(screen.getByRole('button', { name: /中文/ })).toBeInTheDocument()
    expect(screen.getAllByText(/Drafted/).length).toBeGreaterThan(0)
    expect(screen.getByText('Browse the assembled reading order while route.sceneId keeps the focus stable.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /EN/ })).not.toBeInTheDocument()
  })

  it('renders the waiting-review orchestration panel copy in both locales', () => {
    const WaitingReviewStory = () => {
      if (!meta.render) {
        throw new Error('Expected ChapterDraftWorkspace story to define a render function')
      }

      return meta.render((WaitingReviewGate.args ?? {}) as Parameters<NonNullable<typeof meta.render>>[0])
    }

    render(withStorybookLocale(WaitingReviewStory, {
      globals: { locale: 'en' },
    } as never))

    expect(screen.getByRole('button', { name: 'Review pending' })).toBeDisabled()
    expect(screen.getByText('Chapter orchestration')).toBeInTheDocument()

    cleanup()

    render(withStorybookLocale(WaitingReviewStory, {
      globals: { locale: 'zh-CN' },
    } as never))

    expect(screen.getByRole('button', { name: '等待 Review' })).toBeDisabled()
    expect(screen.getByText('章节编排')).toBeInTheDocument()
  })

  it('renders running scenes as blocking in the draft story preview', () => {
    const RunningStory = () => {
      if (!meta.render) {
        throw new Error('Expected ChapterDraftWorkspace story to define a render function')
      }

      return meta.render((RunningGate.args ?? {}) as Parameters<NonNullable<typeof meta.render>>[0])
    }

    render(withStorybookLocale(RunningStory, {
      globals: { locale: 'en' },
    } as never))

    expect(screen.getByRole('button', { name: 'Scene running' })).toBeDisabled()
    expect(screen.getAllByText('Run in progress').length).toBeGreaterThan(0)
  })

  it('renders transition gap and transition ready seam states in the updated draft stories', () => {
    const TransitionGapStory = () => {
      if (!meta.render) {
        throw new Error('Expected ChapterDraftWorkspace story to define a render function')
      }

      return meta.render((TransitionGap.args ?? {}) as Parameters<NonNullable<typeof meta.render>>[0])
    }

    render(withStorybookLocale(TransitionGapStory, {
      globals: { locale: 'en' },
    } as never))

    expect(screen.getAllByText('Transition gap').length).toBeGreaterThan(0)

    cleanup()

    const TransitionReadyStory = () => {
      if (!meta.render) {
        throw new Error('Expected ChapterDraftWorkspace story to define a render function')
      }

      return meta.render((TransitionReady.args ?? {}) as Parameters<NonNullable<typeof meta.render>>[0])
    }

    render(withStorybookLocale(TransitionReadyStory, {
      globals: { locale: 'en' },
    } as never))

    expect(screen.getAllByText('Transition ready').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/artifact-backed/i).length).toBeGreaterThan(0)
  })

  it('keeps the dock rendered for the long draft story state', () => {
    const LongDraftStory = () => {
      if (!meta.render) {
        throw new Error('Expected ChapterDraftWorkspace story to define a render function')
      }

      return meta.render((LongDraftKeepsDockVisible.args ?? {}) as Parameters<NonNullable<typeof meta.render>>[0])
    }

    render(withStorybookLocale(LongDraftStory, {
      globals: { locale: 'en' },
    } as never))

    expect(screen.getByRole('region', { name: 'Chapter draft bottom dock' })).toBeInTheDocument()
  })
})

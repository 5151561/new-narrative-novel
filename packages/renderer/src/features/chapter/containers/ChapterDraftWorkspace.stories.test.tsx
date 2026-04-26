import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { withStorybookLocale } from '../../../../.storybook/storybook-locale'
import meta, { Default } from './ChapterDraftWorkspace.stories'

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
})

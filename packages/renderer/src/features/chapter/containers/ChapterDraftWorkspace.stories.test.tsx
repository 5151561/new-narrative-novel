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

    return meta.render(storyArgs, {} as never)
  }

  const element = withStorybookLocale(Story, {
    globals: { locale },
  } as never)

  return render(element)
}

describe('ChapterDraftWorkspace story locale integration', () => {
  it('uses the storybook locale to switch both UI copy and chapter fixture content', () => {
    renderStoryWithLocale('zh-CN')

    expect(screen.getByRole('heading', { name: '章节工作台' })).toBeInTheDocument()
    expect(screen.getByText('雨中信号 / 成稿 / 午夜站台')).toBeInTheDocument()
    expect(screen.getByText('按章节顺序浏览阅读稿，并让 route.sceneId 继续保持唯一焦点真源。')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'EN' })).not.toBeInTheDocument()

    cleanup()

    renderStoryWithLocale('en')

    expect(screen.getByRole('heading', { name: 'Chapter workbench' })).toBeInTheDocument()
    expect(screen.getByText('Signals in Rain / Draft / Midnight Platform')).toBeInTheDocument()
    expect(screen.getByText('Browse the assembled reading order while route.sceneId keeps the focus stable.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'EN' })).not.toBeInTheDocument()
  })
})

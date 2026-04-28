import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { withStorybookLocale } from '../../../../.storybook/storybook-locale'
import meta, { AcceptedPlan, BacklogProposal } from './ChapterStructureWorkspace.stories'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  document.documentElement.removeAttribute('lang')
})

function renderStoryWithLocale(locale: 'en' | 'zh-CN') {
  const storyArgs = BacklogProposal.args ?? {}
  const Story = () => {
    if (!meta.render) {
      throw new Error('Expected ChapterStructureWorkspace story to define a render function')
    }

    return meta.render(storyArgs as Parameters<NonNullable<typeof meta.render>>[0])
  }

  const element = withStorybookLocale(Story, {
    globals: { locale },
  } as never)

  return render(element)
}

describe('ChapterStructureWorkspace story locale integration', () => {
  it('uses the storybook locale to switch backlog workspace copy and fixture content', () => {
    renderStoryWithLocale('zh-CN')

    expect(screen.getByRole('button', { name: /EN/ })).toBeInTheDocument()
    expect(screen.getByText('本章目标与约束')).toBeInTheDocument()
    expect(screen.getByText('让章节结构、占位场景和未决信号保持对齐。')).toBeInTheDocument()

    cleanup()

    renderStoryWithLocale('en')

    expect(screen.getByRole('button', { name: /中文/ })).toBeInTheDocument()
    expect(screen.getByText('Chapter goal and constraints')).toBeInTheDocument()
    expect(screen.getByText('Keep chapter structure, placeholder scenes, and unresolved signals aligned.')).toBeInTheDocument()
  })

  it('renders the orchestration panel inside the workspace preview for accepted plans', () => {
    const storyArgs = AcceptedPlan.args ?? {}
    const Story = () => {
      if (!meta.render) {
        throw new Error('Expected ChapterStructureWorkspace story to define a render function')
      }

      return meta.render(storyArgs as Parameters<NonNullable<typeof meta.render>>[0])
    }

    render(withStorybookLocale(Story, {
      globals: { locale: 'en' },
    } as never))

    expect(screen.getByText('Chapter orchestration')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start next scene run' })).toBeInTheDocument()
  })
})

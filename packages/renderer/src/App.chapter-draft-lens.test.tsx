import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { resetMockChapterDb } from '@/features/chapter/api/mock-chapter-db'

const originalNavigatorLanguage = window.navigator.language

async function renderFreshApp(search = '') {
  vi.resetModules()
  vi.doMock('@/features/scene/containers/SceneInspectorContainer', () => ({
    SceneInspectorContainer: ({ sceneId }: { sceneId: string }) => {
      const { useState } = require('react') as typeof import('react')
      const [activeTab, setActiveTab] = useState<'context' | 'versions' | 'runtime'>('context')

      return (
        <div data-testid="scene-inspector">
          <div>{sceneId}</div>
          <button type="button" onClick={() => setActiveTab('context')}>
            Context
          </button>
          <button type="button" onClick={() => setActiveTab('versions')}>
            Versions
          </button>
          <button type="button" onClick={() => setActiveTab('runtime')}>
            Runtime
          </button>
          {activeTab === 'context' ? <div>Accepted Facts</div> : null}
          {activeTab === 'versions' ? <div>Version Checkpoints</div> : null}
          {activeTab === 'runtime' ? <div>Runtime Profile</div> : null}
        </div>
      )
    },
  }))
  window.history.replaceState({}, '', `/workbench${search}`)

  const { default: App } = await import('./App')
  const { AppProviders } = await import('./app/providers')

  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  )
}

function setNavigatorLanguage(language: string) {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: language,
  })
}

describe('App chapter draft lens smoke', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unmock('@tanstack/react-query')
    window.localStorage.clear()
    setNavigatorLanguage(originalNavigatorLanguage)
    resetMockChapterDb()
  })

  it('supports chapter structure -> chapter draft -> scene draft -> back -> structure with view restoration', async () => {
    const user = userEvent.setup()
    setNavigatorLanguage('en-US')

    await renderFreshApp(
      '?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=assembly&sceneId=scene-concourse-delay',
    )

    expect(await screen.findByRole('button', { name: 'Assembly' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Draft' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('assembly')
      expect(params.get('sceneId')).toBe('scene-concourse-delay')
    })

    const concourseSections = await screen.findAllByRole('button', {
      name: /Scene 2 Concourse Delay Draft handoff ready/i,
    })
    expect(concourseSections.some((button) => button.getAttribute('aria-current') === 'true')).toBe(true)

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Concourse Delay' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-concourse-delay')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('tab')).toBe('prose')
    })

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('assembly')
      expect(params.get('sceneId')).toBe('scene-concourse-delay')
    })

    const restoredConcourseSections = await screen.findAllByRole('button', {
      name: /Scene 2 Concourse Delay Draft handoff ready/i,
    })
    expect(restoredConcourseSections.some((button) => button.getAttribute('aria-current') === 'true')).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Structure' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('structure')
      expect(params.get('view')).toBe('assembly')
      expect(params.get('sceneId')).toBe('scene-concourse-delay')
    })

    expect(await screen.findByRole('button', { name: 'Assembly' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Scene 2 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
  }, 40000)
})

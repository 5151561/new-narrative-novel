import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import type { RunEventRefRecord } from '../api/run-records'

import { RunArtifactRefList } from './RunArtifactRefList'

const refs: RunEventRefRecord[] = [
  { kind: 'context-packet', id: 'ctx-scene-midnight-platform-run-001', label: 'Scene context packet' },
  { kind: 'review', id: 'review-scene-midnight-platform-001', label: 'Editorial review' },
]

function renderRefs(overrides: Partial<React.ComponentProps<typeof RunArtifactRefList>> = {}) {
  return render(
    <I18nProvider>
      <RunArtifactRefList refs={refs} {...overrides} />
    </I18nProvider>,
  )
}

describe('RunArtifactRefList', () => {
  it('renders artifact refs as static badges when no handler is available', () => {
    renderRefs()

    expect(screen.queryByRole('button', { name: 'Open Scene context packet' })).not.toBeInTheDocument()
    expect(screen.getByText('Scene context packet')).toBeInTheDocument()
    expect(screen.getByText('Editorial review')).toBeInTheDocument()
  })

  it('renders artifact refs as clickable chips when a handler is available', () => {
    renderRefs({ onSelectArtifact: vi.fn() })

    expect(screen.getByRole('button', { name: 'Open Scene context packet' })).toBeInTheDocument()
    expect(screen.getByText('Editorial review')).toBeInTheDocument()
  })

  it('does not expose raw ref ids through chip titles', () => {
    renderRefs({ onSelectArtifact: vi.fn() })

    expect(screen.getByRole('button', { name: 'Open Scene context packet' })).not.toHaveAttribute(
      'title',
      'ctx-scene-midnight-platform-run-001',
    )
    expect(screen.getByText('Editorial review')).not.toHaveAttribute('title', 'review-scene-midnight-platform-001')
  })

  it('calls onSelectArtifact when a context packet ref is clicked', async () => {
    const user = userEvent.setup()
    const onSelectArtifact = vi.fn()
    renderRefs({ onSelectArtifact })

    await user.click(screen.getByRole('button', { name: 'Open Scene context packet' }))

    expect(onSelectArtifact).toHaveBeenCalledWith('ctx-scene-midnight-platform-run-001')
  })

  it('keeps review refs static and non-clickable', () => {
    renderRefs()

    expect(screen.queryByRole('button', { name: 'Open Editorial review' })).not.toBeInTheDocument()
    expect(screen.getByText('Editorial review')).toBeInTheDocument()
  })

  it('stops ref clicks from triggering parent row behavior', async () => {
    const user = userEvent.setup()
    const onSelectArtifact = vi.fn()
    const onParentClick = vi.fn()

    render(
      <I18nProvider>
        <div onClick={onParentClick}>
          <RunArtifactRefList refs={refs} onSelectArtifact={onSelectArtifact} />
        </div>
      </I18nProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Open Scene context packet' }))

    expect(onSelectArtifact).toHaveBeenCalledTimes(1)
    expect(onParentClick).not.toHaveBeenCalled()
  })
})

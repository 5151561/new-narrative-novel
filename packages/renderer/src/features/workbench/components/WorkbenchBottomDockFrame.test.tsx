import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { WorkbenchBottomDockFrame } from './WorkbenchBottomDockFrame'

type TestTab = 'problems' | 'activity' | 'trace'

function TestDockFrame() {
  const [activeTab, setActiveTab] = useState<TestTab>('problems')

  return (
    <WorkbenchBottomDockFrame
      ariaLabel="Review dock"
      tabs={[
        { id: 'problems', label: 'Problems', badge: 2, tone: 'warn' },
        { id: 'activity', label: 'Activity', badge: 4 },
        { id: 'trace', label: 'Trace' },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div>{activeTab} content</div>
    </WorkbenchBottomDockFrame>
  )
}

function InvalidActiveDockFrame() {
  return (
    <WorkbenchBottomDockFrame
      ariaLabel="Review dock"
      tabs={[
        { id: 'problems', label: 'Problems' },
        { id: 'activity', label: 'Activity' },
      ]}
      activeTab={'missing' as TestTab}
      onTabChange={() => {}}
    >
      <div>fallback content</div>
    </WorkbenchBottomDockFrame>
  )
}

describe('WorkbenchBottomDockFrame', () => {
  it('wires tabs to the active tabpanel and supports roving keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<TestDockFrame />)

    const tablist = screen.getByRole('tablist', { name: 'Review dock tabs' })
    const problemsTab = within(tablist).getByRole('tab', { name: /Problems/i })
    const activityTab = within(tablist).getByRole('tab', { name: /Activity/i })
    const traceTab = within(tablist).getByRole('tab', { name: /Trace/i })
    let panel = screen.getByRole('tabpanel', { name: /Problems/i })

    expect(problemsTab).toHaveAttribute('aria-selected', 'true')
    expect(problemsTab).toHaveProperty('tabIndex', 0)
    expect(activityTab).toHaveProperty('tabIndex', -1)
    expect(problemsTab).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', problemsTab.id)
    expect(panel).toHaveTextContent('problems content')

    problemsTab.focus()
    await user.keyboard('{ArrowRight}')
    panel = screen.getByRole('tabpanel', { name: /Activity/i })

    expect(activityTab).toHaveFocus()
    expect(activityTab).toHaveAttribute('aria-selected', 'true')
    expect(activityTab).toHaveProperty('tabIndex', 0)
    expect(problemsTab).toHaveProperty('tabIndex', -1)
    expect(activityTab).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', activityTab.id)
    expect(panel).toHaveTextContent('activity content')

    await user.keyboard('{End}')
    panel = screen.getByRole('tabpanel', { name: /Trace/i })

    expect(traceTab).toHaveFocus()
    expect(traceTab).toHaveAttribute('aria-selected', 'true')
    expect(panel).toHaveAttribute('aria-labelledby', traceTab.id)
    expect(panel).toHaveTextContent('trace content')

    await user.keyboard('{Home}')
    panel = screen.getByRole('tabpanel', { name: /Problems/i })

    expect(problemsTab).toHaveFocus()
    expect(problemsTab).toHaveAttribute('aria-selected', 'true')
    expect(panel).toHaveAttribute('aria-labelledby', problemsTab.id)
    expect(panel).toHaveTextContent('problems content')

    await user.keyboard('{ArrowLeft}')

    expect(traceTab).toHaveFocus()
    expect(traceTab).toHaveAttribute('aria-selected', 'true')
  })

  it('falls back to the first tab for active panel labeling when activeTab is invalid', () => {
    render(<InvalidActiveDockFrame />)

    const tablist = screen.getByRole('tablist', { name: 'Review dock tabs' })
    const problemsTab = within(tablist).getByRole('tab', { name: /Problems/i })
    const activityTab = within(tablist).getByRole('tab', { name: /Activity/i })
    const panel = screen.getByRole('tabpanel', { name: /Problems/i })

    expect(problemsTab).toHaveAttribute('aria-selected', 'true')
    expect(activityTab).toHaveAttribute('aria-selected', 'false')
    expect(panel).toHaveAttribute('aria-labelledby', problemsTab.id)
    expect(problemsTab).toHaveAttribute('aria-controls', panel.id)
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ProposalCard } from './ProposalCard'
import type { ProposalCardModel } from '../types/scene-view-models'

const proposal: ProposalCardModel = {
  id: 'proposal-1',
  beatId: 'beat-bargain',
  actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' },
  kind: 'conflict',
  title: 'Force the bargain into a visible stalemate',
  summary: 'Ren refuses Mei’s first price and exposes the missing courier as leverage.',
  detail: 'This keeps the ledger closed while sharpening the power shift before the bell.',
  status: 'pending',
  impactTags: ['stakes', 'power-shift'],
  affects: [
    {
      path: 'scene.summary.conflict',
      label: 'Conflict temperature',
      deltaSummary: 'Escalates from negotiation to brinkmanship.',
    },
  ],
  risks: [{ severity: 'warn', message: 'May crowd the conductor witness beat.' }],
  evidencePeek: ['Beat 2 already seeded Ren’s suspicion.'],
  sourceTraceId: 'trace-41',
}

describe('ProposalCard', () => {
  it('reveals an inline edit-then-accept form and submits the edited summary', async () => {
    const user = userEvent.setup()
    const onEditAccept = vi.fn()

    render(
      <ProposalCard
        proposal={proposal}
        onSelect={vi.fn()}
        onAccept={vi.fn()}
        onEditAccept={onEditAccept}
        onRequestRewrite={vi.fn()}
        onReject={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit Then Accept' }))

    const input = screen.getByLabelText('Edited proposal summary')
    await user.clear(input)
    await user.type(input, 'Ren rewrites the bargain so the ledger stays shut and the leverage lands cleanly.')
    await user.click(screen.getByRole('button', { name: 'Save Edited Acceptance' }))

    expect(onEditAccept).toHaveBeenCalledWith(
      proposal.id,
      'Ren rewrites the bargain so the ledger stays shut and the leverage lands cleanly.',
    )
  })
})

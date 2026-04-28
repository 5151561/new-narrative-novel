import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

describe('fixture API server chapter backlog routes', () => {
  it('rejects invalid backlog generation and accept bodies, rejects empty saved goals, and returns 404 for missing proposals', async () => {
    await withTestServer(async ({ app }) => {
      const missingLocaleGenerate = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals',
        payload: {},
      })
      expect(missingLocaleGenerate.statusCode).toBe(400)

      const badPlanningPatch = await app.inject({
        method: 'PATCH',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/planning-input',
        payload: {
          locale: 'en',
          goal: 42,
        },
      })
      expect(badPlanningPatch.statusCode).toBe(400)

      const emptyGoalPatch = await app.inject({
        method: 'PATCH',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/planning-input',
        payload: {
          locale: 'en',
          goal: '   ',
        },
      })
      expect(emptyGoalPatch.statusCode).toBe(200)

      const emptyGoalGenerate = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals',
        payload: {
          locale: 'en',
        },
      })
      expect(emptyGoalGenerate.statusCode).toBe(400)

      const invalidLocaleAccept = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals/chapter-signals-in-rain-backlog-proposal-001/accept',
        payload: {
          locale: 'fr-FR',
        },
      })
      expect(invalidLocaleAccept.statusCode).toBe(400)

      const missingProposalAccept = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals/chapter-signals-in-rain-backlog-proposal-404/accept',
        payload: {
          locale: 'en',
        },
      })
      expect(missingProposalAccept.statusCode).toBe(404)
    })
  })

  it('patches planning input, generates a proposal, edits a proposal scene, and accepts the canonical backlog order', async () => {
    await withTestServer(async ({ app }) => {
      const planningResponse = await app.inject({
        method: 'PATCH',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/planning-input',
        payload: {
          locale: 'en',
          goal: 'Keep chapter pressure public while the ledger stays closed.',
          constraints: [
            'The ledger must remain shut in public.',
            'The witness pressure must stay visible.',
          ],
        },
      })

      expect(planningResponse.statusCode).toBe(200)
      expect(planningResponse.json()).toMatchObject({
        planning: {
          goal: {
            en: 'Keep chapter pressure public while the ledger stays closed.',
          },
          constraints: [
            {
              label: {
                en: 'The ledger must remain shut in public.',
              },
            },
            {
              label: {
                en: 'The witness pressure must stay visible.',
              },
            },
          ],
        },
      })

      const proposalResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals',
        payload: {
          locale: 'en',
        },
      })

      expect(proposalResponse.statusCode).toBe(200)
      const proposal = proposalResponse.json().planning.proposals.at(-1)
      expect(proposal).toMatchObject({
        proposalId: 'chapter-signals-in-rain-backlog-proposal-001',
      })
      expect(proposal.scenes.map((scene: { sceneId: string; backlogStatus: string }) => `${scene.sceneId}:${scene.backlogStatus}`)).toEqual([
        'scene-midnight-platform:planned',
        'scene-concourse-delay:planned',
        'scene-ticket-window:planned',
        'scene-departure-bell:planned',
      ])
      expect(proposal.scenes[0]).toMatchObject({
        pov: {
          en: 'Ren Voss',
        },
        location: {
          en: 'Eastbound platform',
        },
        conflict: {
          en: 'Ren needs leverage, Mei needs a higher price, and the witness keeps both of them public.',
        },
        reveal: {
          en: 'The courier signal stays legible only to Ren.',
        },
      })

      const editResponse = await app.inject({
        method: 'PATCH',
        url: `/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals/${proposal.proposalId}/scenes/${proposal.scenes[1].proposalSceneId}`,
        payload: {
          locale: 'en',
          patch: {
            title: 'Concourse Delay Opening',
            summary: 'Promote the crowd bottleneck into the chapter opening beat.',
            purpose: 'Open the chapter with witness pressure already in motion.',
            pov: 'Mei Arden',
            location: 'Crowded concourse hall',
            conflict: 'The crowd blocks any clean exit and keeps the bargain public.',
            reveal: 'Witness pressure now enters the chapter before the gate decision.',
          },
          order: 1,
          backlogStatus: 'needs_review',
        },
      })

      expect(editResponse.statusCode).toBe(200)
      const editedProposal = editResponse.json().planning.proposals.at(-1)
      expect(editedProposal.scenes.map((scene: { order: number; sceneId: string; backlogStatus: string }) => `${scene.order}:${scene.sceneId}:${scene.backlogStatus}`)).toEqual([
        '1:scene-concourse-delay:needs_review',
        '2:scene-midnight-platform:planned',
        '3:scene-ticket-window:planned',
        '4:scene-departure-bell:planned',
      ])
      expect(editedProposal.scenes[0]).toMatchObject({
        title: {
          en: 'Concourse Delay Opening',
        },
        summary: {
          en: 'Promote the crowd bottleneck into the chapter opening beat.',
        },
        purpose: {
          en: 'Open the chapter with witness pressure already in motion.',
        },
        pov: {
          en: 'Mei Arden',
        },
        location: {
          en: 'Crowded concourse hall',
        },
        conflict: {
          en: 'The crowd blocks any clean exit and keeps the bargain public.',
        },
        reveal: {
          en: 'Witness pressure now enters the chapter before the gate decision.',
        },
      })

      const acceptResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/backlog-proposals/${proposal.proposalId}/accept`,
        payload: {
          locale: 'en',
        },
      })

      expect(acceptResponse.statusCode).toBe(200)
      expect(acceptResponse.json()).toMatchObject({
        planning: {
          acceptedProposalId: proposal.proposalId,
        },
      })
      expect(acceptResponse.json().scenes.map((scene: { order: number; id: string; backlogStatus: string }) => `${scene.order}:${scene.id}:${scene.backlogStatus}`)).toEqual([
        '1:scene-concourse-delay:needs_review',
        '2:scene-midnight-platform:planned',
        '3:scene-ticket-window:planned',
        '4:scene-departure-bell:planned',
      ])
      expect(acceptResponse.json().scenes.find((scene: { id: string }) => scene.id === 'scene-concourse-delay')).toMatchObject({
        title: {
          en: 'Concourse Delay Opening',
        },
        summary: {
          en: 'Promote the crowd bottleneck into the chapter opening beat.',
        },
        purpose: {
          en: 'Open the chapter with witness pressure already in motion.',
        },
        pov: {
          en: 'Mei Arden',
        },
        location: {
          en: 'Crowded concourse hall',
        },
        conflict: {
          en: 'The crowd blocks any clean exit and keeps the bargain public.',
        },
        reveal: {
          en: 'Witness pressure now enters the chapter before the gate decision.',
        },
      })
    })
  })
})

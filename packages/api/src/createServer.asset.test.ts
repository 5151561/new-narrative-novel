import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

describe('fixture API server asset routes', () => {
  it('returns all five asset kinds from the navigator list route', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/assets',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        groups: {
          character: expect.arrayContaining([expect.objectContaining({ id: 'asset-ren-voss' })]),
          location: expect.arrayContaining([expect.objectContaining({ id: 'asset-midnight-platform' })]),
          organization: expect.arrayContaining([expect.objectContaining({ id: 'asset-courier-network' })]),
          object: expect.arrayContaining([expect.objectContaining({ id: 'asset-closed-ledger' })]),
          lore: expect.arrayContaining([expect.objectContaining({ id: 'asset-public-witness-rule' })]),
        },
      })
    })
  })

  it('returns story bible facts with visibility metadata on asset knowledge reads', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/assets/asset-ren-voss/knowledge',
      })

      expect(response.statusCode).toBe(200)
      const asset = response
        .json()
        .assets.find((record: { id: string }) => record.id === 'asset-ren-voss')

      expect(asset).toMatchObject({
        id: 'asset-ren-voss',
        kind: 'character',
        visibility: 'character-known',
        canonFacts: expect.arrayContaining([
          expect.objectContaining({
            id: 'ren-public-line',
            visibility: 'public',
          }),
        ]),
        privateFacts: expect.arrayContaining([
          expect.objectContaining({
            id: 'ren-courier-key',
            visibility: 'private',
            sourceRefs: expect.arrayContaining([
              expect.objectContaining({
                label: expect.objectContaining({
                  en: 'Courier signal notes',
                }),
              }),
            ]),
          }),
        ]),
        stateTimeline: expect.arrayContaining([
          expect.objectContaining({
            id: 'ren-midnight-platform',
            sceneId: 'scene-midnight-platform',
            chapterId: 'chapter-signals-in-rain',
          }),
        ]),
      })
    })
  })

  it('filters private and spoiler facts by requested visibility context', async () => {
    await withTestServer(async ({ app }) => {
      const [characterKnown, publicOnly] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/assets/asset-closed-ledger/knowledge?visibility=character-known',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/assets/asset-closed-ledger/knowledge?visibility=public',
        }),
      ])

      expect(characterKnown.statusCode).toBe(200)
      expect(publicOnly.statusCode).toBe(200)

      const characterKnownAsset = characterKnown
        .json()
        .assets.find((record: { id: string }) => record.id === 'asset-closed-ledger')
      const publicAsset = publicOnly
        .json()
        .assets.find((record: { id: string }) => record.id === 'asset-closed-ledger')

      expect(characterKnownAsset.privateFacts).toEqual([])
      expect(publicAsset.privateFacts).toEqual([])
      expect(characterKnownAsset.canonFacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'closed-ledger-shell',
            visibility: 'character-known',
          }),
        ]),
      )
      expect(characterKnownAsset.canonFacts).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'closed-ledger-witness-proof',
          }),
        ]),
      )
      expect(publicAsset.canonFacts).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'closed-ledger-shell',
          }),
        ]),
      )
    })
  })

  it('filters context packet participation to canonical assets without leaking hidden fact payloads', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Check canonical asset participation in the packed context.',
        },
      })

      expect(startResponse.statusCode).toBe(200)
      const runId = startResponse.json().id as string
      const contextPacketId = runId.replace(/^run-/, 'ctx-').replace(/-(\d{3})$/, '-run-$1')

      const artifactResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${runId}/artifacts/${contextPacketId}`,
      })

      expect(artifactResponse.statusCode).toBe(200)
      const artifact = artifactResponse.json().artifact

      expect(artifact.includedAssets).toEqual(expect.arrayContaining([
        expect.objectContaining({ assetId: 'asset-courier-network', kind: 'organization' }),
        expect.objectContaining({ assetId: 'asset-closed-ledger', kind: 'object' }),
        expect.objectContaining({ assetId: 'asset-public-witness-rule', kind: 'lore' }),
      ]))
      expect(artifact.assetActivations).toEqual(expect.arrayContaining([
        expect.objectContaining({
          assetId: 'asset-closed-ledger',
          decision: 'included',
          visibility: 'character-known',
        }),
        expect.objectContaining({
          assetId: 'asset-public-witness-rule',
          decision: 'included',
          visibility: 'public',
        }),
      ]))
      expect(artifact.excludedPrivateFacts).toEqual(expect.arrayContaining([
        expect.objectContaining({
          label: expect.objectContaining({
            en: 'Courier signal private key',
          }),
        }),
        expect.objectContaining({
          label: expect.objectContaining({
            en: 'Witness-proof payload',
          }),
        }),
      ]))
      expect(JSON.stringify(artifact)).not.toContain('current signal key')
      expect(JSON.stringify(artifact)).not.toContain('settle the bargain instantly')
    })
  })
})

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ProposalSetArtifactDetailRecord } from '@/features/run/api/run-artifact-records'

import { useRunProposalVariantDraft } from './useRunProposalVariantDraft'

function localized(value: string) {
  return {
    en: value,
    'zh-CN': value,
  }
}

function createProposalSetArtifact(id = 'proposal-set-001'): ProposalSetArtifactDetailRecord {
  return {
    id,
    runId: 'run-001',
    kind: 'proposal-set',
    title: localized('Proposal set'),
    summary: localized('Proposal summary'),
    statusLabel: localized('Ready'),
    createdAtLabel: localized('2026-04-21 10:08'),
    sourceEventIds: ['event-001'],
    reviewId: 'review-001',
    sourceInvocationIds: ['invocation-001'],
    proposals: [
      {
        id: 'proposal-selected',
        title: localized('Selected proposal'),
        summary: localized('Selected proposal summary'),
        changeKind: 'action',
        riskLabel: localized('Low risk'),
        relatedAssets: [],
        defaultVariantId: 'variant-selected-default',
        selectedVariantId: 'variant-selected-existing',
        variants: [
          {
            id: 'variant-selected-default',
            label: localized('Default'),
            summary: localized('Default summary'),
            rationale: localized('Default rationale'),
          },
          {
            id: 'variant-selected-existing',
            label: localized('Existing'),
            summary: localized('Existing summary'),
            rationale: localized('Existing rationale'),
          },
        ],
      },
      {
        id: 'proposal-default',
        title: localized('Default proposal'),
        summary: localized('Default proposal summary'),
        changeKind: 'reveal',
        riskLabel: localized('Medium risk'),
        relatedAssets: [],
        defaultVariantId: 'variant-default-second',
        selectedVariantId: 'variant-default-missing',
        variants: [
          {
            id: 'variant-default-first',
            label: localized('First'),
            summary: localized('First summary'),
            rationale: localized('First rationale'),
          },
          {
            id: 'variant-default-second',
            label: localized('Second'),
            summary: localized('Second summary'),
            rationale: localized('Second rationale'),
          },
        ],
      },
      {
        id: 'proposal-first',
        title: localized('First proposal'),
        summary: localized('First proposal summary'),
        changeKind: 'state-change',
        riskLabel: localized('High risk'),
        relatedAssets: [],
        defaultVariantId: 'variant-first-missing',
        variants: [
          {
            id: 'variant-first-only',
            label: localized('Only'),
            summary: localized('Only summary'),
            rationale: localized('Only rationale'),
          },
        ],
      },
      {
        id: 'proposal-without-variants',
        title: localized('No variants'),
        summary: localized('No variants summary'),
        changeKind: 'continuity-note',
        riskLabel: localized('No risk'),
        relatedAssets: [],
      },
    ],
    reviewOptions: [],
  }
}

describe('useRunProposalVariantDraft', () => {
  it('initializes from selectedVariantId, defaultVariantId, then first variant', () => {
    const artifact = createProposalSetArtifact()
    const hook = renderHook(() =>
      useRunProposalVariantDraft({
        runId: 'run-001',
        proposalSetArtifact: artifact,
      }),
    )

    expect(hook.result.current.selectedVariantsByProposalId).toEqual({
      'proposal-selected': 'variant-selected-existing',
      'proposal-default': 'variant-default-second',
      'proposal-first': 'variant-first-only',
    })
    expect(hook.result.current.selectedVariantsForSubmit).toEqual([
      { proposalId: 'proposal-selected', variantId: 'variant-selected-existing' },
      { proposalId: 'proposal-default', variantId: 'variant-default-second' },
      { proposalId: 'proposal-first', variantId: 'variant-first-only' },
    ])
  })

  it('updates, resets manually, and keeps selectedVariantsForSubmit shape stable', () => {
    const artifact = createProposalSetArtifact()
    const hook = renderHook(() =>
      useRunProposalVariantDraft({
        runId: 'run-001',
        proposalSetArtifact: artifact,
      }),
    )
    const initialSubmit = hook.result.current.selectedVariantsForSubmit

    hook.rerender()
    expect(hook.result.current.selectedVariantsForSubmit).toBe(initialSubmit)

    act(() => {
      hook.result.current.selectVariant('proposal-selected', 'variant-selected-default')
    })

    expect(hook.result.current.selectedVariantsForSubmit).toEqual([
      { proposalId: 'proposal-selected', variantId: 'variant-selected-default' },
      { proposalId: 'proposal-default', variantId: 'variant-default-second' },
      { proposalId: 'proposal-first', variantId: 'variant-first-only' },
    ])
    expect(Object.keys(hook.result.current.selectedVariantsForSubmit[0] ?? {})).toEqual(['proposalId', 'variantId'])

    act(() => {
      hook.result.current.reset()
    })

    expect(hook.result.current.selectedVariantsByProposalId).toEqual({
      'proposal-selected': 'variant-selected-existing',
      'proposal-default': 'variant-default-second',
      'proposal-first': 'variant-first-only',
    })
  })

  it('resets when runId or proposal-set artifact id changes', () => {
    const firstArtifact = createProposalSetArtifact('proposal-set-001')
    const secondArtifact = {
      ...createProposalSetArtifact('proposal-set-002'),
      proposals: [
        {
          ...createProposalSetArtifact('proposal-set-002').proposals[0]!,
          selectedVariantId: undefined,
          defaultVariantId: 'variant-selected-default',
        },
      ],
    }
    const hook = renderHook(
      ({ runId, artifact }) =>
        useRunProposalVariantDraft({
          runId,
          proposalSetArtifact: artifact,
        }),
      {
        initialProps: {
          runId: 'run-001',
          artifact: firstArtifact,
        },
      },
    )

    act(() => {
      hook.result.current.selectVariant('proposal-selected', 'variant-selected-default')
    })
    expect(hook.result.current.selectedVariantsByProposalId).toMatchObject({
      'proposal-selected': 'variant-selected-default',
    })

    hook.rerender({
      runId: 'run-001',
      artifact: secondArtifact,
    })
    expect(hook.result.current.selectedVariantsByProposalId).toEqual({
      'proposal-selected': 'variant-selected-default',
    })

    act(() => {
      hook.result.current.selectVariant('proposal-selected', 'variant-selected-existing')
    })
    hook.rerender({
      runId: 'run-002',
      artifact: secondArtifact,
    })
    expect(hook.result.current.selectedVariantsByProposalId).toEqual({
      'proposal-selected': 'variant-selected-default',
    })
  })

  it('reconciles stale draft selections when the same run and artifact id refetch with changed variants', () => {
    const firstArtifact = createProposalSetArtifact('proposal-set-001')
    const refetchedArtifact: ProposalSetArtifactDetailRecord = {
      ...createProposalSetArtifact('proposal-set-001'),
      proposals: [
        {
          ...createProposalSetArtifact('proposal-set-001').proposals[0]!,
          selectedVariantId: 'variant-selected-refetched',
          defaultVariantId: 'variant-selected-refetched',
          variants: [
            {
              id: 'variant-selected-refetched',
              label: localized('Refetched'),
              summary: localized('Refetched summary'),
              rationale: localized('Refetched rationale'),
            },
          ],
        },
        {
          ...createProposalSetArtifact('proposal-set-001').proposals[1]!,
          selectedVariantId: undefined,
          defaultVariantId: 'variant-default-second',
        },
        {
          id: 'proposal-new',
          title: localized('New proposal'),
          summary: localized('New proposal summary'),
          changeKind: 'action',
          riskLabel: localized('Low risk'),
          relatedAssets: [],
          defaultVariantId: 'variant-new-default',
          variants: [
            {
              id: 'variant-new-default',
              label: localized('New default'),
              summary: localized('New default summary'),
              rationale: localized('New default rationale'),
            },
          ],
        },
      ],
    }
    const hook = renderHook(
      ({ artifact }) =>
        useRunProposalVariantDraft({
          runId: 'run-001',
          proposalSetArtifact: artifact,
        }),
      {
        initialProps: {
          artifact: firstArtifact,
        },
      },
    )

    act(() => {
      hook.result.current.selectVariant('proposal-selected', 'variant-selected-default')
      hook.result.current.selectVariant('proposal-default', 'variant-default-first')
    })
    expect(hook.result.current.selectedVariantsByProposalId).toMatchObject({
      'proposal-selected': 'variant-selected-default',
      'proposal-default': 'variant-default-first',
    })

    hook.rerender({
      artifact: refetchedArtifact,
    })

    expect(hook.result.current.selectedVariantsByProposalId).toEqual({
      'proposal-selected': 'variant-selected-refetched',
      'proposal-default': 'variant-default-first',
      'proposal-new': 'variant-new-default',
    })
    expect(hook.result.current.selectedVariantsForSubmit).toEqual([
      { proposalId: 'proposal-selected', variantId: 'variant-selected-refetched' },
      { proposalId: 'proposal-default', variantId: 'variant-default-first' },
      { proposalId: 'proposal-new', variantId: 'variant-new-default' },
    ])
  })
})

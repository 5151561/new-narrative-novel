import type { AssetKnowledgeWorkspaceViewModel, AssetTraceabilityStatusViewModel } from '../types/asset-view-models'
import type { AssetTraceabilitySummaryViewModel } from '@/features/traceability/types/traceability-view-models'

interface MergeAssetTraceabilityIntoWorkspaceInput {
  workspace: AssetKnowledgeWorkspaceViewModel
  traceability: {
    summary: AssetTraceabilitySummaryViewModel | null
    isLoading: boolean
    error: Error | null
  }
  locale: 'en' | 'zh-CN'
}

function buildTraceabilityStatus(
  locale: 'en' | 'zh-CN',
  traceability: MergeAssetTraceabilityIntoWorkspaceInput['traceability'],
): AssetTraceabilityStatusViewModel {
  if (traceability.error) {
    return {
      state: 'unavailable',
      title: locale === 'zh-CN' ? '来源链不可用' : 'Traceability unavailable',
      message: traceability.error.message,
    }
  }

  return {
    state: 'loading',
    title: locale === 'zh-CN' ? '正在加载来源链' : 'Loading traceability',
    message:
      locale === 'zh-CN'
        ? '场景来源链完成后，这里才会显示真实的 trace judgment。'
        : 'Real traceability judgments will appear here once scene sources finish loading.',
  }
}

export function mergeAssetTraceabilityIntoWorkspace({
  workspace,
  traceability,
  locale,
}: MergeAssetTraceabilityIntoWorkspaceInput): AssetKnowledgeWorkspaceViewModel {
  const mentionSummaryById = new Map(traceability.summary?.mentionSummaries.map((summary) => [summary.mentionId, summary]) ?? [])
  const traceabilityStatus = traceability.summary ? null : buildTraceabilityStatus(locale, traceability)

  return {
    ...workspace,
    mentions: workspace.mentions.map((mention) => {
      const stableBackingKind = mention.backing?.kind ?? 'unlinked'
      const traceSummary = mentionSummaryById.get(mention.id)

      return {
        ...mention,
        traceDetail: traceability.summary
          ? {
              backingKind: traceSummary?.backingKind ?? stableBackingKind,
              factLabels: traceSummary?.factLabels ?? [],
              proposalTitles: traceSummary?.proposalTitles ?? [],
              patchId: traceSummary?.patchId,
              sceneTraceMissing: traceSummary?.sceneTraceMissing ?? false,
            }
          : undefined,
        traceDetailStatus: traceability.summary
          ? null
          : {
              state: traceabilityStatus!.state,
              title:
                traceabilityStatus!.state === 'unavailable'
                  ? locale === 'zh-CN'
                    ? '来源细节不可用'
                    : 'Trace detail unavailable'
                  : locale === 'zh-CN'
                    ? '正在加载来源细节'
                    : 'Loading trace detail',
              message:
                traceabilityStatus!.state === 'unavailable'
                  ? traceabilityStatus!.message
                  : locale === 'zh-CN'
                    ? '场景来源链完成后，这里才会显示 accepted facts、source proposals 和 patch。'
                    : 'Accepted facts, source proposals, and patch provenance will appear once scene sources finish loading.',
            },
      }
    }),
    inspector: {
      ...workspace.inspector,
      canonBackedMentionCount: traceability.summary?.canonBackedMentions,
      draftContextMentionCount: traceability.summary?.draftContextMentions,
      unlinkedMentionCount: traceability.summary?.unlinkedMentions,
      traceabilityStatus,
    },
    dockSummary: {
      ...workspace.dockSummary,
      problemItems: traceability.summary
        ? [
            ...workspace.dockSummary.problemItems.filter(
              (item) =>
                item.id !== 'mentions-without-canon-backing' &&
                item.id !== 'mentions-with-missing-scene-trace' &&
                item.id !== 'relations-without-narrative-backing',
            ),
            {
              id: 'mentions-without-canon-backing',
              label: locale === 'zh-CN' ? 'mentions 缺少 canon 支撑' : 'Mentions without canon backing',
              detail:
                traceability.summary.draftContextMentions + traceability.summary.unlinkedMentions > 0
                  ? locale === 'zh-CN'
                    ? `${traceability.summary.draftContextMentions + traceability.summary.unlinkedMentions} 条 mention 仍停留在 draft context 或未接线状态。`
                    : `${traceability.summary.draftContextMentions + traceability.summary.unlinkedMentions} mentions still rely on draft context or remain unlinked.`
                  : locale === 'zh-CN'
                    ? '当前 mentions 都已经有 canon backing。'
                    : 'Every mention currently resolves to canon backing.',
            },
            {
              id: 'mentions-with-missing-scene-trace',
              label: locale === 'zh-CN' ? 'mentions 缺少场景来源链' : 'Mentions with missing scene trace',
              detail:
                traceability.summary.mentionsWithMissingSceneTrace > 0
                  ? locale === 'zh-CN'
                    ? `${traceability.summary.mentionsWithMissingSceneTrace} 条 mention 还没有稳定的 scene trace。`
                    : `${traceability.summary.mentionsWithMissingSceneTrace} mentions are still missing stable scene trace metadata.`
                  : locale === 'zh-CN'
                    ? '当前 mentions 都能回到对应的场景来源链。'
                    : 'Every mention currently resolves back to a scene trace.',
            },
            {
              id: 'relations-without-narrative-backing',
              label: locale === 'zh-CN' ? '关系缺少叙事支撑' : 'Relations present but no narrative backing',
              detail:
                traceability.summary.relationsWithoutNarrativeBackingCount > 0
                  ? locale === 'zh-CN'
                    ? `${traceability.summary.relationsWithoutNarrativeBackingCount} 条 relation 还没有在当前 narrative backing 里找到来源。`
                    : `${traceability.summary.relationsWithoutNarrativeBackingCount} relations do not yet appear in the current narrative backing.`
                  : locale === 'zh-CN'
                    ? '当前 relations 都已经能在 narrative backing 中找到来源。'
                    : 'Current relations all map back to narrative backing.',
            },
          ]
        : workspace.dockSummary.problemItems,
      mentionsWithoutCanonBackingCount: traceability.summary
        ? traceability.summary.draftContextMentions + traceability.summary.unlinkedMentions
        : undefined,
      mentionsWithMissingSceneTraceCount: traceability.summary?.mentionsWithMissingSceneTrace,
      relationsWithoutNarrativeBackingCount: traceability.summary?.relationsWithoutNarrativeBackingCount,
      traceabilityStatus,
    },
  }
}

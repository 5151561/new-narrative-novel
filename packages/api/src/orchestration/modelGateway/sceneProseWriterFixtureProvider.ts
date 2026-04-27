import type { RunArtifactRelatedAssetRecord, RunSelectedProposalVariantRecord } from '../../contracts/api-records.js'

import type { SceneProseWriterGatewayRequest, SceneProseWriterProvider } from './sceneProseWriterGateway.js'
import { parseSceneProseWriterOutput } from './sceneProseWriterOutputSchema.js'

export const FIXTURE_SCENE_PROSE_WRITER_MODEL_ID = 'fixture-scene-prose-writer'

export function createSceneProseWriterFixtureProvider(): SceneProseWriterProvider {
  return {
    async generate(request: SceneProseWriterGatewayRequest) {
      return parseSceneProseWriterOutput({
        body: buildFixtureBody(request),
        excerpt: {
          en: request.task === 'revision'
            ? `${formatSceneName(request.sceneId)} revision candidate sharpens the next beat without replacing the accepted source draft yet.`
            : `${formatSceneName(request.sceneId)} settles into view before the next reveal turns visible.`,
          'zh-CN': request.task === 'revision'
            ? `${formatSceneName(request.sceneId)} 的修订候选会强化下一拍，但暂时不会替换已接受的来源草稿。`
            : `${formatSceneName(request.sceneId)} 先稳稳落入视野，随后下一段揭示才开始显形。`,
        },
        diffSummary: buildFixtureDiffSummary(request),
        relatedAssets: buildFixtureRelatedAssets(request.sceneId),
      })
    },
  }
}

function buildFixtureBody(request: SceneProseWriterGatewayRequest) {
  if (request.task === 'revision') {
    return buildFixtureRevisionBody(request)
  }

  const sceneName = formatSceneName(request.sceneId)
  const acceptedProposalLine = request.acceptedProposalIds.length > 0
    ? `Accepted proposal ${request.acceptedProposalIds.join(', ')} anchors the draft.`
    : 'The default accepted proposal anchors the draft.'
  const acceptedProposalLineZh = request.acceptedProposalIds.length > 0
    ? `已接受提案 ${request.acceptedProposalIds.join(', ')} 成为正文锚点。`
    : '默认接受提案成为正文锚点。'
  const variantLines = request.selectedVariants?.map(buildSelectedVariantBodyLine) ?? []
  const selectedVariantLine = variantLines.length > 0
    ? variantLines.map((line) => line.en).join(' ')
    : 'No selected proposal variant was submitted, so the draft follows the default accepted proposal path.'
  const selectedVariantLineZh = variantLines.length > 0
    ? variantLines.map((line) => line['zh-CN']).join(' ')
    : '未提交已选提案变体，因此正文沿用默认接受提案路径。'

  return {
    en: `${sceneName} opens from the accepted run artifact rather than a hard-coded scene field. ${acceptedProposalLine} ${selectedVariantLine} The scene resolves into generated prose that can be traced back to the canon patch.`,
    'zh-CN': `${sceneName} 从已接受的运行 artifact 展开，而不是直接写死在 scene 字段里。${acceptedProposalLineZh}${selectedVariantLineZh} 该场景生成的正文可以追溯回正典补丁。`,
  }
}

function buildFixtureRevisionBody(request: SceneProseWriterGatewayRequest) {
  const sceneName = formatSceneName(request.sceneId)
  const currentProse = request.currentProse?.trim() || `${sceneName} keeps its current draft spine in view.`
  const instruction = request.instruction?.trim() || 'No additional revision instruction was provided.'
  const sourcePatchId = request.sourceCanonPatchId ?? 'unknown-canon-patch'
  const sourceDraftId = request.sourceProseDraftId ?? 'unknown-prose-draft'
  const revisionLabel = formatRevisionMode(request.revisionMode ?? 'rewrite')

  return {
    en: `${sceneName} now runs a ${revisionLabel} revision pass against the accepted draft. ${currentProse} Editorial instruction: ${instruction} The candidate keeps provenance anchored to ${sourceDraftId} and ${sourcePatchId} while rewriting the witness-facing beats into a reviewable alternative.`,
    'zh-CN': `${sceneName} 现在会基于已接受草稿执行一次${localizeRevisionMode(request.revisionMode ?? 'rewrite')}修订。${currentProse} 编辑指令：${instruction} 该候选会继续锚定 ${sourceDraftId} 与 ${sourcePatchId} 的来源关系，同时把面向见证者的节拍改写成一个可审阅的备选正文。`,
  }
}

function buildFixtureDiffSummary(request: SceneProseWriterGatewayRequest) {
  if (request.task !== 'revision') {
    return 'Rendered accepted scene prose from the approved canon patch context.'
  }

  switch (request.revisionMode) {
    case 'compress':
      return 'Compressed repeated witness beats while preserving accepted provenance.'
    case 'expand':
      return 'Expanded witness-facing beats while preserving accepted provenance.'
    case 'tone_adjust':
      return 'Adjusted bargaining tone while preserving accepted provenance.'
    case 'continuity_fix':
      return 'Resolved continuity pressure points while preserving accepted provenance.'
    case 'rewrite':
    default:
      return 'Rebuilt the scene around the accepted canon patch while preserving provenance links.'
  }
}

function buildSelectedVariantBodyLine(selectedVariant: RunSelectedProposalVariantRecord, index: number) {
  const variantLabel = selectedVariant.variantId
    .replace(`${selectedVariant.proposalId}-variant-`, '')
    .split('-')
    .filter(Boolean)
    .join(' ')
  const displayIndex = index + 1

  return {
    en: `Selected variant ${displayIndex} (${variantLabel}) shapes the beat by preserving its proposed effect, with rationale retained from ${selectedVariant.variantId}.`,
    'zh-CN': `已选变体 ${displayIndex}（${variantLabel}）按其提案效果塑造节拍，并保留来自 ${selectedVariant.variantId} 的理由。`,
  }
}

function formatRevisionMode(revisionMode: NonNullable<SceneProseWriterGatewayRequest['revisionMode']>) {
  switch (revisionMode) {
    case 'compress':
      return 'compression'
    case 'expand':
      return 'expansion'
    case 'tone_adjust':
      return 'tone-adjustment'
    case 'continuity_fix':
      return 'continuity-fix'
    case 'rewrite':
    default:
      return 'rewrite'
  }
}

function localizeRevisionMode(revisionMode: NonNullable<SceneProseWriterGatewayRequest['revisionMode']>) {
  switch (revisionMode) {
    case 'compress':
      return '压缩'
    case 'expand':
      return '扩展'
    case 'tone_adjust':
      return '语气调整'
    case 'continuity_fix':
      return '连续性修复'
    case 'rewrite':
    default:
      return '重写'
  }
}

function buildFixtureRelatedAssets(sceneId: string): RunArtifactRelatedAssetRecord[] {
  const sceneName = formatSceneName(sceneId)

  return [
    {
      assetId: `asset-${sceneId}-lead`,
      kind: 'character',
      label: {
        en: `${sceneName} lead`,
        'zh-CN': `${sceneName} 主角`,
      },
    },
    {
      assetId: `asset-${sceneId}-setting`,
      kind: 'location',
      label: {
        en: `${sceneName} setting`,
        'zh-CN': `${sceneName} 场景地点`,
      },
    },
  ]
}

function formatSceneName(sceneId: string) {
  return sceneId
    .replace(/^scene-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

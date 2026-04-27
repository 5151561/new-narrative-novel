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
          en: `${formatSceneName(request.sceneId)} settles into view before the next reveal turns visible.`,
          'zh-CN': `${formatSceneName(request.sceneId)} 先稳稳落入视野，随后下一段揭示才开始显形。`,
        },
        relatedAssets: buildFixtureRelatedAssets(request.sceneId),
      })
    },
  }
}

function buildFixtureBody(request: SceneProseWriterGatewayRequest) {
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

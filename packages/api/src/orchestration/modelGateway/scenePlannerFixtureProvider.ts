import type { ScenePlannerGatewayRequest, ScenePlannerProvider } from './scenePlannerGateway.js'
import { parseScenePlannerOutput } from './scenePlannerOutputSchema.js'

export const FIXTURE_SCENE_PLANNER_MODEL_ID = 'fixture-scene-planner'

export function createScenePlannerFixtureProvider(): ScenePlannerProvider {
  return {
    async generate(request: ScenePlannerGatewayRequest) {
      return parseScenePlannerOutput({
        proposals: buildFixtureProposals(request.sceneId),
      })
    },
  }
}

function buildFixtureProposals(sceneId: string) {
  const sceneName = formatSceneName(sceneId)

  return [
    {
      title: 'Anchor the arrival beat',
      summary: `Open on ${sceneName} before introducing any new reveal.`,
      changeKind: 'action',
      riskLabel: 'Low continuity risk',
      variants: [
        {
          label: 'Arrival-first',
          summary: `Keep ${sceneName} grounded in the lead character's arrival before escalating the reveal.`,
          rationale: 'Preserves continuity while still giving the scene a clear forward beat.',
          tradeoffLabel: 'Slower escalation',
          riskLabel: 'Low continuity risk',
        },
        {
          label: 'Reveal pressure',
          summary: `Let the reveal intrude earlier while ${sceneName} is still settling.`,
          rationale: 'Creates a sharper hook, but asks review to accept a faster continuity turn.',
          tradeoffLabel: 'Sharper hook',
          riskLabel: 'Higher continuity risk',
        },
      ],
    },
    {
      title: 'Stage the reveal through the setting',
      summary: `Let the ${sceneName} setting carry the reveal instead of adding raw exposition.`,
      changeKind: 'reveal',
      riskLabel: 'Editor check recommended',
    },
  ] as const
}

function formatSceneName(sceneId: string) {
  return sceneId
    .replace(/^scene-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

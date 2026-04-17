import type { ReactElement } from 'react'
import { render } from '@testing-library/react'

import dockMeta, { Default as DockDefault } from './SceneDockContainer.stories'
import { SceneDockContainer } from './SceneDockContainer'
import inspectorMeta, { Traceability as InspectorTraceability } from './SceneInspectorContainer.stories'
import { SceneInspectorContainer } from './SceneInspectorContainer'

function renderDecoratedStory(
  ui: () => ReactElement,
  decorator: unknown,
  parameters: Record<string, unknown> | undefined,
) {
  return render((decorator as (Story: () => ReactElement, context: { parameters?: Record<string, unknown> }) => ReactElement)(ui, { parameters }))
}

describe('scene pane stories', () => {
  it('renders the bottom dock story inside a vertical pane shell', async () => {
    renderDecoratedStory(
      () => <SceneDockContainer sceneId={DockDefault.args!.sceneId} />,
      dockMeta.decorators?.[0],
      DockDefault.parameters,
    )

    expect(document.querySelector('.ring-panel')).toHaveClass('flex-col')
  })

  it('renders the inspector story inside a vertical pane shell', async () => {
    renderDecoratedStory(
      () => <SceneInspectorContainer sceneId={InspectorTraceability.args!.sceneId} />,
      inspectorMeta.decorators?.[0],
      InspectorTraceability.parameters,
    )

    expect(document.querySelector('.ring-panel')).toHaveClass('flex-col')
  })
})

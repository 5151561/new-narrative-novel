import type { WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

import {
  getWorkbenchEditorContextId,
  type WorkbenchEditorContextId,
} from './workbench-editor-context'

export interface WorkbenchEditorDictionary {
  shell: {
    sceneEditor: string
    chapterEditor: string
    assetEditor: string
    bookEditor: string
    structureLens: string
    orchestrateLens: string
    draftLens: string
    knowledgeLens: string
  }
}

export interface WorkbenchEditorDescriptor {
  id: WorkbenchEditorContextId
  title: string
  subtitle: string
  scopeLabel: string
  lensLabel: string
}

function getScopeLabel(route: WorkbenchRouteState, dictionary: WorkbenchEditorDictionary) {
  if (route.scope === 'chapter') {
    return dictionary.shell.chapterEditor
  }

  if (route.scope === 'asset') {
    return dictionary.shell.assetEditor
  }

  if (route.scope === 'book') {
    return dictionary.shell.bookEditor
  }

  return dictionary.shell.sceneEditor
}

function getLensLabel(route: WorkbenchRouteState, dictionary: WorkbenchEditorDictionary) {
  if (route.lens === 'structure') {
    return dictionary.shell.structureLens
  }

  if (route.lens === 'draft') {
    return dictionary.shell.draftLens
  }

  if (route.lens === 'knowledge') {
    return dictionary.shell.knowledgeLens
  }

  return dictionary.shell.orchestrateLens
}

function getRouteObjectId(route: WorkbenchRouteState) {
  if (route.scope === 'chapter') {
    return route.chapterId
  }

  if (route.scope === 'asset') {
    return route.assetId
  }

  if (route.scope === 'book') {
    return route.bookId
  }

  return route.sceneId
}

export function describeWorkbenchEditorContext(
  route: WorkbenchRouteState,
  dictionary: WorkbenchEditorDictionary,
): WorkbenchEditorDescriptor {
  const scopeLabel = getScopeLabel(route, dictionary)
  const lensLabel = getLensLabel(route, dictionary)

  return {
    id: getWorkbenchEditorContextId(route),
    title: `${scopeLabel} · ${lensLabel}`,
    subtitle: getRouteObjectId(route),
    scopeLabel,
    lensLabel,
  }
}

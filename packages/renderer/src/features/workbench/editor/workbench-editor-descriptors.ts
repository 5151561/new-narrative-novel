import {
  getAssetKnowledgeViewLabel,
  getChapterStructureViewLabel,
  getSceneTabLabel,
  type Locale,
} from '@/app/i18n'
import { getMockAssetRecordById } from '@/features/asset/api/mock-asset-db'
import { readLocalizedAssetText } from '@/features/asset/api/asset-records'
import { getMockBookRecordById } from '@/features/book/api/mock-book-db'
import { readLocalizedBookText } from '@/features/book/api/book-records'
import { getMockChapterRecordById, mockChapterRecords } from '@/features/chapter/api/mock-chapter-db'
import { readLocalizedChapterText } from '@/features/chapter/api/chapter-records'
import type { BookRouteState, WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

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

function getBookStructureViewLabel(locale: Locale, route: BookRouteState) {
  if (locale === 'zh-CN') {
    return route.view === 'sequence' ? '顺序' : route.view === 'outliner' ? '大纲' : '信号'
  }

  return route.view === 'sequence' ? 'Sequence' : route.view === 'outliner' ? 'Outliner' : 'Signals'
}

function getBookDraftViewLabel(locale: Locale, route: BookRouteState) {
  const draftView = route.draftView ?? 'read'

  if (locale === 'zh-CN') {
    if (draftView === 'compare') {
      return '对照'
    }
    if (draftView === 'export') {
      return '导出'
    }
    if (draftView === 'branch') {
      return '分支'
    }
    if (draftView === 'review') {
      return '审阅'
    }
    return '阅读'
  }

  if (draftView === 'compare') {
    return 'Compare'
  }
  if (draftView === 'export') {
    return 'Export'
  }
  if (draftView === 'branch') {
    return 'Branch'
  }
  if (draftView === 'review') {
    return 'Review'
  }
  return 'Read'
}

function getFallbackObjectLabel(scopeLabel: string, objectId: string) {
  let hash = 0
  for (let index = 0; index < objectId.length; index += 1) {
    hash = (hash * 31 + objectId.charCodeAt(index)) % 1296
  }

  return `${scopeLabel} ${hash.toString(36).toUpperCase().padStart(2, '0')}`
}

function getSceneObjectLabel(route: WorkbenchRouteState, scopeLabel: string, locale: Locale) {
  if (route.scope !== 'scene') {
    return null
  }

  for (const chapter of Object.values(mockChapterRecords)) {
    const scene = chapter.scenes.find((item) => item.id === route.sceneId)
    if (scene) {
      return readLocalizedChapterText(scene.title, locale)
    }
  }

  return getFallbackObjectLabel(scopeLabel, route.sceneId)
}

function getObjectLabel(route: WorkbenchRouteState, scopeLabel: string, locale: Locale) {
  if (route.scope === 'scene') {
    return getSceneObjectLabel(route, scopeLabel, locale) ?? getFallbackObjectLabel(scopeLabel, route.sceneId)
  }

  if (route.scope === 'chapter') {
    const record = getMockChapterRecordById(route.chapterId)
    return record ? readLocalizedChapterText(record.title, locale) : getFallbackObjectLabel(scopeLabel, route.chapterId)
  }

  if (route.scope === 'asset') {
    const record = getMockAssetRecordById(route.assetId)
    return record ? readLocalizedAssetText(record.title, locale) : getFallbackObjectLabel(scopeLabel, route.assetId)
  }

  const record = getMockBookRecordById(route.bookId)
  return record ? readLocalizedBookText(record.title, locale) : getFallbackObjectLabel(scopeLabel, route.bookId)
}

function getSubtitleLabel(
  route: WorkbenchRouteState,
  dictionary: WorkbenchEditorDictionary,
  locale: Locale,
  objectLabel: string,
) {
  let viewLabel: string

  if (route.scope === 'scene') {
    viewLabel = getSceneTabLabel(locale, route.tab)
  } else if (route.scope === 'chapter') {
    viewLabel = route.lens === 'structure'
      ? getChapterStructureViewLabel(locale, route.view)
      : dictionary.shell.draftLens
  } else if (route.scope === 'asset') {
    viewLabel = getAssetKnowledgeViewLabel(locale, route.view)
  } else {
    viewLabel = route.lens === 'structure'
      ? getBookStructureViewLabel(locale, route)
      : getBookDraftViewLabel(locale, route)
  }

  return `${objectLabel} · ${viewLabel}`
}

export function describeWorkbenchEditorContext(
  route: WorkbenchRouteState,
  dictionary: WorkbenchEditorDictionary,
  locale: Locale = 'en',
): WorkbenchEditorDescriptor {
  const scopeLabel = getScopeLabel(route, dictionary)
  const lensLabel = getLensLabel(route, dictionary)
  const objectLabel = getObjectLabel(route, scopeLabel, locale)

  return {
    id: getWorkbenchEditorContextId(route),
    title: `${scopeLabel} · ${lensLabel}`,
    subtitle: getSubtitleLabel(route, dictionary, locale, objectLabel),
    scopeLabel,
    lensLabel,
  }
}

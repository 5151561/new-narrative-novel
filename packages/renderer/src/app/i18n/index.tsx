import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'

import type {
  ProposalKind,
  ProposalSeverity,
  ProposalStatus,
  SceneRunStatus,
  SceneStatus,
  SceneDockTabId,
  SceneTab,
} from '@/features/scene/types/scene-view-models'
import type {
  AssetKnowledgeView,
  AssetLens,
  ChapterStructureView,
  WorkbenchLens,
} from '@/features/workbench/types/workbench-route'
import type {
  ProjectRuntimeHealthStatus,
  ProjectRuntimeSource,
} from '@/app/project-runtime/project-runtime-info'
import type { DesktopModelBindingProvider, DesktopModelBindingRole } from '@/features/settings/ModelSettingsProvider'

type InspectorTabId = 'context' | 'versions' | 'traceability' | 'runtime'

export type Locale = 'en' | 'zh-CN'

export const APP_LOCALE_STORAGE_KEY = 'narrative-novel.locale'

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) {
    return 'en'
  }

  return value.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedValue = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)
  return storedValue ? normalizeLocale(storedValue) : null
}

export function writeStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale)
}

export function resolveAppLocale(): Locale {
  const storedLocale = readStoredLocale()
  if (storedLocale) {
    return storedLocale
  }

  if (typeof navigator === 'undefined') {
    return 'en'
  }

  return normalizeLocale(navigator.language)
}

const localeNames: Record<Locale, Record<Locale, string>> = {
  en: {
    en: 'EN',
    'zh-CN': '中文',
  },
  'zh-CN': {
    en: 'EN',
    'zh-CN': '中文',
  },
}

const sceneStatusLabels: Record<Locale, Record<SceneStatus, string>> = {
  en: {
    draft: 'draft',
    running: 'running',
    review: 'review',
    ready: 'ready',
    committed: 'committed',
  },
  'zh-CN': {
    draft: '草稿',
    running: '运行中',
    review: '审阅中',
    ready: '就绪',
    committed: '已提交',
  },
}

const runStatusLabels: Record<Locale, Record<SceneRunStatus, string>> = {
  en: {
    idle: 'idle',
    running: 'running',
    paused: 'paused',
    failed: 'failed',
    completed: 'completed',
  },
  'zh-CN': {
    idle: '未开始',
    running: '运行中',
    paused: '已暂停',
    failed: '失败',
    completed: '已完成',
  },
}

const proposalStatusLabels: Record<Locale, Record<ProposalStatus, string>> = {
  en: {
    pending: 'pending',
    accepted: 'accepted',
    rejected: 'rejected',
    'rewrite-requested': 'rewrite-requested',
  },
  'zh-CN': {
    pending: '待审',
    accepted: '已采纳',
    rejected: '已拒绝',
    'rewrite-requested': '待重写',
  },
}

const proposalStatusOptionLabels: Record<Locale, Record<ProposalStatus, string>> = {
  en: {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    'rewrite-requested': 'Rewrite Requested',
  },
  'zh-CN': {
    pending: '待审',
    accepted: '已采纳',
    rejected: '已拒绝',
    'rewrite-requested': '请求重写',
  },
}

const proposalKindLabels: Record<Locale, Record<ProposalKind, string>> = {
  en: {
    action: 'Action',
    intent: 'Intent',
    conflict: 'Conflict',
    'state-change': 'State Change',
    dialogue: 'Dialogue',
  },
  'zh-CN': {
    action: '动作',
    intent: '意图',
    conflict: '冲突',
    'state-change': '状态变化',
    dialogue: '对白',
  },
}

const proposalSeverityLabels: Record<Locale, Record<ProposalSeverity, string>> = {
  en: {
    info: 'Info',
    warn: 'Warn',
    high: 'High',
  },
  'zh-CN': {
    info: '提示',
    warn: '警告',
    high: '高风险',
  },
}

const workbenchLensLabels: Record<Locale, Record<WorkbenchLens, string>> = {
  en: {
    structure: 'Structure',
    orchestrate: 'Orchestrate',
    draft: 'Draft',
    knowledge: 'Knowledge',
  },
  'zh-CN': {
    structure: '结构',
    orchestrate: '编排',
    draft: '成稿',
    knowledge: '知识',
  },
}

const assetKnowledgeViewLabels: Record<Locale, Record<AssetKnowledgeView, string>> = {
  en: {
    profile: 'Profile',
    mentions: 'Mentions',
    relations: 'Relations',
    context: 'Context',
  },
  'zh-CN': {
    profile: '资料',
    mentions: '提及',
    relations: '关系',
    context: '上下文',
  },
}

const chapterStructureViewLabels: Record<Locale, Record<ChapterStructureView, string>> = {
  en: {
    sequence: 'Sequence',
    outliner: 'Outliner',
    assembly: 'Assembly',
    backlog: 'Backlog',
  },
  'zh-CN': {
    sequence: '顺序',
    outliner: '大纲',
    assembly: '装配',
    backlog: '积压计划',
  },
}

const chapterBacklogStatusLabels: Record<Locale, Record<'planned' | 'running' | 'needs_review' | 'drafted' | 'revised', string>> = {
  en: {
    planned: 'Planned',
    running: 'Running',
    needs_review: 'Needs review',
    drafted: 'Drafted',
    revised: 'Revised',
  },
  'zh-CN': {
    planned: '已规划',
    running: '进行中',
    needs_review: '待审阅',
    drafted: '已起草',
    revised: '已修订',
  },
}

const sceneTabLabels: Record<Locale, Record<SceneTab, string>> = {
  en: {
    setup: 'Setup',
    execution: 'Execution',
    prose: 'Prose',
  },
  'zh-CN': {
    setup: '设定',
    execution: '执行',
    prose: '正文',
  },
}

const dockTabLabels: Record<Locale, Record<SceneDockTabId, string>> = {
  en: {
    events: 'Events',
    trace: 'Trace',
    consistency: 'Consistency',
    problems: 'Problems',
    cost: 'Cost',
  },
  'zh-CN': {
    events: '事件',
    trace: '追踪',
    consistency: '一致性',
    problems: '问题',
    cost: '成本',
  },
}

const inspectorTabLabels: Record<Locale, Record<InspectorTabId, string>> = {
  en: {
    context: 'Context',
    versions: 'Versions',
    traceability: 'Traceability',
    runtime: 'Runtime',
  },
  'zh-CN': {
    context: '上下文',
    versions: '版本',
    traceability: '来源链',
    runtime: '运行态',
  },
}

const sceneProseSupportTextLabels: Record<Locale, Record<string, string>> = {
  en: {
    Generated: 'Generated',
    'Generated from run': 'Generated from run',
    'Generated from accepted run prose artifact.': 'Generated from accepted run prose artifact.',
    'Revision queued': 'Revision queued',
    'Revision candidate ready': 'Revision candidate ready',
    Updated: 'Updated',
    'Compressed repeated witness beats while preserving accepted provenance.':
      'Compressed repeated witness beats while preserving accepted provenance.',
    'Expanded witness-facing beats while preserving accepted provenance.':
      'Expanded witness-facing beats while preserving accepted provenance.',
    'Adjusted bargaining tone while preserving accepted provenance.':
      'Adjusted bargaining tone while preserving accepted provenance.',
    'Reconciled continuity edges while preserving accepted provenance.':
      'Reconciled continuity edges while preserving accepted provenance.',
    'Rebuilt witness-facing beats while preserving accepted provenance.':
      'Rebuilt witness-facing beats while preserving accepted provenance.',
  },
  'zh-CN': {
    Generated: '已生成',
    'Generated from run': '已由运行生成',
    'Generated from accepted run prose artifact.': '已根据采纳的运行正文产物生成。',
    'Revision queued': '修订已排队',
    'Revision candidate ready': '修订候选已就绪',
    Updated: '已更新',
    'Compressed repeated witness beats while preserving accepted provenance.': '已压缩重复的见证者节拍，并保留已采纳来源链。',
    'Expanded witness-facing beats while preserving accepted provenance.': '已扩展面向见证者的节拍，并保留已采纳来源链。',
    'Adjusted bargaining tone while preserving accepted provenance.': '已调整谈判语气，并保留已采纳来源链。',
    'Reconciled continuity edges while preserving accepted provenance.': '已修补连续性边缘问题，并保留已采纳来源链。',
    'Rebuilt witness-facing beats while preserving accepted provenance.': '已重建面向见证者的节拍，并保留已采纳来源链。',
  },
}

const readinessLabels: Record<Locale, Record<'not-ready' | 'draftable' | 'ready', string>> = {
  en: {
    'not-ready': 'not-ready',
    draftable: 'draftable',
    ready: 'ready',
  },
  'zh-CN': {
    'not-ready': '未就绪',
    draftable: '可起草',
    ready: '已就绪',
  },
}

const projectRuntimeSourceLabels: Record<Locale, Record<ProjectRuntimeSource, string>> = {
  en: {
    mock: 'Mock',
    api: 'API',
  },
  'zh-CN': {
    mock: 'Mock',
    api: 'API',
  },
}

const projectRuntimeHealthStatusLabels: Record<Locale, Record<ProjectRuntimeHealthStatus, string>> = {
  en: {
    healthy: 'Healthy',
    checking: 'Checking',
    unavailable: 'Unavailable',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    not_found: 'Not found',
    unknown: 'Unknown',
  },
  'zh-CN': {
    healthy: '健康',
    checking: '检查中',
    unavailable: '不可用',
    unauthorized: '未授权',
    forbidden: '禁止访问',
    not_found: '未找到',
    unknown: '未知',
  },
}

const beatStatusLabels: Record<Locale, Record<'todo' | 'running' | 'review' | 'accepted' | 'blocked', string>> = {
  en: {
    todo: 'todo',
    running: 'running',
    review: 'review',
    accepted: 'accepted',
    blocked: 'blocked',
  },
  'zh-CN': {
    todo: '待处理',
    running: '进行中',
    review: '审阅中',
    accepted: '已采纳',
    blocked: '已阻塞',
  },
}

const genericStatusLabels: Record<Locale, Record<string, string>> = {
  en: {
    known: 'known',
    guarded: 'guarded',
    'open-question': 'open-question',
    watching: 'watching',
    clear: 'clear',
    active: 'active',
    cleared: 'cleared',
    pass: 'pass',
    blocked: 'blocked',
    warn: 'warn',
    accepted: 'accepted',
    review: 'review',
    watch: 'watch',
    ready_for_commit: 'ready_for_commit',
    needs_review: 'needs_review',
    deferred: 'deferred',
    stable: 'stable',
    attention: 'attention',
  },
  'zh-CN': {
    known: '已知',
    guarded: '受保护',
    'open-question': '开放问题',
    watching: '观察中',
    clear: '清晰',
    active: '生效中',
    cleared: '已清除',
    pass: '通过',
    blocked: '阻塞',
    warn: '警告',
    accepted: '已采纳',
    review: '审阅中',
    watch: '关注',
    ready_for_commit: '可提交',
    needs_review: '待复核',
    deferred: '已延期',
    stable: '稳定',
    attention: '需关注',
  },
}

const setupFormStatusLabels: Record<Locale, Record<'synced' | 'unsaved' | 'discarded' | 'saved' | 'saved_and_opened', string>> = {
  en: {
    synced: 'Draft is synced with fixtures.',
    unsaved: 'Unsaved local changes',
    discarded: 'Local changes discarded',
    saved: 'Draft saved locally',
    saved_and_opened: 'Draft saved locally and moved to execution',
  },
  'zh-CN': {
    synced: '草稿已与演示数据同步。',
    unsaved: '本地修改尚未保存',
    discarded: '已丢弃本地修改',
    saved: '草稿已保存到本地',
    saved_and_opened: '草稿已保存，并已切换到执行视图',
  },
}

const dictionaries = {
  en: {
    common: {
      close: 'Close',
      language: 'Language',
      scene: 'Scene',
      chapter: 'Chapter',
      asset: 'Asset',
      book: 'Book',
      activeScene: 'Active scene',
      loading: 'Loading',
      previewData: 'Preview Data',
      preloadBridge: 'Preload Bridge',
    },
    app: {
      narrativeWorkbench: 'Narrative workbench',
      sceneCockpit: 'Scene cockpit',
      chapterWorkbench: 'Chapter workbench',
      chapterStructure: 'Chapter structure',
      chapterDraft: 'Chapter draft',
      assetKnowledge: 'Asset knowledge',
      sequence: 'Sequence',
      outliner: 'Outliner',
      assembly: 'Assembly',
      backlog: 'Backlog',
      chapters: 'Chapters',
      assets: 'Assets',
      chapterNavigatorDescription: 'Keep chapter structure, placeholder scenes, and unresolved signals aligned.',
      chapterDraftNavigatorDescription: 'Browse the assembled reading order while route.sceneId keeps the focus stable.',
      chapterDraftReaderDescription: 'Read the chapter in order while keeping scene focus route-owned.',
      assetNavigatorDescription: 'Keep typed asset identity, mentions, and relations close without leaving the workbench.',
      assetNavigatorEmpty: 'Assets will appear here once the workspace seed is available.',
      selectedScene: 'Selected Scene',
      chapterReadiness: 'Chapter Readiness',
      scope: 'Scope',
      scenes: 'Scenes',
      sceneNavigatorDescription: 'Keep scene selection close and let the run stay central.',
      queue: 'Queue',
      queueDescription:
        'Accepted state, versions, and dock telemetry stay live while the current scene keeps moving.',
      loadingSceneWorkspace: 'Loading scene workspace.',
      activeChapter: 'Active chapter',
      modeRailDetails: {
        structure: 'Objective, cast, and guardrails.',
        orchestrate: 'Beats, proposals, and accepted state.',
        draft: 'Scene prose and revision passes.',
        knowledge: 'Read the typed profile, mentions, and relations.',
      },
      assetGroups: {
        characters: 'Characters',
        locations: 'Locations',
        organizations: 'Organizations',
        objects: 'Objects',
        lore: 'Lore',
      },
      assetProfileEyebrow: 'Typed profile',
      assetMentions: 'Mentions',
      assetMentionsEmpty: 'This asset does not have any cross-scope mentions yet.',
      assetRelations: 'Relations',
      assetRelationsEmpty: 'This asset does not have any linked asset relations yet.',
      chapterScaffold: {
        currentChapter: 'Current chapter',
        scenePrefix: 'Scene',
        sceneCount: 'scenes',
        unresolved: 'Unresolved',
        sequencePrefix: 'Sequence',
        beatLinePrefix: 'Beat line',
        summary: 'Summary',
        assemblyLanes: 'Assembly lanes',
        assemblyDescription:
          'Reorder handles and structural writes stay out of scope here. This placeholder only keeps the assembly surface visible and route-backed.',
        incoming: 'Incoming',
        outgoing: 'Outgoing',
        currentAssembly: 'Current assembly',
        currentSeam: 'Current seam',
        selectedSceneBrief: 'Selected scene brief',
        unresolvedSummary: 'Unresolved summary',
        chapterNotes: 'Chapter notes',
        problems: 'Problems',
        assemblyHints: 'Assembly hints',
        statusSnapshot: 'Status',
        relationshipToAdjacent: 'Relationship to adjacent scenes',
        continuityFocus: 'Continuity focus',
        statusImpact: 'Status impact',
        noIncomingScene: 'No incoming scene.',
        noOutgoingScene: 'No outgoing scene.',
        purpose: 'Purpose',
        pov: 'POV',
        location: 'Location',
        reveal: 'Reveal',
        conflict: 'Conflict',
        moveEarlier: 'Move earlier',
        moveLater: 'Move later',
        editStructure: 'Edit Structure',
        save: 'Save',
        cancel: 'Cancel',
        openInOrchestrate: 'Open in Orchestrate',
        openInDraft: 'Open in Draft',
      },
    },
    launcher: {
      eyebrow: 'Desktop Startup',
      title: 'Choose how this Narrative IDE session should begin.',
      description:
        'Launcher stays outside the WorkbenchShell until a project session is explicit. Demo, real-project creation, and existing-project open all converge on the same desktop runtime seam.',
      openDemoProject: 'Open Demo Project',
      openDemoDescription: 'Start with the dedicated Signal Arc demo session stored under desktop user data.',
      createRealProject: 'Create Real Project',
      createRealDescription: 'Create a fresh narrative project folder through the native directory picker.',
      openExistingProject: 'Open Existing Project',
      openExistingDescription: 'Reconnect to an existing narrative project without leaking launcher state into the route.',
      workspaceTitle: 'Before the workbench',
      workspaceDescription:
        'This surface decides the session first. Navigator, inspector, dock, and the main stage only mount after a current project exists.',
      currentStateLabel: 'Current State',
      idleHint: 'No project is selected yet.',
      loading: 'Opening project…',
      actionFailedTitle: 'Launcher action failed',
    },
    shell: {
      navigatorTitle: 'Navigator',
      inspectorTitle: 'Inspector',
      inspectorDescription: 'Context, versions, and runtime stay close without taking over the run.',
      inspectorReadyTitle: 'Inspector ready',
      inspectorReadyMessage:
        'Accepted state, versions, and local overrides stay one step away from the stage.',
      bottomDockTitle: 'Bottom Dock',
      layoutControls: 'Workbench Layout Controls',
      toggleNavigator: 'Toggle Navigator',
      toggleInspector: 'Toggle Inspector',
      toggleBottomDock: 'Toggle Bottom Dock',
      maximizeBottomDock: 'Maximize Bottom Dock',
      restoreBottomDock: 'Restore Bottom Dock',
      resetWorkbenchLayout: 'Reset Workbench Layout',
      resizeNavigator: 'Resize Navigator',
      resizeInspector: 'Resize Inspector',
      resizeBottomDock: 'Resize Bottom Dock',
      openEditors: 'Open Editors',
      closeEditor: 'Close Editor',
      closeOtherEditors: 'Close Other Editors',
      sceneEditor: 'Scene',
      chapterEditor: 'Chapter',
      assetEditor: 'Asset',
      bookEditor: 'Book',
      structureLens: 'Structure',
      orchestrateLens: 'Orchestrate',
      draftLens: 'Draft',
      knowledgeLens: 'Knowledge',
      bottomDockDescription:
        'Events, trace, consistency, problems, and cost stay docked below the run.',
      dockReadyTitle: 'Dock ready',
      dockReadyMessage: 'Trace, warnings, and cost stay visible without pulling attention off the run.',
      projectRuntimeStatusLabel: 'Project runtime status',
      projectRuntimeRetry: 'Retry',
      projectRuntimeRetryLabel: 'Retry runtime check',
      projectRuntimeDegradedHint: 'Workbench stays available while the runtime health recovers.',
      projectRuntimeReadOnly: 'Read-only',
      projectRuntimeNoRunEvents: 'No run events',
      projectRuntimeNoReviewDecisions: 'No review decisions',
      demoFixtureProjectLabel: 'Demo Fixture Project',
      realProjectLabel: 'Real Project',
      mockStorybookProjectLabel: 'Mock Storybook',
      modelFixtureLabel: 'Model Fixture',
      modelProviderLabel: 'Model Provider',
      keyMissing: 'Key Missing',
      keyConfigured: 'Key Configured',
      testFailedLabel: 'Test Failed',
      openModelSettings: 'Model Settings',
      modelSettingsEyebrow: 'Runtime model bindings',
      modelSettingsTitle: 'Model Settings',
      providerProfilesTitle: 'Provider profiles',
      providerProfilesDescription: 'Named OpenAI-compatible providers, secrets, and role bindings stay shell-owned inside the desktop bridge.',
      providerProfileIdLabel: 'Provider ID',
      providerProfileLabelLabel: 'Provider label',
      providerProfileBaseUrlLabel: 'Base URL',
      providerProfileIdInput: 'Provider profile ID input',
      providerProfileLabelInput: 'Provider profile label input',
      providerProfileBaseUrlInput: 'Provider profile base URL input',
      providerProfileEditorIdInput: (providerId: string) => `${providerId} provider profile ID input`,
      providerProfileEditorLabelInput: (providerId: string) => `${providerId} provider profile label input`,
      providerProfileEditorBaseUrlInput: (providerId: string) => `${providerId} provider profile base URL input`,
      createProviderProfile: 'Create provider profile',
      saveProviderProfile: (providerLabel: string) => `Save ${providerLabel} profile`,
      deleteProviderProfile: (providerLabel: string) => `Delete ${providerLabel} profile`,
      providerCredentialInputLabel: (providerLabel: string) => `${providerLabel} API key`,
      providerCredentialInput: (providerLabel: string) => `${providerLabel} API key input`,
      saveProviderCredential: (providerLabel: string) => `Save ${providerLabel} API key`,
      clearProviderCredential: (providerLabel: string) => `Clear ${providerLabel} API key`,
      modelFixtureOptionLabel: 'Fixture',
      modelRoleBindingsTitle: 'Role bindings',
      modelRoleBindingsDescription: 'Shell-owned model bindings stay in the desktop bridge, not in the route.',
      modelIdLabel: 'Model ID',
      saveBindingLabel: (role: string) => `Save ${role} binding`,
      modelSettingsRoleProviderLabel: (role: string) => `${role} provider`,
      modelSettingsRoleModelLabel: (role: string) => `${role} model`,
      testModelConnection: 'Test model connection',
      connectionTestTitle: 'Connection test',
      connectionTestNever: 'No connection test has been run yet.',
    },
  },
  'zh-CN': {
    common: {
      close: '关闭',
      language: '语言',
      scene: '场景',
      chapter: '章节',
      asset: '资产',
      book: '书籍',
      activeScene: '当前场景',
      loading: '加载中',
      previewData: '预览数据',
      preloadBridge: '预加载桥接',
    },
    app: {
      narrativeWorkbench: '叙事工作台',
      sceneCockpit: '场景驾驶舱',
      chapterWorkbench: '章节工作台',
      chapterStructure: '章节结构',
      chapterDraft: '章节草稿',
      assetKnowledge: '资产知识',
      sequence: '顺序',
      outliner: '大纲',
      assembly: '装配',
      backlog: '积压计划',
      chapters: '章节',
      assets: '资产',
      chapterNavigatorDescription: '让章节结构、占位场景和未决信号保持对齐。',
      chapterDraftNavigatorDescription: '按章节顺序浏览阅读稿，并让 route.sceneId 继续保持唯一焦点真源。',
      chapterDraftReaderDescription: '按章节顺序连续阅读，并让当前 scene 焦点仍由路由拥有。',
      assetNavigatorDescription: '把类型化的资产身份、mentions 和 relations 收在手边，不离开 workbench。',
      assetNavigatorEmpty: '当工作区种子就绪后，资产会出现在这里。',
      selectedScene: '选中场景',
      chapterReadiness: '章节准备度',
      scope: '范围',
      scenes: '场景',
      sceneNavigatorDescription: '把场景选择放在手边，让当前运行保持在中心位置。',
      queue: '队列',
      queueDescription: '当前场景继续推进时，已采纳状态、版本和底部面板遥测都会保持更新。',
      loadingSceneWorkspace: '正在加载场景工作区。',
      activeChapter: '当前章节',
      modeRailDetails: {
        structure: '目标、角色与约束。',
        orchestrate: '节拍、提案与已采纳状态。',
        draft: '场景正文与修订轮次。',
        knowledge: '阅读类型化资料、mentions 和 relations。',
      },
      assetGroups: {
        characters: '角色',
        locations: '地点',
        organizations: '组织',
        objects: '物件',
        lore: 'Lore',
      },
      assetProfileEyebrow: '类型化资料',
      assetMentions: '提及',
      assetMentionsEmpty: '这个资产暂时还没有跨 scope 的 mention。',
      assetRelations: '关系',
      assetRelationsEmpty: '这个资产暂时还没有其他资产关系。',
      chapterScaffold: {
        currentChapter: '当前章节',
        scenePrefix: '场景',
        sceneCount: '个场景',
        unresolved: '未决',
        sequencePrefix: '顺序',
        beatLinePrefix: '节拍线',
        summary: '摘要',
        assemblyLanes: '装配分栏',
        assemblyDescription: '拖拽排序和结构写入不在本次范围内。这个占位只保留装配视图和路由联动。',
        incoming: '待装配',
        outgoing: '送出',
        currentAssembly: '当前装配',
        currentSeam: '当前接缝',
        selectedSceneBrief: '选中场景简述',
        unresolvedSummary: '未决摘要',
        chapterNotes: '章节备注',
        problems: '问题',
        assemblyHints: '装配提示',
        statusSnapshot: '状态',
        relationshipToAdjacent: '与相邻场景的关系',
        continuityFocus: '连续性焦点',
        statusImpact: '状态影响',
        noIncomingScene: '暂无前置场景。',
        noOutgoingScene: '暂无后续场景。',
        purpose: '目的',
        pov: '视角',
        location: '地点',
        reveal: '揭示',
        conflict: '冲突',
        moveEarlier: '前移',
        moveLater: '后移',
        editStructure: '编辑结构',
        save: '保存',
        cancel: '取消',
        openInOrchestrate: '在 Orchestrate 中打开',
        openInDraft: '在 Draft 中打开',
      },
    },
    launcher: {
      eyebrow: '桌面启动',
      title: '先明确这次 Narrative IDE 会话要如何开始。',
      description:
        'Launcher 会停在 WorkbenchShell 之外，直到项目会话被明确选定。演示、创建真实项目、打开已有项目都会汇入同一条 desktop runtime seam。',
      openDemoProject: '打开演示项目',
      openDemoDescription: '使用保存在桌面 userData 下的独立 Signal Arc 演示会话启动。',
      createRealProject: '创建真实项目',
      createRealDescription: '通过原生目录选择器创建一个新的叙事项目文件夹。',
      openExistingProject: '打开已有项目',
      openExistingDescription: '重新连接已有叙事项目，并且不把 launcher 状态泄漏进 route。',
      workspaceTitle: '进入工作台之前',
      workspaceDescription:
        '这个全局表面先决定会话身份。只有当前项目存在之后，导航栏、检查器、底部面板和主舞台才会挂载。',
      currentStateLabel: '当前状态',
      idleHint: '当前还没有选中的项目。',
      loading: '正在打开项目…',
      actionFailedTitle: 'Launcher 操作失败',
    },
    shell: {
      navigatorTitle: '导航栏',
      inspectorTitle: '检查器',
      inspectorDescription: '上下文、版本和运行态信息保持在手边，但不抢走主流程。',
      inspectorReadyTitle: '检查器已就绪',
      inspectorReadyMessage: '已采纳状态、版本和本地覆盖项都会停在舞台旁边一层。',
      bottomDockTitle: '底部面板',
      layoutControls: '工作台布局控制',
      toggleNavigator: '开关导航栏',
      toggleInspector: '开关检查器',
      toggleBottomDock: '开关底部面板',
      maximizeBottomDock: '最大化底部面板',
      restoreBottomDock: '恢复底部面板',
      resetWorkbenchLayout: '重置工作台布局',
      resizeNavigator: '调整导航栏宽度',
      resizeInspector: '调整检查器宽度',
      resizeBottomDock: '调整底部面板高度',
      openEditors: '打开的编辑器',
      closeEditor: '关闭编辑器',
      closeOtherEditors: '关闭其他编辑器',
      sceneEditor: '场景',
      chapterEditor: '章节',
      assetEditor: '资产',
      bookEditor: '书籍',
      structureLens: '结构',
      orchestrateLens: '编排',
      draftLens: '成稿',
      knowledgeLens: '知识',
      bottomDockDescription: '事件、追踪、一致性、问题与成本都停靠在主流程下方。',
      dockReadyTitle: '底部面板已就绪',
      dockReadyMessage: '追踪、警告和成本都会保持可见，但不会把注意力从主流程上拉走。',
      projectRuntimeStatusLabel: '项目运行时状态',
      projectRuntimeRetry: '重试',
      projectRuntimeRetryLabel: '重试运行时检查',
      projectRuntimeDegradedHint: '即使运行时健康检查异常，工作台也会继续保持可用。',
      projectRuntimeReadOnly: '只读',
      projectRuntimeNoRunEvents: '无运行事件',
      projectRuntimeNoReviewDecisions: '无审阅决策',
      demoFixtureProjectLabel: '演示 Fixture 项目',
      realProjectLabel: '真实项目',
      mockStorybookProjectLabel: 'Mock Storybook',
      modelFixtureLabel: '模型 Fixture',
      modelProviderLabel: '模型提供方',
      keyMissing: '密钥缺失',
      keyConfigured: '密钥已配置',
      testFailedLabel: '测试失败',
      openModelSettings: '模型设置',
      modelSettingsEyebrow: '运行时模型绑定',
      modelSettingsTitle: '模型设置',
      providerProfilesTitle: '提供方配置',
      providerProfilesDescription: '命名的 OpenAI-compatible 提供方、密钥与角色绑定由 shell 通过 desktop bridge 持有。',
      providerProfileIdLabel: '提供方 ID',
      providerProfileLabelLabel: '提供方名称',
      providerProfileBaseUrlLabel: 'Base URL',
      providerProfileIdInput: '提供方 ID 输入',
      providerProfileLabelInput: '提供方名称输入',
      providerProfileBaseUrlInput: '提供方 Base URL 输入',
      providerProfileEditorIdInput: (providerId: string) => `${providerId} 提供方 ID 输入`,
      providerProfileEditorLabelInput: (providerId: string) => `${providerId} 提供方名称输入`,
      providerProfileEditorBaseUrlInput: (providerId: string) => `${providerId} 提供方 Base URL 输入`,
      createProviderProfile: '新建提供方配置',
      saveProviderProfile: (providerLabel: string) => `保存 ${providerLabel} 配置`,
      deleteProviderProfile: (providerLabel: string) => `删除 ${providerLabel} 配置`,
      providerCredentialInputLabel: (providerLabel: string) => `${providerLabel} API 密钥`,
      providerCredentialInput: (providerLabel: string) => `${providerLabel} API 密钥输入`,
      saveProviderCredential: (providerLabel: string) => `保存 ${providerLabel} API 密钥`,
      clearProviderCredential: (providerLabel: string) => `清除 ${providerLabel} API 密钥`,
      modelFixtureOptionLabel: '演示 Fixture',
      modelRoleBindingsTitle: '角色绑定',
      modelRoleBindingsDescription: '模型绑定由 shell 通过 desktop bridge 持有，不进入 route。',
      modelIdLabel: '模型 ID',
      saveBindingLabel: (role: string) => `保存 ${role} 绑定`,
      modelSettingsRoleProviderLabel: (role: string) => `${role}提供方`,
      modelSettingsRoleModelLabel: (role: string) => `${role}模型`,
      testModelConnection: '测试模型连接',
      connectionTestTitle: '连接测试',
      connectionTestNever: '尚未执行连接测试。',
    },
  },
} as const

type Dictionary = (typeof dictionaries)[Locale]

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  dictionary: Dictionary
}

const defaultLocale = resolveAppLocale()

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  dictionary: dictionaries[defaultLocale],
})

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveAppLocale())

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale: (nextLocale) => {
        writeStoredLocale(nextLocale)
        setLocaleState(nextLocale)
      },
      dictionary: dictionaries[locale],
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function getLocaleName(locale: Locale, value: Locale) {
  return localeNames[locale][value]
}

export function getSceneStatusLabel(locale: Locale, status: SceneStatus) {
  return sceneStatusLabels[locale][status]
}

export function getSceneRunStatusLabel(locale: Locale, status: SceneRunStatus) {
  return runStatusLabels[locale][status]
}

export function getProposalStatusLabel(locale: Locale, status: ProposalStatus) {
  return proposalStatusLabels[locale][status]
}

export function getProposalStatusOptionLabel(locale: Locale, status: ProposalStatus) {
  return proposalStatusOptionLabels[locale][status]
}

export function getProposalKindLabel(locale: Locale, kind: ProposalKind) {
  return proposalKindLabels[locale][kind]
}

export function getProposalSeverityLabel(locale: Locale, severity: ProposalSeverity) {
  return proposalSeverityLabels[locale][severity]
}

export function getWorkbenchLensLabel(locale: Locale, lens: WorkbenchLens) {
  return workbenchLensLabels[locale][lens]
}

export function getAssetLensLabel(locale: Locale, lens: AssetLens) {
  return getWorkbenchLensLabel(locale, lens)
}

export function getSceneLensLabel(locale: Locale, lens: WorkbenchLens) {
  return getWorkbenchLensLabel(locale, lens)
}

export function getAssetKnowledgeViewLabel(locale: Locale, view: AssetKnowledgeView) {
  return assetKnowledgeViewLabels[locale][view]
}

export function getAssetKindLabel(
  locale: Locale,
  kind: 'character' | 'location' | 'organization' | 'object' | 'lore',
) {
  if (kind === 'character') {
    return locale === 'zh-CN' ? '角色' : 'Character'
  }

  if (kind === 'location') {
    return locale === 'zh-CN' ? '地点' : 'Location'
  }

  if (kind === 'organization') {
    return locale === 'zh-CN' ? '组织' : 'Organization'
  }

  if (kind === 'object') {
    return locale === 'zh-CN' ? '物件' : 'Object'
  }

  return locale === 'zh-CN' ? 'Lore' : 'Lore'
}

export function getSceneTabLabel(locale: Locale, tab: SceneTab) {
  return sceneTabLabels[locale][tab]
}

function containsCjk(text: string) {
  return /[\u3400-\u9fff]/u.test(text)
}

function containsLatinWord(text: string) {
  return /[A-Za-z]{2,}/.test(text)
}

export function getSceneProseSupportText(locale: Locale, text?: string | null, fallback?: string) {
  if (!text) {
    return text ?? undefined
  }

  const localizedText = sceneProseSupportTextLabels[locale][text]
  if (localizedText) {
    return localizedText
  }

  if (locale === 'zh-CN' && fallback && containsLatinWord(text) && !containsCjk(text)) {
    return fallback
  }

  return text
}

export function getProjectRuntimeSourceLabel(locale: Locale, source: ProjectRuntimeSource) {
  return projectRuntimeSourceLabels[locale][source]
}

export function getProjectRuntimeHealthStatusLabel(locale: Locale, status: ProjectRuntimeHealthStatus) {
  return projectRuntimeHealthStatusLabels[locale][status]
}

export function getModelBindingRoleLabel(locale: Locale, role: DesktopModelBindingRole) {
  const labels: Record<Locale, Record<DesktopModelBindingRole, string>> = {
    en: {
      continuityReviewer: 'Continuity Reviewer',
      planner: 'Planner',
      sceneProseWriter: 'Scene Prose Writer',
      sceneRevision: 'Scene Revision',
      summary: 'Summary',
    },
    'zh-CN': {
      continuityReviewer: '连续性审阅',
      planner: '规划器',
      sceneProseWriter: '场景正文生成',
      sceneRevision: '场景修订',
      summary: '摘要',
    },
  }

  return labels[locale][role]
}

export function getModelBindingProviderLabel(locale: Locale, provider: DesktopModelBindingProvider) {
  const labels: Record<Locale, Record<DesktopModelBindingProvider, string>> = {
    en: {
      fixture: 'Fixture',
      'openai-compatible': 'OpenAI-Compatible',
    },
    'zh-CN': {
      fixture: '演示 Fixture',
      'openai-compatible': 'OpenAI-Compatible',
    },
  }

  return labels[locale][provider]
}

export function getChapterStructureViewLabel(locale: Locale, view: ChapterStructureView) {
  return chapterStructureViewLabels[locale][view]
}

export function getChapterBacklogStatusLabel(
  locale: Locale,
  status: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised',
) {
  return chapterBacklogStatusLabels[locale][status]
}

export function getChapterSceneOrdinalLabel(locale: Locale, index: number) {
  return `${dictionaries[locale].app.chapterScaffold.scenePrefix} ${index}`
}

export function getChapterSceneCountLabel(locale: Locale, count: number) {
  return locale === 'zh-CN'
    ? `${count}${dictionaries[locale].app.chapterScaffold.sceneCount}`
    : `${count} ${dictionaries[locale].app.chapterScaffold.sceneCount}`
}

export function getChapterUnresolvedCountLabel(locale: Locale, count: number) {
  return locale === 'zh-CN'
    ? `${dictionaries[locale].app.chapterScaffold.unresolved} ${count}`
    : `${dictionaries[locale].app.chapterScaffold.unresolved} ${count}`
}

export function getChapterSequenceOrdinalLabel(locale: Locale, index: number) {
  return `${dictionaries[locale].app.chapterScaffold.sequencePrefix} ${index}`
}

export function getChapterBeatLineLabel(locale: Locale, index: number) {
  return `${dictionaries[locale].app.chapterScaffold.beatLinePrefix} ${index}`
}

export function getDockTabLabel(locale: Locale, tab: SceneDockTabId) {
  return dockTabLabels[locale][tab]
}

export function getInspectorTabLabel(locale: Locale, tab: InspectorTabId) {
  return inspectorTabLabels[locale][tab]
}

export function getReadinessLabel(locale: Locale, readiness: 'not-ready' | 'draftable' | 'ready') {
  return readinessLabels[locale][readiness]
}

export function getBeatStatusLabel(locale: Locale, status: 'todo' | 'running' | 'review' | 'accepted' | 'blocked') {
  return beatStatusLabels[locale][status]
}

export function getGenericStatusLabel(locale: Locale, status: string) {
  return genericStatusLabels[locale][status] ?? status
}

export function getSetupFormStatusLabel(
  locale: Locale,
  statusKey: 'synced' | 'unsaved' | 'discarded' | 'saved' | 'saved_and_opened',
) {
  return setupFormStatusLabels[locale][statusKey]
}

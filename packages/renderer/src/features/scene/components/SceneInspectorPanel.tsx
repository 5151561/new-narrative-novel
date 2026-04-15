import { getGenericStatusLabel, getInspectorTabLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import { cn } from '@/lib/cn'

import type { SceneInspectorViewModel } from '../types/scene-view-models'

export type InspectorTabId = 'context' | 'versions' | 'runtime'

const inspectorTabs: Array<{ id: InspectorTabId; label: string }> = [
  { id: 'context', label: 'Context' },
  { id: 'versions', label: 'Versions' },
  { id: 'runtime', label: 'Runtime' },
]

function InspectorTabs({
  activeTab,
  onChange,
}: {
  activeTab: InspectorTabId
  onChange: (tab: InspectorTabId) => void
}) {
  const { locale } = useI18n()

  return (
    <div className="flex flex-wrap gap-2 border-b border-line-soft px-4 py-3">
      {inspectorTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            activeTab === tab.id ? 'bg-surface-2 text-text-main shadow-ringwarm' : 'text-text-muted hover:bg-surface-2',
          )}
        >
          {getInspectorTabLabel(locale, tab.id)}
        </button>
      ))}
    </div>
  )
}

function ContextTab({ context }: { context: SceneInspectorViewModel['context'] }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow={locale === 'zh-CN' ? '已采纳' : 'Accepted'} title={locale === 'zh-CN' ? '已采纳事实' : 'Accepted Facts'}>
        {context.acceptedFacts.length > 0 ? (
          <FactList items={context.acceptedFacts} />
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '还没有已采纳事实' : 'No accepted facts'}
            message={
              locale === 'zh-CN'
                ? '一旦执行评审放行候选内容，已采纳状态就会出现在这里。'
                : 'Accepted state will appear here once execution review clears a candidate.'
            }
          />
        )}
      </SectionCard>
      <SectionCard eyebrow={locale === 'zh-CN' ? '保护' : 'Guard'} title={locale === 'zh-CN' ? '私密信息保护' : 'Private Info Guard'}>
        <div className="space-y-3">
          <p className="text-sm leading-6 text-text-muted">{context.privateInfoGuard.summary}</p>
          {context.privateInfoGuard.items.length > 0 ? (
            <div className="grid gap-2">
              {context.privateInfoGuard.items.map((item) => (
                <div key={item.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-main">{item.label}</p>
                    <Badge tone={item.status === 'guarded' ? 'warn' : item.status === 'watching' ? 'accent' : 'success'}>
                      {getGenericStatusLabel(locale, item.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{item.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={locale === 'zh-CN' ? '没有受保护揭示点' : 'No guarded reveals'}
              message={
                locale === 'zh-CN'
                  ? '当场景需要保护揭示内容时，对应的私密信息约束会出现在这里。'
                  : 'Private-info guardrails will appear here when the scene needs reveal protection.'
              }
            />
          )}
        </div>
      </SectionCard>
      <SectionCard eyebrow={locale === 'zh-CN' ? '边界' : 'Boundaries'} title={locale === 'zh-CN' ? '角色认知边界' : 'Actor Knowledge Boundaries'}>
        {context.actorKnowledgeBoundaries.length > 0 ? (
          <div className="grid gap-3">
            {context.actorKnowledgeBoundaries.map((entry) => (
              <div key={entry.actor.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-main">{entry.actor.name}</p>
                  {entry.actor.role ? <Badge>{entry.actor.role}</Badge> : null}
                </div>
                <ul className="mt-3 space-y-2">
                  {entry.boundaries.map((boundary) => (
                    <li key={boundary.id} className="rounded-md border border-line-soft bg-surface-1 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text-main">{boundary.label}</p>
                        <Badge tone={boundary.status === 'guarded' ? 'warn' : boundary.status === 'known' ? 'success' : 'accent'}>
                          {getGenericStatusLabel(locale, boundary.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-text-muted">{boundary.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '还没有角色边界' : 'No actor boundaries yet'}
            message={
              locale === 'zh-CN'
                ? '一旦设定阶段定义了角色专属的认知边界，这里就会出现对应内容。'
                : 'Actor-specific knowledge boundaries will appear here once setup defines them.'
            }
          />
        )}
      </SectionCard>
      <SectionCard eyebrow={locale === 'zh-CN' ? '本地' : 'Local'} title={locale === 'zh-CN' ? '状态与覆盖项' : 'State And Overrides'}>
        <div className="space-y-3">
          <FactList items={context.localState} />
          {context.overrides.length > 0 ? (
            <div className="grid gap-2">
              {context.overrides.map((override) => (
                <div key={override.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-main">{override.label}</p>
                    <Badge tone={override.status === 'active' ? 'accent' : override.status === 'watching' ? 'warn' : 'neutral'}>
                      {getGenericStatusLabel(locale, override.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{override.summary}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}

function VersionsTab({ versions }: { versions: SceneInspectorViewModel['versions'] }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow={locale === 'zh-CN' ? '检查点' : 'Checkpoints'} title={locale === 'zh-CN' ? '版本检查点' : 'Version Checkpoints'}>
        {versions.checkpoints.length > 0 ? (
          <div className="grid gap-2">
            {versions.checkpoints.map((checkpoint) => (
              <div key={checkpoint.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-main">{checkpoint.label}</p>
                  <Badge tone={checkpoint.status === 'accepted' ? 'success' : checkpoint.status === 'review' ? 'accent' : 'warn'}>
                    {getGenericStatusLabel(locale, checkpoint.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-text-muted">{checkpoint.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '还没有检查点' : 'No checkpoints yet'}
            message={
              locale === 'zh-CN'
                ? '当执行流程产出已采纳状态后，版本检查点就会出现在这里。'
                : 'Version checkpoints will appear once execution produces accepted state.'
            }
          />
        )}
      </SectionCard>
      <SectionCard eyebrow={locale === 'zh-CN' ? '时间线' : 'Timeline'} title={locale === 'zh-CN' ? '采纳时间线' : 'Acceptance Timeline'}>
        {versions.acceptanceTimeline.length > 0 ? (
          <TimelineList items={versions.acceptanceTimeline} />
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '还没有时间线事件' : 'No timeline events'}
            message={locale === 'zh-CN' ? '这个场景的采纳历史目前还是空的。' : 'Acceptance history is still empty for this scene.'}
          />
        )}
      </SectionCard>
      <SectionCard eyebrow={locale === 'zh-CN' ? '补丁候选' : 'Patch Candidates'} title={locale === 'zh-CN' ? '提交摘要' : 'Commit Summary'}>
        {versions.patchCandidates.length > 0 ? (
          <div className="grid gap-2">
            {versions.patchCandidates.map((candidate) => (
              <div key={candidate.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-main">{candidate.label}</p>
                  <Badge tone={candidate.status === 'ready_for_commit' ? 'success' : candidate.status === 'needs_review' ? 'warn' : 'neutral'}>
                    {getGenericStatusLabel(locale, candidate.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-text-muted">{candidate.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '还没有补丁候选' : 'No patch candidates'}
            message={
              locale === 'zh-CN'
                ? '采纳与提交仍然分离，所以只有可提交的摘要才会出现在这里。'
                : 'Accept and Commit remain separated, so commit-ready summaries only appear here.'
            }
          />
        )}
      </SectionCard>
    </div>
  )
}

function RuntimeTab({ runtime }: { runtime: SceneInspectorViewModel['runtime'] }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow={locale === 'zh-CN' ? '画像' : 'Profile'} title={locale === 'zh-CN' ? '运行态画像' : 'Runtime Profile'}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge tone={runtime.runHealth === 'stable' ? 'success' : runtime.runHealth === 'attention' ? 'warn' : 'danger'}>
              {getGenericStatusLabel(locale, runtime.runHealth)}
            </Badge>
            <p className="text-sm font-medium text-text-main">{runtime.profile.label}</p>
          </div>
          <p className="text-sm leading-6 text-text-muted">{runtime.profile.summary}</p>
        </div>
      </SectionCard>
      <SectionCard eyebrow={locale === 'zh-CN' ? '指标' : 'Metrics'} title={locale === 'zh-CN' ? '延迟 / 令牌 / 成本' : 'Latency / Tokens / Cost'}>
        <FactList
          items={[
            { id: 'metric-latency', label: locale === 'zh-CN' ? '延迟' : 'Latency', value: runtime.metrics.latencyLabel },
            { id: 'metric-tokens', label: locale === 'zh-CN' ? '令牌' : 'Tokens', value: runtime.metrics.tokenLabel },
            { id: 'metric-cost', label: locale === 'zh-CN' ? '成本' : 'Cost', value: runtime.metrics.costLabel },
          ]}
        />
      </SectionCard>
      <SectionCard eyebrow={locale === 'zh-CN' ? '失败' : 'Failure'} title={locale === 'zh-CN' ? '最近失败' : 'Latest Failure'}>
        <p className="text-sm leading-6 text-text-muted">
          {runtime.latestFailure ?? (locale === 'zh-CN' ? '这个场景还没有记录到运行失败。' : 'No runtime failures recorded for this scene.')}
        </p>
      </SectionCard>
    </div>
  )
}

interface SceneInspectorPanelProps {
  data: SceneInspectorViewModel
  activeTab: InspectorTabId
  onTabChange: (tab: InspectorTabId) => void
}

export function SceneInspectorPanel({ data, activeTab, onTabChange }: SceneInspectorPanelProps) {
  const { locale } = useI18n()

  return (
    <>
      <PaneHeader
        title={locale === 'zh-CN' ? '上下文 / 版本 / 运行态' : 'Context / Versions / Runtime'}
        description={
          locale === 'zh-CN'
            ? '在这里检查上下文、版本检查点和运行态摘要。原始追踪会继续停留在主舞台下方。'
            : 'Inspect context, version checkpoints, and runtime summaries here. Raw trace stays docked below the main stage.'
        }
      />
      <InspectorTabs activeTab={activeTab} onChange={onTabChange} />
      <div className="min-h-0 overflow-y-auto">
        {activeTab === 'context' ? <ContextTab context={data.context} /> : null}
        {activeTab === 'versions' ? <VersionsTab versions={data.versions} /> : null}
        {activeTab === 'runtime' ? <RuntimeTab runtime={data.runtime} /> : null}
      </div>
    </>
  )
}

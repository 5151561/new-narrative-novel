import type { SceneTab } from '../types/scene-view-models'

import { cn } from '@/lib/cn'

interface SceneTabBarProps {
  activeTab: SceneTab
  onChange: (tab: SceneTab) => void
}

const tabs: Array<{ id: SceneTab; label: string }> = [
  { id: 'setup', label: 'Setup' },
  { id: 'execution', label: 'Execution' },
  { id: 'prose', label: 'Prose' },
]

export function SceneTabBar({ activeTab, onChange }: SceneTabBarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-line-soft px-5 py-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-surface-2 text-text-main shadow-ringwarm'
              : 'text-text-muted hover:bg-surface-2 hover:text-text-main',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

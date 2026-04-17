import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { useI18n } from '@/app/i18n'

import type { AssetProfileViewModel } from '../types/asset-view-models'

interface AssetProfileViewProps {
  profile: AssetProfileViewModel
}

export function AssetProfileView({ profile }: AssetProfileViewProps) {
  const { dictionary } = useI18n()

  return (
    <div className="space-y-4 p-4">
      {profile.sections.map((section) => (
        <SectionCard key={section.id} title={section.title} eyebrow={dictionary.app.assetProfileEyebrow}>
          <FactList
            items={section.facts.map((fact) => ({
              id: fact.id,
              label: fact.label,
              value: fact.value,
            }))}
          />
        </SectionCard>
      ))}
    </div>
  )
}

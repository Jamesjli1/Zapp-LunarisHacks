import { Briefcase } from 'lucide-react'
import type { OrbitData, OrbitProfile } from '../../types/orbit'
import { FeatureCard } from '../FeatureCard'

type Props = {
  data?: OrbitData | null
  activeProfile?: OrbitProfile
}

export function InterestSuggestionsPanel({ data, activeProfile }: Props) {
  const myProfile = data?.myProfile
  const myInterests = new Set((myProfile?.interests ?? []).map((i) => i.toLowerCase()))
  const theirInterests = activeProfile?.interests ?? []
  const sharedInterests = theirInterests.filter((i) => myInterests.has(i.toLowerCase()))

  return (
    <FeatureCard
      title="Interest-based suggestions"
      description="Shared interests between you and this person."
      icon={Briefcase}
      accent="amber"
    >
      {sharedInterests.length > 0 ? (
        <div className="space-y-1.5 text-sm">
          <p className="text-slate-700">
            You both care about{' '}
            <span className="font-semibold">{sharedInterests.join(', ')}</span>.
            Use these as natural ways to reconnect or suggest resources.
          </p>
          {activeProfile?.interests && activeProfile.interests.length > sharedInterests.length && (
            <p className="text-slate-600 text-xs">
              They&apos;re also into: {activeProfile.interests.filter((i) => !sharedInterests.includes(i)).slice(0, 4).join(', ')}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Add interests to your My Profile and to this contact in the Data Center to see shared
          interests here.
        </p>
      )}
    </FeatureCard>
  )
}

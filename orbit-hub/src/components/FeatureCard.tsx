import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type FeatureCardProps = {
  title: string
  description?: string
  icon: LucideIcon
  accent?: 'sky' | 'violet' | 'emerald' | 'amber' | 'rose'
  children?: ReactNode
}

const accentClasses: Record<NonNullable<FeatureCardProps['accent']>, string> = {
  sky: 'from-sky-50 to-slate-50 border-sky-200',
  violet: 'from-violet-50 to-slate-50 border-violet-200',
  emerald: 'from-emerald-50 to-slate-50 border-emerald-200',
  amber: 'from-amber-50 to-slate-50 border-amber-200',
  rose: 'from-rose-50 to-slate-50 border-rose-200',
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  accent = 'sky',
  children,
}: FeatureCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-slate-50 px-4 py-4 sm:px-5 sm:py-5 shadow-sm shadow-slate-200/80 backdrop-blur-sm transition hover:shadow-md hover:-translate-y-0.5 ${
        accentClasses[accent]
      }`}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-orange-200/40 via-amber-100/40 to-transparent blur-2xl" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 ring-1 ring-orange-200">
          <Icon className="h-4 w-4 text-orange-500" />
        </div>
        <div className="flex-1 space-y-1.5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
          )}
          {children && <div className="mt-3 text-sm text-slate-700">{children}</div>}
        </div>
      </div>
    </section>
  )
}


import {
  Bone,
  Brain,
  Eye,
  Hand,
  HeartPulse,
  PersonStanding,
  Salad,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { STATUS_DISPLAY } from '../../components/statusDisplay.ts'
import { healthData } from '../../data/index.ts'
import type { Evaluation } from '../../engine/index.ts'

const ICONS: Record<string, LucideIcon> = {
  head: Brain,
  eyes: Eye,
  heart: HeartPulse,
  core: Salad,
  bones_muscle: Bone,
  skin: Hand,
  whole_body: PersonStanding,
}

/** One chip per body area with its status (colour, icon and word), linking to the area. */
export function OrganStrip({ evaluation }: { evaluation: Evaluation }) {
  return (
    <nav aria-label="Body areas">
      <ul className="flex gap-3 overflow-x-auto pb-1">
        {healthData.regions.map((region) => {
          const status =
            evaluation.regionStatus[
              region.id as keyof typeof evaluation.regionStatus
            ] ?? 'no_data'
          const display = STATUS_DISPLAY[status]
          const Icon = ICONS[region.id] ?? PersonStanding
          return (
            <li key={region.id} className="shrink-0">
              <Link
                to={`/region/${region.id}`}
                aria-label={`${region.label}: ${display.word}`}
                className="glass-panel flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2 transition-colors hover:border-holo-mint"
              >
                <span
                  className={`flex size-10 items-center justify-center rounded-xl border ${display.classes}`}
                >
                  <Icon aria-hidden="true" size={20} />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold">{region.label}</span>
                  <span className="flex items-center gap-1 text-sm text-slate-700">
                    <display.Icon aria-hidden="true" size={14} />
                    {display.word}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

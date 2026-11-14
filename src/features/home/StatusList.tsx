import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '../../components/Card.tsx'
import { StatusBadge } from '../../components/StatusBadge.tsx'
import { STATUS_DISPLAY } from '../../components/statusDisplay.ts'
import { healthData } from '../../data/index.ts'
import type { Evaluation, RegionId } from '../../engine/index.ts'
import { activeAlerts, missingDataText } from '../../lib/alerts.ts'
import { ruleById } from '../../lib/labels.ts'
import { RegionSummary } from './RegionSummary.tsx'

interface StatusListProps {
  evaluation: Evaluation
  selected: RegionId | null
  onSelect: (region: RegionId) => void
}

/** What a region's row says next to its status badge. */
function headline(evaluation: Evaluation, region: RegionId): string {
  const top = activeAlerts(evaluation).find((alert) => alert.region === region)
  if (top) return ruleById(top.ruleId)?.title ?? top.ruleId
  if (evaluation.regionStatus[region] === 'no_data')
    return 'Nothing recorded recently'
  return 'No active alert'
}

/** The accessible status list (section 19.1): one row per region, with word, icon and headline. */
export function StatusList({
  evaluation,
  selected,
  onSelect,
}: StatusListProps) {
  return (
    <Card title="Status by area">
      <ul className="divide-y divide-slate-200">
        {healthData.regions.map((region) => {
          const open = selected === region.id
          const status = evaluation.regionStatus[region.id]
          const text = headline(evaluation, region.id)
          const missing = missingDataText(evaluation, region.id)
          const Chevron = open ? ChevronUp : ChevronDown
          // Spelled out so a screen reader hears "Head: Watch. Sleep has been
          // low…", not the parts run together.
          const name = [
            `${region.label}: ${STATUS_DISPLAY[status].word}`,
            text,
            missing,
          ]
            .filter(Boolean)
            .join('. ')
          return (
            <li key={region.id}>
              <button
                type="button"
                aria-label={name}
                aria-expanded={open}
                onClick={() => onSelect(region.id)}
                className="flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 py-2 text-left"
              >
                <span className="w-28 font-semibold">{region.label}</span>
                <StatusBadge status={status} />
                {/* On a phone the headline gets its own full-width line. */}
                <span className="order-last min-w-0 basis-full sm:order-none sm:basis-0 sm:flex-1">
                  {text}
                  {missing && (
                    <span className="block text-slate-600">{missing}</span>
                  )}
                </span>
                <Chevron
                  aria-hidden="true"
                  size={20}
                  className="ml-auto shrink-0"
                />
              </button>
              {open && (
                <RegionSummary evaluation={evaluation} regionId={region.id} />
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

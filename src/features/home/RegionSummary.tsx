import { Lightbulb } from 'lucide-react'
import { Tag } from '../../components/Tag.tsx'
import { healthData } from '../../data/index.ts'
import {
  lastReadingPerDay,
  type Baseline,
  type Evaluation,
  type RegionId,
} from '../../engine/index.ts'
import { factorWords, insightText } from '../../lib/insights.ts'
import { formatNormal, formatValue, indicatorDef } from '../../lib/labels.ts'
import { useAppStore } from '../../store/index.ts'
import { selectToday } from '../../store/selectors.ts'

function normalText(
  baseline: Baseline | undefined,
  id: Parameters<typeof indicatorDef>[0],
) {
  if (!baseline) return null
  if (baseline.ready)
    return `Your normal: ${formatNormal(baseline.center, indicatorDef(id))}`
  return `Learning your normal (${baseline.n} of ${baseline.needed})`
}

/** Today's habitat feed values. They are simulated, and labeled so. */
function HabitatFeeds() {
  const today = useAppStore(selectToday)
  const context = useAppStore((state) => state.context)
  const sample = context.find((entry) => entry.day === today)
  const dose = context
    .filter((entry) => entry.day <= today)
    .reduce((sum, entry) => sum + entry.radiation_dose, 0)
  return (
    <div className="space-y-1">
      <Tag>Simulated habitat feed</Tag>
      {sample ? (
        <ul>
          <li>
            Cabin CO2, today&apos;s worst 1-hour average:{' '}
            <strong>{sample.cabin_co2.toFixed(1)} mmHg</strong>
          </li>
          <li>
            Radiation dose, mission total:{' '}
            <strong>{dose.toFixed(1)} mSv</strong>
          </li>
          <li>
            Solar particle event:{' '}
            <strong>
              {sample.solar_event ? 'in progress' : 'none reported'}
            </strong>
          </li>
        </ul>
      ) : (
        <p>No habitat sample for today, so these feeds cannot be checked.</p>
      )}
    </div>
  )
}

/**
 * Second opinions whose factors involve this region's readings (section
 * 26.17). An insight never changes the region's status.
 */
function RegionInsights({
  evaluation,
  regionId,
}: {
  evaluation: Evaluation
  regionId: RegionId
}) {
  const notes = evaluation.insights.flatMap((insight) => {
    const factors = insight.factors.filter(
      (factor) => indicatorDef(factor.indicator).region === regionId,
    )
    return factors.length === 0 ? [] : [{ insight, factors }]
  })
  if (notes.length === 0) return null
  return (
    <ul className="space-y-1">
      {notes.map(({ insight, factors }) => (
        <li key={insight.key} className="flex flex-wrap items-center gap-2">
          <Lightbulb aria-hidden="true" size={18} />
          <span className="font-semibold">Insight</span>
          <Tag>Model estimate</Tag>
          <span>
            {insightText(insight).headline}:{' '}
            {factors.map((factor) => factorWords(factor)).join('; ')}. Details
            under &ldquo;Second opinions&rdquo;.
          </span>
        </li>
      ))}
    </ul>
  )
}

/** The readings behind one region's status, shown under its row on Home. */
export function RegionSummary({
  evaluation,
  regionId,
}: {
  evaluation: Evaluation
  regionId: RegionId
}) {
  const crewId = useAppStore((state) => state.mission.activeCrewId)
  const readings = useAppStore((state) => state.readings)
  const indicators = healthData.indicators.filter(
    (def) => def.region === regionId,
  )
  const ownReadings = readings.filter((reading) => reading.crewId === crewId)

  return (
    <div className="space-y-2 pb-3 pl-1">
      {regionId === 'whole_body' && <HabitatFeeds />}
      <RegionInsights evaluation={evaluation} regionId={regionId} />
      {regionId === 'skin' && (
        <p>
          Skin has no measurement of its own. Good here means only that no alert
          is active. It does not show that your skin is healthy.
        </p>
      )}
      {indicators.length > 0 && (
        <ul className="space-y-1">
          {indicators.map((def) => {
            const latest = lastReadingPerDay(ownReadings, def.id).at(-1)
            const normal = normalText(evaluation.baselines[def.id], def.id)
            return (
              <li key={def.id}>
                <span className="font-semibold">{def.label}:</span>{' '}
                {latest
                  ? `${formatValue(latest.value, def)} on day ${latest.day}`
                  : 'not recorded yet'}
                {normal && <span className="text-slate-600"> · {normal}</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

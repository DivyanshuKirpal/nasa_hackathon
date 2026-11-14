import { useState } from 'react'
import { Link } from 'react-router'
import { BodyMap2D } from '../../components/BodyMap2D.tsx'
import { Card } from '../../components/Card.tsx'
import { StatusBadge } from '../../components/StatusBadge.tsx'
import type { RegionId } from '../../engine/index.ts'
import { useAppStore } from '../../store/index.ts'
import { selectEvaluation } from '../../store/selectors.ts'
import { AlertList } from './AlertList.tsx'
import { StatusList } from './StatusList.tsx'
import { TodayCard } from './TodayCard.tsx'

/** Home (ARCHITECTURE.md section 19.1): "how am I doing today?" in five seconds. */
export function HomePage() {
  const evaluation = useAppStore(selectEvaluation)
  const hasReadings = useAppStore((state) =>
    state.readings.some(
      (reading) => reading.crewId === state.mission.activeCrewId,
    ),
  )
  const [selected, setSelected] = useState<RegionId | null>(null)
  const toggle = (region: RegionId) =>
    setSelected((current) => (current === region ? null : region))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">How you are doing today</h1>
        <StatusBadge status={evaluation.overall} />
      </div>

      {!hasReadings && (
        <Card title="Welcome">
          <p>No readings yet for this mission.</p>
          <Link
            to="/check-in"
            className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 font-semibold text-white"
          >
            Start your first check-in
          </Link>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Card title="Your body">
          <BodyMap2D
            regionStatus={evaluation.regionStatus}
            selected={selected}
            onSelect={toggle}
          />
          <p className="mt-3 text-slate-600">
            Choose an area to see its readings.
          </p>
        </Card>
        <div className="space-y-4">
          <AlertList evaluation={evaluation} />
          <TodayCard evaluation={evaluation} />
          <StatusList
            evaluation={evaluation}
            selected={selected}
            onSelect={toggle}
          />
        </div>
      </div>
    </div>
  )
}

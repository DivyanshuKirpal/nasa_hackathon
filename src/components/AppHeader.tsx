import { Orbit } from 'lucide-react'
import { formatTimeOfDay } from '../clock/missionClock.ts'
import { crewLabel } from '../lib/labels.ts'
import { useAppStore } from '../store/index.ts'
import { selectActiveCrew, selectToday } from '../store/selectors.ts'
import { EnvironmentControls } from './EnvironmentControls.tsx'
import { Tag } from './Tag.tsx'

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs tracking-wider text-slate-600 uppercase">
        {label}
      </dt>
      <dd className="font-medium">
        {value ?? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">Not set yet</span>
          </>
        )}
      </dd>
    </div>
  )
}

export function AppHeader() {
  const loaded = useAppStore((state) => state.mission.scenarioId !== null)
  const crew = useAppStore(selectActiveCrew)
  const today = useAppStore(selectToday)
  const nowMs = useAppStore((state) => state.mission.nowMs)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-3 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl border border-slate-300 bg-slate-100">
              <Orbit aria-hidden="true" size={20} className="text-holo-mint" />
            </span>
            <span>
              Crew <span className="holo-text">Health Check</span>
            </span>
          </p>
          <Tag>Simulated data</Tag>
        </div>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <dl className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm">
            <Fact
              label="Crew member"
              value={loaded && crew ? crewLabel(crew) : null}
            />
            <Fact label="Mission day" value={loaded ? `Day ${today}` : null} />
            <Fact
              label="Mission time"
              value={loaded ? formatTimeOfDay(nowMs) : null}
            />
          </dl>
          {loaded && <EnvironmentControls />}
        </div>
      </div>
    </header>
  )
}

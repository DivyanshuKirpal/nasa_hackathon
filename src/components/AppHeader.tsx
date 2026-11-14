import { useAppStore } from '../store/index.ts'
import {
  selectActiveCrew,
  selectEnvironment,
  selectToday,
} from '../store/selectors.ts'
import { Tag } from './Tag.tsx'

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-slate-600">{label}</dt>
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

/** "3 min 0 s" style wording for a one-way delay. */
function delayWords(seconds: number): string {
  if (seconds < 60) return `${seconds} s each way`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return rest === 0
    ? `${minutes} min each way`
    : `${minutes} min ${rest} s each way`
}

export function AppHeader() {
  const loaded = useAppStore((state) => state.mission.scenarioId !== null)
  const crew = useAppStore(selectActiveCrew)
  const today = useAppStore(selectToday)
  const environment = useAppStore(selectEnvironment)
  const link = useAppStore((state) => state.mission.link)

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xl font-semibold">Crew Health Check</p>
          <Tag>Simulated data</Tag>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          <Fact
            label="Crew member"
            value={loaded && crew ? `${crew.name}, ${crew.role}` : null}
          />
          <Fact label="Mission day" value={loaded ? `Day ${today}` : null} />
          <Fact
            label="Environment"
            value={loaded && environment ? environment.label : null}
          />
          <Fact
            label="Earth link"
            value={
              loaded
                ? link.linkUp
                  ? `Link up, ${delayWords(link.oneWayDelaySec)}`
                  : 'Link down'
                : null
            }
          />
        </dl>
      </div>
    </header>
  )
}

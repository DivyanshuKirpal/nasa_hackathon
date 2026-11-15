import { ScanLine } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { BodyMap2D } from '../../components/BodyMap2D.tsx'
import { Card } from '../../components/Card.tsx'
import { StatusBadge } from '../../components/StatusBadge.tsx'
import { Tag } from '../../components/Tag.tsx'
import { bodyModelFor } from '../../data/bodyView.ts'
import { useAppStore } from '../../store/index.ts'
import { selectEvaluation } from '../../store/selectors.ts'
import { HomeTwin } from '../body/HomeTwin.tsx'
import { AiGuidanceCard } from './AiGuidanceCard.tsx'
import { AlertList } from './AlertList.tsx'
import { HistoricalNote } from './HistoricalNote.tsx'
import { OrganStrip } from './OrganStrip.tsx'
import { SecondOpinionsCard } from './SecondOpinionsCard.tsx'
import { StatusList } from './StatusList.tsx'
import { TodayCard } from './TodayCard.tsx'
import { VitalsGrid } from './VitalsGrid.tsx'

/**
 * Home (ARCHITECTURE.md section 19.1): "how am I doing today?" in five
 * seconds, as a dashboard around the 3D digital twin.
 */
export function HomePage() {
  const evaluation = useAppStore(selectEvaluation)
  const crewId = useAppStore((state) => state.mission.activeCrewId)
  const hasReadings = useAppStore((state) =>
    state.readings.some(
      (reading) => reading.crewId === state.mission.activeCrewId,
    ),
  )
  const navigate = useNavigate()
  const model = bodyModelFor(crewId)

  const map2d = (
    <div className="space-y-3">
      <BodyMap2D
        regionStatus={evaluation.regionStatus}
        onSelect={(region) => void navigate(`/region/${region}`)}
      />
      <p className="text-slate-600">
        Choose an area to see its readings and trends.
      </p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-slate-600 uppercase">
            Crew health dashboard
          </p>
          <h1 className="text-3xl font-semibold">
            How you are doing <span className="holo-text">today</span>
          </h1>
        </div>
        <StatusBadge status={evaluation.overall} />
      </div>
      <HistoricalNote />

      {!hasReadings && (
        <Card title="Welcome">
          <p>No readings yet for this mission.</p>
          <Link
            to="/check-in"
            className="holo-button mt-3 inline-flex min-h-11 items-center rounded-xl px-4 font-semibold"
          >
            Start your first check-in
          </Link>
        </Card>
      )}

      <OrganStrip evaluation={evaluation} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="twin-title"
          className="glass-panel space-y-3 rounded-3xl p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="twin-title"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <ScanLine
                aria-hidden="true"
                size={20}
                className="text-holo-mint"
              />
              Your body
            </h2>
            <div className="flex flex-wrap gap-2">
              {model?.status === 'placeholder' && <Tag>Placeholder model</Tag>}
              {model?.aiAssisted && <Tag>AI-assisted model</Tag>}
            </div>
          </div>
          <HomeTwin fallback={map2d} />
          <p className="text-sm text-slate-600">
            Colours on the body follow today&apos;s area statuses; the legend
            names each one. Turn on a system to look inside.{' '}
            <Link to="/body" className="underline underline-offset-4">
              Soreness and suit sensors
            </Link>
          </p>
        </section>
        <div className="space-y-6">
          <AlertList evaluation={evaluation} />
          <VitalsGrid evaluation={evaluation} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AiGuidanceCard />
        <div className="space-y-6">
          <SecondOpinionsCard evaluation={evaluation} />
          <TodayCard evaluation={evaluation} />
        </div>
      </div>
      <StatusList evaluation={evaluation} />
    </div>
  )
}

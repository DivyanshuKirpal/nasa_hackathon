import {
  Activity,
  Droplet,
  Dumbbell,
  Eye,
  Gauge,
  HeartPulse,
  Moon,
  Smile,
  Thermometer,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { StatusBadge } from '../../components/StatusBadge.tsx'
import type { Evaluation } from '../../engine/index.ts'
import { latestReadings, type LatestReading } from '../../lib/guidance.ts'
import { useAppStore } from '../../store/index.ts'

const ICONS: Record<string, LucideIcon> = {
  systolic_bp: Gauge,
  heart_rate: HeartPulse,
  body_temp: Thermometer,
  blood_glucose: Droplet,
  sleep_hours: Moon,
  mood: Smile,
  reaction_time: Timer,
  exercise_minutes: Dumbbell,
  near_vision: Eye,
}

function format(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** A tiny trend line of the last readings; decoration next to the number. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = 26 - ((value - min) / span) * 22
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="h-8 w-24"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-holo-mint)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

interface Tile {
  key: string
  label: string
  value: string
  unit: string
  region: string
  history: number[]
  usual: string | null
}

function toTiles(latest: LatestReading[]): Tile[] {
  const byId = new Map(latest.map((reading) => [reading.id, reading]))
  const lower = byId.get('diastolic_bp')
  return latest.flatMap((reading): Tile[] => {
    if (reading.id === 'diastolic_bp') return []
    const usual =
      reading.usualCenter !== null
        ? `Your usual ≈ ${format(reading.usualCenter)}`
        : null
    if (reading.id === 'systolic_bp' && lower) {
      return [
        {
          key: reading.id,
          label: 'Blood pressure',
          value: `${format(reading.latest)}/${format(lower.latest)}`,
          unit: reading.unit,
          region: reading.region,
          history: reading.history,
          usual,
        },
      ]
    }
    return [
      {
        key: reading.id,
        label: reading.name,
        value: format(reading.latest),
        unit: reading.unit,
        region: reading.region,
        history: reading.history,
        usual,
      },
    ]
  })
}

/** Latest vital signs with a small trend and the area status they feed. */
export function VitalsGrid({ evaluation }: { evaluation: Evaluation }) {
  const readings = useAppStore((state) => state.readings)
  const crewId = useAppStore((state) => state.mission.activeCrewId)
  const nowMs = useAppStore((state) => state.mission.nowMs)
  const tiles = toTiles(latestReadings(readings, crewId, nowMs, evaluation))

  if (tiles.length === 0) return null
  return (
    <section aria-labelledby="vitals-title" className="space-y-3">
      <h2
        id="vitals-title"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <Activity aria-hidden="true" size={20} className="text-holo-mint" />
        Latest vitals
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => {
          const Icon = ICONS[tile.key] ?? Activity
          const status =
            evaluation.regionStatus[
              tile.region as keyof typeof evaluation.regionStatus
            ] ?? 'no_data'
          return (
            <li key={tile.key}>
              <Link
                to={`/region/${tile.region}`}
                className="glass-panel flex h-full flex-col gap-2 rounded-2xl p-4 transition-colors hover:border-holo-mint"
              >
                <span className="flex items-center justify-between gap-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <Icon
                      aria-hidden="true"
                      size={18}
                      className="text-holo-aqua"
                    />
                    {tile.label}
                  </span>
                  <StatusBadge status={status} />
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span>
                    <span className="font-display text-3xl font-semibold text-slate-950">
                      {tile.value}
                    </span>{' '}
                    <span className="text-slate-600">{tile.unit}</span>
                  </span>
                  <Sparkline values={tile.history} />
                </span>
                {tile.usual && (
                  <span className="text-sm text-slate-600">{tile.usual}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
      <p className="text-sm text-slate-600">
        The badge is the status of the body area each reading belongs to.
        Simulated data.
      </p>
    </section>
  )
}

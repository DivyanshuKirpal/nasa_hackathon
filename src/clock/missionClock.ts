import { MS_PER_DAY, missionDayOf } from '../engine/index.ts'

// Mission time is simulated: milliseconds since mission start, held in the
// store (ARCHITECTURE.md section 16). This is the only module allowed to read
// the real clock, and until the ticker arrives in milestone M6 it does not:
// mission time stands still at the moment a scenario sets.

const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000

export const missionDay = missionDayOf

/** 09:00 on a mission day: the moment `loadScenario` sets (section 21). */
export function scenarioStartMs(day: number): number {
  return (day - 1) * MS_PER_DAY + 9 * HOUR_MS
}

/** "09:00" for a mission time. */
export function formatTimeOfDay(ms: number): string {
  const intoDay = ms % MS_PER_DAY
  const hours = Math.floor(intoDay / HOUR_MS)
  const minutes = Math.floor((intoDay % HOUR_MS) / MINUTE_MS)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

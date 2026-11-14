import { MS_PER_DAY, missionDayOf } from '../engine/index.ts'

// Mission time is simulated: milliseconds since mission start, held in the
// store (ARCHITECTURE.md section 16). This is the only module allowed to read
// the real clock, and until the ticker arrives in milestone M6 it does not:
// mission time stands still at the moment a scenario sets.

const HOUR_MS = 3_600_000

export const missionDay = missionDayOf

/** 09:00 on a mission day: the moment `loadScenario` sets (section 21). */
export function scenarioStartMs(day: number): number {
  return (day - 1) * MS_PER_DAY + 9 * HOUR_MS
}

export { formatTimeOfDay } from '../engine/index.ts'

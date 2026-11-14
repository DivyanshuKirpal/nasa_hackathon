import type { MissionDay, MissionMs } from './types.ts'

export const MS_PER_DAY = 86_400_000

/** Mission day 1 starts at mission time 0 (ARCHITECTURE.md section 16). */
export function missionDayOf(ms: MissionMs): MissionDay {
  return Math.floor(ms / MS_PER_DAY) + 1
}

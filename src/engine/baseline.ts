import { median, scaledMad } from './stats.ts'
import type {
  Baseline,
  IndicatorDef,
  IndicatorId,
  MissionDay,
  MissionMs,
  Reading,
} from './types.ts'

/**
 * Baseline window settings (ARCHITECTURE.md section 10), kept in one place.
 * The most recent days are left out so a developing problem does not become
 * its own normal.
 */
export const BASELINE_WINDOWS = {
  daily: { windowDays: 28, excludeRecentDays: 3, minReadings: 7 },
  weekly: { windowDays: 84, excludeRecentDays: 14, minReadings: 3 },
} as const

export function baselineWindowFor(cadenceDays: number) {
  return cadenceDays >= 7 ? BASELINE_WINDOWS.weekly : BASELINE_WINDOWS.daily
}

/** One value per mission day for one indicator. */
export interface DailyValue {
  day: MissionDay
  atMs: MissionMs
  value: number
}

/** With several readings on one day, the last one of the day counts (section 10). */
export function lastReadingPerDay(
  readings: readonly Reading[],
  indicator: IndicatorId,
): DailyValue[] {
  const byDay = new Map<MissionDay, DailyValue>()
  for (const reading of readings) {
    if (reading.indicator !== indicator) continue
    const current = byDay.get(reading.day)
    if (!current || reading.atMs >= current.atMs) {
      byDay.set(reading.day, {
        day: reading.day,
        atMs: reading.atMs,
        value: reading.value,
      })
    }
  }
  return [...byDay.values()].sort((a, b) => a.day - b.day)
}

/** Median and floored, scaled MAD of the readings in the rolling window. */
export function computeBaseline(
  values: readonly DailyValue[],
  def: IndicatorDef,
  today: MissionDay,
): Baseline {
  const settings = baselineWindowFor(def.cadenceDays)
  const fromDay = today - settings.windowDays - settings.excludeRecentDays + 1
  const toDay = today - settings.excludeRecentDays
  const inWindow = values
    .filter((entry) => entry.day >= fromDay && entry.day <= toDay)
    .map((entry) => entry.value)

  if (inWindow.length < settings.minReadings) {
    return { ready: false, n: inWindow.length, needed: settings.minReadings }
  }
  return {
    ready: true,
    n: inWindow.length,
    center: median(inWindow),
    spread: Math.max(scaledMad(inWindow), def.minSpread),
    fromDay,
    toDay,
  }
}

import {
  computeBaseline,
  lastReadingPerDay,
  latestReading,
  type DailyValue,
  type LatestValue,
} from './baseline.ts'
import type { ConditionContext } from './conditions.ts'
import { evaluateRules } from './rules.ts'
import {
  missingContextFeeds,
  overallStatus,
  overdueIndicators,
  regionGaps,
  regionStatuses,
} from './status.ts'
import { missionDayOf } from './time.ts'
import type {
  Baseline,
  Evaluation,
  EvaluationInput,
  IndicatorDef,
  IndicatorId,
} from './types.ts'

export * from './types.ts'
export { triage } from './triage.ts'
export { MS_PER_DAY, missionDayOf } from './time.ts'
export {
  BASELINE_WINDOWS,
  isRecheck,
  lastReadingPerDay,
  latestReading,
} from './baseline.ts'
export { CONTEXT_FEED_REGION, DAILY_CONTEXT_FEEDS } from './status.ts'
export { findDataProblems, type HealthData } from './validateData.ts'

/**
 * The engine's public entry point (section 11.4): baselines, rules, triage and
 * status for one crew member at mission time `nowMs`. Pure: the same input
 * always gives the same evaluation.
 */
export function evaluate(input: EvaluationInput): Evaluation {
  const today = missionDayOf(input.nowMs)
  const readings = input.readings.filter(
    (reading) => reading.crewId === input.crewId && reading.atMs <= input.nowMs,
  )
  const symptoms = input.symptoms.filter(
    (report) => report.crewId === input.crewId && report.atMs <= input.nowMs,
  )
  const context = input.context.filter((sample) => sample.day <= today)

  const indicators = new Map<IndicatorId, IndicatorDef>()
  const dailyValues = new Map<IndicatorId, DailyValue[]>()
  const latest = new Map<IndicatorId, LatestValue>()
  const baselines: Partial<Record<IndicatorId, Baseline>> = {}
  for (const def of input.indicators) {
    const values = lastReadingPerDay(readings, def.id)
    indicators.set(def.id, def)
    dailyValues.set(def.id, values)
    const newest = latestReading(readings, def.id)
    if (newest) latest.set(def.id, newest)
    baselines[def.id] = computeBaseline(values, def, today)
  }

  const ctx: ConditionContext = {
    today,
    indicators,
    dailyValues,
    latest,
    baselines,
    symptoms,
    context,
    modelThresholds: { 'sep-risk': input.models.sepRisk?.threshold ?? null },
  }

  const alerts = evaluateRules(input.rules, ctx, input.link, input.crewId)
  const overdue = overdueIndicators(input.indicators, dailyValues, today)
  const missingFeeds = missingContextFeeds(context, today)
  const gaps = regionGaps(input.indicators, overdue, missingFeeds)
  const regionStatus = regionStatuses(alerts, input.indicators, gaps)

  return {
    baselines,
    alerts,
    regionStatus,
    overall: overallStatus(regionStatus),
    overdue,
    missingFeeds,
    regionGaps: gaps,
  }
}

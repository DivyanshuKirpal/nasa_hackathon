import {
  computeBaseline,
  lastReadingPerDay,
  latestReading,
  type LatestValue,
} from '../baseline.ts'
import type { ConditionContext } from '../conditions.ts'
import { MS_PER_DAY } from '../time.ts'
import type {
  Baseline,
  ContextSample,
  IndicatorDef,
  IndicatorId,
  LinkState,
  Reading,
  Rule,
  SymptomReport,
} from '../types.ts'

// Test fixtures only. The numbers here exercise the logic; they are not
// health thresholds and never reach the app.

export const HOUR_MS = 3_600_000

function indicator(
  id: IndicatorId,
  region: IndicatorDef['region'],
  fields: Pick<
    IndicatorDef,
    'label' | 'unit' | 'step' | 'minSpread' | 'cadenceDays'
  >,
): IndicatorDef {
  return {
    id,
    region,
    input: 'number',
    inputMin: 0,
    inputMax: 1000,
    howToMeasure: 'Fixture.',
    whyInSpace: 'Fixture.',
    sourceIds: ['fixture-source'],
    ...fields,
  }
}

export const SLEEP = indicator('sleep_hours', 'head', {
  label: 'Sleep last night',
  unit: 'h',
  step: 0.25,
  minSpread: 0.5,
  cadenceDays: 1,
})
export const TEMP = indicator('body_temp', 'core', {
  label: 'Body temperature',
  unit: '°C',
  step: 0.1,
  minSpread: 0.2,
  cadenceDays: 1,
})
export const GLUCOSE = indicator('blood_glucose', 'core', {
  label: 'Fasting blood sugar',
  unit: 'mg/dL',
  step: 1,
  minSpread: 5,
  cadenceDays: 1,
})
export const NEAR_VISION = indicator('near_vision', 'eyes', {
  label: 'Near-vision check',
  unit: 'lines',
  step: 1,
  minSpread: 0.5,
  cadenceDays: 7,
})

export const ALL_FIXTURE_INDICATORS = [SLEEP, TEMP, GLUCOSE, NEAR_VISION]

/** A reading at `hour` o'clock on mission `day`. */
export function reading(
  indicatorId: IndicatorId,
  day: number,
  value: number,
  options: { crewId?: string; hour?: number; recheck?: boolean } = {},
): Reading {
  return {
    crewId: options.crewId ?? 'c1',
    indicator: indicatorId,
    value,
    day,
    atMs: (day - 1) * MS_PER_DAY + (options.hour ?? 8) * HOUR_MS,
    origin: 'seed',
    ...(options.recheck ? { purpose: 'recheck' as const } : {}),
  }
}

/** One reading a day from `fromDay` to `toDay` with the given values in order. */
export function series(
  indicatorId: IndicatorId,
  fromDay: number,
  values: readonly number[],
): Reading[] {
  return values.map((value, index) =>
    reading(indicatorId, fromDay + index, value),
  )
}

export function sample(
  day: number,
  fields: Partial<ContextSample> = {},
): ContextSample {
  return {
    day,
    cabin_co2: 2,
    radiation_dose: 0.5,
    solar_event: false,
    ...fields,
  }
}

export function symptom(
  symptomId: SymptomReport['symptom'],
  day: number,
): SymptomReport {
  return {
    crewId: 'c1',
    symptom: symptomId,
    day,
    atMs: (day - 1) * MS_PER_DAY + 8 * HOUR_MS,
  }
}

/** 09:00 on a mission day, the moment golden tests evaluate at. */
export function nineAm(day: number): number {
  return (day - 1) * MS_PER_DAY + 9 * HOUR_MS
}

export const STATION_LINK: LinkState = {
  oneWayDelaySec: 0,
  linkUp: true,
  groundHandlingMin: 5,
}

/** Builds the condition context the engine would build for these inputs. */
export function makeContext(
  today: number,
  input: {
    readings?: readonly Reading[]
    symptoms?: readonly SymptomReport[]
    context?: readonly ContextSample[]
    sepRiskThreshold?: number | null
    indicators?: readonly IndicatorDef[]
  } = {},
): ConditionContext {
  const defs = input.indicators ?? ALL_FIXTURE_INDICATORS
  const indicators = new Map(defs.map((def) => [def.id, def]))
  const dailyValues = new Map(
    defs.map((def) => [
      def.id,
      lastReadingPerDay(input.readings ?? [], def.id),
    ]),
  )
  const latest = new Map<IndicatorId, LatestValue>()
  const baselines: Partial<Record<IndicatorId, Baseline>> = {}
  for (const def of defs) {
    const newest = latestReading(input.readings ?? [], def.id)
    if (newest) latest.set(def.id, newest)
    baselines[def.id] = computeBaseline(
      dailyValues.get(def.id) ?? [],
      def,
      today,
    )
  }
  return {
    today,
    indicators,
    dailyValues,
    latest,
    baselines,
    symptoms: input.symptoms ?? [],
    context: input.context ?? [],
    modelThresholds: { 'sep-risk': input.sepRiskThreshold ?? null },
  }
}

/** A rule with only the fields a test cares about filled in. */
export function testRule(
  fields: Pick<Rule, 'id' | 'when'> & Partial<Rule>,
): Rule {
  return {
    title: `Fixture ${fields.id}`,
    region: 'head',
    severity: 'watch',
    timeToActMin: 60,
    needsGround: false,
    privateToCrew: false,
    explain: { what: 'Fixture.', whySpace: 'Fixture.' },
    protocolId: 'P-FIXTURE',
    supersedes: [],
    sourceIds: [],
    basis: 'illustrative',
    ...fields,
  }
}

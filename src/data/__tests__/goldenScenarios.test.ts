import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MS_PER_DAY, evaluate } from '../../engine/index.ts'
import type { ScenarioFile } from '../../engine/index.ts'
import {
  scenarioFileSchema,
  scenarioIndexSchema,
  spaceWeatherFileSchema,
} from '../../engine/schemas.ts'
import { healthData } from '../index.ts'

// Golden scenario tests (ARCHITECTURE.md section 27): every generated file in
// public/seed must trigger exactly its expectedAlerts at 09:00 on its mission
// day, the moment loadScenario sets. These back every "the app detects X" claim.

const SEED_DIR = join(process.cwd(), 'public', 'seed')
const NINE_AM_MS = 9 * 3_600_000

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

const scenarioFiles = readdirSync(SEED_DIR)
  .filter((name) => name.endsWith('.json') && name !== 'index.json')
  .sort()

function load(name: string): ScenarioFile {
  return scenarioFileSchema.parse(readJson(join(SEED_DIR, name)))
}

/** Non-superseded alerts for every crew member, as "crew:rule", sorted. */
function activeAlerts(scenario: ScenarioFile): string[] {
  const environment = healthData.environments.find(
    (env) => env.id === scenario.environmentId,
  )
  if (!environment)
    throw new Error(`unknown environment ${scenario.environmentId}`)
  return scenario.crew
    .flatMap((member) =>
      evaluate({
        nowMs: (scenario.missionDay - 1) * MS_PER_DAY + NINE_AM_MS,
        crewId: member.id,
        readings: scenario.readings,
        symptoms: scenario.symptoms,
        context: scenario.context,
        link: {
          oneWayDelaySec: environment.oneWayDelaySecMin,
          linkUp: true,
          groundHandlingMin: 5,
        },
        indicators: healthData.indicators,
        rules: healthData.rules,
        spaceWeather: scenario.spaceWeather,
        models: { sepRisk: null },
      })
        .alerts.filter((alert) => alert.supersededBy === null)
        .map((alert) => `${alert.crewId}:${alert.ruleId}`),
    )
    .sort()
}

describe('generated scenario files', () => {
  it('include the three P0 scenarios', () => {
    expect(scenarioFiles).toEqual(
      expect.arrayContaining([
        'baseline-healthy.json',
        'sleep-debt.json',
        'solar-storm.json',
      ]),
    )
  })

  it.each(scenarioFiles)(
    '%s parses, is marked simulated and uses fictional names',
    (name) => {
      const scenario = load(name)
      expect(scenario.simulated).toBe(true)
      expect(`${scenario.scenarioId}.json`).toBe(name)
      for (const member of scenario.crew) {
        expect(member.name).toMatch(/^Crew member [A-Z]$/)
      }
    },
  )

  it.each(scenarioFiles)('%s gives exactly its expected alerts', (name) => {
    const scenario = load(name)
    const expected = scenario.expectedAlerts
      .map((alert) => `${alert.crewId}:${alert.ruleId}`)
      .sort()
    expect(activeAlerts(scenario)).toEqual(expected)
  })

  it('every reading is within its indicator input range', () => {
    const ranges = new Map(
      healthData.indicators.map((def) => [
        def.id,
        [def.inputMin, def.inputMax],
      ]),
    )
    for (const name of scenarioFiles) {
      for (const reading of load(name).readings) {
        const [min, max] = ranges.get(reading.indicator) ?? [0, 0]
        expect(reading.value).toBeGreaterThanOrEqual(min ?? 0)
        expect(reading.value).toBeLessThanOrEqual(max ?? 0)
      }
    }
  })

  it('leave today free for the check-in, except where the story needs a reading', () => {
    const sleepDebt = load('sleep-debt.json')
    const today = sleepDebt.readings.filter(
      (reading) => reading.day === sleepDebt.missionDay,
    )
    expect(today).toEqual([])
    expect(sleepDebt.context.at(-1)?.day).toBe(sleepDebt.missionDay)
  })
})

describe('scenario index and space weather file', () => {
  it('index.json lists every scenario file and the default scenario', () => {
    const index = scenarioIndexSchema.parse(
      readJson(join(SEED_DIR, 'index.json')),
    )
    expect(
      index.scenarios.map((entry) => `${entry.scenarioId}.json`).sort(),
    ).toEqual(scenarioFiles)
    expect(index.defaultScenarioId).toBe('sleep-debt')
    for (const entry of index.scenarios) {
      const scenario = load(`${entry.scenarioId}.json`)
      expect(entry).toEqual({
        scenarioId: scenario.scenarioId,
        title: scenario.title,
        environmentId: scenario.environmentId,
        missionDay: scenario.missionDay,
      })
    }
  })

  it('solar-storm starts at the station', () => {
    expect(load('solar-storm.json').environmentId).toBe('leo_station')
  })

  it('space-weather.json lists only real events, and says so when there are none', () => {
    const file = spaceWeatherFileSchema.parse(
      readJson(join(process.cwd(), 'public', 'data', 'space-weather.json')),
    )
    const withRealEvent = scenarioFiles
      .map(load)
      .filter((scenario) => scenario.basedOn !== null)
      .map((scenario) => scenario.scenarioId)
      .sort()
    expect(file.events.flatMap((event) => event.usedIn).sort()).toEqual(
      withRealEvent,
    )
    if (file.events.length === 0) {
      expect(file.note).toContain('No real DONKI event')
    }
  })
})

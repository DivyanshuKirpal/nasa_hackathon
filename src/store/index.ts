import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scenarioStartMs } from '../clock/missionClock.ts'
import { healthData, linkDefaults } from '../data/index.ts'
import {
  missionDayOf,
  type EnvironmentId,
  type IndicatorId,
  type ScenarioFile,
  type SymptomId,
} from '../engine/index.ts'
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  readPersisted,
  type PersistedState,
} from './persistence.ts'

// The app's state (ARCHITECTURE.md section 21). Components read through
// selectors and write through these named actions. The engine never writes here.

export type ActionResult = { ok: true } | { ok: false; message: string }

export interface AppActions {
  loadScenario(scenario: ScenarioFile): void
  /** Adds a reading for the active crew member at the current mission time. */
  addReading(
    indicator: IndicatorId,
    value: number,
    purpose?: 'routine' | 'recheck',
  ): ActionResult
  /** Today's symptom checklist; an empty list means "None today". */
  reportSymptoms(symptoms: readonly SymptomId[]): void
  setEnvironment(environmentId: EnvironmentId): void
  setDelay(oneWayDelaySec: number): void
}

export type AppState = PersistedState & AppActions

function environmentById(id: EnvironmentId) {
  const environment = healthData.environments.find((entry) => entry.id === id)
  if (!environment) throw new Error(`environments.json has no ${id}`)
  return environment
}

/** Before any scenario is loaded. `scenarioId: null` tells the app to load the default one. */
export function emptyState(): PersistedState {
  return {
    mission: {
      nowMs: 0,
      speed: 0,
      environmentId: 'leo_station',
      link: {
        oneWayDelaySec: 0,
        linkUp: true,
        groundHandlingMin: linkDefaults.groundHandlingMin,
      },
      activeCrewId: 'c1',
      scenarioId: null,
    },
    crew: [],
    readings: [],
    symptoms: [],
    noSymptomDays: {},
    context: [],
    spaceWeather: [],
    alertState: {},
    outbox: [],
    prefs: {},
  }
}

function pickPersisted(state: AppState): PersistedState {
  return {
    mission: state.mission,
    crew: state.crew,
    readings: state.readings,
    symptoms: state.symptoms,
    noSymptomDays: state.noSymptomDays,
    context: state.context,
    spaceWeather: state.spaceWeather,
    alertState: state.alertState,
    outbox: state.outbox,
    prefs: state.prefs,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyState(),

      loadScenario(scenario) {
        const environment = environmentById(scenario.environmentId)
        set({
          mission: {
            nowMs: scenarioStartMs(scenario.missionDay),
            speed: 0,
            environmentId: scenario.environmentId,
            // The station and the Moon have one fixed delay; a Mars environment
            // starts at its nearest distance (section 14).
            link: {
              oneWayDelaySec: environment.oneWayDelaySecMin,
              linkUp: true,
              groundHandlingMin: linkDefaults.groundHandlingMin,
            },
            activeCrewId: scenario.crew[0]?.id ?? 'c1',
            scenarioId: scenario.scenarioId,
          },
          crew: scenario.crew,
          readings: scenario.readings,
          symptoms: scenario.symptoms,
          noSymptomDays: {},
          context: scenario.context,
          spaceWeather: scenario.spaceWeather,
          alertState: {},
          outbox: [],
        })
      },

      addReading(indicator, value, purpose = 'routine') {
        const def = healthData.indicators.find(
          (entry) => entry.id === indicator,
        )
        if (!def) return { ok: false, message: 'Unknown measurement.' }
        if (!Number.isFinite(value)) {
          return { ok: false, message: 'Enter a number.' }
        }
        // Out-of-range values are refused, never corrected (section 19.2).
        if (value < def.inputMin || value > def.inputMax) {
          const unit = def.unit === '' ? '' : ` ${def.unit}`
          return {
            ok: false,
            message: `Enter a value between ${def.inputMin} and ${def.inputMax}${unit}.`,
          }
        }
        const { mission, readings } = get()
        set({
          readings: [
            ...readings,
            {
              crewId: mission.activeCrewId,
              indicator,
              value,
              day: missionDayOf(mission.nowMs),
              atMs: mission.nowMs,
              origin: 'manual',
              ...(purpose === 'recheck' ? { purpose: 'recheck' as const } : {}),
            },
          ],
        })
        return { ok: true }
      },

      reportSymptoms(reported) {
        const { mission, symptoms, noSymptomDays } = get()
        const crewId = mission.activeCrewId
        const today = missionDayOf(mission.nowMs)
        const others = symptoms.filter(
          (report) => !(report.crewId === crewId && report.day === today),
        )
        const todays = reported.map((symptom) => ({
          crewId,
          symptom,
          day: today,
          atMs: mission.nowMs,
        }))
        const noneDays = (noSymptomDays[crewId] ?? []).filter(
          (day) => day !== today,
        )
        set({
          symptoms: [...others, ...todays],
          noSymptomDays: {
            ...noSymptomDays,
            [crewId]: reported.length === 0 ? [...noneDays, today] : noneDays,
          },
        })
      },

      setEnvironment(environmentId) {
        const environment = environmentById(environmentId)
        const { mission } = get()
        set({
          mission: {
            ...mission,
            environmentId,
            link: {
              ...mission.link,
              oneWayDelaySec: environment.oneWayDelaySecMin,
            },
          },
        })
      },

      setDelay(oneWayDelaySec) {
        const { mission } = get()
        const environment = environmentById(mission.environmentId)
        const clamped = Math.min(
          environment.oneWayDelaySecMax,
          Math.max(environment.oneWayDelaySecMin, oneWayDelaySec),
        )
        set({
          mission: {
            ...mission,
            link: { ...mission.link, oneWayDelaySec: clamped },
          },
        })
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: pickPersisted,
      // Version 1 is the first stored shape; later versions migrate here.
      migrate: (stored) => stored,
      merge: (stored, current) => {
        const valid = readPersisted(stored)
        return valid ? { ...current, ...valid } : current
      },
    },
  ),
)

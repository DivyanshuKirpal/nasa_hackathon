import { z } from 'zod'
import {
  contextSampleSchema,
  crewMemberSchema,
  environmentIdSchema,
  flareObservationSchema,
  groundMessageSchema,
  linkStateSchema,
  readingSchema,
  symptomReportSchema,
} from '../engine/schemas.ts'

// What is written to localStorage (ARCHITECTURE.md section 21). Nothing
// derived is stored: alerts, baselines and statuses are recomputed.

export const STORAGE_KEY = 'chc-state'
export const STORAGE_VERSION = 1

const alertInteractionSchema = z.strictObject({
  firstSeenDay: z.number().int().positive(),
  lastSeenDay: z.number().int().positive(),
  acknowledgedAtMs: z.number().nonnegative().nullable(),
  stepsDone: z.array(z.number().int().nonnegative()),
})

export const persistedStateSchema = z.strictObject({
  mission: z.strictObject({
    nowMs: z.number().nonnegative(),
    speed: z.union([z.literal(0), z.literal(1), z.literal(60), z.literal(600)]),
    environmentId: environmentIdSchema,
    link: linkStateSchema,
    activeCrewId: z.string().min(1),
    scenarioId: z.string().min(1).nullable(),
  }),
  crew: z.array(crewMemberSchema),
  readings: z.array(readingSchema),
  symptoms: z.array(symptomReportSchema),
  /** Days on which a crew member answered "None today", by crew id. */
  noSymptomDays: z.record(z.string(), z.array(z.number().int().positive())),
  context: z.array(contextSampleSchema),
  spaceWeather: z.array(flareObservationSchema),
  alertState: z.record(z.string(), alertInteractionSchema),
  outbox: z.array(groundMessageSchema),
  prefs: z.strictObject({}),
})

export type PersistedState = z.infer<typeof persistedStateSchema>
export type AlertInteraction = z.infer<typeof alertInteractionSchema>

/**
 * Bad or outdated storage is discarded, never trusted: the app then starts
 * empty and loads the default scenario (section 21).
 */
export function readPersisted(stored: unknown): PersistedState | null {
  const result = persistedStateSchema.safeParse(stored)
  return result.success ? result.data : null
}

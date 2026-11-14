import { z } from 'zod'

// Zod schemas for every health data file (ARCHITECTURE.md sections 7 and 11)
// and for the runtime records the engine receives. Types are derived from
// these schemas in types.ts, so the two cannot drift apart.

export const INDICATOR_IDS = [
  'systolic_bp',
  'diastolic_bp',
  'heart_rate',
  'body_temp',
  'blood_glucose',
  'sleep_hours',
  'mood',
  'reaction_time',
  'exercise_minutes',
  'near_vision',
] as const

export const SYMPTOM_IDS = [
  'headache',
  'blurred_vision',
  'nausea',
  'congestion',
  'rash',
  'dizziness',
  'back_pain',
] as const

export const CONTEXT_FEED_IDS = [
  'cabin_co2',
  'radiation_cumulative',
  'solar_event',
  'sep_risk',
] as const

export const REGION_IDS = [
  'head',
  'eyes',
  'heart',
  'core',
  'bones_muscle',
  'skin',
  'whole_body',
] as const

export const ENVIRONMENT_IDS = [
  'leo_station',
  'lunar_surface',
  'mars_transit',
  'mars_surface',
  'mars_rover',
] as const

export const indicatorIdSchema = z.enum(INDICATOR_IDS)
export const symptomIdSchema = z.enum(SYMPTOM_IDS)
export const contextFeedIdSchema = z.enum(CONTEXT_FEED_IDS)
export const regionIdSchema = z.enum(REGION_IDS)
export const environmentIdSchema = z.enum(ENVIRONMENT_IDS)
export const severitySchema = z.enum(['watch', 'act'])
export const thresholdBasisSchema = z.enum([
  'nasa-standard',
  'peer-reviewed',
  'clinical-general',
  'illustrative',
])
export const opSchema = z.enum(['gt', 'gte', 'lt', 'lte'])

type IndicatorId = z.infer<typeof indicatorIdSchema>
type SymptomId = z.infer<typeof symptomIdSchema>
type ContextFeedId = z.infer<typeof contextFeedIdSchema>

// Section 11.1. `modelThreshold` (decided 14 November 2026) compares with the
// threshold of the loaded model file, so no model number is typed in rules.json.
export const comparisonSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('absolute'),
    op: opSchema,
    value: z.number(),
  }),
  z.strictObject({
    kind: z.literal('baselineOffset'),
    op: opSchema,
    offset: z.number(),
  }),
  z.strictObject({
    kind: z.literal('baselinePercent'),
    op: opSchema,
    percent: z.number(),
  }),
  z.strictObject({ kind: z.literal('zScore'), op: opSchema, z: z.number() }),
  z.strictObject({
    kind: z.literal('modelThreshold'),
    op: opSchema,
    model: z.literal('sep-risk'),
  }),
])

export type Comparison = z.infer<typeof comparisonSchema>

// Section 11.2. Written out by hand because the schema is recursive.
export type Condition =
  | {
      type: 'latest'
      indicator: IndicatorId
      test: Comparison
      maxAgeDays?: number
    }
  | {
      type: 'streak'
      indicator: IndicatorId
      test: Comparison
      minCount: number
      windowDays: number
    }
  | {
      type: 'average'
      indicator: IndicatorId
      windowDays: number
      minReadings: number
      test: Comparison
    }
  | { type: 'symptom'; symptom: SymptomId; withinDays: number }
  | {
      type: 'context'
      feed: ContextFeedId
      windowDays: number
      test: Comparison
    }
  | { type: 'all'; of: Condition[] }
  | { type: 'any'; of: Condition[] }

const dayCount = z.number().int().positive()

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.strictObject({
      type: z.literal('latest'),
      indicator: indicatorIdSchema,
      test: comparisonSchema,
      maxAgeDays: z.number().int().nonnegative().optional(),
    }),
    z.strictObject({
      type: z.literal('streak'),
      indicator: indicatorIdSchema,
      test: comparisonSchema,
      minCount: dayCount,
      windowDays: dayCount,
    }),
    z.strictObject({
      type: z.literal('average'),
      indicator: indicatorIdSchema,
      windowDays: dayCount,
      minReadings: dayCount,
      test: comparisonSchema,
    }),
    z.strictObject({
      type: z.literal('symptom'),
      symptom: symptomIdSchema,
      withinDays: dayCount,
    }),
    z.strictObject({
      type: z.literal('context'),
      feed: contextFeedIdSchema,
      windowDays: dayCount,
      test: comparisonSchema,
    }),
    z.strictObject({
      type: z.literal('all'),
      of: z.array(conditionSchema).min(1),
    }),
    z.strictObject({
      type: z.literal('any'),
      of: z.array(conditionSchema).min(1),
    }),
  ]),
)

const sourceIdListSchema = z.array(z.string().min(1))

export const indicatorDefSchema = z
  .strictObject({
    id: indicatorIdSchema,
    label: z.string().min(1),
    unit: z.string(),
    region: regionIdSchema,
    input: z.enum(['number', 'scale', 'in_app_test']),
    cadenceDays: dayCount,
    inputMin: z.number(),
    inputMax: z.number(),
    step: z.number().positive(),
    minSpread: z.number().positive(),
    howToMeasure: z.string().min(1),
    whyInSpace: z.string().min(1),
    sourceIds: sourceIdListSchema.min(1),
  })
  .refine((def) => def.inputMin < def.inputMax, {
    message: 'inputMin must be below inputMax',
  })

export const regionDefSchema = z.strictObject({
  id: regionIdSchema,
  label: z.string().min(1),
  indicators: z.array(indicatorIdSchema),
  symptoms: z.array(symptomIdSchema),
  contextFeeds: z.array(contextFeedIdSchema),
})

export const sourceSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(1),
  publisher: z.string().min(1),
  year: z.number().int().nullable(),
  url: z.url(),
  kind: z.enum([
    'nasa',
    'peer-reviewed',
    'space-agency',
    'event-rules',
    'reference',
  ]),
  keyFinding: z.string().min(1),
  verified: z.boolean(),
})

export const environmentSchema = z
  .strictObject({
    id: environmentIdSchema,
    label: z.string().min(1),
    gravity: z.enum(['micro', 'lunar', 'mars']),
    oneWayDelaySecMin: z.number().nonnegative(),
    oneWayDelaySecMax: z.number().nonnegative(),
    notes: z.string().min(1),
    sourceIds: sourceIdListSchema,
  })
  .refine((env) => env.oneWayDelaySecMin <= env.oneWayDelaySecMax, {
    message: 'oneWayDelaySecMin must not exceed oneWayDelaySecMax',
  })

export const ruleSchema = z.strictObject({
  id: z.string().regex(/^R-[A-Z0-9]+-[0-9]{2}$/),
  title: z.string().min(1),
  region: regionIdSchema,
  severity: severitySchema,
  when: conditionSchema,
  timeToActMin: z.number().positive(),
  needsGround: z.boolean(),
  privateToCrew: z.boolean(),
  explain: z.strictObject({
    what: z.string().min(1),
    whySpace: z.string().min(1),
  }),
  protocolId: z.string().regex(/^P-[A-Z0-9]+(-[A-Z0-9]+)*$/),
  supersedes: z.array(z.string()),
  sourceIds: sourceIdListSchema,
  basis: thresholdBasisSchema,
})

export const protocolSchema = z.strictObject({
  id: z.string().regex(/^P-[A-Z0-9]+(-[A-Z0-9]+)*$/),
  title: z.string().min(1),
  // Says why the protocol is a draft and which timings are illustrative; the
  // protocol screen must show it with the "Draft guidance" tag (section 18).
  note: z.string().min(1),
  steps: z
    .array(
      z.strictObject({
        text: z.string().min(1),
        detail: z.string().min(1).optional(),
      }),
    )
    .min(3)
    .max(6),
  recheckAfterHours: z.number().positive().nullable(),
  escalateIf: z.string().min(1),
  reviewed: z.boolean(),
  sourceIds: sourceIdListSchema,
})

export const indicatorsFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  indicators: z.array(indicatorDefSchema).min(1),
})
export const regionsFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  regions: z.array(regionDefSchema).min(1),
})
export const sourcesFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  sources: z.array(sourceSchema).min(1),
})
export const environmentsFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  environments: z.array(environmentSchema).min(1),
})
export const rulesFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  rules: z.array(ruleSchema).min(1),
})
export const protocolsFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  protocols: z.array(protocolSchema).min(1),
})

// Runtime records (section 7). Validated when scenarios and storage load (M2, M3).

const missionDaySchema = z.number().int().positive()
const missionMsSchema = z.number().nonnegative()

export const crewMemberSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
})

export const readingSchema = z.strictObject({
  crewId: z.string().min(1),
  indicator: indicatorIdSchema,
  value: z.number(),
  day: missionDaySchema,
  atMs: missionMsSchema,
  origin: z.enum(['seed', 'manual', 'in_app_test']),
  // "recheck" marks an urgent repeat measurement asked for by an action card,
  // such as a non-fasting blood sugar re-check. Re-checks count for "latest"
  // conditions but never enter a baseline or replace the day's routine
  // reading. Absent means routine.
  purpose: z.enum(['routine', 'recheck']).optional(),
})

export const symptomReportSchema = z.strictObject({
  crewId: z.string().min(1),
  symptom: symptomIdSchema,
  day: missionDaySchema,
  atMs: missionMsSchema,
})

export const contextSampleSchema = z.strictObject({
  day: missionDaySchema,
  cabin_co2: z.number().nonnegative(),
  radiation_dose: z.number().nonnegative(),
  solar_event: z.boolean(),
})

export const linkStateSchema = z.strictObject({
  oneWayDelaySec: z.number().nonnegative(),
  linkUp: z.boolean(),
  groundHandlingMin: z.number().nonnegative(),
})

// Section 26.11: fixed now so the shapes do not move; used from A2.
export const flareObservationSchema = z.strictObject({
  donkiId: z.string().min(1),
  link: z.url(),
  day: missionDaySchema,
  peakMs: missionMsSchema,
  classType: z.string().min(1),
  sourceLocation: z.string().min(1),
  riseMin: z.number().nonnegative(),
  durationMin: z.number().nonnegative().nullable(),
  cme: z
    .strictObject({
      speedKms: z.number().nonnegative(),
      halfAngleDeg: z.number().nonnegative(),
    })
    .nullable(),
})

export const sepRiskFeatureSchema = z.strictObject({
  name: z.string().min(1),
  group: z.string().min(1),
  mean: z.number(),
  scale: z.number().positive(),
  coef: z.number(),
  impute: z.number().nullable(),
})

// Only the fields inference needs; the model card fields are added in A2.
export const sepRiskModelSchema = z.object({
  modelId: z.literal('sep-risk'),
  version: z.string().min(1),
  features: z.array(sepRiskFeatureSchema).min(1),
  intercept: z.number(),
  threshold: z.number().gt(0).lt(1),
})

// Scenario files generated by tools/simulator (section 24.1).

const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)

export const scenarioFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  scenarioId: slugSchema,
  title: z.string().min(1),
  simulated: z.literal(true),
  generator: z.string().min(1),
  missionDay: missionDaySchema,
  environmentId: environmentIdSchema,
  crew: z.array(crewMemberSchema).min(1),
  readings: z.array(readingSchema),
  symptoms: z.array(symptomReportSchema),
  context: z.array(contextSampleSchema),
  spaceWeather: z.array(flareObservationSchema),
  /** The real event a scenario uses, or null when everything is fictional. */
  basedOn: z.string().min(1).nullable(),
  expectedAlerts: z.array(
    z.strictObject({ crewId: z.string().min(1), ruleId: z.string().min(1) }),
  ),
  expectedInsights: z.array(
    z.strictObject({
      crewId: z.string().min(1),
      modelId: z.enum(['personal-pattern', 'earth-hospital']),
    }),
  ),
})

export const scenarioIndexSchema = z.strictObject({
  schemaVersion: z.literal(1),
  simulated: z.literal(true),
  defaultScenarioId: slugSchema,
  scenarios: z
    .array(
      z.strictObject({
        scenarioId: slugSchema,
        title: z.string().min(1),
        environmentId: environmentIdSchema,
        missionDay: missionDaySchema,
      }),
    )
    .min(1),
})

/** public/data/space-weather.json: the real DONKI events used in scenarios (section 25). */
export const spaceWeatherFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  source: z.string().min(1),
  retrievedAt: z.string().min(1).nullable(),
  note: z.string().min(1),
  events: z.array(
    z.strictObject({
      donkiId: z.string().min(1),
      type: z.enum(['FLR', 'CME', 'SEP']),
      eventTime: z.string().min(1),
      link: z.url(),
      usedIn: z.array(slugSchema),
    }),
  ),
})

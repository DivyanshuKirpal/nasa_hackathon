import type { z } from 'zod'
import type * as schemas from './schemas.ts'

// Domain types (ARCHITECTURE.md section 7). Data shapes come from the Zod
// schemas; the engine's own outputs are declared here.

export type { Comparison, Condition } from './schemas.ts'

export type IndicatorId = z.infer<typeof schemas.indicatorIdSchema>
export type SymptomId = z.infer<typeof schemas.symptomIdSchema>
export type ContextFeedId = z.infer<typeof schemas.contextFeedIdSchema>
export type RegionId = z.infer<typeof schemas.regionIdSchema>
export type EnvironmentId = z.infer<typeof schemas.environmentIdSchema>
export type Severity = z.infer<typeof schemas.severitySchema>
export type ThresholdBasis = z.infer<typeof schemas.thresholdBasisSchema>
export type Op = z.infer<typeof schemas.opSchema>

export type IndicatorDef = z.infer<typeof schemas.indicatorDefSchema>
export type RegionDef = z.infer<typeof schemas.regionDefSchema>
export type Source = z.infer<typeof schemas.sourceSchema>
export type Environment = z.infer<typeof schemas.environmentSchema>
export type Rule = z.infer<typeof schemas.ruleSchema>
export type Protocol = z.infer<typeof schemas.protocolSchema>

export type CrewMember = z.infer<typeof schemas.crewMemberSchema>
export type Reading = z.infer<typeof schemas.readingSchema>
export type SymptomReport = z.infer<typeof schemas.symptomReportSchema>
export type ContextSample = z.infer<typeof schemas.contextSampleSchema>
export type LinkState = z.infer<typeof schemas.linkStateSchema>
export type FlareObservation = z.infer<typeof schemas.flareObservationSchema>
export type SepRiskFeature = z.infer<typeof schemas.sepRiskFeatureSchema>
export type SepRiskModel = z.infer<typeof schemas.sepRiskModelSchema>
export type ScenarioFile = z.infer<typeof schemas.scenarioFileSchema>
export type ScenarioIndex = z.infer<typeof schemas.scenarioIndexSchema>
export type GroundMessage = z.infer<typeof schemas.groundMessageSchema>

export type Status = 'good' | 'watch' | 'act' | 'no_data'
export type Route = 'self_care' | 'consult_ground' | 'act_on_board'

/** Mission time is counted in milliseconds since mission start. */
export type MissionMs = number
/** Mission day 1 is the first day: floor(ms / 86_400_000) + 1. */
export type MissionDay = number

/** Section 10. `needed` lets the UI say "Learning your normal (n of 7)". */
export type Baseline =
  | { ready: false; n: number; needed: number }
  | {
      ready: true
      n: number
      center: number
      spread: number
      fromDay: MissionDay
      toDay: MissionDay
    }

export interface EvidenceItem {
  label: string
  value: string
  reference: string
}

export interface Alert {
  key: string
  ruleId: string
  crewId: string
  severity: Severity
  region: RegionId
  firstSeenDay: MissionDay
  evidence: EvidenceItem[]
  route: Route
  replyEtaMin: number | null
  supersededBy: string | null
}

export interface EvaluationInput {
  nowMs: MissionMs
  crewId: string
  readings: readonly Reading[]
  symptoms: readonly SymptomReport[]
  context: readonly ContextSample[]
  link: LinkState
  indicators: readonly IndicatorDef[]
  rules: readonly Rule[]
  /** Real DONKI flares placed in the scenario; used by the sep_risk feed from A2. */
  spaceWeather: readonly FlareObservation[]
  models: {
    /** null turns the sep_risk feed off (section 26.9). */
    sepRisk: SepRiskModel | null
  }
}

/** Data a region is missing, reported even while an alert is active. */
export interface RegionGaps {
  overdue: IndicatorId[]
  missingFeeds: ContextFeedId[]
}

export interface Evaluation {
  baselines: Partial<Record<IndicatorId, Baseline>>
  /** Active alerts; superseded ones are included and flagged. */
  alerts: Alert[]
  regionStatus: Record<RegionId, Status>
  overall: Status
  overdue: IndicatorId[]
  /** Daily habitat feeds with no sample for today; never treated as normal. */
  missingFeeds: ContextFeedId[]
  regionGaps: Record<RegionId, RegionGaps>
}

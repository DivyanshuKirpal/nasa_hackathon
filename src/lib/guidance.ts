import { useMemo } from 'react'
import { z } from 'zod'
import { healthData } from '../data/index.ts'
import type { Evaluation } from '../engine/index.ts'
import { useAppStore } from '../store/index.ts'
import {
  selectActiveCrew,
  selectEnvironment,
  selectEvaluation,
  selectToday,
} from '../store/selectors.ts'
import { crewLabel } from './labels.ts'

/*
 * AI guidance (added 15 November 2026 by request of the team): the app's own
 * results are sent to a server-side Groq proxy (/api/guidance) that returns
 * short preventive guidance. It is labelled "AI guidance" everywhere, never
 * sets a status, an alert or a route, and is not a diagnosis.
 */

const guidanceSchema = z.object({
  headline: z.string().catch(''),
  summary: z.string().catch(''),
  focus: z
    .array(
      z.object({
        area: z.string().catch(''),
        title: z.string().catch(''),
        detail: z.string().catch(''),
        priority: z.string().catch('today'),
      }),
    )
    .catch([]),
  prevention: z.array(z.string()).catch([]),
  ground: z.string().catch(''),
  model: z.string().catch('AI model'),
})

export type Guidance = z.infer<typeof guidanceSchema>

const answerSchema = z.object({ answer: z.string(), model: z.string() })

export interface LatestReading {
  id: string
  name: string
  unit: string
  region: string
  latest: number
  /** Up to the last 10 values, oldest first, for sparklines. */
  history: number[]
  usualCenter: number | null
  usualSpread: number | null
}

/** Latest value and recent history per indicator for one crew member. */
export function latestReadings(
  readings: readonly {
    crewId: string
    indicator: string
    value: number
    atMs: number
  }[],
  crewId: string,
  nowMs: number,
  evaluation: Evaluation,
): LatestReading[] {
  return healthData.indicators.flatMap((indicator) => {
    const own = readings
      .filter(
        (reading) =>
          reading.crewId === crewId &&
          reading.indicator === indicator.id &&
          reading.atMs <= nowMs,
      )
      .sort((a, b) => a.atMs - b.atMs)
    const last = own.at(-1)
    if (!last) return []
    const baseline = evaluation.baselines[indicator.id]
    const ready = baseline?.ready === true ? baseline : null
    return [
      {
        id: indicator.id,
        name: indicator.label,
        unit: indicator.unit,
        region: indicator.region,
        latest: last.value,
        history: own.slice(-10).map((reading) => reading.value),
        usualCenter: ready ? ready.center : null,
        usualSpread: ready ? ready.spread : null,
      },
    ]
  })
}

function regionLabel(id: string): string {
  return healthData.regions.find((region) => region.id === id)?.label ?? id
}

/** The compact, JSON-safe summary of today's results sent to the AI. */
export function useGuidanceContext() {
  const evaluation = useAppStore(selectEvaluation)
  const crew = useAppStore(selectActiveCrew)
  const environment = useAppStore(selectEnvironment)
  const today = useAppStore(selectToday)
  const readings = useAppStore((state) => state.readings)
  const crewId = useAppStore((state) => state.mission.activeCrewId)
  const nowMs = useAppStore((state) => state.mission.nowMs)

  const latest = latestReadings(readings, crewId, nowMs, evaluation)
  const context = {
    crewMember: crew ? crewLabel(crew) : 'Crew member',
    missionDay: today,
    location: environment?.label ?? 'Unknown',
    oneWayCommDelaySeconds: environment
      ? [environment.oneWayDelaySecMin, environment.oneWayDelaySecMax]
      : null,
    overallStatus: evaluation.overall,
    areas: Object.entries(evaluation.regionStatus).map(([id, status]) => ({
      area: regionLabel(id),
      status,
    })),
    activeAlerts: evaluation.alerts
      .filter((alert) => alert.supersededBy === null)
      .map((alert) => ({
        title:
          healthData.rules.find((rule) => rule.id === alert.ruleId)?.title ??
          alert.ruleId,
        area: regionLabel(alert.region),
        severity: alert.severity,
        triageRoute: alert.route,
        groundReplyEstimateMin: alert.replyEtaMin,
      })),
    latestReadings: latest.map((reading) => ({
      name: reading.name,
      unit: reading.unit,
      latest: reading.latest,
      personalUsualCenter: reading.usualCenter,
      personalUsualSpread: reading.usualSpread,
    })),
    overdueChecks: evaluation.overdue,
    dataIsSimulated: true,
  }
  // Re-ask the AI only when the results change, not on every clock tick.
  const key = JSON.stringify(context)
  return useMemo(
    () => ({ key, context: JSON.parse(key) as typeof context }),
    [key],
  )
}

async function post(body: unknown, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch('/api/guidance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String(data.error)
        : `Guidance service returned ${response.status}`
    throw new Error(message)
  }
  return data
}

export async function fetchGuidance(
  context: unknown,
  signal?: AbortSignal,
): Promise<Guidance> {
  return guidanceSchema.parse(await post({ mode: 'guidance', context }, signal))
}

export async function askGuidance(
  context: unknown,
  question: string,
): Promise<{ answer: string; model: string }> {
  return answerSchema.parse(await post({ mode: 'ask', context, question }))
}

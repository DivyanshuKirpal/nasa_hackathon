import type { Alert, Evaluation } from '../engine/index.ts'

/** Active alerts, act first. Superseded alerts are left out (section 19.1). */
export function activeAlerts(evaluation: Evaluation): Alert[] {
  return evaluation.alerts
    .filter((alert) => alert.supersededBy === null)
    .sort((a, b) => Number(b.severity === 'act') - Number(a.severity === 'act'))
}

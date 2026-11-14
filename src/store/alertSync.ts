import {
  missionDayOf,
  type Alert,
  type GroundMessage,
} from '../engine/index.ts'
import { activeAlerts } from '../lib/alerts.ts'
import { ruleById } from '../lib/labels.ts'
import {
  composeAlertMessage,
  hasMessage,
  kindForRoute,
  type MessageKind,
} from '../link/earthLink.ts'
import type { AppState } from './index.ts'
import type { PersistedState } from './persistence.ts'
import { selectEvaluation } from './selectors.ts'

// Keeps the stored side of alerts in step with the derived alerts
// (ARCHITECTURE.md sections 11.5, 13.4 and 15). Alerts themselves are never
// stored; only the crew's interaction with them and the outbox are.

/** The outbox message for an alert, written at the current mission time. */
export function alertMessage(
  state: PersistedState,
  alert: Alert,
  kind: MessageKind,
): GroundMessage {
  const rule = ruleById(alert.ruleId)
  const member = state.crew.find((entry) => entry.id === alert.crewId)
  return composeAlertMessage({
    kind,
    alert,
    title: rule?.title ?? alert.ruleId,
    // Unreachable in practice (alerts come from rules), but fail private.
    privateToCrew: rule?.privateToCrew ?? true,
    sender: member ? `${member.name}, ${member.role}` : alert.crewId,
    day: missionDayOf(state.mission.nowMs),
    nowMs: state.mission.nowMs,
    stepsDone: state.alertState[alert.key]?.stepsDone ?? [],
  })
}

/**
 * The outbox and alert interactions after recording every active alert.
 * Returns null when nothing changed, so callers do not write for nothing.
 * Moving the delay slider back and forth never queues a second message of
 * the same kind for the same alert.
 */
export function syncedAlertSlices(
  state: AppState,
): Pick<PersistedState, 'outbox' | 'alertState'> | null {
  const today = missionDayOf(state.mission.nowMs)
  let outbox = state.outbox
  let alertState = state.alertState

  for (const alert of activeAlerts(selectEvaluation(state))) {
    const known = alertState[alert.key]
    if (!known) {
      alertState = {
        ...alertState,
        [alert.key]: {
          firstSeenDay: today,
          lastSeenDay: today,
          acknowledgedAtMs: null,
          stepsDone: [],
        },
      }
    } else if (known.lastSeenDay !== today) {
      alertState = {
        ...alertState,
        [alert.key]: { ...known, lastSeenDay: today },
      }
    }

    const kind = kindForRoute(alert.route)
    if (kind && !hasMessage(outbox, alert.key, kind)) {
      outbox = [...outbox, alertMessage({ ...state, alertState }, alert, kind)]
    }
  }

  if (outbox === state.outbox && alertState === state.alertState) return null
  return { outbox, alertState }
}

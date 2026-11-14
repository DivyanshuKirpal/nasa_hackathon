import type { Alert, GroundMessage, Route } from '../engine/index.ts'
import { messageId } from '../lib/ids.ts'
import { routeSentence } from '../lib/route.ts'

// The simulated outbox to Earth (ARCHITECTURE.md section 15). Nothing is
// really sent anywhere. Milestone M6 adds the clock-driven transit; until then
// every message stays "queued".

export type MessageKind = GroundMessage['kind']

/**
 * Acting on board sends the ground a report; consulting the ground sends a
 * consult. Self care sends nothing unless the crew member chooses to.
 */
export function kindForRoute(route: Route): MessageKind | null {
  if (route === 'act_on_board') return 'report'
  if (route === 'consult_ground') return 'consult'
  return null
}

export function hasMessage(
  outbox: readonly GroundMessage[],
  alertKey: string,
  kind: MessageKind,
): boolean {
  return outbox.some(
    (message) => message.alertKey === alertKey && message.kind === kind,
  )
}

export interface AlertMessageInput {
  kind: MessageKind
  alert: Alert
  /** The rule's headline. */
  title: string
  privateToCrew: boolean
  /** "Crew member A, Commander" */
  sender: string
  day: number
  nowMs: number
  /** Indexes of the protocol steps ticked so far. */
  stepsDone: readonly number[]
}

/**
 * The message says who, which day, what changed, the route and the steps
 * already done (section 15). Private rules are marked "Private medical" and
 * listed only as "Private message".
 */
export function composeAlertMessage(input: AlertMessageInput): GroundMessage {
  const { alert } = input
  const steps =
    input.stepsDone.length === 0
      ? 'none yet'
      : [...input.stepsDone]
          .sort((a, b) => a - b)
          .map((index) => index + 1)
          .join(', ')
  const lines = [
    ...(input.privateToCrew ? ['Private medical.'] : []),
    `From ${input.sender}, mission day ${input.day}.`,
    `Alert: ${input.title}.`,
    ...alert.evidence.map(
      (item) =>
        `What changed: ${item.label}: ${item.value} (${item.reference}).`,
    ),
    `Route: ${routeSentence(alert.route, alert.replyEtaMin)}`,
    `Steps done so far: ${steps}.`,
  ]
  return {
    id: messageId(input.kind, alert.key),
    crewId: alert.crewId,
    alertKey: alert.key,
    insightKey: null,
    kind: input.kind,
    title: input.privateToCrew ? 'Private message' : input.title,
    body: lines.join('\n'),
    sentAtMs: input.nowMs,
    arrivesAtMs: null,
    replyDueAtMs: null,
    status: 'queued',
  }
}

import type { Alert, GroundMessage, Insight, Route } from '../engine/index.ts'
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

/** The outbox title of an insight the crew chose to send (section 26.17). */
export const SECOND_OPINION_TITLE = 'Second opinion sent by crew'

export interface InsightMessageInput {
  insight: Insight
  /** The model file's headline and caveat. */
  headline: string
  caveat: string
  /** One line per factor, written for the ground. */
  factorLines: readonly string[]
  /** "Crew member A, Commander" */
  sender: string
  nowMs: number
}

/**
 * A consult the crew chose to send from a second-opinion insight; never sent
 * automatically. Marked private, because mood is among the model's inputs and
 * mood is private (section 28). It names no route: a second opinion never
 * sets one.
 */
export function composeInsightMessage(
  input: InsightMessageInput,
): GroundMessage {
  const { insight } = input
  const lines = [
    'Private medical.',
    `From ${input.sender}, mission day ${insight.day}.`,
    `${SECOND_OPINION_TITLE}. Insight shown to the crew: "${input.headline}" (model estimate, ${insight.modelId} ${insight.modelVersion}).`,
    ...input.factorLines.map((line) => `What changed: ${line}.`),
    input.caveat,
    'Not an alert: a second opinion never sets a status or a route.',
  ]
  return {
    id: messageId('consult', insight.key),
    crewId: insight.crewId,
    alertKey: null,
    insightKey: insight.key,
    kind: 'consult',
    title: SECOND_OPINION_TITLE,
    body: lines.join('\n'),
    sentAtMs: input.nowMs,
    arrivesAtMs: null,
    replyDueAtMs: null,
    status: 'queued',
  }
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

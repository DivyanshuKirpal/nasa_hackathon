import { Card } from '../../components/Card.tsx'
import { StatusBadge } from '../../components/StatusBadge.tsx'
import type { Evaluation } from '../../engine/index.ts'
import { activeAlerts } from '../../lib/alerts.ts'
import { ROUTE_WORDS, regionLabel, ruleById } from '../../lib/labels.ts'

export function AlertList({ evaluation }: { evaluation: Evaluation }) {
  const alerts = activeAlerts(evaluation)
  return (
    <Card title="Active alerts">
      {alerts.length === 0 ? (
        <p>No active alerts.</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.key}
              className="rounded-lg border border-slate-200 p-3"
              data-rule-id={alert.ruleId}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={alert.severity} />
                <span className="font-semibold">
                  {ruleById(alert.ruleId)?.title ?? alert.ruleId}
                </span>
              </div>
              <p className="mt-1 text-slate-700">
                {regionLabel(alert.region)} · {ROUTE_WORDS[alert.route]}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

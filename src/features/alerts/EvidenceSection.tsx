import { Card } from '../../components/Card.tsx'
import { SourceList } from '../../components/SourceLink.tsx'
import { Tag } from '../../components/Tag.tsx'
import type { Protocol, Rule } from '../../engine/index.ts'
import { BASIS_EXPLAIN, BASIS_WORDS } from '../../lib/labels.ts'

/** Section 5 of the alert screen: where the check and its steps come from. */
export function EvidenceSection({
  rule,
  protocol,
}: {
  rule: Rule
  protocol: Protocol
}) {
  const stepSources = protocol.sourceIds.filter(
    (id) => !rule.sourceIds.includes(id),
  )
  return (
    <Card title="Evidence">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">Basis:</span>
        <Tag>{BASIS_WORDS[rule.basis]}</Tag>
      </p>
      <p className="mt-1">{BASIS_EXPLAIN[rule.basis]}</p>
      <h3 className="mt-4 font-semibold">Sources for this check</h3>
      <div className="mt-1">
        <SourceList sourceIds={rule.sourceIds} />
      </div>
      {stepSources.length > 0 && (
        <>
          <h3 className="mt-4 font-semibold">Sources for the steps</h3>
          <div className="mt-1">
            <SourceList sourceIds={stepSources} />
          </div>
        </>
      )}
      <p className="mt-4 text-slate-700">
        &ldquo;Unverified source&rdquo; means no team member has checked the
        source yet. A checked source is still not clinical validation.
      </p>
    </Card>
  )
}

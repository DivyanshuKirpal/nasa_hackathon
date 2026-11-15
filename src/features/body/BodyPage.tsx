import { useMemo, useRef, useState } from 'react'
import { reportsForCrew } from '../../bodyview/pins.ts'
import {
  anchorReplay,
  hasSuitData,
  sensorReadout,
} from '../../bodyview/sensors.ts'
import { bodyModelFor, sensorSites } from '../../data/bodyView.ts'
import { crewLabel } from '../../lib/labels.ts'
import { useAppStore } from '../../store/index.ts'
import { selectActiveCrew } from '../../store/selectors.ts'
import { SensorSection } from './SensorSection.tsx'
import { SorenessForm } from './SorenessForm.tsx'
import { SorenessList } from './SorenessList.tsx'
import { EMPTY_DRAFT, type SorenessDraft } from './sorenessDraft.ts'
import { useSuitReplay } from './suitReplay.ts'

/**
 * The personal body view (section 22): crew-reported soreness and simulated
 * suit sensors. Both are kept apart from the health checks: nothing here
 * reaches the engine, an alert, a route or a message to Earth (decision D11).
 */
export function BodyPage() {
  const crew = useAppStore(selectActiveCrew)
  const crewId = useAppStore((state) => state.mission.activeCrewId)
  const nowMs = useAppStore((state) => state.mission.nowMs)
  const soreness = useAppStore((state) => state.soreness)
  const anchorMs = useAppStore((state) => state.suit.anchorMs)
  const replay = useSuitReplay()
  const locationRef = useRef<HTMLInputElement>(null)
  const [draftFor, setDraftFor] = useState({ crewId, draft: EMPTY_DRAFT })

  // A half-filled form belongs to one crew member; switching starts afresh.
  const draft = draftFor.crewId === crewId ? draftFor.draft : EMPTY_DRAFT
  const setDraft = (next: SorenessDraft) => setDraftFor({ crewId, draft: next })

  const model = bodyModelFor(crewId)
  const reports = useMemo(
    () => reportsForCrew(soreness, crewId),
    [soreness, crewId],
  )
  const replayFile = replay.status === 'ready' ? replay.replay : null
  const samples = useMemo(
    () =>
      replayFile && anchorMs !== null ? anchorReplay(replayFile, anchorMs) : [],
    [replayFile, anchorMs],
  )
  const readouts = useMemo(
    () =>
      sensorSites.sites.map((site) =>
        sensorReadout(samples, crewId, site.id, nowMs, sensorSites),
      ),
    [samples, crewId, nowMs],
  )

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Your body</h1>
        {crew && <p className="text-lg">{crewLabel(crew)}</p>}
        <p className="max-w-3xl text-slate-700">
          Two kinds of information, kept apart from your health checks:
          crew-reported soreness, which is what you say, and simulated skin
          temperature from three suit sensors. Neither is used in health alerts,
          your status or messages to Earth.
        </p>
      </header>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <SorenessForm
            draft={draft}
            setDraft={setDraft}
            locationRef={locationRef}
          />
          <SorenessList reports={reports} model={model} />
        </div>
        <SensorSection
          replay={replay}
          readouts={readouts}
          hasData={hasSuitData(samples, crewId)}
          nowMs={nowMs}
        />
      </div>
    </div>
  )
}

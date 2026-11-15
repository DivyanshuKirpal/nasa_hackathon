import { Suspense, lazy, useCallback, type ReactNode } from 'react'
import { bodyModelFor } from '../../data/bodyView.ts'
import { useBodyModelStatus } from '../../lib/bodyModelStatus.ts'
import { useAppStore } from '../../store/index.ts'
import { selectActiveCrew } from '../../store/selectors.ts'
import { use3dAvailable } from './body3d.ts'
import { useBodyHealth } from './useBodyHealth.ts'
import type { ModelStatus } from './viewer/Viewer3D.tsx'

const Viewer3D = lazy(() => import('./viewer/Viewer3D.tsx'))

// Stable empty inputs: the home twin shows health status only, no pins or sensors.
const NO_PINS: never[] = []
const NO_SENSORS: never[] = []
const ignore = () => {}

/**
 * The 3D digital twin on the home dashboard: the delivered Blender model with
 * the health overlay, system layers and heartbeat. Falls back to the given 2D
 * view when WebGL is off, no model exists or the model fails to load.
 */
export function HomeTwin({ fallback }: { fallback: ReactNode }) {
  const crewId = useAppStore((state) => state.mission.activeCrewId)
  const crew = useAppStore(selectActiveCrew)
  const available = use3dAvailable()
  const health = useBodyHealth()
  const model = bodyModelFor(crewId)
  const status = useBodyModelStatus((state) =>
    model ? state.byModel[model.id] : undefined,
  )
  const report = useBodyModelStatus((state) => state.report)
  const modelId = model?.id
  const version = model?.version
  const onStatus = useCallback(
    (next: ModelStatus) => {
      if (modelId !== undefined && version !== undefined) {
        report(modelId, { version, ...next })
      }
    },
    [report, modelId, version],
  )
  const failed =
    model !== null &&
    status?.version === model.version &&
    status.state === 'failed'

  if (!available || model === null || failed) return <>{fallback}</>
  return (
    <Suspense
      fallback={<p className="text-slate-700">Loading the digital twin…</p>}
    >
      <Viewer3D
        model={model}
        health={health}
        crewName={crew?.name ?? ''}
        pins={NO_PINS}
        sensors={NO_SENSORS}
        selectedReportId={null}
        selectedSite={null}
        highlightPatch={false}
        turnRequest={null}
        onPick={ignore}
        onSelectReport={ignore}
        onSelectSite={ignore}
        onStatus={onStatus}
      />
    </Suspense>
  )
}

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Vector3 } from 'three'
import type { ContractResult } from '../../../bodyview/modelContract.ts'
import type {
  BodyModelEntry,
  PinAnchor,
  SensorSiteId,
} from '../../../bodyview/types.ts'
import { sensorSites } from '../../../data/bodyView.ts'
import { readViewerColors, type ViewerColors } from './colors.ts'
import { createViewer, type Viewer } from './createViewer.ts'
import { LayerControls } from './LayerControls.tsx'
import {
  ModelLoadError,
  loadBodyModel,
  type LayerState,
  type LoadedModel,
} from './loadModel.ts'
import { createMarkerSet, markerInfo, type MarkerSet } from './markers.ts'
import {
  isTap,
  pickResultFromHit,
  type PickResult,
  type PointerSample,
} from './picking.ts'
import { ViewButtons } from './ViewButtons.tsx'
import { viewDescription } from './viewText.ts'

export interface ModelStatus {
  state: 'loading' | 'ready' | 'failed'
  contract: ContractResult | null
}

export interface Viewer3DProps {
  model: BodyModelEntry
  crewName: string
  pins: readonly { id: string; anchor: PinAnchor }[]
  sensors: readonly { site: SensorSiteId; contactLost: boolean }[]
  selectedReportId: string | null
  selectedSite: SensorSiteId | null
  highlightPatch: boolean
  turnRequest: { site: SensorSiteId; nonce: number } | null
  onPick: (pick: PickResult, model: BodyModelEntry) => void
  onSelectReport: (reportId: string) => void
  onSelectSite: (site: SensorSiteId) => void
  onStatus: (status: ModelStatus) => void
}

/** The 3D body (section 22.8). Loaded lazily, so three.js is its own chunk. */
export default function Viewer3D(props: Viewer3DProps) {
  const {
    model,
    pins,
    sensors,
    selectedReportId,
    selectedSite,
    highlightPatch,
    turnRequest,
  } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const colorsRef = useRef<ViewerColors | null>(null)
  const markersRef = useRef<MarkerSet | null>(null)
  const downRef = useRef<PointerSample | null>(null)
  const latest = useRef(props)
  const [loaded, setLoaded] = useState<LoadedModel | null>(null)
  const [description, setDescription] = useState('Showing the front')
  const [progress, setProgress] = useState<number | null>(null)
  const [layers, setLayers] = useState<LayerState[]>([])

  useEffect(() => {
    latest.current = props
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const colors = readViewerColors(canvas)
    const viewer = createViewer(canvas, colors)
    colorsRef.current = colors
    viewerRef.current = viewer
    markersRef.current = createMarkerSet(colors)
    return () => {
      markersRef.current?.dispose()
      viewer.dispose()
      viewerRef.current = null
      markersRef.current = null
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    const colors = colorsRef.current
    if (!viewer || !colors) return
    const controller = new AbortController()
    let current: LoadedModel | null = null
    latest.current.onStatus({ state: 'loading', contract: null })
    setProgress(null)
    loadBodyModel(
      model,
      colors,
      sensorSites.sites,
      controller.signal,
      (fraction) => {
        if (!controller.signal.aborted) setProgress(fraction)
      },
    )
      .then((result) => {
        if (controller.signal.aborted) {
          result.dispose()
          return
        }
        current = result
        viewer.setContent([result.root])
        setLoaded(result)
        setLayers(result.layers)
        setDescription('Showing the front')
        latest.current.onStatus({ state: 'ready', contract: result.contract })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        latest.current.onStatus({
          state: 'failed',
          contract: error instanceof ModelLoadError ? error.contract : null,
        })
      })
    return () => {
      controller.abort()
      current?.dispose()
      setLoaded(null)
    }
  }, [model])

  useEffect(() => {
    const markers = markersRef.current
    if (!loaded || !markers) return
    const drawable = sensors.flatMap(({ site, contactLost }) => {
      const anchor = loaded.anchors.get(site)
      return anchor ? [{ site, anchor, contactLost }] : []
    })
    markers.update(loaded.root, pins, drawable, {
      reportId: selectedReportId,
      site: selectedSite,
    })
    loaded.setPatchHighlight(highlightPatch)
    viewerRef.current?.requestRender()
  }, [loaded, pins, sensors, selectedReportId, selectedSite, highlightPatch])

  useEffect(() => {
    const viewer = viewerRef.current
    const anchor = turnRequest && loaded?.anchors.get(turnRequest.site)
    if (!viewer || !anchor) return
    viewer.turnTowards(anchor.getWorldPosition(new Vector3()))
    setDescription(viewDescriptionOf(viewer))
  }, [turnRequest, loaded])

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    downRef.current = {
      x: event.clientX,
      y: event.clientY,
      timeStamp: event.timeStamp,
    }
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const down = downRef.current
    downRef.current = null
    const viewer = viewerRef.current
    if (!down || !viewer || !loaded) return
    const up = {
      x: event.clientX,
      y: event.clientY,
      timeStamp: event.timeStamp,
    }
    if (!isTap(down, up)) {
      setDescription(viewDescriptionOf(viewer))
      return
    }
    // Pins go on the skin and the shoulder patch only, never on an inner
    // layer; with the skin hidden only markers can be selected.
    const surface = loaded.surfacePickable()
      ? [loaded.body, ...(loaded.patch ? [loaded.patch] : [])]
      : []
    const targets = [...surface, ...(markersRef.current?.meshes() ?? [])]
    const hit = viewer.pick(event.clientX, event.clientY, targets)
    if (!hit) return
    const marker = markerInfo(hit.object)
    if (marker?.kind === 'pin') latest.current.onSelectReport(marker.reportId)
    else if (marker?.kind === 'sensor') latest.current.onSelectSite(marker.site)
    else
      latest.current.onPick(
        pickResultFromHit(hit, loaded.root, loaded.patch),
        loaded.entry,
      )
  }

  const drawnSensors = loaded
    ? sensors.filter(({ site }) => loaded.anchors.has(site)).length
    : 0
  const pinWord = pins.length === 1 ? 'soreness pin' : 'soreness pins'
  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`3D body of ${props.crewName}, ${pins.length} ${pinWord}, ${drawnSensors} sensors`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="block h-[420px] w-full rounded-lg border border-slate-300 lg:h-[540px]"
      />
      {!loaded && (
        <p className="text-slate-700">
          Loading the 3D body…
          {progress !== null && ` ${Math.round(progress * 100)}%`}
        </p>
      )}
      {loaded && layers.length > 0 && (
        <LayerControls
          layers={layers}
          onChange={(id, visible) => {
            loaded.setLayerVisible(id, visible)
            setLayers(loaded.layers)
            viewerRef.current?.requestRender()
          }}
        />
      )}
      <ViewButtons
        viewer={() => viewerRef.current}
        description={description}
        onMoved={setDescription}
      />
      {model.attribution && (
        <p className="text-slate-700">{model.attribution}</p>
      )}
    </div>
  )
}

function viewDescriptionOf(viewer: Viewer): string {
  return viewDescription(viewer.azimuthDeg())
}

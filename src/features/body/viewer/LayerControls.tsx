import {
  BicepsFlexed,
  Bone,
  Brain,
  Droplets,
  Flower2,
  HeartPulse,
  Layers,
  Network,
  PersonStanding,
  Salad,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import type { LayerState } from './loadModel.ts'

const LAYER_ICONS: Record<string, LucideIcon> = {
  skin: PersonStanding,
  skeleton: Bone,
  muscles: BicepsFlexed,
  heart_vessels: HeartPulse,
  lungs_airway: Wind,
  nerves: Brain,
  digestive: Salad,
  urinary: Droplets,
  glands: Flower2,
  lymphatic: Network,
}

/**
 * Show or hide the anatomical systems of a delivered model (section 23.12),
 * as a rail of toggle chips like the 3DBlend viewer's left bar. Each chip is
 * a real checkbox, so keyboard and screen readers work as before.
 * Pins always go on the skin, so they need the skin layer shown.
 */
export function LayerControls({
  layers,
  onChange,
}: {
  layers: readonly LayerState[]
  onChange: (id: string, visible: boolean) => void
}) {
  const surfaceHidden = layers.some((layer) => layer.surface && !layer.visible)
  const innerShown = layers.some((layer) => !layer.surface && layer.visible)
  return (
    <fieldset className="glass-panel space-y-3 rounded-2xl p-3">
      <legend className="sr-only">Anatomical layers</legend>
      <p className="flex items-center gap-2 px-1 text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase">
        <Layers aria-hidden="true" size={14} /> Body systems
      </p>
      <div className="grid grid-cols-2 gap-2 @md:grid-cols-3 @2xl:grid-cols-1">
        {layers.map((layer) => {
          const Icon = LAYER_ICONS[layer.id] ?? Layers
          return (
            <label
              key={layer.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-sm leading-tight transition-colors hover:bg-slate-100 has-checked:border-holo-mint has-checked:bg-slate-200 has-checked:text-slate-950 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring"
            >
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={(event) => onChange(layer.id, event.target.checked)}
                className="sr-only"
              />
              <Icon
                aria-hidden="true"
                size={18}
                className="shrink-0 text-holo-mint"
              />
              <span>{layer.label}</span>
            </label>
          )
        })}
      </div>
      {innerShown && !surfaceHidden && (
        <p className="px-1 text-sm text-slate-600">
          Skin turns see-through while an inner system is shown.
        </p>
      )}
      {surfaceHidden && (
        <p className="px-1 text-sm font-semibold">
          Pins go on the skin only. Turn the skin layer on to place a pin.
        </p>
      )}
      <p className="px-1 text-xs text-slate-600">
        Anatomical atlas model: typical anatomy for orientation, not your own
        body and not a finding about you.
      </p>
    </fieldset>
  )
}

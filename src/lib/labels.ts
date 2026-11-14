import { healthData } from '../data/index.ts'
import type {
  IndicatorDef,
  IndicatorId,
  RegionId,
  Route,
  Rule,
  SymptomId,
  ThresholdBasis,
} from '../engine/index.ts'

// Small look-ups and display words shared by the screens.

export function indicatorDef(id: IndicatorId): IndicatorDef {
  const def = healthData.indicators.find((entry) => entry.id === id)
  if (!def) throw new Error(`indicators.json has no ${id}`)
  return def
}

export function regionLabel(id: RegionId): string {
  return healthData.regions.find((region) => region.id === id)?.label ?? id
}

export function ruleById(ruleId: string): Rule | null {
  return healthData.rules.find((rule) => rule.id === ruleId) ?? null
}

/** "blurred_vision" -> "Blurred vision" */
export function symptomLabel(id: SymptomId): string {
  const words = id.replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** A value with its unit, at the precision it is entered in: "6.75 h", "62 mg/dL". */
export function formatValue(value: number, def: IndicatorDef): string {
  const text = String(def.step)
  const decimals = text.includes('.') ? text.length - text.indexOf('.') - 1 : 0
  const number = value.toFixed(decimals)
  return def.unit === '' ? number : `${number} ${def.unit}`
}

/** A derived value such as a normal: one decimal for fractional indicators. */
export function formatNormal(value: number, def: IndicatorDef): string {
  const number = value.toFixed(def.step < 1 ? 1 : 0)
  return def.unit === '' ? number : `${number} ${def.unit}`
}

export const ROUTE_WORDS: Record<Route, string> = {
  act_on_board: 'Act now on board',
  consult_ground: 'Consult the ground',
  self_care: 'You can handle this yourself',
}

export const BASIS_WORDS: Record<ThresholdBasis, string> = {
  'nasa-standard': 'NASA standard',
  'peer-reviewed': 'Peer-reviewed research',
  'clinical-general': 'Common clinical cut-off',
  illustrative: 'Illustrative threshold',
}

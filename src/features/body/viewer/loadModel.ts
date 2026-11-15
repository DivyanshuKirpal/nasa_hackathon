import {
  Group,
  Mesh,
  MeshStandardMaterial,
  type Material,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  BODY_NODE,
  PATCH_NODE,
  checkNodeNames,
  type ContractResult,
} from '../../../bodyview/modelContract.ts'
import type {
  BodyModelEntry,
  SensorSite,
  SensorSiteId,
} from '../../../bodyview/types.ts'
import type { ViewerColors } from './colors.ts'
import { buildPlaceholder } from './placeholderModel.ts'

// Loading a body (section 22.8): the placeholder is built in code; a
// delivered file comes through GLTFLoader with a 15-second limit. Either way
// the node names are checked against the contract before anything is shown.

export const LOAD_TIMEOUT_MS = 15_000

export interface LoadedModel {
  entry: BodyModelEntry
  root: Group
  body: Object3D
  patch: Mesh | null
  anchors: Map<SensorSiteId, Object3D>
  contract: ContractResult
  setPatchHighlight(on: boolean): void
  dispose(): void
}

export class ModelLoadError extends Error {
  readonly contract: ContractResult | null
  constructor(message: string, contract: ContractResult | null) {
    super(message)
    this.contract = contract
  }
}

interface Materials {
  body: MeshStandardMaterial
  patch: MeshStandardMaterial
}

function createMaterials(colors: ViewerColors): Materials {
  return {
    body: new MeshStandardMaterial({
      color: colors.surface,
      roughness: 0.85,
      metalness: 0,
    }),
    // Invisible until highlighted, but still hit by taps (raycasting ignores opacity).
    patch: new MeshStandardMaterial({
      color: colors.patch,
      roughness: 0.6,
      metalness: 0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  }
}

function disposeMaterials(material: Material | Material[], keep: Materials) {
  for (const entry of Array.isArray(material) ? material : [material]) {
    if (entry !== keep.body && entry !== keep.patch) entry.dispose()
  }
}

function disposeTree(root: Object3D) {
  root.traverse((node) => {
    if (node instanceof Mesh) {
      node.geometry.dispose()
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material]) {
        material.dispose()
      }
    }
  })
}

/** Checks the names, paints the body gray and finds the patch and anchors. */
export function prepareModel(
  entry: BodyModelEntry,
  root: Group,
  materials: Materials,
  sites: readonly SensorSite[],
): LoadedModel {
  const names: string[] = []
  root.traverse((node) => names.push(node.name))
  const contract = checkNodeNames(names)
  const body = root.getObjectByName(BODY_NODE)
  if (contract.outcome === 'reject' || body === undefined) {
    throw new ModelLoadError('The model has no body node', contract)
  }
  // The file's own materials are ignored: every body mesh is plain gray.
  body.traverse((node) => {
    if (node instanceof Mesh) {
      disposeMaterials(node.material, materials)
      node.material = materials.body
    }
  })
  const patchNode = root.getObjectByName(PATCH_NODE)
  const patch = patchNode instanceof Mesh ? patchNode : null
  if (patch) {
    disposeMaterials(patch.material, materials)
    patch.material = materials.patch
  }
  const anchors = new Map<SensorSiteId, Object3D>()
  for (const site of sites) {
    const node = root.getObjectByName(site.anchorNode)
    if (node) anchors.set(site.id, node)
  }
  return {
    entry,
    root,
    body,
    patch,
    anchors,
    contract,
    setPatchHighlight(on) {
      materials.patch.opacity = on ? 0.45 : 0
    },
    dispose() {
      root.removeFromParent()
      root.traverse((node) => {
        if (node instanceof Mesh) node.geometry.dispose()
      })
      materials.body.dispose()
      materials.patch.dispose()
    },
  }
}

/**
 * Settles with the promise, or rejects after `ms` or on abort. A result that
 * arrives too late is handed to `onLate` so it can be disposed.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  signal: AbortSignal,
  onLate: (value: T) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const stop = (error: ModelLoadError) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(error)
    }
    const timer = setTimeout(
      () => stop(new ModelLoadError('Loading timed out', null)),
      ms,
    )
    signal.addEventListener(
      'abort',
      () => stop(new ModelLoadError('Loading was cancelled', null)),
      { once: true },
    )
    promise.then(
      (value) => {
        if (settled) {
          onLate(value)
          return
        }
        settled = true
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) =>
        stop(
          error instanceof ModelLoadError
            ? error
            : new ModelLoadError('The file could not be loaded', null),
        ),
    )
  })
}

export async function loadBodyModel(
  entry: BodyModelEntry,
  colors: ViewerColors,
  sites: readonly SensorSite[],
  signal: AbortSignal,
): Promise<LoadedModel> {
  const materials = createMaterials(colors)
  try {
    if (entry.file === null) {
      const root = buildPlaceholder(entry.profile, entry.id, materials)
      return prepareModel(entry, root, materials, sites)
    }
    const url = `${import.meta.env.BASE_URL}${entry.file}`
    const gltf = await withTimeout(
      new GLTFLoader().loadAsync(url),
      LOAD_TIMEOUT_MS,
      signal,
      (late) => disposeTree(late.scene),
    )
    const root = new Group()
    root.name = entry.id
    root.add(gltf.scene)
    try {
      return prepareModel(entry, root, materials, sites)
    } catch (error) {
      disposeTree(root)
      throw error
    }
  } catch (error) {
    materials.body.dispose()
    materials.patch.dispose()
    throw error
  }
}

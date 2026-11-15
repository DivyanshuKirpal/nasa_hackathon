import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  checkNodeNames,
  gltfNodeNames,
  readGlbJson,
} from '../../bodyview/modelContract.ts'
import { bodyModels } from '../bodyView.ts'

// Section 27: every manifest entry with status "delivered" has a file that
// parses, has every required node and is at most 4 MB. tools/check_body_model.py
// runs the full contract check on the same files.
const MAX_BYTES = 4_000_000
const delivered = bodyModels.filter((model) => model.status === 'delivered')

describe('delivered body models', () => {
  it('placeholders have no file and delivered models have one', () => {
    for (const model of bodyModels) {
      expect(model.file === null).toBe(model.status === 'placeholder')
    }
  })

  it.each(delivered.map((model) => [model.id, model.file ?? ''] as const))(
    '%s: %s parses, has every required node and is at most 4 MB',
    (_id, file) => {
      const path = join(process.cwd(), 'public', file)
      expect(existsSync(path)).toBe(true)
      expect(statSync(path).size).toBeLessThanOrEqual(MAX_BYTES)
      const bytes = readFileSync(path)
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      )
      const names = gltfNodeNames(readGlbJson(buffer))
      expect(checkNodeNames(names)).toEqual({ outcome: 'accept', missing: [] })
    },
  )
})

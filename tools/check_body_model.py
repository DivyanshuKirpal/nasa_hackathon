"""Check a delivered body model against the contract (ARCHITECTURE.md section 23.9).

Usage:
    python tools/check_body_model.py public/models/crew-a.glb --crew c1
    python tools/check_body_model.py path/to/crew-b.glb --height-cm 175

Reads the expected height from src/data/body-models.json (or --height-cm when
run outside the repository) and prints PASS, FAIL or WARN for each check with
the measured and expected values, in lines that can be forwarded to the
modeller. Exit code 1 if anything fails. Standard library only; it only reads
the file and never changes it.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST = REPO_ROOT / 'src' / 'data' / 'body-models.json'

REQUIRED_NODES = ['body', 'patch_shoulder_r_outer', 'sensor_chest', 'sensor_upper_back', 'sensor_forearm_l']
FORBIDDEN_EXTENSIONS = ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_mesh_quantization']
MAX_TRIANGLES = 60_000
WARN_BELOW_TRIANGLES = 20_000
MAX_BYTES = 4_000_000
HEIGHT_TOLERANCE_M = 0.01
GROUND_TOLERANCE_M = 0.01
MIDLINE_TOLERANCE_M = 0.03
PATCH_MIN_HEIGHT_SHARE = 0.65
IDENTITY = [1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0]


class Report:
    def __init__(self) -> None:
        self.lines: list[str] = []
        self.failures = 0

    def check(self, name: str, ok: bool, measured: str, expected: str) -> None:
        if not ok:
            self.failures += 1
        self.lines.append(f"{'PASS' if ok else 'FAIL'}  {name}: measured {measured}; expected {expected}")

    def warn(self, name: str, measured: str, expected: str) -> None:
        self.lines.append(f'WARN  {name}: measured {measured}; expected {expected}')


def read_glb(data: bytes) -> dict:
    if len(data) < 20:
        raise ValueError('too short to be a GLB file')
    magic, version, _length = struct.unpack_from('<4sII', data, 0)
    if magic != b'glTF':
        raise ValueError('not a GLB file (no glTF magic)')
    if version != 2:
        raise ValueError(f'GLB container version {version}, not 2')
    chunk_length, chunk_type = struct.unpack_from('<I4s', data, 12)
    if chunk_type != b'JSON':
        raise ValueError('the first chunk is not JSON')
    return json.loads(data[20:20 + chunk_length].decode('utf-8'))


def multiply(a: list[float], b: list[float]) -> list[float]:
    """Column-major 4x4 product a * b, as glTF stores matrices."""
    return [sum(a[k * 4 + row] * b[col * 4 + k] for k in range(4)) for col in range(4) for row in range(4)]


def local_matrix(node: dict) -> list[float]:
    if 'matrix' in node:
        return [float(value) for value in node['matrix']]
    tx, ty, tz = node.get('translation', [0, 0, 0])
    qx, qy, qz, qw = node.get('rotation', [0, 0, 0, 1])
    sx, sy, sz = node.get('scale', [1, 1, 1])
    return [
        (1 - 2 * (qy * qy + qz * qz)) * sx, 2 * (qx * qy + qz * qw) * sx, 2 * (qx * qz - qy * qw) * sx, 0,
        2 * (qx * qy - qz * qw) * sy, (1 - 2 * (qx * qx + qz * qz)) * sy, 2 * (qy * qz + qx * qw) * sy, 0,
        2 * (qx * qz + qy * qw) * sz, 2 * (qy * qz - qx * qw) * sz, (1 - 2 * (qx * qx + qy * qy)) * sz, 0,
        tx, ty, tz, 1,
    ]


def world_matrices(gltf: dict) -> list[list[float]]:
    nodes = gltf.get('nodes', [])
    parent = {child: index for index, node in enumerate(nodes) for child in node.get('children', [])}
    cache: dict[int, list[float]] = {}

    def world(index: int) -> list[float]:
        if index not in cache:
            mine = local_matrix(nodes[index])
            cache[index] = multiply(world(parent[index]), mine) if index in parent else mine
        return cache[index]

    return [world(index) for index in range(len(nodes))]


def transform(matrix: list[float], point: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = point
    return tuple(matrix[row] * x + matrix[4 + row] * y + matrix[8 + row] * z + matrix[12 + row] for row in range(3))


def mesh_bounds(gltf: dict, node_index: int, matrix: list[float]):
    """World-space bounds of a node's mesh from its POSITION accessor bounds."""
    node = gltf['nodes'][node_index]
    if 'mesh' not in node:
        return None
    lows, highs = [], []
    for primitive in gltf['meshes'][node['mesh']].get('primitives', []):
        accessor = gltf['accessors'][primitive['attributes']['POSITION']]
        low, high = accessor['min'], accessor['max']
        for corner in [(x, y, z) for x in (low[0], high[0]) for y in (low[1], high[1]) for z in (low[2], high[2])]:
            point = transform(matrix, corner)
            lows.append(point)
            highs.append(point)
    if not lows:
        return None
    return [min(p[axis] for p in lows) for axis in range(3)], [max(p[axis] for p in highs) for axis in range(3)]


def triangle_count(gltf: dict) -> int:
    total = 0
    for mesh in gltf.get('meshes', []):
        for primitive in mesh.get('primitives', []):
            if 'indices' in primitive:
                total += gltf['accessors'][primitive['indices']]['count'] // 3
            else:
                total += gltf['accessors'][primitive['attributes']['POSITION']]['count'] // 3
    return total


def is_identity(node: dict) -> bool:
    if 'matrix' in node:
        return all(math.isclose(a, b, abs_tol=1e-6) for a, b in zip(node['matrix'], IDENTITY))
    return (
        all(math.isclose(v, 0, abs_tol=1e-6) for v in node.get('translation', [0, 0, 0]))
        and all(math.isclose(a, b, abs_tol=1e-6) for a, b in zip(node.get('rotation', [0, 0, 0, 1]), [0, 0, 0, 1]))
        and all(math.isclose(v, 1, abs_tol=1e-6) for v in node.get('scale', [1, 1, 1]))
    )


def cm(value_m: float) -> str:
    return f'{value_m * 100:.1f} cm'


def check_model(data: bytes, height_cm: float) -> Report:
    report = Report()
    try:
        gltf = read_glb(data)
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as error:
        report.check('1. GLB container', False, str(error), 'a glTF 2.0 binary file')
        return report
    version = str(gltf.get('asset', {}).get('version'))
    report.check('1. GLB container and glTF version', version == '2.0', version, '2.0')

    nodes = gltf.get('nodes', [])
    index_of = {node.get('name'): index for index, node in enumerate(nodes)}
    for name in REQUIRED_NODES:
        report.check(f'2. node {name}', name in index_of, 'present' if name in index_of else 'missing', 'present')

    for key in ('skins', 'animations', 'cameras'):
        count = len(gltf.get(key, []))
        report.check(f'3. no {key}', count == 0, str(count), '0')
    used = [name for name in gltf.get('extensionsUsed', []) if name in FORBIDDEN_EXTENSIONS]
    report.check('3. no compression extensions', not used, ', '.join(used) or 'none', 'none')

    moved = [node.get('name', f'#{index}') for index, node in enumerate(nodes) if 'mesh' in node and not is_identity(node)]
    shown = ', '.join(moved[:5]) + (f' and {len(moved) - 5} more' if len(moved) > 5 else '')
    report.check('4. mesh nodes have identity transforms', not moved, shown or 'all identity', 'all identity')

    matrices = world_matrices(gltf)
    expected_height = height_cm / 100
    body_bounds = mesh_bounds(gltf, index_of['body'], matrices[index_of['body']]) if 'body' in index_of else None
    if body_bounds is None:
        report.check('5. body geometry', False, 'no mesh on body', 'a mesh named body')
    else:
        low, high = body_bounds
        height = high[1] - low[1]
        report.check('5. height', abs(height - expected_height) <= HEIGHT_TOLERANCE_M, cm(height), f'{height_cm:.1f} cm within 1 cm')
        report.check('5. lowest point', abs(low[1]) <= GROUND_TOLERANCE_M, cm(low[1]), '0 cm within 1 cm')
        midline = (low[0] + high[0]) / 2
        report.check('5. midline', abs(midline) <= MIDLINE_TOLERANCE_M, f'x = {cm(midline)}', 'x = 0 cm within 3 cm')

    triangles = triangle_count(gltf)
    report.check('6. triangles', triangles <= MAX_TRIANGLES, f'{triangles:,}', f'at most {MAX_TRIANGLES:,}')
    if triangles < WARN_BELOW_TRIANGLES:
        report.warn('6. triangles', f'{triangles:,}', f'about {WARN_BELOW_TRIANGLES:,} or more')
    report.check('6. file size', len(data) <= MAX_BYTES, f'{len(data) / 1e6:.2f} MB', 'at most 4 MB')

    def position(name: str):
        return transform(matrices[index_of[name]], (0, 0, 0)) if name in index_of else None

    chest, back, forearm = position('sensor_chest'), position('sensor_upper_back'), position('sensor_forearm_l')
    if chest and back:
        report.check('7. faces +Z (chest sensor in front of back sensor)', chest[2] > back[2], f'chest z {cm(chest[2])}, back z {cm(back[2])}', 'chest z larger')
    patch_bounds = mesh_bounds(gltf, index_of['patch_shoulder_r_outer'], matrices[index_of['patch_shoulder_r_outer']]) if 'patch_shoulder_r_outer' in index_of else None
    if patch_bounds:
        center = [(patch_bounds[0][axis] + patch_bounds[1][axis]) / 2 for axis in range(3)]
        report.check('7. shoulder patch on the right side', center[0] < 0, f'x = {cm(center[0])}', 'x below 0')
        report.check('7. shoulder patch height', center[1] > PATCH_MIN_HEIGHT_SHARE * expected_height, f'y = {cm(center[1])}', f'above {cm(PATCH_MIN_HEIGHT_SHARE * expected_height)}')
    if forearm:
        report.check('7. left forearm sensor on the left side', forearm[0] > 0, f'x = {cm(forearm[0])}', 'x above 0')
    return report


def expected_height_cm(crew_id: str) -> float:
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    for model in manifest['models']:
        if model['crewId'] == crew_id:
            return float(model['profile']['heightCm'])
    raise SystemExit(f'No body model for crew member {crew_id} in {MANIFEST}')


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('file', help='the .glb file to check')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--crew', help='crew id whose profile height to expect, e.g. c1')
    group.add_argument('--height-cm', type=float, help='expected height when run outside the repository')
    args = parser.parse_args(argv)
    path = Path(args.file)
    height = args.height_cm if args.height_cm is not None else expected_height_cm(args.crew)
    report = check_model(path.read_bytes(), height)
    print(f'Checking {path.name} against the body model contract (ARCHITECTURE.md section 23.9), expected height {height:.1f} cm')
    for line in report.lines:
        print(line)
    print('Result: PASS' if report.failures == 0 else f'Result: FAIL ({report.failures} failed)')
    return 0 if report.failures == 0 else 1


if __name__ == '__main__':
    sys.exit(main())

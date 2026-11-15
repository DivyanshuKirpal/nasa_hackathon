import io
import json
import struct
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_body_model as checker  # noqa: E402


def glb(document: dict) -> bytes:
    """A tiny GLB built in memory: header and JSON chunk, no binary data needed."""
    payload = json.dumps(document).encode('utf-8')
    payload += b' ' * (-len(payload) % 4)
    header = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(payload))
    return header + struct.pack('<I4s', len(payload), b'JSON') + payload


def box(low, high, count=3000):
    return {'componentType': 5126, 'type': 'VEC3', 'count': count, 'min': low, 'max': high}


def contract_model(**changes) -> dict:
    """A document that meets the contract for a 175 cm body."""
    document = {
        'asset': {'version': '2.0'},
        'nodes': [
            {'name': 'body', 'mesh': 0},
            {'name': 'patch_shoulder_r_outer', 'mesh': 1},
            {'name': 'sensor_chest', 'translation': [0, 1.26, 0.11]},
            {'name': 'sensor_upper_back', 'translation': [0, 1.33, -0.10]},
            {'name': 'sensor_forearm_l', 'translation': [0.36, 1.05, 0]},
        ],
        'meshes': [
            {'primitives': [{'attributes': {'POSITION': 0}, 'indices': 1}]},
            {'primitives': [{'attributes': {'POSITION': 2}}]},
        ],
        'accessors': [
            box([-0.55, 0.0, -0.15], [0.55, 1.75, 0.15]),
            {'componentType': 5125, 'type': 'SCALAR', 'count': 120_000},
            box([-0.27, 1.36, -0.05], [-0.20, 1.45, 0.05], count=300),
        ],
    }
    document.update(changes)
    return document


class CheckBodyModelTests(unittest.TestCase):
    def failures(self, document: dict, height_cm: float = 175) -> list[str]:
        report = checker.check_model(glb(document), height_cm)
        return [line for line in report.lines if line.startswith('FAIL')]

    def test_a_contract_model_passes(self):
        self.assertEqual(self.failures(contract_model()), [])

    def test_missing_nodes_fail_by_name(self):
        document = contract_model()
        document['nodes'][1]['name'] = 'REGION_SHOULDER_RIGHT_DELTOID'
        failed = self.failures(document)
        self.assertTrue(any('node patch_shoulder_r_outer' in line for line in failed), failed)

    def test_skins_animations_and_compression_fail(self):
        failed = self.failures(contract_model(skins=[{}], animations=[{}], extensionsUsed=['KHR_draco_mesh_compression']))
        self.assertEqual(sum('3. no' in line for line in failed), 3, failed)

    def test_wrong_height_and_moved_mesh_fail_with_values(self):
        document = contract_model()
        document['accessors'][0] = box([-0.55, 0.0, -0.15], [0.55, 1.80, 0.15])
        document['nodes'][0]['translation'] = [0, 0.02, 0]
        failed = self.failures(document)
        self.assertTrue(any('4. mesh nodes have identity transforms' in line and 'body' in line for line in failed), failed)
        self.assertTrue(any('5. height: measured 180.0 cm' in line for line in failed), failed)
        self.assertTrue(any('5. lowest point: measured 2.0 cm' in line for line in failed), failed)

    def test_too_many_triangles_and_backwards_body_fail(self):
        document = contract_model()
        document['accessors'][1]['count'] = 3 * 70_000
        document['nodes'][2]['translation'] = [0, 1.26, -0.2]
        failed = self.failures(document)
        self.assertTrue(any('6. triangles' in line for line in failed), failed)
        self.assertTrue(any('7. faces +Z' in line for line in failed), failed)

    def test_few_triangles_only_warn(self):
        document = contract_model()
        document['accessors'][1]['count'] = 3 * 10_000
        report = checker.check_model(glb(document), 175)
        self.assertEqual(report.failures, 0)
        self.assertTrue(any(line.startswith('WARN  6. triangles') for line in report.lines))

    def test_not_a_glb(self):
        report = checker.check_model(b'not a model at all, just text', 175)
        self.assertEqual(report.failures, 1)

    def test_parent_transforms_are_followed(self):
        document = contract_model()
        document['nodes'].append({'name': 'group', 'children': [4], 'translation': [-0.8, 0, 0]})
        failed = self.failures(document)
        self.assertTrue(any('7. left forearm sensor on the left side' in line for line in failed), failed)

    def test_main_reads_the_height_from_the_manifest_and_sets_the_exit_code(self):
        with tempfile.TemporaryDirectory() as folder:
            good = Path(folder) / 'crew-a.glb'
            good.write_bytes(glb(contract_model()))
            bad = Path(folder) / 'crew-b.glb'
            bad.write_bytes(glb(contract_model(skins=[{}])))
            with redirect_stdout(io.StringIO()) as output:
                self.assertEqual(checker.main([str(good), '--crew', 'c1']), 0)
                self.assertEqual(checker.main([str(bad), '--height-cm', '175']), 1)
            self.assertIn('expected height 175.0 cm', output.getvalue())
            self.assertIn('Result: FAIL (1 failed)', output.getvalue())


if __name__ == '__main__':
    unittest.main()

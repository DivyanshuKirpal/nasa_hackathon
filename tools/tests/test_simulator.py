"""Tests for the seed simulator. Run: python -m unittest discover -s tools/tests"""

import gzip
import json
import random
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'simulator'))

import generate  # noqa: E402
import model  # noqa: E402
import scenarios  # noqa: E402


class RoundingTests(unittest.TestCase):
    def test_decimals_of_step(self):
        self.assertEqual(model.decimals_of(1), 0)
        self.assertEqual(model.decimals_of(0.1), 1)
        self.assertEqual(model.decimals_of(0.25), 2)

    def test_round_to_step_has_no_float_leftovers(self):
        self.assertEqual(model.round_to_step(6.74, 0.25), 6.75)
        self.assertEqual(model.round_to_step(36.94, 0.1), 36.9)
        self.assertEqual(model.round_to_step(61.6, 1), 62)

    def test_clip(self):
        self.assertEqual(model.clip(5, 0, 3), 3)
        self.assertEqual(model.clip(-1, 0, 3), 0)
        self.assertEqual(model.clip(2, 0, 3), 2)


class ModelTests(unittest.TestCase):
    def setUp(self):
        self.indicators = model.load_indicators()

    def test_every_indicator_has_means_and_noise(self):
        for crew in model.CREW:
            for indicator in model.INDICATOR_ORDER:
                self.assertIn(indicator, model.PERSONAL_MEANS[crew['id']])
                self.assertIn(indicator, model.NOISE_SD)
        self.assertEqual(set(model.INDICATOR_ORDER), set(self.indicators))

    def test_values_stay_in_the_input_range_and_on_the_step(self):
        rng = random.Random(1)
        for indicator, definition in self.indicators.items():
            for day in (1, 40, 200):
                value = model.daily_value(rng, 'c1', indicator, day, definition, effect=1000)
                self.assertLessEqual(value, definition['inputMax'])
                value = model.daily_value(rng, 'c1', indicator, day, definition)
                self.assertGreaterEqual(value, definition['inputMin'])
                self.assertEqual(value, model.round_to_step(value, definition['step']))

    def test_drift_follows_the_documented_shape(self):
        self.assertEqual(model.adaptation_drift('body_temp', 0), 0)
        self.assertAlmostEqual(model.adaptation_drift('body_temp', 75), 1.0)
        self.assertAlmostEqual(model.adaptation_drift('body_temp', 300), 1.0)
        self.assertAlmostEqual(model.adaptation_drift('systolic_bp', 30), -8.0)
        self.assertAlmostEqual(model.adaptation_drift('diastolic_bp', 60), -9.0)
        self.assertEqual(model.adaptation_drift('sleep_hours', 50), 0)

    def test_weekly_indicators_are_due_every_seventh_day(self):
        weekly = self.indicators['near_vision']
        self.assertEqual([day for day in range(1, 22) if model.is_due(weekly, day)], [7, 14, 21])
        self.assertTrue(model.is_due(self.indicators['sleep_hours'], 5))

    def test_crew_names_are_fictional(self):
        for crew in model.CREW:
            self.assertRegex(crew['name'], r'^Crew member [A-Z]$')

    def test_ordinary_cabin_co2_stays_under_the_limit(self):
        rng = random.Random(2)
        self.assertTrue(all(model.cabin_co2(rng) <= 2.8 for _ in range(2000)))


class ScenarioTests(unittest.TestCase):
    def setUp(self):
        self.indicators = model.load_indicators()

    def build(self, scenario_id, seed=42):
        return generate.build_scenario(scenarios.by_id(scenario_id), seed, self.indicators)

    def test_same_seed_gives_identical_output(self):
        for scenario in scenarios.SCENARIOS:
            first = generate.to_text(self.build(scenario.scenario_id))
            second = generate.to_text(self.build(scenario.scenario_id))
            self.assertEqual(first, second)

    def test_a_different_seed_changes_the_readings(self):
        self.assertNotEqual(self.build('sleep-debt', 42)['readings'], self.build('sleep-debt', 43)['readings'])

    def test_scenario_file_shape(self):
        document = self.build('sleep-debt')
        self.assertIs(document['simulated'], True)
        self.assertEqual(document['schemaVersion'], 1)
        self.assertEqual(document['generator'], 'tools/simulator seed=42')
        self.assertEqual([member['id'] for member in document['crew']], ['c1', 'c2', 'c3'])
        self.assertEqual(document['expectedAlerts'], [{'crewId': 'c1', 'ruleId': 'R-SLEEP-01'}])
        self.assertEqual(document['expectedInsights'], [])
        self.assertIsNone(document['basedOn'])

    def test_history_stops_the_day_before_the_mission_day(self):
        document = self.build('baseline-healthy')
        mission_day = document['missionDay']
        self.assertEqual(max(reading['day'] for reading in document['readings']), mission_day - 1)
        self.assertEqual(len(document['context']), mission_day)
        self.assertEqual(document['context'][-1]['day'], mission_day)

    def test_sleep_debt_has_five_short_nights_for_crew_a_only(self):
        document = self.build('sleep-debt')
        mission_day = document['missionDay']

        def nights(crew_id):
            return {
                reading['day']: reading['value']
                for reading in document['readings']
                if reading['crewId'] == crew_id and reading['indicator'] == 'sleep_hours'
            }

        crew_a = nights('c1')
        short = [day for day in range(mission_day - 5, mission_day) if crew_a[day] < 5.5]
        self.assertEqual(len(short), 5)
        crew_b = nights('c2')
        self.assertTrue(all(crew_b[day] > 5.0 for day in range(mission_day - 5, mission_day)))

    def test_low_glucose_logs_one_low_reading_this_morning(self):
        document = self.build('low-glucose')
        today = [reading for reading in document['readings'] if reading['day'] == document['missionDay']]
        self.assertEqual(len(today), 1)
        self.assertEqual((today[0]['crewId'], today[0]['indicator'], today[0]['value']), ('c1', 'blood_glucose', 62))

    def test_solar_storm_marks_only_the_mission_day(self):
        document = self.build('solar-storm')
        flagged = [sample['day'] for sample in document['context'] if sample['solar_event']]
        self.assertEqual(flagged, [document['missionDay']])
        self.assertEqual(document['environmentId'], 'leo_station')

    def test_index_lists_every_scenario_and_the_default(self):
        index = generate.build_index()
        self.assertEqual(index['defaultScenarioId'], 'sleep-debt')
        self.assertEqual(
            [entry['scenarioId'] for entry in index['scenarios']],
            [scenario.scenario_id for scenario in scenarios.SCENARIOS],
        )

    def test_to_text_is_valid_json_with_one_reading_per_line(self):
        document = self.build('early-mission')
        text = generate.to_text(document)
        self.assertEqual(json.loads(text), document)
        self.assertTrue(text.endswith('}\n'))
        self.assertIn('\n    {"crewId": "c1", "indicator": "sleep_hours"', text)


class DonkiLookupTests(unittest.TestCase):
    def test_finds_a_cached_sep_record_by_id(self):
        with tempfile.TemporaryDirectory() as folder:
            sep_dir = Path(folder) / 'SEP'
            sep_dir.mkdir()
            records = [{'sepID': 'TEST-SEP-001', 'eventTime': '2000-01-01T00:00Z', 'link': 'https://example.org/'}]
            with gzip.open(sep_dir / '2000.json.gz', 'wt', encoding='utf-8') as handle:
                json.dump(records, handle)
            self.assertEqual(generate.find_donki_event('TEST-SEP-001', Path(folder)), records[0])
            self.assertIsNone(generate.find_donki_event('MISSING', Path(folder)))

    def test_space_weather_file_says_so_when_no_real_event_is_recorded(self):
        with tempfile.TemporaryDirectory() as folder:
            document = generate.build_space_weather(Path(folder))
        self.assertEqual(document['events'], [])
        self.assertIsNone(document['retrievedAt'])
        self.assertIn('No real DONKI event', document['note'])


if __name__ == '__main__':
    unittest.main()

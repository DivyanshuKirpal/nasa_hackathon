"""Tests for the DONKI downloader's helpers. Run: python -m unittest discover -s ml/tests"""

import datetime as dt
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import fetch_donki  # noqa: E402

API_NASA = next(service for service in fetch_donki.SERVICES if service['name'] == 'api-nasa-gov')
CCMC = fetch_donki.SERVICES[0]


class ParseRecordsTests(unittest.TestCase):
    def test_a_json_list_is_returned_as_records(self):
        body = b'[{"sepID": "A"}, {"sepID": "B"}]'
        self.assertEqual(fetch_donki.parse_records(body), [{'sepID': 'A'}, {'sepID': 'B'}])

    def test_an_empty_body_means_no_records(self):
        self.assertEqual(fetch_donki.parse_records(b''), [])
        self.assertEqual(fetch_donki.parse_records(b'  \n'), [])

    def test_anything_but_a_list_is_refused(self):
        with self.assertRaises(ValueError):
            fetch_donki.parse_records(b'{"error": "nope"}')


class RangeTests(unittest.TestCase):
    def test_year_ranges_cut_the_first_and_last_year(self):
        ranges = fetch_donki.year_ranges(dt.date(2010, 3, 5), dt.date(2012, 2, 10))
        self.assertEqual(
            ranges,
            [
                (2010, dt.date(2010, 3, 5), dt.date(2010, 12, 31)),
                (2011, dt.date(2011, 1, 1), dt.date(2011, 12, 31)),
                (2012, dt.date(2012, 1, 1), dt.date(2012, 2, 10)),
            ],
        )

    def test_month_ranges_cover_a_year_without_gaps(self):
        ranges = fetch_donki.month_ranges(dt.date(2024, 1, 1), dt.date(2024, 12, 31))
        self.assertEqual(len(ranges), 12)
        self.assertEqual(ranges[1], (dt.date(2024, 2, 1), dt.date(2024, 2, 29)))
        self.assertEqual(ranges[-1], (dt.date(2024, 12, 1), dt.date(2024, 12, 31)))
        for (_, last), (first, _) in zip(ranges, ranges[1:]):
            self.assertEqual(first, last + dt.timedelta(days=1))


class UrlTests(unittest.TestCase):
    def test_ccmc_urls_carry_no_key(self):
        url = fetch_donki.build_url(CCMC, 'FLR', dt.date(2024, 1, 1), dt.date(2024, 12, 31), key=None)
        self.assertEqual(
            url, 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-01-01&endDate=2024-12-31'
        )

    def test_the_key_comes_from_the_environment_and_is_never_recorded(self):
        with mock.patch.dict(os.environ, {'NASA_API_KEY': 'secret-value-123'}):
            self.assertEqual(fetch_donki.api_key(), 'secret-value-123')
            live = fetch_donki.build_url(API_NASA, 'SEP', dt.date(2024, 1, 1), dt.date(2024, 1, 31), key=None)
            recorded = fetch_donki.redacted_url(API_NASA, 'SEP', dt.date(2024, 1, 1), dt.date(2024, 1, 31))
        self.assertIn('api_key=secret-value-123', live)
        self.assertNotIn('secret-value-123', recorded)
        self.assertIn('api_key=REDACTED', recorded)

    def test_without_a_key_the_shared_demo_key_is_used(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertEqual(fetch_donki.api_key(), 'DEMO_KEY')


class RecordIdTests(unittest.TestCase):
    def test_each_type_has_its_own_id_field(self):
        self.assertEqual(fetch_donki.record_id('FLR', {'flrID': 'F1'}), 'F1')
        self.assertEqual(fetch_donki.record_id('CME', {'activityID': 'C1'}), 'C1')
        self.assertEqual(fetch_donki.record_id('SEP', {'sepID': 'S1'}), 'S1')


if __name__ == '__main__':
    unittest.main()

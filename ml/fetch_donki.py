"""Download NASA DONKI space weather records (FLR, CME, SEP) year by year.

Standard library only. Writes gzip JSON files and a meta.json:

    ml/data/raw/donki/<TYPE>/<YEAR>.json.gz
    ml/data/raw/donki/meta.json

Usage:
    python ml/fetch_donki.py --start 2010-01-01
    python ml/fetch_donki.py --start 2023-01-01 --types SEP

The script tries the DONKI addresses in the order of ARCHITECTURE.md section 25
and records which one worked. It is resumable: years already on disk are
skipped unless --force is given, and a refused year is retried month by month.

API key: api.nasa.gov needs a key. Set it privately in your own terminal:

    PowerShell:  $env:NASA_API_KEY = "your key"
    bash/zsh:    export NASA_API_KEY="your key"

The key is read from the environment only. It is never printed, never written
to meta.json and never committed. Without it the shared DEMO_KEY is used,
which is heavily rate limited.

DONKI is experimental research information from NASA's Community Coordinated
Modeling Center (CCMC). Official U.S. space weather forecasts come from NOAA's
Space Weather Prediction Center.
"""

from __future__ import annotations

import argparse
import datetime as dt
import gzip
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RECORD_TYPES = ('FLR', 'CME', 'SEP')
OUT_DIR = Path(__file__).resolve().parent / 'data' / 'raw' / 'donki'
USER_AGENT = 'crew-health-check-donki-fetch'
REDACTED = 'REDACTED'

# Tried in this order (section 25). `key_param` is set only where a key is needed.
SERVICES = (
    {'name': 'ccmc-donki-api', 'base': 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/', 'key_param': None},
    {'name': 'kauai-ws', 'base': 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/', 'key_param': None},
    {'name': 'api-nasa-gov', 'base': 'https://api.nasa.gov/DONKI/', 'key_param': 'api_key'},
)


class RateLimited(Exception):
    """The service refused the request because of a rate limit."""


def api_key() -> str:
    return os.environ.get('NASA_API_KEY', '').strip() or 'DEMO_KEY'


def build_url(service: dict, record_type: str, start: dt.date, end: dt.date, key: str | None) -> str:
    params = {'startDate': start.isoformat(), 'endDate': end.isoformat()}
    if service['key_param']:
        params[service['key_param']] = key if key is not None else api_key()
    return f"{service['base']}{record_type}?{urllib.parse.urlencode(params)}"


def redacted_url(service: dict, record_type: str, start: dt.date, end: dt.date) -> str:
    """The query as recorded in meta.json: the key value never appears."""
    return build_url(service, record_type, start, end, key=REDACTED)


def parse_records(body: bytes) -> list:
    """DONKI answers with a JSON list; an empty body means no records."""
    text = body.decode('utf-8').strip()
    if not text:
        return []
    data = json.loads(text)
    if not isinstance(data, list):
        raise ValueError('expected a JSON list of records')
    return data


def fetch(url: str, timeout: float) -> list:
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return parse_records(response.read())
    except urllib.error.HTTPError as error:
        if error.code == 429:
            raise RateLimited() from error
        raise


def year_ranges(start: dt.date, end: dt.date) -> list[tuple[int, dt.date, dt.date]]:
    ranges = []
    for year in range(start.year, end.year + 1):
        first = max(start, dt.date(year, 1, 1))
        last = min(end, dt.date(year, 12, 31))
        ranges.append((year, first, last))
    return ranges


def month_ranges(first: dt.date, last: dt.date) -> list[tuple[dt.date, dt.date]]:
    ranges = []
    cursor = first
    while cursor <= last:
        next_month = dt.date(cursor.year + (cursor.month == 12), cursor.month % 12 + 1, 1)
        ranges.append((cursor, min(last, next_month - dt.timedelta(days=1))))
        cursor = next_month
    return ranges


def record_id(record_type: str, record: dict) -> str:
    key = {'FLR': 'flrID', 'CME': 'activityID', 'SEP': 'sepID'}[record_type]
    return str(record.get(key, ''))


def find_service(timeout: float, log) -> dict | None:
    """Returns the first service that answers a small SEP query, or None."""
    probe_start, probe_end = dt.date(2024, 5, 1), dt.date(2024, 5, 31)
    for service in SERVICES:
        url = build_url(service, 'SEP', probe_start, probe_end, key=None)
        try:
            fetch(url, timeout)
            log(f"address works: {service['name']} ({service['base']})")
            return service
        except RateLimited:
            log(f"{service['name']}: rate limited (HTTP 429)")
        except (urllib.error.URLError, OSError, ValueError) as error:
            log(f"{service['name']}: {type(error).__name__}: {getattr(error, 'reason', error)}")
    return None


def fetch_year(service: dict, record_type: str, first: dt.date, last: dt.date, timeout: float, pause: float, queries: list) -> list:
    """One year in one request; if that is refused, month by month."""
    try:
        records = fetch(build_url(service, record_type, first, last, key=None), timeout)
        queries.append({'url': redacted_url(service, record_type, first, last), 'records': len(records)})
        return records
    except RateLimited:
        raise
    except (urllib.error.URLError, OSError, ValueError):
        records = []
        for month_first, month_last in month_ranges(first, last):
            time.sleep(pause)
            part = fetch(build_url(service, record_type, month_first, month_last, key=None), timeout)
            queries.append({'url': redacted_url(service, record_type, month_first, month_last), 'records': len(part)})
            records.extend(part)
        return records


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--start', default='2010-01-01', help='first date, YYYY-MM-DD')
    parser.add_argument('--end', default=None, help='last date, YYYY-MM-DD (default: last full month)')
    parser.add_argument('--types', nargs='+', default=list(RECORD_TYPES), choices=RECORD_TYPES)
    parser.add_argument('--out', default=str(OUT_DIR))
    parser.add_argument('--pause', type=float, default=1.0, help='seconds between requests')
    parser.add_argument('--timeout', type=float, default=60.0)
    parser.add_argument('--force', action='store_true', help='download again even if a year is on disk')
    args = parser.parse_args(argv)

    def log(message: str) -> None:
        print(message, flush=True)

    start = dt.date.fromisoformat(args.start)
    today = dt.datetime.now(dt.timezone.utc).date()
    end = dt.date.fromisoformat(args.end) if args.end else today.replace(day=1) - dt.timedelta(days=1)
    out_dir = Path(args.out)

    service = find_service(args.timeout, log)
    if service is None:
        log('No DONKI address answered. Nothing was downloaded.')
        log('See ARCHITECTURE.md section 25 for the fallback, and docs/PROGRESS.md.')
        return 2

    meta_path = out_dir / 'meta.json'
    meta = json.loads(meta_path.read_text(encoding='utf-8')) if meta_path.exists() else {}
    meta.setdefault('source', 'NASA CCMC DONKI')
    meta.setdefault('note', 'Experimental research information; official U.S. forecasts come from NOAA SWPC.')
    meta['apiBase'] = service['base']
    meta['service'] = service['name']
    meta['usesPersonalKey'] = bool(service['key_param']) and api_key() != 'DEMO_KEY'
    meta.setdefault('files', {})
    meta.setdefault('queries', [])

    complete = True
    for record_type in args.types:
        for year, first, last in year_ranges(start, end):
            name = f'{record_type}/{year}.json.gz'
            path = out_dir / record_type / f'{year}.json.gz'
            if path.exists() and not args.force:
                continue
            time.sleep(args.pause)
            queries: list = []
            try:
                records = fetch_year(service, record_type, first, last, args.timeout, args.pause, queries)
            except RateLimited:
                log(f'Rate limited at {name}. Run the command again later, or set NASA_API_KEY.')
                complete = False
                break
            except (urllib.error.URLError, OSError, ValueError) as error:
                log(f'{name}: failed ({type(error).__name__}); stopping.')
                complete = False
                break
            unique = {record_id(record_type, record): record for record in records}
            ordered = [unique[key] for key in sorted(unique)]
            path.parent.mkdir(parents=True, exist_ok=True)
            # mtime=0 keeps the gzip bytes identical for identical data.
            with gzip.GzipFile(filename='', mode='wb', fileobj=path.open('wb'), mtime=0) as handle:
                handle.write(json.dumps(ordered, sort_keys=True, separators=(',', ':')).encode('utf-8'))
            meta['files'][name] = {'from': first.isoformat(), 'to': last.isoformat(), 'records': len(ordered)}
            meta['queries'].extend(queries)
            log(f'{name}: {len(ordered)} records')
        if not complete:
            break

    meta['retrievedAt'] = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    meta['requested'] = {'start': start.isoformat(), 'end': end.isoformat(), 'types': list(args.types)}
    meta['complete'] = complete and all(
        f'{record_type}/{year}.json.gz' in meta['files']
        for record_type in RECORD_TYPES
        for year, _first, _last in year_ranges(start, end)
    )
    meta['recordCounts'] = {
        record_type: sum(info['records'] for name, info in meta['files'].items() if name.startswith(record_type + '/'))
        for record_type in RECORD_TYPES
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    meta_path.write_text(json.dumps(meta, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    log(f"meta.json written. complete={meta['complete']} counts={meta['recordCounts']}")
    return 0 if complete else 1


if __name__ == '__main__':
    sys.exit(main())

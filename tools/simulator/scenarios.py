"""Scenario definitions (ARCHITECTURE.md section 24.3).

A scenario is a mission day, an environment, and a few scripted changes on top
of the ordinary simulated history. `expected_alerts` is what the app's rules
must show at 09:00 on the mission day; the golden tests check it exactly.

Seed histories run to the day before the mission day, so the crew member still
has today's check-in to do. A scenario adds readings for today only where its
story needs them.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Scenario:
    scenario_id: str
    title: str
    mission_day: int
    environment_id: str
    # (crew id, indicator, days before the mission day) -> amount added to the value
    effects: dict = field(default_factory=dict)
    # Indicators whose noise is reduced on effect days, so the story is not blurred.
    quiet_effects: bool = True
    # Readings logged this morning: (crew id, indicator, value)
    today_readings: tuple = ()
    solar_event_today: bool = False
    # DONKI id of the real event this scenario takes its timing from, or None.
    donki_event_id: str | None = None
    expected_alerts: tuple = ()


def _sleep_debt_effects() -> dict:
    # Five short nights for crew member A, ending last night.
    return {('c1', 'sleep_hours', days_before): -1.7 for days_before in range(1, 6)}


def _fever_effects() -> dict:
    # Temperature climbs over the last two days; resting heart rate rises with it.
    return {
        ('c1', 'body_temp', 2): 0.9,
        ('c1', 'body_temp', 1): 1.6,
        ('c1', 'heart_rate', 2): 8.0,
        ('c1', 'heart_rate', 1): 16.0,
    }


SCENARIOS = (
    Scenario(
        scenario_id='baseline-healthy',
        title='An ordinary day: nothing unusual',
        mission_day=90,
        environment_id='lunar_surface',
    ),
    Scenario(
        scenario_id='sleep-debt',
        title='Sleep debt building over five nights',
        mission_day=142,
        environment_id='mars_transit',
        effects=_sleep_debt_effects(),
        expected_alerts=(('c1', 'R-SLEEP-01'),),
    ),
    Scenario(
        scenario_id='solar-storm',
        title='A solar particle event starts today',
        mission_day=120,
        # Starts at the station: 0 s delay, reply estimate 5 min (section 14).
        environment_id='leo_station',
        solar_event_today=True,
        # No real DONKI event yet: no DONKI address answered on 14 November 2026.
        # Set this to a real SEP id once ml/data/raw/donki holds the records.
        donki_event_id=None,
        expected_alerts=(
            ('c1', 'R-RAD-01'),
            ('c2', 'R-RAD-01'),
            ('c3', 'R-RAD-01'),
        ),
    ),
    Scenario(
        scenario_id='fever',
        title='Temperature climbing over two days',
        mission_day=100,
        environment_id='mars_surface',
        effects=_fever_effects(),
        expected_alerts=(('c1', 'R-TEMP-02'),),
    ),
    Scenario(
        scenario_id='low-glucose',
        title='One low fasting blood sugar reading today',
        mission_day=75,
        environment_id='mars_transit',
        today_readings=(('c1', 'blood_glucose', 62),),
        expected_alerts=(('c1', 'R-GLU-02'),),
    ),
    Scenario(
        scenario_id='early-mission',
        title='Mission day 4: still learning your normal',
        mission_day=4,
        environment_id='leo_station',
    ),
)

DEFAULT_SCENARIO_ID = 'sleep-debt'


def by_id(scenario_id: str) -> Scenario:
    for scenario in SCENARIOS:
        if scenario.scenario_id == scenario_id:
            return scenario
    raise KeyError(f'unknown scenario: {scenario_id}')

import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/index.ts'
import { selectEvaluation } from '../../../store/selectors.ts'
import { loadScenario, renderApp } from '../../../test/helpers.tsx'

describe('Home with the sleep-debt scenario', () => {
  it('lists the sleep alert and shows Head as Watch', () => {
    loadScenario('sleep-debt')
    renderApp('/')

    const alerts = screen.getByRole('region', { name: 'Active alerts' })
    expect(
      within(alerts).getByText('Sleep has been low for several nights'),
    ).toBeInTheDocument()
    expect(alerts.querySelector('[data-rule-id="R-SLEEP-01"]')).not.toBeNull()
    expect(
      screen.getByRole('button', { name: 'Head: Watch' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Chest: Good' }),
    ).toBeInTheDocument()
  })

  it("shows today's check-in as not started, with a way in", () => {
    loadScenario('sleep-debt')
    renderApp('/')

    const today = screen.getByRole('region', { name: 'Today' })
    expect(within(today).getByText('Check-in: 0 of 8 done')).toBeInTheDocument()
    expect(
      within(today).getByRole('link', { name: 'Start check-in' }),
    ).toHaveAttribute('href', '/check-in')
  })

  it('names every body region as a button with its status word', () => {
    loadScenario('sleep-debt')
    renderApp('/')

    const map = screen.getByRole('group', { name: 'Body map' })
    const names = within(map)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))
    expect(names).toEqual([
      'Eyes: Good',
      'Head: Watch',
      'Chest: Good',
      'Abdomen: Good',
      'Legs and arms: Good',
      'Skin: Good',
      'Environment: Good',
    ])
  })

  it('gives each status row a spoken name with clear breaks', () => {
    loadScenario('sleep-debt')
    renderApp('/')

    const list = screen.getByRole('region', { name: 'Status by area' })
    expect(
      within(list).getByRole('button', {
        name: 'Head: Watch. Sleep has been low for several nights',
      }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the readings of an area chosen on the map', async () => {
    const user = userEvent.setup()
    loadScenario('sleep-debt')
    renderApp('/')

    await user.click(screen.getByRole('button', { name: 'Head: Watch' }))
    const list = screen.getByRole('region', { name: 'Status by area' })
    expect(within(list).getByText(/Sleep last night:/)).toBeInTheDocument()
    expect(within(list).getByText(/Your normal: 6\.\d h/)).toBeInTheDocument()
  })
})

describe('Home with other scenarios', () => {
  it('turns Abdomen to Act after a temperature 2.5 °C above the baseline', () => {
    loadScenario('baseline-healthy')
    const baseline = selectEvaluation(useAppStore.getState()).baselines
      .body_temp
    if (!baseline?.ready)
      throw new Error('expected a ready temperature baseline')
    const high = Math.round((baseline.center + 2.5) * 10) / 10

    expect(useAppStore.getState().addReading('body_temp', high)).toEqual({
      ok: true,
    })
    renderApp('/')

    expect(
      screen.getByRole('button', { name: 'Abdomen: Act' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Active alerts' })).getByText(
        'Temperature is well above your normal',
      ),
    ).toBeInTheDocument()
  })

  it('shows learning-your-normal text early in the mission', async () => {
    const user = userEvent.setup()
    loadScenario('early-mission')
    renderApp('/')

    await user.click(screen.getByRole('button', { name: 'Chest: Good' }))
    // Day 4: the 3 most recent days are left out of a baseline, so 1 day counts.
    expect(
      screen.getAllByText(/Learning your normal \(1 of 7\)/).length,
    ).toBeGreaterThan(0)
  })

  it('shows missing data next to an alert, and Environment as No data without a sample', () => {
    loadScenario('low-glucose')
    const { context } = useAppStore.getState()
    // Drop today's habitat sample: the feeds are now missing, not normal.
    useAppStore.setState({ context: context.slice(0, -1) })
    renderApp('/')

    expect(
      screen.getByRole('button', { name: 'Abdomen: Act' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Environment: No data' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Missing: today's habitat sample"),
    ).toBeInTheDocument()
    expect(screen.getByText(/Habitat feed:/)).toBeInTheDocument()
  })

  it('says Good for Skin means only "no active alert"', async () => {
    const user = userEvent.setup()
    loadScenario('baseline-healthy')
    renderApp('/')

    await user.click(screen.getByRole('button', { name: 'Skin: Good' }))
    expect(
      screen.getByText(/It does not show that your skin is healthy/),
    ).toBeInTheDocument()
  })
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../../store/index.ts'
import { loadScenario, renderApp } from '../../../test/helpers.tsx'

// The app fetches scenario files from its own site; here they come from disk.
function serveSeedFiles() {
  vi.stubGlobal('fetch', async (url: string) => {
    const name = String(url).split('/seed/')[1] ?? ''
    const body = readFileSync(
      join(process.cwd(), 'public', 'seed', name),
      'utf8',
    )
    return { ok: true, status: 200, json: async () => JSON.parse(body) }
  })
}

beforeEach(() => serveSeedFiles())
afterEach(() => vi.unstubAllGlobals())

const panel = () => screen.queryByRole('dialog', { name: 'Presenter tools' })

describe('presenter tools', () => {
  it('opens with Shift+D, focuses its heading and closes with Escape', async () => {
    const user = userEvent.setup()
    loadScenario('sleep-debt')
    renderApp('/')

    await user.keyboard('{Shift>}D{/Shift}')
    expect(panel()).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Presenter tools' }),
    ).toHaveFocus()
    expect(
      await screen.findByText('A solar particle event starts today'),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(panel()).not.toBeInTheDocument()
  })

  it('opens from the footer and gives focus back to it when closed', async () => {
    const user = userEvent.setup()
    loadScenario('sleep-debt')
    const { container } = renderApp('/')

    const opener = screen.getByRole('button', { name: 'Presenter tools' })
    await user.click(opener)
    expect(panel()).toBeInTheDocument()
    // The page behind cannot be used while the drawer is open.
    expect(container.querySelector('[inert]')).not.toBeNull()

    await user.click(
      screen.getByRole('button', { name: 'Close presenter tools' }),
    )
    expect(panel()).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('does not open while someone types into a field', async () => {
    const user = userEvent.setup()
    loadScenario('sleep-debt')
    renderApp('/check-in')

    await user.click(screen.getByLabelText(/Sleep last night/))
    await user.keyboard('{Shift>}D{/Shift}')
    expect(panel()).not.toBeInTheDocument()
  })

  it('loads a scenario, closes and shows Home', async () => {
    const user = userEvent.setup()
    loadScenario('sleep-debt')
    renderApp('/check-in')

    await user.click(screen.getByRole('button', { name: 'Presenter tools' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Presenter tools',
    })
    expect(
      within(dialog).getByText(/Day 142 · Mars transit vehicle · Loaded now/),
    ).toBeInTheDocument()
    await user.click(
      await within(dialog).findByRole('button', {
        name: 'Load scenario: A solar particle event starts today',
      }),
    )

    await waitFor(() => expect(panel()).not.toBeInTheDocument())
    expect(useAppStore.getState().mission.scenarioId).toBe('solar-storm')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'How you are doing today',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Solar particle event in progress' }),
    ).toBeInTheDocument()
  })
})

import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { routes } from '../../routes.tsx'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('app shell', () => {
  it('shows the not-a-medical-device notice and the simulated data tag', () => {
    renderAt('/')

    expect(
      screen.getByText(
        'Prototype for the NASA Space Apps Challenge. Not a medical device.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Simulated data')).toBeInTheDocument()
  })

  it('marks the current screen in the main navigation', () => {
    renderAt('/check-in')

    const nav = screen.getByRole('navigation', { name: 'Main' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Home',
      'Check-in',
      'Earth link',
    ])
    expect(within(nav).getByRole('link', { name: 'Check-in' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Check-in' }),
    ).toBeInTheDocument()
  })
})

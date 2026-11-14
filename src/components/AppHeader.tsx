import { Tag } from './Tag.tsx'

// Placeholders until the store exists (milestone M3 fills crew, day and
// environment; M4 adds the environment selector).
const missionFacts = ['Crew member', 'Mission day', 'Environment', 'Earth link']

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xl font-semibold">Crew Health Check</p>
          <Tag>Simulated data</Tag>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          {missionFacts.map((label) => (
            <div key={label}>
              <dt className="text-slate-600">{label}</dt>
              <dd className="font-medium">
                <span aria-hidden="true">—</span>
                <span className="sr-only">Not set yet</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  )
}

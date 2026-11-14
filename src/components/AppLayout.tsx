import { Outlet } from 'react-router'
import { useBootstrapScenario } from '../store/bootstrap.ts'
import { AppFooter } from './AppFooter.tsx'
import { AppHeader } from './AppHeader.tsx'
import { BottomNav } from './BottomNav.tsx'

function ScenarioGate() {
  const { status, retry } = useBootstrapScenario()
  if (status === 'ready') return <Outlet />
  if (status === 'loading') {
    return <p role="status">Loading the simulated scenario…</p>
  }
  return (
    <div role="alert" className="space-y-3">
      <p>The simulated scenario could not be loaded.</p>
      <button
        type="button"
        onClick={retry}
        className="min-h-11 rounded-lg border-2 border-slate-700 px-4 font-semibold"
      >
        Try again
      </button>
    </div>
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <ScenarioGate />
      </main>
      <AppFooter />
      <BottomNav />
    </div>
  )
}

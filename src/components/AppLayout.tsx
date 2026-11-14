import { Outlet } from 'react-router'
import { AppFooter } from './AppFooter.tsx'
import { AppHeader } from './AppHeader.tsx'
import { BottomNav } from './BottomNav.tsx'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <AppFooter />
      <BottomNav />
    </div>
  )
}

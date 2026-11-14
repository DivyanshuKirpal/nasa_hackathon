import type { RouteObject } from 'react-router'
import { AppLayout } from './components/AppLayout.tsx'
import { NotFoundPage } from './components/NotFoundPage.tsx'
import { AlertPage } from './features/alerts/AlertPage.tsx'
import { CheckinPage } from './features/checkin/CheckinPage.tsx'
import { EarthLinkPage } from './features/earthlink/EarthLinkPage.tsx'
import { HomePage } from './features/home/HomePage.tsx'

// Shared by the app's hash router and the tests' memory router.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'check-in', element: <CheckinPage /> },
      { path: 'alert/:alertKey', element: <AlertPage /> },
      { path: 'earth-link', element: <EarthLinkPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

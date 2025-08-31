import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import Header from '../components/Header.tsx'
import BottomNavigation from '../components/BottomNavigation.tsx'
import { PWAInstallButton } from '../components/PWAInstallButton.tsx'
import { ConnectionStatus } from '../components/ConnectionStatus.tsx'
import { OAuthDebugger } from '../components/OAuthDebugger.tsx'
import { AutoConnectionBanner, ConnectionBannerDemo } from '../components/ConnectionBanner.tsx'
import { MobileScrollDebugger } from '../components/MobileScrollDebugger.tsx'

import TanStackQueryLayout from '../integrations/tanstack-query/layout.tsx'
import { useGlobalMobileScroll } from '../hooks/useGlobalMobileScroll.ts'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    // ✅ Global mobile scroll functionality
    useGlobalMobileScroll()
    
    return (
      <>
        <Header />

        {/* ✅ Offline Authentication Banner */}
        <AutoConnectionBanner className="sticky top-0 z-50" />

        <main className="min-h-screen">
          <Outlet />
        </main>

        <BottomNavigation />
        
        <TanStackRouterDevtools />
        <TanStackQueryLayout />
        <PWAInstallButton />
        <ConnectionStatus />
        {import.meta.env.DEV && <OAuthDebugger />}
        {import.meta.env.DEV && <ConnectionBannerDemo />}
        {import.meta.env.DEV && <MobileScrollDebugger />}
      </>
    )
  },
})

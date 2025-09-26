import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import Header from '../components/Header.tsx'
import BottomNavigation from '../components/BottomNavigation.tsx'
import { PWAInstallButton } from '../components/PWAInstallButton.tsx'
import { ConnectionStatus } from '../components/ConnectionStatus.tsx'
import { AutoConnectionBanner, ConnectionBannerDemo } from '../components/ConnectionBanner.tsx'
import { ThemeProvider } from '../contexts/ThemeContext.tsx'

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
    
    // Detect callback route to skip heavy UI
    const isAuthCallback = globalThis.location?.pathname === '/auth/callback'
    
    return (
      <ThemeProvider defaultTheme="light" storageKey="pedidolist-theme">
        {!isAuthCallback && <Header />}

        {/* ✅ Offline Authentication Banner - placed below header height */}
        {!isAuthCallback && <AutoConnectionBanner className="sticky top-[64px] z-40" />}

        <main className="min-h-screen bg-background text-foreground">
          <Outlet />
        </main>

        {!isAuthCallback && <BottomNavigation />}
        
        {!isAuthCallback && <TanStackRouterDevtools />}
        {!isAuthCallback && <TanStackQueryLayout />}
        {!isAuthCallback && <PWAInstallButton />}
        {!isAuthCallback && <ConnectionStatus />}
        {import.meta.env.DEV && !isAuthCallback && <ConnectionBannerDemo />}
      </ThemeProvider>
    )
  },
})

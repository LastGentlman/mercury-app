import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import Header from '../components/Header'
import { PWAInstallButton } from '../components/PWAInstallButton'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { OAuthDebugger } from '../components/OAuthDebugger'

import TanStackQueryLayout from '../integrations/tanstack-query/layout.tsx'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Header />

      <Outlet />
      <TanStackRouterDevtools />

      <TanStackQueryLayout />
      <PWAInstallButton />
      <ConnectionStatus />
      {import.meta.env.DEV && <OAuthDebugger />}
    </>
  ),
})

import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import * as Sentry from "@sentry/react";
import { Toaster } from 'sonner'

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { GlobalLoadingProvider } from './components/GlobalLoadingProvider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'
import { listenForInstallPrompt, registerPWA } from './pwa-fixed.ts'

// Importar testing de seguridad en desarrollo
if (import.meta.env.DEV) {
  import('./utils/security-test.ts');
}

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProvider.getContext(),
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
// 🎯 Estrategia híbrida: DSN + environment check
const shouldInitSentry = import.meta.env.VITE_SENTRY_DSN && 
  (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY_DEV === 'true');

if (shouldInitSentry) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENVIRONMENT || "development",
    enabled: import.meta.env.VITE_ENVIROMENT === 'production',
    tracesSampleRate: import.meta.env.VITE_ENVIROMENT === 'production' ? 0.1 : 0.01,
    debug: import.meta.env.VITE_ENVIROMENT !== 'production',
    beforeSend(event) {
      if (!import.meta.env.PROD) {
        console.group('🐛 Sentry Error Captured');
        console.error('Error:', event.exception?.values?.[0]?.value);
        console.error('Stack:', event.exception?.values?.[0]?.stacktrace);
        console.groupEnd();
      }
      
      if (event.exception?.values?.[0]?.value?.includes('Non-Error promise rejection')) {
        return null;
      }
      
      return event;
    },
    initialScope: {
      tags: {
        component: "frontend",
        version: "1.0.0",
        buildMode: import.meta.env.MODE
      }
    },
  });
  
  console.log(`✅ Sentry initialized for ${import.meta.env.VITE_ENVIRONMENT}`);
} else {
  console.log("🚫 Sentry disabled");
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <GlobalLoadingProvider>
          <TanStackQueryProvider.Provider>
            <RouterProvider router={router} />
            <Toaster 
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </TanStackQueryProvider.Provider>
        </GlobalLoadingProvider>
      </AppErrorBoundary>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

// Only register PWA if not disabled
if (!import.meta.env.VITE_PWA_DISABLED) {
  registerPWA()
  listenForInstallPrompt()
} else {
  console.log('🚫 PWA disabled via environment variable')
}

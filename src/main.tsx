import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Dynamic import for Sentry to reduce initial bundle size
import { Toaster } from 'sonner'

import { routeTree } from './routeTree.gen.ts'
import './styles.css'

// ✅ Error Boundary para PWA
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'
import { GlobalLoadingProvider } from './components/GlobalLoadingProvider.tsx'

// ✅ Configuración de React Query optimizada para performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutos (reduced for faster updates)
      gcTime: 5 * 60 * 1000,   // 5 minutos (reduced cache time)
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: true, // Always refetch on mount for fresh data
      retry: (failureCount, error) => {
        // No retry para errores 4xx
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        return failureCount < 2
      }
    },
    mutations: {
      retry: 1
    }
  }
})

// ✅ Configuración del router
const router = createRouter({
  routeTree,
  context: {
    queryClient
  }
})

// ✅ TypeScript router types
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// ✅ Sentry initialization con control de errores y dynamic import
const shouldInitSentry = import.meta.env.VITE_SENTRY_DSN && 
  (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY_DEV === 'true')

async function initializeSentry() {
  if (!shouldInitSentry) {
    console.log("🚫 Sentry disabled")
    return
  }

  try {
    const Sentry = await import("@sentry/react")
    
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_ENVIRONMENT || "development",
      enabled: import.meta.env.VITE_ENVIROMENT === 'production',
      tracesSampleRate: import.meta.env.VITE_ENVIROMENT === 'production' ? 0.1 : 0.01,
      debug: import.meta.env.VITE_ENVIROMENT !== 'production',
      beforeSend(event) {
        if (!import.meta.env.PROD) {
          console.group('🐛 Sentry Error Captured')
          console.error('Error:', event.exception?.values?.[0]?.value)
          console.error('Stack:', event.exception?.values?.[0]?.stacktrace)
          console.groupEnd()
        }
        
        if (event.exception?.values?.[0]?.value?.includes('Non-Error promise rejection')) {
          return null
        }
        
        return event
      },
      initialScope: {
        tags: {
          component: "frontend",
          version: "1.0.0",
          buildMode: import.meta.env.MODE
        }
      },
    })
    
    console.log(`✅ Sentry initialized for ${import.meta.env.VITE_ENVIRONMENT}`)
  } catch (error) {
    console.warn('⚠️ Sentry initialization failed:', error)
  }
}

// ✅ PWA Registration con control de errores
async function initializePWA() {
  // Solo en producción y si no está deshabilitado
  if (
    import.meta.env.PROD && 
    !import.meta.env.VITE_PWA_DISABLED &&
    'serviceWorker' in navigator
  ) {
    try {
      console.log('🔄 Initializing PWA...')
      
      // Importación dinámica para evitar problemas en development
      const { registerPWA, listenForInstallPrompt } = await import('./pwa.ts')
      
      // Registrar PWA con timeout
      const registration = await Promise.race([
        registerPWA(),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('PWA registration timeout')), 10000)
        )
      ])
      
      if (registration) {
        console.log('✅ PWA registered successfully')
        listenForInstallPrompt()
      }
      
    } catch (error) {
      console.warn('⚠️ PWA registration failed, continuing without PWA:', error)
      // La app continúa funcionando sin PWA
    }
  } else {
    console.log('🚫 PWA disabled or not supported')
    // ✅ Auto-unregister any previously installed Service Workers when PWA is disabled
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        if (registrations.length > 0) {
          for (const registration of registrations) {
            await registration.unregister()
          }
          // Also clear caches to prevent stale assets when SW is removed
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map((name) => caches.delete(name)))
          }
          console.log('🧹 Unregistered existing Service Workers and cleared caches')
        }
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup Service Workers/caches:', cleanupError)
    }
  }
}

// ✅ Función principal de inicialización
function initializeApp() {
  const rootElement = document.getElementById('app')
  
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  // ✅ Verificar que React está disponible
  if (!React) {
    throw new Error('React is not loaded properly')
  }

  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <GlobalLoadingProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster 
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </QueryClientProvider>
        </GlobalLoadingProvider>
      </AppErrorBoundary>
    </StrictMode>
  )

  // Inicializar servicios después de que React esté montado
  setTimeout(() => {
    initializeSentry()
    initializePWA()
  }, 1000)
}

// ✅ Inicialización segura
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true })
  } else {
    initializeApp()
  }
} catch (error) {
  console.error('❌ App initialization failed:', error)
  
  // Fallback básico sin PWA
  const rootElement = document.getElementById('app')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui;">
        <h1>Error de inicialización</h1>
        <p>La aplicación no pudo iniciarse correctamente.</p>
        <button onclick="window.location.reload()">Recargar página</button>
      </div>
    `
  }
}

// ✅ Hot Module Replacement para desarrollo
if (import.meta.hot) {
  import.meta.hot.accept()
}

// Security testing removed for production

import reportWebVitals from './reportWebVitals.ts'
reportWebVitals()

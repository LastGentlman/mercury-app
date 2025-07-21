import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ 
      autoCodeSplitting: true,
      // ✅ FIX: Configuración más estricta del code splitting
      generatedRouteTree: './src/routeTree.gen.ts'
    }),
    viteReact(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // ✅ FIX: Deshabilitar devOptions que pueden causar problemas
      devOptions: {
        enabled: false // Importante: deshabilitar en desarrollo
      },
      workbox: {
        // ✅ FIX CRÍTICO: Patrones más específicos que excluyen archivos problemáticos
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
          // Excluir explícitamente archivos de TanStack Router con tsr-split
          '!**/*tsr-split*',
          '!**/api-test*',
          '!**/component-*.js'
        ],
        
        // ✅ FIX: Exclusiones más específicas
        globIgnores: [
          '**/node_modules/**/*',
          '**/dev-dist/**/*',
          '**/*tsr-split*',
          '**/api-test*',
          '**/component-*.js',
          '**/*.map',
          '**/test/**/*',
          '**/tests/**/*'
        ],
        
        // ✅ FIX: Configuración de navegación más robusta
        navigateFallback: '/',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/_/,
          /^\/dev-dist\//,
          /^\/node_modules\//,
          // Excluir rutas de test y debug
          /^\/api-test/,
          /\.map$/
        ],
        
        // ✅ FIX: Tamaño máximo ajustado para chunks grandes pero necesarios
        maximumFileSizeToCacheInBytes: 4000000, // 4MB max
        
        // ✅ FIX: Estrategias de caching más robustas
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ],
        
        // ✅ FIX: Configuración más robusta de manifestTransforms
        manifestTransforms: [
          (manifestEntries) => {
            // Filtrar entradas problemáticas
            const filteredManifest = manifestEntries.filter((entry) => {
              // Excluir archivos con patrones problemáticos
              return !entry.url.includes('tsr-split') && 
                     !entry.url.includes('api-test') &&
                     !entry.url.includes('component-') &&
                     !entry.url.endsWith('.map') &&
                     !entry.url.includes('?') // Excluir URLs con query params
            })
            
            console.log('🔧 PWA Manifest filtered:', {
              original: manifestEntries.length,
              filtered: filteredManifest.length,
              excluded: manifestEntries.length - filteredManifest.length
            })
            
            return { manifest: filteredManifest }
          }
        ],
        
        // ✅ FIX: Modo de depuración para development
        mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
        
        // ✅ FIX: Configuración adicional de limpieza
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      
      // ✅ FIX: Configuración de manifest más robusta
      manifest: {
        name: 'PedidoList - Gestión de Pedidos',
        short_name: 'PedidoList',
        description: 'Aplicación para gestión de pedidos offline-first',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // ✅ FIX: Manual chunking más específico y estable
        manualChunks: (id) => {
          // Vendor chunks más específicos para evitar chunks gigantes
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('@tanstack/react-router')) {
              return 'router-vendor'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor'
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'ui-vendor'
            }
            // Dividir vendor en chunks más pequeños
            if (id.includes('@tanstack/') || id.includes('tanstack')) {
              return 'tanstack-vendor'
            }
            if (id.includes('tailwind') || id.includes('clsx') || id.includes('class-variance')) {
              return 'styles-vendor'
            }
            if (id.includes('dompurify') || id.includes('zod') || id.includes('@hookform')) {
              return 'utils-vendor'
            }
            // Resto de dependencias en vendor más pequeño
            return 'vendor'
          }
          
          // ✅ FIX: Manejo especial para archivos de rutas
          if (id.includes('/routes/')) {
            // Evitar chunking de api-test para prevenir el error
            if (id.includes('api-test')) {
              return 'api-test-route'
            }
            if (id.includes('demo.')) {
              return 'demo-routes'
            }
            return 'routes'
          }
          
          // Utils y helpers
          if (id.includes('/utils/') || id.includes('/hooks/')) {
            return 'utils'
          }
          
          // Componentes UI
          if (id.includes('/components/')) {
            return 'components'
          }
        },
        
        // ✅ FIX: Nombres de archivos más predecibles
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name || 'chunk'
          // Evitar caracteres especiales en nombres de archivo
          const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '-')
          return `assets/${safeName}-[hash].js`
        },
        
        entryFileNames: 'assets/entry-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    target: 'esnext',
    sourcemap: process.env.NODE_ENV === 'development',
    assetsInlineLimit: 4096,
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      '@tanstack/react-query',
      'lucide-react'
    ],
    exclude: [
      '@tanstack/react-router-devtools',
      '@tanstack/react-query-devtools'
    ]
  },
  
  server: {
    allowedHosts: ['.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:3030',
        changeOrigin: true,
        secure: false,
      },
    },
    port: 3000,
    host: true,
    strictPort: true,
    hmr: {
      overlay: false
    }
  },
  
  preview: {
    port: 4173,
    host: true,
    strictPort: true
  },
  
  css: {
    devSourcemap: process.env.NODE_ENV === 'development'
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import process from 'node:process'
// Remove Tailwind v4 import

const isDev = process.env.NODE_ENV === 'development'
const isPWADisabled = process.env.VITE_PWA_DISABLED === 'true'

export default defineConfig({
  plugins: [
    // ✅ TanStack Router con configuración estable
    tanstackRouter({ 
      autoCodeSplitting: true,
      generatedRouteTree: './src/routeTree.gen.ts',
      // Configure chunk naming to match our descriptive naming
      routeFileIgnorePrefix: '-',
      routesDirectory: './src/routes'
    }),
    
    // ✅ React plugin con configuración explícita
    react({
      include: /\.(tsx|ts|jsx|js)$/,
      exclude: /node_modules/,
      jsxImportSource: 'react'
    }),
    
    // ✅ Tailwind CSS v3 (via PostCSS)
    
    // ✅ PWA SOLO en producción y cuando no esté deshabilitado
    !isDev && !isPWADisabled && VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
      workbox: {
        // ✅ Patrones seguros para el precaching
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp}',
          '!**/*.map',
          '!**/node_modules/**',
          '!**/tests/**',
          '!**/test-*/**',
          '!**/mock*/**'
        ],
        
        // ✅ Fix: Ensure index.html is properly precached
        additionalManifestEntries: [
          { url: '/index.html', revision: null }
        ],
        
        // ✅ Configuración de runtime caching simplificada
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hora
              }
            }
          }
        ],
        
        // ✅ Configuración de archivos a ignorar
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/api\//],
        
        // ✅ Limpieza de caches obsoletos
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      
      // ✅ Manifest simplificado y seguro
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
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      
      // ✅ Desarrollo sin interferencias
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })
  ].filter(Boolean), // Filtrar plugins undefined

  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('./src', import.meta.url)))
    }
  },

  // ✅ Configuración optimizada para React
  esbuild: {
    jsx: 'automatic',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    jsxImportSource: 'react'
  },

  // ✅ Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime'
    ],
    exclude: []
  },

  // ✅ Configuración de build optimizada
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    
    rollupOptions: {
      output: {
        // ✅ Descriptive naming without unnecessary hashes
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name || 'chunk'
          
          // Skip test and demo files
          if (name.includes('test') || name.includes('demo') || name.includes('api-test')) {
            return `assets/${name}.js`
          }
          
          // Map chunk names to descriptive names
          if (name.includes('index') || name.includes('root')) {
            return 'assets/root.js'
          }
          if (name.includes('dashboard')) {
            return 'assets/dashboard.js'
          }
          if (name.includes('auth')) {
            return 'assets/auth.js'
          }
          if (name.includes('clients')) {
            return 'assets/clients.js'
          }
          if (name.includes('products')) {
            return 'assets/products.js'
          }
          if (name.includes('profile')) {
            return 'assets/profile.js'
          }
          if (name.includes('setup')) {
            return 'assets/setup.js'
          }
          if (name.includes('paywall')) {
            return 'assets/paywall.js'
          }
          if (name.includes('design-system')) {
            return 'assets/design-system.js'
          }
          if (name.includes('extend-trial')) {
            return 'assets/extend-trial.js'
          }
          
          // For other chunks, use descriptive name without hash
          const cleanName = name.replace(/index/g, 'app').replace(/[^a-zA-Z0-9-]/g, '-')
          return `assets/${cleanName}.js`
        },
        entryFileNames: 'assets/app.js',
        assetFileNames: (assetInfo) => {
          // Only add hash for assets that might change frequently
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].[ext]'
          }
          return 'assets/[name].[ext]'
        },
        
        // ✅ Separación de vendors para mejor caching
        manualChunks: {
          'react': ['react', 'react-dom'],
          'router': ['@tanstack/react-router'],
          'query': ['@tanstack/react-query']
        }
      }
    }
  },

  // ✅ Configuración del servidor de desarrollo
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

  // ✅ Preview server para testing PWA
  preview: {
    port: 4173,
    host: true
  },

  // ✅ Variables de entorno tipadas
  define: {
    __DEV__: isDev
  }
})

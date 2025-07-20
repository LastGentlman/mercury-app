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
    tanstackRouter({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // ✅ Optimización PWA: Excluir archivos grandes del cache
        navigateFallbackDenylist: [/^\/api\//, /^\/_/],
        maximumFileSizeToCacheInBytes: 3000000, // 3MB max por archivo
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
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
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
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
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hora
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          }
        ]
      },
      includeAssets: [
        'favicon.ico',
        'logo192.png',
        'logo512.png',
        'apple-touch-icon.png',
        'mask-icon.svg',
        'screenshot-wide.png',
        'screenshot-narrow.png'
      ],
      manifest: {
        name: 'Mercury App',
        short_name: 'Mercury',
        description: 'A modern web application built with React and TanStack Router',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Nuevo Pedido',
            url: '/orders/new',
            description: 'Crear pedido rápidamente',
            icons: [{ src: 'logo192.png', sizes: '192x192' }]
          },
          {
            name: 'Pedidos Hoy',
            url: '/orders/today',
            description: 'Ver pedidos del día',
            icons: [{ src: 'logo192.png', sizes: '192x192' }]
          }
        ],
        screenshots: [
          {
            src: 'screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow'
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
    // ✅ OPTIMIZACIÓN: Code Splitting y Bundle Size
    rollupOptions: {
      output: {
        // Manual chunking para mejores cargas
        manualChunks: {
          // Vendor chunks separados
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['@tanstack/react-router', '@tanstack/react-router-devtools'],
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-label'],
          
          // Feature-based chunks
          'forms': ['@tanstack/react-form', 'react-hook-form', '@hookform/resolvers'],
          'table-charts': ['@tanstack/react-table'],
          'store': ['@tanstack/react-store', '@tanstack/store'],
          
          // Utils y helpers
          'utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
          'validation': ['zod'],
          'security': ['dompurify'],
          
          // Separate large demo components
          'demo-components': [
            './src/routes/demo.table.tsx',
            './src/routes/demo.form.simple.tsx',
            './src/routes/demo.form.address.tsx',
            './src/routes/design-system.tsx',
            './src/routes/enhanced-design-system-demo.tsx',
            './src/routes/pwa-demo-page.tsx'
          ]
        },
        
        // ✅ Nombres de chunk más descriptivos
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') : 
            'chunk'
          return `assets/${facadeModuleId}-[hash].js`
        },
        
        // ✅ Límite de tamaño de warning más alto para chunks específicos
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // ✅ Configuración de chunk size optimizada
    chunkSizeWarningLimit: 600, // Aumentar de 500KB a 600KB
    
    // ✅ Optimización de minificación
    minify: 'esbuild',
    target: 'esnext',
    
    // ✅ Source maps solo en desarrollo
    sourcemap: process.env.NODE_ENV === 'development',
    
    // ✅ Optimización de assets
    assetsInlineLimit: 4096, // 4KB limit para inline assets
  },
  
  // ✅ Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      '@tanstack/react-query',
      'lucide-react'
    ],
    exclude: [
      // Excluir componentes de demo del pre-bundling
      '@tanstack/react-router-devtools',
      '@tanstack/react-query-devtools'
    ]
  },
  
  // ✅ Configuración del servidor de desarrollo
  server: {
    allowedHosts: [
      '.ngrok-free.app', // permite cualquier subdominio de ngrok (solo string, no RegExp)
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3030',
        changeOrigin: true,
        secure: false,
      },
    },
    port: 3000,
    host: true, // Para acceso desde otros dispositivos
    strictPort: true,
    hmr: {
      overlay: false // Deshabilitar overlay de errores en dev
    }
  },
  
  // ✅ Preview configuration
  preview: {
    port: 4173,
    host: true,
    strictPort: true
  },
  
  // ✅ CSS optimization
  css: {
    devSourcemap: process.env.NODE_ENV === 'development'
  }
})

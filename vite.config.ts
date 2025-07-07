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
  },
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
    },
  },
})

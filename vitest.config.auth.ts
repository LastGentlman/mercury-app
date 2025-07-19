import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/hooks/setup-auth.ts'], // ✅ Setup específico para useAuth
    globals: true,
    css: true,
    include: ['tests/hooks/useAuth.test.tsx'], // ✅ Solo useAuth
    testTimeout: 15000,
    reporters: ['verbose'],
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    isolate: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './'),
    },
  },
  esbuild: {
    target: 'node14'
  }
}) 
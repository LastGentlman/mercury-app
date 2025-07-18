import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup-unified.ts'], // ✅ Usar el nuevo setup unificado
    globals: true,
    css: true,
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules', 
      'dist', 
      '.idea', 
      '.git', 
      '.cache',
      'tests/hooks/useAuth.test.tsx' // ✅ Excluir useAuth de setup unificado
    ],
    testTimeout: 15000, // ✅ Aumentar timeout para debugging
    reporters: ['verbose'],
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    // ✅ Configuración adicional para debugging
    logHeapUsage: true,
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
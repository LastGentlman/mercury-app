import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // Increased timeout for PWA tests
    testTimeout: 10000,
    // Better error reporting
    reporters: ['verbose'],
    // Mock file patterns
    mockReset: true,
    clearMocks: true,
    restoreMocks: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Ensure consistent module resolution
      '~': path.resolve(__dirname, './'),
    },
  },
  // Optimize for testing
  esbuild: {
    target: 'node14'
  }
}) 
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [
    react({
      include: /\.(tsx|ts|jsx|js)$/
    })
  ],
  
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup-unified.ts'],
    globals: true,
    css: false,
    
    // ✅ Configuración de paths para tests
    alias: {
      '@': resolve(fileURLToPath(new URL('./src', import.meta.url)))
    },
    
    // ✅ Mock automático de módulos problemáticos
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // ✅ Timeouts razonables
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // ✅ Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '*.config.ts',
        '*.config.js',
        'public/',
        'src/routeTree.gen.ts'
      ]
    }
  },

  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('./src', import.meta.url)))
    }
  }
}) 
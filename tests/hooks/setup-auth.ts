import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'

// ✅ MSW Server para tests de useAuth
export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

// ✅ NO MOCKEAR useAuth - usar el hook real con MSW
// ✅ Solo mockear localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true
})

// ✅ Mock global de fetch SOLO si es necesario
global.fetch = global.fetch || vi.fn()

// ✅ Mock de navegación
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    navigate: vi.fn(),
    state: { location: { pathname: '/' } }
  })
}))

// ✅ NO MOCKEAR React Query - usar el real para tests de integración

// ✅ Mock de Sentry
vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
  addBreadcrumb: vi.fn()
}))

// ✅ Mock de utils de seguridad
vi.mock('../../src/utils/security', () => ({
  validateCSRFToken: vi.fn().mockReturnValue(true),
  generateCSRFToken: vi.fn().mockReturnValue('mock-csrf-token'),
  sanitizeInput: vi.fn((input) => input)
}))

// ✅ Mock de logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
})) 
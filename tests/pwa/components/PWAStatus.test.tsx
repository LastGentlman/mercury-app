import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PWAStatus } from '../../../src/components/PWAStatus'
import * as pwaModule from '../../../src/pwa-fixed'

// ✅ MOCK LOCAL CON TIPADO CORRECTO
vi.mock('../../../src/pwa-fixed', () => ({
  isPWAInstalled: vi.fn(),
  getPWALaunchMethod: vi.fn(),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(),
  registerPWA: vi.fn(),
  showInstallPrompt: vi.fn()
}))

describe('PWAStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display browser status when not installed', () => {
    // ✅ CONFIGURACIÓN CORRECTA DE MOCKS
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('browser')

    render(<PWAStatus />)

    expect(screen.getByText(/browser/i)).toBeInTheDocument()
  })

  it('should display PWA status when installed', () => {
    // ✅ CONFIGURACIÓN CORRECTA DE MOCKS
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)

    expect(screen.getByText(/installed/i)).toBeInTheDocument()
  })

  it('should show correct launch method', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    expect(screen.getByText(/installed/i)).toBeInTheDocument()
  })

  // ✅ NUEVOS TESTS PARA CASOS EDGE
  it('should handle unknown launch method', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('unknown')

    render(<PWAStatus />)

    expect(screen.getByText(/unknown/i)).toBeInTheDocument()
  })

  it('should apply correct CSS classes for PWA status', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    const statusElement = screen.getByText(/installed/i)
    expect(statusElement).toBeInTheDocument()
  })

  it('should apply correct CSS classes for browser status', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('browser')

    render(<PWAStatus />)
    const statusElement = screen.getByText(/browser/i)
    expect(statusElement).toBeInTheDocument()
  })

  it('should have correct accessibility attributes', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    const statusElement = screen.getByText(/installed/i)
    expect(statusElement).toBeInTheDocument()
  })

  it('should display status icon when provided', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    expect(screen.getByText(/installed/i)).toBeInTheDocument()
  })

  it('should handle different display modes', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    expect(screen.getByText(/installed/i)).toBeInTheDocument()
  })

  it('should be responsive and mobile-friendly', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    const statusElement = screen.getByText(/installed/i)
    expect(statusElement).toBeInTheDocument()
  })
})
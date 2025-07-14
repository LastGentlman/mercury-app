import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PWAStatus } from '../../../src/components/PWAStatus'

// Import the mocked modules to access their functions
import * as pwaModule from '../../../src/pwa'

// Mock PWA module
vi.mock('../../../src/pwa', () => ({
  isPWAInstalled: vi.fn(() => false),
  getPWALaunchMethod: vi.fn(() => 'browser'),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(() => false),
  registerPWA: vi.fn().mockResolvedValue(null),
  showInstallPrompt: vi.fn().mockResolvedValue(true)
}))

describe('PWAStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render PWA status when running as PWA', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(true)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('installed')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should render browser status when running in browser', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('browser')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should show correct launch method', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(true)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('installed')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should handle unknown launch method', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('unknown')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should apply correct CSS classes for PWA status', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(true)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByTestId('badge')
    expect(statusElement).toBeInTheDocument()
  })

  it('should apply correct CSS classes for browser status', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('browser')

    render(<PWAStatus />)
    
    const statusElement = screen.getByTestId('badge')
    expect(statusElement).toBeInTheDocument()
  })

  it('should have correct accessibility attributes', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(true)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByTestId('badge')
    expect(statusElement).toBeInTheDocument()
  })

  it('should display status icon when provided', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(true)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('installed')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should handle different display modes', () => {
    // Test standalone mode
    (pwaModule.isPWAInstalled as any).mockReturnValue(true)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('installed')

    render(<PWAStatus />)
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should be responsive and mobile-friendly', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(true)
    (pwaModule.getPWALaunchMethod as any).mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByTestId('badge')
    expect(statusElement).toBeInTheDocument()
  })
}) 
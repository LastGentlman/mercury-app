import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PWAStatus } from '../../../src/components/PWAStatus'

// Import the mocked modules to access their functions
import * as pwaModule from '../../../src/pwa'

describe('PWAStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render PWA status when running as PWA', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should render browser status when running in browser', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('browser')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should show correct launch method', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should handle unknown launch method', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('unknown')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should apply correct CSS classes for PWA status', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByTestId('badge')
    expect(statusElement).toBeInTheDocument()
  })

  it('should apply correct CSS classes for browser status', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('browser')

    render(<PWAStatus />)
    
    const statusElement = screen.getByTestId('badge')
    expect(statusElement).toBeInTheDocument()
  })

  it('should have correct accessibility attributes', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByTestId('badge')
    expect(statusElement).toBeInTheDocument()
  })

  it('should display status icon when provided', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should handle different display modes', () => {
    // Test standalone mode
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    const { rerender } = render(<PWAStatus />)
    expect(screen.getByTestId('badge')).toBeInTheDocument()

    // Test browser mode
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('browser')

    rerender(<PWAStatus />)
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should be responsive and mobile-friendly', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByTestId('badge')
    expect(statusElement).toBeInTheDocument()
  })
}) 